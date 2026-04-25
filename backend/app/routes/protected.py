from flask import Blueprint, g, jsonify

from ..utils.auth import login_required, role_required


protected_bp = Blueprint("protected", __name__)


@protected_bp.get("/protected/user")
@login_required
def protected_user_route():
    return (
        jsonify(
            {
                "status": "success",
                "message": "You are logged in and allowed to use this route.",
                "user": {
                    "id": g.current_user.id,
                    "name": g.current_user.name,
                    "role": g.current_user.role.name,
                },
            }
        ),
        200,
    )


@protected_bp.get("/protected/admin")
@role_required("Admin")
def protected_admin_route():
    return (
        jsonify(
            {
                "status": "success",
                "message": "Admin access confirmed.",
            }
        ),
        200,
    )


@protected_bp.get("/protected/moderation")
@role_required("Moderator", "Admin")
def protected_moderation_route():
    return (
        jsonify(
            {
                "status": "success",
                "message": "Moderator or Admin access confirmed.",
            }
        ),
        200,
    )
