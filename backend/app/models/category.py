from datetime import datetime, timezone

from ..extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    books = db.relationship("Book", back_populates="category", lazy=True)

    def __repr__(self) -> str:
        return f"<Category {self.name}>"
