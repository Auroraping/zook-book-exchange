# 数据库表结构 Schema 配置文件
# 将复杂的建表 SQL 语句物理抽离到此文件中，以符合单文件总行数不超过 200 行的作业要求

TABLES_SQL = [
    # 1. 注册用户与认证表
    """
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        email TEXT,
        studentId TEXT,
        passwordHash TEXT,
        data TEXT
    )
    """,
    # 2. 书籍商品表
    """
    CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT,
        price REAL,
        sellerId TEXT,
        status TEXT,
        data TEXT
    )
    """,
    # 3. 订单交易表
    """
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT,
        bookId TEXT,
        status TEXT,
        data TEXT
    )
    """,
    # 4. 心愿单表
    """
    CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        userId TEXT,
        status TEXT,
        data TEXT
    )
    """,
    # 5. 书籍举报表
    """
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        bookId TEXT,
        status TEXT,
        data TEXT
    )
    """,
    # 6. 系统通知表
    """
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT,
        isRead INTEGER DEFAULT 0,
        data TEXT
    )
    """,
    # 7. 社区笔记表
    """
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        likes INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        data TEXT
    )
    """,
    # 8. 订单评价表
    """
    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        orderId TEXT,
        userId TEXT,
        data TEXT
    )
    """,
    # 9. 课表与官方教材匹配表
    """
    CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        data TEXT
    )
    """,
    # 10. 购物车/清单表
    """
    CREATE TABLE IF NOT EXISTS carts (
        userId TEXT PRIMARY KEY,
        data TEXT
    )
    """,
    # 11. 收藏夹表
    """
    CREATE TABLE IF NOT EXISTS favorites (
        userId TEXT PRIMARY KEY,
        data TEXT
    )
    """,
    # 12. 消息会话表
    """
    CREATE TABLE IF NOT EXISTS chat (
        key TEXT PRIMARY KEY,
        data TEXT
    )
    """,
    # 13. UI静态/动态配置表
    """
    CREATE TABLE IF NOT EXISTS ui (
        key TEXT PRIMARY KEY,
        data TEXT
    )
    """,
    # 14. JWT 登录会话表，用于登出后撤销 token
    """
    CREATE TABLE IF NOT EXISTS auth_tokens (
        jti TEXT PRIMARY KEY,
        userId TEXT,
        expiresAt TEXT,
        revokedAt TEXT,
        createdAt TEXT
    )
    """
]
