"""Wordbook Service"""
from functools import lru_cache

from config import Config
from .repository import WordRepository, UserWordStatusRepository, UserRepository


def _get_genai():
    """google.generativeai를 lazy import (Python 3.14 호환성 문제 우회)"""
    try:
        import google.generativeai as genai
        return genai
    except Exception:
        return None


@lru_cache(maxsize=1)
def _probe_gemini_api_key(api_key):
    if not api_key:
        return {
            "configured": False,
            "valid": False,
            "message": "Gemini API 키가 설정되지 않았습니다.",
        }

    genai = _get_genai()
    if genai is None:
        return {
            "configured": False,
            "valid": False,
            "message": "google-generativeai 패키지를 불러올 수 없습니다.",
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content('Reply with OK.')
        generated = (getattr(response, 'text', '') or '').strip()

        return {
            "configured": True,
            "valid": True,
            "message": 'Gemini API 키가 유효합니다.' if generated else 'Gemini API 키가 유효합니다.',
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
        genai = _get_genai()
        if genai is None:
            return WordService._build_fallback_example(term, definition)
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.5-flash')
            prompt = (
                f'Write one natural English example sentence using the word "{term}" '
                f'(Korean meaning: {definition}). '
                f'Output only the sentence, nothing else.'
            )
            response = model.generate_content(prompt)
            generated = (getattr(response, 'text', '') or '').strip()
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
    def get_words(user_id, page, per_page, sort, start_date, end_date, keyword):
        pagination = WordRepository.get_words_paginated(
            user_id=user_id,
            page=page,
            per_page=per_page,
            sort=sort,
            start_date=start_date,
            end_date=end_date,
            keyword=keyword,
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

        return WordRepository.create(term=term, definition=definition, example=example)

    @staticmethod
    def update_word(word_id, data):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

        term, definition, example = WordService._normalize_word_payload(data)
        if not example:
            example = WordService._generate_example_with_gemini(term or word["word_english"], definition or word["word_korean"])

        return WordRepository.update(
            word_id=word_id,
            term=term,
            definition=definition,
            example=example,
        )

    @staticmethod
    def delete_word(word_id):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

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