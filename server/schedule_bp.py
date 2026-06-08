from flask import Blueprint, jsonify, request

from auth_repository import active_token, find_user_by_id
from json_store import read_json
from jwt_service import decode_jwt

schedule_bp = Blueprint("schedule_bp", __name__)


def current_user():
    token = str(request.headers.get("Authorization") or "").replace("Bearer ", "", 1)
    try:
        payload = decode_jwt(token)
        if not active_token(payload.get("jti")):
            return None
        return find_user_by_id(payload.get("sub"))
    except Exception:
        return None


def mock_courses():
    return read_json("courses.json", [])


@schedule_bp.post("/api/schedule")
def schedule():
    user = current_user()
    schedule_data = (user or {}).get("scheduleData") or {}
    courses = schedule_data.get("courses") or []
    if user and user.get("zjuAuthenticated") and courses:
        return jsonify({
            "success": True,
            "source": "zju",
            "courses": courses,
            "semester": schedule_data.get("termInfo", {}).get("semester") or "当前学期",
            "termInfo": schedule_data.get("termInfo"),
            "raw": schedule_data.get("raw") or {},
        })

    return jsonify({
        "success": True,
        "source": "mock",
        "courses": mock_courses(),
        "semester": "模拟学期",
        "raw": {"xm": (user or {}).get("name") or "浙大同学"},
    })
