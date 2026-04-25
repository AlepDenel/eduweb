from decimal import Decimal, InvalidOperation

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from ..extensions import db
from ..models import Book, Category
from ..utils.auth import login_required, role_required


bookstore_bp = Blueprint("bookstore", __name__)


def get_request_data():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else {}


def normalize_text(value):
    if not isinstance(value, str):
        return None

    text = value.strip()
    return text or None


def parse_category_id(value):
    try:
        return int(value), None
    except (TypeError, ValueError):
        return None, "category_id must be a whole number."


def parse_price(value):
    if value in (None, ""):
        return None, "price is required."

    try:
        price = Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None, "price must be a valid number."

    if price < 0:
        return None, "price cannot be negative."

    return price, None


def parse_stock_quantity(value):
    try:
        stock_quantity = int(value)
    except (TypeError, ValueError):
        return None, "stock_quantity must be a whole number."

    if stock_quantity < 0:
        return None, "stock_quantity cannot be negative."

    return stock_quantity, None


def build_category_response(category: Category):
    return {
        "id": category.id,
        "name": category.name,
        "created_at": category.created_at.isoformat(),
    }


def build_book_response(book: Book):
    return {
        "id": book.id,
        "category_id": book.category_id,
        "category_name": book.category.name,
        "title": book.title,
        "author": book.author,
        "price": str(book.price),
        "stock_quantity": book.stock_quantity,
        "created_at": book.created_at.isoformat(),
    }


def get_book_or_404(book_id: int):
    book = db.session.get(Book, book_id)
    if book is None:
        return None, (
            jsonify({"status": "error", "message": "Book not found."}),
            404,
        )

    return book, None


def get_category_or_404(category_id: int):
    category = db.session.get(Category, category_id)
    if category is None:
        return None, (
            jsonify({"status": "error", "message": "Category not found."}),
            404,
        )

    return category, None


def validate_book_payload(data):
    title = normalize_text(data.get("title"))
    author = normalize_text(data.get("author"))
    category_id_raw = data.get("category_id")
    stock_quantity_raw = data.get("stock_quantity")

    if title is None:
        return None, "title is required."

    if author is None:
        return None, "author is required."

    category_id, category_error = parse_category_id(category_id_raw)
    if category_error:
        return None, category_error

    price, price_error = parse_price(data.get("price"))
    if price_error:
        return None, price_error

    stock_quantity, stock_error = parse_stock_quantity(stock_quantity_raw)
    if stock_error:
        return None, stock_error

    category, category_response = get_category_or_404(category_id)
    if category_response is not None:
        return None, category_response

    return {
        "title": title,
        "author": author,
        "category": category,
        "price": price,
        "stock_quantity": stock_quantity,
    }, None


@bookstore_bp.get("/book-categories")
@login_required
def list_book_categories():
    categories = Category.query.order_by(Category.name).all()

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


@bookstore_bp.post("/book-categories")
@role_required("Admin")
def create_book_category():
    data = get_request_data()
    name = normalize_text(data.get("name"))

    if name is None:
        return jsonify({"status": "error", "message": "name is required."}), 400

    existing_category = Category.query.filter_by(name=name).first()
    if existing_category is not None:
        return (
            jsonify({"status": "error", "message": "Category name already exists."}),
            400,
        )

    category = Category(name=name)
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


@bookstore_bp.get("/books")
@login_required
def list_books():
    books_query = Book.query.join(Category)

    category_id_raw = request.args.get("category_id")
    if category_id_raw not in (None, ""):
        category_id, category_error = parse_category_id(category_id_raw)
        if category_error:
            return jsonify({"status": "error", "message": category_error}), 400

        books_query = books_query.filter(Book.category_id == category_id)

    search = normalize_text(request.args.get("search"))
    if search is not None:
        pattern = f"%{search}%"
        books_query = books_query.filter(
            or_(Book.title.ilike(pattern), Book.author.ilike(pattern))
        )

    books = books_query.order_by(Book.id).all()

    return (
        jsonify(
            {
                "status": "success",
                "books": [build_book_response(book) for book in books],
            }
        ),
        200,
    )


@bookstore_bp.get("/books/<int:book_id>")
@login_required
def get_book(book_id: int):
    book, error_response = get_book_or_404(book_id)
    if error_response is not None:
        return error_response

    return (
        jsonify({"status": "success", "book": build_book_response(book)}),
        200,
    )


@bookstore_bp.post("/books")
@role_required("Admin")
def create_book():
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


@bookstore_bp.put("/books/<int:book_id>")
@role_required("Admin")
def update_book(book_id: int):
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


@bookstore_bp.delete("/books/<int:book_id>")
@role_required("Admin")
def delete_book(book_id: int):
    book, error_response = get_book_or_404(book_id)
    if error_response is not None:
        return error_response

    db.session.delete(book)
    db.session.commit()

    return (
        jsonify({"status": "success", "message": "Book deleted successfully."}),
        200,
    )
