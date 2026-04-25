from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import (
    ForumPost,
    ForumReport,
    ForumThread,
    Order,
    ProgressRecord,
    QuizAttempt,
    Role,
    SavedResource,
    User,
)
from ..utils.auth import role_required


admin_users_bp = Blueprint("admin_users", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def parse_positive_int(value, field_name):
    if value in (None, ""):
        return None, f"{field_name} is required."

    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be a whole number."

    if parsed_value <= 0:
        return None, f"{field_name} must be greater than zero."

    return parsed_value, None


def build_user_response(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role_id": user.role_id,
        "role_name": user.role.name if user.role is not None else None,
        "created_at": user.created_at.isoformat(),
    }


def get_user_or_404(user_id: int):
    user = db.session.get(User, user_id)
    if user is None:
        return None, (
            jsonify({"status": "error", "message": "User not found."}),
            404,
        )

    return user, None


def get_role_or_404(role_id: int):
    role = db.session.get(Role, role_id)
    if role is None:
        return None, (
            jsonify({"status": "error", "message": "Role not found."}),
            404,
        )

    return role, None


def get_user_reference_counts(user_id: int):
    return {
        "quiz_attempts": QuizAttempt.query.filter_by(user_id=user_id).count(),
        "progress_records": ProgressRecord.query.filter_by(user_id=user_id).count(),
        "forum_threads": ForumThread.query.filter_by(user_id=user_id).count(),
        "forum_posts": ForumPost.query.filter_by(user_id=user_id).count(),
        "forum_reports": ForumReport.query.filter_by(user_id=user_id).count(),
        "orders": Order.query.filter_by(user_id=user_id).count(),
        "saved_resources": SavedResource.query.filter_by(user_id=user_id).count(),
    }


@admin_users_bp.get("/users")
@role_required("Admin")
def list_users():
    users = User.query.order_by(User.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "users": [build_user_response(user) for user in users],
            }
        ),
        200,
    )


@admin_users_bp.get("/users/<int:user_id>")
@role_required("Admin")
def get_user(user_id: int):
    user, error_response = get_user_or_404(user_id)
    if error_response is not None:
        return error_response

    return jsonify({"status": "success", "user": build_user_response(user)}), 200


@admin_users_bp.patch("/users/<int:user_id>/role")
@role_required("Admin")
def update_user_role(user_id: int):
    user, user_error = get_user_or_404(user_id)
    if user_error is not None:
        return user_error

    data = get_request_data()
    role_id, role_id_error = parse_positive_int(data.get("role_id"), "role_id")
    if role_id_error:
        return jsonify({"status": "error", "message": role_id_error}), 400

    role, role_error = get_role_or_404(role_id)
    if role_error is not None:
        return role_error

    if user.id == g.current_user.id and role.name != "Admin":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You cannot change your own role away from Admin while managing users.",
                }
            ),
            400,
        )

    user.role_id = role.id
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "User role updated successfully.",
                "user": build_user_response(user),
            }
        ),
        200,
    )


@admin_users_bp.delete("/users/<int:user_id>")
@role_required("Admin")
def delete_user(user_id: int):
    user, error_response = get_user_or_404(user_id)
    if error_response is not None:
        return error_response

    if user.id == g.current_user.id:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You cannot delete your own account from admin user management.",
                }
            ),
            400,
        )

    reference_counts = get_user_reference_counts(user.id)
    referenced_components = [
        name for name, count in reference_counts.items() if count > 0
    ]

    if referenced_components:
        components_text = ", ".join(referenced_components)
        return (
            jsonify(
                {
                    "status": "error",
                    "message": (
                        "User cannot be deleted because related records exist in: "
                        f"{components_text}."
                    ),
                }
            ),
            400,
        )

    db.session.delete(user)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "User deleted successfully.",
            }
        ),
        200,
    )
