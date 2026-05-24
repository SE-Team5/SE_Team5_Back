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
    # current_user 대신 쿼리 파라미터에서 user_id 추출 (프론트 통신 방식)
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int)
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

@wordbook_bp.route("/gemini-status", methods=["GET"])
def get_gemini_status():
    result = WordService.get_gemini_status()
    return jsonify(result), 200

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
    # current_user 대신 쿼리 파라미터에서 추출
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int)
    res = WordService.get_daily_random_words(user_id=user_id, limit=limit)
    return jsonify(res), 200


@wordbook_bp.route("/<int:word_id>/status", methods=["PATCH"])
def update_word_status_legacy(word_id):
    """기존 레거시 뷰/Day 단어장에서 사용하던 상태 변경 유지"""
    data = request.get_json() or {}
    # 파라미터 또는 JSON 바디에서 유저 ID 추출
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int) or data.get("userId")
    
    res = WordService.update_word_status(user_id, word_id, data)
    if "message" in res and "찾을 수 없습니다" in res["message"]:
        return jsonify(res), 404
    return jsonify(res), 200


@wordbook_bp.route("/study-records/batch", methods=["POST"])
def batch_update_records():
    """기존 배치 학습 이력 업데이트 유지"""
    data = request.get_json() or {}
    # 파라미터 또는 JSON 바디에서 유저 ID 추출
    user_id = request.args.get("user_id", type=int) or request.args.get("userId", type=int) or data.get("userId")
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

@wordbook_bp.route('/toggle/<int:word_id>', methods=['PATCH'])
def toggle_word_status(word_id):
    """단어 즐겨찾기 및 학습 상태 토글"""
    data = request.get_json(silent=True) or {}
    
    # 1. userId 누락 없이 추출 (URL 쿼리 파라미터 또는 JSON 바디)
    user_id = request.args.get("userId", type=int) or request.args.get("user_id", type=int) or data.get("userId")
    
    if not user_id:
        return jsonify({"message": "사용자 정보(userId)가 필요합니다."}), 400

    # 2. 서비스 계층 호출
    result = WordService.toggle_word_status(user_id=user_id, word_id=word_id, data=data)
    
    if result.get("status") == "error":
        return jsonify({"message": result.get("message")}), 400
    
    # 3. 프론트엔드가 기대하는 camelCase 포맷으로 응답
    return jsonify({
        "wordId": word_id,
        "isFavorite": result.get("isFavorite", False),
        "isMemorized": result.get("isMemorized", False)
    }), 200