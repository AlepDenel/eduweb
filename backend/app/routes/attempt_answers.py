from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import AnswerOption, AttemptAnswer, Question, QuizAttempt
from ..utils.auth import login_required, role_required


attempt_answers_bp = Blueprint("attempt_answers", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def build_attempt_answer_response(answer: AttemptAnswer):
    return {
        "id": answer.id,
        "quiz_attempt_id": answer.quiz_attempt_id,
        "question_id": answer.question_id,
        "answer_option_id": answer.answer_option_id,
        "short_answer_text": answer.short_answer_text,
        "is_correct": answer.is_correct,
        "created_at": answer.created_at.isoformat(),
    }


def can_manage_attempt(user, attempt: QuizAttempt):
    return user.id == attempt.user_id or user.role.name == "Admin"


def ensure_attempt_is_in_progress(attempt: QuizAttempt):
    if attempt.status != "in_progress":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Answers can only be changed while the quiz attempt is in_progress.",
                }
            ),
            400,
        )

    return None


def parse_optional_int(value, field_name):
    if value in (None, ""):
        return None, None

    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, f"{field_name} must be a whole number."


def normalize_short_answer_text(value):
    if value is None:
        return None

    if isinstance(value, str):
        text = value.strip()
        return text or None

    return None


def validate_answer_payload(question: Question, data, *, require_all_fields: bool):
    option_id_provided = "answer_option_id" in data
    text_provided = "short_answer_text" in data

    if require_all_fields:
        option_id_provided = True
        text_provided = True

    answer_option_id_raw = data.get("answer_option_id") if option_id_provided else None
    short_answer_text_raw = data.get("short_answer_text") if text_provided else None

    answer_option_id, option_id_error = parse_optional_int(
        answer_option_id_raw, "answer_option_id"
    )
    if option_id_error:
        return None, option_id_error

    short_answer_text = normalize_short_answer_text(short_answer_text_raw)

    if question.question_type == "short_answer":
        if require_all_fields and not short_answer_text:
            return None, "short_answer_text is required for short_answer questions."

        if option_id_provided and answer_option_id is not None:
            return None, "answer_option_id must be empty for short_answer questions."

        return {
            "answer_option_id": None,
            "short_answer_text": short_answer_text,
        }, None

    if option_id_provided and answer_option_id is None:
        return None, "answer_option_id is required for this question type."

    if text_provided and short_answer_text is not None and not option_id_provided:
        return None, "short_answer_text is only used for short_answer questions."

    if require_all_fields and answer_option_id is None:
        return None, "answer_option_id is required for this question type."

    if answer_option_id is not None:
        option = db.session.get(AnswerOption, answer_option_id)
        if option is None or option.question_id != question.id:
            return None, "Answer option does not belong to this question."

    return {
        "answer_option_id": answer_option_id,
        "short_answer_text": None,
    }, None


