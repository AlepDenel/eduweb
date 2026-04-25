from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Course
from ..utils.auth import login_required, role_required


courses_bp = Blueprint("courses", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def build_course_response(course: Course):
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "created_at": course.created_at.isoformat(),
    }


@courses_bp.post("/courses")
@role_required("Moderator", "Admin")
def create_course():
    data = get_request_data()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()

    if not title or not description:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Title and description are required.",
                }
            ),
            400,
        )

    course = Course(title=title, description=description)
    db.session.add(course)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Course created successfully.",
                "course": build_course_response(course),
            }
        ),
        201,
    )


@courses_bp.get("/courses")
@login_required
def list_courses():
    courses = Course.query.order_by(Course.id).all()
    return (
        jsonify(
            {
                "status": "success",
                "courses": [build_course_response(course) for course in courses],
            }
        ),
        200,
    )


@courses_bp.get("/courses/<int:course_id>")
@login_required
def get_course(course_id: int):
    course = db.session.get(Course, course_id)
    if course is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Course not found.",
                }
            ),
            404,
        )

    return (
        jsonify(
            {
                "status": "success",
                "course": build_course_response(course),
            }
        ),
        200,
    )


@courses_bp.put("/courses/<int:course_id>")
@role_required("Moderator", "Admin")
def update_course(course_id: int):
    course = db.session.get(Course, course_id)
    if course is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Course not found.",
                }
            ),
            404,
        )

    data = get_request_data()
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()

    if not title or not description:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Title and description are required.",
                }
            ),
            400,
        )

    course.title = title
    course.description = description
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Course updated successfully.",
                "course": build_course_response(course),
            }
        ),
        200,
    )


@courses_bp.delete("/courses/<int:course_id>")
@role_required("Admin")
def delete_course(course_id: int):
    course = db.session.get(Course, course_id)
    if course is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Course not found.",
                }
            ),
            404,
        )

    db.session.delete(course)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Course deleted successfully.",
            }
        ),
        200,
    )
