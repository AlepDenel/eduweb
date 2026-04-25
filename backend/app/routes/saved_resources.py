from flask import Blueprint, g, jsonify

from ..extensions import db
from ..models import Resource, SavedResource
from ..utils.auth import login_required


saved_resources_bp = Blueprint("saved_resources", __name__)


def build_saved_resource_response(saved_resource: SavedResource):
    resource = saved_resource.resource
    return {
        "id": saved_resource.id,
        "resource_id": resource.id,
        "resource_title": resource.title,
        "resource_type": resource.resource_type,
        "module_id": resource.module_id,
        "created_at": saved_resource.created_at.isoformat(),
    }


def get_resource_or_404(resource_id: int):
    resource = db.session.get(Resource, resource_id)
    if resource is None:
        return None, (
            jsonify({"status": "error", "message": "Resource not found."}),
            404,
        )

    return resource, None


def get_saved_resource_for_user(user_id: int, resource_id: int):
    return SavedResource.query.filter_by(
        user_id=user_id,
        resource_id=resource_id,
    ).first()


@saved_resources_bp.get("/saved-resources/me")
@login_required
def get_my_saved_resources():
    saved_resources = (
        SavedResource.query.filter_by(user_id=g.current_user.id)
        .order_by(SavedResource.id)
        .all()
    )

    return (
        jsonify(
            {
                "status": "success",
                "saved_resources": [
                    build_saved_resource_response(saved_resource)
                    for saved_resource in saved_resources
                ],
            }
        ),
        200,
    )


@saved_resources_bp.get("/resources/<int:resource_id>/saved")
@login_required
def get_saved_status_for_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    saved_resource = get_saved_resource_for_user(g.current_user.id, resource.id)

    return (
        jsonify(
            {
                "status": "success",
                "resource_id": resource.id,
                "saved": saved_resource is not None,
                "saved_resource": (
                    build_saved_resource_response(saved_resource)
                    if saved_resource is not None
                    else None
                ),
            }
        ),
        200,
    )


@saved_resources_bp.post("/resources/<int:resource_id>/save")
@login_required
def save_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    saved_resource = get_saved_resource_for_user(g.current_user.id, resource.id)
    if saved_resource is not None:
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Resource is already saved.",
                    "saved_resource": build_saved_resource_response(saved_resource),
                }
            ),
            200,
        )

    saved_resource = SavedResource(
        user_id=g.current_user.id,
        resource_id=resource.id,
    )
    db.session.add(saved_resource)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource saved successfully.",
                "saved_resource": build_saved_resource_response(saved_resource),
            }
        ),
        201,
    )


@saved_resources_bp.delete("/resources/<int:resource_id>/save")
@login_required
def unsave_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    saved_resource = get_saved_resource_for_user(g.current_user.id, resource.id)
    if saved_resource is None:
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Resource was not saved.",
                }
            ),
            200,
        )

    db.session.delete(saved_resource)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Resource removed from saved resources.",
            }
        ),
        200,
    )
