"""Pet Module"""
from flask import Blueprint

pet_bp = Blueprint('pet', __name__, url_prefix='/api/pet')

from . import routes
