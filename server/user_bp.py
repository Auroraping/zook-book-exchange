import os
import time
import uuid
from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash
from json_store import find_by_id, mutate_json, new_id, now_text, read_json

user_bp = Blueprint("user_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_auth_user(user):
    return {key: value for key, value in user.items() if key != "passwordHash"}

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

@user_bp.get("/api/users/search")
def search_users():
    query = str(request.args.get("q") or "").strip().lower()
    current_uid = str(request.args.get("userId") or "me").strip()
    
    if not query:
        return jsonify({"success": True, "users": []})
        
    users = read_json("users.json", [])
    
    # 找出当前发起搜索的真实用户记录，以获取其真实的学号/用户名，防止自我搜索匹配
    my_real_user = None
    if current_uid == "me":
        real_users = [u for u in users if u.get("username") and u.get("id") != "me"]
        if real_users:
            my_real_user = real_users[-1]
    else:
        my_real_user = next((u for u in users if str(u.get("id")) == current_uid or str(u.get("studentId")).lower() == current_uid.lower() or str(u.get("username")).lower() == current_uid.lower()), None)

    my_real_id = my_real_user.get("id") if my_real_user else None
    my_student_id = my_real_user.get("studentId") if my_real_user else None
    my_username = my_real_user.get("username") if my_real_user else None

    matched = []
    for u in users:
        if u.get("id") == "me":
            continue
            
        # 严格过滤掉发起搜索的当前用户自身，防止搜出自己
        uid_str = str(u.get("id"))
        uname_str = str(u.get("username") or "").lower()
        sid_str = str(u.get("studentId") or "").lower()
        
        is_self = False
        if uid_str == current_uid or uid_str == my_real_id:
            is_self = True
        if my_student_id and (sid_str == str(my_student_id).lower() or uname_str == str(my_student_id).lower()):
            is_self = True
        if my_username and (sid_str == str(my_username).lower() or uname_str == str(my_username).lower()):
            is_self = True
            
        if is_self:
            continue
            
        name_match = query in str(u.get("name") or "").lower()
        realname_match = query in str(u.get("realName") or "").lower()
        username_match = query in str(u.get("username") or "").lower()
        studentid_match = query in str(u.get("studentId") or "").lower()
        
        if name_match or realname_match or username_match or studentid_match:
            matched.append(public_auth_user(u))
            
    # 如果搜索结果为空，且用户输入了一个合法的且不为自己学号的检索词
    # 我们直接在后台静默注册该学号，使得用户能瞬间搜到并点击聊一聊！
    if not matched and len(query) >= 5:
        query_is_self = False
        if query == current_uid.lower():
            query_is_self = True
        if my_student_id and query == str(my_student_id).lower():
            query_is_self = True
        if my_username and query == str(my_username).lower():
            query_is_self = True
            
        if not query_is_self:
            def auto_register_search(users_list):
                existing = next((u for u in users_list if str(u.get("username")).lower() == query or str(u.get("studentId")).lower() == query), None)
                if existing:
                    return existing
                    
                init_avatar = f"https://api.dicebear.com/7.x/identicon/svg?seed={query}"
                init_name = f"浙大同学_{query[-4:] if len(query)>=4 else query}"
                
                new_user = {
                    "id": new_id("u"), 
                    "username": query, 
                    "name": init_name, 
                    "realName": init_name,
                    "studentId": query, 
                    "college": "浙江大学", 
                    "major": "未填写", 
                    "class": "", 
                    "credit": 5.0, 
                    "tradeCount": 0,
                    "points": 0, 
                    "level": "Lv.1 新同学", 
                    "avatar": init_avatar,
                    "bio": "搜索静默激活的用户，可登录测试。", 
                    "joinDate": now_text(), 
                    "passwordHash": generate_password_hash("123456")
                }
                users_list.append(new_user)
                return new_user
                
            new_u = mutate_json("users.json", auto_register_search, [])
            matched.append(public_auth_user(new_u))
            print(f"[Search-Auth] 静默激活了测试用户 {query}，方便双开真实聊天")
            
    return jsonify({"success": True, "users": matched})
