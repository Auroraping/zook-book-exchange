from datetime import datetime, timezone

from json_store import mutate_json, read_json


def search_registered_users(query):
    query_text = str(query or "").strip().lower()
    if not query_text:
        return []
    results = []
    for user in read_json("users.json", []):
        values = (user.get("id"), user.get("name"), user.get("realName"), user.get("username"), user.get("studentId"))
        if any(query_text in str(value or "").lower() for value in values):
            results.append({"id": user.get("id"), "name": user.get("name") or user.get("realName") or "未知用户"})
    return results[:10]


def room_history(room_id):
    chat_state = read_json("chat.json", {})
    return [item for item in chat_state.get("socket_messages", []) if str(item.get("roomId")) == str(room_id)]


def append_room_message(data):
    message_data = {**data, "timestamp": datetime.now(timezone.utc).isoformat()}

    def update(chat_state):
        messages = chat_state.setdefault("socket_messages", [])
        messages.append(message_data)
        return message_data

    return mutate_json("chat.json", update, {})
