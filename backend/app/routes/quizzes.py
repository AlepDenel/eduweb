from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Module, Quiz
from ..utils.auth import login_required, role_required


quizzes_bp = Blueprint("quizzes", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def parse_optional_int(value, field_name):
    if value in (None, ""):
        return None, None

    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, f"{field_name} must be a whole number."


def build_quiz_response(quiz: Quiz):
    return {
        "id": quiz.id,
        "module_id": quiz.module_id,
        "title": quiz.title,
        "description": quiz.description,
        "time_limit_minutes": quiz.time_limit_minutes,
        "passing_score": quiz.passing_score,
        "created_at": quiz.created_at.isoformat(),
    }


@quizzes_bp.get("/modules/<int:module_id>/quizzes")
@login_required
def list_quizzes_for_module(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return (
            jsonify({"status": "error", "message": "Module not found."}),
            404,
        )

    quizzes = Quiz.query.filter_by(module_id=module.id).order_by(Quiz.id).all()
    return (
        jsonify(
            {
                "status": "success",
                "module_id": module.id,
                "quizzes": [build_quiz_response(quiz) for quiz in quizzes],
            }
        ),
        200,
    )


@quizzes_bp.get("/quizzes/<int:quiz_id>")
@login_required
def get_quiz(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    return (
        jsonify({"status": "success", "quiz": build_quiz_response(quiz)}),
        200,
    )


@quizzes_bp.post("/modules/<int:module_id>/quizzes")
@role_required("Moderator", "Admin")
def create_quiz(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return (
            jsonify({"status": "error", "message": "Module not found."}),
            404,
        )

    data = get_request_data()
    title = data.get("title", "").strip()
    description = data.get("description")
    if isinstance(description, str):
        description = description.strip() or None

    time_limit_minutes, time_limit_error = parse_optional_int(
        data.get("time_limit_minutes"), "time_limit_minutes"
    )
    passing_score, passing_score_error = parse_optional_int(
        data.get("passing_score"), "passing_score"
    )

    if not title:
        return (
            jsonify({"status": "error", "message": "Title is required."}),
            400,
        )

    if time_limit_error:
        return jsonify({"status": "error", "message": time_limit_error}), 400

    if passing_score_error:
        return jsonify({"status": "error", "message": passing_score_error}), 400

    quiz = Quiz(
        module_id=module.id,
        title=title,
        description=description,
        time_limit_minutes=time_limit_minutes,
        passing_score=passing_score,
    )
    db.session.add(quiz)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz created successfully.",
                "quiz": build_quiz_response(quiz),
            }
        ),
        201,
    )


@quizzes_bp.put("/quizzes/<int:quiz_id>")
@role_required("Moderator", "Admin")
def update_quiz(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    data = get_request_data()
    title = data.get("title", "").strip()
    description = data.get("description")
    if isinstance(description, str):
        description = description.strip() or None

    time_limit_minutes, time_limit_error = parse_optional_int(
        data.get("time_limit_minutes"), "time_limit_minutes"
    )
    passing_score, passing_score_error = parse_optional_int(
        data.get("passing_score"), "passing_score"
    )

    if not title:
        return (
            jsonify({"status": "error", "message": "Title is required."}),
            400,
        )

    if time_limit_error:
        return jsonify({"status": "error", "message": time_limit_error}), 400

    if passing_score_error:
        return jsonify({"status": "error", "message": passing_score_error}), 400

    quiz.title = title
    quiz.description = description
    quiz.time_limit_minutes = time_limit_minutes
    quiz.passing_score = passing_score
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz updated successfully.",
                "quiz": build_quiz_response(quiz),
            }
        ),
        200,
    )


@quizzes_bp.delete("/quizzes/<int:quiz_id>")
@role_required("Admin")
def delete_quiz(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    db.session.delete(quiz)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Quiz deleted successfully."}),
        200,
    )
