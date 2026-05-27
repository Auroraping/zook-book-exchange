import os
from pathlib import Path

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from werkzeug.security import check_password_hash, generate_password_hash

from ai_service import ApiError, ask_taosu
from auth_service import authenticate_zju
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json
from schedule_service import fetch_schedule, fetch_textbooks


app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
app.json.ensure_ascii = False
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

BASE_DIR = Path(__file__).resolve().parent
messages = []
registered_users = {
    "U_MOCK_001": "书友小陈",
    "U_MOCK_002": "李同学",
    "U_MOCK_003": "计科王同学",
    "U_MOCK_004": "高数笔记小助手",
}
user_credentials = {}


def resolve_local_env_path():
    configured_path = os.getenv("ZOOK_ENV_FILE")
    if configured_path:
        env_path = Path(configured_path)
        return env_path if env_path.is_absolute() else BASE_DIR / env_path
    return BASE_DIR / ".env.local"


ENV_LOCAL_PATH = resolve_local_env_path()
DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-pro"
DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"


def request_payload():
    return request.get_json(silent=True) or {}


def public_auth_user(user):
    return {key: value for key, value in user.items() if key != "passwordHash"}


def mask_secret(value):
    text = str(value or "")
    if not text:
        return ""
    if len(text) <= 10:
        return f"{text[:2]}***"
    return f"{text[:6]}***{text[-4:]}"


def read_env_lines():
    if not ENV_LOCAL_PATH.exists():
        return []
    return ENV_LOCAL_PATH.read_text(encoding="utf-8").splitlines()


def single_line_env_value(value):
    text = str(value or "").strip()
    if "\n" in text or "\r" in text:
        raise ValueError("配置值不能包含换行")
    return text


