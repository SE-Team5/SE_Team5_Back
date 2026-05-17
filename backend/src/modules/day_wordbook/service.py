"""Day Wordbook Service"""
from .repository import DayWordRepository, DayWordDetailRepository


class DayWordService:
    @staticmethod
    def _normalize_day_word_payload(data):
        word_id = data.get("word_id")
        user_id = data.get("user_id")
        scheduled_date = data.get("scheduled_date")  # YYYY-MM-DD 형식
        return word_id, user_id, scheduled_date

    @staticmethod
    def get_day_words(user_id, page, per_page):
        """사용자의 오늘 단어 목록 조회"""
        # 필요한 경우 오늘의 단어를 채운 뒤 반환한다.
        # (users.daily_target_count 를 참고하여 부족하면 채움)
        try:
            DayWordRepository.fill_today_words_for_user(user_id)
        except Exception:
            # 실패해도 읽기는 시도함
            pass

        pagination = DayWordRepository.get_day_words_paginated(
            user_id=user_id,
            page=page,
            per_page=per_page
        )

        return {
            "total": pagination["total"],
            "page": page,
            "per_page": per_page,
            "pages": pagination["pages"],
            "items": pagination["items"],
        }

    @staticmethod
    def create_day_word(data):
        """매일 학습할 단어 추가"""
        word_id, user_id, scheduled_date = DayWordService._normalize_day_word_payload(data)

        if not word_id or not user_id or not scheduled_date:
            return {"message": "word_id, user_id, scheduled_date는 필수입니다."}

        # 중복 검사
        existing = DayWordRepository.find_by_user_word_date(
            user_id=user_id,
            word_id=word_id,
            scheduled_date=scheduled_date
        )
        if existing:
            return {"message": "해당 날짜에 이미 같은 단어가 추가되어 있습니다."}

        return DayWordRepository.create(
            word_id=word_id,
            user_id=user_id,
            scheduled_date=scheduled_date
        )

    @staticmethod
    def update_day_word(day_word_id, data):
        """매일 학습할 단어 수정"""
        day_word = DayWordRepository.find_by_id(day_word_id=day_word_id)
        if not day_word:
            return {"message": "해당 Day 단어를 찾을 수 없습니다."}

        scheduled_date = data.get("scheduled_date")
        if not scheduled_date:
            return {"message": "scheduled_date는 필수입니다."}

        return DayWordRepository.update(
            day_word_id=day_word_id,
            scheduled_date=scheduled_date
        )

    @staticmethod
    def delete_day_word(day_word_id):
        """매일 학습할 단어 삭제"""
        day_word = DayWordRepository.find_by_id(day_word_id=day_word_id)
        if not day_word:
            return {"status": "error", "message": "해당 Day 단어를 찾을 수 없습니다."}

        return DayWordRepository.delete(day_word_id=day_word_id)

    @staticmethod
    def mark_word_learned(day_word_id):
        """단어 학습 완료 처리"""
        # Interpret day_word_id as a word_id (word_no). Use Authorization
        # header to determine the acting user when possible.
        return DayWordDetailRepository.mark_learned(day_word_id)
