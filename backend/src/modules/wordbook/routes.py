"""Wordbook Routes"""
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from service import WordService

words_bp = Blueprint("words", __name__, url_prefix="/api/v1/words")


# ──────────────────────────────────────────
# 관리자 전용 데코레이터
# JWT claims에 role 필드가 "admin"인 경우만 통과
# ──────────────────────────────────────────
def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()  # JWT 전체 payload 조회
        if claims.get("role") != "admin":
            return jsonify({"message": "관리자만 접근할 수 있습니다."}), 403
        return fn(*args, **kwargs)
    return wrapper


# ──────────────────────────────────────────
# 1. 단어장 전체 목록 조회(페이징 + 필터링) - 일반 유저 접근 가능
# ──────────────────────────────────────────
@words_bp.route("", methods=["GET"])
@jwt_required()
def get_words():
    user_id = get_jwt_identity()

    # 쿼리 파라미터 파싱
    page        = request.args.get("page", 1, type=int)
    per_page    = request.args.get("per_page", 20, type=int)
    sort        = request.args.get("sort", "created_at_desc")   # 정렬 기준
    start_date  = request.args.get("start_date")                # YYYY-MM-DD
    end_date    = request.args.get("end_date")                  # YYYY-MM-DD
    keyword     = request.args.get("keyword")                   # 단어/뜻 검색

    result = WordService.get_words(
        user_id=user_id,
        page=page,
        per_page=per_page,
        sort=sort,
        start_date=start_date,
        end_date=end_date,
        keyword=keyword,
    )
    return jsonify(result), 200


# ──────────────────────────────────────────
# 2. 단어 추가 - 관리자 전용
# ──────────────────────────────────────────
@words_bp.route("", methods=["POST"])
@admin_required
def create_word():
    data = request.get_json(silent=True) or {}

    # 필수 필드 검증
    if not data.get("term") or not data.get("definition"):
        return jsonify({"message": "term과 definition은 필수입니다."}), 400

    # 관리자는 특정 user 소유가 아니므로 user_id를 넘기지 않음
    result = WordService.create_word(data=data)
    return jsonify(result), 201


# ──────────────────────────────────────────
# 3. 단어 수정 - 관리자 전용
# ──────────────────────────────────────────
@words_bp.route("/<int:word_id>", methods=["PUT"])
@admin_required
def update_word(word_id):
    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({"message": "수정할 데이터가 없습니다."}), 400

    result = WordService.update_word(word_id=word_id, data=data)
    return jsonify(result), 200


# ──────────────────────────────────────────
# 4. 단어 삭제 - 관리자 전용
# ──────────────────────────────────────────
@words_bp.route("/<int:word_id>", methods=["DELETE"])
@admin_required
def delete_word(word_id):
    WordService.delete_word(word_id=word_id)
    return jsonify({"message": "삭제되었습니다."}), 200


# ──────────────────────────────────────────
# 5. DAY 단어장 미학습 단어 랜덤 제공 - 일반 유저 접근 가능
# ──────────────────────────────────────────
@words_bp.route("/daily-random", methods=["GET"])
@jwt_required()
def get_daily_random_words():
    user_id = get_jwt_identity()
    result = WordService.get_daily_random_words(user_id=user_id)
    return jsonify(result), 200


# ──────────────────────────────────────────
# 6. 단어 상태 단건 수정 (즐겨찾기 / 암기여부 토글) - 일반 유저 접근 가능
# ──────────────────────────────────────────
@words_bp.route("/<int:word_id>/status", methods=["PATCH"])
@jwt_required()
def update_word_status(word_id):
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    if "is_memorized" not in data and "is_bookmarked" not in data:
        return jsonify({"message": "is_memorized 또는 is_bookmarked 필드가 필요합니다."}), 400

    result = WordService.update_word_status(user_id=user_id, word_id=word_id, data=data)
    return jsonify(result), 200


# ──────────────────────────────────────────
# 7. 학습 이력 일괄 갱신 배치 처리
# ──────────────────────────────────────────
@words_bp.route("/study-records", methods=["POST"])
@jwt_required()
def batch_update_study_records():
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}

    word_ids = data.get("word_ids")
    if not word_ids or not isinstance(word_ids, list):
        return jsonify({"message": "word_ids 배열이 필요합니다."}), 400

    result = WordService.batch_update_study_records(user_id=user_id, word_ids=word_ids)
    return jsonify(result), 200