def write_deepseek_env(api_key, model=None, api_url=None):
    secret = single_line_env_value(api_key)
    model_name = single_line_env_value(model or DEFAULT_DEEPSEEK_MODEL)
    endpoint = single_line_env_value(api_url or DEFAULT_DEEPSEEK_API_URL)
    preserved = []
    for line in read_env_lines():
        key = line.split("=", 1)[0].strip() if "=" in line else ""
        if key not in {"DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "DEEPSEEK_API_URL"}:
            preserved.append(line)

    values = [
        f"DEEPSEEK_API_KEY={secret}",
        f"DEEPSEEK_MODEL={model_name}",
        f"DEEPSEEK_API_URL={endpoint}",
    ]
    ENV_LOCAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    ENV_LOCAL_PATH.write_text("\n".join([*preserved, *values, ""]), encoding="utf-8")
    os.environ["DEEPSEEK_API_KEY"] = secret
    os.environ["DEEPSEEK_MODEL"] = model_name
    os.environ["DEEPSEEK_API_URL"] = endpoint
    return {"configured": True, "model": model_name, "apiUrl": endpoint, "configPath": str(ENV_LOCAL_PATH)}


def find_registered_user(username):
    username_text = str(username or "").strip().lower()
    if not username_text:
        return None
    return next(
        (
            user
            for user in read_json("users.json", [])
            if str(user.get("username") or "").lower() == username_text
            or str(user.get("studentId") or "").lower() == username_text
        ),
        None,
    )


def current_user_id():
    return request.args.get("userId") or request_payload().get("userId") or "me"


def public_user(user_id):
    if user_id == "me":
        return {
            "id": "me",
            "name": "浙大同学",
            "avatar": "/user_avatar.png",
            "credit": 4.9,
        }
    users = read_json("users.json", [])
    return find_by_id(users, user_id) or {
        "id": user_id,
        "name": "浙大同学",
        "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}",
        "credit": 4.8,
    }


def enrich_order(order):
    if order.get("title") and order.get("cover"):
        return order
    book = find_by_id(read_json("books.json", []), order.get("bookId"))
    if not book:
        return order
    return {
        **order,
        "title": order.get("title") or book.get("title"),
        "price": order.get("price") or book.get("price"),
        "seller": order.get("seller") or book.get("seller"),
        "cover": order.get("cover") or book.get("cover"),
    }


def update_book_status(books, book_id, status):
    book = find_by_id(books, book_id)
    if book:
        book["status"] = status
        book["updatedAt"] = now_text()
    return book


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


@app.get("/")
def index():
    return jsonify(
        {
            "success": True,
            "service": "ZJU Used Book Backend",
            "message": "后端服务运行中。前端请访问 http://127.0.0.1:5173",
            "endpoints": ["/api/health", "/api/login", "/api/schedule", "/api/textbooks", "/api/ai/chat"],
        }
    )


@app.get("/api/health")
def health():
    return jsonify(
        {
            "success": True,
            "service": "ZJU Used Book Backend",
            "framework": "Flask",
            "aiModel": os.getenv("DEEPSEEK_MODEL", DEFAULT_DEEPSEEK_MODEL),
        }
    )


@app.get("/api/ai/config")
def get_ai_config():
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    return jsonify(
        {
            "success": True,
            "configured": bool(api_key),
            "maskedKey": mask_secret(api_key),
            "model": os.getenv("DEEPSEEK_MODEL", DEFAULT_DEEPSEEK_MODEL),
            "apiUrl": os.getenv("DEEPSEEK_API_URL", DEFAULT_DEEPSEEK_API_URL),
            "configPath": str(ENV_LOCAL_PATH),
        }
    )


@app.post("/api/ai/config")
def save_ai_config():
    payload = request_payload()
    api_key = str(payload.get("apiKey") or "").strip()
    model = str(payload.get("model") or DEFAULT_DEEPSEEK_MODEL).strip()
    api_url = str(payload.get("apiUrl") or DEFAULT_DEEPSEEK_API_URL).strip()
    if not api_key:
        return jsonify({"success": False, "message": "请输入 DeepSeek API 密钥"}), 400
    if not api_url.startswith("https://"):
        return jsonify({"success": False, "message": "API 地址必须使用 HTTPS"}), 400

    try:
        config = write_deepseek_env(api_key, model, api_url)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    return jsonify({"success": True, **config, "maskedKey": mask_secret(api_key)})


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    if not username or not password:
        return jsonify({"success": False, "message": "请提供学号和密码"}), 400

    local_user = find_registered_user(username)
    if local_user:
        if check_password_hash(local_user.get("passwordHash") or "", password):
            return jsonify({"success": True, "user": public_auth_user(local_user)})
        return jsonify({"success": False, "message": "账号或密码不匹配"}), 401

    result = authenticate_zju(username, password)
    if not result.get("success"):
        return jsonify({"success": False, "message": result.get("message") or "登录失败"}), 401

    user_credentials[username] = password
    real_info = {}
    try:
        schedule_data = fetch_schedule(username, password)
        raw = schedule_data.get("raw") or {}
        real_info = {
            "realName": raw.get("xm") or "",
            "studentId": raw.get("xh") or "",
            "college": raw.get("xy") or "",
            "major": raw.get("zy") or "",
            "class": raw.get("xzb") or "",
        }
    except Exception as exc:
        print("[Auth] 登录时同步课表与实名信息失败:", exc)

    return jsonify({"success": True, "user": {"username": username, **real_info}})


@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = str(payload.get("password") or "")
    display_name = str(payload.get("name") or username or "浙大同学").strip()
    if not username or not password:
        return jsonify({"success": False, "message": "请填写账号和密码"}), 400
    if len(password) < 6:
        return jsonify({"success": False, "message": "密码至少需要 6 位"}), 400
    if find_registered_user(username):
        return jsonify({"success": False, "message": "账号已存在，请直接登录"}), 409

    def add_user(users):
        user = {
            "id": new_id("u"),
            "username": username,
            "name": display_name,
            "realName": display_name,
            "studentId": username,
            "college": "浙江大学",
            "major": "未填写",
            "class": "",
            "credit": 5.0,
            "tradeCount": 0,
            "level": "Lv.1 新同学",
            "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={username}",
            "bio": "通过本地 JSON 注册的浙里淘书用户。",
            "joinDate": now_text(),
            "passwordHash": generate_password_hash(password),
        }
        users.append(user)
        return user

    user = mutate_json("users.json", add_user, [])
    notify("admin", "新用户注册", f"{display_name} 已创建本地演示账号。", "green")
    return jsonify({"success": True, "user": public_auth_user(user)})


@app.post("/api/schedule")
def schedule():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = payload.get("password") or user_credentials.get(username)
    if not username or not password:
        return jsonify({"success": False, "message": "请提供学号和密码"}), 400

    try:
        data = fetch_schedule(username, password)
        return jsonify({"success": True, **data})
    except Exception as exc:
        print("[Schedule] error:", exc)
        return jsonify({"success": False, "message": str(exc)}), 500


@app.post("/api/textbooks")
def textbooks():
    payload = request.get_json(silent=True) or {}
    username = str(payload.get("username") or "").strip()
    password = payload.get("password") or user_credentials.get(username)
    if not username or not password:
        return jsonify({"success": False, "message": "请提供学号和密码"}), 400

    try:
        data = fetch_textbooks(username, password)
        return jsonify({"success": True, **data})
    except Exception as exc:
        print("[Textbooks] error:", exc)
        return jsonify({"success": False, "message": str(exc)}), 500


@app.post("/api/ai/chat")
def ai_chat():
    try:
        result = ask_taosu(request.get_json(silent=True) or {})
        return jsonify({"success": True, **result})
    except ApiError as exc:
        return jsonify({"success": False, "message": str(exc)}), exc.status
    except Exception as exc:
        print("[AI] request failed:", exc)
        return jsonify({"success": False, "message": "小酥暂时无法连接模型服务，请稍后再试"}), 502


@app.get("/api/books")
def list_books():
    books = read_json("books.json", [])
    status = request.args.get("status")
    seller_id = request.args.get("sellerId")
    if status:
        books = [book for book in books if book.get("status") == status]
    if seller_id:
        books = [book for book in books if book.get("sellerId") == seller_id]
    return jsonify({"success": True, "books": books})


@app.get("/api/books/<book_id>")
def get_book(book_id):
    book = find_by_id(read_json("books.json", []), book_id)
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    return jsonify({"success": True, "book": book})


@app.post("/api/books")
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
            "aiSummary": str(payload.get("aiSummary") or "新发布教材，等待管理员审核后进入推荐流。"),
            "cover": str(payload.get("cover") or "/book_programming.png"),
            "status": "pending",
            "createdAt": now_text(),
        }
        books.insert(0, book)
        return book

    book = mutate_json("books.json", add_book, [])
    notify("admin", "新书待审核", f"《{book['title']}》已提交上架审核。", "blue", book["id"])
    return jsonify({"success": True, "book": book, "matchedCount": 0})


