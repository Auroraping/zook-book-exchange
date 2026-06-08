from flask import Blueprint, jsonify, current_app
from auth_context import current_request_user_id
from json_store import mutate_json, new_id, now_text
from chats_helper import normalize_user_id, get_user_info, seed_chat_state, request_payload

chat_messages_bp = Blueprint("chat_messages_bp", __name__)

@chat_messages_bp.post("/api/chats/<chat_id>/messages")
def create_chat_message(chat_id):
    payload = request_payload()
    text = str(payload.get("text") or "").strip()
    if not text:
        return jsonify({"success": False, "message": "消息不能为空"}), 400

    sender_id = normalize_user_id(current_request_user_id(payload.get("userId") or "me"))
    receiver_id = normalize_user_id(chat_id)
    msg_type = payload.get("msgType") or "text"
    proposal_data = payload.get("proposalData")

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
        if msg_type != "text":
            message["msgType"] = msg_type
        if proposal_data:
            message["proposalData"] = proposal_data
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
            
            b_message = {"id": msg_id, "role": "other", "content": text, "timestamp": timestamp}
            if msg_type != "text":
                b_message["msgType"] = msg_type
            if proposal_data:
                b_message["proposalData"] = proposal_data
            b_room.append(b_message)
            
            # 更新 B 侧 A 联系人卡片的最后消息与未读数
            found_a = False
            for contact in b_contacts:
                if str(contact.get("id")) == sender_id:
                    contact["lastMsg"] = text
                    contact["time"] = "刚刚"
                    contact["unread"] = (contact.get("unread") or 0) + 1
                    found_a = True
                    break
            
            # 如果 B 侧没有 A 的卡片，动态拉取名字头像创建一个卡片
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
    
    # 3. 实时消息只投递到接收方主账号房间，学号仅作为绑定资料展示。
    if not is_mock_bot:
        event_data = {
            "chatId": sender_id,
            "receiverId": receiver_id,
            "message": {
                "id": result["message"]["id"],
                "role": "other",
                "content": text,
                "timestamp": result["message"]["timestamp"],
                **({"msgType": msg_type} if msg_type != "text" else {}),
                **({"proposalData": proposal_data} if proposal_data else {})
            }
        }
        socketio = current_app.extensions.get("socketio")
        if socketio:
            socketio.emit("receive_message", event_data, room=receiver_id)
            print(f"[Socket] 消息已投递到主账号房间 {receiver_id}")
        
    return jsonify({"success": True, **result})

@chat_messages_bp.patch("/api/chats/<chat_id>/messages/<msg_id>/accept")
def accept_proposal(chat_id, msg_id):
    sender_id = normalize_user_id(current_request_user_id(request_payload().get("userId") or "me"))
    receiver_id = normalize_user_id(chat_id)

    def update(chat_state):
        user_chats = chat_state.setdefault("user_chats", {})
        for uid in (sender_id, receiver_id):
            room_id = receiver_id if uid == sender_id else sender_id
            messages = user_chats.get(uid, {}).get("messages", {}).get(room_id, [])
            for message in messages:
                if str(message.get("id")) == str(msg_id) and message.get("proposalData"):
                    message["proposalData"]["status"] = "accepted"
        return {"success": True}

    mutate_json("chat.json", update, {})
    socketio = current_app.extensions.get("socketio")
    if socketio:
        socketio.emit("proposal_accepted", {"chatId": sender_id, "msgId": msg_id}, room=receiver_id)
    return jsonify({"success": True})
