import re
from datetime import datetime
from html import unescape
from auth_service import encrypt_cas_password, extract_execution, new_session
from config import REQUEST_HEADERS

CAS_LOGIN_FOR_JW = "https://zjuam.zju.edu.cn/cas/login?service=https%3A%2F%2Fzdbk.zju.edu.cn%2Fjwglxt%2Fxtgl%2Flogin_ssologin.html"
JW_BASE = "https://zdbk.zju.edu.cn/jwglxt"

def clean_html_text(value):
    if value is None: return ""
    text = re.sub(r"<br\s*/?>", " ", str(value), flags=re.I)
    text = re.sub(r"<[^>]+>", "", text)
    return unescape(text).strip()

def get_authenticated_session(username, password):
    session = new_session()
    session.headers.update(REQUEST_HEADERS)
    
    login_page = session.get(CAS_LOGIN_FOR_JW, timeout=15)
    execution = extract_execution(login_page.text)
    
    pub_key = session.get("https://zjuam.zju.edu.cn/cas/v2/getPubKey", timeout=15).json()
    encrypted_password = encrypt_cas_password(password, pub_key["modulus"], pub_key["exponent"])
    
    form_data = {
        "username": username, "password": encrypted_password, "execution": execution,
        "_eventId": "submit", "authcode": "", "rememberMe": "true"
    }
    
    login_res = session.post(CAS_LOGIN_FOR_JW, data=form_data, headers={"Content-Type": "application/x-www-form-urlencoded", "Referer": CAS_LOGIN_FOR_JW}, timeout=15)
    if "统一身份认证" in login_res.text and "用户名" in login_res.text:
        raise RuntimeError("学号或密码匹配失败")
    
    session.get(f"{JW_BASE}/xtgl/index_initMenu.html", timeout=15)
    return session

def fetch_schedule(username, password):
    session = get_authenticated_session(username, password)
    now = datetime.now()
    year_start = now.year if now.month >= 9 else now.year - 1
    academic_year = f"{year_start}-{year_start + 1}"
    
    schedule_url = f"{JW_BASE}/kbcx/xskbcx_cxXsKb.html?gnmkdm=N253508&su={username}"
    res = session.post(schedule_url, data={"xnm": academic_year, "xqm": ""}, headers={"Content-Type": "application/x-www-form-urlencoded", "Referer": f"{JW_BASE}/kbcx/xskbcx_cxXskbcxIndex.html"}, timeout=15)
    
    raw_data = res.json()
    kb_list = raw_data.get("kbList") or raw_data.get("kblist") or []
    
    courses = []
    for index, item in enumerate(kb_list):
        kcb = item.get("kcb") or ""
        parts = [clean_html_text(p) for p in re.split(r"<br\s*/?>", kcb, flags=re.I) if clean_html_text(p)]
        name = item.get("kcmc") or (parts[0] if len(parts) > 0 else "未知课程")
        week_text = item.get("zcd") or item.get("qsjsz") or (parts[1] if len(parts) > 1 else "")
        teacher = item.get("xm") or (parts[2] if len(parts) > 2 else "未知教师")
        location = item.get("cdmc") or item.get("jxdd") or (parts[3] if len(parts) > 3 else "未知地点")
        
        try:
            day = int(str(item.get("xqj")).strip())
        except:
            day = 1
        try:
            start_period = int(str(item.get("djj")).strip())
        except:
            start_period = int(str(item.get("jcs") or item.get("jc") or "1").split("-")[0], 1)
        try:
            duration = int(str(item.get("skcd")).strip())
        except:
            duration = 2
            
        xxq_mc = item.get("xxqmc") or item.get("xxq") or ""
        t_val = "大二春夏学期" if ("春" in xxq_mc or "夏" in xxq_mc) else "大二秋冬学期" if ("秋" in xxq_mc or "冬" in xxq_mc) else "大二春夏学期"

        courses.append({
            "id": f"real_c{index + 1}", "name": name, "teacher": teacher, "location": location,
            "day": day, "period": start_period, "duration": duration, "weekText": week_text,
            "type": "专业选修" if "选修" in (item.get("kcxzmc") or "") else "公共必修" if "通识" in (item.get("kcxzmc") or "") else "专业必修",
            "term": t_val, "xxq": xxq_mc, "bookIds": []
        })
        
    return {"courses": courses, "raw": raw_data, "username": username}
