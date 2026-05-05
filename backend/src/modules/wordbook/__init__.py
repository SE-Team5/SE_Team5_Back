"""Wordbook Module"""
from flask import Blueprint

wordbook_bp = Blueprint('wordbook', __name__, url_prefix='/api/wordbook')

from . import routes
