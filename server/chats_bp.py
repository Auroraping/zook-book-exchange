from flask import Blueprint, jsonify, request, current_app
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

chats_bp = Blueprint("chats_bp", __name__)

# 在内存中共享 Socket 状态字典，可在 app.py 中安全导入
online_users = {}
registered_users = {
    "U_MOCK_001": "书友小陈",
    "U_MOCK_002": "李同学",
    "U_MOCK_003": "计科王同学",
    "U_MOCK_004": "高数笔记小助手",
}

def request_payload():
    return request.get_json(silent=True) or {}

def seed_chat_state():
    chat_state = read_json("chat.json", {})
    if chat_state.get("contacts"):
        return chat_state
    ui = read_json("ui.json", {})
    chat = ui.get("chat") or {}
    chat_state = {
        "contacts": chat.get("contacts") or [],
        "messages": chat.get("messages") or {},
        "autoReplies": chat.get("autoReplies") or ["收到，我稍后确认。"],
    }
    write_json("chat.json", chat_state)
    return chat_state

@chats_bp.post("/api/chats")
def create_chat():
    payload = request_payload()
    contact_id = payload.get("contactId")
    contact_name = payload.get("contactName")
    avatar = payload.get("avatar")
    initial_msg = payload.get("initialMsg")
    book_title = payload.get("bookTitle", "求购教材")
    
    if not contact_id or not contact_name:
        return jsonify({"success": False, "message": "联系人参数不完整"}), 400

    def update(chat_state):
        if not chat_state.get("contacts"):
            seeded = seed_chat_state()
            chat_state.update(seeded)
            
        contacts = chat_state.setdefault("contacts", [])
        messages_map = chat_state.setdefault("messages", {})
        
        existing = next((c for c in contacts if str(c.get("id")) == str(contact_id)), None)
        auto_reply_text = f"收到！真的太好啦，我非常需要《{book_title}》这本教材。请问你这本大概几成新呀？方便我们约个时间在学校当面交易吗？"
        
        if existing:
            contacts.remove(existing)
            existing["lastMsg"] = auto_reply_text
            existing["time"] = "刚刚"
            contacts.insert(0, existing)
        else:
            new_contact = {
                "id": contact_id,
                "name": contact_name,
                "avatar": avatar or f"https://api.dicebear.com/7.x/identicon/svg?seed={contact_name}",
                "time": "刚刚",
                "unread": 0,
                "lastMsg": auto_reply_text
            }
            contacts.insert(0, new_contact)
            
        room = messages_map.setdefault(str(contact_id), [])
        
        msg = {
            "id": new_id("m"),
            "role": "me",
            "content": initial_msg or "同学你好，我有这本书。",
            "timestamp": now_text()
        }
        reply = {
            "id": new_id("m"),
            "role": "other",
            "content": auto_reply_text,
            "timestamp": now_text()
        }
        room.append(msg)
        room.append(reply)
        return {"contactId": contact_id}

    result = mutate_json("chat.json", update, {})
    return jsonify({"success": True, **result})

@chats_bp.get("/api/chats")
def get_chats():
    return jsonify({"success": True, **seed_chat_state()})

@chats_bp.post("/api/chats/<chat_id>/read")
def read_chat(chat_id):
    def update(chat_state):
        contacts = chat_state.setdefault("contacts", [])
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

    def update(chat_state):
        if not chat_state.get("contacts"):
            seeded = seed_chat_state()
            chat_state.update(seeded)
        messages_map = chat_state.setdefault("messages", {})
        room = messages_map.setdefault(receiver_id, [])
        
        message = {"id": new_id("m"), "role": "me", "content": text, "timestamp": now_text()}
        room.append(message)
        
        reply = None
        if is_receiver_online:
            for contact in chat_state.get("contacts", []):
                if str(contact.get("id")) == receiver_id:
                    contact["lastMsg"] = text
                    contact["time"] = "刚刚"
        else:
            replies = chat_state.get("autoReplies") or ["收到，我稍后确认。"]
            reply = {"id": new_id("m"), "role": "other", "content": replies[len(room) % len(replies)], "timestamp": now_text()}
            room.append(reply)
            for contact in chat_state.get("contacts", []):
                if str(contact.get("id")) == receiver_id:
                    contact["lastMsg"] = reply["content"]
                    contact["time"] = "刚刚"
                    
        return {"message": message, "reply": reply}

    result = mutate_json("chat.json", update, {})
    
    if is_receiver_online:
        event_data = {
            "chatId": sender_id,
            "message": {
                "id": result["message"]["id"],
                "role": "other",
                "content": text,
                "timestamp": result["message"]["timestamp"]
            }
        }
        socketio = current_app.extensions.get("socketio")
        if socketio:
            socketio.emit("receive_message", event_data, room=receiver_id)
            print(f"[Socket] 已向在线用户 {receiver_id} 专属房间发送了消息")
        
    return jsonify({"success": True, **result})
