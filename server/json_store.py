from copy import deepcopy
from datetime import datetime
from pathlib import Path
import json
import os
import threading
import uuid


DEFAULT_DATA_DIR = Path(__file__).resolve().parents[1] / "client" / "public" / "data"
DATA_DIR = Path(os.getenv("ZOOK_DATA_DIR", DEFAULT_DATA_DIR))
STORE_LOCK = threading.Lock()


DEFAULTS = {
    "carts.json": [],
    "favorites.json": [],
    "reviews.json": [],
    "chat.json": {},
}


def now_text():
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def new_id(prefix):
    return f"{prefix}{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}"


def data_path(file_name):
    return DATA_DIR / file_name


def read_json(file_name, fallback=None):
    path = data_path(file_name)
    if not path.exists():
        return deepcopy(DEFAULTS.get(file_name, fallback if fallback is not None else []))
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def write_json(file_name, data):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = data_path(file_name)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)
        file.write("\n")
    temp_path.replace(path)
    return data


def mutate_json(file_name, callback, fallback=None):
    with STORE_LOCK:
        data = read_json(file_name, fallback)
        result = callback(data)
        write_json(file_name, data)
        return result


def find_by_id(items, item_id):
    return next((item for item in items if str(item.get("id")) == str(item_id)), None)
