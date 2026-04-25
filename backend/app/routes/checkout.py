from decimal import Decimal
from datetime import datetime, timedelta, timezone

from flask import Blueprint, g, jsonify, request

from ..extensions import db
from ..models import Cart, Order, OrderItem
from ..utils.auth import login_required


checkout_bp = Blueprint("checkout", __name__)


ALLOWED_ORDER_STATUSES = {"completed"}
ALLOWED_SORT_DIRECTIONS = {"asc", "desc"}


def parse_date_filter(value: str, field_name: str):
    try:
        parsed_date = datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        return None, f"{field_name} must use YYYY-MM-DD format."

    return parsed_date.replace(tzinfo=timezone.utc), None


def parse_limit(value: str):
    try:
        limit = int(value)
    except (TypeError, ValueError):
        return None, "limit must be a whole number."

    if limit <= 0:
        return None, "limit must be greater than zero."

    return limit, None


def get_order_item_counts(order: Order):
    items = list(order.items)
    item_count = len(items)
    total_quantity = sum(item.quantity for item in items)
    return item_count, total_quantity


def build_order_item_response(item: OrderItem):
    line_subtotal = Decimal(item.price) * item.quantity

    return {
        "id": item.id,
        "book_id": item.book_id,
        "title": item.book.title,
        "quantity": item.quantity,
        "price": str(item.price),
        "line_subtotal": str(line_subtotal),
        "created_at": item.created_at.isoformat(),
    }


def build_order_summary_response(order: Order):
    item_count, total_quantity = get_order_item_counts(order)

    return {
        "id": order.id,
        "status": order.status,
        "total_amount": str(order.total_amount),
        "created_at": order.created_at.isoformat(),
        "item_count": item_count,
        "total_quantity": total_quantity,
    }


def build_order_detail_response(order: Order):
    items = sorted(order.items, key=lambda item: item.id)
    item_count, total_quantity = get_order_item_counts(order)

    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "total_amount": str(order.total_amount),
        "created_at": order.created_at.isoformat(),
        "item_count": item_count,
        "total_quantity": total_quantity,
        "items": [build_order_item_response(item) for item in items],
    }


def get_current_user_cart():
    return Cart.query.filter_by(user_id=g.current_user.id).first()


def get_order_for_current_user(order_id: int):
    order = Order.query.filter_by(id=order_id, user_id=g.current_user.id).first()
    if order is None:
        return None, (
            jsonify({"status": "error", "message": "Order not found."}),
            404,
        )

    return order, None


@checkout_bp.post("/checkout")
@login_required
def checkout():
    cart = get_current_user_cart()
    if cart is None or not cart.items:
        return jsonify({"status": "error", "message": "Cart is empty."}), 400

    cart_items = sorted(cart.items, key=lambda item: item.id)
    validated_items = []
    total_amount = Decimal("0.00")

    for item in cart_items:
        book = item.book
        if book is None:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "A book in the cart no longer exists.",
                    }
                ),
                400,
            )

        if item.quantity <= 0:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Cart contains an invalid item quantity.",
                    }
                ),
                400,
            )

        if item.quantity > book.stock_quantity:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": f"Requested quantity exceeds available stock for '{book.title}'.",
                    }
                ),
                400,
            )

        line_total = Decimal(book.price) * item.quantity
        total_amount += line_total
        validated_items.append(
            {
                "cart_item": item,
                "book": book,
                "quantity": item.quantity,
                "price": Decimal(book.price),
            }
        )

    try:
        order = Order(
            user_id=g.current_user.id,
            status="completed",
            total_amount=total_amount,
        )
        db.session.add(order)
        db.session.flush()

        for validated_item in validated_items:
            order_item = OrderItem(
                order_id=order.id,
                book_id=validated_item["book"].id,
                quantity=validated_item["quantity"],
                price=validated_item["price"],
            )
            db.session.add(order_item)
            validated_item["book"].stock_quantity -= validated_item["quantity"]

        for validated_item in validated_items:
            db.session.delete(validated_item["cart_item"])

        db.session.commit()
    except Exception:
        db.session.rollback()
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Checkout could not be completed.",
                }
            ),
            500,
        )

    return (
        jsonify(
            {
                "status": "success",
                "message": "Checkout completed successfully.",
                "order": build_order_detail_response(order),
            }
        ),
        201,
    )


@checkout_bp.get("/orders")
@login_required
def list_orders():
    orders_query = Order.query.filter_by(user_id=g.current_user.id)

    status = request.args.get("status")
    if status not in (None, ""):
        status = status.strip().lower()
        if status not in ALLOWED_ORDER_STATUSES:
            return jsonify({"status": "error", "message": "Invalid order status filter."}), 400

        orders_query = orders_query.filter(Order.status == status)

    created_from_raw = request.args.get("created_from")
    if created_from_raw not in (None, ""):
        created_from, date_error = parse_date_filter(created_from_raw, "created_from")
        if date_error:
            return jsonify({"status": "error", "message": date_error}), 400

        orders_query = orders_query.filter(Order.created_at >= created_from)

    created_to_raw = request.args.get("created_to")
    if created_to_raw not in (None, ""):
        created_to, date_error = parse_date_filter(created_to_raw, "created_to")
        if date_error:
            return jsonify({"status": "error", "message": date_error}), 400

        created_to_end = created_to + timedelta(days=1)
        orders_query = orders_query.filter(Order.created_at < created_to_end)

    sort_direction = request.args.get("sort", "desc")
    if isinstance(sort_direction, str):
        sort_direction = sort_direction.strip().lower()

    if sort_direction not in ALLOWED_SORT_DIRECTIONS:
        return jsonify({"status": "error", "message": "Invalid sort direction."}), 400

    if sort_direction == "asc":
        orders_query = orders_query.order_by(Order.created_at.asc(), Order.id.asc())
    else:
        orders_query = orders_query.order_by(Order.created_at.desc(), Order.id.desc())

    limit_raw = request.args.get("limit")
    if limit_raw not in (None, ""):
        limit, limit_error = parse_limit(limit_raw)
        if limit_error:
            return jsonify({"status": "error", "message": limit_error}), 400

        orders_query = orders_query.limit(limit)

    orders = orders_query.all()

    return (
        jsonify(
            {
                "status": "success",
                "orders": [build_order_summary_response(order) for order in orders],
            }
        ),
        200,
    )


@checkout_bp.get("/orders/<int:order_id>")
@login_required
def get_order(order_id: int):
    order, error_response = get_order_for_current_user(order_id)
    if error_response is not None:
        return error_response

    return (
        jsonify({"status": "success", "order": build_order_detail_response(order)}),
        200,
    )
