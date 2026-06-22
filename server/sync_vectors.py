import json
from pathlib import Path
from ai_vector_store import upsert_notes

BASE_DIR = Path(__file__).resolve().parent

def sync_all_notes():
    print("Reading notes.json...")
    # notes.json is in client/public/data
    notes_path = BASE_DIR.parent / "client" / "public" / "data" / "notes.json"
    if not notes_path.exists():
        print(f"notes.json not found at {notes_path}!")
        return

    with open(notes_path, "r", encoding="utf-8") as f:
        notes = json.load(f)

    print(f"Loaded {len(notes)} notes. Upserting into ChromaDB...")
    upsert_notes(notes)
    print("Done! Vector DB is now synchronized with notes.json.")

if __name__ == "__main__":
    sync_all_notes()
