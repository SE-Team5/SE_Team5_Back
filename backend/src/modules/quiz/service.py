# backend/src/modules/quiz/service.py
from .repository import QuizRepository

class QuizService:
    def __init__(self):
        self.repository = QuizRepository()

    def get_new_quiz(self):
        """사용자에게 제공할 퀴즈 세트 구성"""
        words = self.repository.get_random_words()
        if not words:
            return {"status": "error", "message": "단어장에 단어가 부족합니다."}
        
        # 퀴즈 형식에 맞게 데이터 가공 가능 (예: 보기 섞기 등)
        return {
            "status": "success",
            "data": words
        }

    def submit_result(self, user_no, total, correct):
        """퀴즈 결과 저장 로직"""
        success = self.repository.save_quiz_result(user_no, total, correct)
        if success:
            return {"status": "success", "message": "결과가 성공적으로 저장되었습니다."}
        return {"status": "error", "message": "저장 중 오류가 발생했습니다."}