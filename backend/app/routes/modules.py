from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Course, Module
from ..utils.auth import login_required, role_required


modules_bp = Blueprint("modules", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def build_module_response(module: Module):
    return {
        "id": module.id,
        "course_id": module.course_id,
        "title": module.title,
        "description": module.description,
        "created_at": module.created_at.isoformat(),
    }


@modules_bp.post("/courses/<int:course_id>/modules")
@role_required("Moderator", "Admin")
def create_module(course_id: int):
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

    module = Module(course_id=course.id, title=title, description=description)
    db.session.add(module)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Module created successfully.",
                "module": build_module_response(module),
            }
        ),
        201,
    )


@modules_bp.get("/courses/<int:course_id>/modules")
@login_required
def list_modules_for_course(course_id: int):
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

    modules = Module.query.filter_by(course_id=course.id).order_by(Module.id).all()
    return (
        jsonify(
            {
                "status": "success",
                "course_id": course.id,
                "modules": [build_module_response(module) for module in modules],
            }
        ),
        200,
    )


@modules_bp.get("/modules/<int:module_id>")
@login_required
def get_module(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Module not found.",
                }
            ),
            404,
        )

    return (
        jsonify(
            {
                "status": "success",
                "module": build_module_response(module),
            }
        ),
        200,
    )


@modules_bp.put("/modules/<int:module_id>")
@role_required("Moderator", "Admin")
def update_module(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Module not found.",
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

    module.title = title
    module.description = description
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Module updated successfully.",
                "module": build_module_response(module),
            }
        ),
        200,
    )


@modules_bp.delete("/modules/<int:module_id>")
@role_required("Admin")
def delete_module(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Module not found.",
                }
            ),
            404,
        )

    db.session.delete(module)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Module deleted successfully.",
            }
        ),
        200,
    )
