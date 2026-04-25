from datetime import datetime, timezone

from ..extensions import db


class ForumPost(db.Model):
    __tablename__ = "forum_posts"

    id = db.Column(db.Integer, primary_key=True)
    thread_id = db.Column(
        db.Integer,
        db.ForeignKey("forum_threads.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content = db.Column(db.Text, nullable=False)
    is_hidden = db.Column(db.Boolean, nullable=False, default=False)
    moderated_at = db.Column(db.DateTime, nullable=True)
    moderated_by_user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    thread = db.relationship("ForumThread", back_populates="forum_posts")
    user = db.relationship(
        "User",
        back_populates="forum_posts",
        foreign_keys=[user_id],
    )
    moderated_by = db.relationship(
        "User",
        back_populates="moderated_forum_posts",
        foreign_keys=[moderated_by_user_id],
    )
    forum_reports = db.relationship(
        "ForumReport",
        back_populates="forum_post",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<ForumPost {self.id} in thread {self.thread_id}>"
