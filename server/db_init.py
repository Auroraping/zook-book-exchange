import os
import json
from pathlib import Path
from db_manager import get_db_conn
from db_schema import TABLES_SQL
from db_seed_data import MAPPINGS

DB_PATH = Path(__file__).resolve().parent / "zook.db"

def init_db():
    """初始化数据库表结构"""
    print(f"[DB] Initializing database at {DB_PATH}...")
    conn = get_db_conn()
    conn.execute("PRAGMA journal_mode=WAL;")
    cursor = conn.cursor()
    
    # 循环执行导入的所有建表 SQL
    for sql in TABLES_SQL:
        cursor.execute(sql)
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
    except Exception:
        pass
    try:
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL AND email != ''")
    except Exception:
        pass
        
    conn.commit()
    conn.close()
    print("[DB] Tables created successfully.")
    seed_tables()
    from db_migrations import run_startup_migrations
    run_startup_migrations()

def seed_tables():
    """检测表是否为空，如果为空则从原始 JSON 种子文件读取并导入到数据库中"""
    default_seed_dir = Path(__file__).resolve().parents[1] / "client" / "public" / "data"
    seed_dir = Path(os.getenv("ZOOK_DATA_DIR", default_seed_dir))
    
    if not seed_dir.exists():
        print(f"[DB] Seed directory {seed_dir} not found. Skipping seeding.")
        return
        
    conn = get_db_conn()
    
    for m in MAPPINGS:
        file_path = seed_dir / m["file"]
        if not file_path.exists():
            continue
            
        cur = conn.cursor()
        cur.execute(f"SELECT COUNT(*) FROM {m['table']}")
        count = cur.fetchone()[0]
        if count > 0:
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
                key = m["file"].split(".")[0]
                cur.execute(f"INSERT INTO {m['table']} (key, data) VALUES (?, ?)", 
                            (key, json.dumps(data, ensure_ascii=False)))
            else:
                if not isinstance(data, list):
                    data = [data] if isinstance(data, dict) else []
                        
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
