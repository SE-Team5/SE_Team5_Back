"""Auth Repository"""
from db import db
from mysql.connector import Error

class AuthRepository:
    """데이터베이스 쿼리 처리"""
    
    def check_email_exists(self, email):
        """이메일 존재 여부 확인"""
        query = "SELECT user_no FROM LIVO.users WHERE email = %s"
        results = db.execute_query(query, (email,))
        return len(results) > 0
    
    def check_userid_exists(self, user_id):
        """사용자 ID 중복 확인"""
        query = "SELECT user_no FROM LIVO.users WHERE user_id = %s"
        results = db.execute_query(query, (user_id,))
        return len(results) > 0
    
    def create_user(self, user_id, nickname, password_hash, email):
        """사용자 생성"""
        query = """
        INSERT INTO LIVO.users (user_id, user_nickname, password_hash, email, role, attendance_streak, attendance_today, daily_target_count)
        VALUES (%s, %s, %s, %s, 'USER', 1, FALSE, 20)
        """
        try:
            db.execute_update(query, (user_id, nickname, password_hash, email))
            return True
        except Error as e:
            print(f"Error creating user: {e}")
            return False
    
    def get_user_by_email(self, email):
        """이메일로 사용자 조회"""
        query = "SELECT user_no, user_id, email FROM LIVO.users WHERE email = %s"
        results = db.execute_query(query, (email,))
        return results[0] if results else None
    
    def get_user_by_userid(self, user_id):
        """사용자 ID로 사용자 조회 (로그인용)"""
        query = "SELECT user_no, user_id, user_nickname, email, password_hash, role FROM LIVO.users WHERE user_id = %s"
        results = db.execute_query(query, (user_id,))
        return results[0] if results else None

    def get_user_by_userid_and_email(self, user_id, email):
        """사용자 ID와 이메일이 일치하는 사용자 조회"""
        query = "SELECT user_no, user_id, user_nickname, email FROM LIVO.users WHERE user_id = %s AND email = %s"
        results = db.execute_query(query, (user_id, email))
        return results[0] if results else None

    def update_password(self, user_id, password_hash):
        """사용자 비밀번호 갱신"""
        query = "UPDATE LIVO.users SET password_hash = %s WHERE user_id = %s"
        try:
            updated_rows = db.execute_update(query, (password_hash, user_id))
            return updated_rows > 0
        except Error as e:
            print(f"Error updating password: {e}")
            return False

    def delete_user_by_user_no(self, user_no):
        """사용자 번호로 회원 정보 삭제"""
        query = "DELETE FROM LIVO.users WHERE user_no = %s"
        try:
            deleted_rows = db.execute_update(query, (user_no,))
            return deleted_rows > 0
        except Error as e:
            print(f"Error deleting user: {e}")
            return False

