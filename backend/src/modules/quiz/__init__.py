# backend/src/modules/quiz/__init__.py
from flask import Blueprint

quiz_bp = Blueprint('quiz', __name__, url_prefix='/api/quiz')

from . import routes