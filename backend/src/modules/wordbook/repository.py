"""Wordbook Repository"""
from math import ceil
from db import db


def _to_word_dict(row):
    return {
        "id": str(row["word_no"]),
        "term": row["word_english"],
        "definition": row["word_korean"],
        "example": row.get("example_sentence"),
        "memo": None,
    }


class UserRepository:
    @staticmethod
    def find_by_id(user_id) -> dict | None:
        query = "SELECT user_no, email, daily_target_count FROM RIVO.users WHERE user_no = %s"
        results = db.execute_query(query, (user_id,))
        if not results:
            return None
        user = results[0]
        return {
            "id": user["user_no"],
            "email": user["email"],
            "daily_target_count": user["daily_target_count"],
        }


class WordRepository:
    @staticmethod
    def _build_where_clause(keyword):
        if not keyword:
            return "", []

        clause = "WHERE word_english LIKE %s OR word_korean LIKE %s OR example_sentence LIKE %s"
        like = f"%{keyword}%"
        return clause, [like, like, like]

    @staticmethod
    def _order_clause(sort):
        sort_map = {
            "created_at_desc": "ORDER BY word_no DESC",
            "created_at_asc": "ORDER BY word_no ASC",
            "term_asc": "ORDER BY word_english ASC",
            "term_desc": "ORDER BY word_english DESC",
        }
        return sort_map.get(sort, "ORDER BY word_no DESC")

    @staticmethod
    def get_words_paginated(user_id, page, per_page, sort, start_date, end_date, keyword) -> dict:
        where_clause, params = WordRepository._build_where_clause(keyword)

        count_query = f"SELECT COUNT(*) AS total FROM RIVO.words {where_clause}"
        total_row = db.execute_query(count_query, tuple(params))
        total = total_row[0]["total"] if total_row else 0

        offset = max(page - 1, 0) * per_page
        select_query = f"""
            SELECT word_no, word_english, word_korean, example_sentence
            FROM RIVO.words
            {where_clause}
            {WordRepository._order_clause(sort)}
            LIMIT %s OFFSET %s
        """
        rows = db.execute_query(select_query, tuple(params + [per_page, offset]))

        items = [_to_word_dict(row) for row in rows]
        pages = ceil(total / per_page) if total else 0

        return {
            "total": total,
            "pages": pages,
            "items": items,
        }

    @staticmethod
    def find_by_id(word_id) -> dict | None:
        query = "SELECT word_no, word_english, word_korean, example_sentence FROM RIVO.words WHERE word_no = %s"
        results = db.execute_query(query, (word_id,))
        return results[0] if results else None

    @staticmethod
    def find_by_term(term) -> dict | None:
        query = "SELECT word_no, word_english, word_korean, example_sentence FROM RIVO.words WHERE word_english = %s"
        results = db.execute_query(query, (term,))
        return results[0] if results else None

    @staticmethod
    def create(term, definition, example=None, memo=None) -> dict:
        query = "INSERT INTO RIVO.words (word_english, word_korean, example_sentence) VALUES (%s, %s, %s)"
        db.execute_update(query, (term, definition, example))
        return _to_word_dict(WordRepository.find_by_term(term))

    @staticmethod
    def update(word_id, term=None, definition=None, example=None, memo=None) -> dict:
        current = WordRepository.find_by_id(word_id)
        if not current:
            return {"message": "단어를 찾을 수 없습니다."}

        next_term = term if term is not None else current["word_english"]
        next_definition = definition if definition is not None else current["word_korean"]
        next_example = example if example is not None else current.get("example_sentence")

        query = """
            UPDATE RIVO.words
            SET word_english = %s, word_korean = %s, example_sentence = %s
            WHERE word_no = %s
        """
        db.execute_update(query, (next_term, next_definition, next_example, word_id))
        return _to_word_dict(WordRepository.find_by_id(word_id))

    @staticmethod
    def delete(word_id) -> None:
        query = "DELETE FROM RIVO.words WHERE word_no = %s"
        db.execute_update(query, (word_id,))

    @staticmethod
    def filter_existing_word_ids(word_ids: list) -> list:
        if not word_ids:
            return []
        placeholders = ",".join(["%s"] * len(word_ids))
        query = f"SELECT word_no FROM RIVO.words WHERE word_no IN ({placeholders})"
        rows = db.execute_query(query, tuple(word_ids))
        return [row["word_no"] for row in rows]

    @staticmethod
    def get_random_words(limit: int) -> list:
        query = """
            SELECT word_no, word_english, word_korean, example_sentence
            FROM RIVO.words
            ORDER BY RAND()
            LIMIT %s
        """
        rows = db.execute_query(query, (limit,))
        return [_to_word_dict(row) for row in rows]


