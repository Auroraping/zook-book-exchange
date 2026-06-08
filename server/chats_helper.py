from flask import request
from avatar_utils import DEFAULT_AVATAR, local_avatar
from json_store import read_json, write_json

def request_payload():
    return request.get_json(silent=True) or {}

def primary_account_match(user, value):
    value_text = str(value or "").strip().lower()
    if not value_text:
        return False
    candidates = (user.get("id"), user.get("email"), user.get("username"))
    return any(str(item or "").strip().lower() == value_text for item in candidates)

def normalize_user_id(user_id):
    user_id_str = str(user_id or "").strip()
    if not user_id_str or user_id_str == "me":
        return "me"
    users = read_json("users.json", [])
    u = next((item for item in users if primary_account_match(item, user_id_str)), None)
    if u and u.get("id"):
        return str(u["id"])
    return user_id_str

def get_user_info(user_id):
    user_id_str = str(user_id or "").strip()
    if not user_id_str or user_id_str == "me":
        return {"id": "me", "studentId": "me", "name": "浙大同学", "avatar": DEFAULT_AVATAR}
    users = read_json("users.json", [])
    u = next((item for item in users if primary_account_match(item, user_id_str)), None)
    if u:
        return {
            "id": u.get("id"),
            "email": u.get("email") or u.get("username") or "",
            "studentId": u.get("studentId") or "",
            "name": u.get("name") or u.get("realName") or f"用户_{user_id_str}",
            "avatar": local_avatar(u.get("avatar"))
        }
    return {
        "id": user_id_str,
        "email": "",
        "studentId": "",
        "name": f"同学_{user_id_str[-4:] if len(user_id_str)>=4 else user_id_str}",
        "avatar": DEFAULT_AVATAR
    }

def seed_chat_state(user_id="me"):
    user_id = str(user_id or "me").strip()
    chat_state = read_json("chat.json", {})
    user_chats = chat_state.setdefault("user_chats", {})
    
    if user_id in user_chats:
        user_chats[user_id].setdefault("contacts", [])
        user_chats[user_id].setdefault("messages", {})
        return user_chats[user_id]
        
    ui = read_json("ui.json", {})
    chat_config = ui.get("chat") or {}
    default_contacts = chat_config.get("contacts") or []
    default_messages = chat_config.get("messages") or {}
    
    # 深度拷贝，保证相互物理隔离
    user_chats[user_id] = {
        "contacts": [dict(c) for c in default_contacts],
        "messages": {k: list(v) for k, v in default_messages.items()}
    }
    write_json("chat.json", chat_state)
    return user_chats[user_id]
