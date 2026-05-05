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

            if today_completed and attendance_streak < 1:
                attendance_streak = 1

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
