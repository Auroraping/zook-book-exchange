from flask import Blueprint, jsonify, request
from account_identity import normalize_account_id, public_account
from auth_context import current_request_user
from book_public import clean_images, enrich_book, enrich_books
from json_store import find_by_id, mutate_json, new_id, now_text, read_json
from upload_paths import save_upload

books_bp = Blueprint("books_bp", __name__)


def request_payload():
    return request.get_json(silent=True) or {}


def public_user(user_id):
    return public_account(user_id)


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
        seller_id = normalize_account_id(seller_id)
        books = [book for book in books if str(book.get("sellerId")) == seller_id]
    enrich_books(books)
    return jsonify({"success": True, "books": books})


@books_bp.get("/api/books/<book_id>")
def get_book(book_id):
    book = find_by_id(read_json("books.json", []), book_id)
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    enrich_book(book)
    return jsonify({"success": True, "book": book})


@books_bp.post("/api/books")
def create_book():
    payload = request_payload()
    auth_user = current_request_user()
    user_id = auth_user.get("id") if auth_user else normalize_account_id(payload.get("sellerId") or "me")
    if not user_id or user_id == "me":
        return jsonify({"success": False, "message": "请先登录后再发布书籍"}), 401
    user = auth_user or public_user(user_id)
    seller_name = str(payload.get("sellerName") or user.get("name") or "浙大同学").strip()
    title = str(payload.get("title") or "").strip()
    price = payload.get("price")
    images = clean_images(payload)
    if not title or price in (None, ""):
        return jsonify({"success": False, "message": "请填写书名和转卖价格"}), 400
    if not images:
        return jsonify({"success": False, "message": "请至少上传一张书籍图片"}), 400

    try:
        price_value = round(float(price), 2)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "转卖价格格式不正确"}), 400

    try:
        original_price = round(float(payload.get("originalPrice") or 0), 2)
    except (TypeError, ValueError):
        original_price = 0.0

    def add_book(books):
        book = {
            "id": new_id("b"),
            "title": title,
            "author": str(payload.get("author") or "待补充").strip(),
            "condition": str(payload.get("condition") or payload.get("description") or "成色待补充").strip(),
            "price": price_value,
            "originalPrice": original_price,
            "campus": str(payload.get("campus") or "紫金港校区").strip(),
            "seller": seller_name,
            "sellerId": user_id,
            "credit": user.get("credit", 4.8),
            "hasNotes": bool(payload.get("hasNotes")),
            "courseId": str(payload.get("courseId") or ""),
            "category": str(payload.get("category") or ""),
            "courseName": str(payload.get("courseName") or ""),
            "aiScore": int(payload.get("aiScore") or 80),
            "aiSummary": str(payload.get("aiSummary") or "新发布教材，已通过安全检查并成功上架广场。"),
            "cover": images[0],
            "images": images,
            "status": "approved",
            "createdAt": now_text(),
        }
        books.insert(0, book)
        return book

    book = mutate_json("books.json", add_book, [])
    matched = match_wishes_for_book(book)
    notify(user_id, "书籍发布成功", f"你的书籍《{book['title']}》已直接发布并上架到购书广场。", "green", book["id"])
    return jsonify({"success": True, "book": enrich_book(book), "matchedCount": len(matched)})


@books_bp.post("/api/books/cover")
def upload_book_cover():
    multi_files = [file for file in request.files.getlist("files") if file and file.filename]
    if multi_files:
        urls = [save_upload(file, "book")[0] for file in multi_files]
        return jsonify({"success": True, "cover": urls[0], "images": urls})
    file = request.files.get("file")
    if not file or not file.filename:
        return jsonify({"success": False, "message": "请选择封面图片"}), 400
    cover_url, _ = save_upload(file, "book")
    return jsonify({"success": True, "cover": cover_url, "images": [cover_url]})


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
    return jsonify({"success": True, "book": enrich_book(book), "matchedCount": len(matched)})
