from flask import Blueprint, jsonify
from json_store import find_by_id, mutate_json, new_id, now_text, read_json
from orders_helper import current_user_id, enrich_order, update_book_status, notify, request_payload

orders_bp = Blueprint("orders_bp", __name__)

@orders_bp.get("/api/orders")
def list_orders():
    user_id = current_user_id()
    orders = [enrich_order(order) for order in read_json("orders.json", [])]
    if user_id:
        users = read_json("users.json", [])
        real_users = [u for u in users if u.get("username") and u.get("id") != "me"]
        
        current_user = None
        if user_id == "me":
            if real_users:
                current_user = real_users[-1]
        else:
            current_user = next((u for u in users if u.get("id") == user_id or str(u.get("username")).lower() == str(user_id).lower() or str(u.get("studentId")).lower() == str(user_id).lower()), None)
            
        if current_user:
            c_id = current_user.get("id")
            c_username = current_user.get("username")
            c_student_id = current_user.get("studentId")
            
            orders = [
                order for order in orders 
                if (order.get("userId") in ("me", c_id, c_username, c_student_id)) 
                or (order.get("sellerId") in (c_id, c_username, c_student_id))
            ]
            return jsonify({"success": True, "orders": orders, "points": current_user.get("points", 0)})
        else:
            orders = [order for order in orders if order.get("userId") == user_id]
            
    return jsonify({"success": True, "orders": orders})

@orders_bp.patch("/api/orders/<order_id>")
def update_order(order_id):
    action = request_payload().get("action")
    allowed_actions = {"pay", "deliver", "confirm", "cancel"}
    if action not in allowed_actions:
        return jsonify({"success": False, "message": "订单操作不合法"}), 400

    def update(orders):
        order = find_by_id(orders, order_id)
        if not order:
            return None
        
        # 1. 兼容和映射老订单状态
        if order.get("isPaid") is None:
            order["isPaid"] = order.get("status") in ("pending", "completed")
        if order.get("isDelivered") is None:
            order["isDelivered"] = order.get("status") == "completed"

        # 2. 执行状态修改动作
        if action == "pay":
            if order.get("status") == "cancelled":
                return {"error": "已关闭的订单无法支付"}
            order["isPaid"] = True
            order["paidAt"] = now_text()
        elif action in ("deliver", "confirm"):
            if order.get("status") == "cancelled":
                return {"error": "已关闭的订单无法交付"}
            order["isDelivered"] = True
            order["deliveredAt"] = now_text()
        elif action == "cancel":
            if order.get("status") == "completed" or (order.get("isPaid") and order.get("isDelivered")):
                return {"error": "已完成的订单无法取消"}
            order["status"] = "cancelled"
            order["cancelledAt"] = now_text()
            return order

        # 3. 动态判断多态已支付/已交付/已完成
        if order.get("isPaid") and order.get("isDelivered"):
            order["status"] = "completed"
            order["completedAt"] = now_text()
            
            # 4. 交易完美完成，触发买卖双方 +5 积分奖励
            if not order.get("pointsAwarded"):
                order["pointsAwarded"] = True
                
                buyer_id = order.get("userId")
                seller_id = order.get("sellerId")
                
                def award_points(users_list):
                    buyer_user = None
                    seller_user = None
                    if buyer_id:
                        buyer_user = next((u for u in users_list if u.get("id") == buyer_id or str(u.get("username")).lower() == str(buyer_id).lower() or str(u.get("studentId")).lower() == str(buyer_id).lower()), None)
                    if seller_id:
                        seller_user = next((u for u in users_list if u.get("id") == seller_id or str(u.get("username")).lower() == str(seller_id).lower() or str(u.get("studentId")).lower() == str(seller_id).lower()), None)
                        
                    if buyer_user:
                        buyer_user["points"] = buyer_user.get("points", 0) + 5
                        if buyer_user.get("id") != "me":
                            me_user = find_by_id(users_list, "me")
                            if me_user:
                                me_user["points"] = me_user.get("points", 0) + 5
                                
                    if seller_user:
                        seller_user["points"] = seller_user.get("points", 0) + 5
                        
                    return True
                
                mutate_json("users.json", award_points, [])
        else:
            if order.get("isPaid") and not order.get("isDelivered"):
                order["status"] = "paid"
            elif not order.get("isPaid") and order.get("isDelivered"):
                order["status"] = "delivered"
            else:
                order["status"] = "unpaid"

        return order

    order = mutate_json("orders.json", update, [])
    if not order:
        return jsonify({"success": False, "message": "订单不存在"}), 404
    if isinstance(order, dict) and order.get("error"):
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
