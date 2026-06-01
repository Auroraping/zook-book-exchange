from flask import Blueprint, jsonify, request
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

books_bp = Blueprint("books_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def public_user(user_id):
    if user_id == "me":
        ui_data = read_json("ui.json", {})
        default_user = ui_data.get("profile", {}).get("defaultUser", {})
        return {
            "id": "me",
            "name": default_user.get("name") or "浙大同学",
            "avatar": default_user.get("avatar") or "/user_avatar.png",
            "credit": 4.9,
        }
    users = read_json("users.json", [])
    return find_by_id(users, user_id) or {
        "id": user_id,
        "name": "浙大同学",
        "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}",
        "credit": 4.8,
    }

def notify(user_id, title, content, tone="blue", book_id=None):
    def add_notice(notifications):
        notice = {
            "id": new_id("n"),
            "userId": user_id,
            "type": "system",
            "title": title,
            "content": content,
            "bookId": book_id,
            "tone": tone,
            "isRead": False,
            "timestamp": now_text(),
        }
        notifications.insert(0, notice)
        return notice
    return mutate_json("notifications.json", add_notice, [])

def match_wishes_for_book(book):
    title = str(book.get("title") or "").lower()
    author = str(book.get("author") or "").lower()

    def update_wishes(wishes):
        matched = []
        for wish in wishes:
            if wish.get("status") != "seeking":
                continue
            wish_title = str(wish.get("title") or "").lower()
            wish_author = str(wish.get("author") or "").lower()
            if wish_title and (wish_title in title or title in wish_title or (wish_author and wish_author in author)):
                wish["status"] = "fulfilled"
                wish["matchedBookId"] = book.get("id")
                matched.append(wish)
        return matched

    matched_wishes = mutate_json("wishes.json", update_wishes, [])
    for wish in matched_wishes:
        notify(
            wish.get("userId") or "me",
            "心愿教材已匹配",
            f"你求购的《{wish.get('title')}》已有同学上架，建议尽快查看。",
            "green",
            book.get("id"),
        )
    return matched_wishes

@books_bp.get("/api/books")
def list_books():
    books = read_json("books.json", [])
    status = request.args.get("status")
    seller_id = request.args.get("sellerId")
    if status:
        books = [book for book in books if book.get("status") == status]
    if seller_id:
        books = [book for book in books if book.get("sellerId") == seller_id]
    return jsonify({"success": True, "books": books})

@books_bp.get("/api/books/<book_id>")
def get_book(book_id):
    book = find_by_id(read_json("books.json", []), book_id)
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    return jsonify({"success": True, "book": book})

@books_bp.post("/api/books")
def create_book():
    payload = request_payload()
    user_id = payload.get("sellerId") or "me"
    user = public_user(user_id)
    seller_name = str(payload.get("sellerName") or user.get("name") or "浙大同学").strip()
    title = str(payload.get("title") or "").strip()
    price = payload.get("price")
    if not title or price in (None, ""):
        return jsonify({"success": False, "message": "请填写书名和转卖价格"}), 400

    try:
        price_value = round(float(price), 2)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "转卖价格格式不正确"}), 400

    def add_book(books):
        book = {
            "id": new_id("b"),
            "title": title,
            "author": str(payload.get("author") or "待补充").strip(),
            "condition": str(payload.get("condition") or payload.get("description") or "成色待补充").strip(),
            "price": price_value,
            "originalPrice": round(float(payload.get("originalPrice") or 0), 2),
            "campus": str(payload.get("campus") or "紫金港校区").strip(),
            "seller": seller_name,
            "sellerId": user_id,
            "credit": user.get("credit", 4.8),
            "hasNotes": bool(payload.get("hasNotes")),
            "courseId": str(payload.get("courseId") or ""),
            "category": str(payload.get("category") or ""),
            "courseName": str(payload.get("courseName") or ""),
            "aiScore": int(payload.get("aiScore") or 80),
            "aiSummary": str(payload.get("aiSummary") or "新发布教材，已通过安全检查并进入待审核队列。"),
            "cover": str(payload.get("cover") or "/book_programming.png"),
            "status": "pending",
            "createdAt": now_text(),
        }
        books.insert(0, book)
        return book

    book = mutate_json("books.json", add_book, [])
    notify("admin", "新书待审核", f"《{book['title']}》已提交上架审核。", "blue", book["id"])
    return jsonify({"success": True, "book": book, "matchedCount": 0})

@books_bp.patch("/api/books/<book_id>")
def update_book(book_id):
    payload = request_payload()
    status = payload.get("status")
    if status not in {"approved", "rejected", "sold", "pending"}:
        return jsonify({"success": False, "message": "状态不合法"}), 400

    def update(books):
        book = find_by_id(books, book_id)
        if not book:
            return None
        book["status"] = status
        book["reviewedAt"] = now_text()
        if payload.get("reason"):
            book["reviewReason"] = payload["reason"]
        return book

    book = mutate_json("books.json", update, [])
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404

    matched = []
    if status == "approved":
        matched = match_wishes_for_book(book)
        notify(book.get("sellerId") or "me", "书籍审核通过", f"《{book.get('title')}》已进入购书广场。", "green", book_id)
    elif status == "rejected":
        notify(book.get("sellerId") or "me", "书籍审核未通过", f"《{book.get('title')}》需要修改后再提交。", "red", book_id)
    return jsonify({"success": True, "book": book, "matchedCount": len(matched)})
