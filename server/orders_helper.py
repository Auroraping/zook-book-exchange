from flask import request
from account_identity import normalize_account_id
from json_store import find_by_id, mutate_json, new_id, now_text, read_json

def request_payload():
    return request.get_json(silent=True) or {}

def current_user_id():
    return normalize_account_id(request.args.get("userId") or request_payload().get("userId") or "me")

def enrich_order(order):
    # 1. 安全扩充 isPaid、isDelivered 状态
    is_paid = order.get("isPaid")
    is_delivered = order.get("isDelivered")
    
    # 2. 如果缺少这些属性（历史订单），以其 status 做兼容映射
    if is_paid is None:
        if order.get("status") in ("pending", "completed"):
            is_paid = True
        else:
            is_paid = False
            
    if is_delivered is None:
        if order.get("status") == "completed":
            is_delivered = True
        else:
            is_delivered = False
            
    # 3. 动态确定对外公开的 status 状态
    status = order.get("status")
    known_statuses = {"unpaid", "paid_unconfirmed", "paid", "delivered", "completed", "cancelled"}
    if status not in known_statuses:
        if is_paid and is_delivered:
            status = "completed"
        elif is_paid and not is_delivered:
            status = "paid" if order.get("sellerConfirmed") or order.get("status") == "paid" else "paid_unconfirmed"
        elif not is_paid and is_delivered:
            status = "delivered"
        else:
            status = "unpaid"
            
    # 4. 获取教材的详情属性进行补全
    book = find_by_id(read_json("books.json", []), order.get("bookId"))
    title = order.get("title") or (book.get("title") if book else "未知教材")
    price = order.get("price") or (book.get("price") if book else 0.0)
    seller = order.get("seller") or (book.get("seller") if book else "浙大同学")
    cover = order.get("cover") or (book.get("cover") if book else "/book_cover.png")
    
    return {
        **order,
        "isPaid": is_paid,
        "isDelivered": is_delivered,
        "status": status,
        "title": title,
        "price": price,
        "seller": seller,
        "cover": cover,
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
