# backend/src/modules/quiz/repository.py
from db import db


class QuizRepository:
    def get_random_words(self, limit=10):
        """랜덤하게 단어를 가져와 퀴즈 생성"""
        query = """
            SELECT word_no, word_english, word_korean, example_sentence
            FROM RIVO.words
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
        INSERT INTO RIVO.game_records (user_id, total_words, correct_answers, played_at)
        VALUES (%s, %s, %s, NOW())
        """
        return db.execute_update(query, (user_no, total, correct))