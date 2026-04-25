from datetime import datetime, timezone

from flask import Blueprint, g, jsonify

from ..extensions import db
from ..models import AttemptAnswer, QuizAttempt
from ..utils.auth import login_required, role_required


grading_bp = Blueprint("grading", __name__)


def can_view_attempt_results(user, attempt: QuizAttempt):
    return user.id == attempt.user_id or user.role.name == "Admin"


def normalize_text_for_grading(value):
    if value is None:
        return None

    return value.strip().casefold()


def build_detailed_result(answer: AttemptAnswer):
    question = answer.question
    points_awarded = question.points if answer.is_correct else 0

    return {
        "attempt_answer_id": answer.id,
        "question_id": question.id,
        "question_type": question.question_type,
        "answer_option_id": answer.answer_option_id,
        "short_answer_text": answer.short_answer_text,
        "is_correct": answer.is_correct,
        "points_awarded": points_awarded,
    }


def build_results_response(attempt: QuizAttempt, answers):
    correct_count = sum(1 for answer in answers if answer.is_correct is True)
    incorrect_count = sum(1 for answer in answers if answer.is_correct is False)

    return {
        "attempt_id": attempt.id,
        "user_id": attempt.user_id,
        "quiz_id": attempt.quiz_id,
        "status": attempt.status,
        "total_score": attempt.score,
        "correct_answers": correct_count,
        "incorrect_answers": incorrect_count,
        "results": [build_detailed_result(answer) for answer in answers],
    }


@grading_bp.post("/quiz-attempts/<int:attempt_id>/grade")
@role_required("Admin")
def grade_quiz_attempt(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    if attempt.status == "in_progress":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "This quiz attempt must be submitted before it can be graded.",
                }
            ),
            400,
        )

    if attempt.status == "graded":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "This quiz attempt has already been graded.",
                }
            ),
            400,
        )

    answers = (
        AttemptAnswer.query.filter_by(quiz_attempt_id=attempt.id)
        .order_by(AttemptAnswer.id)
        .all()
    )
    if not answers:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "This quiz attempt has no answers to grade.",
                }
            ),
            400,
        )

    grading_results = []
    total_score = 0

    for answer in answers:
        question = answer.question

        if question.quiz_id != attempt.quiz_id:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Found an answer linked to a question outside this quiz attempt.",
                    }
                ),
                400,
            )

        is_correct = False

        if question.question_type == "short_answer":
            if not question.correct_short_answer:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": f"Short-answer question {question.id} is missing correct_short_answer.",
                        }
                    ),
                    400,
                )

            submitted_text = normalize_text_for_grading(answer.short_answer_text)
            correct_text = normalize_text_for_grading(question.correct_short_answer)
            is_correct = submitted_text is not None and submitted_text == correct_text
        else:
            selected_option = answer.answer_option
            if selected_option is not None and selected_option.question_id != question.id:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "Found an answer option linked to the wrong question during grading.",
                        }
                    ),
                    400,
                )
            is_correct = bool(selected_option and selected_option.is_correct)

        grading_results.append((answer, is_correct))
        if is_correct:
            total_score += question.points

    for answer, is_correct in grading_results:
        answer.is_correct = is_correct

    attempt.score = total_score
    attempt.status = "graded"
    if attempt.submitted_at is None:
        attempt.submitted_at = datetime.now(timezone.utc)

    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Quiz attempt graded successfully.",
                "grading_result": build_results_response(attempt, answers),
            }
        ),
        200,
    )


@grading_bp.get("/quiz-attempts/<int:attempt_id>/results")
@login_required
def get_quiz_attempt_results(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    if not can_view_attempt_results(g.current_user, attempt):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only view results for your own quiz attempts unless you are an Admin.",
                }
            ),
            403,
        )

    answers = (
        AttemptAnswer.query.filter_by(quiz_attempt_id=attempt.id)
        .order_by(AttemptAnswer.id)
        .all()
    )

    if attempt.status == "in_progress":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Results are not available while the quiz attempt is still in_progress.",
                }
            ),
            400,
        )

    if attempt.score is None or any(answer.is_correct is None for answer in answers):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Results are not available until grading has been completed.",
                }
            ),
            400,
        )

    return (
        jsonify(
            {
                "status": "success",
                "result": build_results_response(attempt, answers),
            }
        ),
        200,
    )