@app.patch("/api/books/<book_id>")
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


@app.post("/api/books/<book_id>/report")
def report_book(book_id):
    book = find_by_id(read_json("books.json", []), book_id)
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    payload = request_payload()

    def add_report(reports):
        report = {
            "id": new_id("r"),
            "bookId": book_id,
            "reason": str(payload.get("reason") or "用户举报").strip(),
            "status": "pending",
            "userId": payload.get("userId") or "me",
            "timestamp": now_text(),
        }
        reports.insert(0, report)
        return report

    report = mutate_json("reports.json", add_report, [])
    return jsonify({"success": True, "report": report})


@app.get("/api/reports")
def list_reports():
    return jsonify({"success": True, "reports": read_json("reports.json", [])})


@app.patch("/api/reports/<report_id>")
def update_report(report_id):
    payload = request_payload()
    status = payload.get("status") or "resolved"

    def update(reports):
        report = find_by_id(reports, report_id)
        if not report:
            return None
        report["status"] = status
        report["handledAt"] = now_text()
        return report

    report = mutate_json("reports.json", update, [])
    if not report:
        return jsonify({"success": False, "message": "举报不存在"}), 404
    return jsonify({"success": True, "report": report})


@app.get("/api/cart")
def get_cart():
    user_id = current_user_id()
    carts = read_json("carts.json", [])
    entry = next((item for item in carts if item.get("userId") == user_id), {"bookIds": []})
    books = read_json("books.json", [])
    items = [book for book_id in entry.get("bookIds", []) if (book := find_by_id(books, book_id))]
    return jsonify({"success": True, "bookIds": entry.get("bookIds", []), "items": items})


