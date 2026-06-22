from datetime import datetime, timedelta, timezone
import os
import random
import smtplib
from email.message import EmailMessage
from uuid import uuid4

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from auth_repository import active_token, find_user, find_user_by_id, revoke_token, save_token, save_user
from auth_validators import password_message, valid_email
from avatar_utils import DEFAULT_AVATAR, public_avatar_user
from json_store import new_id, now_text
from jwt_service import create_jwt, decode_jwt, iso_date, timestamp
from schedule_helper import fetch_schedule

auth_bp = Blueprint("auth_bp", __name__)

OTP_STORE = {}

def send_email_code(to_email, code):
    server = os.getenv("SMTP_SERVER")
    port = os.getenv("SMTP_PORT")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    
    if not (server and port and user and password):
        print(f"[TEST EMAIL] To: {to_email}, Code: {code}")
        return True

    try:
        msg = EmailMessage()
        msg.set_content(f"您的注册验证码是：{code}，5分钟内有效。如非本人操作请忽略。")
        msg["Subject"] = "浙里淘书 - 注册验证码"
        msg["From"] = user
        msg["To"] = to_email

        with smtplib.SMTP_SSL(server, int(port)) as smtp:
            smtp.login(user, password)
            smtp.send_message(msg)
        return True
    except Exception as e:
        print("[Email Error]:", e)
        return False


def request_payload():
    return request.get_json(silent=True) or {}


def public_auth_user(user):
    return public_avatar_user(user)


def token_response(user, remember=False):
    hours = 24 * 3 if remember else 12
    expire_dt = datetime.now(timezone.utc) + timedelta(hours=hours)
    jti = uuid4().hex
    payload = {"sub": user["id"], "jti": jti, "exp": timestamp(expire_dt)}
    token = create_jwt(payload)
    expire_date = iso_date(expire_dt)
    save_token(jti, user["id"], expire_date)
    return {"token": token, "tokenType": "Bearer", "expireDate": expire_date}


def default_user(email, password, display_name=None):
    local_name = email.split("@", 1)[0]
    name = display_name or local_name or "浙大同学"
    return {
        "id": new_id("u"), "username": email, "email": email, "name": name,
        "realName": "", "studentId": "", "college": "", "major": "",
        "class": "", "credit": 5.0, "tradeCount": 0,
        "points": 0, "level": "Lv.1 新同学", "zjuAuthenticated": False,
        "avatar": DEFAULT_AVATAR,
        "bio": "邮箱注册用户。", "joinDate": now_text(),
        "passwordHash": generate_password_hash(password),
    }


def apply_real_info(user, real_info):
    fields = (
        "realName", "studentId", "college", "major", "class",
        "zjuAuthenticated", "zjuUsername", "scheduleSyncedAt", "scheduleData",
    )
    for key in fields:
        if key in real_info:
            user[key] = real_info[key]
    return user


def current_auth_user():
    token = str(request.headers.get("Authorization") or "").replace("Bearer ", "", 1)
    payload = decode_jwt(token)
    if not active_token(payload.get("jti")):
        raise ValueError("revoked token")
    user = find_user_by_id(payload.get("sub"))
    if not user:
        raise ValueError("missing user")
    return user


@auth_bp.post("/api/login")
def login():
    payload = request_payload()
    email = str(payload.get("email") or payload.get("username") or "").strip().lower()
    password = str(payload.get("password") or "")
    remember = bool(payload.get("remember"))
    if not valid_email(email):
        return jsonify({"success": False, "message": "请输入正确的邮箱"}), 400
    if not password:
        return jsonify({"success": False, "message": "请输入密码"}), 400

    user = find_user(email)
    if user:
        hash_value = user.get("passwordHash")
        if not hash_value:
            return jsonify({"success": False, "message": "账号未设置邮箱密码，请重新注册"}), 401
        if not check_password_hash(hash_value, password):
            return jsonify({"success": False, "message": "账号或密码不正确"}), 401
    else:
        return jsonify({"success": False, "message": "账号不存在，请先用邮箱注册"}), 404

    data = {"success": True, "user": public_auth_user(user)}
    data.update(token_response(user, remember))
    return jsonify(data)


@auth_bp.post("/api/auth/send-code")
def send_code():
    payload = request_payload()
    email_addr = str(payload.get("email") or "").strip().lower()
    if not valid_email(email_addr):
        return jsonify({"success": False, "message": "邮箱格式不正确"}), 400
    if find_user(email_addr):
        return jsonify({"success": False, "message": "邮箱已注册，请直接登录"}), 409
    
    now = datetime.now(timezone.utc)
    if email_addr in OTP_STORE:
        existing = OTP_STORE[email_addr]
        if existing["expires_at"] > now and (existing["expires_at"] - now).total_seconds() > 240:
            return jsonify({"success": False, "message": "发送过于频繁，请稍后再试"}), 429
            
    code = f"{random.randint(0, 999999):06d}"
    if send_email_code(email_addr, code):
        OTP_STORE[email_addr] = {
            "code": code,
            "expires_at": now + timedelta(minutes=5)
        }
        return jsonify({"success": True, "message": "验证码已发送"})
    else:
        return jsonify({"success": False, "message": "验证码发送失败，请检查邮件配置"}), 500


