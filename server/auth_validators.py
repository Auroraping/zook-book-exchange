import re


EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def valid_email(email):
    return bool(EMAIL_PATTERN.match(str(email or "").strip()))


def password_errors(password):
    text = str(password or "")
    errors = []
    if len(text) < 8:
        errors.append("至少8位")
    if not re.search(r"[A-Za-z]", text):
        errors.append("包含字母")
    if not re.search(r"\d", text):
        errors.append("包含数字")
    if not re.search(r"[^A-Za-z0-9]", text):
        errors.append("包含特殊字符")
    return errors


def password_message(password):
    errors = password_errors(password)
    if not errors:
        return ""
    return f"密码强度不足，需要{ '、'.join(errors) }"