@app.post("/api/cart")
def add_cart_item():
    payload = request_payload()
    user_id = payload.get("userId") or "me"
    book_id = payload.get("bookId")
    book = find_by_id(read_json("books.json", []), book_id)
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    if book.get("status") != "approved":
        return jsonify({"success": False, "message": "该书当前不在售，无法加入清单"}), 409

    def update(carts):
        entry = next((item for item in carts if item.get("userId") == user_id), None)
        if not entry:
            entry = {"userId": user_id, "bookIds": []}
            carts.append(entry)
        if book_id not in entry["bookIds"]:
            entry["bookIds"].append(book_id)
        return entry

    entry = mutate_json("carts.json", update, [])
    return jsonify({"success": True, "bookIds": entry["bookIds"]})


@app.delete("/api/cart/<book_id>")
def remove_cart_item(book_id):
    user_id = request.args.get("userId") or "me"

    def update(carts):
        entry = next((item for item in carts if item.get("userId") == user_id), None)
        if entry:
            entry["bookIds"] = [item for item in entry.get("bookIds", []) if item != book_id]
        return entry or {"userId": user_id, "bookIds": []}

    entry = mutate_json("carts.json", update, [])
    return jsonify({"success": True, "bookIds": entry["bookIds"]})


@app.post("/api/cart/checkout")
def checkout_cart():
    payload = request_payload()
    user_id = payload.get("userId") or "me"
    carts = read_json("carts.json", [])
    entry = next((item for item in carts if item.get("userId") == user_id), {"bookIds": []})
    book_ids = list(entry.get("bookIds", []))
    if not book_ids:
        return jsonify({"success": False, "message": "购物清单为空"}), 400

    books = read_json("books.json", [])
    order_items = [book for book_id in book_ids if (book := find_by_id(books, book_id)) and book.get("status") == "approved"]
    if not order_items:
        return jsonify({"success": False, "message": "清单中没有可下单的在售教材"}), 400

    def add_orders(orders):
        created = []
        for book in order_items:
            order = {
                "id": new_id("o"),
                "userId": user_id,
                "bookId": book["id"],
                "title": book.get("title"),
                "price": book.get("price"),
                "status": "unpaid",
                "seller": book.get("seller"),
                "sellerId": book.get("sellerId"),
                "date": now_text(),
                "cover": book.get("cover"),
            }
            orders.insert(0, order)
            created.append(order)
        return created

    created_orders = mutate_json("orders.json", add_orders, [])

    def clear_cart(carts_data):
        cart_entry = next((item for item in carts_data if item.get("userId") == user_id), None)
        if cart_entry:
            cart_entry["bookIds"] = []
        return cart_entry

    mutate_json("carts.json", clear_cart, [])
    notify(user_id, "订单已创建", f"已为你创建 {len(created_orders)} 笔订单，请在履约中心完成支付。", "blue")
    return jsonify({"success": True, "orders": created_orders})


@app.get("/api/orders")
def list_orders():
    user_id = request.args.get("userId")
    orders = [enrich_order(order) for order in read_json("orders.json", [])]
    if user_id:
        orders = [order for order in orders if order.get("userId") in (None, "", user_id)]
    return jsonify({"success": True, "orders": orders})


@app.patch("/api/orders/<order_id>")
def update_order(order_id):
    action = request_payload().get("action")
    transitions = {"pay": "pending", "confirm": "completed", "cancel": "cancelled"}
    if action not in transitions:
        return jsonify({"success": False, "message": "订单操作不合法"}), 400
    allowed_sources = {"pay": {"unpaid"}, "confirm": {"pending"}, "cancel": {"unpaid", "pending"}}

    def update(orders):
        order = find_by_id(orders, order_id)
        if not order:
            return None
        if order.get("status") not in allowed_sources[action]:
            return {"error": "当前订单状态不能执行该操作"}
        order["status"] = transitions[action]
        order[f"{action}At"] = now_text()
        return order

    order = mutate_json("orders.json", update, [])
    if not order:
        return jsonify({"success": False, "message": "订单不存在"}), 404
    if order.get("error"):
        return jsonify({"success": False, "message": order["error"]}), 409

    book_status = "sold" if action == "pay" else "approved" if action == "cancel" else None
    if book_status:
        mutate_json("books.json", lambda books: update_book_status(books, order.get("bookId"), book_status), [])
    return jsonify({"success": True, "order": enrich_order(order)})


