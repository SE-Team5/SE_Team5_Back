"""Wordbook Service"""
from functools import lru_cache
import json
import re

from config import Config
from .repository import WordRepository, UserWordStatusRepository, UserRepository


def _get_genai():
    """Gemini client를 lazy import (Python 3.14 호환성 문제 우회)"""
    try:
        from google import genai
        return "new", genai
    except Exception:
        try:
            import google.generativeai as genai
            return "legacy", genai
        except Exception:
            return None, None


def _generate_gemini_text(api_key, prompt):
    client_type, genai = _get_genai()
    if client_type is None or genai is None:
        return None

    if client_type == "new":
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return (getattr(response, 'text', '') or '').strip()

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(prompt)
    return (getattr(response, 'text', '') or '').strip()


@lru_cache(maxsize=1)
def _probe_gemini_api_key(api_key):
    if not api_key:
        return {
            "configured": False,
            "valid": False,
            "message": "Gemini API 키가 설정되지 않았습니다.",
        }

    client_type, genai = _get_genai()
    if client_type is None or genai is None:
        return {
            "configured": False,
            "valid": False,
            "message": "Gemini 클라이언트를 불러올 수 없습니다.",
        }

    try:
        generated = _generate_gemini_text(api_key, 'Reply with OK.')

        return {
            "configured": True,
            "valid": bool(generated),
            "message": 'Gemini API 키가 유효합니다.' if generated else 'Gemini API 키는 설정되었지만 응답 확인에 실패했습니다.',
        }
    except Exception:
        return {
            "configured": True,
            "valid": False,
            "message": 'Gemini API 키가 유효하지 않습니다.',
        }


