# backend/src/modules/quiz/routes.py
from flask import request, jsonify
from . import quiz_bp
from .service import QuizService

service = QuizService()

@quiz_bp.route('/start', methods=['GET'])
def get_quiz():
    """새 퀴즈 세트 가져오기"""
    result = service.get_new_quiz()
    return jsonify(result), 200 if result['status'] == 'success' else 400

@quiz_bp.route('/submit', methods=['POST'])
def post_result():
    """퀴즈 결과 제출"""
    data = request.get_json()
    user_no = data.get('userNo')
    total = data.get('total')
    correct = data.get('correct')

    if not user_no:
        return jsonify({"status": "error", "message": "사용자 정보가 필요합니다."}), 400

    result = service.submit_result(user_no, total, correct)
    return jsonify(result), 201 if result['status'] == 'success' else 500