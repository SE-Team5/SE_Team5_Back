"""Quiz Module"""
from flask import Blueprint

# Blueprint 정의
quiz_bp = Blueprint('quiz', __name__, url_prefix='/api/quiz')

# routes를 임포트해서 blueprint에 등록
from . import routes
