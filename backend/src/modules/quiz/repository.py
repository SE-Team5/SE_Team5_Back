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

    def get_words_by_date_range(self, user_no, date_filter='all', limit=10):
        """
        날짜 필터에 따라 단어 가져오기
        date_filter: 'today', 'week', 'all'
        """
        if date_filter == 'today':
            query = """
                SELECT w.word_no, w.word_english, w.word_korean, w.example_sentence
                FROM LIVO.words w
                INNER JOIN LIVO.user_words_status uws ON w.word_no = uws.word_id
                WHERE uws.user_id = %s
                  AND DATE(uws.created_at) = CURDATE()
                ORDER BY RAND()
                LIMIT %s
            """
        elif date_filter == 'week':
            query = """
                SELECT w.word_no, w.word_english, w.word_korean, w.example_sentence
                FROM LIVO.words w
                INNER JOIN LIVO.user_words_status uws ON w.word_no = uws.word_id
                WHERE uws.user_id = %s
                  AND uws.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                ORDER BY RAND()
                LIMIT %s
            """
        else:  # 'all'
            query = """
                SELECT w.word_no, w.word_english, w.word_korean, w.example_sentence
                FROM LIVO.words w
                INNER JOIN LIVO.user_words_status uws ON w.word_no = uws.word_id
                WHERE uws.user_id = %s
                ORDER BY RAND()
                LIMIT %s
            """
        
        rows = db.execute_query(query, (user_no, limit))
        return [
            {
                "id": row["word_no"],
                "english": row["word_english"],
                "korean": row["word_korean"],
                "example": row.get("example_sentence"),
            }
            for row in rows
        ]

    def get_game_history(self, user_no, limit=20):
        """사용자의 게임 이력 조회"""
        query = """
            SELECT 
                record_id,
                total_words,
                correct_answers,
                ROUND((correct_answers / total_words * 100), 1) as accuracy_rate,
                played_at
            FROM LIVO.game_records
            WHERE user_id = %s
            ORDER BY played_at DESC
            LIMIT %s
        """
        rows = db.execute_query(query, (user_no, limit))
        return [
            {
                "id": row["record_id"],
                "totalWords": row["total_words"],
                "correctAnswers": row["correct_answers"],
                "accuracyRate": row["accuracy_rate"],
                "playedAt": row["played_at"].isoformat() if hasattr(row["played_at"], 'isoformat') else str(row["played_at"]),
            }
            for row in rows
        ]

    def get_game_statistics(self, user_no):
        """사용자의 게임 통계 조회"""
        query = """
            SELECT 
                COUNT(*) as total_games,
                SUM(total_words) as total_words_played,
                SUM(correct_answers) as total_correct,
                ROUND(AVG((correct_answers / total_words * 100)), 1) as avg_accuracy
            FROM LIVO.game_records
            WHERE user_id = %s
        """
        rows = db.execute_query(query, (user_no,))
        if rows and rows[0]:
            row = rows[0]
            return {
                "totalGames": row["total_games"] or 0,
                "totalWordsPlayed": row["total_words_played"] or 0,
                "totalCorrect": row["total_correct"] or 0,
                "avgAccuracy": row["avg_accuracy"] or 0.0,
            }
        return {
            "totalGames": 0,
            "totalWordsPlayed": 0,
            "totalCorrect": 0,
            "avgAccuracy": 0.0,
        }