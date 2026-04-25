from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import ForumPost, ForumThread
from ..utils.auth import login_required


forum_posts_bp = Blueprint("forum_posts", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_text(value):
    if not isinstance(value, str):
        return None

    text = value.strip()
    return text or None


def build_forum_post_response(post: ForumPost):
    return {
        "id": post.id,
        "thread_id": post.thread_id,
        "user_id": post.user_id,
        "content": post.content,
        "created_at": post.created_at.isoformat(),
    }


def can_manage_post(user, post: ForumPost):
    return user.id == post.user_id or user.role.name == "Admin"


def can_review_hidden_post(user, post: ForumPost):
    return user.role.name in {"Moderator", "Admin"} or user.id == post.user_id


@forum_posts_bp.get("/forum-threads/<int:thread_id>/posts")
@login_required
def list_forum_posts_for_thread(thread_id: int):
    thread = db.session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify({"status": "error", "message": "Forum thread not found."}), 404

    posts_query = ForumPost.query.filter_by(thread_id=thread.id)
    if g.current_user.role.name not in {"Moderator", "Admin"}:
        posts_query = posts_query.filter_by(is_hidden=False)

    posts = posts_query.order_by(ForumPost.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "thread_id": thread.id,
                "forum_posts": [build_forum_post_response(post) for post in posts],
            }
        ),
        200,
    )


@forum_posts_bp.get("/forum-posts/<int:post_id>")
@login_required
def get_forum_post(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return jsonify({"status": "error", "message": "Forum post not found."}), 404

    if post.is_hidden and not can_review_hidden_post(g.current_user, post):
        return jsonify({"status": "error", "message": "Forum post not found."}), 404

    return (
        jsonify({"status": "success", "forum_post": build_forum_post_response(post)}),
        200,
    )


@forum_posts_bp.post("/forum-threads/<int:thread_id>/posts")
@login_required
def create_forum_post(thread_id: int):
    thread = db.session.get(ForumThread, thread_id)
    if thread is None:
        return jsonify({"status": "error", "message": "Forum thread not found."}), 404

    data = get_request_data()
    content = normalize_text(data.get("content"))

    if content is None:
        return jsonify({"status": "error", "message": "content is required."}), 400

    post = ForumPost(
        thread_id=thread.id,
        user_id=g.current_user.id,
        content=content,
    )
    db.session.add(post)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum post created successfully.",
                "forum_post": build_forum_post_response(post),
            }
        ),
        201,
    )


@forum_posts_bp.put("/forum-posts/<int:post_id>")
@login_required
def update_forum_post(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return jsonify({"status": "error", "message": "Forum post not found."}), 404

    if not can_manage_post(g.current_user, post):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only update your own forum posts unless you are an Admin.",
                }
            ),
            403,
        )

    data = get_request_data()
    content = normalize_text(data.get("content"))

    if content is None:
        return jsonify({"status": "error", "message": "content is required."}), 400

    post.content = content
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Forum post updated successfully.",
                "forum_post": build_forum_post_response(post),
            }
        ),
        200,
    )


@forum_posts_bp.delete("/forum-posts/<int:post_id>")
@login_required
def delete_forum_post(post_id: int):
    post = db.session.get(ForumPost, post_id)
    if post is None:
        return jsonify({"status": "error", "message": "Forum post not found."}), 404

    if not can_manage_post(g.current_user, post):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "You can only delete your own forum posts unless you are an Admin.",
                }
            ),
            403,
        )

    db.session.delete(post)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Forum post deleted successfully."}),
        200,
    )
