from flask import request, jsonify
from . import dashboard_bp
from .service import DashboardService

service = DashboardService()


@dashboard_bp.route('/status', methods=['GET'])
def get_status():
    """Get attendance streak, today's attendance flag and today's quiz completion status for a user."""
    user_no = request.args.get('userNo', type=int)
    if not user_no:
        return jsonify({"status": "error", "message": "userNo 쿼리 파라미터가 필요합니다."}), 400

    result = service.get_user_dashboard_status(user_no)
    return jsonify(result), 200 if result.get('status') == 'success' else 400
