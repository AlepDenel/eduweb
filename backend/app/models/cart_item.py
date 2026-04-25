from datetime import datetime, timezone

from sqlalchemy import UniqueConstraint

from ..extensions import db


class CartItem(db.Model):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_id", "book_id", name="uq_cart_items_cart_book"),
    )

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(
        db.Integer,
        db.ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
    )
    book_id = db.Column(
        db.Integer,
        db.ForeignKey("books.id", ondelete="CASCADE"),
        nullable=False,
    )
    quantity = db.Column(db.Integer, nullable=False)
    created_at = db.Column(
        db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    cart = db.relationship("Cart", back_populates="items")
    book = db.relationship("Book", back_populates="cart_items")

    def __repr__(self) -> str:
        return f"<CartItem {self.id} cart={self.cart_id} book={self.book_id}>"
