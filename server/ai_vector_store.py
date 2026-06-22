import os
from pathlib import Path

import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "chroma_db"

# Initialize ChromaDB client
client = chromadb.PersistentClient(path=str(DB_PATH), settings=Settings(anonymized_telemetry=False))

# Use the default lightweight embedding function (all-MiniLM-L6-v2)
# This will download automatically the first time it is used.
default_ef = embedding_functions.DefaultEmbeddingFunction()

def get_notes_collection():
    return client.get_or_create_collection(
        name="community_notes",
        embedding_function=default_ef,
        metadata={"hnsw:space": "cosine"}
    )

def _build_note_text(note):
    tags = " ".join(note.get("tags") or [])
    title = str(note.get("title") or "")
    course = str(note.get("course") or "")
    desc = str(note.get("desc") or "")
    return f"标题：{title} 课程：{course} 标签：{tags} 描述：{desc}"

def upsert_notes(notes):
    if not notes:
        return
    collection = get_notes_collection()
    
    ids = []
    documents = []
    metadatas = []
    
    for note in notes:
        ids.append(str(note.get("id")))
        documents.append(_build_note_text(note))
        metadatas.append({
            "title": str(note.get("title") or ""),
            "course": str(note.get("course") or ""),
            "type": str(note.get("type") or ""),
            "downloads": int(note.get("downloads") or 0),
            "likes": int(note.get("likes") or 0),
        })
        
    # Process in batches to avoid overloading
    batch_size = 100
    for i in range(0, len(ids), batch_size):
        collection.upsert(
            ids=ids[i:i+batch_size],
            documents=documents[i:i+batch_size],
            metadatas=metadatas[i:i+batch_size]
        )

def search_notes(query_text, n_results=10):
    collection = get_notes_collection()
    if collection.count() == 0:
        return []
    
    # chromadb uses distance (smaller is better for cosine distance if configured so, 
    # but chromadb default l2 distance is smaller = more similar. cosine is also smaller = more similar)
    results = collection.query(
        query_texts=[query_text],
        n_results=n_results
    )
    
    if not results or not results["ids"] or not results["ids"][0]:
        return []
        
    return [
        {"id": results["ids"][0][i], "distance": results["distances"][0][i]}
        for i in range(len(results["ids"][0]))
    ]
