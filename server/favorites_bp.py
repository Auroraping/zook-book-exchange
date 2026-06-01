from flask import Blueprint, jsonify
from json_store import find_by_id, mutate_json, read_json
from orders_helper import current_user_id, request_payload

favorites_bp = Blueprint("favorites_bp", __name__)

@favorites_bp.get("/api/favorites")
def list_favorites():
    user_id = current_user_id()
    favorites = read_json("favorites.json", [])
    entry = next((item for item in favorites if item.get("userId") == user_id), {"bookIds": []})
    books = read_json("books.json", [])
    items = [book for book_id in entry.get("bookIds", []) if (book := find_by_id(books, book_id))]
    return jsonify({"success": True, "bookIds": entry.get("bookIds", []), "items": items})

@favorites_bp.post("/api/favorites/toggle")
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
