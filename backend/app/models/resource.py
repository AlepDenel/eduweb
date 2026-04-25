from datetime import datetime, timezone

from ..extensions import db


class Resource(db.Model):
    __tablename__ = "resources"

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey("modules.id"), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    resource_type = db.Column(db.String(30), nullable=False)
    content_url = db.Column(db.String(255), nullable=True)
    content_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    module = db.relationship("Module", back_populates="resources")
    progress_records = db.relationship(
        "ProgressRecord",
        back_populates="resource",
        lazy=True,
        cascade="all, delete-orphan",
    )
    saved_resources = db.relationship(
        "SavedResource",
        back_populates="resource",
        lazy=True,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Resource {self.title}>"
