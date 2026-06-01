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
            real_info = {"realName": raw.get("xm") or username, "studentId": raw.get("xh") or username, "college": raw.get("xy") or "浙江大学", "major": raw.get("zy") or "未填写", "class": raw.get("xzb") or ""}
    except Exception as e:
        print("[Auth] 尝试爬虫实名登录同步失败，降级为本地极简登录:", e)

    local_user = find_registered_user(username)
    if local_user:
        def update_pass(users):
            u = find_by_id(users, local_user["id"])
            if u:
                u["passwordHash"] = generate_password_hash(password)
                # 仅同步 realName、studentId、college、major、class 等实名字段
                # 绝不覆盖用户自定义的 name（网名）和 avatar（头像）
                if real_info:
                    for key in ("realName", "studentId", "college", "major", "class"):
                        if key in real_info:
                            u[key] = real_info[key]
                            
                return u
            return local_user
            
        user = mutate_json("users.json", update_pass, [])
        return jsonify({"success": True, "user": public_auth_user(user)})



    def auto_register(users):
        # 新用户首次注册，绝不继承可能被污染的 me 或 defaultUser 属性！
        # 直接使用以 username 作为 seed 的专属随机头像与教务实名作为干净的初始配置
        init_avatar = f"https://api.dicebear.com/7.x/identicon/svg?seed={username}"
        init_name = real_info.get("realName") or f"浙大同学_{username[-4:] if len(username)>=4 else username}"

        new_user = {
            "id": new_id("u"), "username": username, "name": init_name, "realName": real_info.get("realName") or username,
            "studentId": username, "college": real_info.get("college") or "浙江大学", "major": real_info.get("major") or "未填写", "class": real_info.get("class") or "", "credit": 5.0, "tradeCount": 0,
            "points": 0, "level": "Lv.1 新同学", "avatar": init_avatar,
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
            "college": "浙江大学", "major": "未填写", "class": "", "credit": 5.0, "tradeCount": 0, "points": 0, "level": "Lv.1 新同学",
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
    student_id = request.form.get("studentId") or payload.get("studentId")
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
        target_user = None
        # 1. 优先使用 student_id 精确定位当前真实用户
        if student_id:
            student_id_str = str(student_id).strip().lower()
            target_user = next((u for u in users_list if u.get("id") != "me" and (str(u.get("username") or "").lower() == student_id_str or str(u.get("studentId") or "").lower() == student_id_str)), None)
        
        # 2. 如果没找到，退化到使用 user_id 定位
        if not target_user:
            target_user = find_by_id(users_list, user_id)
            
        # 3. 更新对应的属性
        if target_user:
            if avatar_url: target_user["avatar"] = avatar_url
            if new_name: target_user["name"] = new_name
            # 如果更新的是真实注册用户，并且 user_id == "me"，同时保持 "me" 用户的头像/网名同步，以便在退化渲染时一致
            if target_user.get("id") != "me" and user_id == "me":
                me_user = find_by_id(users_list, "me")
                if me_user:
                    if avatar_url: me_user["avatar"] = avatar_url
                    if new_name: me_user["name"] = new_name
        else:
            # 4. 如果都不存在，则新建
            target_user = {"id": user_id, "avatar": avatar_url or "", "name": new_name or "浙大同学", "studentId": student_id or ""}
            users_list.append(target_user)
            
        return target_user

    mutate_json("users.json", update_user_data, [])

    # 5. 只有在没有传入特定 student_id（即非特定账号的全局普通更新，比如演示用的 'me'）时，才同步写入全局 ui.json
    if not student_id and user_id == "me":
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

@user_bp.get("/api/users/search")
def search_users():
    query = str(request.args.get("q") or "").strip().lower()
    current_uid = str(request.args.get("userId") or "me").strip()
    
    if not query:
        return jsonify({"success": True, "users": []})
        
    users = read_json("users.json", [])
    
    my_real_id = None
    if current_uid == "me":
        real_users = [u for u in users if u.get("username") and u.get("id") != "me"]
        if real_users:
            my_real_id = real_users[-1].get("id")
            
    matched = []
    for u in users:
        if u.get("id") == "me":
            continue
        if u.get("id") == current_uid or u.get("id") == my_real_id or str(u.get("username")).lower() == str(current_uid).lower():
            continue
            
        name_match = query in str(u.get("name") or "").lower()
        realname_match = query in str(u.get("realName") or "").lower()
        username_match = query in str(u.get("username") or "").lower()
        studentid_match = query in str(u.get("studentId") or "").lower()
        
        if name_match or realname_match or username_match or studentid_match:
            matched.append(public_auth_user(u))
            
    return jsonify({"success": True, "users": matched})
