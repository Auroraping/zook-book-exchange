from flask import Blueprint, jsonify, request
from json_store import find_by_id, mutate_json, new_id, now_text, read_json, write_json

orders_bp = Blueprint("orders_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

def current_user_id():
    return request.args.get("userId") or request_payload().get("userId") or "me"

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
    if status != "cancelled":
        if is_paid and is_delivered:
            status = "completed"
        elif is_paid and not is_delivered:
            status = "paid"
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

    # 物理强制！下单结账的瞬间，自动将结算的所有图书状态变更为 "sold"（已售出），以在广场上同步瞬间消失！
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

@orders_bp.get("/api/orders")
def list_orders():
    user_id = request.args.get("userId")
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
                        if seller_user.get("id") != "me":
                            # 如果卖家被映射在其它地方，我们也同步
                            pass
                            
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
