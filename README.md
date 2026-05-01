# 백엔드 개발 시작 가이드

## 프로젝트 구조

```
backend/
├── .env                          # 환경변수 파일
├── requirements.txt              # Python 패키지 의존성
├── src/
│   ├── app.py                   # Flask 앱 진입점 (블루프린트 자동 등록)
│   ├── config.py                # 설정 관리 (.env 파일 읽기)
│   ├── db.py                    # 데이터베이스 연결 (중앙 관리)
│   └── modules/                 # 기능 모듈들
│       ├── auth/                # 1번 개발자 담당
│       │   ├── __init__.py       # 블루프린트 정의
│       │   ├── routes.py         # API 엔드포인트
│       │   ├── service.py        # 비즈니스 로직
│       │   └── repository.py     # DB 쿼리
│       ├── quiz/                # 2번 개발자 담당
│       │   ├── __init__.py
│       │   ├── routes.py
│       │   ├── service.py
│       │   └── repository.py
│       └── wordbook/            # 3번 개발자 담당
│           ├── __init__.py
│           ├── routes.py
│           ├── service.py
│           └── repository.py
```

---

## 초기 설정

### 1단계: Python 환경 설정

```bash
# backend 폴더로 이동
cd backend

# 가상환경 생성 (Windows)
python -m venv venv
venv\Scripts\activate

# 가상환경 생성 (Mac/Linux)
python3 -m venv venv
source venv/bin/activate
```

### 2단계: 패키지 설치

```bash
pip install -r requirements.txt
```

### 3단계: 환경변수 설정

`.env` 파일에서 데이터베이스 정보 수정:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password        # MySQL 비밀번호 입력
DB_NAME=wordquiz                 # 데이터베이스 이름
DB_PORT=3306

# Server Configuration
FLASK_ENV=development
FLASK_PORT=5000
DEBUG=True
```

### 4단계: 데이터베이스 설정

MySQL에서 데이터베이스 생성:

```sql
CREATE DATABASE wordquiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

필요한 테이블은 각 개발자가 자신의 모듈에서 생성/관리합니다.

---

## 개발 방법

### 담당 모듈에서만 작업

각 개발자는 자신의 모듈 폴더에서만 작업합니다:

- **1번 개발자**: `backend/src/modules/auth/` 폴더
- **2번 개발자**: `backend/src/modules/quiz/` 폴더
- **3번 개발자**: `backend/src/modules/wordbook/` 폴더

### 파일 구조 (각 모듈별 동일)

```
modules/your_module/
├── __init__.py           # 블루프린트 정의 (수정 X)
├── routes.py             # API 엔드포인트 구현
├── service.py            # 비즈니스 로직 구현
└── repository.py         # DB 쿼리 구현
```

### 개발 예시 (auth 모듈)

**1. routes.py** - API 엔드포인트 작성:

```python
from flask import request, jsonify
from . import auth_bp
from .service import AuthService

service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    """회원가입"""
    data = request.get_json()
    result = service.register(data)
    return jsonify(result), 201
```

**2. service.py** - 비즈니스 로직:

```python
from .repository import AuthRepository

class AuthService:
    def __init__(self):
        self.repository = AuthRepository()
    
    def register(self, data):
        # 유효성 검사, 비즈니스 로직
        return self.repository.create_user(data)
```

**3. repository.py** - DB 쿼리:

```python
from db import db

class AuthRepository:
    def create_user(self, data):
        query = "INSERT INTO users (email, password) VALUES (%s, %s)"
        db.execute_update(query, (data['email'], data['password']))
        return {"message": "User created"}
```

### DB 접근 방법

다른 모듈을 import하면 안 됩니다. DB는 `db.py`를 통해 접근합니다:

```python
from db import db

# 조회
results = db.execute_query("SELECT * FROM users WHERE id = %s", (user_id,))

# 수정/삽입/삭제
db.execute_update("UPDATE users SET name = %s WHERE id = %s", (name, user_id))
```

---

## 앱 실행

### 개발 모드 실행

```bash
cd backend/src
python app.py
```

또는:

```bash
python -m flask --app app run
```

### 실행 결과

```
✓ Database connected successfully
✓ Registered blueprint: auth
✓ Registered blueprint: quiz
✓ Registered blueprint: wordbook
 * Running on http://127.0.0.1:5000
```

### API 테스트

- **Auth**: `POST http://localhost:5000/api/auth/register`
- **Quiz**: `GET http://localhost:5000/api/quiz/get-quiz`
- **Wordbook**: `GET http://localhost:5000/api/wordbook/get-wordbooks`

---

## 주의사항

✅ **해도 되는 것**:
- 자신의 모듈 폴더(auth, quiz, wordbook)의 파일 수정
- `db.py`를 통해 데이터베이스 접근
- 자신의 모듈에 새로운 파일 추가

❌ **하면 안 되는 것**:
- 다른 모듈 폴더 수정
- 다른 개발자의 모듈을 import해서 사용
- `app.py`, `config.py`, `db.py` 수정 (통합은 PM이 처리)
- 프론트엔드 파일 수정

---

## 병합 시작 (PM만 수행)

모든 개발자가 완료한 후, PM이 다음을 확인하고 실행합니다:

1. 각 모듈의 `__init__.py`에 올바른 blueprint가 정의되어 있는지 확인
2. `app.py` 실행 후 모든 blueprint가 등록되는지 확인
3. API 통합 테스트

`app.py`는 자동으로 모든 모듈을 탐지해서 등록하므로, 추가 작업이 거의 없습니다.

---

## 문제 해결

### Database connection failed 에러

`.env` 파일에서 DB 정보 확인:
- MySQL이 실행 중인지 확인
- 비밀번호가 올바른지 확인
- 데이터베이스가 생성되었는지 확인

### Blueprint 등록이 안 됨

모듈의 `__init__.py`에서 blueprint가 올바르게 정의되었는지 확인:

```python
# 올바른 형태
from flask import Blueprint
bp_name = Blueprint('name', __name__, url_prefix='/api/name')

# __init__.py의 끝에 반드시 추가
from . import routes
```

---

## 프론트엔드 통합

완성된 백엔드가 이미 프론트엔드와 호환되도록 설계되었습니다:
- CORS 활성화 됨 (`http://localhost:3000` 접근 가능)
- API 경로: `/api/{module}/{endpoint}`
- JSON 요청/응답 형식

---

## 문의사항

개발 중 구조 관련 문제가 생기면, 담당자에게 문의하세요.
