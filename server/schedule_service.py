from datetime import datetime
from html import unescape
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
import os
import re

from auth_service import encrypt_cas_password, extract_execution, new_session
from config import BASE_DIR, REQUEST_HEADERS


CAS_LOGIN_FOR_JW = (
    "https://zjuam.zju.edu.cn/cas/login?"
    "service=https%3A%2F%2Fzdbk.zju.edu.cn%2Fjwglxt%2Fxtgl%2Flogin_ssologin.html"
)
JW_BASE = "https://zdbk.zju.edu.cn/jwglxt"
ACTIVE_SESSIONS = {}


def get_academic_year_code():
    now = datetime.now()
    year_start = now.year if now.month >= 9 else now.year - 1
    return f"{year_start}-{year_start + 1}"


def clean_html_text(value):
    if value is None:
        return ""
    text = str(value)
    text = re.sub(r"<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def write_crawler_debug_file(file_name, data):
    if os.getenv("DEBUG_CRAWLER") != "1":
        return
    path = BASE_DIR / file_name
    if isinstance(data, str):
        path.write_text(data, encoding="utf-8")
    else:
        import json

        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def to_absolute_jwglxt_url(url):
    if not url:
        return ""
    if url.startswith("http"):
        return url
    normalized = url if url.startswith("/jwglxt") else f"/jwglxt/{url.lstrip('/')}"
    return f"https://zdbk.zju.edu.cn{normalized}"


def with_menu_params(url, username):
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.setdefault("gnmkdm", "N253535")
    query.setdefault("su", username)
    return urlunparse(parsed._replace(query=urlencode(query)))


def is_session_valid(session):
    try:
        response = session.get(
            f"{JW_BASE}/xtgl/index_initMenu.html",
            timeout=5,
            allow_redirects=True,
        )
        text = response.text or ""
        if "统一身份认证" in text or "用户登录" in text or "ssodl" in text:
            return False
        return response.status_code == 200
    except Exception:
        return False


def get_authenticated_session(username, password):
    cached = ACTIVE_SESSIONS.get(username)
    if cached and is_session_valid(cached):
        return cached

    session = new_session()
    session.headers.update(REQUEST_HEADERS)
    ACTIVE_SESSIONS[username] = session

    login_page = session.get(CAS_LOGIN_FOR_JW, timeout=20, allow_redirects=True)
    login_page.raise_for_status()
    execution = extract_execution(login_page.text)

    public_key = session.get("https://zjuam.zju.edu.cn/cas/v2/getPubKey", timeout=20)
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
    login_response = session.post(
        CAS_LOGIN_FOR_JW,
        data=form_data,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": CAS_LOGIN_FOR_JW,
        },
        timeout=20,
        allow_redirects=True,
    )

    login_html = login_response.text or ""
    if "统一身份认证" in login_html and "用户名" in login_html and "login_ssologin" not in login_html:
        ACTIVE_SESSIONS.pop(username, None)
        raise RuntimeError("学号或密码匹配失败，无法通过浙江大学统一身份认证网关")

    try:
        session.get(
            f"{JW_BASE}/xtgl/index_initMenu.html",
            timeout=20,
            allow_redirects=True,
        )
    except Exception as exc:
        print("[Auth] 教务 SSO 会话初始化状态:", exc)

    return session


def fetch_schedule(username, password):
    session = get_authenticated_session(username, password)
    academic_year = get_academic_year_code()
    schedule_url = f"{JW_BASE}/kbcx/xskbcx_cxXsKb.html?gnmkdm=N253508&su={username}"

    response = session.post(
        schedule_url,
        data={"xnm": academic_year, "xqm": ""},
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": f"{JW_BASE}/kbcx/xskbcx_cxXskbcxIndex.html",
        },
        timeout=20,
    )

    try:
        raw_data = response.json()
    except ValueError:
        retry = session.post(
            schedule_url,
            data={"xnm": academic_year},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20,
        )
        try:
            raw_data = retry.json()
        except ValueError as exc:
            raise RuntimeError("教务网课表接口数据异常，无法获取 JSON 结构") from exc

    return parse_schedule_data(raw_data, username)


