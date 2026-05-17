# backend/src/modules/quiz/repository.py
from db import db


class QuizRepository:
    def get_random_words(self, limit=10):
        """랜덤하게 단어를 가져와 퀴즈 생성"""
        query = """
            SELECT word_no, word_english, word_korean, example_sentence
            FROM LIVO.words
            ORDER BY RAND()
            LIMIT %s
        """
        rows = db.execute_query(query, (limit,))
        return [
            {
                "id": row["word_no"],
                "english": row["word_english"],
                "korean": row["word_korean"],
                "example": row.get("example_sentence"),
            }
            for row in rows
        ]

    def save_quiz_result(self, user_no, total, correct):
        """퀴즈 결과를 DB에 저장"""
        query = """
        INSERT INTO LIVO.game_records (user_id, total_words, correct_answers, played_at)
        VALUES (%s, %s, %s, CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+09:00'))
        """
        return db.execute_update(query, (user_no, total, correct))

    def mark_words_as_appeared(self, user_no, word_ids):
        """user_words_status에 단어 출현(암기 플래그) 처리를 한다.

        현재 규칙에 따라 퀴즈에 등장한 단어는 is_memorized를 TRUE로 설정하여
        이후 Day 단어 선정에서 제외되도록 한다.
        """
        if not word_ids:
            return 0
        # Record appearance by upserting a user_words_status row and
        # updating its updated_at timestamp so we can detect "appeared today"
        # without setting is_memorized to TRUE.
        inserted = 0
        for wid in word_ids:
            try:
                query = """
                    INSERT INTO user_words_status (user_id, word_id, is_favorite, is_memorized, created_at, updated_at)
                    VALUES (%s, %s, FALSE, FALSE, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE updated_at = NOW()
                """
                db.execute_update(query, (user_no, wid))
                inserted += 1
            except Exception:
                continue

        return inserted

    def has_quiz_completed_today(self, user_no):
        """오늘 이미 퀴즈를 제출했는지 확인"""
        query = """
        SELECT COUNT(*) AS cnt
        FROM LIVO.game_records
        WHERE user_id = %s
                    AND DATE(played_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+09:00'))
        """
        rows = db.execute_query(query, (user_no,))
        return bool(rows and rows[0].get('cnt', 0) > 0)

    def increment_attendance_streak(self, user_no):
        """오늘 첫 퀴즈 완료 시 연속 출석을 1 증가"""
        query = """
        UPDATE LIVO.users
        SET attendance_streak = COALESCE(attendance_streak, 0) + 1,
            attendance_today = TRUE
        WHERE user_no = %s
        """
        return db.execute_update(query, (user_no,))

    def ensure_minimum_attendance_streak(self, user_no):
        """오늘 퀴즈가 완료된 상태라면 최소 출석값을 1로 맞춤"""
        query = """
        UPDATE LIVO.users
        SET attendance_streak = CASE
                WHEN COALESCE(attendance_streak, 0) < 1 THEN 1
                ELSE attendance_streak
            END,
            attendance_today = TRUE
        WHERE user_no = %s
        """
        return db.execute_update(query, (user_no,))