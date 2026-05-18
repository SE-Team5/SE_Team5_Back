"""Pet Repository"""
from db import db
from datetime import date


class PetRepository:
    """펫 관련 DB 쿼리 처리"""

    def get_pet_status(self, user_no: int):
        """펫 레벨 및 마지막 업데이트 날짜 조회"""
        query = """
            SELECT pet_level, pet_last_updated
            FROM LIVO.users
            WHERE user_no = %s
        """
        results = db.execute_query(query, (user_no,))
        if not results:
            return None
        row = results[0]
        return {
            "pet_level": row.get("pet_level", 1),
            "pet_last_updated": str(row["pet_last_updated"]) if row.get("pet_last_updated") else None,
        }

    def update_pet_level(self, user_no: int, is_studied: bool):
        """
        펫 레벨 업데이트
        is_studied=True: +1 (최대 10)
        is_studied=False: -1 (최소 1)
        """
        today = date.today()

        # 오늘 이미 업데이트했는지 확인
        check_query = """
            SELECT pet_level, pet_last_updated
            FROM LIVO.users
            WHERE user_no = %s
        """
        results = db.execute_query(check_query, (user_no,))
        if not results:
            return None

        row = results[0]
        current_level = row.get("pet_level", 1) or 1
        last_updated = row.get("pet_last_updated")

        # 오늘 이미 업데이트했으면 현재 레벨 그대로 반환
        if last_updated and str(last_updated) == str(today):
            return {"pet_level": current_level}

        # 레벨 계산
        if is_studied:
            new_level = min(current_level + 1, 10)
        else:
            new_level = max(current_level - 1, 1)

        # DB 업데이트
        update_query = """
            UPDATE LIVO.users
            SET pet_level = %s, pet_last_updated = %s
            WHERE user_no = %s
        """
        db.execute_update(update_query, (new_level, today, user_no))

        return {"pet_level": new_level}
