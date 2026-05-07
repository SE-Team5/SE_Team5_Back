"""Auth Service"""
import os
import smtplib
import re
import random
import string
import time
from email.message import EmailMessage
from secrets import token_urlsafe
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
from .repository import AuthRepository

# 프로젝트 루트의 .env를 읽어서 DB/SMTP 설정을 한 곳에서 관리
ROOT_ENV_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
load_dotenv(ROOT_ENV_PATH)

SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.naver.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM = os.getenv('SMTP_FROM', SMTP_USER)
SMTP_USE_TLS = os.getenv('SMTP_USE_TLS', 'True') == 'True'
SMTP_USE_SSL = os.getenv('SMTP_USE_SSL', 'False') == 'True'

# 이메일 인증 코드 저장소 (메모리)
# 구조: {'email': {'code': '123456', 'created_at': timestamp, 'verified': False}}
email_verification_store = {}

# 인증 코드 유효 시간 (초): 10분
VERIFICATION_CODE_EXPIRY = 600

# 로그인 토큰 저장소 (메모리)
# 구조: {'token': {'user_no': 1, 'user_id': 'abc', 'role': 'user', 'expires_at': timestamp}}
active_login_tokens = {}

# 로그인 토큰 유효 시간 (초): 24시간
LOGIN_TOKEN_EXPIRY = 86400