def parse_int(value, default=0):
    try:
        return int(str(value).strip())
    except (TypeError, ValueError):
        return default


def parse_schedule_data(raw_data, username):
    kb_list = raw_data.get("kbList") or raw_data.get("kblist") or []
    write_crawler_debug_file("raw_schedule.json", raw_data)

    if not kb_list:
        return {"courses": [], "raw": raw_data, "username": username}

    courses = []
    for index, item in enumerate(kb_list):
        kcb = item.get("kcb") or ""
        parts = [
            clean_html_text(part)
            for part in re.split(r"<br\s*/?>", kcb, flags=re.I)
            if clean_html_text(part)
        ]

        name = item.get("kcmc") or (parts[0] if len(parts) > 0 else "未知课程")
        week_text = item.get("zcd") or item.get("qsjsz") or (parts[1] if len(parts) > 1 else "")
        teacher = item.get("xm") or (parts[2] if len(parts) > 2 else "未知教师")
        location = item.get("cdmc") or item.get("jxdd") or (parts[3] if len(parts) > 3 else "未知地点")

        day = parse_int(item.get("xqj"))
        start_period = parse_int(item.get("djj"), None)
        if start_period is None:
            start_period = parse_int(str(item.get("jcs") or item.get("jc") or "1").split("-")[0], 1)

        duration = parse_int(item.get("skcd"), None)
        if duration is None:
            course_range = str(item.get("jcs") or item.get("jc") or "")
            if "-" in course_range:
                start, end = [parse_int(part, 1) for part in course_range.split("-", 1)]
                duration = max(1, end - start + 1)
            else:
                duration = 2

        name_text = str(name)
        location_text = str(location)
        sports_keywords = ["跆拳道", "体育", "羽毛球", "网球", "乒乓球", "游泳", "太极", "篮球", "足球"]
        is_sports_course = any(keyword in name_text for keyword in sports_keywords) or any(
            keyword in location_text for keyword in ["体育", "馆", "场"]
        )
        if is_sports_course and duration == 3:
            duration = 2

        course_type = "专业必修"
        course_nature = item.get("kcxzmc") or item.get("kcxz") or ""
        if "选修" in course_nature:
            course_type = "专业选修"
        elif "通识" in course_nature:
            course_type = "公共必修"

        courses.append(
            {
                "id": f"real_c{index + 1}",
                "name": name,
                "teacher": teacher,
                "location": location,
                "day": day,
                "period": start_period,
                "duration": duration,
                "weekText": week_text,
                "type": course_type,
                "term": "当前学期",
                "xxq": item.get("xxqmc") or item.get("xxq") or "",
                "bookIds": [],
                "_raw": {
                    "kcb": item.get("kcb"),
                    "xqj": item.get("xqj"),
                    "djj": item.get("djj"),
                    "jcs": item.get("jcs") or item.get("jc"),
                    "zcd": item.get("zcd"),
                    "kcmc": item.get("kcmc"),
                    "kcxzmc": item.get("kcxzmc"),
                    "xxqmc": item.get("xxqmc"),
                    "xxq": item.get("xxq"),
                },
            }
        )

    return {
        "courses": courses,
        "username": username,
        "termInfo": {
            "year": raw_data.get("xnm") or "",
            "semester": raw_data.get("xqmmc") or raw_data.get("xqm") or "",
        },
        "raw": raw_data,
    }


def extract_textbook_unavailable_reason(html_text):
    text = clean_html_text(html_text)
    if "现在不是预定教材时间" in text:
        return "教务网提示：现在不是预定教材时间，官方教材预订列表暂未开放。"
    if "运行异常" in text or "系统异常" in text:
        return "教务网教材页面当前返回系统异常，暂时无法同步官方教材。"
    return ""


