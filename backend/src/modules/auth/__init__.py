"""Auth Module"""
from flask import Blueprint

# Blueprint 정의
auth_bp = Blueprint('auth', __name__, url_prefix='/api')

# routes를 임포트해서 blueprint에 등록
from . import routes
