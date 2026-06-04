# socket_state.py
# 强单例 Socket.IO 在线连接状态。业务消息与用户数据均写入 SQLite。

online_users = {}
