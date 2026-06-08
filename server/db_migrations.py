import json
import os
from pathlib import Path

from db_manager import db_read_table, db_write_table


def seed_dir(default_dir=None):
    if default_dir:
        return Path(default_dir)
    fallback = Path(__file__).resolve().parents[1] / "client" / "public" / "data"
    return Path(os.getenv("ZOOK_DATA_DIR", fallback))


def read_seed(name, default):
    path = seed_dir() / name
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"[DB] Migration seed read failed for {name}: {exc}")
        return default


def is_legacy_image(value):
    text = str(value or "")
    return text.startswith("/book_") or text.startswith("data:image")


def has_legacy_book_image(book):
    images = book.get("images") or []
    return is_legacy_image(book.get("cover")) or any(is_legacy_image(path) for path in images)


def merge_seed_rows(table, seed_name, pk="id"):
    seed_rows = read_seed(seed_name, [])
    if not isinstance(seed_rows, list) or not seed_rows:
        return 0
    rows = db_read_table(table, fallback=[])
    existing = {str(row.get(pk)) for row in rows}
    missing = [row for row in seed_rows if str(row.get(pk)) not in existing]
    if missing:
        db_write_table(table, rows + missing)
    return len(missing)


def replace_notes_from_seed_if_cc98_missing():
    seed_notes = read_seed("notes.json", [])
    if not isinstance(seed_notes, list) or not seed_notes:
        return 0
    rows = db_read_table("notes", fallback=[])
    has_cc98 = any(str(row.get("id", "")).startswith("cc98-") for row in rows)
    seed_cc98 = [row for row in seed_notes if str(row.get("id", "")).startswith("cc98-")]
    if has_cc98 or not seed_cc98:
        return 0
    db_write_table("notes", seed_notes)
    return len(seed_notes)


def sync_ui_seed():
    ui = read_seed("ui.json", None)
    if isinstance(ui, dict) and ui:
        db_write_table("ui", ui, is_singular=True)
        return True
    return False


def sync_real_books():
    books = db_read_table("books", fallback=[])
    kept_books = [book for book in books if not has_legacy_book_image(book)]
    seed_books = read_seed("books.json", [])
    existing_ids = {str(book.get("id")) for book in kept_books}
    for book in seed_books:
        if str(book.get("id")) not in existing_ids:
            kept_books.append(book)
            existing_ids.add(str(book.get("id")))
    changed = len(kept_books) != len(books)
    if changed or len(existing_ids) != len({str(book.get("id")) for book in books}):
        db_write_table("books", kept_books)
        clean_related_book_refs(existing_ids)
    return changed


def clean_related_book_refs(valid_book_ids):
    orders = db_read_table("orders", fallback=[])
    clean_orders = [
        order for order in orders
        if str(order.get("bookId")) in valid_book_ids and not is_legacy_image(order.get("cover"))
    ]
    if len(clean_orders) != len(orders):
        db_write_table("orders", clean_orders)

    favorites = db_read_table("favorites", fallback=[])
    touched = False
    for entry in favorites:
        before = list(entry.get("bookIds") or [])
        entry["bookIds"] = [book_id for book_id in before if str(book_id) in valid_book_ids]
        touched = touched or before != entry["bookIds"]
    if touched:
        db_write_table("favorites", favorites)


def run_startup_migrations():
    sync_ui_seed()
    sync_real_books()
    restored_notes = replace_notes_from_seed_if_cc98_missing()
    if restored_notes:
        print(f"[DB] Migration restored {restored_notes} notes from seed.")
        return
    added_notes = merge_seed_rows("notes", "notes.json")
    if added_notes:
        print(f"[DB] Migration added {added_notes} missing notes from seed.")
