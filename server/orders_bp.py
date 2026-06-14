from flask import Blueprint, jsonify

from account_identity import normalize_account_id, public_account
from json_store import find_by_id, mutate_json, new_id, now_text, read_json
from order_flow import apply_order_action, create_order_record, mark_book_for_action, run_order_effects, user_orders
from orders_helper import current_user_id, enrich_order, notify, request_payload

orders_bp = Blueprint("orders_bp", __name__)


@orders_bp.get("/api/orders")
def list_orders():
    user_id = normalize_account_id(current_user_id())
    orders = [enrich_order(order) for order in user_orders(user_id)] if user_id else []
    return jsonify({"success": True, "orders": orders, "points": public_account(user_id).get("points", 0)})


@orders_bp.post("/api/orders")
def create_order():
    payload = request_payload()
    buyer_id = normalize_account_id(current_user_id())
    book = find_by_id(read_json("books.json", []), payload.get("bookId"))
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    if not buyer_id or buyer_id == "me":
        return jsonify({"success": False, "message": "请先登录后再发起交易"}), 401

    # 如果当前发起订单的人是卖家，那么订单的真正买家应该是传入的 userId (即对方)
    if buyer_id == normalize_account_id(book.get("sellerId") or "me"):
        buyer_id = normalize_account_id(payload.get("userId") or buyer_id)

    def add_order(orders):
        order = create_order_record(new_id, payload, book, buyer_id)
        orders.insert(0, order)
        return order

    order = mutate_json("orders.json", add_order, [])
    notify(
        order.get("sellerId"),
        "新购书请求",
        f"有同学发起了对《{order['title']}》的购书请求，金额 ¥{order['price']}，取货地：{order['location']}。",
        "blue",
        order.get("bookId"),
    )
    return jsonify({"success": True, "order": enrich_order(order)})


@orders_bp.patch("/api/orders/<order_id>")
def update_order(order_id):
    action = request_payload().get("action")
    if action not in {"pay", "confirm_receipt", "deliver", "confirm", "cancel"}:
        return jsonify({"success": False, "message": "订单操作不合法"}), 400

    op_user_id = normalize_account_id(current_user_id())

    def update(orders):
        order = find_by_id(orders, order_id)
        if not order:
            return None
        
        # 严格区分买卖双方权限
        buyer = order.get("userId")
        seller = order.get("sellerId")
        if action in {"pay", "confirm"} and op_user_id != buyer:
            return {"error": "仅买家有权执行该操作"}
        if action in {"confirm_receipt", "deliver"} and op_user_id != seller:
            return {"error": "仅卖家有权执行该操作"}
        if action == "cancel" and op_user_id != buyer:
            return {"error": "仅买家有权取消订单"}

        return apply_order_action(order, action)

    result = mutate_json("orders.json", update, [])
    if not result:
        return jsonify({"success": False, "message": "订单不存在"}), 404
    if isinstance(result, dict) and result.get("error"):
        return jsonify({"success": False, "message": result["error"]}), 409

    order = result["order"]
    run_order_effects(order, result.get("effects") or {})
    mark_book_for_action(action, order.get("bookId"), order)
    return jsonify({"success": True, "order": enrich_order(order)})


@orders_bp.post("/api/orders/<order_id>/review")
def review_order(order_id):
    payload = request_payload()
    order_before_review = find_by_id(read_json("orders.json", []), order_id)
    if not order_before_review:
        return jsonify({"success": False, "message": "订单不存在"}), 404
    if order_before_review.get("status") != "completed":
        return jsonify({"success": False, "message": "仅已完成订单可以评价"}), 409

    rating = max(1, min(5, int(payload.get("rating") or 5)))
    content = str(payload.get("content") or "").strip()

    def add_review(reviews):
        review = {
            "id": new_id("rv"),
            "orderId": order_id,
            "userId": normalize_account_id(payload.get("userId") or "me"),
            "rating": rating,
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
    return jsonify({"success": True, "review": review, "order": enrich_order(order or order_before_review)})
