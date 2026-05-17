from flask import request, jsonify
from . import day_wordbook_bp
from .service import DayWordService


def _get_request_data():
    return request.get_json(silent=True) or {}


@day_wordbook_bp.route("", methods=["GET"])
def get_day_words():
    """사용자의 오늘 단어 목록 조회"""
    user_id = request.args.get("user_id", type=int)
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    if not user_id:
        return jsonify({"message": "user_id query parameter is required."}), 400

    result = DayWordService.get_day_words(
        user_id=user_id,
        page=page,
        per_page=per_page
    )
    return jsonify(result), 200


@day_wordbook_bp.route("", methods=["POST"])
def create_day_word():
    """매일 학습할 단어 추가"""
    data = _get_request_data()
    result = DayWordService.create_day_word(data=data)
    status_code = 201 if result and result.get("id") else 400
    return jsonify(result), status_code


@day_wordbook_bp.route("/<int:day_word_id>", methods=["PUT"])
def update_day_word(day_word_id):
    """매일 학습할 단어 수정"""
    data = _get_request_data()
    result = DayWordService.update_day_word(day_word_id=day_word_id, data=data)
    status_code = 200 if result and result.get("id") else 400
    return jsonify(result), status_code


@day_wordbook_bp.route("/<int:day_word_id>", methods=["DELETE"])
def delete_day_word(day_word_id):
    """매일 학습할 단어 삭제"""
    result = DayWordService.delete_day_word(day_word_id=day_word_id)
    status_code = 200 if result.get("status") == "success" else 400
    return jsonify(result), status_code


@day_wordbook_bp.route("/<int:day_word_id>/mark-learned", methods=["POST"])
def mark_word_learned(day_word_id):
    """단어 학습 완료 처리"""
    result = DayWordService.mark_word_learned(day_word_id=day_word_id)
    status_code = 200 if result.get("status") == "success" else 400
    return jsonify(result), status_code
