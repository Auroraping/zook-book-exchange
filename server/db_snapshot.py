import shutil
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "zook.db"
SNAPSHOT_PATH = BASE_DIR / "db_snapshot" / "zook_seed.db"


def restore_snapshot_if_missing():
    if DB_PATH.exists() or not SNAPSHOT_PATH.exists():
        return False
    shutil.copy2(SNAPSHOT_PATH, DB_PATH)
    print(f"[DB] Restored SQLite database from snapshot: {SNAPSHOT_PATH}")
    return True
