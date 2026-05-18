"""Wordbook Routes"""
from flask import request, jsonify
# from flask import Blueprint
from . import wordbook_bp
from .service import WordService

# wordbook_bp = Blueprint("wordbook", __name__, url_prefix="/api/v1/words")

# ==========================================
# 🔥 [기존 기능 유지] 관리자 및 일반 단어 기본 CRUD
# ==========================================

@wordbook_bp.route("", methods=["GET"])
def get_words_admin():
    """기존 검색 및 관리자용 전체 조회 엔드포인트 유지"""
    # 기존 파라미터 파싱
    user_id = getattr(current_user, 'user_no', None) or getattr(current_user, 'id', None)
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    sort = request.args.get("sort", "created_at_desc")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")
    keyword = request.args.get("keyword")

    res = WordService.get_words(
        user_id=user_id,
        page=page,
        per_page=per_page,
        sort=sort,
        start_date=start_date,
        end_date=end_date,
        keyword=keyword
    )
    return jsonify(res), 200


@wordbook_bp.route("", methods=["POST"])
def create_word():
    """관리자용 단어 생성"""
    data = request.get_json() or {}
    res = WordService.create_word(data)
    if "message" in res and ("필수입니다" in res["message"] or "존재합니다" in res["message"]):
        return jsonify(res), 400
    return jsonify(res), 201


@wordbook_bp.route("/<int:word_id>", methods=["PUT"])
def update_word(word_id):
    """관리자용 단어 수정"""
    data = request.get_json() or {}
    res = WordService.update_word(word_id, data)
    if "message" in res and "찾을 수 없습니다" in res["message"]:
        return jsonify(res), 404
    return jsonify(res), 200


@wordbook_bp.route("/<int:word_id>", methods=["DELETE"])
def delete_word(word_id):
    """관리자용 단어 삭제"""
    res = WordService.delete_word(word_id)
    if res.get("status") == "success":
        return jsonify(res), 200
    return jsonify(res), 404


@wordbook_bp.route("/daily-random", methods=["GET"])
def get_daily_random():
    """퀴즈 또는 메인 뷰용 데일리 랜덤 단어 추출"""
    limit = request.args.get("limit", 10, type=int)
    user_id = getattr(current_user, 'user_no', None) or getattr(current_user, 'id', None)
    res = WordService.get_daily_random_words(user_id=user_id, limit=limit)
    return jsonify(res), 200


@wordbook_bp.route("/<int:word_id>/status", methods=["PATCH"])
def update_word_status_legacy(word_id):
    """기존 레거시 뷰/Day 단어장에서 사용하던 상태 변경 유지"""
    user_id = getattr(current_user, 'user_no', None) or getattr(current_user, 'id', None)
    data = request.get_json() or {}
    res = WordService.update_word_status(user_id, word_id, data)
    if "message" in res and "찾을 수 없습니다" in res["message"]:
        return jsonify(res), 404
    return jsonify(res), 200


@wordbook_bp.route("/study-records/batch", methods=["POST"])
def batch_update_records():
    """기존 배치 학습 이력 업데이트 유지"""
    user_id = getattr(current_user, 'user_no', None) or getattr(current_user, 'id', None)
    data = request.get_json() or {}
    word_ids = data.get("word_ids", [])
    res = WordService.batch_update_study_records(user_id, word_ids)
    if "message" in res and "존재하지 않는" in res["message"]:
        return jsonify(res), 400
    return jsonify(res), 200


# ==========================================
# 🚀 [신규 기능 탑재] 메인 단어장 고도화 API 세트
# ==========================================

@wordbook_bp.route("/main-list", methods=["GET"])
def get_main_wordbook_list():
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int)
    page = request.args.get("page", 1, type=int)
    size = request.args.get("size", 20, type=int)
    date_filter = request.args.get("dateFilter")     
    status_filter = request.args.get("statusFilter") 
    sort = request.args.get("sort", "latest")        

    result = WordService.get_main_wordbook_list(
        user_id=user_id, page=page, size=size,
        date_filter=date_filter, status_filter=status_filter, sort=sort
    )
    return jsonify(result), 200

@wordbook_bp.route("/detail/<int:word_id>", methods=["GET"])
def get_word_detail(word_id):
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int)
    result = WordService.get_word_detail(word_id, user_id)
    if not result:
        return jsonify({"message": "단어를 찾을 수 없습니다."}), 404
    return jsonify(result), 200

@wordbook_bp.route("/statistics", methods=["GET"])
def get_words_statistics():
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int)
    result = WordService.get_words_statistics(user_id)
    return jsonify(result), 200

@wordbook_bp.route("/toggle/<int:word_id>", methods=["PATCH"])
def toggle_word_status_main(word_id):
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id") or data.get("userId")
    if not user_id:
        return jsonify({"message": "user_id가 필요합니다."}), 400
    result = WordService.toggle_word_status(user_id, word_id, data)
    return jsonify(result), 200