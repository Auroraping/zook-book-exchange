# socket_state.py
# 强单例 Socket.IO 共享状态文件，杜绝热重载时不同蓝图命名空间内状态实例不一致问题

online_users = {}
registered_users = {
    "U_MOCK_001": "书友小陈",
    "U_MOCK_002": "李同学",
    "U_MOCK_003": "计科王同学",
    "U_MOCK_004": "高数笔记小助手",
}
