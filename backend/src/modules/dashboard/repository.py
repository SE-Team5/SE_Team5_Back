from db import db
from datetime import datetime


class DashboardRepository:
    """Raw SQL repository for dashboard status queries."""

    def get_user_by_user_no(self, user_no: int):
        query = "SELECT user_no, user_nickname, attendance_streak, attendance_today FROM LIVO.users WHERE user_no = %s"
        results = db.execute_query(query, (user_no,))
        return results[0] if results else None

    def check_today_quiz_completed(self, user_no: int) -> bool:
        """오늘(KST) 퀴즈 완료 여부"""
        query = """
        SELECT COUNT(*) AS cnt FROM LIVO.game_records
        WHERE user_id = %s
          AND DATE(played_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+09:00'))
        """
        results = db.execute_query(query, (user_no,))
        if not results:
            return False
        return results[0].get('cnt', 0) > 0

    def check_yesterday_quiz_completed(self, user_no: int) -> bool:
        """어제(KST) 퀴즈 완료 여부"""
        query = """
        SELECT COUNT(*) AS cnt FROM LIVO.game_records
        WHERE user_id = %s
          AND DATE(played_at) = DATE(CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+09:00')) - INTERVAL 1 DAY
        """
        results = db.execute_query(query, (user_no,))
        if not results:
            return False
        return results[0].get('cnt', 0) > 0
