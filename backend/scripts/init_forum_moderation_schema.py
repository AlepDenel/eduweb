from sqlalchemy import inspect, text

from app import create_app
from app.extensions import db


def main() -> None:
    app = create_app()

    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        forum_post_columns = {
            column["name"] for column in inspector.get_columns("forum_posts")
        }

        if "is_hidden" not in forum_post_columns:
            db.session.execute(
                text(
                    "ALTER TABLE forum_posts ADD COLUMN is_hidden BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
            db.session.commit()

        if "moderated_at" not in forum_post_columns:
            db.session.execute(
                text("ALTER TABLE forum_posts ADD COLUMN moderated_at DATETIME NULL")
            )
            db.session.commit()

        if "moderated_by_user_id" not in forum_post_columns:
            db.session.execute(
                text("ALTER TABLE forum_posts ADD COLUMN moderated_by_user_id INT NULL")
            )
            db.session.commit()

        inspector = inspect(db.engine)
        foreign_keys = inspector.get_foreign_keys("forum_posts")
        foreign_key_names = {foreign_key.get("name") for foreign_key in foreign_keys}

        if "fk_forum_posts_moderated_by_user" not in foreign_key_names:
            db.session.execute(
                text(
                    "ALTER TABLE forum_posts "
                    "ADD CONSTRAINT fk_forum_posts_moderated_by_user "
                    "FOREIGN KEY (moderated_by_user_id) REFERENCES users(id) "
                    "ON DELETE SET NULL"
                )
            )
            db.session.commit()

        inspector = inspect(db.engine)
        forum_post_columns = {
            column["name"] for column in inspector.get_columns("forum_posts")
        }

        print("Step 23 setup complete.")
        print(f"is_hidden exists: {'is_hidden' in forum_post_columns}")
        print(f"moderated_at exists: {'moderated_at' in forum_post_columns}")
        print(
            "moderated_by_user_id exists: "
            f"{'moderated_by_user_id' in forum_post_columns}"
        )


if __name__ == "__main__":
    main()
