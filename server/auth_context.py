from flask import request

from auth_repository import active_token, find_user_by_id
from jwt_service import decode_jwt


def bearer_token():
    header = str(request.headers.get("Authorization") or "").strip()
    if header.lower().startswith("bearer "):
        return header.split(" ", 1)[1].strip()
    return ""


def current_request_user():
    token = bearer_token()
    if not token:
        return None
    try:
        payload = decode_jwt(token)
        if not active_token(payload.get("jti")):
            return None
        return find_user_by_id(payload.get("sub"))
    except Exception:
        return None


def current_request_user_id(fallback="me"):
    user = current_request_user()
    if user and user.get("id"):
        return str(user["id"])
    return fallback
