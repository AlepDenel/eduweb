from datetime import datetime, timezone

from ..extensions import db


class AttemptAnswer(db.Model):
    __tablename__ = "attempt_answers"
    __table_args__ = (
        db.UniqueConstraint(
            "quiz_attempt_id",
            "question_id",
            name="uq_attempt_answers_quiz_attempt_question",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    quiz_attempt_id = db.Column(
        db.Integer, db.ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False
    )
    question_id = db.Column(
        db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    answer_option_id = db.Column(
        db.Integer,
        db.ForeignKey("answer_options.id", ondelete="CASCADE"),
        nullable=True,
    )
    short_answer_text = db.Column(db.Text, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    quiz_attempt = db.relationship("QuizAttempt", back_populates="attempt_answers")
    question = db.relationship("Question", back_populates="attempt_answers")
    answer_option = db.relationship("AnswerOption", back_populates="attempt_answers")

    def __repr__(self) -> str:
        return f"<AttemptAnswer {self.id}>"
