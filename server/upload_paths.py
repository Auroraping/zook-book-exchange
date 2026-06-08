import os
import time
import uuid
from pathlib import Path
from image_optimizer import optimize_image


UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"


def save_upload(file, prefix):
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = os.path.splitext(file.filename)[1] or ".bin"
    filename = f"{prefix}_{int(time.time())}_{uuid.uuid4().hex[:6]}{ext}"
    path = UPLOAD_DIR / filename
    file.save(path)
    optimize_image(path)
    return f"/uploads/{filename}", filename