def fetch_textbooks(username, password):
    session = get_authenticated_session(username, password)
    textbook_url = f"{JW_BASE}/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su={username}"

    response = session.get(
        textbook_url,
        headers={"Referer": f"{JW_BASE}/xtgl/index_initMenu.html"},
        timeout=20,
    )
    response.raise_for_status()
    index_html = response.text
    write_crawler_debug_file("raw_textbooks.html", index_html)

    unavailable_reason = extract_textbook_unavailable_reason(index_html)
    textbooks = parse_textbooks_html(index_html)
    grid_result = {"textbooks": [], "unavailableReason": ""}
    if not textbooks:
        grid_result = fetch_textbooks_from_grid_apis(session, username, index_html)
        textbooks = grid_result["textbooks"]

    usable_count = len([item for item in textbooks if has_concrete_textbook_name(item)])
    if usable_count > 0:
        message = f"已从教务网同步 {usable_count} 条官方教材记录"
    elif textbooks:
        message = (
            f"教务网已返回 {len(textbooks)} 门课程，但教材名称、作者、出版社等详情字段为空，"
            "可能尚未开放预订或任课教师未填写教材。"
        )
    else:
        message = grid_result.get("unavailableReason") or unavailable_reason or "当前没有从教务网同步到官方教材记录"

    return {
        "textbooks": textbooks,
        "sourceUrl": textbook_url,
        "unavailableReason": "" if usable_count > 0 else message,
        "message": message,
    }


def fetch_textbook_scripts(session, index_html):
    scripts = []
    for src in re.findall(r'<script[^>]+src=["\']([^"\']*xsxjc[^"\']*\.js[^"\']*)["\']', index_html, re.I):
        url = to_absolute_jwglxt_url(src)
        try:
            response = session.get(url, timeout=20)
            if response.status_code == 200:
                scripts.append(response.text)
        except Exception as exc:
            print(f"[Textbooks] 教材业务脚本读取失败 {url}: {exc}")
    return scripts


def fetch_textbooks_from_grid_apis(session, username, index_html):
    academic_year = get_academic_year_code()
    endpoint_set = {
        "/xsxjc/xsxjc_cxXsxjcIndex.html?doType=query",
        "/xsxjc/xsxjc_cxXsxjc.html",
        "/xsxjc/xsxjc_cxXsXjc.html",
        "/xsxjc/xsxjc_cxXsxjcxx.html",
        "/xsxjc/xsxjc_cxXsxjcList.html",
    }

    searchable_text = "\n".join([index_html, *fetch_textbook_scripts(session, index_html)])
    for match in re.findall(r'(?:url|href|action)\s*[:=]\s*["\']([^"\']*xsxjc[^"\']*)["\']', searchable_text, re.I):
        endpoint_set.add(match)
    for match in re.findall(r'["\']([^"\']*/xsxjc/[^"\']+)["\']', searchable_text, re.I):
        endpoint_set.add(match)

    endpoints = []
    for item in endpoint_set:
        if item.startswith("http"):
            endpoints.append(item)
        else:
            path = item[len("/jwglxt") :] if item.startswith("/jwglxt") else item
            endpoints.append(f"{JW_BASE}{path if path.startswith('/') else '/' + path}")

    post_data = {
        "xnm": academic_year,
        "xqm": "",
        "page": 1,
        "rows": 200,
        "sidx": "",
        "sord": "asc",
        "_search": "false",
        "nd": int(datetime.now().timestamp() * 1000),
    }

    referer = f"{JW_BASE}/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su={username}"
    for endpoint in endpoints:
        if "cxXsxjcIndex" not in endpoint and "doType=query" not in endpoint:
            continue
        url = with_menu_params(endpoint, username)
        for method in ("post", "get"):
            try:
                if method == "post":
                    response = session.post(
                        url,
                        data=post_data,
                        headers={
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Referer": referer,
                            "X-Requested-With": "XMLHttpRequest",
                        },
                        timeout=20,
                    )
                else:
                    response = session.get(
                        url,
                        params=post_data,
                        headers={"Referer": referer, "X-Requested-With": "XMLHttpRequest"},
                        timeout=20,
                    )

                data = parse_json_response(response)
                if data is not None:
                    write_crawler_debug_file("raw_textbooks_grid.json", data)
                    courses = parse_textbook_course_rows(data)
                    if courses:
                        details = fetch_textbook_details(session, username, courses)
                        if details:
                            return {"textbooks": details, "unavailableReason": ""}
                        return {
                            "textbooks": [course_to_unavailable_textbook(course) for course in courses],
                            "unavailableReason": "教务网返回了课程列表，但教材详情为空，可能仍未开放预订或课程未指定教材。",
                        }

                    parsed = parse_textbooks_json(data)
                    if parsed:
                        return {"textbooks": parsed, "unavailableReason": ""}
                else:
                    parsed = parse_textbooks_html(response.text or "")
                    if parsed:
                        return {"textbooks": parsed, "unavailableReason": ""}
            except Exception as exc:
                print(f"[Textbooks] 尝试教材接口失败 {url}: {exc}")

    return {"textbooks": [], "unavailableReason": extract_textbook_unavailable_reason(index_html)}


