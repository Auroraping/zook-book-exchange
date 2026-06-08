from account_identity import add_points, normalize_account_id
from json_store import find_by_id, mutate_json, now_text, read_json
from orders_helper import notify


def create_order_record(new_id, payload, book):
    price = payload.get("price")
    try:
        price_val = round(float(price or book.get("price")), 2)
    except (TypeError, ValueError):
        price_val = float(book.get("price") or 0)
    buyer_id = normalize_account_id(payload.get("userId") or "me")
    return {
        "id": new_id("o"),
        "userId": buyer_id,
        "bookId": book.get("id"),
        "title": book.get("title"),
        "price": price_val,
        "location": str(payload.get("location") or "未定").strip(),
        "status": "unpaid",
        "isPaid": False,
        "isDelivered": False,
        "sellerConfirmed": False,
        "pointsAwarded": False,
        "seller": book.get("seller"),
        "sellerId": normalize_account_id(book.get("sellerId") or "me"),
        "date": now_text(),
        "cover": book.get("cover"),
    }


def normalize_legacy_order(order):
    if order.get("isPaid") is None:
        order["isPaid"] = order.get("status") in ("paid", "paid_unconfirmed", "completed")
    if order.get("isDelivered") is None:
        order["isDelivered"] = order.get("status") in ("delivered", "completed")
    if order.get("sellerConfirmed") is None:
        order["sellerConfirmed"] = order.get("status") in ("paid", "delivered", "completed")


def award_trade_points(order):
    if order.get("pointsAwarded"):
        return False
    order["pointsAwarded"] = True
    order["pointsAwardedAt"] = now_text()
    return True


def apply_order_action(order, action):
    normalize_legacy_order(order)
    effects = {"notifications": [], "awardPoints": False}
    if order.get("status") == "cancelled" and action != "cancel":
        return {"error": "已关闭的订单无法操作"}
    if action == "pay":
        order.update({"isPaid": True, "status": "paid_unconfirmed", "paidAt": now_text()})
        effects["notifications"].append((order.get("sellerId"), "买家已付款", f"买家已为《{order.get('title')}》付款，请确认收款。", "blue"))
    elif action == "confirm_receipt":
        order.update({"sellerConfirmed": True, "sellerConfirmedAt": now_text(), "status": "paid"})
        effects["notifications"].append((order.get("userId"), "卖家已收款", f"卖家已确认收到《{order.get('title')}》的货款。", "green"))
    elif action == "deliver":
        order.update({"isDelivered": True, "deliveredAt": now_text(), "status": "delivered"})
        effects["notifications"].append((order.get("userId"), "卖家已发货", f"卖家已把《{order.get('title')}》放到约定地点。", "blue"))
    elif action == "confirm":
        order.update({"isPaid": True, "isDelivered": True, "sellerConfirmed": True, "status": "completed", "completedAt": now_text()})
        effects["awardPoints"] = award_trade_points(order)
    elif action == "cancel":
        if order.get("status") == "completed" or (order.get("isPaid") and order.get("isDelivered")):
            return {"error": "已完成的订单无法取消"}
        order.update({"status": "cancelled", "cancelledAt": now_text()})
    return {"order": order, "effects": effects}


def run_order_effects(order, effects):
    for user_id, title, content, tone in effects.get("notifications", []):
        notify(user_id, title, content, tone, order.get("bookId"))
    if effects.get("awardPoints"):
        add_points(order.get("userId"), 5)
        add_points(order.get("sellerId"), 5)


def mark_book_for_action(action, book_id):
    status = "sold" if action == "confirm_receipt" else "approved" if action == "cancel" else None
    if status:
        mutate_json("books.json", lambda books: update_book_status(books, book_id, status), [])


def update_book_status(books, book_id, status):
    book = find_by_id(books, book_id)
    if book:
        book["status"] = status
        book["updatedAt"] = now_text()
    return book


def user_orders(user_id):
    account_id = normalize_account_id(user_id)
    orders = read_json("orders.json", [])
    return [order for order in orders if order.get("userId") == account_id or order.get("sellerId") == account_id]
