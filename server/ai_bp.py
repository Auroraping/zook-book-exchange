import os
import json
from pathlib import Path
from flask import Blueprint, Response, jsonify, request, stream_with_context
from ai_agents import get_agent, public_agent, public_agents
from ai_context import build_context
from ai_service import ask_taosu, ApiError, get_recommendation_fallback, get_recommendation_from_ai, stream_events
from auth_context import current_request_user
from json_store import read_json

ai_bp = Blueprint("ai_bp", __name__)

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-pro"
DEFAULT_DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

def resolve_local_env_path():
    configured_path = os.getenv("ZOOK_ENV_FILE")
    if configured_path:
        env_path = Path(configured_path)
        return env_path if env_path.is_absolute() else BASE_DIR / env_path
    return BASE_DIR / ".env.local"

ENV_LOCAL_PATH = resolve_local_env_path()

def request_payload():
    return request.get_json(silent=True) or {}

def mask_secret(value):
    text = str(value or "")
    if not text:
        return ""
    if len(text) <= 10:
        return f"{text[:2]}***"
    return f"{text[:6]}***{text[-4:]}"

def read_env_lines():
    if not ENV_LOCAL_PATH.exists():
        return []
    try:
        return ENV_LOCAL_PATH.read_text(encoding="utf-8").splitlines()
    except Exception:
        return []

def single_line_env_value(value):
    text = str(value or "").strip()
    if "\n" in text or "\r" in text:
        raise ValueError("配置值不能包含换行")
    return text

def write_deepseek_env(api_key, model=None, api_url=None):
    secret = single_line_env_value(api_key)
    model_name = single_line_env_value(model or DEFAULT_DEEPSEEK_MODEL)
    endpoint = single_line_env_value(api_url or DEFAULT_DEEPSEEK_API_URL)
    preserved = []
    for line in read_env_lines():
        key = line.split("=", 1)[0].strip() if "=" in line else ""
        if key not in {"DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "DEEPSEEK_API_URL"}:
            preserved.append(line)

    values = [
        f"DEEPSEEK_API_KEY={secret}",
        f"DEEPSEEK_MODEL={model_name}",
        f"DEEPSEEK_API_URL={endpoint}",
    ]
    ENV_LOCAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    ENV_LOCAL_PATH.write_text("\n".join([*preserved, *values, ""]), encoding="utf-8")
    os.environ["DEEPSEEK_API_KEY"] = secret
    os.environ["DEEPSEEK_MODEL"] = model_name
    os.environ["DEEPSEEK_API_URL"] = endpoint
    return {"configured": True, "model": model_name, "apiUrl": endpoint, "configPath": str(ENV_LOCAL_PATH)}

@ai_bp.get("/api/ai/config")
def get_ai_config():
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    return jsonify(
        {
            "success": True,
            "configured": bool(api_key),
            "maskedKey": mask_secret(api_key),
            "model": os.getenv("DEEPSEEK_MODEL", DEFAULT_DEEPSEEK_MODEL),
            "apiUrl": os.getenv("DEEPSEEK_API_URL", DEFAULT_DEEPSEEK_API_URL),
            "configPath": str(ENV_LOCAL_PATH),
        }
    )


@ai_bp.get("/api/ai/agents")
def get_ai_agents():
    return jsonify({"success": True, "agents": public_agents()})


@ai_bp.post("/api/ai/config")
def save_ai_config():
    payload = request_payload()
    api_key = str(payload.get("apiKey") or "").strip()
    model = str(payload.get("model") or DEFAULT_DEEPSEEK_MODEL).strip()
    api_url = str(payload.get("apiUrl") or DEFAULT_DEEPSEEK_API_URL).strip()
    if not api_key:
        existing_key = os.getenv("DEEPSEEK_API_KEY")
        if existing_key:
            api_key = existing_key
        else:
            return jsonify({"success": False, "message": "请输入 API 密钥"}), 400

    if not api_url.startswith("https://"):
        return jsonify({"success": False, "message": "API 地址必须使用 HTTPS"}), 400

    try:
        config = write_deepseek_env(api_key, model, api_url)
    except ValueError as exc:
        return jsonify({"success": False, "message": str(exc)}), 400
    return jsonify({"success": True, **config, "maskedKey": mask_secret(api_key)})

@ai_bp.post("/api/ai/chat")
def ai_chat():
    payload = request.get_json(silent=True) or {}
    agent = get_agent(payload.get("agent"))
    user = current_request_user()
    context, references = build_context(agent["id"], user, payload.get("message"))
    try:
        result = ask_taosu(payload, agent, context, references, user)
        return jsonify({"success": True, "agent": public_agent(agent), **result})
    except ApiError as exc:
        return jsonify({"success": False, "message": str(exc)}), exc.status
    except Exception as exc:
        print("[AI] request failed:", exc)
        return jsonify({"success": False, "message": "小酥暂时无法连接模型服务，请稍后再试"}), 502


@ai_bp.post("/api/ai/chat/stream")
def ai_chat_stream():
    payload = request.get_json(silent=True) or {}
    agent = get_agent(payload.get("agent"))
    user = current_request_user()
    context, references = build_context(agent["id"], user, payload.get("message"))

    def generate():
        try:
            yield from stream_events(payload, agent, context, references, user)
        except ApiError as exc:
            yield f"event: error\ndata: {json.dumps({'message': str(exc)}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            print("[AI Stream] request failed:", exc)
            yield "event: error\ndata: {\"message\": \"桃酥暂时无法连接模型服务，请稍后再试\"}\n\n"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")


@ai_bp.get("/api/ai/recommend")
def ai_recommend():
    user = current_request_user() or {}
    courses = ((user.get("scheduleData") or {}).get("courses")) or read_json("courses.json", [])
    books = [book for book in read_json("books.json", []) if book.get("status") == "approved"]
    recs = get_recommendation_from_ai(courses, books) or get_recommendation_fallback(courses, books)
    for book in books:
        rec = next((item for item in recs if str(item.get("id")) == str(book.get("id"))), None)
        book["aiScore"] = int((rec or {}).get("aiScore") or 60)
        book["aiSummary"] = (rec or {}).get("aiSummary") or "该书籍当前不在您的修读课表关联范围内。"
    return jsonify({"success": True, "books": books})