@auth_bp.post("/api/register")
def register():
    payload = request_payload()
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    confirm_password = str(payload.get("confirmPassword") or "")
    code = str(payload.get("code") or "").strip()
    display_name = str(payload.get("name") or email.split("@", 1)[0] or "浙大同学").strip()
    remember = bool(payload.get("remember"))
    if not valid_email(email):
        return jsonify({"success": False, "message": "邮箱格式不正确"}), 400
    if not code:
        return jsonify({"success": False, "message": "请输入验证码"}), 400
    if password != confirm_password:
        return jsonify({"success": False, "message": "两次输入的密码不一致"}), 400
    pass_msg = password_message(password)
    if pass_msg:
        return jsonify({"success": False, "message": pass_msg}), 400
    if find_user(email):
        return jsonify({"success": False, "message": "邮箱已注册，请直接登录"}), 409

    now = datetime.now(timezone.utc)
    stored = OTP_STORE.get(email)
    if not stored or stored["expires_at"] < now:
        return jsonify({"success": False, "message": "验证码不存在或已过期"}), 400
    if stored["code"] != code:
        return jsonify({"success": False, "message": "验证码不正确"}), 400
    
    del OTP_STORE[email]

    user = default_user(email, password, display_name=display_name)
    save_user(user)
    data = {"success": True, "user": public_auth_user(user)}
    data.update(token_response(user, remember))
    return jsonify(data)


@auth_bp.get("/api/auth/session")
def session():
    token = str(request.headers.get("Authorization") or "").replace("Bearer ", "", 1)
    try:
        payload = decode_jwt(token)
        if not active_token(payload.get("jti")):
            raise ValueError("revoked token")
        user = find_user_by_id(payload.get("sub"))
        if not user:
            raise ValueError("missing user")
        return jsonify({"success": True, "user": public_auth_user(user), "expireDate": iso_date(datetime.fromtimestamp(payload["exp"], timezone.utc))})
    except Exception:
        return jsonify({"success": False, "message": "登录状态已失效，请重新登录"}), 401


@auth_bp.post("/api/logout")
def logout():
    token = str(request.headers.get("Authorization") or "").replace("Bearer ", "", 1)
    try:
        payload = decode_jwt(token, verify_exp=False)
        revoke_token(payload.get("jti"))
    except Exception:
        pass
    return jsonify({"success": True, "message": "已退出登录"})


@auth_bp.post("/api/auth/zju")
def zju_auth():
    payload = request_payload()
    zju_username = str(payload.get("username") or "").strip()
    zju_password = str(payload.get("password") or "")
    if not zju_username or not zju_password:
        return jsonify({"success": False, "message": "请输入浙大统一身份认证账号和密码"}), 400
    try:
        user = current_auth_user()
    except Exception:
        return jsonify({"success": False, "message": "登录状态已失效，请重新登录"}), 401

    try:
        sched = fetch_schedule(zju_username, zju_password)
        if not sched.get("courses"):
            return jsonify({"success": False, "message": "统一身份认证成功，但未获取到课表数据"}), 502
    except Exception as exc:
        print("[Auth] ZJU bind failed:", exc)
        return jsonify({"success": False, "message": "浙大统一身份认证失败或课表同步失败"}), 401

    raw = sched.get("raw") or {}
    real_info = {
        "realName": raw.get("xm") or zju_username, "studentId": raw.get("xh") or zju_username,
        "college": raw.get("xy") or "浙江大学", "major": raw.get("zy") or "未填写",
        "class": raw.get("xzb") or "", "zjuAuthenticated": True,
        "zjuUsername": zju_username, "scheduleSyncedAt": now_text(), "scheduleData": sched,
    }
    apply_real_info(user, real_info)
    save_user(user)
    return jsonify({"success": True, "user": public_auth_user(user), "courses": sched["courses"], "raw": raw})


@auth_bp.post("/api/auth/zju/unbind")
def zju_unbind():
    try:
        user = current_auth_user()
    except Exception:
        return jsonify({"success": False, "message": "登录状态已失效，请重新登录"}), 401
    for key in ("realName", "studentId", "college", "major", "class", "zjuUsername", "scheduleSyncedAt"):
        user[key] = ""
    user["zjuAuthenticated"] = False
    user["scheduleData"] = {}
    save_user(user)
    return jsonify({"success": True, "user": public_auth_user(user), "message": "已取消浙大统一身份认证"})
