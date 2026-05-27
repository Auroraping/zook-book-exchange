from flask import Blueprint, jsonify, request
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

orders_bp = Blueprint("orders_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def current_user_id():
    return request.args.get("userId") or request_payload().get("userId") or "me"

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

@orders_bp.get("/api/cart")
def get_cart():
    user_id = current_user_id()
    carts = read_json("carts.json", [])
    entry = next((item for item in carts if item.get("userId") == user_id), {"bookIds": []})
    books = read_json("books.json", [])
    items = [book for book_id in entry.get("bookIds", []) if (book := find_by_id(books, book_id))]
    return jsonify({"success": True, "bookIds": entry.get("bookIds", []), "items": items})

@orders_bp.post("/api/cart")
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

@orders_bp.delete("/api/cart/<book_id>")
def remove_cart_item(book_id):
    user_id = request.args.get("userId") or "me"

    def update(carts):
        entry = next((item for item in carts if item.get("userId") == user_id), None)
        if entry:
            entry["bookIds"] = [item for item in entry.get("bookIds", []) if item != book_id]
        return entry or {"userId": user_id, "bookIds": []}

    entry = mutate_json("carts.json", update, [])
    return jsonify({"success": True, "bookIds": entry["bookIds"]})

@orders_bp.post("/api/cart/checkout")
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

@orders_bp.get("/api/orders")
def list_orders():
    user_id = request.args.get("userId")
    orders = [enrich_order(order) for order in read_json("orders.json", [])]
    if user_id:
        orders = [order for order in orders if order.get("userId") in (None, "", user_id)]
    return jsonify({"success": True, "orders": orders})

@orders_bp.patch("/api/orders/<order_id>")
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

@orders_bp.post("/api/orders/<order_id>/review")
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

    mutate_json("orders.json", mark_order, [])
    return jsonify({"success": True, "review": review, "order": enrich_order(order_before_review)})

@orders_bp.get("/api/favorites")
def list_favorites():
    user_id = current_user_id()
    favorites = read_json("favorites.json", [])
    entry = next((item for item in favorites if item.get("userId") == user_id), {"bookIds": []})
    books = read_json("books.json", [])
    items = [book for book_id in entry.get("bookIds", []) if (book := find_by_id(books, book_id))]
    return jsonify({"success": True, "bookIds": entry.get("bookIds", []), "items": items})

@orders_bp.post("/api/favorites/toggle")
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
