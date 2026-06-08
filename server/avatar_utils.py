DEFAULT_AVATAR = "/user_avatar.png"


def local_avatar(value):
    avatar = str(value or "").strip()
    if not avatar or "api.dicebear.com" in avatar:
        return DEFAULT_AVATAR
    return avatar


def public_avatar_user(user):
    data = {key: value for key, value in (user or {}).items() if key != "passwordHash"}
    data["avatar"] = local_avatar(data.get("avatar"))
    return data
