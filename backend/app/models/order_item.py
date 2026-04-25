from datetime import datetime, timezone

from ..extensions import db


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    book_id = db.Column(
        db.Integer,
        db.ForeignKey("books.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    order = db.relationship("Order", back_populates="items")
    book = db.relationship("Book", back_populates="order_items")

    def __repr__(self) -> str:
        return f"<OrderItem {self.id} order={self.order_id} book={self.book_id}>"
