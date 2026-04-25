from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Module, ProgressRecord, Resource, SavedResource
from ..utils.auth import role_required


admin_resources_bp = Blueprint("admin_resources", __name__)


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


def build_admin_resource_response(resource: Resource):
    return {
        "id": resource.id,
        "module_id": resource.module_id,
        "title": resource.title,
        "resource_type": resource.resource_type,
        "content_url": resource.content_url,
        "content_text": resource.content_text,
        "created_at": resource.created_at.isoformat(),
    }


def get_module_or_404(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return None, (
            jsonify({"status": "error", "message": "Module not found."}),
            404,
        )

    return module, None


def get_resource_or_404(resource_id: int):
    resource = db.session.get(Resource, resource_id)
    if resource is None:
        return None, (
            jsonify({"status": "error", "message": "Resource not found."}),
            404,
        )

    return resource, None


def validate_resource_payload(data):
    module_id, module_id_error = parse_positive_int(data.get("module_id"), "module_id")
    if module_id_error:
        return None, module_id_error

    module, module_error = get_module_or_404(module_id)
    if module_error is not None:
        return None, module_error

    title = normalize_text(data.get("title"))
    resource_type = normalize_text(data.get("resource_type")).lower()
    content_url = data.get("content_url")
    content_text = data.get("content_text")

    if isinstance(content_url, str):
        content_url = content_url.strip()
    if isinstance(content_text, str):
        content_text = content_text.strip()

    if not title or not resource_type:
        return None, "Title and resource_type are required."

    return {
        "module": module,
        "title": title,
        "resource_type": resource_type,
        "content_url": content_url or None,
        "content_text": content_text or None,
    }, None


@admin_resources_bp.get("/modules/<int:module_id>/resources")
@role_required("Admin")
def list_admin_resources_for_module(module_id: int):
    module, error_response = get_module_or_404(module_id)
    if error_response is not None:
        return error_response

    resources = Resource.query.filter_by(module_id=module.id).order_by(Resource.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "module_id": module.id,
                "resources": [
                    build_admin_resource_response(resource) for resource in resources
                ],
            }
        ),
        200,
    )


@admin_resources_bp.get("/resources/<int:resource_id>")
@role_required("Admin")
def get_admin_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    return (
        jsonify(
            {"status": "success", "resource": build_admin_resource_response(resource)}
        ),
        200,
    )


@admin_resources_bp.post("/resources")
@role_required("Admin")
def create_admin_resource():
    data = get_request_data()
    validated_data, validation_error = validate_resource_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    resource = Resource(
        module_id=validated_data["module"].id,
        title=validated_data["title"],
        resource_type=validated_data["resource_type"],
        content_url=validated_data["content_url"],
        content_text=validated_data["content_text"],
    )
    db.session.add(resource)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource created successfully.",
                "resource": build_admin_resource_response(resource),
            }
        ),
        201,
    )


@admin_resources_bp.put("/resources/<int:resource_id>")
@role_required("Admin")
def update_admin_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    validated_data, validation_error = validate_resource_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    resource.module_id = validated_data["module"].id
    resource.title = validated_data["title"]
    resource.resource_type = validated_data["resource_type"]
    resource.content_url = validated_data["content_url"]
    resource.content_text = validated_data["content_text"]
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource updated successfully.",
                "resource": build_admin_resource_response(resource),
            }
        ),
        200,
    )


@admin_resources_bp.delete("/resources/<int:resource_id>")
@role_required("Admin")
def delete_admin_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    has_progress_records = (
        ProgressRecord.query.filter_by(resource_id=resource.id).first() is not None
    )
    has_saved_resources = (
        SavedResource.query.filter_by(resource_id=resource.id).first() is not None
    )

    if has_progress_records or has_saved_resources:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Resource cannot be deleted because related records exist.",
                }
            ),
            400,
        )

    db.session.delete(resource)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Resource deleted successfully."}),
        200,
    )
