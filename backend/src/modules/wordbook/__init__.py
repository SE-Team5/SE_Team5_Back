"""Wordbook Module"""
from flask import Blueprint

wordbook_bp = Blueprint('wordbook', __name__, url_prefix='/api/v1/words')

from . import routes
