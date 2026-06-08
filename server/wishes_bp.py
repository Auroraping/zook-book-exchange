from flask import Blueprint, jsonify, request
from account_identity import normalize_account_id, public_account
from avatar_utils import DEFAULT_AVATAR, local_avatar
from json_store import find_by_id, mutate_json, new_id, now_text, read_json

wishes_bp = Blueprint("wishes_bp", __name__)


def request_payload():
    return request.get_json(silent=True) or {}


def public_user(user_id):
    return public_account(user_id)


def users_by_account():
    users = read_json("users.json", [])
    mapping = {}
    for user in users:
        for key in (user.get("id"), user.get("email"), user.get("username")):
            if key:
                mapping[str(key).lower()] = user
    return mapping


def normalize_from_map(value, mapping):
    value_text = str(value or "me").strip()
    user = mapping.get(value_text.lower())
    return str(user.get("id")) if user and user.get("id") else value_text


@wishes_bp.get("/api/wishes")
def list_wishes():
    wishes = read_json("wishes.json", [])
    user_map = users_by_account()
    for wish in wishes:
        user_id = normalize_from_map(wish.get("userId") or "me", user_map)
        user = user_map.get(str(user_id).lower()) or {}
        wish["userId"] = user_id
        wish["userName"] = user.get("name") or wish.get("userName") or "浙大同学"
        wish["avatar"] = local_avatar(user.get("avatar") or wish.get("avatar"))
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
            "avatar": local_avatar(user.get("avatar")) or DEFAULT_AVATAR,
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
        if normalize_account_id(wish_user_id) != user_id:
            co_seekers = wish.get("coSeekers", [])
            if user_id in co_seekers:
                wish["coSeekers"] = [s for s in co_seekers if s != user_id]
                return "success"
            return "permission_denied"
        wishes.remove(wish)
        return "success"

    res = mutate_json("wishes.json", remove_wish, [])
    if res == "not_found":
        return jsonify({"success": False, "message": "心愿不存在"}), 404
    if res == "permission_denied":
        return jsonify({"success": False, "message": "你无权删除此心愿"}), 403
    return jsonify({"success": True, "message": "心愿已删除"})
