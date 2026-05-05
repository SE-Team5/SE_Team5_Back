"""Auth Routes"""
from flask import request, jsonify
from . import auth_bp
from .service import AuthService

service = AuthService()


def _get_request_data():
    """안전하게 JSON 요청 본문을 가져오기"""
    data = request.get_json(silent=True)
    return data or {}


def _resolve_username(data):
    """프론트/백엔드 요청 형식을 모두 수용"""
    return data.get('userId') or data.get('username')


def _resolve_push_agree(data):
    """프론트의 pushNotificationEnabled 값을 백엔드 입력으로 변환"""
    if 'pushAgree' in data:
        return data.get('pushAgree')
    return data.get('pushNotificationEnabled')

@auth_bp.route('/signup', methods=['POST'])
@auth_bp.route('/register', methods=['POST'])
@auth_bp.route('/auth/register', methods=['POST'])
def signup():
    """회원가입"""
    try:
        data = _get_request_data()
        
        # 필수 필드 확인
        username = _resolve_username(data)
        nickname = data.get('nickname') or username
        password = data.get('password')
        email = data.get('email')
        push_agree = _resolve_push_agree(data)

        if not username or not password or not email:
            return jsonify({"status": "error", "message": "필수 필드가 누락되었습니다."}), 400
        
        # 서비스 호출
        result = service.register_user(
            user_id=username,
            nickname=nickname,
            password=password,
            email=email,
            push_agree=push_agree  # 현재 DB에 저장하지 않음
        )

        response_body = {
            **result,
            'success': result['status'] == 'success'
        }
        
        if result['status'] == 'success':
            return jsonify(response_body), 201
        else:
            return jsonify(response_body), 400
    
    except Exception as e:
        print(f"Error in signup: {e}")
        return jsonify({"status": "error", "success": False, "message": "회원가입 중 오류가 발생했습니다."}), 500

@auth_bp.route('/email/send-code', methods=['POST'])
@auth_bp.route('/auth/email/send-code', methods=['POST'])
def send_email_code():
    """이메일 인증 코드 발송"""
    try:
        data = _get_request_data()
        
        if 'email' not in data:
            return jsonify({"status": "error", "message": "이메일이 입력되지 않았습니다."}), 400
        
        result = service.send_verification_code(data['email'])
        response_body = {
            **result,
            'success': result['status'] == 'success'
        }
        
        if result['status'] == 'success':
            return jsonify(response_body), 200
        else:
            return jsonify(response_body), 400
    
    except Exception as e:
        print(f"Error in send_email_code: {e}")
        return jsonify({"status": "error", "success": False, "message": "인증 코드 발송 중 오류가 발생했습니다."}), 500

@auth_bp.route('/email/verify', methods=['POST'])
@auth_bp.route('/auth/email/verify', methods=['POST'])
def verify_email():
    """이메일 인증 코드 확인"""
    try:
        data = _get_request_data()
        
        # 필수 필드 확인
        if 'email' not in data or 'code' not in data:
            return jsonify({"status": "error", "message": "이메일과 인증 코드가 필요합니다."}), 400
        
        result = service.verify_email_code(data['email'], data['code'])
        response_body = {
            **result,
            'success': result['status'] == 'success'
        }
        
        if result['status'] == 'success':
            return jsonify(response_body), 200
        else:
            return jsonify(response_body), 400
    
    except Exception as e:
        print(f"Error in verify_email: {e}")
        return jsonify({"status": "error", "success": False, "message": "이메일 인증 중 오류가 발생했습니다."}), 500

@auth_bp.route('/login', methods=['POST'])
@auth_bp.route('/auth/login', methods=['POST'])
def login():
    """로그인"""
    try:
        data = _get_request_data()
        username = _resolve_username(data)

        if not username or 'password' not in data:
            return jsonify({"status": "error", "message": "아이디 또는 비밀번호가 올바르지 않습니다."}), 400

        result = service.login_user(username, data['password'])

        response_body = {
            **result,
            'success': result['status'] == 'success'
        }

        if result['status'] == 'success':
            return jsonify(response_body), 200
        else:
            return jsonify(response_body), 401

    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({"status": "error", "success": False, "message": "로그인 중 오류가 발생했습니다."}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """로그아웃"""
    try:
        auth_header = request.headers.get('Authorization')
        result = service.logout(auth_header)
        response_body = {**result, 'success': result['status'] == 'success'}

        if result['status'] == 'success':
            return jsonify(response_body), 200

        if result['message'] == '유효하지 않은 토큰입니다.':
            return jsonify(response_body), 401

        return jsonify(response_body), 400

    except Exception as e:
        print(f"Error in logout: {e}")
        return jsonify({"status": "error", "success": False, "message": "로그아웃 중 오류가 발생했습니다."}), 500


@auth_bp.route('/user/delete', methods=['POST'])
def delete_user():
    """회원 탈퇴"""
    try:
        auth_header = request.headers.get('Authorization')
        result = service.delete_account(auth_header)
        response_body = {**result, 'success': result['status'] == 'success'}

        if result['status'] == 'success':
            return jsonify(response_body), 200

        # 인증/토큰 관련 오류인 경우 401
        if result['message'] in ('유효하지 않은 요청입니다.', '유효하지 않은 토큰입니다.'):
            return jsonify(response_body), 401

        return jsonify(response_body), 400

    except Exception as e:
        print(f"Error in delete_user: {e}")
        return jsonify({"status": "error", "success": False, "message": "회원 탈퇴 중 오류가 발생했습니다."}), 500

@auth_bp.route('/password/change', methods=['POST'])
@auth_bp.route('/auth/password/change', methods=['POST'])
def change_password():
    """비밀번호 변경"""
    try:
        data = _get_request_data()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')
        auth_header = request.headers.get('Authorization')

        if not current_password or not new_password:
            return jsonify({"status": "error", "message": "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."}), 400

        result = service.change_password(auth_header, current_password, new_password)
        response_body = {
            **result,
            'success': result['status'] == 'success'
        }

        if result['status'] == 'success':
            return jsonify(response_body), 200

        if result['message'] == '현재 비밀번호가 올바르지 않습니다.':
            return jsonify(response_body), 400

        if result['message'] == '인증 토큰이 유효하지 않습니다.':
            return jsonify(response_body), 401

        return jsonify(response_body), 400

    except Exception as e:
        print(f"Error in change_password: {e}")
        return jsonify({"status": "error", "success": False, "message": "비밀번호 변경 중 오류가 발생했습니다."}), 500

@auth_bp.route('/password/reset', methods=['POST'])
@auth_bp.route('/auth/password/reset', methods=['POST'])
def reset_password():
    """비밀번호 초기화"""
    try:
        data = _get_request_data()
        user_id = data.get('id') or data.get('userId') or data.get('username')
        email = data.get('email')

        if not user_id or not email:
            return jsonify({"status": "error", "message": "등록되지 않은 ID 또는 이메일입니다."}), 400

        result = service.reset_password(user_id, email)
        response_body = {
            **result,
            'success': result['status'] == 'success'
        }

        if result['status'] == 'success':
            return jsonify(response_body), 200
        else:
            return jsonify(response_body), 400

    except Exception as e:
        print(f"Error in reset_password: {e}")
        return jsonify({"status": "error", "success": False, "message": "비밀번호 초기화 중 오류가 발생했습니다."}), 500
