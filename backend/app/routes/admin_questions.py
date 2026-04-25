from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import AnswerOption, AttemptAnswer, Question, Quiz
from ..utils.auth import role_required


admin_questions_bp = Blueprint("admin_questions", __name__)


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


def parse_points(value):
    if value in (None, ""):
        return 1, None

    try:
        points = int(value)
    except (TypeError, ValueError):
        return None, "Points must be a whole number."

    if points < 1:
        return None, "Points must be at least 1."

    return points, None


def normalize_correct_short_answer(value):
    if value is None:
        return None

    if isinstance(value, str):
        text = value.strip()
        return text or None

    return None


def build_admin_question_response(question: Question):
    return {
        "id": question.id,
        "quiz_id": question.quiz_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "points": question.points,
        "created_at": question.created_at.isoformat(),
    }


def get_quiz_or_404(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return None, (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    return quiz, None


def get_question_or_404(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return None, (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    return question, None


def validate_question_payload(data):
    quiz_id, quiz_id_error = parse_positive_int(data.get("quiz_id"), "quiz_id")
    if quiz_id_error:
        return None, quiz_id_error

    quiz, quiz_error = get_quiz_or_404(quiz_id)
    if quiz_error is not None:
        return None, quiz_error

    question_text = normalize_text(data.get("question_text"))
    question_type = normalize_text(data.get("question_type")).lower()
    correct_short_answer = normalize_correct_short_answer(
        data.get("correct_short_answer")
    )
    points, points_error = parse_points(data.get("points"))

    if not question_text or not question_type:
        return None, "question_text and question_type are required."

    if points_error:
        return None, points_error

    if question_type != "short_answer" and correct_short_answer is not None:
        return None, "correct_short_answer is only used for short_answer questions."

    return {
        "quiz": quiz,
        "question_text": question_text,
        "question_type": question_type,
        "correct_short_answer": (
            correct_short_answer if question_type == "short_answer" else None
        ),
        "points": points,
    }, None


@admin_questions_bp.get("/quizzes/<int:quiz_id>/questions")
@role_required("Admin")
def list_admin_questions_for_quiz(quiz_id: int):
    quiz, error_response = get_quiz_or_404(quiz_id)
    if error_response is not None:
        return error_response

    questions = Question.query.filter_by(quiz_id=quiz.id).order_by(Question.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "quiz_id": quiz.id,
                "questions": [
                    build_admin_question_response(question) for question in questions
                ],
            }
        ),
        200,
    )


@admin_questions_bp.get("/questions/<int:question_id>")
@role_required("Admin")
def get_admin_question(question_id: int):
    question, error_response = get_question_or_404(question_id)
    if error_response is not None:
        return error_response

    return (
        jsonify(
            {"status": "success", "question": build_admin_question_response(question)}
        ),
        200,
    )


@admin_questions_bp.post("/questions")
@role_required("Admin")
def create_admin_question():
    data = get_request_data()
    validated_data, validation_error = validate_question_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    question = Question(
        quiz_id=validated_data["quiz"].id,
        question_text=validated_data["question_text"],
        question_type=validated_data["question_type"],
        correct_short_answer=validated_data["correct_short_answer"],
        points=validated_data["points"],
    )
    db.session.add(question)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Question created successfully.",
                "question": build_admin_question_response(question),
            }
        ),
        201,
    )


@admin_questions_bp.put("/questions/<int:question_id>")
@role_required("Admin")
def update_admin_question(question_id: int):
    question, error_response = get_question_or_404(question_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    validated_data, validation_error = validate_question_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    question.quiz_id = validated_data["quiz"].id
    question.question_text = validated_data["question_text"]
    question.question_type = validated_data["question_type"]
    question.correct_short_answer = validated_data["correct_short_answer"]
    question.points = validated_data["points"]
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Question updated successfully.",
                "question": build_admin_question_response(question),
            }
        ),
        200,
    )


@admin_questions_bp.delete("/questions/<int:question_id>")
@role_required("Admin")
def delete_admin_question(question_id: int):
    question, error_response = get_question_or_404(question_id)
    if error_response is not None:
        return error_response

    has_answer_options = (
        AnswerOption.query.filter_by(question_id=question.id).first() is not None
    )
    has_attempt_answers = (
        AttemptAnswer.query.filter_by(question_id=question.id).first() is not None
    )

    if has_answer_options or has_attempt_answers:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Question cannot be deleted because related records exist.",
                }
            ),
            400,
        )

    db.session.delete(question)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Question deleted successfully."}),
        200,
    )
