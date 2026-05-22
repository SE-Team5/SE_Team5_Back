# backend/src/modules/quiz/service.py
from .repository import QuizRepository

class QuizService:
    def __init__(self):
        self.repository = QuizRepository()

    def get_new_quiz(self, user_no=None, limit=10, date_filter='all'):
        """
        사용자에게 제공할 퀴즈 세트 구성
        date_filter: 'today', 'week', 'all'
        """
        # 사용자가 있고 date_filter가 all이 아니면 필터링된 단어 가져오기
        if user_no and date_filter != 'all':
            words = self.repository.get_words_by_date_range(user_no, date_filter, limit)
        else:
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
        """퀴즈 결과 저장 및 출석 처리 (KST 기준 오늘 첫 퀴즈 시에만)"""
        if total is None or correct is None:
            return {"status": "error", "message": "퀴즈 결과가 올바르지 않습니다."}

        # 저장 전 오늘(KST) 첫 퀴즈 여부 확인
        is_first_today = not self.repository.has_quiz_completed_today(user_no)

        success = self.repository.save_quiz_result(user_no, total, correct)
        if success:
            # 오늘 첫 퀴즈 완료 시에만 출석 streak 업데이트
            if is_first_today:
                self.repository.update_attendance_streak(user_no)
            return {"status": "success", "message": "결과가 성공적으로 저장되었습니다."}
        return {"status": "error", "message": "저장 중 오류가 발생했습니다."}

    def get_game_history(self, user_no, limit=20):
        """사용자의 게임 이력 조회"""
        if not user_no:
            return {"status": "error", "message": "사용자 정보가 필요합니다."}
        
        history = self.repository.get_game_history(user_no, limit)
        return {
            "status": "success",
            "data": history
        }

    def get_game_statistics(self, user_no):
        """사용자의 게임 통계 조회"""
        if not user_no:
            return {"status": "error", "message": "사용자 정보가 필요합니다."}
        
        statistics = self.repository.get_game_statistics(user_no)
        return {
            "status": "success",
            "data": statistics
        }