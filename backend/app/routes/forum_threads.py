from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import ForumThread
from ..utils.auth import login_required


forum_threads_bp = Blueprint("forum_threads", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_text(value):
    if not isinstance(value, str):
        return None

    text = value.strip()
    return text or None


def build_forum_thread_response(thread: ForumThread):
    return {
        "id": thread.id,
        "user_id": thread.user_id,
        "title": thread.title,
        "content": thread.content,
        "created_at": thread.created_at.isoformat(),
    }


def can_manage_thread(user, thread: ForumThread):
    return user.id == thread.user_id or user.role.name == "Admin"


@forum_threads_bp.get("/forum-threads")
@login_required
def list_forum_threads():
    threads = ForumThread.query.order_by(ForumThread.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "forum_threads": [
                    build_forum_thread_response(thread) for thread in threads
                ],
            }
        ),
        200,
    )


@forum_threads_bp.get("/forum-threads/<int:thread_id>")
@login_required
def get_forum_thread(thread_id: int):
    thread = db.session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify({"status": "error", "message": "Forum thread not found."}), 404

    return (
        jsonify(
            {
                "status": "success",
                "forum_thread": build_forum_thread_response(thread),
            }
        ),
        200,
    )


@forum_threads_bp.post("/forum-threads")
@login_required
def create_forum_thread():
    data = get_request_data()
    title = normalize_text(data.get("title"))
    content = normalize_text(data.get("content"))

    if title is None:
        return jsonify({"status": "error", "message": "title is required."}), 400

    if content is None:
        return jsonify({"status": "error", "message": "content is required."}), 400

    thread = ForumThread(
        user_id=g.current_user.id,
        title=title,
        content=content,
    )
    db.session.add(thread)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum thread created successfully.",
                "forum_thread": build_forum_thread_response(thread),
            }
        ),
        201,
    )


@forum_threads_bp.put("/forum-threads/<int:thread_id>")
@login_required
def update_forum_thread(thread_id: int):
    thread = db.session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify({"status": "error", "message": "Forum thread not found."}), 404

    if not can_manage_thread(g.current_user, thread):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only update your own forum threads unless you are an Admin.",
                }
            ),
            403,
        )

    data = get_request_data()
    title = normalize_text(data.get("title"))
    content = normalize_text(data.get("content"))

    if title is None:
        return jsonify({"status": "error", "message": "title is required."}), 400

    if content is None:
        return jsonify({"status": "error", "message": "content is required."}), 400

    thread.title = title
    thread.content = content
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum thread updated successfully.",
                "forum_thread": build_forum_thread_response(thread),
            }
        ),
        200,
    )


@forum_threads_bp.delete("/forum-threads/<int:thread_id>")
@login_required
def delete_forum_thread(thread_id: int):
    thread = db.session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify({"status": "error", "message": "Forum thread not found."}), 404

    if not can_manage_thread(g.current_user, thread):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only delete your own forum threads unless you are an Admin.",
                }
            ),
            403,
        )

    db.session.delete(thread)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Forum thread deleted successfully."}),
        200,
    )
