from flask import Blueprint, jsonify, current_app
from json_store import mutate_json, new_id, now_text
from socket_state import online_users
from chats_helper import normalize_user_id, get_user_info, seed_chat_state, request_payload

chat_messages_bp = Blueprint("chat_messages_bp", __name__)

@chat_messages_bp.post("/api/chats/<chat_id>/messages")
def create_chat_message(chat_id):
    payload = request_payload()
    text = str(payload.get("text") or "").strip()
    if not text:
        return jsonify({"success": False, "message": "消息不能为空"}), 400

    sender_id = normalize_user_id(payload.get("userId") or "me")
    receiver_id = normalize_user_id(chat_id)

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
    
    # 3. 实时消息 Socket 推送（全局大厅容灾广播与多维冗余信道）
    if not is_mock_bot:
        r_info = get_user_info(receiver_id)
        s_info = get_user_info(sender_id)
        event_data = {
            "chatId": sender_id,
            "senderStudentId": s_info.get("studentId") or "",
            "receiverId": receiver_id,
            "receiverStudentId": r_info.get("studentId") or "",
            "message": {
                "id": result["message"]["id"],
                "role": "other",
                "content": text,
                "timestamp": result["message"]["timestamp"]
            }
        }
        socketio = current_app.extensions.get("socketio")
        if socketio:
            # 1. 精准信道一：面向接收者当前会话 ID 的房间推送
            socketio.emit("receive_message", event_data, room=receiver_id)
            
            # 2. 精准信道二：如果其真实 UUID 存在且与当前 ID 不同，追加向真实 UUID 房间推送
            real_rec_id = r_info.get("id")
            if real_rec_id and str(real_rec_id) != str(receiver_id):
                socketio.emit("receive_message", event_data, room=str(real_rec_id))
                
            # 3. 精准信道三：如果接收方学号存在且与前两者都不同，追加向学号房间推送
            rec_student_id = r_info.get("studentId")
            if rec_student_id and str(rec_student_id) != str(receiver_id) and str(rec_student_id) != str(real_rec_id):
                socketio.emit("receive_message", event_data, room=str(rec_student_id))

            print(f"[Socket] 多维冗余精准投递成功：房间 {receiver_id}、UUID房间 {real_rec_id}、学号房间 {rec_student_id} 已同步投递！")
        
    return jsonify({"success": True, **result})
