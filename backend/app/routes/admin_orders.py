from datetime import datetime, timedelta, timezone
from decimal import Decimal

from flask import Blueprint, jsonify, request

from ..models import Order, OrderItem
from ..utils.auth import role_required


admin_orders_bp = Blueprint("admin_orders", __name__)


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


def parse_user_id(value: str):
    try:
        user_id = int(value)
    except (TypeError, ValueError):
        return None, "user_id must be a whole number."

    if user_id <= 0:
        return None, "user_id must be greater than zero."

    return user_id, None


def get_order_item_counts(order: Order):
    items = list(order.items)
    item_count = len(items)
    total_quantity = sum(item.quantity for item in items)
    return item_count, total_quantity


def build_admin_order_item_response(item: OrderItem):
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


def build_admin_order_summary_response(order: Order):
    item_count, total_quantity = get_order_item_counts(order)

    return {
        "id": order.id,
        "user_id": order.user_id,
        "user_name": order.user.name,
        "user_email": order.user.email,
        "status": order.status,
        "total_amount": str(order.total_amount),
        "created_at": order.created_at.isoformat(),
        "item_count": item_count,
        "total_quantity": total_quantity,
    }


def build_admin_order_detail_response(order: Order):
    items = sorted(order.items, key=lambda item: item.id)
    item_count, total_quantity = get_order_item_counts(order)

    return {
        "id": order.id,
        "user_id": order.user_id,
        "user_name": order.user.name,
        "user_email": order.user.email,
        "status": order.status,
        "total_amount": str(order.total_amount),
        "created_at": order.created_at.isoformat(),
        "item_count": item_count,
        "total_quantity": total_quantity,
        "items": [build_admin_order_item_response(item) for item in items],
    }


def get_order_or_404(order_id: int):
    order = Order.query.filter_by(id=order_id).first()
    if order is None:
        return None, (
            jsonify({"status": "error", "message": "Order not found."}),
            404,
        )

    return order, None


@admin_orders_bp.get("/admin/orders")
@role_required("Admin")
def list_admin_orders():
    orders_query = Order.query

    status = request.args.get("status")
    if status not in (None, ""):
        status = status.strip().lower()
        if status not in ALLOWED_ORDER_STATUSES:
            return jsonify({"status": "error", "message": "Invalid order status filter."}), 400

        orders_query = orders_query.filter(Order.status == status)

    user_id_raw = request.args.get("user_id")
    if user_id_raw not in (None, ""):
        user_id, user_id_error = parse_user_id(user_id_raw)
        if user_id_error:
            return jsonify({"status": "error", "message": user_id_error}), 400

        orders_query = orders_query.filter(Order.user_id == user_id)

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
                "orders": [build_admin_order_summary_response(order) for order in orders],
            }
        ),
        200,
    )


@admin_orders_bp.get("/admin/orders/<int:order_id>")
@role_required("Admin")
def get_admin_order(order_id: int):
    order, error_response = get_order_or_404(order_id)
    if error_response is not None:
        return error_response

    return (
        jsonify({"status": "success", "order": build_admin_order_detail_response(order)}),
        200,
    )
