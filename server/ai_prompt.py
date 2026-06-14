from ai_defaults import BASE_SYSTEM_PROMPT


def render_user(user):
    if not isinstance(user, dict) or not user.get("loggedIn"):
        return "用户未登录或无法识别。"
    auth = "已认证" if user.get("zjuAuthenticated") else "未认证"
    parts = [f"账号：{user.get('email') or '未知'}", f"浙大身份：{auth}"]
    identity = " ".join([str(user.get(k) or "") for k in ("realName", "studentId", "major")]).strip()
    if identity:
        parts.append(f"身份资料：{identity}")
    return "；".join(parts)


def compact_items(items, limit, renderer):
    rendered = [renderer(item) for item in (items or [])[:limit]]
    return "；".join([item for item in rendered if item])


def render_context(context):
    if not isinstance(context, dict):
        return ""
    parts = [f"当前用户：{render_user(context.get('user'))}"]
    books = compact_items(context.get("books"), 8, lambda b: (
        f"{b.get('id')}｜{b.get('title')}｜¥{b.get('price') or '?'}｜{b.get('courseName') or '未绑定课程'}"
    ))
    if books:
        parts.append(f"在售书籍候选：{books}")
    courses = [c.get("name") or c.get("courseName") for c in (context.get("courses") or [])[:10]]
    courses = [name for name in courses if name]
    if courses:
        parts.append(f"用户课程：{'、'.join(courses)}")
    favs = (context.get("favorites") or {}).get("bookIds") or []
    if favs:
        parts.append(f"用户收藏书籍ID：{', '.join(map(str, favs[:8]))}")
    wishes = [w.get("title") for w in (context.get("wishes") or [])[:6] if w.get("title")]
    if wishes:
        parts.append(f"用户心愿：{'、'.join(wishes)}")
    notes = compact_items(context.get("notes"), 8, lambda n: (
        f"{n.get('id')}｜{n.get('title')}｜{n.get('course') or '未标课程'}｜下载{n.get('downloads') or 0}"
    ))
    if notes:
        parts.append(f"相关资料候选：{notes}")
    return "\n".join(parts)


def normalize_history(history):
    normalized = []
    for item in (history or [])[-8:]:
        role = "user" if item.get("role") == "user" else "assistant"
        content = str(item.get("content") or "")[:900]
        if content:
            normalized.append({"role": role, "content": content})
    return normalized


def build_messages(payload, agent, context, conversation):
    summary = (conversation or {}).get("summary") or ""
    context_text = render_context(context)
    stable = f"{BASE_SYSTEM_PROMPT}\n\n当前桃酥角色：\n{agent.get('prompt') or ''}".strip()
    dynamic = f"当前可用上下文：\n{context_text}".strip()
    if summary:
        dynamic = f"{dynamic}\n\n较早对话摘要：{summary[:1200]}"
    return [
        {"role": "system", "content": stable},
        {"role": "system", "content": dynamic},
        *normalize_history((conversation or {}).get("messages") or []),
        *normalize_history((payload or {}).get("history") or [])[-4:],
        {"role": "user", "content": str((payload or {}).get("message") or "")[:1800]},
    ]


def next_summary(old_summary, messages):
    text = old_summary or ""
    for item in (messages or [])[-4:]:
        role = "用户" if item.get("role") == "user" else "桃酥"
        content = str(item.get("content") or "").replace("\n", " ")[:160]
        if content:
            text = f"{text} {role}:{content}".strip()
    return text[-1600:]
