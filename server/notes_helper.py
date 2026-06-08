import json

from account_identity import normalize_account_id, transfer_points
from json_store import find_by_id, new_id, now_text, read_json


def parse_tags(raw):
    text = str(raw or "")
    for delimiter in [",", ";", "，", "；"]:
        text = text.replace(delimiter, " ")
    tags = [item.strip() for item in text.split(" ") if item.strip()]
    return tags or ["共享资料"]


def parse_sections(raw, desc):
    if raw:
        try:
            return json.loads(raw)
        except Exception:
            pass
    return [{"heading": "资料附件说明", "body": desc or "这是一份上传的文件资料，请点击下方下载按钮获取完整附件。"}]


def make_note(request, file_url, file_name):
    points = max(0, min(10, int(request.form.get("pointsRequired") or 0)))
    desc = (request.form.get("desc") or "").strip()
    return {
        "id": new_id("n"),
        "userId": normalize_account_id(request.form.get("userId") or "me"),
        "title": request.form.get("title", "").strip(),
        "course": request.form.get("course", "").strip(),
        "type": request.form.get("type", "共享资料").strip(),
        "difficulty": request.form.get("difficulty", "基础夯实").strip(),
        "author": request.form.get("author", "浙大同学").strip() or "浙大同学",
        "likes": 0,
        "downloads": 0,
        "updatedAt": now_text().split(" ")[0],
        "isPaid": points > 0,
        "pointsRequired": points,
        "tags": parse_tags(request.form.get("tags")),
        "desc": desc,
        "sections": parse_sections(request.form.get("sections"), desc),
        "fileUrl": file_url,
        "fileName": file_name,
        "comments": [],
    }


def handle_download(note_id, user_id):
    note = find_by_id(read_json("notes.json", []), note_id)
    if not note:
        return {"error": "笔记不存在", "status": 404}
    points = int(note.get("pointsRequired") or 0)
    downloader_id = normalize_account_id(user_id or "me")
    author_id = normalize_account_id(note.get("userId") or "me")
    if points > 0 and downloader_id != author_id:
        result = transfer_points(downloader_id, author_id, points)
        if result.get("error"):
            message = f"您的积分不足！下载本篇资料需要 {points} 积分，您当前仅有 {result.get('points', 0)} 积分。"
            return {"error": message, "status": 402}
    return {"success": True}
