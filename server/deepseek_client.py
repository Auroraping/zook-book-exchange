import json
import os
import time

import requests


class ApiError(RuntimeError):
    def __init__(self, message, status=502):
        super().__init__(message)
        self.status = status


def api_config(agent=None):
    key = os.getenv("DEEPSEEK_API_KEY")
    if not key:
        raise ApiError("后端尚未配置 DEEPSEEK_API_KEY", status=503)
    return {
        "apiKey": key,
        "apiUrl": os.getenv("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions"),
        "model": os.getenv("DEEPSEEK_MODEL") or (agent or {}).get("model") or "deepseek-v4-flash",
    }


def request_body(messages, agent=None, stream=False):
    return {
        "model": api_config(agent)["model"],
        "messages": messages,
        "stream": stream,
        "temperature": 0.5 if (agent or {}).get("id") == "general" else 0.35,
        "max_tokens": 850,
    }


def headers(agent=None):
    return {"Authorization": f"Bearer {api_config(agent)['apiKey']}", "Content-Type": "application/json"}


def post_chat(messages, agent=None):
    config = api_config(agent)
    started = time.time()
    try:
        resp = requests.post(
            config["apiUrl"], json=request_body(messages, agent), headers=headers(agent), timeout=45
        )
    except requests.RequestException as exc:
        raise ApiError("桃酥暂时无法连接模型服务，请稍后再试") from exc
    if resp.status_code >= 400:
        raise ApiError("桃酥暂时无法连接模型服务，请稍后再试", status=resp.status_code)
    data = resp.json()
    reply = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "").strip()
    if not reply:
        raise ApiError("DeepSeek 未返回有效回复")
    return {
        "reply": reply, "model": data.get("model") or config["model"],
        "usage": data.get("usage") or {}, "latencyMs": int((time.time() - started) * 1000),
    }


def stream_chat(messages, agent=None):
    config = api_config(agent)
    started = time.time()
    try:
        resp = requests.post(
            config["apiUrl"], json=request_body(messages, agent, True),
            headers=headers(agent), timeout=60, stream=True,
        )
    except requests.RequestException as exc:
        raise ApiError("桃酥暂时无法连接模型服务，请稍后再试") from exc
    if resp.status_code >= 400:
        raise ApiError("桃酥暂时无法连接模型服务，请稍后再试", status=resp.status_code)
    usage = {}
    for line in resp.iter_lines(decode_unicode=True):
        if not line or not line.startswith("data:"):
            continue
        raw = line[5:].strip()
        if raw == "[DONE]":
            break
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if data.get("usage"):
            usage = data["usage"]
        delta = ((data.get("choices") or [{}])[0].get("delta") or {}).get("content")
        if delta:
            yield {"type": "delta", "text": delta}
    yield {"type": "done", "model": config["model"], "usage": usage, "latencyMs": int((time.time() - started) * 1000)}
