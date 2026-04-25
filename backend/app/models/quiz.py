from datetime import datetime, timezone

from ..extensions import db


class Quiz(db.Model):
    __tablename__ = "quizzes"

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(
        db.Integer, db.ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    time_limit_minutes = db.Column(db.Integer, nullable=True)
    passing_score = db.Column(db.Integer, nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    module = db.relationship("Module", back_populates="quizzes")
    questions = db.relationship(
        "Question", back_populates="quiz", lazy=True, cascade="all, delete-orphan"
    )
    quiz_attempts = db.relationship(
        "QuizAttempt", back_populates="quiz", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Quiz {self.title}>"
