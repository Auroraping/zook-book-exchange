import json
import re
import os
import random
import uuid
from datetime import datetime

# 设置环境变量，使用真实的 zook.db
os.environ["ZOOK_DATA_DIR"] = os.path.join(os.path.dirname(__file__), "..", "client", "public", "data")

from json_store import read_json, write_json

def clean_data():
    source_path = os.path.join(os.path.dirname(__file__), "cc98_board68_v9(1).json")
    if not os.path.exists(source_path):
        source_path = os.path.join(os.path.dirname(__file__), "..", "cc98_board68_v9(1).json")
    
    if not os.path.exists(source_path):
        print("未找到源 CC98 JSON 数据文件")
        return
        
    with open(source_path, "r", encoding="utf-8") as f:
        cc98_data = json.load(f)
        
    print(f"成功读取源数据：共 {len(cc98_data)} 条记录")
    
    keywords = ["资源", "学习", "笔记", "真题", "大物", "物理", "高数", "微积分", "线代", "方程", "数理", "概率", "毛概", "思政", "小测", "复习", "卷"]
    
    filtered = []
    for item in cc98_data:
        title = item.get("title", "")
        content_text = item.get("contentText", "").strip()
        
        has_kw = any(kw in title for kw in keywords) or any(kw in content_text for kw in keywords)
        has_substance = len(content_text) > 15 or len(item.get("links", [])) > 0 or len(item.get("images", [])) > 0
        
        if has_kw and has_substance:
            filtered.append(item)
            
    print(f"初筛得到符合要求的记录：{len(filtered)} 条")
    
    # 限制 45 条优质数据注入，以确保极速响应与精品内容
    selected = filtered[:45]
    
    imported_notes = []
    
    for idx, item in enumerate(selected):
        title = item.get("title", "")
        clean_title = re.sub(r"（tag\..*?）", "", title)
        clean_title = re.sub(r"\(tag\..*?\)", "", clean_title).strip()
        
        content_text = item.get("contentText", "").strip()
        desc = content_text[:120] + ("..." if len(content_text) > 120 else "")
        if not desc:
            desc = "课友分享的备考复习优质学术资源，点击详情页直接下载原件大纲。"
            
        course = "全部课程"
        title_lower = title.lower()
        if "大物" in title_lower or "物理" in title_lower:
            course = "大学物理"
        elif "高数" in title_lower or "微积分" in title_lower or "极限" in title_lower or "中值" in title_lower:
            course = "微积分"
        elif "线代" in title_lower or "矩阵" in title_lower or "线性代数" in title_lower:
            course = "线性代数"
        elif "概率" in title_lower or "数理" in title_lower:
            course = "概率论与数理统计"
        elif "毛概" in title_lower or "思政" in title_lower or "毛泽东" in title_lower:
            course = "毛概"
        elif "微观" in title_lower:
            course = "微观经济学"
        elif "宏观" in title_lower:
            course = "宏观经济学"
            
        note_type = "共享资料"
        if "小测" in title_lower or "测" in title_lower or "卷" in title_lower or "真题" in title_lower:
            note_type = "模拟试卷"
        elif "笔记" in title_lower or "核心" in title_lower:
            note_type = "课程笔记"
        elif "大纲" in title_lower or "框架" in title_lower or "梳理" in title_lower:
            note_type = "复习提纲"
            
        tags = []
        if "资源" in title:
            tags.append("优质资源")
        if "小测" in title:
            tags.append("测验真题")
        if "补天" in title or "冲刺" in title:
            tags.append("考前补天")
        if course != "全部课程":
            tags.append(course)
            
        brackets_match = re.search(r"[（(]tag\.(.*?)[）)]", title)
        if brackets_match:
            extracted_tags = [t.strip() for t in brackets_match.group(1).replace("，", ",").split(",") if t.strip()]
            for et in extracted_tags:
                if et not in tags:
                    tags.append(et)
        if not tags:
            tags = ["学术交流"]
            
        sections = []
        sections.append({
            "heading": "楼主分享概述",
            "body": content_text if content_text else "该资源无帖子正文描述，请直接点击下方下载按钮获取真实的物理附件资料。"
        })
        
        replies = item.get("replies", [])
        if replies:
            reply_lines = []
            for r in replies[:6]:
                r_user = r.get("userName") or "热心课友"
                r_content = r.get("contentText", "").strip()
                if r_content:
                    reply_lines.append(f"@{r_user} 说: {r_content}")
            if reply_lines:
                sections.append({
                    "heading": "课友有爱互动与讨论",
                    "body": "\n".join(reply_lines)
                })
                
        file_url = None
        file_name = None
        
        links = item.get("links", [])
        images = item.get("images", [])
        
        if links:
            file_url = links[0]
            ext = ".html" if ".html" in file_url else ".md" if ".md" in file_url else ".pdf" if ".pdf" in file_url else ".txt"
            file_name = f"{clean_title[:15]}{ext}"
        elif images:
            file_url = images[0]
            file_name = f"{clean_title[:15]}.webp"
            
        likes = random.randint(30, 260)
        downloads = random.randint(10, likes)
        
        updated_at = "2026-05-26"
        raw_time = item.get("time")
        if raw_time and len(str(raw_time)) > 4:
            updated_at = str(raw_time).split(" ")[0]
            
        note_id = f"cc98-{item.get('id') or uuid.uuid4().hex[:8]}"
        
        note = {
            "id": note_id,
            "title": clean_title,
            "course": course,
            "type": note_type,
            "difficulty": random.choice(["考试核心", "基础夯实", "冲刺提高", "考前速记"]),
            "author": item.get("userName") or "CC98课友",
            "likes": likes,
            "downloads": downloads,
            "updatedAt": updated_at,
            "isPaid": False,
            "tags": tags,
            "desc": desc,
            "sections": sections,
            "fileUrl": file_url,
            "fileName": file_name
        }
        imported_notes.append(note)
        
    print(f"成功转换了 {len(imported_notes)} 条高能真实的 CC98 帖子数据")
    
    existing_notes = read_json("notes.json", [])
    
    existing_ids = {n.get("id") for n in existing_notes}
    new_notes = [n for n in imported_notes if n["id"] not in existing_ids]
    
    if not new_notes:
        print("未检测到新增数据（可能已全部导入过）")
        return
        
    combined = existing_notes + new_notes
    write_json("notes.json", combined)
    print(f"成功导入 {len(new_notes)} 条真实 CC98 帖子！当前数据库中共有 {len(combined)} 条笔记。")

if __name__ == "__main__":
    clean_data()
