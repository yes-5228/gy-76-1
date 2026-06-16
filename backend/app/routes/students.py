from flask import Blueprint, jsonify, request

from ..services.students_service import create_student, list_students, renew_student, list_renewals

students_bp = Blueprint("students", __name__)


@students_bp.get("")
def index():
    return jsonify(list_students())


@students_bp.post("")
def create():
    try:
        student = create_student(request.get_json(silent=True) or {})
        return jsonify(student), 201
    except ValueError as error:
        return jsonify({"message": str(error)}), 400


@students_bp.post("/renew")
def renew():
    try:
        record = renew_student(request.get_json(silent=True) or {})
        return jsonify(record), 201
    except ValueError as error:
        return jsonify({"message": str(error)}), 400


@students_bp.get("/renewals")
def renewals():
    return jsonify(list_renewals())
