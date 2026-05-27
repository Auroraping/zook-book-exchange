from flask import Blueprint, jsonify, request
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

wishes_bp = Blueprint("wishes_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_user(user_id):
    if user_id == "me":
        ui_data = read_json("ui.json", {})
        default_user = ui_data.get("profile", {}).get("defaultUser", {})
        return {
            "id": "me",
            "name": default_user.get("name") or "浙大同学",
            "avatar": default_user.get("avatar") or "/user_avatar.png",
            "credit": 4.9,
        }
    users = read_json("users.json", [])
    return find_by_id(users, user_id) or {
        "id": user_id,
        "name": "浙大同学",
        "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}",
        "credit": 4.8,
    }

@wishes_bp.get("/api/wishes")
def list_wishes():
    wishes = read_json("wishes.json", [])
    for wish in wishes:
        user_id = wish.get("userId") or "me"
        user = public_user(user_id)
        wish["userName"] = user.get("name") or wish.get("userName") or "浙大同学"
        wish["avatar"] = user.get("avatar") or wish.get("avatar") or "/user_avatar.png"
    return jsonify({"success": True, "wishes": wishes})

@wishes_bp.post("/api/wishes/<wish_id>/coseek")
def coseek_wish(wish_id):
    payload = request_payload()
    user_id = payload.get("userId") or "me"

    def update(wishes):
        wish = find_by_id(wishes, wish_id)
        if not wish:
            return None
        co_seekers = wish.setdefault("coSeekers", [])
        if user_id not in co_seekers:
            co_seekers.append(user_id)
        return wish

    wish = mutate_json("wishes.json", update, [])
    if not wish:
        return jsonify({"success": False, "message": "心愿不存在"}), 404
    return jsonify({"success": True, "wish": wish})

@wishes_bp.post("/api/wishes")
def create_wish():
    payload = request_payload()
    title = str(payload.get("title") or "").strip()
    if not title:
        return jsonify({"success": False, "message": "请填写心愿书名"}), 400
    user_id = payload.get("userId") or "me"
    user = public_user(user_id)

    def add_wish(wishes):
        wish = {
            "id": new_id("w"),
            "userId": user_id,
            "userName": user.get("name"),
            "title": title,
            "author": str(payload.get("author") or "待补充").strip(),
            "priceRange": str(payload.get("priceRange") or "面议").strip(),
            "status": "seeking",
            "tags": payload.get("tags") or ["求购"],
            "timestamp": now_text(),
            "avatar": user.get("avatar") or f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}",
        }
        wishes.insert(0, wish)
        return wish

    wish = mutate_json("wishes.json", add_wish, [])
    return jsonify({"success": True, "wish": wish})
