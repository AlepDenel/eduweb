from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Module, Question, Quiz, QuizAttempt
from ..utils.auth import role_required


admin_quizzes_bp = Blueprint("admin_quizzes", __name__)


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


def parse_optional_int(value, field_name):
    if value in (None, ""):
        return None, None

    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, f"{field_name} must be a whole number."


def build_admin_quiz_response(quiz: Quiz):
    return {
        "id": quiz.id,
        "module_id": quiz.module_id,
        "title": quiz.title,
        "description": quiz.description,
        "time_limit_minutes": quiz.time_limit_minutes,
        "passing_score": quiz.passing_score,
        "created_at": quiz.created_at.isoformat(),
    }


def get_module_or_404(module_id: int):
    module = db.session.get(Module, module_id)
    if module is None:
        return None, (
            jsonify({"status": "error", "message": "Module not found."}),
            404,
        )

    return module, None


def get_quiz_or_404(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return None, (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    return quiz, None


def validate_quiz_payload(data):
    module_id, module_id_error = parse_positive_int(data.get("module_id"), "module_id")
    if module_id_error:
        return None, module_id_error

    module, module_error = get_module_or_404(module_id)
    if module_error is not None:
        return None, module_error

    title = normalize_text(data.get("title"))
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
        return None, "Title is required."

    if time_limit_error:
        return None, time_limit_error

    if passing_score_error:
        return None, passing_score_error

    return {
        "module": module,
        "title": title,
        "description": description,
        "time_limit_minutes": time_limit_minutes,
        "passing_score": passing_score,
    }, None


@admin_quizzes_bp.get("/modules/<int:module_id>/quizzes")
@role_required("Admin")
def list_admin_quizzes_for_module(module_id: int):
    module, error_response = get_module_or_404(module_id)
    if error_response is not None:
        return error_response

    quizzes = Quiz.query.filter_by(module_id=module.id).order_by(Quiz.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "module_id": module.id,
                "quizzes": [build_admin_quiz_response(quiz) for quiz in quizzes],
            }
        ),
        200,
    )


@admin_quizzes_bp.get("/quizzes/<int:quiz_id>")
@role_required("Admin")
def get_admin_quiz(quiz_id: int):
    quiz, error_response = get_quiz_or_404(quiz_id)
    if error_response is not None:
        return error_response

    return (
        jsonify({"status": "success", "quiz": build_admin_quiz_response(quiz)}),
        200,
    )


@admin_quizzes_bp.post("/quizzes")
@role_required("Admin")
def create_admin_quiz():
    data = get_request_data()
    validated_data, validation_error = validate_quiz_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    quiz = Quiz(
        module_id=validated_data["module"].id,
        title=validated_data["title"],
        description=validated_data["description"],
        time_limit_minutes=validated_data["time_limit_minutes"],
        passing_score=validated_data["passing_score"],
    )
    db.session.add(quiz)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz created successfully.",
                "quiz": build_admin_quiz_response(quiz),
            }
        ),
        201,
    )


@admin_quizzes_bp.put("/quizzes/<int:quiz_id>")
@role_required("Admin")
def update_admin_quiz(quiz_id: int):
    quiz, error_response = get_quiz_or_404(quiz_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    validated_data, validation_error = validate_quiz_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    quiz.module_id = validated_data["module"].id
    quiz.title = validated_data["title"]
    quiz.description = validated_data["description"]
    quiz.time_limit_minutes = validated_data["time_limit_minutes"]
    quiz.passing_score = validated_data["passing_score"]
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz updated successfully.",
                "quiz": build_admin_quiz_response(quiz),
            }
        ),
        200,
    )


@admin_quizzes_bp.delete("/quizzes/<int:quiz_id>")
@role_required("Admin")
def delete_admin_quiz(quiz_id: int):
    quiz, error_response = get_quiz_or_404(quiz_id)
    if error_response is not None:
        return error_response

    has_questions = Question.query.filter_by(quiz_id=quiz.id).first() is not None
    has_attempts = QuizAttempt.query.filter_by(quiz_id=quiz.id).first() is not None

    if has_questions or has_attempts:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Quiz cannot be deleted because related records exist.",
                }
            ),
            400,
        )

    db.session.delete(quiz)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Quiz deleted successfully."}),
        200,
    )