class AuthService:
    """비즈니스 로직 처리"""
    
    def __init__(self):
        self.repository = AuthRepository()
    
    def is_valid_email(self, email):
        """이메일 형식 검증"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    def is_valid_userid(self, user_id):
        """사용자 ID 검증 (영문, 숫자, 언더스코어만 허용, 4-20자)"""
        pattern = r'^[a-zA-Z0-9_]{4,20}$'
        return re.match(pattern, user_id) is not None
    
    def is_valid_password(self, password):
        """비밀번호 검증 (최소 4자, 권장: 8자 이상)"""
        return len(password) >= 4

    def generate_temporary_password(self, length=12):
        """임시 비밀번호 생성"""
        alphabet = string.ascii_letters + string.digits
        while True:
            password = ''.join(random.choices(alphabet, k=length))
            if any(c.isalpha() for c in password) and any(c.isdigit() for c in password):
                return password
    
    def is_valid_nickname(self, nickname):
        """닉네임 검증 (1-50자)"""
        return 1 <= len(nickname) <= 50

    def is_valid_access_token(self, auth_header):
        """Authorization 헤더에서 Bearer 토큰을 추출하고 유효성 확인"""
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1].strip()
        if not token:
            return None

        self._cleanup_expired_tokens()
        return active_login_tokens.get(token)
    
    def generate_verification_code(self):
        """6자리 인증 코드 생성"""
        return ''.join(random.choices(string.digits, k=6))

    def send_email_via_smtp(self, email, code):
        """SMTP를 이용해 실제 이메일 발송"""
        smtp_host = SMTP_HOST
        smtp_user = SMTP_USER
        smtp_password = SMTP_PASSWORD
        smtp_from = SMTP_FROM

        if not smtp_user or smtp_user == 'your_id@naver.com' or not smtp_password or smtp_password == 'your_app_password':
            return False, "service.py의 SMTP 계정 정보를 먼저 입력해주세요."

        message = EmailMessage()
        message['Subject'] = 'LIVO 이메일 인증 코드'
        message['From'] = smtp_from
        message['To'] = email
        message.set_content(f'''안녕하세요.

LIVO 이메일 인증 코드입니다.

인증 코드: {code}

이 코드는 10분 동안만 유효합니다.
''')

        attempts = [
            {
                'port': SMTP_PORT,
                'use_ssl': SMTP_USE_SSL,
                'use_tls': SMTP_USE_TLS,
            },
            {
                'port': 465,
                'use_ssl': True,
                'use_tls': False,
            },
            {
                'port': 587,
                'use_ssl': False,
                'use_tls': True,
            },
        ]

        last_error = None

        for attempt in attempts:
            try:
                if attempt['use_ssl']:
                    server = smtplib.SMTP_SSL(smtp_host, attempt['port'], timeout=10)
                else:
                    server = smtplib.SMTP(smtp_host, attempt['port'], timeout=10)

                with server:
                    server.ehlo()
                    if attempt['use_tls'] and not attempt['use_ssl']:
                        server.starttls()
                        server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.send_message(message)

                return True, None
            except Exception as e:
                last_error = str(e)
                print(f"Error sending email via SMTP ({attempt['port']}): {e}")

        return False, f"이메일 발송에 실패했습니다. ({last_error})"
    
    def send_verification_code(self, email):
        """이메일로 인증 코드 발송"""
        # 이메일 형식 검증
        if not self.is_valid_email(email):
            return {"status": "error", "message": "올바른 이메일 주소를 입력해주세요."}
        
        # 이미 가입된 이메일 확인
        if self.repository.check_email_exists(email):
            return {"status": "error", "message": "이미 가입된 이메일입니다."}

        # 아직 유효한 인증 코드가 있으면 재발송하지 않음
        existing_verification = email_verification_store.get(email)
        if existing_verification:
            elapsed = time.time() - existing_verification['created_at']
            if elapsed <= VERIFICATION_CODE_EXPIRY and not existing_verification.get('verified', False):
                return {"status": "success", "message": "이미 인증 코드가 발송되었습니다."}
        
        # 인증 코드 생성
        code = self.generate_verification_code()

        # 실제 이메일 발송
        sent, error_message = self.send_email_via_smtp(email, code)
        if not sent:
            return {"status": "error", "message": error_message}

        # 메일 발송 성공 시 메모리에 저장
        email_verification_store[email] = {
            'code': code,
            'created_at': time.time(),
            'verified': False
        }
        
        return {"status": "success", "message": "인증 코드가 이메일로 발송되었습니다."}
    
    def verify_email_code(self, email, code):
        """이메일 인증 코드 검증"""
        # 저장된 인증 정보 확인
        if email not in email_verification_store:
            return {"status": "error", "message": "인증 코드가 없습니다. 다시 요청해주세요."}
        
        verification_info = email_verification_store[email]
        
        # 코드 만료 확인
        elapsed = time.time() - verification_info['created_at']
        if elapsed > VERIFICATION_CODE_EXPIRY:
            del email_verification_store[email]
            return {"status": "error", "message": "인증 코드가 만료되었습니다. 다시 요청해주세요."}
        
        # 코드 일치 확인
        if verification_info['code'] != code:
            return {"status": "error", "message": "잘못된 인증 코드입니다."}
        
        # 인증 완료 표시
        verification_info['verified'] = True
        
        return {"status": "success", "message": "이메일 인증 완료"}
    
    def is_email_verified(self, email):
        """이메일 인증 완료 여부 확인"""
        if email not in email_verification_store:
            return False
        return email_verification_store[email].get('verified', False)
    
    def register_user(self, user_id, nickname, password, email, push_agree=None):
        """회원가입"""
        # 1. 이메일 인증 확인
        if not self.is_email_verified(email):
            return {"status": "error", "message": "이메일 인증이 필요합니다."}
        
        # 2. 입력값 검증
        if not self.is_valid_userid(user_id):
            return {"status": "error", "message": "유효하지 않은 아이디입니다. (4-20자의 영문, 숫자, 언더스코어만 허용)"}
        
        if not self.is_valid_nickname(nickname):
            return {"status": "error", "message": "닉네임은 1-50자여야 합니다."}
        
        if not self.is_valid_password(password):
            return {"status": "error", "message": "비밀번호는 최소 4자 이상이어야 합니다."}
        
        # 3. 중복 확인
        if self.repository.check_userid_exists(user_id):
            return {"status": "error", "message": "이미 존재하는 아이디입니다."}
        
        if self.repository.check_email_exists(email):
            return {"status": "error", "message": "이미 가입된 이메일입니다."}
        
        # 4. 비밀번호 암호화
        # DB의 password_hash 길이(VARCHAR(100))에 맞춰 짧은 해시 포맷을 사용
        password_hash = generate_password_hash(password, method='pbkdf2:sha256:600000', salt_length=8)
        
        # 5. 사용자 생성
        if self.repository.create_user(user_id, nickname, password_hash, email):
            # 6. 인증 정보 정리
            del email_verification_store[email]
            return {"status": "success", "message": "회원가입 완료."}
        else:
            return {"status": "error", "message": "회원가입 중 오류가 발생했습니다. DB 저장에 실패했습니다."}

    def send_temporary_password_via_smtp(self, email, temporary_password):
        """임시 비밀번호를 이메일로 발송"""
        smtp_host = SMTP_HOST
        smtp_user = SMTP_USER
        smtp_password = SMTP_PASSWORD
        smtp_from = SMTP_FROM

        if not smtp_user or smtp_user == 'your_id@naver.com' or not smtp_password or smtp_password == 'your_app_password':
            return False, "service.py의 SMTP 계정 정보를 먼저 입력해주세요."

        message = EmailMessage()
        message['Subject'] = 'LIVO 임시 비밀번호 안내'
        message['From'] = smtp_from
        message['To'] = email
        message.set_content(f'''안녕하세요.

LIVO 비밀번호 초기화가 완료되었습니다.

임시 비밀번호: {temporary_password}

로그인 후 반드시 새 비밀번호로 변경해주세요.
''')

        attempts = [
            {
                'port': SMTP_PORT,
                'use_ssl': SMTP_USE_SSL,
                'use_tls': SMTP_USE_TLS,
            },
            {
                'port': 465,
                'use_ssl': True,
                'use_tls': False,
            },
            {
                'port': 587,
                'use_ssl': False,
                'use_tls': True,
            },
        ]

        last_error = None

        for attempt in attempts:
            try:
                if attempt['use_ssl']:
                    server = smtplib.SMTP_SSL(smtp_host, attempt['port'], timeout=10)
                else:
                    server = smtplib.SMTP(smtp_host, attempt['port'], timeout=10)

                with server:
                    server.ehlo()
                    if attempt['use_tls'] and not attempt['use_ssl']:
                        server.starttls()
                        server.ehlo()
                    server.login(smtp_user, smtp_password)
                    server.send_message(message)

                return True, None
            except Exception as e:
                last_error = str(e)
                print(f"Error sending temporary password via SMTP ({attempt['port']}): {e}")

        return False, f"임시 비밀번호 이메일 발송에 실패했습니다. ({last_error})"

    def reset_password(self, user_id, email):
        """비밀번호 초기화"""
        if not user_id or not email:
            return {"status": "error", "message": "등록되지 않은 ID 또는 이메일입니다."}

        user = self.repository.get_user_by_userid_and_email(user_id, email)
        if not user:
            exists_by_id = self.repository.get_user_by_userid(user_id)
            exists_by_email = self.repository.get_user_by_email(email)

            if exists_by_id and not exists_by_email:
                return {"status": "error", "message": "입력한 ID와 이메일이 일치하지 않습니다."}

            return {"status": "error", "message": "등록되지 않은 ID 또는 이메일입니다."}

        temporary_password = self.generate_temporary_password()
        password_hash = generate_password_hash(temporary_password, method='pbkdf2:sha256:600000', salt_length=8)

        if not self.repository.update_password(user_id, password_hash):
            return {"status": "error", "message": "비밀번호 초기화 중 오류가 발생했습니다."}

        sent, error_message = self.send_temporary_password_via_smtp(email, temporary_password)
        if not sent:
            return {"status": "error", "message": error_message}

        return {"status": "success", "message": "임시 비밀번호가 이메일로 발송되었습니다."}

    def _cleanup_expired_tokens(self):
        """만료된 로그인 토큰 제거"""
        now = time.time()
        expired_tokens = [token for token, info in active_login_tokens.items() if info['expires_at'] <= now]
        for token in expired_tokens:
            del active_login_tokens[token]

    def _generate_login_token(self, user):
        """로그인 토큰 생성"""
        self._cleanup_expired_tokens()

        token = token_urlsafe(32)
        active_login_tokens[token] = {
            'user_no': user['user_no'],
            'user_id': user['user_id'],
            'role': user['role'].lower(),
            'expires_at': time.time() + LOGIN_TOKEN_EXPIRY
        }
        return token

    def login_user(self, user_id, password):
        """로그인"""
        if not user_id or not password:
            return {"status": "error", "message": "아이디 또는 비밀번호가 올바르지 않습니다."}

        user = self.repository.get_user_by_userid(user_id)

        if not user:
            return {"status": "error", "message": "아이디 또는 비밀번호가 올바르지 않습니다."}

        if not check_password_hash(user['password_hash'], password):
            return {"status": "error", "message": "아이디 또는 비밀번호가 올바르지 않습니다."}

        token = self._generate_login_token(user)

        return {
            "status": "success",
            "success": True,
            "token": token,
            "role": user['role'].lower(),
            "user": {
                "id": user['user_no'],
                "username": user['user_id'],
                "nickname": user['user_nickname'],
                "email": user['email'],
                "role": user['role']
            }
        }

    def change_password(self, auth_header, current_password, new_password):
        """비밀번호 변경"""
        token_info = self.is_valid_access_token(auth_header)
        if not token_info:
            return {"status": "error", "message": "인증 토큰이 유효하지 않습니다."}

        if not current_password or not new_password:
            return {"status": "error", "message": "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."}

        if not self.is_valid_password(new_password):
            return {"status": "error", "message": "비밀번호는 최소 4자 이상이어야 합니다."}

        user = self.repository.get_user_by_userid(token_info['user_id'])
        if not user:
            return {"status": "error", "message": "인증 토큰이 유효하지 않습니다."}

        if not check_password_hash(user['password_hash'], current_password):
            return {"status": "error", "message": "현재 비밀번호가 올바르지 않습니다."}

        new_password_hash = generate_password_hash(new_password, method='pbkdf2:sha256:600000', salt_length=8)
        if not self.repository.update_password(user['user_id'], new_password_hash):
            return {"status": "error", "message": "비밀번호 변경 중 오류가 발생했습니다."}

        return {"status": "success", "message": "비밀번호가 성공적으로 변경되었습니다."}

    def logout(self, auth_header):
        """로그아웃: 헤더의 토큰을 무효화"""
        token_info = self.is_valid_access_token(auth_header)
        if not token_info:
            return {"status": "error", "message": "유효하지 않은 토큰입니다."}

        # 토큰 자체를 삭제하여 무효화
        token = None
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()

        if token and token in active_login_tokens:
            try:
                del active_login_tokens[token]
            except KeyError:
                pass

        return {"status": "success", "message": "로그아웃이 완료되었습니다."}

    def delete_account(self, auth_header):
        """회원 탈퇴: 토큰 검증 후 DB에서 사용자 삭제 및 관련 토큰 무효화"""
        token_info = self.is_valid_access_token(auth_header)
        if not token_info:
            return {"status": "error", "message": "유효하지 않은 요청입니다."}

        user_no = token_info.get('user_no')
        if not user_no:
            return {"status": "error", "message": "유효하지 않은 요청입니다."}

        # DB에서 사용자 삭제
        try:
            deleted = self.repository.delete_user_by_user_no(user_no)
        except Exception as e:
            print(f"Error deleting user {user_no}: {e}")
            return {"status": "error", "message": "회원 탈퇴 중 오류가 발생했습니다."}

        if not deleted:
            return {"status": "error", "message": "회원 탈퇴에 실패했습니다."}

        # 해당 사용자의 모든 활성 토큰 무효화
        tokens_to_remove = [t for t, info in active_login_tokens.items() if info.get('user_no') == user_no]
        for t in tokens_to_remove:
            try:
                del active_login_tokens[t]
            except KeyError:
                pass

        return {"status": "success", "message": "회원 탈퇴가 완료되었습니다."}
