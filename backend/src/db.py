import mysql.connector
from mysql.connector import Error
from config import Config

class DatabaseConnection:
    """MySQL 데이터베이스 연결 관리"""
    
    _instance = None
    _connection = None
    
    @staticmethod
    def get_instance():
        """싱글톤 인스턴스 반환"""
        if DatabaseConnection._instance is None:
            DatabaseConnection._instance = DatabaseConnection()
        return DatabaseConnection._instance
    
    def connect(self):
        """데이터베이스 연결"""
        if DatabaseConnection._connection is None:
            try:
                DatabaseConnection._connection = mysql.connector.connect(
                    **Config.DB_CONFIG
                )
                print("✓ Database connected successfully")
            except Error as e:
                print(f"✗ Database connection failed: {e}")
                raise
        return DatabaseConnection._connection
    
    def get_connection(self):
        """현재 연결 반환"""
        if DatabaseConnection._connection is None:
            self.connect()
        return DatabaseConnection._connection
    
    def close(self):
        """연결 종료"""
        if DatabaseConnection._connection is not None:
            DatabaseConnection._connection.close()
            DatabaseConnection._connection = None
            print("✓ Database connection closed")
    
    def execute_query(self, query, params=None):
        """쿼리 실행 및 결과 반환"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=True)
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.fetchall()
        finally:
            cursor.close()
    
    def execute_update(self, query, params=None):
        """INSERT/UPDATE/DELETE 쿼리 실행"""
        connection = self.get_connection()
        cursor = connection.cursor()
        try:
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            connection.commit()
            return cursor.rowcount
        except Error as e:
            connection.rollback()
            raise
        finally:
            cursor.close()

# 싱글톤 인스턴스
db = DatabaseConnection.get_instance()
