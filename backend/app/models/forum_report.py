from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint

from ..extensions import db


class ForumReport(db.Model):
    __tablename__ = "forum_reports"
    __table_args__ = (
        UniqueConstraint("user_id", "post_id", name="uq_forum_reports_user_post"),
    )

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(
        db.Integer,
        db.ForeignKey("forum_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    reason = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    forum_post = db.relationship("ForumPost", back_populates="forum_reports")
    user = db.relationship("User", back_populates="forum_reports")

    def __repr__(self) -> str:
        return f"<ForumReport {self.id} for post {self.post_id}>"
