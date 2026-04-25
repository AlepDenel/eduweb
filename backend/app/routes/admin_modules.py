from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Course, Module, Quiz, Resource
from ..utils.auth import role_required


admin_modules_bp = Blueprint("admin_modules", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_text(value):
    if not isinstance(value, str):
        return ""

    return value.strip()


def parse_positive_int(value, field_name: str):
    if value in (None, ""):
        return None, f"{field_name} is required."

    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be a whole number."

    if parsed_value <= 0:
        return None, f"{field_name} must be greater than zero."

    return parsed_value, None


def build_admin_module_response(module: Module):
    return {
        "id": module.id,
        "course_id": module.course_id,
        "title": module.title,
        "description": module.description,
        "created_at": module.created_at.isoformat(),
    }


def get_course_or_404(course_id: int):
    course = db.session.get(Course, course_id)
    if course is None:
        return None, (
            jsonify({"status": "error", "message": "Course not found."}),
            404,
        )

    return course, None


def get_module_or_404(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return None, (
            jsonify({"status": "error", "message": "Module not found."}),
            404,
        )

    return module, None


def validate_module_payload(data):
    course_id, course_id_error = parse_positive_int(data.get("course_id"), "course_id")
    if course_id_error:
        return None, course_id_error

    course, course_error = get_course_or_404(course_id)
    if course_error is not None:
        return None, course_error

    title = normalize_text(data.get("title"))
    description = normalize_text(data.get("description"))

    if not title or not description:
        return None, "Title and description are required."

    return {
        "course": course,
        "title": title,
        "description": description,
    }, None


@admin_modules_bp.get("/courses/<int:course_id>/modules")
@role_required("Admin")
def list_admin_modules_for_course(course_id: int):
    course, error_response = get_course_or_404(course_id)
    if error_response is not None:
        return error_response

    modules = Module.query.filter_by(course_id=course.id).order_by(Module.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "course_id": course.id,
                "modules": [build_admin_module_response(module) for module in modules],
            }
        ),
        200,
    )


@admin_modules_bp.get("/modules/<int:module_id>")
@role_required("Admin")
def get_admin_module(module_id: int):
    module, error_response = get_module_or_404(module_id)
    if error_response is not None:
        return error_response

    return (
        jsonify({"status": "success", "module": build_admin_module_response(module)}),
        200,
    )


@admin_modules_bp.post("/modules")
@role_required("Admin")
def create_admin_module():
    data = get_request_data()
    validated_data, validation_error = validate_module_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    module = Module(
        course_id=validated_data["course"].id,
        title=validated_data["title"],
        description=validated_data["description"],
    )
    db.session.add(module)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Module created successfully.",
                "module": build_admin_module_response(module),
            }
        ),
        201,
    )


@admin_modules_bp.put("/modules/<int:module_id>")
@role_required("Admin")
def update_admin_module(module_id: int):
    module, error_response = get_module_or_404(module_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    validated_data, validation_error = validate_module_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    module.course_id = validated_data["course"].id
    module.title = validated_data["title"]
    module.description = validated_data["description"]
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Module updated successfully.",
                "module": build_admin_module_response(module),
            }
        ),
        200,
    )


@admin_modules_bp.delete("/modules/<int:module_id>")
@role_required("Admin")
def delete_admin_module(module_id: int):
    module, error_response = get_module_or_404(module_id)
    if error_response is not None:
        return error_response

    has_resources = Resource.query.filter_by(module_id=module.id).first() is not None
    if has_resources:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Module cannot be deleted because related resources exist.",
                }
            ),
            400,
        )

    has_quizzes = Quiz.query.filter_by(module_id=module.id).first() is not None
    if has_quizzes:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Module cannot be deleted because related quizzes exist.",
                }
            ),
            400,
        )

    db.session.delete(module)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Module deleted successfully."}),
        200,
    )
