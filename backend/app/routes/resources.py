from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Module, Resource
from ..utils.auth import login_required, role_required


resources_bp = Blueprint("resources", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def build_resource_response(resource: Resource):
    return {
        "id": resource.id,
        "module_id": resource.module_id,
        "title": resource.title,
        "resource_type": resource.resource_type,
        "content_url": resource.content_url,
        "content_text": resource.content_text,
        "created_at": resource.created_at.isoformat(),
    }


@resources_bp.post("/modules/<int:module_id>/resources")
@role_required("Moderator", "Admin")
def create_resource(module_id: int):
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
    resource_type = data.get("resource_type", "").strip().lower()
    content_url = data.get("content_url")
    content_text = data.get("content_text")

    if isinstance(content_url, str):
        content_url = content_url.strip()
    if isinstance(content_text, str):
        content_text = content_text.strip()

    if not title or not resource_type:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Title and resource_type are required.",
                }
            ),
            400,
        )

    resource = Resource(
        module_id=module.id,
        title=title,
        resource_type=resource_type,
        content_url=content_url or None,
        content_text=content_text or None,
    )
    db.session.add(resource)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource created successfully.",
                "resource": build_resource_response(resource),
            }
        ),
        201,
    )


@resources_bp.get("/modules/<int:module_id>/resources")
@login_required
def list_resources_for_module(module_id: int):
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

    resources = (
        Resource.query.filter_by(module_id=module.id).order_by(Resource.id).all()
    )
    return (
        jsonify(
            {
                "status": "success",
                "module_id": module.id,
                "resources": [
                    build_resource_response(resource) for resource in resources
                ],
            }
        ),
        200,
    )


@resources_bp.get("/resources/<int:resource_id>")
@login_required
def get_resource(resource_id: int):
    resource = db.session.get(Resource, resource_id)
    if resource is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Resource not found.",
                }
            ),
            404,
        )

    return (
        jsonify(
            {
                "status": "success",
                "resource": build_resource_response(resource),
            }
        ),
        200,
    )


@resources_bp.put("/resources/<int:resource_id>")
@role_required("Moderator", "Admin")
def update_resource(resource_id: int):
    resource = db.session.get(Resource, resource_id)
    if resource is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Resource not found.",
                }
            ),
            404,
        )

    data = get_request_data()
    title = data.get("title", "").strip()
    resource_type = data.get("resource_type", "").strip().lower()
    content_url = data.get("content_url")
    content_text = data.get("content_text")

    if isinstance(content_url, str):
        content_url = content_url.strip()
    if isinstance(content_text, str):
        content_text = content_text.strip()

    if not title or not resource_type:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Title and resource_type are required.",
                }
            ),
            400,
        )

    resource.title = title
    resource.resource_type = resource_type
    resource.content_url = content_url or None
    resource.content_text = content_text or None
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource updated successfully.",
                "resource": build_resource_response(resource),
            }
        ),
        200,
    )


@resources_bp.delete("/resources/<int:resource_id>")
@role_required("Admin")
def delete_resource(resource_id: int):
    resource = db.session.get(Resource, resource_id)
    if resource is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Resource not found.",
                }
            ),
            404,
        )

    db.session.delete(resource)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource deleted successfully.",
            }
        ),
        200,
    )
