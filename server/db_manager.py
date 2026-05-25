import os
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "zook.db"

def get_db_conn():
    """获取线程安全的 SQLite 数据库连接，并启用 WAL 模式和 Dict Row Factory"""
    conn = sqlite3.connect(str(DB_PATH), timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn

def init_db():
    """初始化数据库表结构"""
    print(f"[DB] Initializing database at {DB_PATH}...")
    conn = get_db_conn()
    cursor = conn.cursor()
    
    # 1. 注册用户与认证表 (users)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        studentId TEXT,
        passwordHash TEXT,
        data TEXT
    )
    """)
    
    # 2. 书籍商品表 (books)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT,
        price REAL,
        sellerId TEXT,
        status TEXT,
        data TEXT
    )
    """)
    
    # 3. 订单交易表 (orders)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        userId TEXT,
        bookId TEXT,
        status TEXT,
        data TEXT
    )
    """)
    
    # 4. 心愿单表 (wishes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishes (
        id TEXT PRIMARY KEY,
        userId TEXT,
        status TEXT,
        data TEXT
    )
    """)
    
    # 5. 书籍举报表 (reports)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        bookId TEXT,
        status TEXT,
        data TEXT
    )
    """)
    
    # 6. 系统通知表 (notifications)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT,
        isRead INTEGER DEFAULT 0,
        data TEXT
    )
    """)
    
    # 7. 社区笔记表 (notes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT,
        likes INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        data TEXT
    )
    """)
    
    # 8. 订单评价表 (reviews)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        orderId TEXT,
        userId TEXT,
        data TEXT
    )
    """)
    
    # 9. 课表与官方教材匹配表 (courses)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        data TEXT
    )
    """)
    
    # 10. 购物车/清单表 (carts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS carts (
        userId TEXT PRIMARY KEY,
        data TEXT
    )
    """)
    
    # 11. 收藏夹表 (favorites)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS favorites (
        userId TEXT PRIMARY KEY,
        data TEXT
    )
    """)
    
    # 12. 消息会话表 (chat)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat (
        key TEXT PRIMARY KEY,
        data TEXT
    )
    """)
    
    # 13. UI静态/动态配置表 (ui)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ui (
        key TEXT PRIMARY KEY,
        data TEXT
    )
    """)
    
    conn.commit()
    conn.close()
    print("[DB] Tables created successfully.")
    
    # 尝试加载原始 JSON 数据进行种子数据初始化
    seed_tables()

def seed_tables():
    """检测表是否为空，如果为空则从原始 JSON 种子文件读取并导入到数据库中"""
    default_seed_dir = Path(__file__).resolve().parents[1] / "client" / "public" / "data"
    seed_dir = Path(os.getenv("ZOOK_DATA_DIR", default_seed_dir))
    
    if not seed_dir.exists():
        print(f"[DB] Seed directory {seed_dir} not found. Skipping seeding.")
        return
        
    conn = get_db_conn()
    
    mappings = [
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
    
    for m in mappings:
        file_path = seed_dir / m["file"]
        if not file_path.exists():
            continue
            
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {m['table']}")
        count = cur.fetchone()[0]
        if count > 0:
            # 已经有数据，不进行种子导入
            continue
            
        print(f"[DB] Seeding table '{m['table']}' from seed file '{m['file']}'...")
        try:
            with file_path.open("r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"[DB] Error reading seed file {m['file']}: {e}")
            continue
            
        try:
            if m["singular"]:
                # 单个字典型文件 (如 chat.json, ui.json)
                key = m["file"].split(".")[0]
                cur.execute(f"INSERT INTO {m['table']} (key, data) VALUES (?, ?)", 
                            (key, json.dumps(data, ensure_ascii=False)))
            else:
                # 数组列表型文件
                if not isinstance(data, list):
                    if isinstance(data, dict):
                        data = [data]
                    else:
                        data = []
                        
                for item in data:
                    pk_val = item.get(m["pk"])
                    if pk_val is None:
                        continue
                    
                    cols = []
                    vals = []
                    for col in m["columns"]:
                        if col == m["pk"]:
                            vals.append(str(pk_val))
                            cols.append(col)
                        elif col == "isRead":
                            vals.append(1 if item.get(col) else 0)
                            cols.append(col)
                        elif col in item:
                            vals.append(item.get(col))
                            cols.append(col)
                    
                    cols.append("data")
                    vals.append(json.dumps(item, ensure_ascii=False))
                    
                    placeholders = ", ".join(["?"] * len(cols))
                    col_names = ", ".join(cols)
                    
                    cur.execute(f"INSERT INTO {m['table']} ({col_names}) VALUES ({placeholders})", tuple(vals))
            conn.commit()
            print(f"[DB] Seeding table '{m['table']}' completed successfully.")
        except Exception as e:
            print(f"[DB] Seeding table '{m['table']}' failed: {e}")
            conn.rollback()
            
    conn.close()

def db_read_table(table_name, is_singular=False, fallback=None):
    """从相应的 SQLite 表中读取数据"""
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        if is_singular:
            # 单行结构 (以 key 字段检索，例如 chat.json 对应 key='chat')
            cur.execute(f"SELECT data FROM {table_name} WHERE key = ?", (table_name,))
            row = cur.fetchone()
            if row:
                return json.loads(row["data"])
            return fallback if fallback is not None else {}
        else:
            # 多行结构
            cur.execute(f"SELECT data FROM {table_name}")
            rows = cur.fetchall()
            return [json.loads(row["data"]) for row in rows]
    except Exception as exc:
        print(f"[DB] Error reading table {table_name}:", exc)
        return fallback if fallback is not None else ([] if not is_singular else {})
    finally:
        conn.close()

def db_write_table(table_name, data, is_singular=False):
    """向相应的 SQLite 表中覆盖写入数据"""
    conn = get_db_conn()
    cur = conn.cursor()
    try:
        if is_singular:
            cur.execute(f"INSERT OR REPLACE INTO {table_name} (key, data) VALUES (?, ?)", 
                        (table_name, json.dumps(data, ensure_ascii=False)))
        else:
            # 数组列表型覆盖写入：为了保证一致性，直接清空旧行，重新插入全量数据（对应 write_json 的全部覆盖行为）
            cur.execute(f"DELETE FROM {table_name}")
            
            pk_map = {
                "users": "id", "books": "id", "orders": "id", "wishes": "id",
                "reports": "id", "notifications": "id", "notes": "id", "reviews": "id",
                "courses": "id", "carts": "userId", "favorites": "userId"
            }
            cols_map = {
                "users": ["id", "username", "studentId", "passwordHash"],
                "books": ["id", "title", "price", "sellerId", "status"],
                "orders": ["id", "userId", "bookId", "status"],
                "wishes": ["id", "userId", "status"],
                "reports": ["id", "bookId", "status"],
                "notifications": ["id", "userId", "isRead"],
                "notes": ["id", "title", "likes", "downloads"],
                "reviews": ["id", "orderId", "userId"],
                "courses": ["id"],
                "carts": ["userId"],
                "favorites": ["userId"]
            }
            
            pk = pk_map.get(table_name, "id")
            columns = cols_map.get(table_name, ["id"])
            
            if not isinstance(data, list):
                if isinstance(data, dict):
                    data = [data]
                else:
                    data = []
                    
            for item in data:
                pk_val = item.get(pk)
                if pk_val is None:
                    continue
                
                cols = []
                vals = []
                for col in columns:
                    if col == pk:
                        vals.append(str(pk_val))
                        cols.append(col)
                    elif col == "isRead":
                        vals.append(1 if item.get(col) else 0)
                        cols.append(col)
                    elif col in item:
                        vals.append(item.get(col))
                        cols.append(col)
                
                cols.append("data")
                vals.append(json.dumps(item, ensure_ascii=False))
                
                placeholders = ", ".join(["?"] * len(cols))
                col_names = ", ".join(cols)
                
                cur.execute(f"INSERT INTO {table_name} ({col_names}) VALUES ({placeholders})", tuple(vals))
        conn.commit()
    except Exception as exc:
        print(f"[DB] Error writing table {table_name}:", exc)
        conn.rollback()
    finally:
        conn.close()
