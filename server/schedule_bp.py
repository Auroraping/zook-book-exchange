import os
from flask import Blueprint, jsonify, request
from json_store import find_by_id, read_json
from schedule_helper import fetch_schedule

schedule_bp = Blueprint("schedule_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

@schedule_bp.post("/api/schedule")
def schedule():
    payload = request_payload()
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    
    # 优先发起真实选课爬虫请求获取真实课表
    try:
        if username and password:
            sched = fetch_schedule(username, password)
            return jsonify({
                "success": True, 
                "courses": sched["courses"], 
                "semester": sched.get("termInfo", {}).get("semester") or "大二春夏学期", 
                "raw": sched.get("raw", {})
            })
    except Exception as e:
        print("[Schedule] 真实选课爬虫同步失败，降级为Mock数据:", e)
        
    courses = []
    try:
        import json
        with open(os.path.join(os.path.dirname(__file__), "..", "client", "public", "data", "courses.json"), "r", encoding="utf-8") as f:
            courses = json.load(f)
    except Exception as e:
        print("[Schedule] 无法读取兜底课表数据:", e)
        
    return jsonify({
        "success": True, 
        "courses": courses, 
        "semester": "大二春夏学期",
        "raw": {"xm": "浙大同学", "xh": username or "student"}
    })

@schedule_bp.post("/api/textbooks")
def textbooks():
    # 动态匹配 SQLite 中在售的书籍进行推荐
    courses = read_json("courses.json", [])
    books = read_json("books.json", [])
    matched_books = []
    for c in courses:
        for bid in c.get("bookIds", []):
            book = find_by_id(books, bid)
            if book:
                matched_books.append({
                    "courseId": c["id"], 
                    "courseName": c["name"], 
                    "bookId": bid, 
                    "title": book["title"],
                    "price": book["price"], 
                    "cover": book["cover"], 
                    "seller": book["seller"]
                })
    return jsonify({"success": True, "textbooks": matched_books})
