"""Auth Routes"""
from flask import request, jsonify
from . import auth_bp
from .service import AuthService

service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    """회원가입"""
    # TODO: 개발자가 구현할 부분
    pass

@auth_bp.route('/login', methods=['POST'])
def login():
    """로그인"""
    # TODO: 개발자가 구현할 부분
    pass

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """로그아웃"""
    # TODO: 개발자가 구현할 부분
    pass
