from flask import Blueprint, jsonify

from ..extensions import db
from ..models import Book, CartItem, Category, OrderItem
from .bookstore import (
    build_book_response,
    build_category_response,
    get_book_or_404,
    get_category_or_404,
    get_request_data,
    normalize_text,
    validate_book_payload,
)
from ..utils.auth import role_required


admin_bookstore_inventory_bp = Blueprint("admin_bookstore_inventory", __name__)


def internal_server_error_response():
    return jsonify({"status": "error", "message": "Internal server error."}), 500


def validate_category_payload(data):
    name = normalize_text(data.get("name"))

    if name is None:
        return None, "name is required."

    return {"name": name}, None


@admin_bookstore_inventory_bp.get("/categories")
@role_required("Admin")
def list_admin_categories():
    try:
        categories = Category.query.order_by(Category.id.asc()).all()

        return (
            jsonify(
                {
                    "status": "success",
                    "categories": [
                        build_category_response(category) for category in categories
                    ],
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.get("/categories/<int:category_id>")
@role_required("Admin")
def get_admin_category(category_id: int):
    try:
        category, error_response = get_category_or_404(category_id)
        if error_response is not None:
            return error_response

        return (
            jsonify(
                {
                    "status": "success",
                    "category": build_category_response(category),
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.post("/categories")
@role_required("Admin")
def create_admin_category():
    try:
        data = get_request_data()
        validated_data, validation_error = validate_category_payload(data)
        if validation_error is not None:
            return jsonify({"status": "error", "message": validation_error}), 400

        existing_category = Category.query.filter_by(name=validated_data["name"]).first()
        if existing_category is not None:
            return (
                jsonify(
                    {"status": "error", "message": "Category name already exists."}
                ),
                400,
            )

        category = Category(name=validated_data["name"])
        db.session.add(category)
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Category created successfully.",
                    "category": build_category_response(category),
                }
            ),
            201,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.put("/categories/<int:category_id>")
@role_required("Admin")
def update_admin_category(category_id: int):
    try:
        category, error_response = get_category_or_404(category_id)
        if error_response is not None:
            return error_response

        data = get_request_data()
        validated_data, validation_error = validate_category_payload(data)
        if validation_error is not None:
            return jsonify({"status": "error", "message": validation_error}), 400

        existing_category = Category.query.filter_by(name=validated_data["name"]).first()
        if existing_category is not None and existing_category.id != category.id:
            return (
                jsonify(
                    {"status": "error", "message": "Category name already exists."}
                ),
                400,
            )

        category.name = validated_data["name"]
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Category updated successfully.",
                    "category": build_category_response(category),
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.delete("/categories/<int:category_id>")
@role_required("Admin")
def delete_admin_category(category_id: int):
    try:
        category, error_response = get_category_or_404(category_id)
        if error_response is not None:
            return error_response

        has_books = Book.query.filter_by(category_id=category.id).first() is not None
        if has_books:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Category cannot be deleted because related books exist.",
                    }
                ),
                400,
            )

        db.session.delete(category)
        db.session.commit()

        return (
            jsonify({"status": "success", "message": "Category deleted successfully."}),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.get("/books")
@role_required("Admin")
def list_admin_books():
    try:
        books = Book.query.order_by(Book.id).all()

        return (
            jsonify(
                {
                    "status": "success",
                    "books": [build_book_response(book) for book in books],
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.get("/books/<int:book_id>")
@role_required("Admin")
def get_admin_book(book_id: int):
    try:
        book, error_response = get_book_or_404(book_id)
        if error_response is not None:
            return error_response

        return (
            jsonify({"status": "success", "book": build_book_response(book)}),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.post("/books")
@role_required("Admin")
def create_admin_book():
    try:
        data = get_request_data()
        validated_data, validation_error = validate_book_payload(data)
        if isinstance(validation_error, tuple):
            return validation_error
        if validation_error is not None:
            return jsonify({"status": "error", "message": validation_error}), 400

        book = Book(
            category_id=validated_data["category"].id,
            title=validated_data["title"],
            author=validated_data["author"],
            price=validated_data["price"],
            stock_quantity=validated_data["stock_quantity"],
        )
        db.session.add(book)
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Book created successfully.",
                    "book": build_book_response(book),
                }
            ),
            201,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.put("/books/<int:book_id>")
@role_required("Admin")
def update_admin_book(book_id: int):
    try:
        book, error_response = get_book_or_404(book_id)
        if error_response is not None:
            return error_response

        data = get_request_data()
        validated_data, validation_error = validate_book_payload(data)
        if isinstance(validation_error, tuple):
            return validation_error
        if validation_error is not None:
            return jsonify({"status": "error", "message": validation_error}), 400

        book.category_id = validated_data["category"].id
        book.title = validated_data["title"]
        book.author = validated_data["author"]
        book.price = validated_data["price"]
        book.stock_quantity = validated_data["stock_quantity"]
        db.session.commit()

        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Book updated successfully.",
                    "book": build_book_response(book),
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@admin_bookstore_inventory_bp.delete("/books/<int:book_id>")
@role_required("Admin")
def delete_admin_book(book_id: int):
    try:
        book, error_response = get_book_or_404(book_id)
        if error_response is not None:
            return error_response

        has_cart_items = CartItem.query.filter_by(book_id=book.id).first() is not None
        has_order_items = (
            OrderItem.query.filter_by(book_id=book.id).first() is not None
        )

        if has_cart_items or has_order_items:
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Book cannot be deleted because related records exist.",
                    }
                ),
                400,
            )

        db.session.delete(book)
        db.session.commit()

        return (
            jsonify({"status": "success", "message": "Book deleted successfully."}),
            200,
        )
    except Exception:
        return internal_server_error_response()
