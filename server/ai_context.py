import re

from account_identity import normalize_account_id
from json_store import read_json


def text_tokens(text):
    raw = str(text or "").lower()
    words = re.findall(r"[\w\u4e00-\u9fff]+", raw)
    tokens = set(words)
    for word in words:
        if re.search(r"[\u4e00-\u9fff]", word):
            tokens.update(word[i:i + 2] for i in range(max(0, len(word) - 1)))
    return [item for item in tokens if item]


def user_context(user):
    if not user:
        return {"loggedIn": False}
    return {
        "loggedIn": True,
        "email": user.get("email") or user.get("username"),
        "name": user.get("name"),
        "zjuAuthenticated": bool(user.get("zjuAuthenticated")),
        "studentId": user.get("studentId"),
        "realName": user.get("realName"),
        "major": user.get("major"),
    }


def course_context(user):
    courses = ((user or {}).get("scheduleData") or {}).get("courses") or read_json("courses.json", [])
    return [
        {"name": c.get("name") or c.get("courseName"), "teacher": c.get("teacher"), "term": c.get("term")}
        for c in courses[:12]
        if c.get("name") or c.get("courseName")
    ]


def book_item(book):
    return {
        "id": book.get("id"),
        "title": book.get("title"),
        "author": book.get("author"),
        "price": book.get("price"),
        "seller": book.get("seller"),
        "courseName": book.get("courseName"),
        "aiScore": book.get("aiScore"),
        "path": f"/book/{book.get('id')}",
    }


def book_context(user):
    raw_user_id = (user or {}).get("id")
    user_id = normalize_account_id(raw_user_id) if raw_user_id else ""
    books = [book_item(b) for b in read_json("books.json", []) if b.get("status") == "approved"]
    favorites = next((f for f in read_json("favorites.json", []) if f.get("userId") == user_id), {})
    wishes = [w for w in read_json("wishes.json", []) if user_id and w.get("userId") == user_id]
    refs = [{"type": "book", "id": b["id"], "title": b["title"], "path": b["path"]} for b in books[:6]]
    return {"books": books[:12], "courses": course_context(user), "favorites": favorites, "wishes": wishes[:6]}, refs


def note_score(note, tokens):
    haystack = " ".join([
        str(note.get("title") or ""), str(note.get("course") or ""),
        str(note.get("type") or ""), " ".join(note.get("tags") or []),
        str(note.get("desc") or ""),
    ]).lower()
    score = sum(4 for token in tokens if token and token in haystack)
    exam_query = any(token in {"历年", "年卷", "试卷", "小测", "期末"} for token in tokens)
    if exam_query and any(word in haystack for word in ("试卷", "小测", "真题", "期末", "卷")):
        score += 12
    score += min(5, int(note.get("downloads") or 0) // 100)
    score += min(5, int(note.get("likes") or 0) // 300)
    return score


def note_context(message):
    tokens = text_tokens(message)
    notes = read_json("notes.json", [])
    
    try:
        from ai_vector_store import search_notes
        vector_results = search_notes(message, n_results=20)
        distance_map = {str(res["id"]): res["distance"] for res in vector_results}
    except Exception as e:
        print(f"Vector search failed: {e}")
        distance_map = {}

    def hybrid_score(note, tokens):
        score = note_score(note, tokens)
        note_id = str(note.get("id"))
        if note_id in distance_map:
            # ChromaDB cosine distance: 0 is exact match, 1 is orthogonal, 2 is opposite
            # We want smaller distance -> higher boost.
            dist = distance_map[note_id]
            # Add up to 20 points for very close vectors
            score += max(0, (1.0 - dist) * 20)
        return score

    ranked = sorted(notes, key=lambda note: hybrid_score(note, tokens), reverse=True)
    items = []
    for note in ranked[:12]:
        items.append({
            "id": note.get("id"), "title": note.get("title"), "course": note.get("course"),
            "type": note.get("type"), "downloads": note.get("downloads"), "likes": note.get("likes"),
            "tags": note.get("tags") or [], "desc": str(note.get("desc") or "")[:180],
            "path": f"/community/note/{note.get('id')}",
        })
    refs = [{"type": "note", "id": n["id"], "title": n["title"], "path": n["path"]} for n in items[:10]]
    return {"notes": items, "queryTokens": tokens}, refs


def build_context(agent_id, user, message):
    base = {"user": user_context(user)}
    if agent_id == "book_recommend":
        ctx, refs = book_context(user)
        return {**base, **ctx}, refs
    if agent_id == "notes_search":
        ctx, refs = note_context(message)
        return {**base, **ctx}, refs
    return base, []
