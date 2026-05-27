import os
import time
import uuid
from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json
from auth_service import authenticate_zju
from schedule_helper import fetch_schedule

user_bp = Blueprint("user_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_auth_user(user):
    return {key: value for key, value in user.items() if key != "passwordHash"}

def find_registered_user(username):
    username_text = str(username or "").strip().lower()
    if not username_text: return None
    return next((u for u in read_json("users.json", []) if str(u.get("username") or "").lower() == username_text or str(u.get("studentId") or "").lower() == username_text), None)

@user_bp.post("/api/login")
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
            real_info = {"name": raw.get("xm") or username, "realName": raw.get("xm") or username, "studentId": raw.get("xh") or username, "college": raw.get("xy") or "浙江大学", "major": raw.get("zy") or "未填写", "class": raw.get("xzb") or ""}
    except Exception as e:
        print("[Auth] 尝试爬虫实名登录同步失败，降级为本地极简登录:", e)

    local_user = find_registered_user(username)
    if local_user:
        def update_pass(users):
            u = find_by_id(users, local_user["id"])
            if u:
                u["passwordHash"] = generate_password_hash(password)
                if real_info: u.update(real_info) # 同步真实实名信息
                return u
            return local_user
        user = mutate_json("users.json", update_pass, [])
        return jsonify({"success": True, "user": public_auth_user(user)})

    def auto_register(users):
        new_user = {
            "id": new_id("u"), "username": username, "name": real_info.get("name") or username, "realName": real_info.get("realName") or username,
            "studentId": username, "college": real_info.get("college") or "浙江大学", "major": real_info.get("major") or "未填写", "class": real_info.get("class") or "", "credit": 5.0, "tradeCount": 0,
            "level": "Lv.1 新同学", "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={username}",
            "bio": "本地自动激活的用户。", "joinDate": now_text(), "passwordHash": generate_password_hash(password)
        }
        users.append(new_user)
        return new_user

    user = mutate_json("users.json", auto_register, [])
    return jsonify({"success": True, "user": public_auth_user(user)})

@user_bp.post("/api/register")
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
            "id": new_id("u"), "username": username, "name": display_name, "realName": display_name, "studentId": username,
            "college": "浙江大学", "major": "未填写", "class": "", "credit": 5.0, "tradeCount": 0, "level": "Lv.1 新同学",
            "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={username}", "bio": "本地注册用户。", "joinDate": now_text(),
            "passwordHash": generate_password_hash(password)
        }
        users.append(user)
        return user

    user = mutate_json("users.json", add_user, [])
    return jsonify({"success": True, "user": public_auth_user(user)})

@user_bp.post("/api/user/update")
def update_user_profile():
    payload = request_payload()
    user_id = request.form.get("userId") or payload.get("userId") or "me"
    avatar_url = None
    new_name = request.form.get("name") or payload.get("name")
    
    file = request.files.get("file")
    if file and file.filename:
        upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "client", "public", "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        ext = os.path.splitext(file.filename)[1] or ".png"
        unique_filename = f"avatar_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        avatar_url = f"/uploads/{unique_filename}"
    else:
        avatar_url = payload.get("avatar")

    if not avatar_url and not new_name:
        return jsonify({"success": False, "message": "未提供更新数据"}), 400

    def update_user_data(users_list):
        user_item = find_by_id(users_list, user_id)
        if user_item:
            if avatar_url: user_item["avatar"] = avatar_url
            if new_name: user_item["name"] = new_name
        else:
            user_item = {"id": user_id, "avatar": avatar_url or "", "name": new_name or "浙大同学", "studentId": user_id if user_id != "me" else ""}
            users_list.append(user_item)
        return user_item

    mutate_json("users.json", update_user_data, [])

    if user_id == "me":
        def update_ui(ui_data):
            profile = ui_data.setdefault("profile", {})
            default_user = profile.setdefault("defaultUser", {})
            if avatar_url: default_user["avatar"] = avatar_url
            if new_name: default_user["name"] = new_name
            return default_user
        mutate_json("ui.json", update_ui, {})

    return jsonify({"success": True, "avatar": avatar_url, "name": new_name, "message": "资料更新成功！"})

@user_bp.post("/api/schedule")
def schedule():
    payload = request_payload()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    
    # 优先发起真实爬虫请求获取真实课表
    try:
        if username and password:
            sched = fetch_schedule(username, password)
            return jsonify({"success": True, "courses": sched["courses"], "semester": sched.get("termInfo", {}).get("semester") or "大二春夏学期", "raw": sched.get("raw", {})})
    except Exception as e:
        print("[Schedule] 真实选课爬虫同步失败，降级为Mock数据:", e)
        
    courses = []
    try:
        import json
        with open(os.path.join(os.path.dirname(__file__), "..", "client", "public", "data", "courses.json"), "r", encoding="utf-8") as f:
            courses = json.load(f)
    except Exception as e:
        print("[Schedule] 无法读取兜底课表数据:", e)
        
    return jsonify({
        "success": True, "courses": courses, "semester": "大二春夏学期",
        "raw": {"xm": "浙大同学", "xh": username or "student"} # 不再返回班级(xzb)字段
    })

@user_bp.post("/api/textbooks")
def textbooks():
    # 对课表相关的教材匹配，由于前端会先调用 schedule 保存/获取，这里我们动态在 SQLite 中完成一键匹配推荐即可
    courses = read_json("courses.json", [])
    books = read_json("books.json", [])
    matched_books = []
    for c in courses:
        for bid in c.get("bookIds", []):
            book = find_by_id(books, bid)
            if book:
                matched_books.append({
                    "courseId": c["id"], "courseName": c["name"], "bookId": bid, "title": book["title"],
                    "price": book["price"], "cover": book["cover"], "seller": book["seller"]
                })
    return jsonify({"success": True, "textbooks": matched_books})
