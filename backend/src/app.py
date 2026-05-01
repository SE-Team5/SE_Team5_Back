"""Flask Application"""
import os
import sys
import importlib
from flask import Flask
from flask_cors import CORS
from config import Config
from db import db

def create_app():
    """Flask 앱 생성 및 초기화"""
    app = Flask(__name__)
    
    # 설정 로드
    app.config['ENV'] = Config.FLASK_ENV
    app.config['DEBUG'] = Config.DEBUG
    
    # CORS 활성화
    CORS(app, origins=Config.CORS_ORIGINS)
    
    # 데이터베이스 연결
    try:
        db.connect()
    except Exception as e:
        print(f"⚠ Warning: Database connection failed on startup: {e}")
    
    # 블루프린트 자동 탐지 및 등록
    register_blueprints(app)
    
    return app

def register_blueprints(app):
    """modules 폴더에서 블루프린트를 자동으로 찾아 등록"""
    modules_path = os.path.join(os.path.dirname(__file__), 'modules')
    modules_dir = os.path.basename(modules_path)
    
    # modules 폴더 내의 모든 패키지 탐색
    for module_name in os.listdir(modules_path):
        module_path = os.path.join(modules_path, module_name)
        
        # 폴더이고 __init__.py가 있는지 확인 (python 패키지)
        if os.path.isdir(module_path) and os.path.exists(os.path.join(module_path, '__init__.py')):
            try:
                # 모듈 동적 임포트
                module = importlib.import_module(f'modules.{module_name}')
                
                # 블루프린트 탐색 (관례: {module_name}_bp 형태)
                bp_name = f'{module_name}_bp'
                if hasattr(module, bp_name):
                    blueprint = getattr(module, bp_name)
                    app.register_blueprint(blueprint)
                    print(f"✓ Registered blueprint: {module_name}")
                else:
                    print(f"⚠ Blueprint '{bp_name}' not found in {module_name}")
            except Exception as e:
                print(f"✗ Error loading module '{module_name}': {e}")

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
