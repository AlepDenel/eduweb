from sqlalchemy import inspect, text

from app import create_app
from app.extensions import db


def main() -> None:
    app = create_app()

    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        question_columns = {column["name"] for column in inspector.get_columns("questions")}

        if "correct_short_answer" not in question_columns:
            db.session.execute(text("ALTER TABLE questions ADD COLUMN correct_short_answer TEXT NULL"))
            db.session.commit()
            inspector = inspect(db.engine)
            question_columns = {
                column["name"] for column in inspector.get_columns("questions")
            }

        print("Step 13 setup complete.")
        print(f"correct_short_answer exists: {'correct_short_answer' in question_columns}")


if __name__ == "__main__":
    main()
