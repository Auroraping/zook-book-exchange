import os
import threading
import uuid
from copy import deepcopy
from datetime import datetime
from pathlib import Path

# 导入 SQLite 数据库管理器
from db_manager import db_read_table, db_write_table, init_db

# 当 json_store 模块加载时，自动调用并初始化数据库
init_db()

STORE_LOCK = threading.Lock()

# 缺省空值定义，用于在数据库记录缺失时提供合理的安全降级
DEFAULTS = {
    "carts.json": [],
    "favorites.json": [],
    "reviews.json": [],
    "chat.json": {},
    "favorites.json": [],
}

def now_text():
    """获取格式化时间戳字符串"""
    return datetime.now().strftime("%Y-%m-%d %H:%M")

def new_id(prefix):
    """生成具有时间排序性的高唯一性 ID"""
    return f"{prefix}{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4]}"

def read_json(file_name, fallback=None):
    """
    读取指定文件的接口。现已重构为从 SQLite 数据库中读取。
    为了与原有 Flask 逻辑完美对接，接口参数、返回格式及 deepcopy 特性保持一致。
    """
    table_name = file_name.split(".")[0]
    is_singular = file_name in {"chat.json", "ui.json"}
    
    # 获取默认降级空数据
    default_fallback = DEFAULTS.get(file_name, fallback if fallback is not None else ([] if not is_singular else {}))
    
    # 从 SQLite 中读取记录并反序列化为 Python 对象
    data = db_read_table(table_name, is_singular=is_singular, fallback=default_fallback)
    return deepcopy(data)

def write_json(file_name, data):
    """
    写入/覆写指定文件的接口。现已重构为直接持久化到 SQLite 数据库。
    """
    table_name = file_name.split(".")[0]
    is_singular = file_name in {"chat.json", "ui.json"}
    
    # 覆盖式写入数据库
    db_write_table(table_name, data, is_singular=is_singular)
    return data

def mutate_json(file_name, callback, fallback=None):
    """
    在线程锁和事务的保护下，读取、执行回调变更、并写回数据库。
    """
    with STORE_LOCK:
        data = read_json(file_name, fallback)
        result = callback(data)
        write_json(file_name, data)
        return result

def find_by_id(items, item_id):
    """辅助查询工具：根据 id 从项列表中查找对应项"""
    return next((item for item in items if str(item.get("id")) == str(item_id)), None)
