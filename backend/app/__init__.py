from flask import Flask

from .config import Config
from .extensions import db
from .models import (
    AnswerOption,
    AttemptAnswer,
    Book,
    Cart,
    CartItem,
    Category,
    Course,
    ForumPost,
    ForumReport,
    ForumThread,
    Module,
    Order,
    OrderItem,
    ProgressRecord,
    Question,
    Quiz,
    QuizAttempt,
    Resource,
    Role,
    SavedResource,
    User,
)
from .routes.answer_options import answer_options_bp
from .routes.admin_answer_options import admin_answer_options_bp
from .routes.admin_bookstore_inventory import admin_bookstore_inventory_bp
from .routes.admin_orders import admin_orders_bp
from .routes.admin_courses import admin_courses_bp
from .routes.admin_modules import admin_modules_bp
from .routes.admin_questions import admin_questions_bp
from .routes.admin_quizzes import admin_quizzes_bp
from .routes.admin_resources import admin_resources_bp
from .routes.admin_users import admin_users_bp
from .routes.attempt_answers import attempt_answers_bp
from .routes.auth import auth_bp
from .routes.bookstore import bookstore_bp
from .routes.cart import cart_bp
from .routes.checkout import checkout_bp
from .routes.courses import courses_bp
from .routes.forum_moderation import forum_moderation_bp
from .routes.forum_posts import forum_posts_bp
from .routes.forum_reports import forum_reports_bp
from .routes.forum_threads import forum_threads_bp
from .routes.grading import grading_bp
from .routes.health import health_bp
from .routes.homepage import homepage_bp
from .routes.modules import modules_bp
from .routes.portal_progress import portal_progress_bp
from .routes.protected import protected_bp
from .routes.progress import progress_bp
from .routes.questions import questions_bp
from .routes.quiz_attempts import quiz_attempts_bp
from .routes.quizzes import quizzes_bp
from .routes.resources import resources_bp
from .routes.saved_resources import saved_resources_bp


def create_app() -> Flask:
    Config.validate()

    app = Flask(__name__)
    app.config.from_object(Config)
    app.config["SQLALCHEMY_DATABASE_URI"] = Config.get_database_uri()

    db.init_app(app)
    app.register_blueprint(admin_answer_options_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_bookstore_inventory_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_courses_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_modules_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_questions_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_quizzes_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_resources_bp, url_prefix="/api/admin")
    app.register_blueprint(admin_orders_bp, url_prefix="/api")
    app.register_blueprint(admin_users_bp, url_prefix="/api/admin")
    app.register_blueprint(answer_options_bp, url_prefix="/api")
    app.register_blueprint(attempt_answers_bp, url_prefix="/api")
    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(bookstore_bp, url_prefix="/api")
    app.register_blueprint(cart_bp, url_prefix="/api")
    app.register_blueprint(checkout_bp, url_prefix="/api")
    app.register_blueprint(courses_bp, url_prefix="/api")
    app.register_blueprint(forum_moderation_bp, url_prefix="/api")
    app.register_blueprint(forum_posts_bp, url_prefix="/api")
    app.register_blueprint(forum_reports_bp, url_prefix="/api")
    app.register_blueprint(forum_threads_bp, url_prefix="/api")
    app.register_blueprint(grading_bp, url_prefix="/api")
    app.register_blueprint(modules_bp, url_prefix="/api")
    app.register_blueprint(homepage_bp, url_prefix="/api")
    app.register_blueprint(portal_progress_bp, url_prefix="/api")
    app.register_blueprint(protected_bp, url_prefix="/api")
    app.register_blueprint(progress_bp, url_prefix="/api")
    app.register_blueprint(questions_bp, url_prefix="/api")
    app.register_blueprint(quiz_attempts_bp, url_prefix="/api")
    app.register_blueprint(quizzes_bp, url_prefix="/api")
    app.register_blueprint(resources_bp, url_prefix="/api")
    app.register_blueprint(saved_resources_bp, url_prefix="/api")

    return app
