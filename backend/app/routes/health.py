from flask import Blueprint, jsonify
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from ..extensions import db


health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    try:
        db.session.execute(text("SELECT 1"))
        return jsonify(
            {
                "status": "ok",
                "service": "edutech-backend",
                "database": "connected",
                "message": "Backend is running and the database connection is working.",
            }
        ), 200
    except SQLAlchemyError:
        return jsonify(
            {
                "status": "error",
                "service": "edutech-backend",
                "database": "unavailable",
                "message": "Backend is running but the database connection failed.",
            }
        ), 503
