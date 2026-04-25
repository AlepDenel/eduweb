from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import ForumPost, ForumReport
from ..utils.auth import login_required


forum_reports_bp = Blueprint("forum_reports", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_text(value):
    if not isinstance(value, str):
        return None

    text = value.strip()
    return text or None


def get_forum_post_or_404(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return None, (
            jsonify({"status": "error", "message": "Forum post not found."}),
            404,
        )

    return post, None


def get_forum_report_for_user(user_id: int, post_id: int):
    return ForumReport.query.filter_by(user_id=user_id, post_id=post_id).first()


def build_forum_report_response(report: ForumReport):
    post = report.forum_post
    return {
        "id": report.id,
        "post_id": post.id,
        "thread_id": post.thread_id,
        "post_content": post.content,
        "reason": report.reason,
        "created_at": report.created_at.isoformat(),
    }


@forum_reports_bp.get("/forum-reports/me")
@login_required
def get_my_forum_reports():
    reports = (
        ForumReport.query.filter_by(user_id=g.current_user.id)
        .order_by(ForumReport.id)
        .all()
    )

    return (
        jsonify(
            {
                "status": "success",
                "forum_reports": [
                    build_forum_report_response(report) for report in reports
                ],
            }
        ),
        200,
    )


@forum_reports_bp.get("/forum-posts/<int:post_id>/report-status")
@login_required
def get_forum_report_status(post_id: int):
    post, error_response = get_forum_post_or_404(post_id)
    if error_response is not None:
        return error_response

    report = get_forum_report_for_user(g.current_user.id, post.id)

    return (
        jsonify(
            {
                "status": "success",
                "post_id": post.id,
                "reported": report is not None,
                "forum_report": (
                    build_forum_report_response(report) if report is not None else None
                ),
            }
        ),
        200,
    )


@forum_reports_bp.post("/forum-posts/<int:post_id>/report")
@login_required
def report_forum_post(post_id: int):
    post, error_response = get_forum_post_or_404(post_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    reason = normalize_text(data.get("reason"))
    if reason is None:
        return jsonify({"status": "error", "message": "reason is required."}), 400

    report = get_forum_report_for_user(g.current_user.id, post.id)
    if report is not None:
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Forum post is already reported.",
                    "forum_report": build_forum_report_response(report),
                }
            ),
            200,
        )

    report = ForumReport(
        user_id=g.current_user.id,
        post_id=post.id,
        reason=reason,
    )
    db.session.add(report)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum post reported successfully.",
                "forum_report": build_forum_report_response(report),
            }
        ),
        201,
    )


@forum_reports_bp.delete("/forum-posts/<int:post_id>/report")
@login_required
def remove_forum_report(post_id: int):
    post, error_response = get_forum_post_or_404(post_id)
    if error_response is not None:
        return error_response

    report = get_forum_report_for_user(g.current_user.id, post.id)
    if report is None:
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Forum post was not reported.",
                }
            ),
            200,
        )

    db.session.delete(report)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum report removed successfully.",
            }
        ),
        200,
    )
