import os
import time
import uuid
from pathlib import Path


UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"


def save_upload(file, prefix):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".bin"
    filename = f"{prefix}_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
    file.save(UPLOAD_DIR / filename)
    return f"/uploads/{filename}", filename
