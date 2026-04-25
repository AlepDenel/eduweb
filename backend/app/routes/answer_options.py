from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import AnswerOption, Question
from ..utils.auth import login_required, role_required


answer_options_bp = Blueprint("answer_options", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def parse_is_correct(value):
    if isinstance(value, bool):
        return value, None

    if value in (None, ""):
        return False, None

    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in ("true", "1", "yes"):
            return True, None
        if normalized in ("false", "0", "no"):
            return False, None

    return None, "is_correct must be true or false."


def build_answer_option_response(option: AnswerOption):
    return {
        "id": option.id,
        "question_id": option.question_id,
        "option_text": option.option_text,
        "is_correct": option.is_correct,
        "created_at": option.created_at.isoformat(),
    }


@answer_options_bp.get("/questions/<int:question_id>/answer-options")
@login_required
def list_answer_options_for_question(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    answer_options = (
        AnswerOption.query.filter_by(question_id=question.id)
        .order_by(AnswerOption.id)
        .all()
    )
    return (
        jsonify(
            {
                "status": "success",
                "question_id": question.id,
                "answer_options": [
                    build_answer_option_response(option) for option in answer_options
                ],
            }
        ),
        200,
    )


@answer_options_bp.get("/answer-options/<int:option_id>")
@login_required
def get_answer_option(option_id: int):
    option = db.session.get(AnswerOption, option_id)
    if option is None:
        return (
            jsonify({"status": "error", "message": "Answer option not found."}),
            404,
        )

    return (
        jsonify(
            {
                "status": "success",
                "answer_option": build_answer_option_response(option),
            }
        ),
        200,
    )


@answer_options_bp.post("/questions/<int:question_id>/answer-options")
@role_required("Moderator", "Admin")
def create_answer_option(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    data = get_request_data()
    option_text = data.get("option_text", "").strip()
    is_correct, is_correct_error = parse_is_correct(data.get("is_correct"))

    if not option_text:
        return (
            jsonify({"status": "error", "message": "option_text is required."}),
            400,
        )

    if is_correct_error:
        return jsonify({"status": "error", "message": is_correct_error}), 400

    option = AnswerOption(
        question_id=question.id,
        option_text=option_text,
        is_correct=is_correct,
    )
    db.session.add(option)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Answer option created successfully.",
                "answer_option": build_answer_option_response(option),
            }
        ),
        201,
    )


@answer_options_bp.put("/answer-options/<int:option_id>")
@role_required("Moderator", "Admin")
def update_answer_option(option_id: int):
    option = db.session.get(AnswerOption, option_id)
    if option is None:
        return (
            jsonify({"status": "error", "message": "Answer option not found."}),
            404,
        )

    data = get_request_data()
    option_text = data.get("option_text", "").strip()
    is_correct, is_correct_error = parse_is_correct(data.get("is_correct"))

    if not option_text:
        return (
            jsonify({"status": "error", "message": "option_text is required."}),
            400,
        )

    if is_correct_error:
        return jsonify({"status": "error", "message": is_correct_error}), 400

    option.option_text = option_text
    option.is_correct = is_correct
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Answer option updated successfully.",
                "answer_option": build_answer_option_response(option),
            }
        ),
        200,
    )


@answer_options_bp.delete("/answer-options/<int:option_id>")
@role_required("Admin")
def delete_answer_option(option_id: int):
    option = db.session.get(AnswerOption, option_id)
    if option is None:
        return (
            jsonify({"status": "error", "message": "Answer option not found."}),
            404,
        )

    db.session.delete(option)
    db.session.commit()

    return (
        jsonify(
            {"status": "success", "message": "Answer option deleted successfully."}
        ),
        200,
    )
