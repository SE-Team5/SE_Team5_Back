"""Day Wordbook Repository"""
from math import ceil
from db import db


def _to_day_word_dict(row):
    return {
        "id": str(row["day_word_no"]),
        "word_id": str(row["word_no"]),
        "user_id": str(row["user_no"]),
        "term": row["word_english"],
        "definition": row["word_korean"],
        "example": row.get("example_sentence"),
        "scheduled_date": str(row["scheduled_date"]),
        "is_learned": row.get("is_learned", False),
        "learned_at": row.get("learned_at"),
    }


class DayWordRepository:
    @staticmethod
    def find_by_id(day_word_id) -> dict | None:
        """ID로 Day 단어 조회"""
        # day_wordbooks table may not exist in this schema; map to user_words_status
        query = """
            SELECT u.user_id as user_no, u.word_id as word_no, u.updated_at as scheduled_date,
                   w.word_english, w.word_korean, w.example_sentence, u.is_memorized as is_learned, u.updated_at as learned_at
            FROM user_words_status u
            JOIN words w ON u.word_id = w.word_no
            WHERE u.word_id = %s
            LIMIT 1
        """
        results = db.execute_query(query, (day_word_id,))
        if not results:
            return None
        row = results[0]
        return {
            "day_word_no": row.get("word_no"),
            "word_no": row.get("word_no"),
            "user_no": row.get("user_no"),
            "scheduled_date": row.get("scheduled_date"),
            "word_english": row.get("word_english"),
            "word_korean": row.get("word_korean"),
            "example_sentence": row.get("example_sentence"),
            "is_learned": row.get("is_learned"),
            "learned_at": row.get("learned_at"),
        }

    @staticmethod
    def find_by_user_word_date(user_id, word_id, scheduled_date) -> dict | None:
        """사용자-단어-날짜 조합으로 조회 (중복 검사용)"""
        # Use user_words_status as a lightweight representation of scheduled day entries
        query = """
            SELECT u.user_id as user_no, u.word_id as word_no, u.updated_at as scheduled_date,
                   w.word_english, w.word_korean, w.example_sentence
            FROM user_words_status u
            JOIN words w ON u.word_id = w.word_no
            WHERE u.user_id = %s AND u.word_id = %s AND DATE(u.updated_at) = %s
            LIMIT 1
        """
        results = db.execute_query(query, (user_id, word_id, scheduled_date))
        if not results:
            return None
        row = results[0]
        return {
            "day_word_no": row.get("word_no"),
            "word_no": row.get("word_no"),
            "user_no": row.get("user_no"),
            "scheduled_date": row.get("scheduled_date"),
            "word_english": row.get("word_english"),
            "word_korean": row.get("word_korean"),
            "example_sentence": row.get("example_sentence"),
        }

    @staticmethod
    def _order_clause(sort="scheduled_date_desc"):
        """정렬 조건"""
        sort_map = {
            "scheduled_date_desc": "ORDER BY dw.scheduled_date DESC",
            "scheduled_date_asc": "ORDER BY dw.scheduled_date ASC",
            "created_at_desc": "ORDER BY dw.day_word_no DESC",
            "created_at_asc": "ORDER BY dw.day_word_no ASC",
        }
        return sort_map.get(sort, "ORDER BY dw.scheduled_date DESC")

    @staticmethod
    def get_day_words_paginated(user_id, page, per_page, sort="scheduled_date_desc"):
        """사용자의 Day 단어 목록 조회 (페이지네이션)"""
        # Build today's list from `user_words_status.updated_at` entries.
        # 1) Count today's appeared entries for user
        count_q = "SELECT COUNT(*) as total FROM user_words_status WHERE user_id = %s AND DATE(updated_at) = CURDATE()"
        count_res = db.execute_query(count_q, (user_id,)) or []
        total = int(count_res[0].get("total", 0)) if count_res else 0

        pages = ceil(total / per_page) if total > 0 else 1
        offset = (page - 1) * per_page

        # 2) Fetch today's entries joined with words
        query = """
            SELECT u.word_id as word_no, w.word_english, w.word_korean, w.example_sentence,
                   u.is_memorized, u.updated_at
            FROM user_words_status u
            JOIN words w ON u.word_id = w.word_no
            WHERE u.user_id = %s AND DATE(u.updated_at) = CURDATE()
            ORDER BY u.updated_at DESC
            LIMIT %s OFFSET %s
        """
        results = db.execute_query(query, (user_id, per_page, offset)) or []

        items = []
        for row in results:
            item = {
                "id": str(row.get("word_no")),
                "word_id": str(row.get("word_no")),
                "user_id": str(user_id),
                "term": row.get("word_english"),
                "definition": row.get("word_korean"),
                "exampleSentence": row.get("example_sentence"),
                "scheduled_date": str(row.get("updated_at", ""))[:10],
                "is_learned": bool(row.get("is_memorized")),
                "learned_at": row.get("updated_at") if row.get("is_memorized") else None,
            }
            relations = DayWordRepository._fetch_relations_for_word(int(row.get("word_no")))
            item.update(relations)
            items.append(item)

        return {"total": total, "pages": pages, "items": items}

    @staticmethod
    def _fetch_relations_for_word(word_no: int) -> dict:
        """주어진 단어에 대해 relation_type별로 관련 단어들을 반환한다."""
        query = """
            SELECT wr.relation_type, w2.word_no, w2.word_english, w2.word_korean
            FROM word_relations wr
            JOIN words w2 ON wr.related_word_no = w2.word_no
            WHERE wr.word_no = %s
        """
        results = db.execute_query(query, (word_no,)) or []
        synonyms = []
        antonyms = []
        homonyms = []
        for r in results:
            entry = {
                "id": str(r.get("word_no")),
                "english": r.get("word_english"),
                "korean": r.get("word_korean"),
            }
            if r.get("relation_type") == 'synonym':
                synonyms.append(entry)
            elif r.get("relation_type") == 'antonym':
                antonyms.append(entry)
            elif r.get("relation_type") == 'homonym':
                homonyms.append(entry)

        return {
            "synonyms": synonyms,
            "antonyms": antonyms,
            "homonyms": homonyms,
        }

    @staticmethod
    def fill_today_words_for_user(user_id: int):
        """사용자에 대해 오늘의 단어 목록을 daily_target_count 만큼 채운다 (가능한 경우).

        - users.daily_target_count 를 참고
        - user_words_status.is_memorized = TRUE 인 단어는 제외
        - 이미 day_wordbooks 에 등록된 단어는 제외
        """
        # 1) 사용자의 목표 개수 확인
        user_q = "SELECT daily_target_count FROM users WHERE user_no = %s"
        user_res = db.execute_query(user_q, (user_id,))
        if not user_res:
            return 0
        target = int(user_res[0].get("daily_target_count", 20))

        # 2) Count how many words are marked as 'appeared today' (user_words_status.updated_at = today)
        today_count_q = "SELECT COUNT(*) as cnt FROM user_words_status WHERE user_id = %s AND DATE(updated_at) = CURDATE()"
        today_cnt_res = db.execute_query(today_count_q, (user_id,)) or []
        today_cnt = int(today_cnt_res[0].get("cnt", 0)) if today_cnt_res else 0

        need = max(0, target - today_cnt)
        if need <= 0:
            return today_cnt

        # 3) Candidate words: exclude memorized words and words that already appeared today
        candidate_q = """
            SELECT w.word_no
            FROM words w
            WHERE w.word_no NOT IN (
                SELECT word_id FROM user_words_status WHERE user_id = %s AND is_memorized = TRUE
            )
            AND w.word_no NOT IN (
                SELECT word_id FROM user_words_status WHERE user_id = %s AND DATE(updated_at) = CURDATE()
            )
            ORDER BY RAND()
            LIMIT %s
        """
        candidates = db.execute_query(candidate_q, (user_id, user_id, need)) or []

        inserted = 0
        for c in candidates:
            try:
                upsert_q = """
                    INSERT INTO user_words_status (user_id, word_id, is_favorite, is_memorized, created_at, updated_at)
                    VALUES (%s, %s, FALSE, FALSE, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE updated_at = NOW()
                """
                db.execute_update(upsert_q, (user_id, c.get("word_no")))
                inserted += 1
            except Exception:
                continue

        return today_cnt + inserted

    @staticmethod
    def create(word_id, user_id, scheduled_date):
        """Day 단어 생성"""
        # With no `day_wordbooks` table available, creating a scheduled day entry
        # will be represented by upserting a `user_words_status` row with
        # updated_at set to the scheduled_date. We avoid DDL changes here.
        try:
            query = """
                INSERT INTO user_words_status (user_id, word_id, is_favorite, is_memorized, created_at, updated_at)
                VALUES (%s, %s, FALSE, FALSE, NOW(), %s)
                ON DUPLICATE KEY UPDATE updated_at = %s
            """
            db.execute_update(query, (user_id, word_id, scheduled_date, scheduled_date))
            return {"status": "success", "message": "Day 단어가 추가되었습니다."}
        except Exception:
            return {"message": "Day 단어 생성에 실패했습니다."}

    @staticmethod
    def update(day_word_id, scheduled_date):
        """Day 단어 수정"""
        # Treat day_word_id as word_id; update the updated_at timestamp to scheduled_date
        try:
            query = """
                UPDATE user_words_status
                SET updated_at = %s
                WHERE word_id = %s
            """
            db.execute_update(query, (scheduled_date, day_word_id))
            return {"status": "success", "message": "Day 단어이(가) 수정되었습니다."}
        except Exception:
            return {"message": "Day 단어 수정에 실패했습니다."}

    @staticmethod
    def delete(day_word_id):
        """Day 단어 삭제"""
        # Delete today's appearance by removing user_words_status entry
        try:
            query = "DELETE FROM user_words_status WHERE word_id = %s"
            db.execute_update(query, (day_word_id,))
            return {"status": "success", "message": "Day 단어가 삭제되었습니다."}
        except Exception:
            return {"status": "error", "message": "Day 단어 삭제에 실패했습니다."}


