import os
import json
import time
import uuid
from flask import Blueprint, jsonify, request
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

notes_bp = Blueprint("notes_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

@notes_bp.get("/api/notifications")
def list_notifications():
    user_id = request.args.get("userId")
    notifications = read_json("notifications.json", [])
    if user_id:
        notifications = [item for item in notifications if item.get("userId") in (None, "", user_id, "me")]
    return jsonify({"success": True, "notifications": notifications})

@notes_bp.patch("/api/notifications/read")
def mark_notifications_read():
    payload = request_payload()
    user_id = payload.get("userId") or "me"

    def update(notifications):
        touched = 0
        for item in notifications:
            if item.get("userId") in (None, "", user_id, "me") and not item.get("isRead"):
                item["isRead"] = True
                item["readAt"] = now_text()
                touched += 1
        return touched

    count = mutate_json("notifications.json", update, [])
    return jsonify({"success": True, "count": count})

@notes_bp.get("/api/notes")
def list_notes():
    notes = read_json("notes.json", [])
    mapping = {
        "calculus-note": ("/uploads/calculus-note.txt", "微积分极限、导数与积分考前笔记.txt"),
        "linear-note": ("/uploads/linear-note.txt", "线性代数矩阵、秩与方程组笔记.txt"),
        "mao-outline": ("/uploads/mao-outline.txt", "毛概核心章节框架与时间线.txt")
    }
    updated = False
    for note in notes:
        if note.get("id") in mapping and not note.get("fileUrl"):
            url, name = mapping[note["id"]]
            note["fileUrl"] = url
            note["fileName"] = name
            updated = True
    if updated:
        write_json("notes.json", notes)
        
    return jsonify({"success": True, "notes": notes})

@notes_bp.post("/api/notes")
def create_note():
    title = request.form.get("title", "").strip()
    course = request.form.get("course", "").strip()
    if not title or not course:
        return jsonify({"success": False, "message": "标题和课程关联为必填项"}), 400
        
    file = request.files.get("file")
    file_url = None
    file_name_orig = None
    
    if file and file.filename:
        upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "client", "public", "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        
        file_name_orig = file.filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"note_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        file_url = f"/uploads/{unique_filename}"
        
    def add_note(notes):
        tags_raw = request.form.get("tags", "")
        for delimiter in [",", ";", "，", "；"]:
            tags_raw = tags_raw.replace(delimiter, " ")
        tags_list = [t.strip() for t in tags_raw.split(" ") if t.strip()]
        if not tags_list:
            tags_list = ["共享资料"]
            
        sections_raw = request.form.get("sections")
        if sections_raw:
            try:
                sections = json.loads(sections_raw)
            except Exception:
                sections = [{"heading": "资料概述", "body": request.form.get("desc") or "这篇资料暂时没有提供章节内容描述。"}]
        else:
            sections = [{"heading": "资料附件说明", "body": "这是一份上传的文件资料，请点击下方下载按钮获取完整附件。"}]
            
        note = {
            "id": new_id("n"),
            "title": title,
            "course": course,
            "type": request.form.get("type", "共享资料").strip(),
            "difficulty": request.form.get("difficulty", "基础夯实").strip(),
            "author": request.form.get("author", "浙大同学").strip() or "浙大同学",
            "likes": 0,
            "downloads": 0,
            "updatedAt": now_text().split(" ")[0],
            "isPaid": request.form.get("isPaid") == "true",
            "tags": tags_list,
            "desc": (request.form.get("desc") or "").strip(),
            "sections": sections,
            "fileUrl": file_url,
            "fileName": file_name_orig
        }
        notes.insert(0, note)
        return note

    note = mutate_json("notes.json", add_note, [])
    return jsonify({"success": True, "note": note})

@notes_bp.get("/api/notes/<note_id>")
def get_note(note_id):
    note = find_by_id(read_json("notes.json", []), note_id)
    if not note:
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    return jsonify({"success": True, "note": note})

@notes_bp.patch("/api/notes/<note_id>")
def update_note(note_id):
    action = request_payload().get("action")
    if action not in {"like", "download"}:
        return jsonify({"success": False, "message": "操作不合法"}), 400

    def update(notes):
        note = find_by_id(notes, note_id)
        if not note:
            return None
        key = "likes" if action == "like" else "downloads"
        note[key] = int(note.get(key) or 0) + 1
        return note

    note = mutate_json("notes.json", update, [])
    if not note:
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    return jsonify({"success": True, "note": note})
