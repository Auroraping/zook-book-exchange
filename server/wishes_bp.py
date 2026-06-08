from flask import Blueprint, jsonify, request
from account_identity import normalize_account_id, public_account
from json_store import find_by_id, mutate_json, new_id, now_text, read_json

wishes_bp = Blueprint("wishes_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_user(user_id):
    return public_account(user_id)

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
    user_id = normalize_account_id(payload.get("userId") or "me")

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
    user_id = normalize_account_id(payload.get("userId") or "me")
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

@wishes_bp.delete("/api/wishes/<wish_id>")
def delete_wish(wish_id):
    user_id = normalize_account_id(request.args.get("userId") or "me")

    def remove_wish(wishes):
        wish = find_by_id(wishes, wish_id)
        if not wish:
            return "not_found"
        wish_user_id = wish.get("userId") or "me"
        
        # 允许 'me' 与 真实 UUID 互通鉴权
        if normalize_account_id(wish_user_id) != user_id:
            # 核心：若我非原发起者，但我曾在同求列表里，在此执行“个人从同求列表移除”的自我退场逻辑
            co_seekers = wish.get("coSeekers", [])
            match_targets = {user_id}
            if any(t in co_seekers for t in match_targets):
                wish["coSeekers"] = [s for s in co_seekers if s not in match_targets]
                return "success"
            return "permission_denied"
            
        wishes.remove(wish)
        return "success"

    res = mutate_json("wishes.json", remove_wish, [])
    if res == "not_found":
        return jsonify({"success": False, "message": "心愿不存在"}), 404
    elif res == "permission_denied":
        return jsonify({"success": False, "message": "您无权删除此心愿"}), 403
    return jsonify({"success": True, "message": "心愿已删除"})