def parse_json_response(response):
    try:
        return response.json()
    except ValueError:
        return None


def get_grid_rows(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        return data.get("rows") or data.get("items") or data.get("list") or data.get("data") or []
    return []


def parse_textbook_course_rows(data):
    return [
        course
        for course in (normalize_textbook_course_row(row) for row in get_grid_rows(data))
        if course.get("xkkh") and course.get("courseName")
    ]


def normalize_textbook_course_row(row):
    source = row.get("cell") if isinstance(row, dict) and isinstance(row.get("cell"), list) else row
    if isinstance(source, list):
        return {
            "xkkh": clean_html_text(source[0] if len(source) > 0 else (row.get("id") if isinstance(row, dict) else "")),
            "reserved": clean_html_text(source[1] if len(source) > 1 else ""),
            "teacher": clean_html_text(source[2] if len(source) > 2 else ""),
            "courseName": clean_html_text(source[3] if len(source) > 3 else ""),
            "term": clean_html_text(source[4] if len(source) > 4 else ""),
            "classTime": clean_html_text(source[5] if len(source) > 5 else ""),
            "location": clean_html_text(source[6] if len(source) > 6 else ""),
            "orderTime": clean_html_text(source[7] if len(source) > 7 else ""),
        }

    def pick(*keys):
        for key in keys:
            value = source.get(key) if isinstance(source, dict) else None
            cleaned = clean_html_text(value)
            if cleaned:
                return cleaned
        return ""

    return {
        "xkkh": pick("xkkh", "id"),
        "reserved": pick("jcyd"),
        "teacher": pick("jsxm", "xm", "teacher", "rkjs"),
        "courseName": pick("kcmc", "courseName"),
        "term": pick("xxq", "xqmmc"),
        "classTime": pick("sksj"),
        "location": pick("skdd"),
        "orderTime": pick("jcydsj", "ydsj"),
    }


def course_to_unavailable_textbook(course):
    return {
        "courseName": course["courseName"],
        "teacher": course.get("teacher") or "暂无",
        "bookName": "教材详情暂未填写",
        "author": "暂无",
        "press": "暂无",
        "version": "暂无",
        "status": "已预订" if course.get("reserved") == "1" else "未预订",
        "orderTime": course.get("orderTime") or "",
        "xkkh": course.get("xkkh"),
    }


def has_concrete_textbook_name(item):
    name = clean_html_text(item.get("bookName") if isinstance(item, dict) else "")
    return bool(name and name not in {"无教材", "暂无教材详情", "教材详情暂未填写"})


def fetch_textbook_details(session, username, courses):
    detail_url = with_menu_params(f"{JW_BASE}/xsxjc/xsxjc_cxJcxx.html", username)
    textbooks = []
    for course in courses[:120]:
        try:
            response = session.post(
                detail_url,
                data={"xkkh": course["xkkh"]},
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Referer": f"{JW_BASE}/xsxjc/xsxjc_cxXsxjcIndex.html?gnmkdm=N253535&layout=default&su={username}",
                    "X-Requested-With": "XMLHttpRequest",
                },
                timeout=20,
            )
            if os.getenv("DEBUG_CRAWLER") == "1" and not textbooks:
                write_crawler_debug_file("raw_textbook_detail.html", response.text or "")
            textbooks.extend(parse_textbook_detail_html(response.text or "", course))
        except Exception as exc:
            print(f"[Textbooks] 教材详情读取失败 {course.get('courseName')}: {exc}")
    return [item for item in textbooks if item.get("courseName") and item.get("bookName")]


