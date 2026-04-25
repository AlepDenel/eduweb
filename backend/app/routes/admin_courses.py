from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Course, Module
from ..utils.auth import role_required


admin_courses_bp = Blueprint("admin_courses", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_text(value):
    if not isinstance(value, str):
        return ""

    return value.strip()


def build_admin_course_response(course: Course):
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "created_at": course.created_at.isoformat(),
        "module_count": len(course.modules),
    }


def get_course_or_404(course_id: int):
    course = db.session.get(Course, course_id)
    if course is None:
        return None, (
            jsonify({"status": "error", "message": "Course not found."}),
            404,
        )

    return course, None


def validate_course_payload(data):
    title = normalize_text(data.get("title"))
    description = normalize_text(data.get("description"))

    if not title or not description:
        return None, "Title and description are required."

    return {"title": title, "description": description}, None


@admin_courses_bp.get("/courses")
@role_required("Admin")
def list_admin_courses():
    courses = Course.query.order_by(Course.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "courses": [build_admin_course_response(course) for course in courses],
            }
        ),
        200,
    )


@admin_courses_bp.get("/courses/<int:course_id>")
@role_required("Admin")
def get_admin_course(course_id: int):
    course, error_response = get_course_or_404(course_id)
    if error_response is not None:
        return error_response

    return (
        jsonify({"status": "success", "course": build_admin_course_response(course)}),
        200,
    )


@admin_courses_bp.post("/courses")
@role_required("Admin")
def create_admin_course():
    data = get_request_data()
    validated_data, validation_error = validate_course_payload(data)
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    course = Course(
        title=validated_data["title"],
        description=validated_data["description"],
    )
    db.session.add(course)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Course created successfully.",
                "course": build_admin_course_response(course),
            }
        ),
        201,
    )


@admin_courses_bp.put("/courses/<int:course_id>")
@role_required("Admin")
def update_admin_course(course_id: int):
    course, error_response = get_course_or_404(course_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    validated_data, validation_error = validate_course_payload(data)
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    course.title = validated_data["title"]
    course.description = validated_data["description"]
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Course updated successfully.",
                "course": build_admin_course_response(course),
            }
        ),
        200,
    )


@admin_courses_bp.delete("/courses/<int:course_id>")
@role_required("Admin")
def delete_admin_course(course_id: int):
    course, error_response = get_course_or_404(course_id)
    if error_response is not None:
        return error_response

    has_modules = Module.query.filter_by(course_id=course.id).first() is not None
    if has_modules:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Course cannot be deleted because related modules exist.",
                }
            ),
            400,
        )

    db.session.delete(course)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Course deleted successfully."}),
        200,
    )
