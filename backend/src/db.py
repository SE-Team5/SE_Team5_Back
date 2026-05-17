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
                print("Database connected successfully")
            except Error as e:
                print(f"Database connection failed: {e}")
                raise
        return DatabaseConnection._connection
    
    def get_connection(self):
        """현재 연결 반환"""
        # Ensure connection is alive; attempt reconnect if not
        if DatabaseConnection._connection is None:
            self.connect()
        else:
            try:
                if not DatabaseConnection._connection.is_connected():
                    # close and reconnect
                    try:
                        DatabaseConnection._connection.close()
                    except Exception:
                        pass
                    DatabaseConnection._connection = None
                    self.connect()
            except Exception:
                # If is_connected check fails, recreate connection
                try:
                    DatabaseConnection._connection = None
                    self.connect()
                except Exception:
                    pass

        return DatabaseConnection._connection
    
    def close(self):
        """연결 종료"""
        if DatabaseConnection._connection is not None:
            DatabaseConnection._connection.close()
            DatabaseConnection._connection = None
            print("Database connection closed")
    
    def execute_query(self, query, params=None):
        """쿼리 실행 및 결과 반환"""
        # Try executing; if connection issue occurs, reconnect once and retry
        connection = self.get_connection()
        cursor = None
        try:
            cursor = connection.cursor(dictionary=True)
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            return cursor.fetchall()
        except mysql.connector.Error:
            # reconnect and retry once for various connector errors
            try:
                DatabaseConnection._connection = None
                connection = self.get_connection()
                if cursor:
                    try:
                        cursor.close()
                    except Exception:
                        pass
                cursor = connection.cursor(dictionary=True)
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                return cursor.fetchall()
            except Exception as e:
                # Log and return empty result to avoid raising 500 to callers
                print(f"Database query failed after retry: {e}")
                return []
            finally:
                if cursor:
                    try:
                        cursor.close()
                    except Exception:
                        pass
        except Exception as e:
            # Unexpected errors: log and return empty list to keep endpoints resilient
            print(f"Unexpected error executing query: {e}")
            return []
        finally:
            if cursor:
                try:
                    cursor.close()
                except Exception:
                    pass
    
    def execute_update(self, query, params=None):
        """INSERT/UPDATE/DELETE 쿼리 실행"""
        connection = self.get_connection()
        cursor = None
        try:
            cursor = connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            connection.commit()
            return cursor.rowcount
        except mysql.connector.Error:
            # reconnect and retry once
            try:
                DatabaseConnection._connection = None
                connection = self.get_connection()
                if cursor:
                    try:
                        cursor.close()
                    except Exception:
                        pass
                cursor = connection.cursor()
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)
                connection.commit()
                return cursor.rowcount
            except Exception as e:
                # Log and rollback; return 0 to indicate no rows affected
                try:
                    connection.rollback()
                except Exception:
                    pass
                print(f"Database update failed after retry: {e}")
                return 0
            finally:
                if cursor:
                    try:
                        cursor.close()
                    except Exception:
                        pass
        except Exception as e:
            try:
                connection.rollback()
            except Exception:
                pass
            print(f"Unexpected error executing update: {e}")
            return 0
        except Error:
            connection.rollback()
            raise
        finally:
            if cursor:
                try:
                    cursor.close()
                except Exception:
                    pass

# 싱글톤 인스턴스
db = DatabaseConnection.get_instance()
