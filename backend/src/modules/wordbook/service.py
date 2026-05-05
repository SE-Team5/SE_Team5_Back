"""Wordbook Service"""
from .repository import WordRepository, UserWordStatusRepository, UserRepository


class WordService:
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

        return WordRepository.create(term=term, definition=definition, example=example)

    @staticmethod
    def update_word(word_id, data):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            return {"message": "단어를 찾을 수 없습니다."}

        term, definition, example = WordService._normalize_word_payload(data)
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
        words = WordRepository.get_random_words(limit=limit)
        return {"daily_target_count": limit, "items": words}

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