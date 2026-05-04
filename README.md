# 초기 설정법

1. 루트 [/.env.example](.env.example) 를 복사해 [/.env](.env) 를 만듭니다.
2. [/.env](.env) 에 DB 정보와 SMTP 정보를 입력합니다.
3. 백엔드 의존성을 설치합니다.

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## 환경 변수

루트 [/.env.example](.env.example) 를 복사해서 [/.env](.env) 를 만들고, 아래 항목만 수정하면 됩니다.

| 항목 | 수정 내용 | 비고 |
| --- | --- | --- |
| `DB_PASSWORD` | 본인의 MySQL 비밀번호 | DB 접속 정보 |
| `DB_NAME` | `RIVO` 유지 | DB 이름 고정 |
| `SMTP_USER` | 본인 네이버 이메일 | 인증 메일 발송 계정 |
| `SMTP_PASSWORD` | 본인 네이버 앱 비밀번호 | 계정 비밀번호와 다름 |

메일 인증은 네이버 이메일로만 가능합니다.

## 서버 실행하는 법

백엔드:
프로젝트 루트 폴더에서
```bash
cd backend
python -m flask --app src.app run
```

프론트엔드:
프로젝트 루트 폴더에서
```bash
npm install
npm run dev
```


DB 관련 프롬프트를 작성할 때는 [database/RIVO_schema.sql](database/RIVO_schema.sql) 을 참고하면 됩니다. 노션에 올려둔 DB 기준으로 만든 `.sql` 파일입니다.
