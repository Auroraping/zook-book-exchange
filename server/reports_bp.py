from flask import Blueprint, jsonify, request
from json_store import find_by_id, mutate_json, new_id, now_text, read_json

reports_bp = Blueprint("reports_bp", __name__)

def request_payload():
    return request.get_json(silent=True) or {}

@reports_bp.post("/api/books/<book_id>/report")
def report_book(book_id):
    book = find_by_id(read_json("books.json", []), book_id)
    if not book:
        return jsonify({"success": False, "message": "书籍不存在"}), 404
    payload = request_payload()

    def add_report(reports):
        report = {
            "id": new_id("r"),
            "bookId": book_id,
            "reason": str(payload.get("reason") or "用户举报").strip(),
            "status": "pending",
            "userId": payload.get("userId") or "me",
            "timestamp": now_text(),
        }
        reports.insert(0, report)
        return report

    report = mutate_json("reports.json", add_report, [])
    return jsonify({"success": True, "report": report})

@reports_bp.get("/api/reports")
def list_reports():
    return jsonify({"success": True, "reports": read_json("reports.json", [])})

@reports_bp.patch("/api/reports/<report_id>")
def update_report(report_id):
    payload = request_payload()
    status = payload.get("status") or "resolved"

    def update(reports):
        report = find_by_id(reports, report_id)
        if not report:
            return None
        report["status"] = status
        report["handledAt"] = now_text()
        return report

    report = mutate_json("reports.json", update, [])
    if not report:
        return jsonify({"success": False, "message": "举报不存在"}), 404
    return jsonify({"success": True, "report": report})
