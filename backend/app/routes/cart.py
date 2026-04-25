from decimal import Decimal

from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import Book, Cart, CartItem
from ..utils.auth import login_required


cart_bp = Blueprint("cart", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def parse_positive_int(value, field_name):
    if value in (None, ""):
        return None, f"{field_name} is required."

    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be a whole number."

    if parsed_value <= 0:
        return None, f"{field_name} must be greater than zero."

    return parsed_value, None


def build_cart_item_response(item: CartItem):
    book = item.book
    line_subtotal = Decimal(book.price) * item.quantity

    return {
        "id": item.id,
        "book_id": book.id,
        "title": book.title,
        "author": book.author,
        "price": str(book.price),
        "stock_quantity": book.stock_quantity,
        "quantity": item.quantity,
        "line_subtotal": str(line_subtotal),
        "created_at": item.created_at.isoformat(),
    }


def build_cart_response(cart: Cart | None, user_id: int):
    items = [] if cart is None else sorted(cart.items, key=lambda item: item.id)
    total_items = sum(item.quantity for item in items)
    total_amount = sum(Decimal(item.book.price) * item.quantity for item in items)

    return {
        "id": cart.id if cart is not None else None,
        "user_id": user_id,
        "items": [build_cart_item_response(item) for item in items],
        "total_items": total_items,
        "total_amount": str(total_amount),
    }


def get_or_create_cart_for_user(user_id: int):
    cart = Cart.query.filter_by(user_id=user_id).first()
    if cart is None:
        cart = Cart(user_id=user_id)
        db.session.add(cart)
        db.session.commit()

    return cart


def get_book_or_404(book_id: int):
    book = db.session.get(Book, book_id)
    if book is None:
        return None, (
            jsonify({"status": "error", "message": "Book not found."}),
            404,
        )

    return book, None


def get_cart_item_for_current_user(item_id: int):
    item = (
        CartItem.query.join(Cart)
        .filter(CartItem.id == item_id, Cart.user_id == g.current_user.id)
        .first()
    )
    if item is None:
        return None, (
            jsonify({"status": "error", "message": "Cart item not found."}),
            404,
        )

    return item, None


def ensure_quantity_within_stock(quantity: int, book: Book):
    if quantity > book.stock_quantity:
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Requested quantity exceeds available stock.",
                }
            ),
            400,
        )

    return None


@cart_bp.get("/cart")
@login_required
def get_cart():
    cart = Cart.query.filter_by(user_id=g.current_user.id).first()

    return (
        jsonify(
            {
                "status": "success",
                "cart": build_cart_response(cart, g.current_user.id),
            }
        ),
        200,
    )


@cart_bp.post("/cart/items")
@login_required
def add_cart_item():
    data = get_request_data()

    book_id, book_id_error = parse_positive_int(data.get("book_id"), "book_id")
    if book_id_error:
        return jsonify({"status": "error", "message": book_id_error}), 400

    quantity, quantity_error = parse_positive_int(data.get("quantity"), "quantity")
    if quantity_error:
        return jsonify({"status": "error", "message": quantity_error}), 400

    book, error_response = get_book_or_404(book_id)
    if error_response is not None:
        return error_response

    cart = get_or_create_cart_for_user(g.current_user.id)
    existing_item = CartItem.query.filter_by(cart_id=cart.id, book_id=book.id).first()

    if existing_item is not None:
        new_quantity = existing_item.quantity + quantity
        stock_error = ensure_quantity_within_stock(new_quantity, book)
        if stock_error is not None:
            return stock_error

        existing_item.quantity = new_quantity
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Cart item quantity updated successfully.",
                    "cart": build_cart_response(cart, g.current_user.id),
                }
            ),
            200,
        )

    stock_error = ensure_quantity_within_stock(quantity, book)
    if stock_error is not None:
        return stock_error

    item = CartItem(
        cart_id=cart.id,
        book_id=book.id,
        quantity=quantity,
    )
    db.session.add(item)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Book added to cart successfully.",
                "cart": build_cart_response(cart, g.current_user.id),
            }
        ),
        201,
    )


@cart_bp.put("/cart/items/<int:item_id>")
@login_required
def update_cart_item(item_id: int):
    item, error_response = get_cart_item_for_current_user(item_id)
    if error_response is not None:
        return error_response

    data = get_request_data()
    quantity, quantity_error = parse_positive_int(data.get("quantity"), "quantity")
    if quantity_error:
        return jsonify({"status": "error", "message": quantity_error}), 400

    stock_error = ensure_quantity_within_stock(quantity, item.book)
    if stock_error is not None:
        return stock_error

    item.quantity = quantity
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Cart item updated successfully.",
                "cart": build_cart_response(item.cart, g.current_user.id),
            }
        ),
        200,
    )


@cart_bp.delete("/cart/items/<int:item_id>")
@login_required
def delete_cart_item(item_id: int):
    item, error_response = get_cart_item_for_current_user(item_id)
    if error_response is not None:
        return error_response

    cart = item.cart
    db.session.delete(item)
    db.session.commit()

    return (
        jsonify(
            {
                "status": "success",
                "message": "Cart item removed successfully.",
                "cart": build_cart_response(cart, g.current_user.id),
            }
        ),
        200,
    )
