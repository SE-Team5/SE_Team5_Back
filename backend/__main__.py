"""Flask 앱 실행 엔트리 포인트"""
import os
import sys

# src 폴더를 Python path에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from app import create_app

if __name__ == '__main__':
    app = create_app()
    print("\n" + "="*50)
    print("  Flask 앱이 시작되었습니다")
    print("="*50 + "\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
