from account_identity import add_points, normalize_account_id
from json_store import find_by_id, mutate_json, now_text, read_json
from orders_helper import notify


def create_order_record(new_id, payload, book, buyer_id=None):
    price = payload.get("price")
    try:
        price_val = round(float(price or book.get("price")), 2)
    except (TypeError, ValueError):
        price_val = float(book.get("price") or 0)
    buyer_id = normalize_account_id(buyer_id or payload.get("userId") or "me")
    return {
        "id": new_id("o"),
        "userId": buyer_id,
        "bookId": book.get("id"),
        "title": book.get("title"),
        "price": price_val,
        "location": str(payload.get("location") or "未定").strip(),
        "status": "unpaid",
        "isPaid": False,
        "buyerPaid": False,
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
    if order.get("buyerPaid") is None:
        order["buyerPaid"] = order.get("status") in ("paid", "paid_unconfirmed", "delivered", "completed")
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
    effects = {"notifications": [], "awardPoints": False, "bookSold": False}
    if order.get("status") == "cancelled" and action != "cancel":
        return {"error": "已关闭的订单无法操作"}
    if action == "pay":
        order["buyerPaid"] = True
        order["paidAt"] = now_text()
        if order.get("sellerConfirmed"):
            # 双向确认完成 -> 未放置
            order.update({"isPaid": True, "status": "paid"})
            effects["bookSold"] = True
            effects["notifications"].append((order.get("sellerId"), "收款双向确认完成", f"《{order.get('title')}》的货款已双向确认，请尽快把书放到约定地点。", "green"))
        else:
            # 仅买家已付款，等待卖家确认
            order["status"] = "paid_unconfirmed"
            effects["notifications"].append((order.get("sellerId"), "买家已付款", f"买家已为《{order.get('title')}》付款，请确认收款。", "blue"))
    elif action == "confirm_receipt":
        # 卖家确认收款前，买家必须先点击"已付款"
        if not order.get("buyerPaid"):
            return {"error": "买家尚未确认付款，请等待买家先点击「已付款」后再确认收款"}
        order["sellerConfirmed"] = True
        order["sellerConfirmedAt"] = now_text()
        # 买家已付款 + 卖家确认收款 -> 双向确认完成
        order.update({"isPaid": True, "status": "paid"})
        effects["bookSold"] = True
        effects["notifications"].append((order.get("userId"), "收款双向确认完成", f"《{order.get('title')}》的货款已双向确认，卖家将尽快放到约定地点。", "green"))
    elif action == "deliver":
        if order.get("status") != "paid":
            return {"error": "只有双向确认收款后才能放置书籍"}
        order.update({"isDelivered": True, "deliveredAt": now_text(), "status": "delivered"})
        effects["notifications"].append((order.get("userId"), "卖家已放置", f"卖家已把《{order.get('title')}》放到约定地点：{order.get('location')}，请前往取书并确认收货。", "blue"))
    elif action == "confirm":
        if order.get("status") != "delivered":
            return {"error": "只有卖家放置书籍后才能确认收货"}
        order.update({"isPaid": True, "buyerPaid": True, "isDelivered": True, "sellerConfirmed": True, "status": "completed", "completedAt": now_text()})
        effects["awardPoints"] = award_trade_points(order)
    elif action == "cancel":
        if order.get("status") == "completed":
            return {"error": "已完成的订单无法取消"}
        order.update({"status": "cancelled", "cancelledAt": now_text()})
        effects["notifications"].append((order.get("sellerId"), "订单已取消", f"买家已取消《{order.get('title')}》的订单，书籍已重新上架到广场。", "orange"))
    return {"order": order, "effects": effects}


def run_order_effects(order, effects):
    for user_id, title, content, tone in effects.get("notifications", []):
        notify(user_id, title, content, tone, order.get("bookId"))
    if effects.get("awardPoints"):
        add_points(order.get("userId"), 5)
        add_points(order.get("sellerId"), 5)


def mark_book_for_action(action, book_id, order=None):
    """根据订单操作结果更新书籍状态。
    只有双向确认完成时才把书设为 sold；取消时书回到 approved。
    """
    status = None
    if action == "cancel":
        status = "approved"
    elif action in ("pay", "confirm_receipt") and order:
        # 仅在双向确认都完成时才标记为 sold
        if order.get("buyerPaid") and order.get("sellerConfirmed"):
            status = "sold"
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
