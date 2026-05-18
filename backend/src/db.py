import mysql.connector
from mysql.connector import Error, pooling
from config import Config

class DatabaseConnection:
    """MySQL 데이터베이스 연결 관리 (Connection Pool 방식)"""
    
    _instance = None
    _pool = None
    
    @staticmethod
    def get_instance():
        """싱글톤 인스턴스 반환"""
        if DatabaseConnection._instance is None:
            DatabaseConnection._instance = DatabaseConnection()
        return DatabaseConnection._instance
    
    def connect(self):
        """커넥션 풀 생성"""
        try:
            DatabaseConnection._pool = pooling.MySQLConnectionPool(
                pool_name="livo_pool",
                pool_size=5,
                pool_reset_session=True,
                **Config.DB_CONFIG
            )
            print("✓ Database connected successfully")
        except Error as e:
            print(f"✗ Database connection failed: {e}")
            raise

    def get_connection(self):
        """풀에서 연결 가져오기"""
        if DatabaseConnection._pool is None:
            self.connect()
        return DatabaseConnection._pool.get_connection()
    
    def close(self):
        """풀 종료 (앱 종료 시)"""
        DatabaseConnection._pool = None
        print("✓ Database connection pool closed")
    
    def execute_query(self, query, params=None):
        """쿼리 실행 및 결과 반환"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor(dictionary=True)
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                return cursor.fetchall()
            finally:
                cursor.close()
        finally:
            conn.close()  # 풀에 반환
    
    def execute_update(self, query, params=None):
        """INSERT/UPDATE/DELETE 쿼리 실행"""
        conn = self.get_connection()
        try:
            cursor = conn.cursor()
            try:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                conn.commit()
                return cursor.rowcount
            except Error as e:
                conn.rollback()
                raise
            finally:
                cursor.close()
        finally:
            conn.close()  # 풀에 반환

# 싱글톤 인스턴스
db = DatabaseConnection.get_instance()