@app.post("/api/orders/<order_id>/review")
def review_order(order_id):
    payload = request_payload()
    rating = int(payload.get("rating") or 5)
    content = str(payload.get("content") or "").strip()
    order_before_review = find_by_id(read_json("orders.json", []), order_id)
    if not order_before_review:
        return jsonify({"success": False, "message": "订单不存在"}), 404
    if order_before_review.get("status") != "completed":
        return jsonify({"success": False, "message": "仅已完成订单可以评价"}), 409

    def add_review(reviews):
        review = {
            "id": new_id("rv"),
            "orderId": order_id,
            "userId": payload.get("userId") or "me",
            "rating": max(1, min(5, rating)),
            "content": content,
            "createdAt": now_text(),
        }
        reviews.insert(0, review)
        return review

    review = mutate_json("reviews.json", add_review, [])

    def mark_order(orders):
        order = find_by_id(orders, order_id)
        if order:
            order["reviewed"] = True
            order["reviewId"] = review["id"]
        return order

    order = mutate_json("orders.json", mark_order, [])
    return jsonify({"success": True, "review": review, "order": enrich_order(order)})


@app.get("/api/wishes")
def list_wishes():
    return jsonify({"success": True, "wishes": read_json("wishes.json", [])})


@app.post("/api/wishes")
def create_wish():
    payload = request_payload()
    title = str(payload.get("title") or "").strip()
    if not title:
        return jsonify({"success": False, "message": "请填写心愿书名"}), 400
    user_id = payload.get("userId") or "me"
    user = public_user(user_id)

    def add_wish(wishes):
        wish = {
            "id": new_id("w"),
            "userId": user_id,
            "userName": user.get("name"),
            "title": title,
            "author": str(payload.get("author") or "待补充").strip(),
            "priceRange": str(payload.get("priceRange") or "面议").strip(),
            "status": "seeking",
            "tags": payload.get("tags") or ["求购"],
            "timestamp": now_text(),
            "avatar": user.get("avatar") or f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id}",
        }
        wishes.insert(0, wish)
        return wish

    wish = mutate_json("wishes.json", add_wish, [])
    return jsonify({"success": True, "wish": wish})


@app.get("/api/favorites")
def list_favorites():
    user_id = current_user_id()
    favorites = read_json("favorites.json", [])
    entry = next((item for item in favorites if item.get("userId") == user_id), {"bookIds": []})
    books = read_json("books.json", [])
    items = [book for book_id in entry.get("bookIds", []) if (book := find_by_id(books, book_id))]
    return jsonify({"success": True, "bookIds": entry.get("bookIds", []), "items": items})


@app.post("/api/favorites/toggle")
def toggle_favorite():
    payload = request_payload()
    user_id = payload.get("userId") or "me"
    book_id = payload.get("bookId")
    if not find_by_id(read_json("books.json", []), book_id):
        return jsonify({"success": False, "message": "书籍不存在"}), 404

    def update(favorites):
        entry = next((item for item in favorites if item.get("userId") == user_id), None)
        if not entry:
            entry = {"userId": user_id, "bookIds": []}
            favorites.append(entry)
        if book_id in entry["bookIds"]:
            entry["bookIds"].remove(book_id)
            favorited = False
        else:
            entry["bookIds"].append(book_id)
            favorited = True
        return {"entry": entry, "favorited": favorited}

    result = mutate_json("favorites.json", update, [])
    return jsonify({"success": True, "favorited": result["favorited"], "bookIds": result["entry"]["bookIds"]})


@app.get("/api/notifications")
def list_notifications():
    user_id = request.args.get("userId")
    notifications = read_json("notifications.json", [])
    if user_id:
        notifications = [item for item in notifications if item.get("userId") in (None, "", user_id, "me")]
    return jsonify({"success": True, "notifications": notifications})


@app.patch("/api/notifications/read")
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


@app.get("/api/notes")
def list_notes():
    notes = read_json("notes.json", [])
    
    # 数据热迁移逻辑：绑定假附件路径与名称
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


