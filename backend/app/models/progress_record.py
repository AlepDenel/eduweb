from datetime import datetime, timezone

from ..extensions import db


class ProgressRecord(db.Model):
    __tablename__ = "progress_records"
    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "resource_id",
            name="uq_progress_records_user_resource",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    resource_id = db.Column(
        db.Integer, db.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False
    )
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", back_populates="progress_records")
    resource = db.relationship("Resource", back_populates="progress_records")

    def __repr__(self) -> str:
        return f"<ProgressRecord {self.id}>"
