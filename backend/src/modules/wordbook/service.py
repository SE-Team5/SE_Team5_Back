"""Wordbook Service"""
from math import ceil
from .repository import WordRepository, UserWordStatusRepository, UserRepository
from db import db
from functools import lru_cache
import google.generativeai as genai
from config import Config

@lru_cache(maxsize=1)
def _probe_gemini_api_key(api_key):
    if not api_key:
        return {
            "configured": False,
            "valid": False,
            "message": "Gemini API 키가 설정되지 않았습니다.",
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
        # 신규 컬럼(synonyms, antonyms) 추가
        term = data.get("term") or data.get("english") or data.get("word_english")
        definition = data.get("definition") or data.get("korean") or data.get("word_korean")
        example = data.get("example") or data.get("example_sentence")
        synonyms = data.get("synonyms")
        antonyms = data.get("antonyms")
        return term, definition, example, synonyms, antonyms

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
        term, definition, example, synonyms, antonyms = WordService._normalize_word_payload(data)

        if not term or not definition:
            return {"message": "term과 definition은 필수입니다."}

        existing = WordRepository.find_by_term(term=term)
        if existing:
            return {"message": "이미 동일한 단어가 존재합니다."}

        return WordRepository.create(term=term, definition=definition, example=example, synonyms=synonyms, antonyms=antonyms)

    @staticmethod
    def update_word(word_id, data):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

        term, definition, example, synonyms, antonyms = WordService._normalize_word_payload(data)
        return WordRepository.update(
            word_id=word_id,
            term=term,
            definition=definition,
            example=example,
            synonyms=synonyms,
            antonyms=antonyms
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
        words = WordRepository.get_random_words(limit=limit)
        return {"daily_target_count": limit, "items": words}

    @staticmethod
    def update_word_status(user_id, word_id, data):
        """기존 Day 단어장 등에서 사용하는 상태 업데이트 로직 유지"""
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

    # 메인 단어장 전용 API 서비스 로직
    @classmethod
    def get_main_wordbook_list(cls, user_id, page, size, date_filter, status_filter, sort):
        import math
        
        safe_user_id = user_id if user_id is not None else -1
        
        # 1. 이미 완벽하게 짜여있는 repository 함수 그대로 호출!
        res = WordRepository.get_main_wordbook_list(
            user_id=safe_user_id, 
            page=page, 
            size=size, 
            date_filter=date_filter, 
            status_filter=status_filter, 
            sort=sort
        )
        
        total = res["total_count"]
        
        # 2. 프론트엔드가 원하는 페이징 규격에 맞춰서 포장만 해서 전달
        return {
            "totalElements": total,
            "totalPages": math.ceil(total / size) if total > 0 else 1,
            "currentPage": page,
            "size": size,
            "content": res["content"]
        }

    @classmethod
    def get_word_detail(cls, word_id, user_id):
        safe_user_id = user_id if user_id is not None else -1
        
        # Repository에 있는 함수 2개로 단어와 내 상태를 가져옴
        word = WordRepository.find_by_id(word_id)
        if not word:
            return None
            
        status = UserWordStatusRepository._get_status(safe_user_id, word_id)
        
        return {
            "wordId": word["word_no"],
            "word": word["word_english"],
            "meaning": word["word_korean"],
            "example": word["example_sentence"] or "예문이 없습니다.",
            "synonyms": word.get("synonyms") or [],
            "antonyms": word.get("antonyms") or []
        }

    @classmethod
    def get_words_statistics(cls, user_id):
        safe_user_id = user_id if user_id is not None else -1
        # Repository에 이미 있는 통계 함수 바로 호출!
        return WordRepository.get_words_statistics(safe_user_id)

    @classmethod
    def toggle_word_status(cls, user_id, word_id, data):
        # 🔥 [추가] 유저가 DB에 존재하는지 확인
        user = UserRepository.find_by_id(user_id)
        if not user:
            return {"status": "error", "message": f"DB에 존재하지 않는 유저(ID: {user_id})입니다."}

        is_favorite = data.get("isFavorite")
        is_memorized = data.get("isMemorized")
        
        try:
            # Repository의 업데이트 로직 실행 후, 새로고침된 상태 딕셔너리를 반환받음
            updated_status = UserWordStatusRepository.find_or_create_and_update(
                user_id=user_id,
                word_id=word_id,
                is_bookmarked=is_favorite,
                is_memorized=is_memorized
            )
            
            # 라우터가 사용할 수 있도록 포장해서 리턴
            return {
                "status": "success",
                "isFavorite": updated_status["is_bookmarked"],
                "isMemorized": updated_status["is_memorized"]
            }
        except Exception as e:
            return {"status": "error", "message": f"상태 업데이트 중 에러: {str(e)}"}