from flask import Blueprint, jsonify

from ..models import Book, Category, Course
from .bookstore import build_book_response
from .courses import build_course_response


homepage_bp = Blueprint("homepage", __name__)


def get_featured_courses():
    courses = (
        Course.query.order_by(Course.created_at.desc(), Course.id.desc())
        .limit(5)
        .all()
    )
    return [build_course_response(course) for course in courses]


def get_popular_books():
    books = (
        Book.query.join(Category)
        .order_by(Book.created_at.desc(), Book.id.desc())
        .limit(5)
        .all()
    )
    return [build_book_response(book) for book in books]


def get_announcements():
    return []


def internal_server_error_response():
    return jsonify({"status": "error", "message": "Internal server error."}), 500


@homepage_bp.get("/homepage")
def get_homepage():
    try:
        return (
            jsonify(
                {
                    "status": "success",
                    "homepage": {
                        "featured_courses": get_featured_courses(),
                        "popular_books": get_popular_books(),
                        "announcements": get_announcements(),
                    },
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@homepage_bp.get("/homepage/featured-courses")
def get_homepage_featured_courses():
    try:
        return (
            jsonify(
                {
                    "status": "success",
                    "featured_courses": get_featured_courses(),
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@homepage_bp.get("/homepage/popular-books")
def get_homepage_popular_books():
    try:
        return (
            jsonify(
                {
                    "status": "success",
                    "popular_books": get_popular_books(),
                }
            ),
            200,
        )
    except Exception:
        return internal_server_error_response()


@homepage_bp.get("/homepage/announcements")
def get_homepage_announcements():
    return jsonify({"status": "success", "announcements": get_announcements()}), 200
