from datetime import datetime, timezone

from flask import Blueprint, g, jsonify

from ..extensions import db
from ..models import Quiz, QuizAttempt
from ..utils.auth import login_required, role_required


quiz_attempts_bp = Blueprint("quiz_attempts", __name__)


def build_quiz_attempt_response(attempt: QuizAttempt):
    return {
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "user_id": attempt.user_id,
        "score": attempt.score,
        "started_at": attempt.started_at.isoformat(),
        "submitted_at": (
            attempt.submitted_at.isoformat() if attempt.submitted_at is not None else None
        ),
        "status": attempt.status,
    }


def can_update_attempt(user, attempt: QuizAttempt):
    return user.id == attempt.user_id or user.role.name == "Admin"


def can_submit_attempt(user, attempt: QuizAttempt):
    return user.id == attempt.user_id or user.role.name == "Admin"


@quiz_attempts_bp.get("/quizzes/<int:quiz_id>/attempts")
@login_required
def list_quiz_attempts_for_quiz(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return jsonify({"status": "error", "message": "Quiz not found."}), 404

    attempts = QuizAttempt.query.filter_by(quiz_id=quiz.id).order_by(QuizAttempt.id).all()
    return (
        jsonify(
            {
                "status": "success",
                "quiz_id": quiz.id,
                "quiz_attempts": [
                    build_quiz_attempt_response(attempt) for attempt in attempts
                ],
            }
        ),
        200,
    )


@quiz_attempts_bp.get("/quiz-attempts/<int:attempt_id>")
@login_required
def get_quiz_attempt(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    return (
        jsonify({"status": "success", "quiz_attempt": build_quiz_attempt_response(attempt)}),
        200,
    )


@quiz_attempts_bp.post("/quizzes/<int:quiz_id>/attempts")
@login_required
def create_quiz_attempt(quiz_id: int):
    quiz = db.session.get(Quiz, quiz_id)
    if quiz is None:
        return jsonify({"status": "error", "message": "Quiz not found."}), 404

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=g.current_user.id,
        status="in_progress",
    )
    db.session.add(attempt)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz attempt created successfully.",
                "quiz_attempt": build_quiz_attempt_response(attempt),
            }
        ),
        201,
    )


@quiz_attempts_bp.put("/quiz-attempts/<int:attempt_id>")
@login_required
def update_quiz_attempt(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    if not can_update_attempt(g.current_user, attempt):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only update your own quiz attempts unless you are an Admin.",
                }
            ),
            403,
        )

    return (
        jsonify(
            {
                "status": "error",
                "message": "Quiz attempt lifecycle fields are managed by the submit and grading routes.",
            }
        ),
        400,
    )


@quiz_attempts_bp.post("/quiz-attempts/<int:attempt_id>/submit")
@login_required
def submit_quiz_attempt(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    if not can_submit_attempt(g.current_user, attempt):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only submit your own quiz attempts unless you are an Admin.",
                }
            ),
            403,
        )

    if attempt.status == "submitted":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "This quiz attempt has already been submitted.",
                }
            ),
            400,
        )

    if attempt.status == "graded":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "This quiz attempt has already been graded and cannot be submitted again.",
                }
            ),
            400,
        )

    attempt.status = "submitted"
    if attempt.submitted_at is None:
        attempt.submitted_at = datetime.now(timezone.utc)

    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz attempt submitted successfully.",
                "quiz_attempt": build_quiz_attempt_response(attempt),
            }
        ),
        200,
    )


@quiz_attempts_bp.delete("/quiz-attempts/<int:attempt_id>")
@role_required("Admin")
def delete_quiz_attempt(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    db.session.delete(attempt)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Quiz attempt deleted successfully."}),
        200,
    )
