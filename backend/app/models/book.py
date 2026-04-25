from datetime import datetime, timezone

from ..extensions import db


class Book(db.Model):
    __tablename__ = "books"

    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(
        db.Integer,
        db.ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title = db.Column(db.String(200), nullable=False)
    author = db.Column(db.String(150), nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    category = db.relationship("Category", back_populates="books")
    cart_items = db.relationship("CartItem", back_populates="book", lazy=True)
    order_items = db.relationship("OrderItem", back_populates="book", lazy=True)

    def __repr__(self) -> str:
        return f"<Book {self.title}>"
