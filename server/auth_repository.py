import json
from datetime import datetime, timezone

from db_manager import get_db_conn


def row_to_user(row):
    if not row:
        return None
    data = json.loads(row["data"] or "{}")
    if row["passwordHash"] and not data.get("passwordHash"):
        data["passwordHash"] = row["passwordHash"]
    return data


def find_user(login_name):
    query = str(login_name or "").strip().lower()
    if not query:
        return None
    conn = get_db_conn()
    try:
        cur = conn.execute("SELECT * FROM users")
        for row in cur.fetchall():
            user = row_to_user(row)
            values = [user.get("email"), user.get("username")]
            if any(str(value or "").strip().lower() == query for value in values):
                return user
        return None
    finally:
        conn.close()


def find_user_by_id(user_id):
    conn = get_db_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (str(user_id),)).fetchone()
        return row_to_user(row)
    finally:
        conn.close()


def save_user(user):
    conn = get_db_conn()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO users (id, username, email, studentId, passwordHash, data)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user.get("id"),
                user.get("username"),
                user.get("email"),
                user.get("studentId"),
                user.get("passwordHash"),
                json.dumps(user, ensure_ascii=False),
            ),
        )
        conn.commit()
        return user
    finally:
        conn.close()


def save_token(jti, user_id, expires_at):
    conn = get_db_conn()
    try:
        conn.execute(
            """
            INSERT OR REPLACE INTO auth_tokens
            (jti, userId, expiresAt, revokedAt, createdAt)
            VALUES (?, ?, ?, NULL, ?)
            """,
            (jti, user_id, expires_at, datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()
    finally:
        conn.close()


def revoke_token(jti):
    if not jti:
        return
    conn = get_db_conn()
    try:
        conn.execute(
            "UPDATE auth_tokens SET revokedAt = ? WHERE jti = ?",
            (datetime.now(timezone.utc).isoformat(), jti),
        )
        conn.commit()
    finally:
        conn.close()


def active_token(jti):
    conn = get_db_conn()
    try:
        row = conn.execute(
            "SELECT jti FROM auth_tokens WHERE jti = ? AND revokedAt IS NULL",
            (jti,),
        ).fetchone()
        return bool(row)
    finally:
        conn.close()
