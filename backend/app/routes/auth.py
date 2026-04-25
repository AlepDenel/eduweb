from flask import Blueprint, jsonify, request, session
from werkzeug.security import check_password_hash, generate_password_hash

from ..extensions import db
from ..models import Role, User


auth_bp = Blueprint("auth", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def build_user_response(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role.name,
        "created_at": user.created_at.isoformat(),
    }


@auth_bp.post("/auth/register")
def register():
    data = get_request_data()

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not name or not email or not password:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Name, email, and password are required.",
                }
            ),
            400,
        )

    existing_user = User.query.filter_by(email=email).first()
    if existing_user is not None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "This email is already registered.",
                }
            ),
            409,
        )

    student_role = Role.query.filter_by(name="Student").first()
    if student_role is None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Default student role is missing. Run the role setup first.",
                }
            ),
            500,
        )

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role_id=student_role.id,
    )

    db.session.add(user)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Registration completed successfully.",
                "user": build_user_response(user),
            }
        ),
        201,
    )


@auth_bp.post("/auth/login")
def login():
    data = get_request_data()

    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()

    if not email or not password:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Email and password are required.",
                }
            ),
            400,
        )

    user = User.query.filter_by(email=email).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Invalid email or password.",
                }
            ),
            401,
        )

    session.clear()
    session["user_id"] = user.id
    session["role_name"] = user.role.name

    return (
        jsonify(
            {
                "status": "success",
                "message": "Login successful.",
                "user": build_user_response(user),
            }
        ),
        200,
    )


@auth_bp.post("/auth/logout")
def logout():
    session.clear()
    return (
        jsonify(
            {
                "status": "success",
                "message": "Logout successful.",
            }
        ),
        200,
    )


@auth_bp.get("/auth/me")
def current_user():
    user_id = session.get("user_id")

    if not user_id:
        return (
            jsonify(
                {
                    "status": "success",
                    "authenticated": False,
                    "message": "No user is currently logged in.",
                }
            ),
            200,
        )

    user = db.session.get(User, user_id)
    if user is None:
        session.clear()
        return (
            jsonify(
                {
                    "status": "success",
                    "authenticated": False,
                    "message": "Session is no longer valid.",
                }
            ),
            200,
        )

    return (
        jsonify(
            {
                "status": "success",
                "authenticated": True,
                "user": build_user_response(user),
            }
        ),
        200,
    )
