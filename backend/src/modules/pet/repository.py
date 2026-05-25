"""Pet Repository"""
from db import db
from datetime import date, datetime, timedelta, timezone


KOREA_TZ = timezone(timedelta(hours=9))


def _as_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00')).date()
        except ValueError:
            try:
                return datetime.strptime(value[:10], '%Y-%m-%d').date()
            except ValueError:
                return None
    return None


class PetRepository:
    """펫 관련 DB 쿼리 처리"""

    def _ensure_pet_status_table(self):
        create_query = """
            CREATE TABLE IF NOT EXISTS LIVO.user_pet_status (
              user_no INT NOT NULL,
              pet_level INT NOT NULL DEFAULT 1,
              pet_last_updated DATE DEFAULT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (user_no),
              CONSTRAINT fk_user_pet_status_user
                FOREIGN KEY (user_no) REFERENCES LIVO.users(user_no)
                ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
        db.execute_update(create_query)

    def get_pet_status(self, user_no: int):
        """펫 레벨 및 마지막 업데이트 날짜 조회"""
        self._ensure_pet_status_table()
        query = """
            SELECT pet_level, pet_last_updated
            FROM LIVO.user_pet_status
            WHERE user_no = %s
        """
        results = db.execute_query(query, (user_no,))
        if not results:
            insert_query = """
                INSERT INTO LIVO.user_pet_status (user_no, pet_level, pet_last_updated)
                VALUES (%s, 1, NULL)
            """
            db.execute_update(insert_query, (user_no,))
            return {
                "pet_level": 1,
                "pet_last_updated": None,
            }
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
        self._ensure_pet_status_table()
        today = datetime.now(KOREA_TZ).date()

        # 오늘 이미 업데이트했는지 확인
        check_query = """
            SELECT pet_level, pet_last_updated
            FROM LIVO.user_pet_status
            WHERE user_no = %s
        """
        results = db.execute_query(check_query, (user_no,))
        if not results:
            db.execute_update(
                """
                INSERT INTO LIVO.user_pet_status (user_no, pet_level, pet_last_updated)
                VALUES (%s, 1, NULL)
                """,
                (user_no,),
            )
            results = db.execute_query(check_query, (user_no,))
            if not results:
                return None

        row = results[0]
        current_level = row.get("pet_level", 1) or 1
        last_updated = _as_date(row.get("pet_last_updated"))

        # 오늘 이미 업데이트했으면 현재 레벨 그대로 반환
        if last_updated == today:
            return {"pet_level": current_level}

        # 레벨 계산
        if is_studied:
            new_level = min(current_level + 1, 10)
        else:
            new_level = max(current_level - 1, 1)

        # DB 업데이트
        update_query = """
            UPDATE LIVO.user_pet_status
            SET pet_level = %s, pet_last_updated = %s
            WHERE user_no = %s
        """
        db.execute_update(update_query, (new_level, today, user_no))

        return {"pet_level": new_level}