class UserWordStatusRepository:
    @staticmethod
    def _get_status(user_id, word_id):
        query = """
            SELECT status_id, user_id, word_id, is_favorite, is_memorized, created_at, updated_at
            FROM RIVO.user_words_status
            WHERE user_id = %s AND word_id = %s
        """
        rows = db.execute_query(query, (user_id, word_id))
        return rows[0] if rows else None

    @staticmethod
    def get_unmemorized_random(user_id, limit) -> list:
        query = """
            SELECT w.word_no, w.word_english, w.word_korean, w.example_sentence,
                   COALESCE(s.is_memorized, 0) AS is_memorized,
                   COALESCE(s.is_favorite, 0) AS is_bookmarked
            FROM RIVO.words w
            LEFT JOIN RIVO.user_words_status s
              ON s.word_id = w.word_no AND s.user_id = %s
            WHERE s.status_id IS NULL OR s.is_memorized = 0
            ORDER BY RAND()
            LIMIT %s
        """
        rows = db.execute_query(query, (user_id, limit))
        return [
            {
                **_to_word_dict(row),
                "is_memorized": bool(row.get("is_memorized")),
                "is_bookmarked": bool(row.get("is_bookmarked")),
            }
            for row in rows
        ]

    @staticmethod
    def find_or_create_and_update(user_id, word_id, is_memorized=None, is_bookmarked=None) -> dict:
        status = UserWordStatusRepository._get_status(user_id, word_id)

        if not status:
            insert_query = """
                INSERT INTO RIVO.user_words_status (user_id, word_id, is_favorite, is_memorized)
                VALUES (%s, %s, %s, %s)
            """
            db.execute_update(
                insert_query,
                (
                    user_id,
                    word_id,
                    1 if is_bookmarked else 0,
                    1 if is_memorized else 0,
                ),
            )
        else:
            next_favorite = status["is_favorite"] if is_bookmarked is None else int(bool(is_bookmarked))
            next_memorized = status["is_memorized"] if is_memorized is None else int(bool(is_memorized))
            update_query = """
                UPDATE RIVO.user_words_status
                SET is_favorite = %s, is_memorized = %s, updated_at = NOW()
                WHERE user_id = %s AND word_id = %s
            """
            db.execute_update(update_query, (next_favorite, next_memorized, user_id, word_id))

        refreshed = UserWordStatusRepository._get_status(user_id, word_id)
        return {
            "word_id": refreshed["word_id"],
            "is_memorized": bool(refreshed["is_memorized"]),
            "is_bookmarked": bool(refreshed["is_favorite"]),
        }

    @staticmethod
    def batch_update_study_records(user_id, word_ids: list) -> int:
        if not word_ids:
            return 0

        placeholders = ",".join(["%s"] * len(word_ids))
        query = f"""
            UPDATE RIVO.user_words_status
            SET updated_at = NOW()
            WHERE user_id = %s AND word_id IN ({placeholders})
        """
        return db.execute_update(query, tuple([user_id, *word_ids]))

    @staticmethod
    def delete_by_word(word_id) -> None:
        query = "DELETE FROM RIVO.user_words_status WHERE word_id = %s"
        db.execute_update(query, (word_id,))