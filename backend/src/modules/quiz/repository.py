# backend/src/modules/quiz/repository.py
from db import db

class QuizRepository:
    def get_random_words(self, limit=10):
        """랜덤하게 10개의 단어를 가져와 퀴즈 생성"""
        # MySQL의 RAND() 함수를 사용하여 무작위 추출
        query = "SELECT word_id, english_word, korean_meaning FROM RIVO.words ORDER BY RAND() LIMIT %s"
        return db.execute_query(query, (limit,))

    def save_quiz_result(self, user_no, total, correct):
        """퀴즈 결과를 DB에 저장"""
        query = """
        INSERT INTO RIVO.game_records (user_id, total_words, correct_answers)
        VALUES (%s, %s, %s)
        """
        return db.execute_update(query, (user_no, total, correct))