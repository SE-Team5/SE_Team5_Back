"""Pet Routes"""
from flask import request, jsonify
from . import pet_bp
from .service import PetService

service = PetService()


@pet_bp.route('/status', methods=['GET'])
def get_pet_status():
    """펫 상태 조회"""
    user_no = request.args.get('userNo', type=int)
    if not user_no:
        return jsonify({"status": "error", "message": "userNo 쿼리 파라미터가 필요합니다."}), 400

    result = service.get_pet_status(user_no)
    return jsonify(result), 200 if result.get('status') == 'success' else 400


@pet_bp.route('/update', methods=['POST'])
def update_pet_level():
    """펫 레벨 업데이트"""
    data = request.get_json(silent=True) or {}
    user_no = data.get('userNo')
    is_studied = data.get('isStudied', False)

    if not user_no:
        return jsonify({"status": "error", "message": "userNo가 필요합니다."}), 400

    result = service.update_pet_level(user_no=user_no, is_studied=is_studied)
    return jsonify(result), 200 if result.get('status') == 'success' else 400


@pet_bp.route('/cheer', methods=['GET'])
def get_cheer_message():
    """GAI 응원 메시지 조회"""
    result = service.get_cheer_message()
    return jsonify(result), 200 if result.get('status') == 'success' else 500
