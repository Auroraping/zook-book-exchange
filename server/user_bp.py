from flask import Blueprint, jsonify, request
from auth_repository import find_user_by_id, save_user
from json_store import find_by_id, mutate_json, read_json
from upload_paths import save_upload

user_bp = Blueprint("user_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_auth_user(user):
    return {key: value for key, value in user.items() if key != "passwordHash"}

@user_bp.post("/api/user/update")
def update_user_profile():
    payload = request_payload()
    user_id = request.form.get("userId") or payload.get("userId") or "me"
    avatar_url = None
    new_name = request.form.get("name") or payload.get("name")
    
    file = request.files.get("file")
    if file and file.filename:
        avatar_url, _ = save_upload(file, "avatar")
    else:
        avatar_url = payload.get("avatar")

    if not avatar_url and not new_name:
        return jsonify({"success": False, "message": "未提供更新数据"}), 400

    direct_user = find_user_by_id(user_id)
    if direct_user:
        if avatar_url:
            direct_user["avatar"] = avatar_url
        if new_name:
            direct_user["name"] = new_name
        save_user(direct_user)
        return jsonify({"success": True, "avatar": avatar_url, "name": new_name, "message": "资料更新成功！"})

    def update_user_data(users_list):
        target_user = find_by_id(users_list, user_id)
        if target_user:
            if avatar_url: target_user["avatar"] = avatar_url
            if new_name: target_user["name"] = new_name
            if target_user.get("id") != "me" and user_id == "me":
                me_user = find_by_id(users_list, "me")
                if me_user:
                    if avatar_url: me_user["avatar"] = avatar_url
                    if new_name: me_user["name"] = new_name
        else:
            target_user = {"id": user_id, "avatar": avatar_url or "", "name": new_name or "浙大同学"}
            users_list.append(target_user)
            
        return target_user

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

@user_bp.get("/api/users/search")
def search_users():
    query = str(request.args.get("q") or "").strip().lower()
    current_uid = str(request.args.get("userId") or "me").strip()
    
    if not query:
        return jsonify({"success": True, "users": []})
        
    users = read_json("users.json", [])
    
    # 只按主账户 id 排除自己；相同浙大身份的其他邮箱账号仍然是独立账户。
    my_real_user = None
    if current_uid == "me":
        real_users = [u for u in users if u.get("username") and u.get("id") != "me"]
        if real_users:
            my_real_user = real_users[-1]
    else:
        my_real_user = next((u for u in users if str(u.get("id")) == current_uid or str(u.get("username")).lower() == current_uid.lower()), None)

    my_real_id = my_real_user.get("id") if my_real_user else None
    my_username = my_real_user.get("username") if my_real_user else None

    matched = []
    for u in users:
        if u.get("id") == "me":
            continue
            
        # 严格过滤掉发起搜索的当前用户自身，防止搜出自己
        uid_str = str(u.get("id"))
        uname_str = str(u.get("username") or "").lower()
        
        is_self = False
        if uid_str == current_uid or uid_str == my_real_id:
            is_self = True
        if my_username and uname_str == str(my_username).lower():
            is_self = True
            
        if is_self:
            continue
            
        name_match = query in str(u.get("name") or "").lower()
        realname_match = query in str(u.get("realName") or "").lower()
        username_match = query in str(u.get("username") or "").lower()
        studentid_match = query in str(u.get("studentId") or "").lower()
        
        if name_match or realname_match or username_match or studentid_match:
            matched.append(public_auth_user(u))
    return jsonify({"success": True, "users": matched})