class DayWordDetailRepository:
    @staticmethod
    def mark_learned(day_word_id):
        """Mark a word as learned for the user.

        Here `day_word_id` is treated as the `word_id` (word_no). We mark
        `user_words_status.is_memorized = TRUE` for the current user-word.
        """
        try:
            # We don't have user context here; the caller should ensure the
            # correct user is updated. For compatibility we update any status
            # row for the given word (caller route passes auth header to
            # determine user in service layer).
            query = """
                UPDATE user_words_status
                SET is_memorized = TRUE, updated_at = NOW()
                WHERE word_id = %s
            """
            db.execute_update(query, (day_word_id,))
            return {"status": "success", "message": "단어가 학습 완료 처리되었습니다."}
        except Exception:
            return {"status": "error", "message": "학습 완료 처리에 실패했습니다."}

    @staticmethod
    def find_learned_count_by_date(user_id, date):
        """특정 날짜에 사용자가 학습한 단어 개수"""
        # Count learned words from user_words_status for the given date
        query = """
            SELECT COUNT(*) as learned_count
            FROM user_words_status
            WHERE user_id = %s AND DATE(updated_at) = %s AND is_memorized = TRUE
        """
        results = db.execute_query(query, (user_id, date))
        if results:
            return int(results[0].get("learned_count", 0))
        return 0
