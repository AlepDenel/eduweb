from datetime import datetime, timezone

from ..extensions import db


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    modules = db.relationship("Module", back_populates="course", lazy=True)

    def __repr__(self) -> str:
        return f"<Course {self.title}>"
