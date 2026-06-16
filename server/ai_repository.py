import json
from datetime import datetime, timedelta

from ai_defaults import DEFAULT_AGENTS, DEFAULT_FAQS
from ai_faq_matcher import cache_key, is_similar_question
from db_manager import get_db_conn
from json_store import new_id


def now_text():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def row_data(row):
    return json.loads(row["data"]) if row and row["data"] else {}


def faq_result(row, source):
    data = row_data(row)
    return {
        "reply": data.get("reply"), "references": data.get("references") or [],
        "cacheKey": row["cacheKey"], "matchedQuestion": row["question"], "matchType": source,
    }


def ensure_ai_seed():
    conn = get_db_conn()
    cur = conn.cursor()
    for agent in DEFAULT_AGENTS:
        cur.execute("SELECT id FROM ai_agents WHERE id = ?", (agent["id"],))
        if not cur.fetchone():
            cur.execute("INSERT INTO ai_agents (id, data) VALUES (?, ?)", (agent["id"], json.dumps(agent, ensure_ascii=False)))
    for agent_id, question, answer in DEFAULT_FAQS:
        key = cache_key(agent_id, question)
        cur.execute("SELECT cacheKey FROM ai_faq_cache WHERE cacheKey = ?", (key,))
        if cur.fetchone():
            continue
        data = {"reply": answer, "references": [], "seeded": True}
        expires = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d %H:%M:%S")
        cur.execute(
            "INSERT INTO ai_faq_cache (cacheKey, agentId, question, expiresAt, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)",
            (key, agent_id, question, expires, now_text(), json.dumps(data, ensure_ascii=False)),
        )
    conn.commit()
    conn.close()


def list_agents():
    ensure_ai_seed()
    conn = get_db_conn()
    rows = conn.execute("SELECT data FROM ai_agents").fetchall()
    conn.close()
    return [json.loads(row["data"]) for row in rows]


def get_agent(agent_id):
    agents = list_agents()
    return next((item for item in agents if item["id"] == str(agent_id or "")), agents[0])


def public_agent(agent):
    keys = ("id", "name", "title", "scope", "tone", "welcome", "quickPrompts")
    return {key: agent[key] for key in keys if key in agent}


def public_agents():
    return [public_agent(agent) for agent in list_agents()]


def find_faq(agent_id, question, auth_state="any"):
    key = cache_key(agent_id, question, auth_state)
    fallback_key = cache_key(agent_id, question)
    conn = get_db_conn()
    row = conn.execute(
        "SELECT * FROM ai_faq_cache WHERE cacheKey IN (?, ?) ORDER BY cacheKey = ? DESC",
        (key, fallback_key, key),
    ).fetchone()
    if not row:
        conn.close()
        return None
    if row["expiresAt"] and row["expiresAt"] < now_text():
        conn.close()
        return None
    result = faq_result(row, "exact")
    conn.execute("UPDATE ai_faq_cache SET hitCount = hitCount + 1 WHERE cacheKey = ?", (row["cacheKey"],))
    conn.commit()
    conn.close()
    return result


def find_similar_faq(agent_id, question, auth_state="any"):
    if len(str(question or "").strip()) > 120:
        return None
    conn = get_db_conn()
    rows = conn.execute(
        """SELECT * FROM ai_faq_cache
        WHERE agentId = ? AND (expiresAt IS NULL OR expiresAt >= ?)
        ORDER BY updatedAt DESC LIMIT 80""",
        (agent_id, now_text()),
    ).fetchall()
    best = None
    for row in rows:
        key = row["cacheKey"]
        if not (key == cache_key(agent_id, row["question"], auth_state) or key == cache_key(agent_id, row["question"])):
            continue
        if is_similar_question(question, row["question"]):
            best = row
            break
    if not best:
        conn.close()
        return None
    result = faq_result(best, "similar")
    conn.execute("UPDATE ai_faq_cache SET hitCount = hitCount + 1 WHERE cacheKey = ?", (best["cacheKey"],))
    conn.commit()
    conn.close()
    return result


def find_cached_faq(agent_id, question, auth_state="any"):
    return find_faq(agent_id, question, auth_state) or find_similar_faq(agent_id, question, auth_state)


def save_faq(agent_id, question, reply, references=None, ttl_days=14, auth_state="any"):
    key = cache_key(agent_id, question, auth_state)
    expires = (datetime.now() + timedelta(days=ttl_days)).strftime("%Y-%m-%d %H:%M:%S")
    data = {"reply": reply, "references": references or [], "seeded": False}
    conn = get_db_conn()
    conn.execute(
        "INSERT OR REPLACE INTO ai_faq_cache (cacheKey, agentId, question, expiresAt, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)",
        (key, agent_id, str(question or "")[:300], expires, now_text(), json.dumps(data, ensure_ascii=False)),
    )
    conn.commit()
    conn.close()


def conversation_id(user_id, agent_id):
    return f"{user_id or 'guest'}:{agent_id}"


def get_conversation(user_id, agent_id):
    cid = conversation_id(user_id, agent_id)
    conn = get_db_conn()
    row = conn.execute("SELECT * FROM ai_conversations WHERE id = ?", (cid,)).fetchone()
    conn.close()
    data = row_data(row)
    return {"id": cid, "summary": (row["summary"] if row else "") or "", "messages": data.get("messages") or []}


def save_conversation(user_id, agent_id, messages, summary=""):
    cid = conversation_id(user_id, agent_id)
    kept = (messages or [])[-10:]
    data = {"messages": kept}
    conn = get_db_conn()
    conn.execute(
        "INSERT OR REPLACE INTO ai_conversations (id, userId, agentId, summary, updatedAt, data) VALUES (?, ?, ?, ?, ?, ?)",
        (cid, user_id or "guest", agent_id, summary[:2000], now_text(), json.dumps(data, ensure_ascii=False)),
    )
    conn.commit()
    conn.close()


def log_usage(info):
    usage = info.get("usage") or {}
    conn = get_db_conn()
    conn.execute(
        """INSERT INTO ai_usage_logs
        (id, userId, agentId, model, source, latencyMs, promptTokens, completionTokens, totalTokens,
         cacheHitTokens, cacheMissTokens, createdAt, data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            new_id("ailog"), info.get("userId") or "guest", info.get("agentId"), info.get("model"),
            info.get("source"), int(info.get("latencyMs") or 0), usage.get("prompt_tokens"),
            usage.get("completion_tokens"), usage.get("total_tokens"),
            usage.get("prompt_cache_hit_tokens"), usage.get("prompt_cache_miss_tokens"),
            now_text(), json.dumps(info, ensure_ascii=False),
        ),
    )
    conn.commit()
    conn.close()


def usage_summary(limit=20):
    conn = get_db_conn()
    rows = conn.execute(
        """SELECT source, agentId, model, latencyMs, totalTokens, cacheHitTokens,
        cacheMissTokens, createdAt FROM ai_usage_logs ORDER BY createdAt DESC LIMIT ?""",
        (int(limit or 20),),
    ).fetchall()
    total = conn.execute("SELECT COUNT(*) FROM ai_usage_logs").fetchone()[0]
    faq_hits = conn.execute("SELECT SUM(hitCount) FROM ai_faq_cache").fetchone()[0] or 0
    conn.close()
    return {
        "totalCalls": total,
        "faqHits": faq_hits,
        "recent": [dict(row) for row in rows],
    }
