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

루트 [/.env.example](.env.example) 를 복사해서 [/.env](.env) 를 만들고, 예시 파일에 표시된 수정 부분만 바꾸면 됩니다.

DB_PASSWORD=your_password_here	#본인의 DB 비밀번호
DB_NAME=RIVO				#DB의 이름

SMTP_USER=your_naver_email@naver.com		#인증 메일을 송신할 이메일	
SMTP_PASSWORD=your_naver_app_password		#네이버 앱 비밀번호 (계정 비밀번호랑 다릅니다.)

이렇게 표시된 부분만 적절히 바꾸면 됩니다.

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


# DB 관련 프롬프트를 작성할 때는 [database/RIVO_schema.sql](database/RIVO_schema.sql) 을 참고하도록 하면 됩니다. 노션에 올려둔 DB랑 똑같이 만들어놓은 .sql 파일입니다.
