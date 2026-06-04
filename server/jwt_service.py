import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timezone


def _secret():
    return os.getenv("JWT_SECRET", "zook-development-jwt-secret").encode("utf-8")


def _b64encode(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def _b64decode(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("ascii"))


def _json_dumps(data):
    return json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def timestamp(dt):
    return int(dt.replace(tzinfo=timezone.utc).timestamp())


def iso_date(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def create_jwt(payload):
    header = {"alg": "HS256", "typ": "JWT"}
    header_part = _b64encode(_json_dumps(header))
    payload_part = _b64encode(_json_dumps(payload))
    signing_input = f"{header_part}.{payload_part}".encode("ascii")
    signature = hmac.new(_secret(), signing_input, hashlib.sha256).digest()
    return f"{header_part}.{payload_part}.{_b64encode(signature)}"


def decode_jwt(token, verify_exp=True):
    parts = str(token or "").split(".")
    if len(parts) != 3:
        raise ValueError("invalid token")

    signing_input = f"{parts[0]}.{parts[1]}".encode("ascii")
    expected = hmac.new(_secret(), signing_input, hashlib.sha256).digest()
    provided = _b64decode(parts[2])
    if not hmac.compare_digest(expected, provided):
        raise ValueError("invalid signature")

    payload = json.loads(_b64decode(parts[1]).decode("utf-8"))
    exp = payload.get("exp")
    if verify_exp and exp and datetime.now(timezone.utc).timestamp() >= int(exp):
        raise ValueError("token expired")
    return payload
