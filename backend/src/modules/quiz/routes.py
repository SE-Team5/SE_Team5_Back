# backend/src/modules/quiz/routes.py
from flask import request, jsonify
from . import quiz_bp
from .service import QuizService

service = QuizService()

@quiz_bp.route('/start', methods=['GET'])
@quiz_bp.route('/get-quiz', methods=['GET'])
def get_quiz():
    """새 퀴즈 세트 가져오기"""
    limit = request.args.get('limit', 10, type=int)
    date_filter = request.args.get('filter', 'all', type=str)  # 'today', 'week', 'all'
    user_no = request.args.get('userNo', type=int)
    
    result = service.get_new_quiz(user_no=user_no, limit=limit, date_filter=date_filter)
    return jsonify(result), 200 if result['status'] == 'success' else 400

@quiz_bp.route('/submit', methods=['POST'])
@quiz_bp.route('/submit-answer', methods=['POST'])
def post_result():
    """퀴즈 결과 제출"""
    data = request.get_json(silent=True) or {}
    user_no = data.get('userNo')
    total = data.get('total')
    correct = data.get('correct')

    if not user_no:
        return jsonify({"status": "error", "message": "사용자 정보가 필요합니다."}), 400

    result = service.submit_result(user_no, total, correct)
    return jsonify(result), 201 if result['status'] == 'success' else 400

@quiz_bp.route('/history', methods=['GET'])
def get_history():
    """게임 이력 조회"""
    user_no = request.args.get('userNo', type=int)
    limit = request.args.get('limit', 20, type=int)
    
    if not user_no:
        return jsonify({"status": "error", "message": "사용자 정보가 필요합니다."}), 400
    
    result = service.get_game_history(user_no, limit)
    return jsonify(result), 200 if result['status'] == 'success' else 400

@quiz_bp.route('/statistics', methods=['GET'])
def get_statistics():
    """게임 통계 조회"""
    user_no = request.args.get('userNo', type=int)
    
    if not user_no:
        return jsonify({"status": "error", "message": "사용자 정보가 필요합니다."}), 400
    
    result = service.get_game_statistics(user_no)
    return jsonify(result), 200 if result['status'] == 'success' else 400