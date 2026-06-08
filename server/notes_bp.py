from flask import Blueprint, jsonify, request

from account_identity import normalize_account_id
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json
from notes_helper import handle_download, make_note
from upload_paths import save_upload

notes_bp = Blueprint("notes_bp", __name__)


def request_payload():
    return request.get_json(silent=True) or {}


def note_summary(note):
    keys = [
        "id", "title", "course", "type", "difficulty", "author", "likes",
        "downloads", "updatedAt", "isPaid", "tags", "desc", "pointsRequired",
        "userId", "fileUrl", "fileName",
    ]
    return {key: note.get(key) for key in keys if key in note}


def ensure_note_defaults(notes):
    mapping = {
        "calculus-note": ("/uploads/calculus-note.txt", "微积分极限、导数与积分考前笔记.txt"),
        "linear-note": ("/uploads/linear-note.txt", "线性代数矩阵、秩与方程组笔记.txt"),
        "mao-outline": ("/uploads/mao-outline.txt", "毛概核心章节框架与时间线.txt"),
    }
    updated = False
    for note in notes:
        if note.get("id") in mapping and not note.get("fileUrl"):
            note["fileUrl"], note["fileName"] = mapping[note["id"]]
            updated = True
        note.setdefault("pointsRequired", 0)
        note.setdefault("comments", [])
    return updated


@notes_bp.get("/api/notifications")
def list_notifications():
    user_id = normalize_account_id(request.args.get("userId") or "me")
    notifications = read_json("notifications.json", [])
    items = [item for item in notifications if item.get("userId") in (None, "", user_id, "me")]
    return jsonify({"success": True, "notifications": items})


@notes_bp.patch("/api/notifications/read")
def mark_notifications_read():
    user_id = normalize_account_id(request_payload().get("userId") or "me")

    def update(notifications):
        touched = 0
        for item in notifications:
            if item.get("userId") in (None, "", user_id, "me") and not item.get("isRead"):
                item["isRead"] = True
                item["readAt"] = now_text()
                touched += 1
        return touched

    return jsonify({"success": True, "count": mutate_json("notifications.json", update, [])})


@notes_bp.get("/api/notes")
def list_notes():
    notes = read_json("notes.json", [])
    if ensure_note_defaults(notes):
        write_json("notes.json", notes)
    return jsonify({"success": True, "notes": [note_summary(note) for note in notes]})


@notes_bp.post("/api/notes")
def create_note():
    title = request.form.get("title", "").strip()
    course = request.form.get("course", "").strip()
    if not title or not course:
        return jsonify({"success": False, "message": "标题和课程为必填项"}), 400

    file = request.files.get("file")
    file_url, file_name = None, None
    if file and file.filename:
        file_name = file.filename
        file_url, _ = save_upload(file, "note")

    def add_note(notes):
        note = make_note(request, file_url, file_name)
        notes.insert(0, note)
        return note

    return jsonify({"success": True, "note": mutate_json("notes.json", add_note, [])})


@notes_bp.get("/api/notes/<note_id>")
def get_note(note_id):
    notes = read_json("notes.json", [])
    note = find_by_id(notes, note_id)
    if not note:
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    ensure_note_defaults([note])
    return jsonify({"success": True, "note": note})


@notes_bp.patch("/api/notes/<note_id>")
def update_note(note_id):
    payload = request_payload()
    action = payload.get("action")
    if action not in {"like", "download"}:
        return jsonify({"success": False, "message": "操作不合法"}), 400
    if action == "download":
        result = handle_download(note_id, payload.get("userId"))
        if result.get("error"):
            return jsonify({"success": False, "message": result["error"]}), result["status"]

    def update(notes):
        note = find_by_id(notes, note_id)
        if not note:
            return None
        key = "likes" if action == "like" else "downloads"
        note[key] = int(note.get(key) or 0) + 1
        ensure_note_defaults([note])
        return note

    note = mutate_json("notes.json", update, [])
    if not note:
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    return jsonify({"success": True, "note": note})


@notes_bp.post("/api/notes/<note_id>/comments")
def add_note_comment(note_id):
    payload = request_payload()
    content = str(payload.get("content") or "").strip()
    if not content:
        return jsonify({"success": False, "message": "评论内容不能为空"}), 400

    def update(notes):
        note = find_by_id(notes, note_id)
        if not note:
            return None
        note.setdefault("comments", []).append({
            "id": new_id("c"),
            "userId": normalize_account_id(payload.get("userId") or "me"),
            "author": payload.get("author") or "浙大同学",
            "content": content,
            "createdAt": now_text(),
        })
        return note

    note = mutate_json("notes.json", update, [])
    if not note:
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    return jsonify({"success": True, "note": note})


@notes_bp.delete("/api/notes/<note_id>")
def delete_note(note_id):
    user_id = normalize_account_id(request.args.get("userId") or "me")

    def remove_note(notes):
        note = find_by_id(notes, note_id)
        if not note:
            return "not_found"
        if normalize_account_id(note.get("userId")) != user_id:
            return "permission_denied"
        notes.remove(note)
        return "success"

    result = mutate_json("notes.json", remove_note, [])
    if result == "not_found":
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    if result == "permission_denied":
        return jsonify({"success": False, "message": "无权删除此笔记"}), 403
    return jsonify({"success": True, "message": "笔记已删除"})
