"""Wordbook Repository"""
# repository.py
from datetime import datetime
from sqlalchemy import asc, desc, func
from extensions import db
from models import User, Word, UserWordStatus


class UserRepository:

    @staticmethod
    def find_by_id(user_id) -> dict | None:
        user = db.session.get(User, user_id)
        if not user:
            return None
        return {
            "id":                 user.id,
            "email":              user.email,
            "daily_target_count": user.daily_target_count,
        }


class WordRepository:

    # ──────────────────────────────────────────
    # 1. 페이징 + 필터링 조회
    # ──────────────────────────────────────────
    @staticmethod
    def get_words_paginated(user_id, page, per_page, sort, start_date, end_date, keyword) -> dict:
        query = (
            db.session.query(Word, UserWordStatus)
            .outerjoin(
                UserWordStatus,
                (Word.id == UserWordStatus.word_id) &
                (UserWordStatus.user_id == user_id),
            )
        )

        if start_date:
            query = query.filter(
                (func.date(UserWordStatus.last_studied_at) >= start_date) |
                (UserWordStatus.id == None)  # 신규 단어 살리기
            )
        if end_date:
            query = query.filter(
                (func.date(UserWordStatus.last_studied_at) <= end_date) |
                (UserWordStatus.id == None)  # 신규 단어 살리기
            )

        if keyword:
            like_pattern = f"%{keyword}%"
            query = query.filter(
                Word.term.like(like_pattern) | Word.definition.like(like_pattern)
            )

        sort_map = {
            "created_at_desc": desc(Word.created_at),
            "created_at_asc":  asc(Word.created_at),
            "term_asc":        asc(Word.term),
            "term_desc":       desc(Word.term),
            "latest_studied":  desc(UserWordStatus.last_studied_at),
        }
        query = query.order_by(sort_map.get(sort, desc(Word.created_at)))

        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return {
            "total": pagination.total,
            "pages": pagination.pages,
            "items": [
                WordRepository._to_dict_with_status(word, status)
                for word, status in pagination.items
            ],
        }

    @staticmethod
    def find_by_id(word_id) -> "Word | None":
        return db.session.get(Word, word_id)

    @staticmethod
    def find_by_term(term) -> "Word | None":
        return (
            db.session.query(Word)
            .filter(Word.term == term)
            .first()
        )

    # ──────────────────────────────────────────
    # 2. 단어 생성
    # ──────────────────────────────────────────
    @staticmethod
    def create(term, definition, example=None, memo=None) -> dict:
        word = Word(
            term=term,
            definition=definition,
            example=example,
            memo=memo,
        )
        db.session.add(word)
        db.session.commit()
        return WordRepository._to_dict(word)

    # ──────────────────────────────────────────
    # 3. 단어 수정
    # ──────────────────────────────────────────
    @staticmethod
    def update(word_id, term=None, definition=None, example=None, memo=None) -> dict:
        word = db.session.get(Word, word_id)
        if term is not None:
            word.term = term
        if definition is not None:
            word.definition = definition
        if example is not None:
            word.example = example
        if memo is not None:
            word.memo = memo
        word.updated_at = datetime.utcnow()
        db.session.commit()
        return WordRepository._to_dict(word)

    # ──────────────────────────────────────────
    # 4. 단어 삭제
    # 🔧 수정 2: commit 없음 유지 — Service에서 일괄 커밋
    # ──────────────────────────────────────────
    @staticmethod
    def delete(word_id) -> None:
        word = db.session.get(Word, word_id)
        if word:
            db.session.delete(word)

    @staticmethod
    def filter_existing_word_ids(word_ids: list) -> list:
        rows = (
            db.session.query(Word.id)
            .filter(Word.id.in_(word_ids))
            .all()
        )
        return [r.id for r in rows]

    @staticmethod
    def _to_dict(word: "Word") -> dict:
        return {
            "id":         word.id,
            "term":       word.term,
            "definition": word.definition,
            "example":    word.example,
            "memo":       word.memo,
            "created_at": word.created_at.isoformat() if word.created_at else None,
            "updated_at": word.updated_at.isoformat() if word.updated_at else None,
        }

    @staticmethod
    def _to_dict_with_status(word: "Word", status: "UserWordStatus | None") -> dict:
        return {
            "id":              word.id,
            "term":            word.term,
            "definition":      word.definition,
            "example":         word.example,
            "memo":            word.memo,
            "created_at":      word.created_at.isoformat() if word.created_at else None,
            "updated_at":      word.updated_at.isoformat() if word.updated_at else None,
            "is_memorized":    status.is_memorized  if status else False,
            "is_bookmarked":   status.is_bookmarked if status else False,
            "study_count":     status.study_count   if status else 0,
            "last_studied_at": (
                status.last_studied_at.isoformat() if status and status.last_studied_at else None
            ),
        }


