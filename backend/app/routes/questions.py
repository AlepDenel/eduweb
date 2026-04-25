from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import Question, Quiz
from ..utils.auth import login_required, role_required


questions_bp = Blueprint("questions", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


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


def build_question_response(question: Question):
    return {
        "id": question.id,
        "quiz_id": question.quiz_id,
        "question_text": question.question_text,
        "question_type": question.question_type,
        "points": question.points,
        "created_at": question.created_at.isoformat(),
    }


@questions_bp.get("/quizzes/<int:quiz_id>/questions")
@login_required
def list_questions_for_quiz(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    questions = Question.query.filter_by(quiz_id=quiz.id).order_by(Question.id).all()
    return (
        jsonify(
            {
                "status": "success",
                "quiz_id": quiz.id,
                "questions": [
                    build_question_response(question) for question in questions
                ],
            }
        ),
        200,
    )


@questions_bp.get("/questions/<int:question_id>")
@login_required
def get_question(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    return (
        jsonify({"status": "success", "question": build_question_response(question)}),
        200,
    )


@questions_bp.post("/quizzes/<int:quiz_id>/questions")
@role_required("Moderator", "Admin")
def create_question(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return (
            jsonify({"status": "error", "message": "Quiz not found."}),
            404,
        )

    data = get_request_data()
    question_text = data.get("question_text", "").strip()
    question_type = data.get("question_type", "").strip().lower()
    correct_short_answer = normalize_correct_short_answer(data.get("correct_short_answer"))
    points, points_error = parse_points(data.get("points"))

    if not question_text or not question_type:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "question_text and question_type are required.",
                }
            ),
            400,
        )

    if points_error:
        return jsonify({"status": "error", "message": points_error}), 400

    if question_type != "short_answer" and correct_short_answer is not None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "correct_short_answer is only used for short_answer questions.",
                }
            ),
            400,
        )

    question = Question(
        quiz_id=quiz.id,
        question_text=question_text,
        question_type=question_type,
        correct_short_answer=correct_short_answer if question_type == "short_answer" else None,
        points=points,
    )
    db.session.add(question)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Question created successfully.",
                "question": build_question_response(question),
            }
        ),
        201,
    )


@questions_bp.put("/questions/<int:question_id>")
@role_required("Moderator", "Admin")
def update_question(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    data = get_request_data()
    question_text = data.get("question_text", "").strip()
    question_type = data.get("question_type", "").strip().lower()
    correct_short_answer = normalize_correct_short_answer(data.get("correct_short_answer"))
    points, points_error = parse_points(data.get("points"))

    if not question_text or not question_type:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "question_text and question_type are required.",
                }
            ),
            400,
        )

    if points_error:
        return jsonify({"status": "error", "message": points_error}), 400

    if question_type != "short_answer" and correct_short_answer is not None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "correct_short_answer is only used for short_answer questions.",
                }
            ),
            400,
        )

    question.question_text = question_text
    question.question_type = question_type
    question.correct_short_answer = (
        correct_short_answer if question_type == "short_answer" else None
    )
    question.points = points
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Question updated successfully.",
                "question": build_question_response(question),
            }
        ),
        200,
    )


@questions_bp.delete("/questions/<int:question_id>")
@role_required("Admin")
def delete_question(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    db.session.delete(question)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Question deleted successfully."}),
        200,
    )
