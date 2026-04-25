from datetime import datetime, timezone

from ..extensions import db


class Module(db.Model):
    __tablename__ = "modules"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    course = db.relationship("Course", back_populates="modules")
    resources = db.relationship("Resource", back_populates="module", lazy=True)
    quizzes = db.relationship(
        "Quiz", back_populates="module", lazy=True, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Module {self.title}>"
