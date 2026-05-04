"""Wordbook Service"""
from datetime import datetime, date

from flask import abort
from flask_jwt_extended import get_jwt_identity

from repository import WordRepository, UserWordStatusRepository, UserRepository


class WordService:

    # ──────────────────────────────────────────
    # 1. 단어장 전체 목록 조회
    # ──────────────────────────────────────────
    @staticmethod
    def get_words(user_id, page, per_page, sort, start_date, end_date, keyword):
        # 날짜 문자열을 date 객체로 변환
        parsed_start = None
        parsed_end   = None
        try:
            if start_date:
                parsed_start = datetime.strptime(start_date, "%Y-%m-%d").date()
            if end_date:
                parsed_end = datetime.strptime(end_date, "%Y-%m-%d").date()
        except ValueError:
            abort(400, description="날짜 형식이 올바르지 않습니다. (YYYY-MM-DD)")

        # 정렬 옵션 화이트리스트 검증
        allowed_sorts = {"created_at_desc", "created_at_asc", "term_asc", "term_desc"}
        if sort not in allowed_sorts:
            abort(400, description=f"허용된 sort 값: {allowed_sorts}")

        pagination = WordRepository.get_words_paginated(
            user_id=user_id,
            page=page,
            per_page=per_page,
            sort=sort,
            start_date=parsed_start,
            end_date=parsed_end,
            keyword=keyword,
        )

        return {
            "total":    pagination["total"],
            "page":     page,
            "per_page": per_page,
            "pages":    pagination["pages"],
            "items":    pagination["items"],
        }
    
    # ──────────────────────────────────────────
    # 2. 단어 추가 - (전체 공용 단어)
    # ──────────────────────────────────────────
    @staticmethod
    def create_word(data):
        # 전체 단어 기준으로 중복 확인 (관리자가 관리하는 공용 단어장)
        existing = WordRepository.find_by_term(term=data["term"])
        if existing:
            abort(409, description="이미 동일한 단어가 존재합니다.")

        word = WordRepository.create(
            term=data["term"],
            definition=data["definition"],
            example=data.get("example"),
            memo=data.get("memo"),
        )
        return word

    # ──────────────────────────────────────────
    # 3. 단어 수정 (관리자는 모든 단어 수정 가능)
    # ──────────────────────────────────────────
    @staticmethod
    def update_word(word_id, data):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            abort(404, description="단어를 찾을 수 없습니다.")

        updated = WordRepository.update(
            word_id=word_id,
            term=data.get("term"),
            definition=data.get("definition"),
            example=data.get("example"),
            memo=data.get("memo"),
        )
        return updated

    # ──────────────────────────────────────────
    # 4. 단어 삭제 (관리자는 모든 단어 삭제 가능)
    # ──────────────────────────────────────────
    @staticmethod
    def delete_word(word_id):
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            abort(404, description="단어를 찾을 수 없습니다.")

        UserWordStatusRepository.delete_by_word(word_id=word_id)
        WordRepository.delete(word_id=word_id)

    # ──────────────────────────────────────────
    # 5. DAY 단어장 미학습 단어 랜덤 제공
    # ──────────────────────────────────────────
    @staticmethod
    def get_daily_random_words(user_id):
        # 유저 설정에서 daily_target_count를 읽어와 limit 결정
        user = UserRepository.find_by_id(user_id)
        if not user:
            abort(404, description="유저를 찾을 수 없습니다.")

        limit = user["daily_target_count"]

        # is_memorized=False인 단어 중 랜덤으로 limit개 반환
        words = UserWordStatusRepository.get_unmemorized_random(
            user_id=user_id, limit=limit
        )
        return {"daily_target_count": limit, "items": words}

    # ──────────────────────────────────────────
    # 6. 단어 상태 단건 수정 (토글)
    # ──────────────────────────────────────────
    @staticmethod
    def update_word_status(user_id, word_id, data):
        # 단어 자체가 존재하는지 먼저 확인
        word = WordRepository.find_by_id(word_id=word_id)
        if not word:
            abort(404, description="단어를 찾을 수 없습니다.")

        # find_or_create 패턴:
        # UserWordStatus row가 없으면 기본값으로 생성 후 업데이트
        # 가입 후 첫 상호작용(즐겨찾기, 암기체크)에서도 정상 동작
        updated = UserWordStatusRepository.find_or_create_and_update(
            user_id=user_id,
            word_id=word_id,
            is_memorized=data.get("is_memorized"),
            is_bookmarked=data.get("is_bookmarked"),
        )
        return updated

    # ──────────────────────────────────────────
    # 7. 학습 이력 일괄 갱신 배치 처리
    # ──────────────────────────────────────────
    @staticmethod
    def batch_update_study_records(user_id, word_ids):
        # ──────────────────────────────────────────
        # [비즈니스 검증] 존재하지 않는 word_id 걸러내기
        # ──────────────────────────────────────────
        valid_ids = WordRepository.filter_existing_word_ids(word_ids=word_ids)

        invalid_ids = set(word_ids) - set(valid_ids)
        if invalid_ids:
            abort(400, description=f"존재하지 않는 단어가 포함되어 있습니다: {list(invalid_ids)}")

        now = datetime.utcnow()

        try:
            # ──────────────────────────────────────────
            # [트랜잭션 제어] 두 Repository 작업을 하나의 원자적 트랜잭션으로 묶음
            # find_or_create_bulk: flush()만 수행 (commit 없음)
            # batch_update: commit() 수행
            # 예외 발생 시 rollback → 두 작업 모두 취소
            # ──────────────────────────────────────────
            UserWordStatusRepository.find_or_create_bulk(
                user_id=user_id, word_ids=valid_ids
            )
            updated_count = UserWordStatusRepository.batch_update_study_records(
                user_id=user_id, word_ids=valid_ids, studied_at=now
            )
            db.session.commit()  # 트랜잭션 최종 확정은 Service에서

        except Exception:
            db.session.rollback()  # Repository에서 올라온 예외를 Service에서 처리
            abort(500, description="학습 이력 갱신 중 오류가 발생했습니다.")

        return {
            "updated_count": updated_count,
            "studied_at":    now.isoformat(),
        }