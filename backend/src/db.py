import time
import mysql.connector
from mysql.connector import Error
from mysql.connector.pooling import MySQLConnectionPool
from config import Config

class DatabaseConnection:
    """안정적인 Connection Pool 기반 MySQL 데이터베이스 연결 관리"""
    
    _instance = None

    @staticmethod
    def get_instance():
        """싱글톤 인스턴스 반환"""
        if DatabaseConnection._instance is None:
            DatabaseConnection._instance = DatabaseConnection()
        return DatabaseConnection._instance

    def __init__(self):
        self.pool = None
        self._initialize_pool()

    def _initialize_pool(self):
        """커넥션 풀 초기화 및 SSL 강제 비활성화 적용"""
        try:
            # 1. 기존 Config 설정을 복사한 후 SSL 비활성화 옵션 병합 (핵심 해결책)
            db_config = Config.DB_CONFIG.copy()
            db_config['ssl_disabled'] = True

            # 2. 커넥션 풀 생성 (pool_size=5)
            self.pool = MySQLConnectionPool(
                pool_name="livo_pool",
                pool_size=5,
                pool_reset_session=True,  # 풀 반납 시 세션 초기화로 찌꺼기 방지
                **db_config
            )
            print("✓ Database Connection Pool successfully initialized.")
        except Error as e:
            print(f"✗ Failed to initialize connection pool: {e}")
            raise

    def execute_query(self, query, params=None):
        """SELECT 쿼리 실행 및 결과 반환 (재시도 로직 포함)"""
        max_retries = 3
        
        for attempt in range(max_retries):
            connection = None
            cursor = None
            try:
                # 풀에서 안전하게 커넥션 대여
                connection = self.pool.get_connection()
                cursor = connection.cursor(dictionary=True)
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                return cursor.fetchall()

            except Error as e:
                print(f"⚠ Query Error (Attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(1)  # 1초 대기 후 재시도
                    continue
                raise  # 최대 재시도 횟수 초과 시 에러 발생
            
            finally:
                # 에러가 나든 안 나든 커서와 커넥션을 반드시 닫고 풀에 반납
                if cursor is not None:
                    cursor.close()
                if connection is not None and connection.is_connected():
                    connection.close()

    def execute_update(self, query, params=None):
        """INSERT/UPDATE/DELETE 쿼리 실행 (재시도 및 롤백 포함)"""
        max_retries = 3
        
        for attempt in range(max_retries):
            connection = None
            cursor = None
            try:
                connection = self.pool.get_connection()
                cursor = connection.cursor()
                
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                
                connection.commit()
                return cursor.rowcount

            except Error as e:
                print(f"⚠ Update Error (Attempt {attempt + 1}/{max_retries}): {e}")
                if connection is not None and connection.is_connected():
                    connection.rollback()  # 트랜잭션 롤백 보장
                
                if attempt < max_retries - 1:
                    time.sleep(1)
                    continue
                raise
            
            finally:
                # 안전한 자원 반납
                if cursor is not None:
                    cursor.close()
                if connection is not None and connection.is_connected():
                    connection.close()

# 다른 모듈에서 임포트하여 사용할 수 있도록 인스턴스 생성
db = DatabaseConnection.get_instance()