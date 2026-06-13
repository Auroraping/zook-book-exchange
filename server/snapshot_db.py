import shutil
import sqlite3

from db_snapshot import DB_PATH, SNAPSHOT_PATH


def integrity_ok(path):
    conn = sqlite3.connect(path)
    try:
        row = conn.execute("PRAGMA integrity_check").fetchone()
        return row and row[0] == "ok"
    finally:
        conn.close()


def main():
    if not DB_PATH.exists():
        raise SystemExit(f"Missing runtime database: {DB_PATH}")
    if not integrity_ok(DB_PATH):
        raise SystemExit("Runtime database failed integrity_check")
    SNAPSHOT_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(DB_PATH, SNAPSHOT_PATH)
    print(f"Snapshot updated: {SNAPSHOT_PATH}")


if __name__ == "__main__":
    main()
