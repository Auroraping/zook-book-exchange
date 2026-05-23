from pathlib import Path
import os


BASE_DIR = Path(__file__).resolve().parent


def resolve_env_path(file_name):
    env_path = Path(file_name)
    return env_path if env_path.is_absolute() else BASE_DIR / env_path


def load_local_env(file_name):
    env_path = resolve_env_path(file_name)
    if not env_path.exists():
        return

    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


load_local_env(os.getenv("ZOOK_ENV_FILE", ".env.local"))
load_local_env(".env")


REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}
