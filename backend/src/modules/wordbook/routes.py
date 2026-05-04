from flask import request, jsonify
from . import wordbook_bp
from .service import WordService


def _get_request_data():
    return request.get_json(silent=True) or {}


@wordbook_bp.route("", methods=["GET"])
def get_words():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    sort = request.args.get("sort", "created_at_desc")
    keyword = request.args.get("keyword")

    result = WordService.get_words(
        user_id=None,
        page=page,
        per_page=per_page,
        sort=sort,
        start_date=None,
        end_date=None,
        keyword=keyword,
    )
    return jsonify(result), 200


@wordbook_bp.route("", methods=["POST"])
def create_word():
    data = _get_request_data()
    result = WordService.create_word(data=data)
    status_code = 201 if result and result.get("id") else 400
    return jsonify(result), status_code


@wordbook_bp.route("/<int:word_id>", methods=["PUT"])
def update_word(word_id):
    data = _get_request_data()
    result = WordService.update_word(word_id=word_id, data=data)
    status_code = 200 if result and result.get("id") else 400
    return jsonify(result), status_code


@wordbook_bp.route("/<int:word_id>", methods=["DELETE"])
def delete_word(word_id):
    result = WordService.delete_word(word_id=word_id)
    status_code = 200 if result.get("status") == "success" else 400
    return jsonify(result), status_code


@wordbook_bp.route("/daily-random", methods=["GET"])
def get_daily_random_words():
    limit = request.args.get("limit", 10, type=int)
    result = WordService.get_daily_random_words(user_id=None, limit=limit)
    return jsonify(result), 200


@wordbook_bp.route("/<int:word_id>/status", methods=["PATCH"])
def update_word_status(word_id):
    data = _get_request_data()
    user_id = data.get("user_id") or data.get("userId")

    if not user_id:
        return jsonify({"message": "user_id가 필요합니다."}), 400

    result = WordService.update_word_status(user_id=user_id, word_id=word_id, data=data)
    return jsonify(result), 200 if result else 400


@wordbook_bp.route("/study-records", methods=["POST"])
def batch_update_study_records():
    data = _get_request_data()
    user_id = data.get("user_id") or data.get("userId")
    word_ids = data.get("word_ids")

    if not user_id:
        return jsonify({"message": "user_id가 필요합니다."}), 400

    if not word_ids or not isinstance(word_ids, list):
        return jsonify({"message": "word_ids 배열이 필요합니다."}), 400

    result = WordService.batch_update_study_records(user_id=user_id, word_ids=word_ids)
    return jsonify(result), 200