class UserWordStatusRepository:

    # 🔧 수정 1: create_initial_status 삭제 (데드코드)

    @staticmethod
    def find_by_user_and_word(user_id, word_id) -> "UserWordStatus | None":
        return (
            db.session.query(UserWordStatus)
            .filter(
                UserWordStatus.user_id == user_id,
                UserWordStatus.word_id == word_id,
            )
            .first()
        )

    # ──────────────────────────────────────────
    # 5. 미학습 단어 랜덤 조회
    # ──────────────────────────────────────────
    @staticmethod
    def get_unmemorized_random(user_id, limit) -> list:
        rows = (
            db.session.query(Word, UserWordStatus)
            .outerjoin(
                UserWordStatus,
                (Word.id == UserWordStatus.word_id) &
                (UserWordStatus.user_id == user_id),
            )
            .filter(
                (UserWordStatus.id == None) |           # noqa: E711 신규 유저
                (UserWordStatus.is_memorized == False)  # noqa: E712 기존 유저 미암기
            )
            .order_by(func.rand())  # MySQL
            .limit(limit)
            .all()
        )

        return [
            {
                **WordRepository._to_dict(word),
                "is_memorized":    status.is_memorized   if status else False,
                "is_bookmarked":   status.is_bookmarked  if status else False,
                "study_count":     status.study_count    if status else 0,
                "last_studied_at": (
                    status.last_studied_at.isoformat() if status and status.last_studied_at else None
                ),
            }
            for word, status in rows
        ]

    # ──────────────────────────────────────────
    # 6. 단어 상태 단건 토글 수정 (Upsert)
    # ──────────────────────────────────────────
    @staticmethod
    def find_or_create_and_update(user_id, word_id, is_memorized=None, is_bookmarked=None) -> dict:
        status = (
            db.session.query(UserWordStatus)
            .filter(
                UserWordStatus.user_id == user_id,
                UserWordStatus.word_id == word_id,
            )
            .first()
        )

        if not status:
            status = UserWordStatus(
                user_id=user_id,
                word_id=word_id,
                is_memorized=False,
                is_bookmarked=False,
                study_count=0,
                last_studied_at=None,
            )
            db.session.add(status)

        if is_memorized is not None:
            status.is_memorized = is_memorized
        if is_bookmarked is not None:
            status.is_bookmarked = is_bookmarked

        db.session.commit()
        return UserWordStatusRepository._to_dict(status)

    # ──────────────────────────────────────────
    # 7. 학습 이력 일괄 갱신
    # ──────────────────────────────────────────
    @staticmethod
    def batch_update_study_records(user_id, word_ids: list, studied_at: datetime) -> int:
        updated_count = (
            db.session.query(UserWordStatus)
            .filter(
                UserWordStatus.user_id == user_id,
                UserWordStatus.word_id.in_(word_ids),
            )
            .update(
                {
                    UserWordStatus.last_studied_at: studied_at,
                    UserWordStatus.study_count: UserWordStatus.study_count + 1,
                },
                synchronize_session=False,
            )
        )
        # commit은 Service에서 처리
        return updated_count

    # ──────────────────────────────────────────
    # 7-보조. 배치 처리 전 없는 row 일괄 생성
    # ──────────────────────────────────────────
    @staticmethod
    def find_or_create_bulk(user_id, word_ids: list) -> None:
        existing_ids = {
            row.word_id
            for row in db.session.query(UserWordStatus.word_id).filter(
                UserWordStatus.user_id == user_id,
                UserWordStatus.word_id.in_(word_ids),
            ).all()
        }

        new_statuses = [
            UserWordStatus(
                user_id=user_id,
                word_id=wid,
                is_memorized=False,
                is_bookmarked=False,
                study_count=0,
                last_studied_at=None,
            )
            for wid in word_ids
            if wid not in existing_ids
        ]

        if new_statuses:
            db.session.bulk_save_objects(new_statuses)
            db.session.flush()

    # ──────────────────────────────────────────
    # 관리자 단어 삭제 연동
    # ──────────────────────────────────────────
    @staticmethod
    def delete_by_word(word_id) -> None:
        db.session.query(UserWordStatus).filter(
            UserWordStatus.word_id == word_id,
        ).delete(synchronize_session=False)
        # commit은 Service에서 처리

    @staticmethod
    def _to_dict(status: "UserWordStatus") -> dict:
        return {
            "word_id":         status.word_id,
            "is_memorized":    status.is_memorized,
            "is_bookmarked":   status.is_bookmarked,
            "study_count":     status.study_count,
            "last_studied_at": status.last_studied_at.isoformat() if status.last_studied_at else None,
        }