import html
import re

import requests

from config import REQUEST_HEADERS


CAS_BASE_URL = "https://zjuam.zju.edu.cn/cas"


def encrypt_cas_password(password, modulus, exponent):
    password_int = int.from_bytes(password.encode("utf-8"), "big")
    modulus_int = int(modulus, 16)
    exponent_int = int(exponent, 16)
    encrypted_int = pow(password_int, exponent_int, modulus_int)
    return f"{encrypted_int:0{len(modulus)}x}"


def extract_execution(login_html):
    match = re.search(r'name="execution"\s+value="(.+?)"', login_html or "")
    if not match:
        raise RuntimeError("无法获取统一认证 execution 参数")
    return match.group(1)


def parse_login_error(response_text):
    match = re.search(r'<span id="errorMsg"[^>]*>(.+?)</span>', response_text or "", re.S)
    if match:
        return html.unescape(re.sub(r"<[^>]+>", "", match.group(1))).strip()
    return "学号或密码不匹配"


def new_session():
    session = requests.Session()
    session.headers.update(REQUEST_HEADERS)
    session.trust_env = False
    return session


def authenticate_zju(username, password):
    try:
        session = new_session()

        login_page = session.get(f"{CAS_BASE_URL}/login", timeout=15)
        login_page.raise_for_status()
        execution = extract_execution(login_page.text)

        public_key = session.get(f"{CAS_BASE_URL}/v2/getPubKey", timeout=15)
        public_key.raise_for_status()
        key_data = public_key.json()
        encrypted_password = encrypt_cas_password(
            password,
            key_data["modulus"],
            key_data["exponent"],
        )

        form_data = {
            "username": username,
            "password": encrypted_password,
            "execution": execution,
            "_eventId": "submit",
            "authcode": "",
            "rememberMe": "true",
        }
        response = session.post(
            f"{CAS_BASE_URL}/login",
            data=form_data,
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"{CAS_BASE_URL}/login",
            },
            timeout=15,
            allow_redirects=False,
        )

        success = response.status_code in (301, 302, 303) or "iPlanetDirectoryPro" in session.cookies
        if success:
            return {"success": True, "message": "登录成功"}

        return {"success": False, "message": parse_login_error(response.text)}
    except Exception as exc:
        print("[Auth] final auth error:", exc)
        return {"success": False, "message": "认证服务异常，请检查网络或稍后再试"}

