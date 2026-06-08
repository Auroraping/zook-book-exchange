from json_store import find_by_id, mutate_json, read_json


def account_match(user, value):
    value_text = str(value or "").strip().lower()
    if not value_text:
        return False
    keys = (user.get("id"), user.get("email"), user.get("username"))
    return any(str(item or "").strip().lower() == value_text for item in keys)


def find_account(value):
    users = read_json("users.json", [])
    return next((user for user in users if account_match(user, value)), None)


def normalize_account_id(value):
    value_text = str(value or "").strip()
    if not value_text or value_text == "me":
        return value_text or "me"
    user = find_account(value_text)
    return str(user.get("id")) if user and user.get("id") else value_text


def public_account(value):
    user_id = normalize_account_id(value)
    user = find_account(user_id)
    if user:
        return {
            **{key: val for key, val in user.items() if key != "passwordHash"},
            "credit": calculate_user_credit(user_id),
        }
    return {
        "id": user_id or "me",
        "name": "浙大同学",
        "avatar": f"https://api.dicebear.com/7.x/identicon/svg?seed={user_id or 'me'}",
        "credit": calculate_user_credit(user_id),
    }


def calculate_user_credit(user_id):
    seller_id = normalize_account_id(user_id)
    seller_orders = [
        order for order in read_json("orders.json", [])
        if str(order.get("sellerId")) == str(seller_id)
    ]
    order_ids = {order.get("id") for order in seller_orders}
    reviews = [item for item in read_json("reviews.json", []) if item.get("orderId") in order_ids]
    if not reviews:
        return 5.0
    total = sum(float(item.get("rating") or 5) for item in reviews)
    return round(total / len(reviews), 1)


def add_points(user_id, amount):
    target_id = normalize_account_id(user_id)

    def update(users):
        user = find_by_id(users, target_id)
        if user:
            user["points"] = int(user.get("points") or 0) + int(amount)
        return user

    return mutate_json("users.json", update, [])


def transfer_points(from_user_id, to_user_id, amount):
    amount = int(amount or 0)
    from_id = normalize_account_id(from_user_id)
    to_id = normalize_account_id(to_user_id)
    if amount <= 0 or from_id == to_id:
        return {"success": True}

    def update(users):
        payer = find_by_id(users, from_id)
        receiver = find_by_id(users, to_id)
        if not payer:
            return {"error": "下载账号不存在", "points": 0}
        if int(payer.get("points") or 0) < amount:
            return {"error": "积分不足", "points": int(payer.get("points") or 0)}
        payer["points"] = int(payer.get("points") or 0) - amount
        if receiver:
            receiver["points"] = int(receiver.get("points") or 0) + amount
        return {"success": True, "points": payer.get("points", 0)}

    return mutate_json("users.json", update, [])
