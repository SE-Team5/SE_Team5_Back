import os
from dotenv import load_dotenv

# .env 파일 로드 (프로젝트 루트 기준)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)

class Config:
    """Flask 설정"""
    # Database
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'wordquiz'),
        'port': int(os.getenv('DB_PORT', 3306)),
    }
    
    # Flask
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    PORT = int(os.getenv('FLASK_PORT', 5000))
    
    # CORS
    CORS_ORIGINS = '*'
    
