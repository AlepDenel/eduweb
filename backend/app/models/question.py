from datetime import datetime, timezone

from ..extensions import db


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(
        db.Integer, db.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False
    )
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    correct_short_answer = db.Column(db.Text, nullable=True)
    points = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    quiz = db.relationship("Quiz", back_populates="questions")
    answer_options = db.relationship(
        "AnswerOption",
        back_populates="question",
        lazy=True,
        cascade="all, delete-orphan",
    )
    attempt_answers = db.relationship(
        "AttemptAnswer",
        back_populates="question",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Question {self.id}>"
