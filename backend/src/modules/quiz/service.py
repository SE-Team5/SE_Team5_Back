# backend/src/modules/quiz/service.py
from .repository import QuizRepository

class QuizService:
    def __init__(self):
        self.repository = QuizRepository()

    def get_new_quiz(self, limit=10):
        """사용자에게 제공할 퀴즈 세트 구성"""
        words = self.repository.get_random_words(limit=limit)
        if not words:
            return {"status": "error", "message": "단어장에 단어가 부족합니다."}
        
        return {
            "status": "success",
            "data": {
                "words": words,
                "total": len(words),
            }
        }

    def submit_result(self, user_no, total, correct):
        """퀴즈 결과 저장 로직"""
        if total is None or correct is None:
            return {"status": "error", "message": "퀴즈 결과가 올바르지 않습니다."}

        is_first_completion_today = not self.repository.has_quiz_completed_today(user_no)
        success = self.repository.save_quiz_result(user_no, total, correct)
        if success:
            if is_first_completion_today:
                self.repository.increment_attendance_streak(user_no)
            else:
                self.repository.ensure_minimum_attendance_streak(user_no)
            return {"status": "success", "message": "결과가 성공적으로 저장되었습니다."}
        return {"status": "error", "message": "저장 중 오류가 발생했습니다."}