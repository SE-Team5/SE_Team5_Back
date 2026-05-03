# backend/src/modules/quiz/__init__.py
from flask import Blueprint

quiz_bp = Blueprint('quiz', __name__)

from . import routes