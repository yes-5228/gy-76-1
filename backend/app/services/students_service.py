from datetime import date

from .validation import require_fields
from ..config import RENEWAL_THRESHOLD
from ..storage import mutate, new_id, read_data


def list_students():
    return read_data()["students"]


def create_student(payload):
    require_fields(payload, ["name", "guardian", "phone", "course"])
    remaining_hours = int(payload.get("remaining_hours", 0))
    student = {
        "id": new_id("stu"),
        "name": payload["name"].strip(),
        "guardian": payload["guardian"].strip(),
        "phone": payload["phone"].strip(),
        "course": payload["course"].strip(),
        "remaining_hours": max(0, remaining_hours),
        "status": payload.get("status", "active"),
    }

    def add(data):
        data["students"].append(student)
        return data

    mutate(add)
    return student


def renew_student(payload):
    require_fields(payload, ["student_id", "hours", "amount"])
    hours = float(payload["hours"])
    amount = float(payload["amount"])
    if hours <= 0:
        raise ValueError("课时必须大于 0")
    if amount < 0:
        raise ValueError("缴费金额不能为负")
    if amount == 0:
        raise ValueError("金额不能为零")

    renewal_record = {
        "id": new_id("ren"),
        "student_id": payload["student_id"],
        "hours": hours,
        "amount": amount,
        "note": payload.get("note", "").strip(),
        "renewed_at": payload.get("renewed_at") or date.today().isoformat(),
    }

    def add_renewal(data):
        student = next((item for item in data["students"] if item["id"] == payload["student_id"]), None)
        if not student:
            raise ValueError("学员不存在")

        student["remaining_hours"] = round(student["remaining_hours"] + hours, 2)
        if "renewals" not in data:
            data["renewals"] = []
        data["renewals"].append(renewal_record)
        return data

    mutate(add_renewal)
    return renewal_record


def list_renewals():
    data = read_data()
    renewals = data.get("renewals", [])
    students = {student["id"]: student for student in data["students"]}
    return [
        {
            **record,
            "student_name": students.get(record["student_id"], {}).get("name", "未知学员"),
        }
        for record in sorted(renewals, key=lambda item: item["renewed_at"], reverse=True)
    ]


def get_renewal_reminders():
    students = read_data()["students"]
    return [
        {
            **student,
            "reason": "课时不足",
            "threshold": RENEWAL_THRESHOLD,
        }
        for student in students
        if student["status"] == "active" and student["remaining_hours"] <= RENEWAL_THRESHOLD
    ]
