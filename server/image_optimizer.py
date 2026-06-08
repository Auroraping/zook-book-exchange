from pathlib import Path
from PIL import Image, ImageOps

MAX_SIZE = (1400, 1400)
JPEG_QUALITY = 78


def optimize_image(path):
    path = Path(path)
    if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
        return
    try:
        with Image.open(path) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)
            suffix = path.suffix.lower()
            if suffix in {".jpg", ".jpeg"} and img.mode not in {"RGB", "L"}:
                img = img.convert("RGB")
            if suffix in {".jpg", ".jpeg"}:
                img.save(path, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            elif suffix == ".webp":
                img.save(path, format="WEBP", quality=JPEG_QUALITY, method=6)
            else:
                img.save(path, format="PNG", optimize=True)
    except OSError:
        return
