"""Wordbook Service"""
from math import ceil
from .repository import WordRepository, UserWordStatusRepository, UserRepository
from db import db

class WordService:
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
        # Repository에 이미 있는 안전한 상태 업데이트 함수(find_or_create_and_update) 활용!
        is_favorite = data.get("isFavorite")
        is_memorized = data.get("isMemorized")
        
        UserWordStatusRepository.find_or_create_and_update(
            user_id=user_id,
            word_id=word_id,
            is_bookmarked=is_favorite,
            is_memorized=is_memorized
        )
        return {"status": "success"}