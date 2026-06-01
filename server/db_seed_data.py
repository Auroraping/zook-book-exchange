# 数据库种子填充静态映射配置，独立文件以符合单个文件行数不超过 200 行的作业要求
MAPPINGS = [
    {"file": "users.json", "table": "users", "pk": "id", "columns": ["id", "username", "studentId", "passwordHash"], "singular": False},
    {"file": "books.json", "table": "books", "pk": "id", "columns": ["id", "title", "price", "sellerId", "status"], "singular": False},
    {"file": "orders.json", "table": "orders", "pk": "id", "columns": ["id", "userId", "bookId", "status"], "singular": False},
    {"file": "wishes.json", "table": "wishes", "pk": "id", "columns": ["id", "userId", "status"], "singular": False},
    {"file": "reports.json", "table": "reports", "pk": "id", "columns": ["id", "bookId", "status"], "singular": False},
    {"file": "notifications.json", "table": "notifications", "pk": "id", "columns": ["id", "userId", "isRead"], "singular": False},
    {"file": "notes.json", "table": "notes", "pk": "id", "columns": ["id", "title", "likes", "downloads"], "singular": False},
    {"file": "reviews.json", "table": "reviews", "pk": "id", "columns": ["id", "orderId", "userId"], "singular": False},
    {"file": "courses.json", "table": "courses", "pk": "id", "columns": ["id"], "singular": False},
    {"file": "carts.json", "table": "carts", "pk": "userId", "columns": ["userId"], "singular": False},
    {"file": "favorites.json", "table": "favorites", "pk": "userId", "columns": ["userId"], "singular": False},
    {"file": "chat.json", "table": "chat", "pk": "key", "columns": ["key"], "singular": True},
    {"file": "ui.json", "table": "ui", "pk": "key", "columns": ["key"], "singular": True},
]
