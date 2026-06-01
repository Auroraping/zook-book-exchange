from flask import Blueprint, jsonify
from json_store import find_by_id, mutate_json, new_id, now_text, read_json
from orders_helper import current_user_id, request_payload, notify

cart_bp = Blueprint("cart_bp", __name__)

@cart_bp.get("/api/cart")
def get_cart():
    user_id = current_user_id()
    carts = read_json("carts.json", [])
    entry = next((item for item in carts if item.get("userId") == user_id), {"bookIds": []})
    books = read_json("books.json", [])
    items = [book for book_id in entry.get("bookIds", []) if (book := find_by_id(books, book_id))]
    return jsonify({"success": True, "bookIds": entry.get("bookIds", []), "items": items})

@cart_bp.post("/api/cart")
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

@cart_bp.delete("/api/cart/<book_id>")
def remove_cart_item(book_id):
    user_id = current_user_id()

    def update(carts):
        entry = next((item for item in carts if item.get("userId") == user_id), None)
        if entry:
            entry["bookIds"] = [item for item in entry.get("bookIds", []) if item != book_id]
        return entry or {"userId": user_id, "bookIds": []}

    entry = mutate_json("carts.json", update, [])
    return jsonify({"success": True, "bookIds": entry["bookIds"]})

@cart_bp.post("/api/cart/checkout")
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
                "isPaid": False,
                "isDelivered": False,
                "pointsAwarded": False,
                "seller": book.get("seller"),
                "sellerId": book.get("sellerId"),
                "date": now_text(),
                "cover": book.get("cover"),
            }
            orders.insert(0, order)
            created.append(order)
        return created

    created_orders = mutate_json("orders.json", add_orders, [])

    # 下单结账的瞬间，自动将结算的所有图书状态变更为 "sold"（已售出），以在广场上同步瞬间消失！
    def mark_books_sold(books_list):
        for b_id in book_ids:
            b = find_by_id(books_list, b_id)
            if b:
                b["status"] = "sold"
        return books_list
    mutate_json("books.json", mark_books_sold, [])

    def clear_cart(carts_data):
        cart_entry = next((item for item in carts_data if item.get("userId") == user_id), None)
        if cart_entry:
            cart_entry["bookIds"] = []
        return cart_entry

    mutate_json("carts.json", clear_cart, [])
    notify(user_id, "订单已创建", f"已为你创建 {len(created_orders)} 笔订单，请在履约中心完成支付。", "blue")
    return jsonify({"success": True, "orders": created_orders})
