"""Quiz Routes"""
from flask import request, jsonify
from . import quiz_bp
from .service import QuizService

service = QuizService()

@quiz_bp.route('/get-quiz', methods=['GET'])
def get_quiz():
    """퀴즈 조회"""
    # TODO: 개발자가 구현할 부분
    pass

@quiz_bp.route('/submit-answer', methods=['POST'])
def submit_answer():
    """정답 제출"""
    # TODO: 개발자가 구현할 부분
    pass

@quiz_bp.route('/get-results', methods=['GET'])
def get_results():
    """결과 조회"""
    # TODO: 개발자가 구현할 부분
    pass
