from account_identity import normalize_account_id, public_account
from avatar_utils import DEFAULT_AVATAR, local_avatar
from json_store import read_json


def normalize_images(book):
    images = []
    for url in book.get("images") or []:
        url = str(url or "").strip()
        if url and url not in images:
            images.append(url)
    cover = str(book.get("cover") or "").strip()
    if cover and cover not in images:
        images.insert(0, cover)
    book["images"] = images
    book["cover"] = images[0] if images else ""
    return images


def credit_map():
    orders = read_json("orders.json", [])
    reviews = read_json("reviews.json", [])
    order_to_seller = {order.get("id"): normalize_account_id(order.get("sellerId")) for order in orders}
    ratings = {}
    for review in reviews:
        seller_id = order_to_seller.get(review.get("orderId"))
        if not seller_id:
            continue
        ratings.setdefault(seller_id, []).append(float(review.get("rating") or 5))
    return {seller_id: round(sum(items) / len(items), 1) for seller_id, items in ratings.items()}


def seller_profile(seller_id, seller, credit):
    return {
        "id": seller_id,
        "name": seller.get("name"),
        "avatar": local_avatar(seller.get("avatar")),
        "email": seller.get("email"),
        "studentId": seller.get("studentId"),
        "realName": seller.get("realName"),
        "college": seller.get("college"),
        "major": seller.get("major"),
        "classText": seller.get("classText") or seller.get("class"),
        "zjuAuthenticated": bool(seller.get("zjuAuthenticated")),
        "credit": credit,
    }


def enrich_with_seller(book, seller_id, seller, credit):
    book["sellerId"] = seller_id
    book["seller"] = book.get("seller") or seller.get("name") or "浙大同学"
    book["sellerAvatar"] = local_avatar(seller.get("avatar"))
    book["sellerProfile"] = seller_profile(seller_id, seller, credit)
    book["credit"] = credit
    normalize_images(book)
    return book


def fallback_seller(seller_id, name=None):
    seller_id = seller_id or "me"
    return {
        "id": seller_id,
        "name": name or "浙大同学",
        "avatar": DEFAULT_AVATAR,
        "credit": 5.0,
    }


def enrich_book(book):
    seller_id = normalize_account_id(book.get("sellerId") or "me")
    seller = public_account(seller_id)
    return enrich_with_seller(book, seller_id, seller, seller.get("credit", 5.0))


def enrich_books(books):
    users = read_json("users.json", [])
    users_by_id = {str(user.get("id")): user for user in users}
    users_by_email = {str(user.get("email")).lower(): user for user in users if user.get("email")}
    users_by_name = {str(user.get("username")).lower(): user for user in users if user.get("username")}
    credits = credit_map()
    for book in books:
        raw_id = str(book.get("sellerId") or "me").strip()
        key = raw_id.lower()
        user = users_by_id.get(raw_id) or users_by_email.get(key) or users_by_name.get(key)
        seller_id = str(user.get("id")) if user and user.get("id") else (raw_id or "me")
        seller = user or fallback_seller(seller_id, book.get("seller"))
        credit = credits.get(seller_id, 5.0)
        enrich_with_seller(book, seller_id, seller, credit)
    return books


def clean_images(payload):
    images = payload.get("images") or []
    if isinstance(images, str):
        images = [images]
    cleaned = []
    for url in images:
        url = str(url or "").strip()
        if url and url not in cleaned:
            cleaned.append(url)
    cover = str(payload.get("cover") or "").strip()
    if cover and cover not in cleaned:
        cleaned.insert(0, cover)
    return cleaned
