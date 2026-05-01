"""Wordbook Module"""
from flask import Blueprint

# Blueprint 정의
wordbook_bp = Blueprint('wordbook', __name__, url_prefix='/api/wordbook')

# routes를 임포트해서 blueprint에 등록
from . import routes
