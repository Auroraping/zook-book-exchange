from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from json_store import find_by_id, mutate_json, new_id, now_text, read_json
from auth_service import authenticate_zju
from schedule_helper import fetch_schedule

auth_bp = Blueprint("auth_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_auth_user(user):
    return {key: value for key, value in user.items() if key != "passwordHash"}

def find_registered_user(username):
    username_text = str(username or "").strip().lower()
    if not username_text: 
        return None
    return next((u for u in read_json("users.json", []) if str(u.get("username") or "").lower() == username_text or str(u.get("studentId") or "").lower() == username_text), None)

@auth_bp.post("/api/login")
def login():
    payload = request_payload()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    if not username or not password:
        return jsonify({"success": False, "message": "请提供学号和密码"}), 400

    # 尝试使用真实爬虫进行身份与实名爬取
    real_info = {}
    try:
        auth_res = authenticate_zju(username, password)
        if auth_res.get("success"):
            sched = fetch_schedule(username, password)
            raw = sched.get("raw") or {}
            real_info = {
                "realName": raw.get("xm") or username, 
                "studentId": raw.get("xh") or username, 
                "college": raw.get("xy") or "浙江大学", 
                "major": raw.get("zy") or "未填写", 
                "class": raw.get("xzb") or ""
            }
    except Exception as e:
        print("[Auth] 尝试爬虫实名登录同步失败，降级为本地极简登录:", e)

    local_user = find_registered_user(username)
    if local_user:
        def update_pass(users):
            u = find_by_id(users, local_user["id"])
            if u:
                u["passwordHash"] = generate_password_hash(password)
                # 仅同步实名字段，不覆盖用户自定义的名字/头像
                if real_info:
                    for key in ("realName", "studentId", "college", "major", "class"):
                        if key in real_info:
                            u[key] = real_info[key]
                return u
            return local_user
            
        user = mutate_json("users.json", update_pass, [])
        return jsonify({"success": True, "user": public_auth_user(user)})

    def auto_register(users):
        init_avatar = f"https://api.dicebear.com/7.x/identicon/svg?seed={username}"
        init_name = real_info.get("realName") or f"浙大同学_{username[-4:] if len(username)>=4 else username}"

        new_user = {
            "id": new_id("u"), 
            "username": username, 
            "name": init_name, 
            "realName": real_info.get("realName") or username,
            "studentId": username, 
            "college": real_info.get("college") or "浙江大学", 
            "major": real_info.get("major") or "未填写", 
            "class": real_info.get("class") or "", 
            "credit": 5.0, 
            "tradeCount": 0,
            "points": 0, 
            "level": "Lv.1 新同学", 
            "avatar": init_avatar,
            "bio": "本地自动激活的用户。", 
            "joinDate": now_text(), 
            "passwordHash": generate_password_hash(password)
        }
        users.append(new_user)
        return new_user

    user = mutate_json("users.json", auto_register, [])
    return jsonify({"success": True, "user": public_auth_user(user)})

@auth_bp.post("/api/register")
def register():
    payload = request_payload()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    display_name = str(payload.get("name") or username or "浙大同学").strip()
    if not username or not password or len(password) < 6:
        return jsonify({"success": False, "message": "注册参数不完整，密码至少6位"}), 400
    if find_registered_user(username):
        return jsonify({"success": False, "message": "账号已存在，请直接登录"}), 409

    def add_user(users):
        user = {
            "id": new_id("u"), 
            "username": username, 
            "name": display_name, 
            "realName": display_name, 
            "studentId": username,
            "college": "浙江大学", 
            "major": "未填写", 
            "class": "", 
            "credit": 5.0, 
            "tradeCount": 0, 
            "points": 0, 
            "level": "Lv.1 新同学",
            "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={username}", 
            "bio": "本地注册用户。", 
            "joinDate": now_text(),
            "passwordHash": generate_password_hash(password)
        }
        users.append(user)
        return user

    user = mutate_json("users.json", add_user, [])
    return jsonify({"success": True, "user": public_auth_user(user)})
