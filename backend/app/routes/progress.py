from datetime import datetime, timezone

from flask import Blueprint, g, jsonify

from ..extensions import db
from ..models import ProgressRecord, Resource
from ..utils.auth import login_required


progress_bp = Blueprint("progress", __name__)


def build_progress_response(record: ProgressRecord):
    return {
        "id": record.id,
        "user_id": record.user_id,
        "resource_id": record.resource_id,
        "completed": record.completed_at is not None,
        "completed_at": (
            record.completed_at.isoformat() if record.completed_at is not None else None
        ),
        "created_at": record.created_at.isoformat(),
    }


def get_resource_or_404(resource_id: int):
    resource = db.session.get(Resource, resource_id)
    if resource is None:
        return None, (
            jsonify({"status": "error", "message": "Resource not found."}),
            404,
        )

    return resource, None


def get_or_create_progress_record(user_id: int, resource_id: int):
    record = ProgressRecord.query.filter_by(
        user_id=user_id,
        resource_id=resource_id,
    ).first()

    if record is not None:
        return record, False

    record = ProgressRecord(user_id=user_id, resource_id=resource_id)
    db.session.add(record)
    return record, True


@progress_bp.get("/progress/me")
@login_required
def get_my_progress():
    records = (
        ProgressRecord.query.filter_by(user_id=g.current_user.id)
        .order_by(ProgressRecord.id)
        .all()
    )

    return (
        jsonify(
            {
                "status": "success",
                "progress_records": [
                    build_progress_response(record) for record in records
                ],
            }
        ),
        200,
    )


@progress_bp.get("/resources/<int:resource_id>/progress")
@login_required
def get_progress_for_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    record = ProgressRecord.query.filter_by(
        user_id=g.current_user.id,
        resource_id=resource.id,
    ).first()

    return (
        jsonify(
            {
                "status": "success",
                "resource_id": resource.id,
                "progress": build_progress_response(record) if record else None,
                "completed": bool(record and record.completed_at is not None),
            }
        ),
        200,
    )


@progress_bp.post("/resources/<int:resource_id>/progress/complete")
@login_required
def complete_progress_for_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    record, _ = get_or_create_progress_record(g.current_user.id, resource.id)
    record.completed_at = datetime.now(timezone.utc)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Progress marked as complete.",
                "progress": build_progress_response(record),
            }
        ),
        200,
    )


@progress_bp.post("/resources/<int:resource_id>/progress/reset")
@login_required
def reset_progress_for_resource(resource_id: int):
    resource, error_response = get_resource_or_404(resource_id)
    if error_response is not None:
        return error_response

    record, _ = get_or_create_progress_record(g.current_user.id, resource.id)
    record.completed_at = None
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Progress reset successfully.",
                "progress": build_progress_response(record),
            }
        ),
        200,
    )
