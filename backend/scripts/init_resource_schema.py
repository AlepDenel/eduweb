from sqlalchemy import inspect

from app import create_app
from app.extensions import db


def main() -> None:
    app = create_app()

    with app.app_context():
        db.create_all()
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()

        print("Step 7 setup complete.")
        print(f"resources table exists: {'resources' in tables}")
        print(f"Current tables: {', '.join(sorted(tables))}")


if __name__ == "__main__":
    main()
