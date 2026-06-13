import json

from ai_prompt import build_messages, next_summary
from ai_repository import find_faq, get_conversation, log_usage, save_conversation, save_faq
from deepseek_client import ApiError, post_chat, stream_chat


def user_id(user):
    return str((user or {}).get("id") or "guest")


def auth_state(user):
    if not user:
        return "guest"
    return "zju" if user.get("zjuAuthenticated") else "account"


def clean_message(payload):
    message = str((payload or {}).get("message") or "").strip()
    if not message:
        raise ApiError("请输入问题", status=400)
    return message


def conversation_messages(conversation, question, reply):
    items = list((conversation or {}).get("messages") or [])
    items.append({"role": "user", "content": question})
    items.append({"role": "assistant", "content": reply})
    return items[-12:]


def usage_info(user, agent, source, result):
    return {
        "userId": user_id(user), "agentId": agent["id"], "model": result.get("model"),
        "source": source, "latencyMs": result.get("latencyMs"), "usage": result.get("usage") or {},
    }


def public_stats(source, result):
    usage = result.get("usage") or {}
    return {
        "source": source,
        "model": result.get("model"),
        "latencyMs": int(result.get("latencyMs") or 0),
        "totalTokens": usage.get("total_tokens") or 0,
        "cacheHitTokens": usage.get("prompt_cache_hit_tokens") or 0,
        "cacheMissTokens": usage.get("prompt_cache_miss_tokens") or 0,
    }


def should_cache(agent, question, reply):
    return agent["id"] == "general" and len(question) <= 80 and len(reply) <= 1200


def ask_taosu(payload, agent, context, references, user):
    question = clean_message(payload)
    faq = find_faq(agent["id"], question, auth_state(user))
    if faq:
        result = {"reply": faq["reply"], "references": faq["references"], "model": "faq-cache", "usage": {}, "latencyMs": 0}
        log_usage(usage_info(user, agent, "faq", result))
        return {**result, "source": "faq", "stats": public_stats("faq", result)}

    conv = get_conversation(user_id(user), agent["id"])
    result = post_chat(build_messages(payload, agent, context, conv), agent)
    result["references"] = references or []
    messages = conversation_messages(conv, question, result["reply"])
    save_conversation(user_id(user), agent["id"], messages, next_summary(conv.get("summary"), messages))
    if should_cache(agent, question, result["reply"]):
        save_faq(agent["id"], question, result["reply"], result["references"], auth_state=auth_state(user))
    log_usage(usage_info(user, agent, "model", result))
    return {**result, "source": "model", "stats": public_stats("model", result)}


def stream_events(payload, agent, context, references, user):
    question = clean_message(payload)
    faq = find_faq(agent["id"], question, auth_state(user))
    if faq:
        yield sse("stage", {"label": "命中 FAQ 缓存"})
        yield sse("delta", {"text": faq["reply"]})
        result = {"model": "faq-cache", "usage": {}, "latencyMs": 0}
        log_usage(usage_info(user, agent, "faq", result))
        yield sse("done", {"references": faq["references"], "stats": public_stats("faq", result), "source": "faq", **result})
        return

    conv = get_conversation(user_id(user), agent["id"])
    yield sse("stage", {"label": "检索上下文"})
    messages = build_messages(payload, agent, context, conv)
    yield sse("stage", {"label": "生成回答"})
    reply_parts = []
    final = {}
    for event in stream_chat(messages, agent):
        if event["type"] == "delta":
            reply_parts.append(event["text"])
            yield sse("delta", {"text": event["text"]})
        elif event["type"] == "done":
            final = event
    reply = "".join(reply_parts).strip()
    messages = conversation_messages(conv, question, reply)
    save_conversation(user_id(user), agent["id"], messages, next_summary(conv.get("summary"), messages))
    result = {"model": final.get("model"), "usage": final.get("usage") or {}, "latencyMs": final.get("latencyMs")}
    if should_cache(agent, question, reply):
        save_faq(agent["id"], question, reply, references, auth_state=auth_state(user))
    log_usage(usage_info(user, agent, "model-stream", result))
    yield sse("done", {"references": references or [], "stats": public_stats("model", result), "source": "model", **result})


def sse(event, data):
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def get_recommendation_from_ai(courses, books):
    course_names = [c.get("name") for c in courses if c.get("name")][:12]
    simple_books = [
        {"id": b.get("id"), "title": b.get("title"), "author": b.get("author", ""), "category": b.get("category", "")}
        for b in books[:30]
    ]
    if not course_names or not simple_books:
        return None
    payload = {
        "message": (
            "根据课程和在售书籍为每本书返回推荐评分。只输出 JSON 数组，"
            "格式为 [{\"id\":\"书籍ID\",\"aiScore\":90,\"aiSummary\":\"理由\"}]。"
            f"\n课程：{json.dumps(course_names, ensure_ascii=False)}"
            f"\n书籍：{json.dumps(simple_books, ensure_ascii=False)}"
        )
    }
    messages = [
        {"role": "system", "content": "你是教材推荐评分器，只输出纯 JSON 数组，不输出解释。"},
        {"role": "user", "content": payload["message"][:3000]},
    ]
    try:
        result = post_chat(messages, {"id": "book_recommend", "model": "deepseek-v4-flash"})
        content = result["reply"].strip()
        if content.startswith("```"):
            content = "\n".join(content.splitlines()[1:-1]).strip()
        return json.loads(content)
    except Exception as exc:
        print("[AI Recommend] fallback:", exc)
        return None


def get_recommendation_fallback(courses, books):
    course_names = [c.get("name", "") for c in courses if c.get("name")]
    results = []
    for book in books:
        title = book.get("title", "")
        matched = next((name for name in course_names if name and (name in title or title in name)), None)
        score = 90 if matched else 60
        summary = f"此教材与当前课程《{matched}》高度相关，建议优先考虑。" if matched else "该教材与当前课表课程暂无明显关联，建议按个人需要谨慎购买。"
        results.append({"id": book.get("id"), "aiScore": score, "aiSummary": summary})
    return results
