import json
import sqlite3
from pathlib import Path

from db_manager import DB_PATH


def load_rows(cur, table):
    return [json.loads(row[0]) for row in cur.execute(f"SELECT data FROM {table}")]


def write_rows(cur, table, rows, pk):
    cur.execute(f"DELETE FROM {table}")
    for row in rows:
        key = row.get(pk)
        if key is None:
            continue
        cur.execute(
            f"INSERT INTO {table} ({pk}, data) VALUES (?, ?)",
            (str(key), json.dumps(row, ensure_ascii=False)),
        )


def main():
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.cursor()
        books = load_rows(cur, "books")
        valid_book_ids = {str(book.get("id")) for book in books}

        orders = [order for order in load_rows(cur, "orders") if str(order.get("bookId")) in valid_book_ids]
        favorites = load_rows(cur, "favorites")
        for favorite in favorites:
            favorite["bookIds"] = [book_id for book_id in favorite.get("bookIds", []) if str(book_id) in valid_book_ids]

        write_rows(cur, "orders", orders, "id")
        write_rows(cur, "favorites", favorites, "userId")
        conn.commit()

        data_dir = Path(__file__).resolve().parents[1] / "client" / "public" / "data"
        books.sort(key=lambda item: (str(item.get("createdAt") or ""), str(item.get("id") or "")), reverse=True)
        orders.sort(key=lambda item: (str(item.get("date") or ""), str(item.get("id") or "")), reverse=True)
        (data_dir / "books.json").write_text(json.dumps(books, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        (data_dir / "orders.json").write_text(json.dumps(orders, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"books={len(books)} orders={len(orders)} favorites={len(favorites)}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