def parse_textbook_detail_html(html_text, course):
    table_rows = parse_textbook_detail_table(html_text, course)
    if table_rows:
        return table_rows

    extracted = extract_textbook_from_text(clean_html_text(html_text))
    if not extracted.get("bookName") or extracted.get("bookName") == "无教材":
        return []
    return [
        {
            "courseName": course["courseName"],
            "teacher": course.get("teacher") or extracted.get("teacher") or "暂无",
            "bookName": extracted.get("bookName"),
            "author": extracted.get("author") or "暂无",
            "press": extracted.get("press") or "暂无",
            "version": extracted.get("version") or "暂无",
            "status": "已预订" if course.get("reserved") == "1" else "未预订",
            "orderTime": course.get("orderTime") or extracted.get("orderTime") or "",
            "isbn": extracted.get("isbn") or "",
            "price": extracted.get("price") or "",
            "xkkh": course.get("xkkh"),
        }
    ]


def parse_textbook_detail_table(html_text, course):
    rows = []
    for row_html in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html_text, re.I):
        cells = [clean_html_text(cell) for cell in re.findall(r"<t[dh][^>]*>([\s\S]*?)</t[dh]>", row_html, re.I)]
        joined = " ".join(cells)
        if not joined or re.search(r"教材名称|作者|出版社|版本", joined):
            continue
        if len(cells) < 2:
            continue

        extracted = extract_textbook_from_text(joined, cells)
        book_name = extracted.get("bookName") or next(
            (cell for cell in cells if cell and course.get("courseName", "") not in cell and course.get("teacher", "") not in cell),
            "",
        )
        if not book_name or "暂无" in book_name or "无教材" in book_name:
            continue

        rows.append(
            {
                "courseName": course["courseName"],
                "teacher": course.get("teacher") or extracted.get("teacher") or "暂无",
                "bookName": book_name,
                "author": extracted.get("author") or (cells[1] if len(cells) > 1 else "暂无"),
                "press": extracted.get("press") or (cells[2] if len(cells) > 2 else "暂无"),
                "version": extracted.get("version") or (cells[3] if len(cells) > 3 else "暂无"),
                "status": "已预订" if course.get("reserved") == "1" else "未预订",
                "orderTime": course.get("orderTime") or extracted.get("orderTime") or "",
                "isbn": extracted.get("isbn") or "",
                "price": extracted.get("price") or "",
                "xkkh": course.get("xkkh"),
            }
        )
    return rows


def parse_textbooks_json(data):
    return [
        item
        for item in (normalize_textbook_row(row) for row in get_grid_rows(data))
        if item and item.get("courseName") and item.get("bookName")
    ]