class WordService:
    @staticmethod
    def _build_fallback_example(term, definition):
        safe_term = term.strip()
        return f'I used the word "{safe_term}" in a sentence today.'

    @staticmethod
    def _generate_example_with_gemini(term, definition):
        """Gemini API를 이용해 영어 예문을 자동 생성. 실패 시 None 반환."""
        api_key = Config.GEMINI_API_KEY
        if not api_key:
            return WordService._build_fallback_example(term, definition)
        client_type, genai = _get_genai()
        if client_type is None or genai is None:
            return WordService._build_fallback_example(term, definition)
        try:
            prompt = (
                f'Write one natural English example sentence using the word "{term}" '
                f'(Korean meaning: {definition}). '
                f'Output only the sentence, nothing else.'
            )
            generated = _generate_gemini_text(api_key, prompt)
            if generated:
                return generated

            print('[WARN] Gemini returned an empty example. Using fallback example.')
        except Exception as e:
            print(f"Gemini API 예문 생성 실패: {e}")

        return WordService._build_fallback_example(term, definition)

    @staticmethod
    def get_gemini_status():
        return _probe_gemini_api_key(Config.GEMINI_API_KEY)

    @staticmethod
    def _normalize_word_payload(data):
        term = data.get("term") or data.get("english") or data.get("word_english")
        definition = data.get("definition") or data.get("korean") or data.get("word_korean")
        example = data.get("example") or data.get("example_sentence")
        return term, definition, example

    @staticmethod
    def _extract_json_payload(text: str) -> dict | list | None:
        if not text:
            return None

        cleaned = text.strip()
        cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()

        try:
            return json.loads(cleaned)
        except Exception:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    return None
        return None

    @staticmethod
    def _normalize_relation_rows(raw_relations) -> list[dict]:
        if not raw_relations:
            return []

        priority = {"synonym": 0, "homonym": 1, "antonym": 2}
        normalized: dict[int, tuple[str, int]] = {}

        for item in raw_relations:
            if not isinstance(item, dict):
                continue

            try:
                related_word_id = int(item.get("word_id") or item.get("related_word_no") or item.get("id"))
            except Exception:
                continue

            relation_type = str(item.get("relation_type") or "").strip().lower()
            if relation_type not in priority:
                continue

            current = normalized.get(related_word_id)
            if current is None or priority[relation_type] < priority[current[0]]:
                normalized[related_word_id] = (relation_type, priority[relation_type])

        return [
            {"word_id": word_id, "relation_type": relation_type}
            for word_id, (relation_type, _) in normalized.items()
        ]

    @staticmethod
    def _generate_relations_with_gemini(word_id: int, term: str, definition: str, example: str | None):
        api_key = Config.GEMINI_API_KEY
        if not api_key:
            return []

        client_type, genai = _get_genai()
        if client_type is None or genai is None:
            return []

        candidates = WordRepository.get_relation_candidates(exclude_word_id=word_id)
        if not candidates:
            return []

        candidate_lines = []
        for candidate in candidates:
            example_text = candidate.get("example") or ""
            candidate_lines.append(
                f"- id: {candidate['id']}, english: {candidate['english']}, korean: {candidate['korean']}, example: {example_text}"
            )

        prompt = (
            "You are classifying relations between a target vocabulary word and existing words in a database. "
            "Return only valid JSON in the exact shape: {\"relations\":[{\"word_id\":123,\"relation_type\":\"synonym\"}]}\n"
            "Rules:\n"
            "- Use only word_id values from the candidate list.\n"
            "- relation_type must be one of synonym, antonym, homonym.\n"
            "- Treat synonym and 유의어 as the same bucket. Never emit both for the same related word.\n"
            "- Emit at most one relation row per related word. If multiple relation types seem possible, choose only the single most fitting one.\n"
            "- If a candidate feels both like a synonym and a looser similar word, keep it as synonym.\n"
            "- Prefer a small, high-confidence set. Return at most 6 relations.\n"
            "- Do not include explanations or markdown.\n\n"
            f"Target word:\n- id: {word_id}\n- english: {term}\n- korean: {definition}\n- example: {example or ''}\n\n"
            "Candidate words:\n"
            + "\n".join(candidate_lines)
        )

        try:
            generated = _generate_gemini_text(api_key, prompt)
            payload = WordService._extract_json_payload(generated)
            if isinstance(payload, dict):
                relations = payload.get("relations")
                if isinstance(relations, list):
                    return WordService._normalize_relation_rows(relations)
        except Exception as e:
            print(f"Gemini relation generation failed: {e}")

        return []

    @staticmethod
    def _sync_word_relations(word_id: int, term: str, definition: str, example: str | None):
        relations = WordService._generate_relations_with_gemini(word_id, term, definition, example)
        if not relations:
            WordRepository.delete_relations_by_word(word_id)
            return 0

        return WordRepository.replace_word_relations(word_id, relations)

    @staticmethod
    def get_words(user_id, page, per_page, sort, filter_type, start_date, end_date, keyword, search_field):
        pagination = WordRepository.get_words_paginated(
            user_id=user_id,
            page=page,
            per_page=per_page,
            sort=sort,
            filter_type=filter_type,
            keyword=keyword,
            search_field=search_field,
        )

        return {
            "total": pagination["total"],
            "page": page,
            "per_page": per_page,
            "pages": pagination["pages"],
            "items": pagination["items"],
        }

    @staticmethod
    def create_word(data):
        term, definition, example = WordService._normalize_word_payload(data)

        if not term or not definition:
            return {"message": "term과 definition은 필수입니다."}

        existing = WordRepository.find_by_term(term=term)
        if existing:
            return {"message": "이미 동일한 단어가 존재합니다."}

        if not example:
            example = WordService._generate_example_with_gemini(term, definition)

        created_word = WordRepository.create(term=term, definition=definition, example=example)
        try:
            WordService._sync_word_relations(
                int(created_word["id"]),
                created_word["term"],
                created_word["definition"],
                created_word.get("example"),
            )
        except Exception as e:
            print(f"Failed to sync word relations on create: {e}")

        return created_word

    @staticmethod
    def update_word(word_id, data):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

        term, definition, example = WordService._normalize_word_payload(data)
        if not example:
            example = WordService._generate_example_with_gemini(term or word["word_english"], definition or word["word_korean"])

        updated_word = WordRepository.update(
            word_id=word_id,
            term=term,
            definition=definition,
            example=example,
        )

        try:
            WordService._sync_word_relations(
                int(word_id),
                updated_word["term"],
                updated_word["definition"],
                updated_word.get("example"),
            )
        except Exception as e:
            print(f"Failed to sync word relations on update: {e}")

        return updated_word

    @staticmethod
    def delete_word(word_id):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

        WordRepository.delete_relations_involving_word(word_id=word_id)
        WordRepository.delete(word_id=word_id)
        return {"status": "success", "message": "삭제되었습니다."}

    @staticmethod
    def get_daily_random_words(user_id=None, limit=10):
        words = WordRepository.get_daily_words(user_id=user_id, limit=limit)
        return {"daily_target_count": len(words), "items": words}

    @staticmethod
    def update_word_status(user_id, word_id, data):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

        return UserWordStatusRepository.find_or_create_and_update(
            user_id=user_id,
            word_id=word_id,
            is_memorized=data.get("is_memorized"),
            is_bookmarked=data.get("is_bookmarked"),
        )

    @staticmethod
    def batch_update_study_records(user_id, word_ids):
        valid_ids = WordRepository.filter_existing_word_ids(word_ids=word_ids)
        invalid_ids = set(word_ids) - set(valid_ids)

        if invalid_ids:
            return {"message": f"존재하지 않는 단어가 포함되어 있습니다: {list(invalid_ids)}"}

        updated_count = UserWordStatusRepository.batch_update_study_records(
            user_id=user_id,
            word_ids=valid_ids,
        )

        return {
            "updated_count": updated_count,
        }