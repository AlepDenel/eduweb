from datetime import datetime, timezone

from ..extensions import db


class QuizAttempt(db.Model):
    __tablename__ = "quiz_attempts"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(
        db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    score = db.Column(db.Integer, nullable=True)
    started_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    submitted_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), nullable=False, default="in_progress")

    quiz = db.relationship("Quiz", back_populates="quiz_attempts")
    user = db.relationship("User", back_populates="quiz_attempts")
    attempt_answers = db.relationship(
        "AttemptAnswer",
        back_populates="quiz_attempt",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<QuizAttempt {self.id}>"
