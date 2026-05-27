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
            # 数组列表型覆盖写入：为了保证一致性，直接清空旧行，重新插入全量数据
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
                data = [data] if isinstance(data, dict) else []
                    
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
