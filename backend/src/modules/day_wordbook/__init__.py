"""Day Wordbook Module"""
from flask import Blueprint

# Blueprint 정의
day_wordbook_bp = Blueprint('day_wordbook', __name__, url_prefix='/api/day-wordbook')

# routes를 임포트해서 blueprint에 등록
from . import routes
