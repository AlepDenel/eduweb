from functools import wraps

from flask import g, jsonify, session

from ..extensions import db
from ..models import User


def get_current_user():
    user_id = session.get("user_id")

    if not user_id:
        return None

    user = db.session.get(User, user_id)
    if user is None:
        session.clear()
        return None

    return user


def login_required(view_function):
    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        user = get_current_user()
        if user is None:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "You must log in before using this route.",
                    }
                ),
                401,
            )

        g.current_user = user
        return view_function(*args, **kwargs)

    return wrapped_view


def role_required(*allowed_roles):
    def decorator(view_function):
        @wraps(view_function)
        @login_required
        def wrapped_view(*args, **kwargs):
            user = g.current_user

            if user.role.name not in allowed_roles:
                allowed_text = ", ".join(allowed_roles)
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"This route requires one of these roles: {allowed_text}.",
                        }
                    ),
                    403,
                )

            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator
