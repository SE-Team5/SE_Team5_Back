from db import db
from datetime import datetime


class DashboardRepository:
    """Raw SQL repository for dashboard status queries."""

    def get_user_by_user_no(self, user_no: int):
        query = "SELECT user_no, user_nickname, attendance_streak, attendance_today FROM RIVO.users WHERE user_no = %s"
        results = db.execute_query(query, (user_no,))
        return results[0] if results else None

    def check_today_quiz_completed(self, user_no: int) -> bool:
        # Check in game_records whether a record exists for the user with played_at date = today
        query = "SELECT COUNT(*) AS cnt FROM RIVO.game_records WHERE user_id = %s AND DATE(played_at) = CURDATE()"
        results = db.execute_query(query, (user_no,))
        if not results:
            return False
        return results[0].get('cnt', 0) > 0
