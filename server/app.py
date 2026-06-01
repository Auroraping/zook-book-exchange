import os
from pathlib import Path
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room

# 从强单例共享状态文件导入在线状态与注册字典，确保热重载数据一致性
from socket_state import online_users, registered_users

# 引入所有业务路由蓝图以及新拆分的合规子蓝图
from user_bp import user_bp
from books_bp import books_bp
from notes_bp import notes_bp
from orders_bp import orders_bp
from wishes_bp import wishes_bp
from chats_bp import chats_bp
from reports_bp import reports_bp
from auth_bp import auth_bp
from schedule_bp import schedule_bp
from cart_bp import cart_bp
from favorites_bp import favorites_bp
from chat_messages_bp import chat_messages_bp

app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False
CORS(app)

# 初始化 Socket.IO 长连接服务，并托管于 extensions 供跨蓝图共享调用
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

messages = []

# 批量注册各业务领域的模块化蓝图以及新解耦蓝图
app.register_blueprint(user_bp)
app.register_blueprint(books_bp)
app.register_blueprint(notes_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(wishes_bp)
app.register_blueprint(chats_bp)
app.register_blueprint(reports_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(schedule_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(favorites_bp)
app.register_blueprint(chat_messages_bp)

@app.get("/")
def index():
    return jsonify(
        {
            "success": True,
            "service": "ZJU Used Book Backend",
            "message": "后端服务运行中。前端请访问 http://127.0.0.1:5173",
            "endpoints": ["/api/health", "/api/login", "/api/books", "/api/wishes", "/api/notes"],
        }
    )

@app.get("/api/health")
def health():
    return jsonify(
        {
            "success": True,
            "service": "ZJU Used Book Backend",
            "framework": "Flask",
            "status": "fully operational",
        }
    )

@socketio.on("register_user")
def handle_register_user(user):
    if isinstance(user, dict) and user.get("id"):
        user_id = str(user["id"])
        display_name = user.get("name") or user.get("username") or "匿名用户"
        registered_users[user_id] = display_name
        
        # 记录用户的 socket 会话，方便定向实时推送
        from flask import request
        online_users[user_id] = request.sid
        
        # 让该 socket 连接加入对应的专属房间
        join_room(user_id)
        print(f"[Socket] 用户 {display_name} ({user_id}) 已连接并加入个人房间。当前在线: {len(online_users)}")

@socketio.on("disconnect")
def handle_disconnect():
    from flask import request
    user_id_to_remove = None
    for uid, sid in list(online_users.items()):
        if sid == request.sid:
            user_id_to_remove = uid
            break
    if user_id_to_remove:
        online_users.pop(user_id_to_remove, None)
        print(f"[Socket] 用户 {user_id_to_remove} 已断开。当前在线: {len(online_users)}")

@socketio.on("ping_test")
def ping_test():
    emit("pong_test")

@socketio.on("search_user")
def search_user(query):
    if not query:
        emit("search_results", [])
        return
    query_text = str(query).lower()
    results = [
        {"id": user_id, "name": name or "未知用户"}
        for user_id, name in registered_users.items()
        if query_text in user_id.lower() or query_text in str(name).lower()
    ]
    emit("search_results", results[:10])

@socketio.on("join_room")
def handle_join_room(room_id):
    join_room(room_id)
    history = [message for message in messages if message.get("roomId") == room_id]
    emit("receive_history", history)

@socketio.on("send_message")
def handle_send_message(data):
    if not isinstance(data, dict):
        return
    from datetime import datetime, timezone
    message_data = {**data, "timestamp": datetime.now(timezone.utc).isoformat()}
    messages.append(message_data)
    socketio.emit("receive_message", message_data, room=data.get("roomId"))

@app.post("/api/diagnose/error")
def diagnose_error():
    from flask import request
    payload = request.get_json(silent=True) or {}
    print("\n*** [FRONTEND RUNTIME ERROR DETECTED] ***")
    print(f"Message: {payload.get('message')}")
    print(f"URL: {payload.get('url')}")
    print(f"Line: {payload.get('line')}, Col: {payload.get('col')}")
    print(f"Stack: {payload.get('stack')}")
    print("****************************************\n")
    return jsonify({"success": True})

@app.post("/api/diagnose/search_trigger")
def diagnose_search_trigger():
    from flask import request
    payload = request.get_json(silent=True) or {}
    print(f"\n[FRONTEND SEARCH TRIGGERED] Query: '{payload.get('query')}', UserID: '{payload.get('userId')}'\n")
    return jsonify({"success": True})

@app.post("/api/diagnose/socket")
def diagnose_socket():
    from flask import request
    payload = request.get_json(silent=True) or {}
    print("\n=== [FRONTEND SOCKET DIAGNOSTIC REPORT] ===")
    print(f"User: '{payload.get('userId')}' ({payload.get('userName')})")
    print(f"Event: '{payload.get('event')}'")
    print(f"Details: {payload.get('details')}")
    print("========================================\n")
    return jsonify({"success": True})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3001"))
    socketio.run(app, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True, debug=True)
