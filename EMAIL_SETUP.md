# 📧 이메일 발송 기능 설정 가이드

## 개요
LIVO는 2000시간 이상 미활동 사용자에게 학습 권장 이메일을 자동으로 발송합니다.

## 설정 단계

### 1️⃣ 필수 패키지 설치
```bash
cd Back/backend
pip install -r requirements.txt
```

### 2️⃣ Gmail 설정 (권장)

#### Step 1: Gmail 계정에서 앱 비밀번호 생성
1. [Google Account](https://myaccount.google.com/) 접속
2. 좌측 메뉴에서 "보안" 클릭
3. "2단계 인증" 활성화 (이미 활성화된 경우 생략)
4. "앱 비밀번호" 클릭
5. "메일"과 "Windows 컴퓨터" 선택
6. 생성된 16자리 비밀번호 복사

#### Step 2: .env 파일 설정
```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=noreply@livo.com

# Scheduler Configuration
SCHEDULER_ENABLED=True
INACTIVITY_HOURS=2000
```

### 3️⃣ 다른 이메일 서비스 설정

#### Outlook/Hotmail
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@outlook.com
MAIL_PASSWORD=your-password
```

#### Naver Mail
```env
MAIL_SERVER=smtp.naver.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@naver.com
MAIL_PASSWORD=your-password
```

### 4️⃣ 스케줄러 설정

#### 활성화/비활성화
```env
# 활성화
SCHEDULER_ENABLED=True

# 비활성화
SCHEDULER_ENABLED=False
```

#### 미활동 시간 설정
```env
# 기본값: 2000시간 (약 83일)
INACTIVITY_HOURS=2000

# 예: 720시간 (30일)
INACTIVITY_HOURS=720

# 예: 168시간 (7일)
INACTIVITY_HOURS=168
```

## 실행 방법

### 백엔드 서버 시작
```bash
cd Back/backend
python __main__.py
```

서버 시작 시 아래 메시지가 표시됩니다:
```
✓ Scheduler initialized
✓ Added inactivity check job (daily at 09:00)
```

### 즉시 테스트 (선택사항)
테스트 목적으로 즉시 이메일을 발송하려면:

```python
from src.scheduler import TaskScheduler
TaskScheduler.check_and_email_inactive_users()
```

## 이메일 발송 일정

- **자동 실행**: 매일 오전 09:00 (UTC 기준)
- **발송 대상**: 2000시간 이상 미활동 사용자
- **최대 발송량**: 회차당 최대 100명
- **중복 발송 방지**: 발송 후 사용자 정보 업데이트

## 문제 해결

### 이메일이 발송되지 않음

**1. Gmail 2단계 인증 확인**
- Gmail 보안 설정 페이지에서 2단계 인증 활성화 확인
- 앱 비밀번호가 올바르게 설정되었는지 확인

**2. 방화벽/포트 확인**
```bash
# 587 포트 연결 테스트
telnet smtp.gmail.com 587
```

**3. 로그 확인**
```
✗ Failed to send email to user@example.com: Connection refused
```

**4. 환경 변수 확인**
```python
from config import Config
print(Config.MAIL_SERVER)  # smtp.gmail.com 확인
print(Config.MAIL_PORT)    # 587 확인
print(Config.MAIL_USERNAME) # 이메일 주소 확인
```

### 스케줄러가 실행되지 않음

**확인 사항:**
```env
# SCHEDULER_ENABLED가 True인지 확인
SCHEDULER_ENABLED=True
```

**로그 확인:**
```
✓ Scheduler initialized  ← 이 메시지가 나타나야 함
✓ Added inactivity check job
```

## 이메일 템플릿 커스터마이징

`backend/src/modules/email/service.py`의 `send_inactivity_email()` 메서드에서 HTML 내용을 수정할 수 있습니다.

```python
html_content = f"""
<!DOCTYPE html>
<html>
    <!-- 여기서 이메일 템플릿 수정 -->
</html>
"""
```

## 보안 권장사항

⚠️ **주의: 프로덕션 환경에서는 다음을 따르세요**

1. **민감한 정보 보호**
   - `.env` 파일을 `.gitignore`에 추가
   - 절대 GitHub에 올리지 않기
   - 환경 변수를 사용하여 설정 관리

2. **앱 비밀번호 사용**
   - 실제 Gmail 비밀번호 대신 앱 비밀번호 사용
   - 정기적으로 앱 비밀번호 재생성

3. **발송 제한**
   - Gmail: 하루 1000개 이메일 제한
   - Outlook: 하루 10,000개 이메일 제한

4. **모니터링**
   - 발송 실패 로그 정기적 확인
   - 바운스 이메일 처리

## 참고 사항

- 이메일 발송은 비동기로 처리되어 서버 성능에 영향 없음
- 발송 실패는 자동으로 로깅됨
- 동일 사용자에게 24시간 내 중복 발송 방지
