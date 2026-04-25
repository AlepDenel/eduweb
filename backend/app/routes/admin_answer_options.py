from flask import Blueprint, jsonify, request

from ..extensions import db
from ..models import AnswerOption, AttemptAnswer, Question
from .answer_options import parse_is_correct
from ..utils.auth import role_required


admin_answer_options_bp = Blueprint("admin_answer_options", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


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


def build_admin_answer_option_response(option: AnswerOption):
    return {
        "id": option.id,
        "question_id": option.question_id,
        "option_text": option.option_text,
        "is_correct": option.is_correct,
        "created_at": option.created_at.isoformat(),
    }


def get_question_or_404(question_id: int):
    question = db.session.get(Question, question_id)
    if question is None:
        return None, (
            jsonify({"status": "error", "message": "Question not found."}),
            404,
        )

    return question, None


def get_answer_option_or_404(option_id: int):
    option = db.session.get(AnswerOption, option_id)
    if option is None:
        return None, (
            jsonify({"status": "error", "message": "Answer option not found."}),
            404,
        )

    return option, None


def validate_answer_option_payload(data):
    question_id, question_id_error = parse_positive_int(
        data.get("question_id"), "question_id"
    )
    if question_id_error:
        return None, question_id_error

    question, question_error = get_question_or_404(question_id)
    if question_error is not None:
        return None, question_error

    option_text = data.get("option_text", "")
    if isinstance(option_text, str):
        option_text = option_text.strip()
    else:
        option_text = ""

    is_correct, is_correct_error = parse_is_correct(data.get("is_correct"))

    if not option_text:
        return None, "option_text is required."

    if is_correct_error:
        return None, "Invalid value for is_correct."

    return {
        "question": question,
        "option_text": option_text,
        "is_correct": is_correct,
    }, None


def validate_answer_option_update_payload(data):
    option_text = data.get("option_text", "")
    if isinstance(option_text, str):
        option_text = option_text.strip()
    else:
        option_text = ""

    is_correct, is_correct_error = parse_is_correct(data.get("is_correct"))

    if not option_text:
        return None, "option_text is required."

    if is_correct_error:
        return None, "Invalid value for is_correct."

    return {
        "option_text": option_text,
        "is_correct": is_correct,
    }, None


@admin_answer_options_bp.get("/questions/<int:question_id>/options")
@role_required("Admin")
def list_admin_answer_options_for_question(question_id: int):
    question, error_response = get_question_or_404(question_id)
    if error_response is not None:
        return error_response

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
                    build_admin_answer_option_response(option)
                    for option in answer_options
                ],
            }
        ),
        200,
    )


@admin_answer_options_bp.get("/options/<int:option_id>")
@role_required("Admin")
def get_admin_answer_option(option_id: int):
    option, error_response = get_answer_option_or_404(option_id)
    if error_response is not None:
        return error_response

    return (
        jsonify(
            {
                "status": "success",
                "answer_option": build_admin_answer_option_response(option),
            }
        ),
        200,
    )


@admin_answer_options_bp.post("/options")
@role_required("Admin")
def create_admin_answer_option():
    data = get_request_data()
    validated_data, validation_error = validate_answer_option_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    option = AnswerOption(
        question_id=validated_data["question"].id,
        option_text=validated_data["option_text"],
        is_correct=validated_data["is_correct"],
    )
    db.session.add(option)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Answer option created successfully.",
                "answer_option": build_admin_answer_option_response(option),
            }
        ),
        201,
    )


@admin_answer_options_bp.put("/options/<int:option_id>")
@role_required("Admin")
def update_admin_answer_option(option_id: int):
    option, error_response = get_answer_option_or_404(option_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    validated_data, validation_error = validate_answer_option_update_payload(data)
    if isinstance(validation_error, tuple):
        return validation_error
    if validation_error is not None:
        return jsonify({"status": "error", "message": validation_error}), 400

    option.option_text = validated_data["option_text"]
    option.is_correct = validated_data["is_correct"]
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Answer option updated successfully.",
                "answer_option": build_admin_answer_option_response(option),
            }
        ),
        200,
    )


@admin_answer_options_bp.delete("/options/<int:option_id>")
@role_required("Admin")
def delete_admin_answer_option(option_id: int):
    option, error_response = get_answer_option_or_404(option_id)
    if error_response is not None:
        return error_response

    has_attempt_answers = (
        AttemptAnswer.query.filter_by(answer_option_id=option.id).first() is not None
    )

    if has_attempt_answers:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Cannot delete option because it is used in attempt answers.",
                }
            ),
            400,
        )

    db.session.delete(option)
    db.session.commit()

    return (
        jsonify(
            {"status": "success", "message": "Answer option deleted successfully."}
        ),
        200,
    )
