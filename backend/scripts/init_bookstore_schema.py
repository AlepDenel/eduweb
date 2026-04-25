from sqlalchemy import inspect

from app import create_app
from app.extensions import db


def main() -> None:
    app = create_app()

    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        print("Step 24 setup complete.")
        print(f"categories table exists: {'categories' in tables}")
        print(f"books table exists: {'books' in tables}")
        print(f"Current tables: {', '.join(sorted(tables))}")


if __name__ == "__main__":
    main()
