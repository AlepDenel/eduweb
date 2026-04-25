from datetime import datetime, timezone

from ..extensions import db


class AnswerOption(db.Model):
    __tablename__ = "answer_options"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(
        db.Integer, db.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    question = db.relationship("Question", back_populates="answer_options")
    attempt_answers = db.relationship(
        "AttemptAnswer",
        back_populates="answer_option",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<AnswerOption {self.id}>"
