from datetime import datetime, timezone

from flask import Blueprint, g, jsonify

from ..extensions import db
from ..models import ForumPost, ForumReport
from ..utils.auth import role_required


forum_moderation_bp = Blueprint("forum_moderation", __name__)


def build_forum_report_review_response(report: ForumReport):
    post = report.forum_post
    return {
        "id": report.id,
        "post_id": post.id,
        "thread_id": post.thread_id,
        "post_content": post.content,
        "reason": report.reason,
        "reporting_user_id": report.user_id,
        "created_at": report.created_at.isoformat(),
    }


def build_forum_moderation_post_response(post: ForumPost):
    return {
        "id": post.id,
        "thread_id": post.thread_id,
        "user_id": post.user_id,
        "content": post.content,
        "is_hidden": post.is_hidden,
        "moderated_at": (
            post.moderated_at.isoformat() if post.moderated_at is not None else None
        ),
        "moderated_by_user_id": post.moderated_by_user_id,
        "created_at": post.created_at.isoformat(),
    }


def get_forum_post_or_404(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return None, (
            jsonify({"status": "error", "message": "Forum post not found."}),
            404,
        )

    return post, None


@forum_moderation_bp.get("/forum-reports")
@role_required("Moderator", "Admin")
def list_forum_reports_for_moderation():
    reports = ForumReport.query.order_by(
        ForumReport.created_at.desc(), ForumReport.id.desc()
    ).all()

    return (
        jsonify(
            {
                "status": "success",
                "forum_reports": [
                    build_forum_report_review_response(report) for report in reports
                ],
            }
        ),
        200,
    )


@forum_moderation_bp.post("/forum-posts/<int:post_id>/hide")
@role_required("Moderator", "Admin")
def hide_forum_post(post_id: int):
    post, error_response = get_forum_post_or_404(post_id)
    if error_response is not None:
        return error_response

    if post.is_hidden:
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Forum post is already hidden.",
                    "forum_post": build_forum_moderation_post_response(post),
                }
            ),
            200,
        )

    post.is_hidden = True
    post.moderated_at = datetime.now(timezone.utc)
    post.moderated_by_user_id = g.current_user.id
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum post hidden successfully.",
                "forum_post": build_forum_moderation_post_response(post),
            }
        ),
        200,
    )


@forum_moderation_bp.post("/forum-posts/<int:post_id>/unhide")
@role_required("Moderator", "Admin")
def unhide_forum_post(post_id: int):
    post, error_response = get_forum_post_or_404(post_id)
    if error_response is not None:
        return error_response

    if not post.is_hidden:
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Forum post is already visible.",
                    "forum_post": build_forum_moderation_post_response(post),
                }
            ),
            200,
        )

    post.is_hidden = False
    post.moderated_at = datetime.now(timezone.utc)
    post.moderated_by_user_id = g.current_user.id
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum post unhidden successfully.",
                "forum_post": build_forum_moderation_post_response(post),
            }
        ),
        200,
    )


@forum_moderation_bp.delete("/forum-posts/<int:post_id>/moderation-remove")
@role_required("Moderator", "Admin")
def remove_forum_post_by_moderation(post_id: int):
    post, error_response = get_forum_post_or_404(post_id)
    if error_response is not None:
        return error_response

    db.session.delete(post)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Forum post removed successfully."}),
        200,
    )