def normalize_textbook_row(row):
    source = row.get("cell") if isinstance(row, dict) and isinstance(row.get("cell"), list) else row
    if isinstance(source, list):
        return extract_textbook_from_text(" ".join(clean_html_text(item) for item in source), source)
    if not isinstance(source, dict):
        return None

    def pick(*keys):
        for key in keys:
            cleaned = clean_html_text(source.get(key))
            if cleaned:
                return cleaned
        return ""

    extracted = extract_textbook_from_text(" ".join(clean_html_text(value) for value in source.values()))
    book_name = pick("jcmc", "jcmcText", "jcmcstr", "jcxx", "textbookName", "bookName") or extracted.get("bookName")
    course_name = pick("kcmc", "kch", "courseName", "kcmcText") or extracted.get("courseName")
    if not book_name and not course_name:
        return None

    return {
        "courseName": course_name,
        "teacher": pick("jsxm", "xm", "teacher", "rkjs") or extracted.get("teacher"),
        "bookName": book_name or "无教材",
        "author": pick("zz", "author", "jczz") or extracted.get("author") or "暂无",
        "press": pick("cbs", "press", "publisher") or extracted.get("press") or "暂无",
        "version": pick("bb", "bc", "version") or extracted.get("version") or "1",
        "status": pick("zt", "sfyd", "ydzt", "status") or extracted.get("status") or "未预订",
        "orderTime": pick("ydsj", "orderTime") or extracted.get("orderTime") or "",
        "isbn": pick("isbn", "ISBN") or extracted.get("isbn") or "",
        "price": pick("dj", "jcdj", "price") or extracted.get("price") or "",
    }


def labeled_value(cleaned, labels):
    label_group = "|".join(re.escape(label) for label in labels)
    stop_labels = (
        "教材名称|课程名称|课程|教师|任课教师|作者|出版社|版本|ISBN|isbn|定价|价格|状态|预订|预订状态|预订时间|时间"
    )
    match = re.search(rf"(?:{label_group})[:：]\s*(.*?)(?=\s*(?:{stop_labels})[:：]|$)", cleaned, re.I)
    return match.group(1).strip() if match else ""


def extract_textbook_from_text(text, cells=None):
    cells = cells or []
    cleaned = clean_html_text(text)
    cell = lambda index: clean_html_text(cells[index]) if len(cells) > index else ""
    return {
        "courseName": labeled_value(cleaned, ["课程名称", "课程"]) or cell(1),
        "teacher": labeled_value(cleaned, ["任课教师", "教师"]) or cell(0),
        "bookName": labeled_value(cleaned, ["教材名称", "教材", "书名"]) or cell(3),
        "author": labeled_value(cleaned, ["作者"]),
        "press": labeled_value(cleaned, ["出版社"]),
        "version": labeled_value(cleaned, ["版本", "版次"]),
        "status": labeled_value(cleaned, ["状态", "预订状态"]),
        "orderTime": labeled_value(cleaned, ["预订时间", "时间"]),
        "isbn": labeled_value(cleaned, ["ISBN", "isbn"]),
        "price": labeled_value(cleaned, ["定价", "价格"]),
    }


def parse_textbooks_html(html_text):
    textbooks = []
    for tr_content in re.findall(r"<tr[^>]*>([\s\S]*?)</tr>", html_text, re.I):
        tds = re.findall(r"<td[^>]*>([\s\S]*?)</td>", tr_content, re.I)
        if len(tds) < 4:
            continue

        details_index = next(
            (index for index, item in enumerate(tds) if "教材名称：" in item or "教材名称:" in item),
            -1,
        )
        if details_index == -1:
            continue

        text = clean_html_text(tds[details_index])
        course_name = clean_html_text(tds[details_index - 2] if details_index >= 2 else tds[1])
        teacher = clean_html_text(tds[details_index - 3] if details_index >= 3 else tds[0])
        order_time = clean_html_text(tds[details_index - 1] if details_index >= 1 else tds[2])
        status = clean_html_text(tds[details_index + 1] if len(tds) > details_index + 1 else "未预订")

        if not course_name or "课程" in course_name or "教师" in course_name:
            continue

        extracted = extract_textbook_from_text(text)
        textbooks.append(
            {
                "courseName": course_name,
                "teacher": teacher,
                "bookName": extracted.get("bookName") or "无教材",
                "author": extracted.get("author") or "暂无",
                "press": extracted.get("press") or "暂无",
                "version": extracted.get("version") or "1",
                "status": status,
                "orderTime": order_time,
            }
        )
    return textbooks
