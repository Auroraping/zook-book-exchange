from flask import Blueprint, jsonify, current_app, request
from json_store import mutate_json, new_id, now_text
from socket_state import online_users
from chats_helper import normalize_user_id, get_user_info, seed_chat_state, request_payload

chats_bp = Blueprint("chats_bp", __name__)

@chats_bp.post("/api/chats")
def create_chat():
    payload = request_payload()
    contact_id = normalize_user_id(payload.get("contactId"))
    contact_name = payload.get("contactName")
    avatar = payload.get("avatar")
    initial_msg = payload.get("initialMsg")
    book_title = payload.get("bookTitle", "求购教材")
    current_user_id = normalize_user_id(payload.get("userId") or "me")
    
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
            
            # 若目标用户在线，通过 Socket.IO 发送实时收到消息的通知
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
    user_id = normalize_user_id(request.args.get("userId") or "me")
    return jsonify({"success": True, **seed_chat_state(user_id)})

@chats_bp.post("/api/chats/<chat_id>/read")
def read_chat(chat_id):
    chat_id = normalize_user_id(chat_id)
    user_id = request.args.get("userId") or request.json.get("userId") if request.is_json else None
    user_id = normalize_user_id(user_id or "me")
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
