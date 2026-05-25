from .repository import DashboardRepository
from datetime import datetime


class DashboardService:
    def __init__(self):
        self.repo = DashboardRepository()

    def get_user_dashboard_status(self, user_no: int):
        try:
            user = self.repo.get_user_by_user_no(user_no)
            if not user:
                return {"status": "error", "message": "사용자를 찾을 수 없습니다."}

            attendance_streak = user.get('attendance_streak', 0)
            today_completed = self.repo.check_today_quiz_completed(user_no)

            if today_completed:
                # 오늘 퀴즈 완료 → 정상 streak 표시
                if attendance_streak < 1:
                    attendance_streak = 1
            else:
                # 오늘 퀴즈 미완료 → 어제도 안 풀었으면 streak 끊김(0)
                yesterday_completed = self.repo.check_yesterday_quiz_completed(user_no)
                if not yesterday_completed:
                    attendance_streak = 0

            return {
                "status": "success",
                "data": {
                    "attendance_streak": attendance_streak,
                    "attendance_today": today_completed,
                    "today_quiz_completed": today_completed,
                }
            }
        except Exception as e:
            print(f"Error in DashboardService.get_user_dashboard_status: {e}")
            return {"status": "error", "message": "서버 오류가 발생했습니다."}