@app.post("/api/notes")
def create_note():
    import json
    import time
    import uuid
    
    title = request.form.get("title", "").strip()
    course = request.form.get("course", "").strip()
    if not title or not course:
        return jsonify({"success": False, "message": "标题和课程关联为必填项"}), 400
        
    # 保存附件文件
    file = request.files.get("file")
    file_url = None
    file_name_orig = None
    
    if file and file.filename:
        # 确保 uploads 文件夹存在
        upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "client", "public", "uploads")
        os.makedirs(upload_folder, exist_ok=True)
        
        file_name_orig = file.filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"note_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
        file_path = os.path.join(upload_folder, unique_filename)
        file.save(file_path)
        file_url = f"/uploads/{unique_filename}"
        
    def add_note(notes):
        # 标签解析
        tags_raw = request.form.get("tags", "")
        # 支持逗号、空格、分号分隔
        for delimiter in [",", ";", "，", "；"]:
            tags_raw = tags_raw.replace(delimiter, " ")
        tags_list = [t.strip() for t in tags_raw.split(" ") if t.strip()]
        if not tags_list:
            tags_list = ["共享资料"]
            
        # 段落处理
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


@app.get("/api/notes/<note_id>")
def get_note(note_id):
    note = find_by_id(read_json("notes.json", []), note_id)
    if not note:
        return jsonify({"success": False, "message": "笔记不存在"}), 404
    return jsonify({"success": True, "note": note})


@app.patch("/api/notes/<note_id>")
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


def seed_chat_state():
    chat_state = read_json("chat.json", {})
    if chat_state.get("contacts"):
        return chat_state
    ui = read_json("ui.json", {})
    chat = ui.get("chat") or {}
    chat_state = {
        "contacts": chat.get("contacts") or [],
        "messages": chat.get("messages") or {},
        "autoReplies": chat.get("autoReplies") or ["收到，我稍后确认。"],
    }
    write_json("chat.json", chat_state)
    return chat_state


@app.get("/api/chats")
def get_chats():
    return jsonify({"success": True, **seed_chat_state()})


@app.post("/api/chats/<chat_id>/messages")
def create_chat_message(chat_id):
    payload = request_payload()
    text = str(payload.get("text") or "").strip()
    if not text:
        return jsonify({"success": False, "message": "消息不能为空"}), 400

    def update(chat_state):
        if not chat_state.get("contacts"):
            seeded = seed_chat_state()
            chat_state.update(seeded)
        messages_map = chat_state.setdefault("messages", {})
        room = messages_map.setdefault(str(chat_id), [])
        message = {"id": new_id("m"), "role": "me", "content": text, "timestamp": now_text()}
        room.append(message)
        replies = chat_state.get("autoReplies") or ["收到，我稍后确认。"]
        reply = {"id": new_id("m"), "role": "other", "content": replies[len(room) % len(replies)], "timestamp": now_text()}
        room.append(reply)
        for contact in chat_state.get("contacts", []):
            if str(contact.get("id")) == str(chat_id):
                contact["lastMsg"] = reply["content"]
                contact["time"] = "刚刚"
        return {"message": message, "reply": reply}

    result = mutate_json("chat.json", update, {})
    return jsonify({"success": True, **result})


@socketio.on("register_user")
def register_user(user):
    if isinstance(user, dict) and user.get("id"):
        display_name = user.get("name") or user.get("username") or "匿名用户"
        registered_users[str(user["id"])] = display_name


@socketio.on("ping_test")
def ping_test():
    emit("pong_test")


@socketio.on("search_user")
def search_user(query):
    if not query:
        emit("search_results", [])
        return

    query_text = str(query).lower()
    results = [
        {"id": user_id, "name": name or "未知用户"}
        for user_id, name in registered_users.items()
        if query_text in user_id.lower() or query_text in str(name).lower()
    ]
    emit("search_results", results[:10])


@socketio.on("join_room")
def handle_join_room(room_id):
    join_room(room_id)
    history = [message for message in messages if message.get("roomId") == room_id]
    emit("receive_history", history)


@socketio.on("send_message")
def handle_send_message(data):
    if not isinstance(data, dict):
        return
    from datetime import datetime, timezone

    message_data = {**data, "timestamp": datetime.now(timezone.utc).isoformat()}
    messages.append(message_data)
    socketio.emit("receive_message", message_data, room=data.get("roomId"))


if __name__ == "__main__":
    port = int(os.getenv("PORT", "3001"))
    socketio.run(app, host="0.0.0.0", port=port, allow_unsafe_werkzeug=True)
