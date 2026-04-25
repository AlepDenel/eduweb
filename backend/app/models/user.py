from datetime import datetime, timezone

from ..extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    role = db.relationship("Role", back_populates="users")
    progress_records = db.relationship(
        "ProgressRecord",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    saved_resources = db.relationship(
        "SavedResource",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    forum_threads = db.relationship(
        "ForumThread",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    forum_posts = db.relationship(
        "ForumPost",
        back_populates="user",
        foreign_keys="ForumPost.user_id",
        lazy=True,
        cascade="all, delete-orphan",
    )
    moderated_forum_posts = db.relationship(
        "ForumPost",
        back_populates="moderated_by",
        foreign_keys="ForumPost.moderated_by_user_id",
        lazy=True,
    )
    forum_reports = db.relationship(
        "ForumReport",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    cart = db.relationship(
        "Cart",
        back_populates="user",
        uselist=False,
        lazy=True,
        cascade="all, delete-orphan",
    )
    orders = db.relationship(
        "Order",
        back_populates="user",
        lazy=True,
        cascade="all, delete-orphan",
    )
    quiz_attempts = db.relationship(
        "QuizAttempt", back_populates="user", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"
