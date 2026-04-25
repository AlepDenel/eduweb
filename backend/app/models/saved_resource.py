from datetime import datetime, timezone

from ..extensions import db


class SavedResource(db.Model):
    __tablename__ = "saved_resources"
    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "resource_id",
            name="uq_saved_resources_user_resource",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    resource_id = db.Column(
        db.Integer, db.ForeignKey("resources.id", ondelete="CASCADE"), nullable=False
    )
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", back_populates="saved_resources")
    resource = db.relationship("Resource", back_populates="saved_resources")

    def __repr__(self) -> str:
        return f"<SavedResource {self.id}>"
