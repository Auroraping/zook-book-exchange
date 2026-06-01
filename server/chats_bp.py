from flask import Blueprint, jsonify, request, current_app
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

chats_bp = Blueprint("chats_bp", __name__)

# 从强单例状态共享文件导入 online_users 以防蓝图热重载实例分裂
from socket_state import online_users

def request_payload():
    return request.get_json(silent=True) or {}

def get_user_info(user_id):
    user_id_str = str(user_id or "").strip()
    if not user_id_str or user_id_str == "me":
        return {"name": "浙大同学", "avatar": "https://api.dicebear.com/7.x/identicon/svg?seed=me"}
    users = read_json("users.json", [])
    u = next((item for item in users if str(item.get("id")) == user_id_str or str(item.get("studentId")) == user_id_str or str(item.get("username")) == user_id_str), None)
    if u:
        return {
            "name": u.get("name") or u.get("realName") or f"用户_{user_id_str}",
            "avatar": u.get("avatar") or f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id_str}"
        }
    return {
        "name": f"同学_{user_id_str[-4:] if len(user_id_str)>=4 else user_id_str}",
        "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id_str}"
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

@chats_bp.post("/api/chats")
def create_chat():
    payload = request_payload()
    contact_id = payload.get("contactId")
    contact_name = payload.get("contactName")
    avatar = payload.get("avatar")
    initial_msg = payload.get("initialMsg")
    book_title = payload.get("bookTitle", "求购教材")
    current_user_id = payload.get("userId") or "me"
    
    if not contact_id or not contact_name:
        return jsonify({"success": False, "message": "联系人参数不完整"}), 400

    def update(chat_state):
        user_chats = chat_state.setdefault("user_chats", {})
        
        # 1. 确保发起者 A 侧的专属会话状态存在并加载
        seed_chat_state(current_user_id)
        a_chats = user_chats.setdefault(current_user_id, {"contacts": [], "messages": {}})
        a_contacts = a_chats.setdefault("contacts", [])
        a_messages = a_chats.setdefault("messages", {})
        
        # 获取发起者自己的网名和头像信息
        a_info = get_user_info(current_user_id)
        
        # 查找 A 侧的联系人卡片中是否已经存在 B
        existing_b = next((c for c in a_contacts if str(c.get("id")) == str(contact_id)), None)
        
        # 兜底自定义回复
        auto_reply_text = f"收到！真的太好啦，我非常需要《{book_title}》这本教材。请问你这本大概几成新呀？方便我们约个时间在学校当面交易吗？"
        
        # 在 A 侧添加或置顶 B 的会话卡片
        if existing_b:
            a_contacts.remove(existing_b)
            existing_b["lastMsg"] = initial_msg or "同学你好，我有这本书。"
            existing_b["time"] = "刚刚"
            a_contacts.insert(0, existing_b)
        else:
            new_b_contact = {
                "id": contact_id,
                "name": contact_name,
                "avatar": avatar or f"https://api.dicebear.com/7.x/identicon/svg?seed={contact_name}",
                "time": "刚刚",
                "unread": 0,
                "lastMsg": initial_msg or "同学你好，我有这本书。"
            }
            a_contacts.insert(0, new_b_contact)
            
        a_room = a_messages.setdefault(str(contact_id), [])
        msg_id_1 = new_id("m")
        a_room.append({
            "id": msg_id_1,
            "role": "me",
            "content": initial_msg or "同学你好，我有这本书。",
            "timestamp": now_text()
        })
        
        # 2. 判断 B 是否是机器人。如果不是 Mock 机器人且不是发起者自己，则在 B 侧也同步建立会话卡片！
        is_mock_bot = str(contact_id).startswith("U_MOCK_")
        if not is_mock_bot and str(contact_id) != str(current_user_id):
            seed_chat_state(contact_id)
            b_chats = user_chats.setdefault(contact_id, {"contacts": [], "messages": {}})
            b_contacts = b_chats.setdefault("contacts", [])
            b_messages = b_chats.setdefault("messages", {})
            
            existing_a = next((c for c in b_contacts if str(c.get("id")) == str(current_user_id)), None)
            
            if existing_a:
                b_contacts.remove(existing_a)
                existing_a["lastMsg"] = initial_msg or "同学你好，我有这本书。"
                existing_a["time"] = "刚刚"
                existing_a["unread"] = (existing_a.get("unread") or 0) + 1
                b_contacts.insert(0, existing_a)
            else:
                new_a_contact = {
                    "id": current_user_id,
                    "name": a_info["name"],
                    "avatar": a_info["avatar"],
                    "time": "刚刚",
                    "unread": 1,
                    "lastMsg": initial_msg or "同学你好，我有这本书。"
                }
                b_contacts.insert(0, new_a_contact)
                
            b_room = b_messages.setdefault(str(current_user_id), [])
            b_room.append({
                "id": msg_id_1,
                "role": "other",
                "content": initial_msg or "同学你好，我有这本书。",
                "timestamp": now_text()
            })
            
            # 若目标用户在线，通过 Socket.IO 发送实时收到消息的通知，驱动接收方浏览器热加载
            is_receiver_online = contact_id in online_users
            if is_receiver_online:
                event_data = {
                    "chatId": current_user_id,
                    "message": {
                        "id": msg_id_1,
                        "role": "other",
                        "content": initial_msg or "同学你好，我有这本书。",
                        "timestamp": now_text()
                    }
                }
                socketio = current_app.extensions.get("socketio")
                if socketio:
                    socketio.emit("receive_message", event_data, room=contact_id)
        else:
            # 机器人自动追加首条回复
            msg_id_2 = new_id("m")
            a_room.append({
                "id": msg_id_2,
                "role": "other",
                "content": auto_reply_text,
                "timestamp": now_text()
            })
            if a_contacts:
                a_contacts[0]["lastMsg"] = auto_reply_text
                
        return {"contactId": contact_id}

    result = mutate_json("chat.json", update, {})
    return jsonify({"success": True, **result})

@chats_bp.get("/api/chats")
def get_chats():
    user_id = request.args.get("userId") or "me"
    return jsonify({"success": True, **seed_chat_state(user_id)})

@chats_bp.post("/api/chats/<chat_id>/read")
def read_chat(chat_id):
    user_id = request.args.get("userId") or request.json.get("userId") if request.is_json else None
    if not user_id:
        user_id = "me"
    def update(chat_state):
        user_chats = chat_state.setdefault("user_chats", {})
        seed_chat_state(user_id)
        chats_data = user_chats.get(user_id) or {}
        contacts = chats_data.setdefault("contacts", [])
        for contact in contacts:
            if str(contact.get("id")) == str(chat_id):
                contact["unread"] = 0
        return {"success": True}
    mutate_json("chat.json", update, {})
    return jsonify({"success": True})

@chats_bp.post("/api/chats/<chat_id>/messages")
def create_chat_message(chat_id):
    payload = request_payload()
    text = str(payload.get("text") or "").strip()
    if not text:
        return jsonify({"success": False, "message": "消息不能为空"}), 400

    sender_id = str(payload.get("userId") or "me").strip()
    receiver_id = str(chat_id).strip()

    is_receiver_online = receiver_id in online_users
    is_mock_bot = receiver_id.startswith("U_MOCK_")

    def update(chat_state):
        user_chats = chat_state.setdefault("user_chats", {})
        
        # 1. 发送方 A 侧记录
        seed_chat_state(sender_id)
        a_chats = user_chats.setdefault(sender_id, {"contacts": [], "messages": {}})
        a_contacts = a_chats.setdefault("contacts", [])
        a_messages = a_chats.setdefault("messages", {})
        a_room = a_messages.setdefault(receiver_id, [])
        
        msg_id = new_id("m")
        timestamp = now_text()
        message = {"id": msg_id, "role": "me", "content": text, "timestamp": timestamp}
        a_room.append(message)
        
        # 更新 A 侧联系人卡片的最后消息
        for contact in a_contacts:
            if str(contact.get("id")) == receiver_id:
                contact["lastMsg"] = text
                contact["time"] = "刚刚"
                
        reply = None
        
        # 2. 如果对方不是 Mock 机器人且不是自己，将消息同时双写到接收者 B 侧消息列表中
        if not is_mock_bot and receiver_id != sender_id:
            seed_chat_state(receiver_id)
            b_chats = user_chats.setdefault(receiver_id, {"contacts": [], "messages": {}})
            b_contacts = b_chats.setdefault("contacts", [])
            b_messages = b_chats.setdefault("messages", {})
            b_room = b_messages.setdefault(sender_id, [])
            
            b_room.append({"id": msg_id, "role": "other", "content": text, "timestamp": timestamp})
            
            # 更新 B 侧 A 联系人卡片的最后消息与未读数
            found_a = False
            for contact in b_contacts:
                if str(contact.get("id")) == sender_id:
                    contact["lastMsg"] = text
                    contact["time"] = "刚刚"
                    contact["unread"] = (contact.get("unread") or 0) + 1
                    found_a = True
                    break
            
            # 如果 B 侧没有 A 的卡片，动态拉取名字头像创建一个卡片，确保即时聊天显示完整
            if not found_a:
                s_info = get_user_info(sender_id)
                new_contact_for_b = {
                    "id": sender_id,
                    "name": s_info["name"],
                    "avatar": s_info["avatar"],
                    "time": "刚刚",
                    "unread": 1,
                    "lastMsg": text
                }
                b_contacts.insert(0, new_contact_for_b)
        else:
            # 机器人自动应答兜底
            replies = chat_state.get("autoReplies") or ["收到，我稍后确认。"]
            reply_text = replies[len(a_room) % len(replies)]
            reply = {"id": new_id("m"), "role": "other", "content": reply_text, "timestamp": now_text()}
            a_room.append(reply)
            for contact in a_contacts:
                if str(contact.get("id")) == receiver_id:
                    contact["lastMsg"] = reply_text
                    contact["time"] = "刚刚"
                    
        return {"message": message, "reply": reply}

    result = mutate_json("chat.json", update, {})
    
    # 3. 实时消息 Socket 推送（全局大厅容灾广播：彻底脱离对长连接房间和 session 状态切换的强依赖，保障双开测试 100% 投递）
    if not is_mock_bot:
        event_data = {
            "chatId": sender_id,
            "receiverId": receiver_id,
            "message": {
                "id": result["message"]["id"],
                "role": "other",
                "content": text,
                "timestamp": result["message"]["timestamp"]
            }
        }
        socketio = current_app.extensions.get("socketio")
        if socketio:
            socketio.emit("receive_message", event_data)
            print(f"[Socket] 全局大厅容灾投递：已将实时消息广播至大厅，等待目标用户 {receiver_id} 接收。")
        
    return jsonify({"success": True, **result})
