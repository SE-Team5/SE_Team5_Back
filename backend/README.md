# 백엔드 API 서버

Flask와 MySQL을 사용한 단어 퀴즈 백엔드 API 서버입니다.

## 기술 스택

- **Framework**: Flask 2.3.3
- **Database**: MySQL
- **Language**: Python 3.8+
- **CORS**: Flask-CORS

## 프로젝트 구조

각 기능은 독립적인 모듈로 구성되어 있으며, 3개의 팀이 병렬로 개발할 수 있습니다.

```
backend/
├── src/
│   ├── app.py                      # 앱 진입점
│   ├── config.py                   # 설정 로드
│   ├── db.py                       # DB 연결 관리
│   └── modules/
│       ├── auth/                   # 인증 모듈
│       ├── quiz/                   # 퀴즈 모듈
│       └── wordbook/               # 단어장 모듈
├── .env                            # 환경변수
├── requirements.txt                # 패키지 의존성
└── __main__.py                     # 실행 엔트리 포인트
```

## 빠른 시작

전체 설정은 [START_GUIDE.md](../START_GUIDE.md)를 참고하세요.

```bash
# 가상환경 활성화
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate      # Windows

# 패키지 설치
pip install -r requirements.txt

# 앱 실행
python -m backend
```

## API 엔드포인트

### 인증 (Auth)
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 퀴즈 (Quiz)
- `GET /api/quiz/get-quiz` - 퀴즈 조회
- `POST /api/quiz/submit-answer` - 정답 제출
- `GET /api/quiz/get-results` - 결과 조회

### 단어장 (Wordbook)
- `GET /api/wordbook/get-wordbooks` - 단어장 목록
- `POST /api/wordbook/create-wordbook` - 단어장 생성
- `POST /api/wordbook/add-word` - 단어 추가
- `DELETE /api/wordbook/delete-word` - 단어 삭제

## 개발자 가이드

### 담당 모듈만 수정

각 개발자는 할당된 모듈 폴더만 작업합니다:

```
modules/
├── auth/          # 개발자 1
├── quiz/          # 개발자 2
└── wordbook/      # 개발자 3
```

### 모듈 구조

각 모듈은 동일한 구조를 가집니다:

```
modules/your_module/
├── __init__.py             # Blueprint 정의 (수정 금지)
├── routes.py               # 라우트 구현
├── service.py              # 비즈니스 로직
└── repository.py           # DB 쿼리
```

### 데이터베이스 접근

`db.py`를 통해 중앙 관리되는 DB에 접근합니다:

```python
from db import db

# SELECT 쿼리
results = db.execute_query("SELECT * FROM table WHERE id = %s", (id,))

# INSERT/UPDATE/DELETE 쿼리
db.execute_update("UPDATE table SET col = %s WHERE id = %s", (value, id))
```

## 주의사항

- ❌ 다른 개발자의 모듈을 직접 import하지 마세요
- ❌ `app.py`, `config.py`, `db.py` 파일을 수정하지 마세요
- ✅ 자신의 모듈 폴더 내에서만 작업하세요
- ✅ DB 접근은 `db.py`를 통해서만 하세요

## 환경변수 설정

`.env` 파일에서 다음을 설정합니다:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=wordquiz
DB_PORT=3306
FLASK_ENV=development
FLASK_PORT=5000
DEBUG=True
```

## 병합 프로세스

1. 각 개발자가 자신의 모듈 완성
2. PM이 모든 모듈이 정상 로드되는지 확인
3. `app.py`가 자동으로 모든 blueprint 등록
4. 통합 테스트

추가 통합 작업이 필요 없습니다!

## 문제 해결

### Database connection 에러
- MySQL이 실행 중인지 확인
- `.env` 파일의 DB 정보 확인
- 데이터베이스가 생성되었는지 확인

### Blueprint 등록 안 됨
- 모듈의 `__init__.py`에서 `{module_name}_bp` 형태로 blueprint 정의 확인
- `from . import routes` 추가 확인

## 라이센스

Internal Project
