from datetime import date

from ..config import RENEWAL_THRESHOLD
from ..storage import read_data
from .payroll_service import calculate_payroll


def dashboard_summary():
    data = read_data()
    current_month = date.today().strftime("%Y-%m")
    month_attendance = [item for item in data["attendance"] if item["checked_at"].startswith(current_month)]
    renewals = data.get("renewals", [])
    month_renewals = [item for item in renewals if item["renewed_at"].startswith(current_month)]
    payroll = calculate_payroll(current_month)

    students = {student["id"]: student for student in data["students"]}
    recent_attendance = sorted(data["attendance"], key=lambda item: item["checked_at"], reverse=True)[:5]
    recent_attendance_with_names = [
        {
            **record,
            "student_name": students.get(record["student_id"], {}).get("name", "未知学员"),
            "teacher_name": next(
                (t["name"] for t in data["teachers"] if t["id"] == record["teacher_id"]),
                "未知教师",
            ),
        }
        for record in recent_attendance
    ]

    recent_renewals = sorted(renewals, key=lambda item: item["renewed_at"], reverse=True)[:5]
    recent_renewals_with_names = [
        {
            **record,
            "student_name": students.get(record["student_id"], {}).get("name", "未知学员"),
        }
        for record in recent_renewals
    ]

    return {
        "total_students": len(data["students"]),
        "active_students": len([item for item in data["students"] if item["status"] == "active"]),
        "renewal_count": len(
            [
                item
                for item in data["students"]
                if item["status"] == "active" and item["remaining_hours"] <= RENEWAL_THRESHOLD
            ]
        ),
        "month_consumed_hours": round(sum(float(item["hours"]) for item in month_attendance), 2),
        "month_payroll_amount": round(sum(float(item["amount"]) for item in payroll), 2),
        "month_renewal_amount": round(sum(float(item["amount"]) for item in month_renewals), 2),
        "month_renewal_hours": round(sum(float(item["hours"]) for item in month_renewals), 2),
        "recent_attendance": recent_attendance_with_names,
        "recent_renewals": recent_renewals_with_names,
    }