@attempt_answers_bp.get("/quiz-attempts/<int:attempt_id>/answers")
@login_required
def list_attempt_answers_for_attempt(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    answers = (
        AttemptAnswer.query.filter_by(quiz_attempt_id=attempt.id)
        .order_by(AttemptAnswer.id)
        .all()
    )
    return (
        jsonify(
            {
                "status": "success",
                "quiz_attempt_id": attempt.id,
                "attempt_answers": [
                    build_attempt_answer_response(answer) for answer in answers
                ],
            }
        ),
        200,
    )


@attempt_answers_bp.get("/attempt-answers/<int:answer_id>")
@login_required
def get_attempt_answer(answer_id: int):
    answer = db.session.get(AttemptAnswer, answer_id)
    if answer is None:
        return jsonify({"status": "error", "message": "Attempt answer not found."}), 404

    return (
        jsonify({"status": "success", "attempt_answer": build_attempt_answer_response(answer)}),
        200,
    )


@attempt_answers_bp.post("/quiz-attempts/<int:attempt_id>/answers")
@login_required
def create_attempt_answer(attempt_id: int):
    attempt = db.session.get(QuizAttempt, attempt_id)
    if attempt is None:
        return jsonify({"status": "error", "message": "Quiz attempt not found."}), 404

    if not can_manage_attempt(g.current_user, attempt):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only submit answers to your own quiz attempts unless you are an Admin.",
                }
            ),
            403,
        )

    state_error = ensure_attempt_is_in_progress(attempt)
    if state_error is not None:
        return state_error

    data = get_request_data()
    question_id, question_id_error = parse_optional_int(data.get("question_id"), "question_id")
    if question_id_error:
        return jsonify({"status": "error", "message": question_id_error}), 400

    if question_id is None:
        return jsonify({"status": "error", "message": "question_id is required."}), 400

    question = db.session.get(Question, question_id)
    if question is None:
        return jsonify({"status": "error", "message": "Question not found."}), 404

    if question.quiz_id != attempt.quiz_id:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Question does not belong to the same quiz as this attempt.",
                }
            ),
            400,
        )

    existing_answer = AttemptAnswer.query.filter_by(
        quiz_attempt_id=attempt.id, question_id=question.id
    ).first()
    if existing_answer is not None:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "An answer for this question already exists in this quiz attempt.",
                }
            ),
            409,
        )

    validated_payload, validation_error = validate_answer_payload(
        question, data, require_all_fields=True
    )
    if validation_error:
        return jsonify({"status": "error", "message": validation_error}), 400

    answer = AttemptAnswer(
        quiz_attempt_id=attempt.id,
        question_id=question.id,
        answer_option_id=validated_payload["answer_option_id"],
        short_answer_text=validated_payload["short_answer_text"],
    )
    db.session.add(answer)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Attempt answer created successfully.",
                "attempt_answer": build_attempt_answer_response(answer),
            }
        ),
        201,
    )


@attempt_answers_bp.put("/attempt-answers/<int:answer_id>")
@login_required
def update_attempt_answer(answer_id: int):
    answer = db.session.get(AttemptAnswer, answer_id)
    if answer is None:
        return jsonify({"status": "error", "message": "Attempt answer not found."}), 404

    attempt = answer.quiz_attempt
    if not can_manage_attempt(g.current_user, attempt):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only update answers from your own quiz attempts unless you are an Admin.",
                }
            ),
            403,
        )

    state_error = ensure_attempt_is_in_progress(attempt)
    if state_error is not None:
        return state_error

    data = get_request_data()
    validated_payload, validation_error = validate_answer_payload(
        answer.question, data, require_all_fields=False
    )
    if validation_error:
        return jsonify({"status": "error", "message": validation_error}), 400

    if "answer_option_id" in data:
        answer.answer_option_id = validated_payload["answer_option_id"]
        if answer.question.question_type != "short_answer":
            answer.short_answer_text = None

    if "short_answer_text" in data:
        if answer.question.question_type == "short_answer":
            if validated_payload["short_answer_text"] is None:
                return (
                    jsonify(
                        {
                            "status": "error",
                            "message": "short_answer_text is required for short_answer questions.",
                        }
                    ),
                    400,
                )
            answer.short_answer_text = validated_payload["short_answer_text"]
            answer.answer_option_id = None
        else:
            answer.short_answer_text = None

    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Attempt answer updated successfully.",
                "attempt_answer": build_attempt_answer_response(answer),
            }
        ),
        200,
    )


@attempt_answers_bp.delete("/attempt-answers/<int:answer_id>")
@role_required("Admin")
def delete_attempt_answer(answer_id: int):
    answer = db.session.get(AttemptAnswer, answer_id)
    if answer is None:
        return jsonify({"status": "error", "message": "Attempt answer not found."}), 404

    if answer.quiz_attempt.status == "graded":
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Attempt answers cannot be deleted after the quiz attempt has been graded.",
                }
            ),
            400,
        )

    db.session.delete(answer)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Attempt answer deleted successfully."}),
        200,
    )
