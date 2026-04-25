from sqlalchemy import inspect

from app import create_app
from app.extensions import db
from app.models import Role, User


def main() -> None:
    app = create_app()

    with app.app_context():
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        roles = Role.query.order_by(Role.id).all()
        user_count = User.query.count()

        print("Verification result:")
        print(f"Tables found: {', '.join(sorted(tables))}")
        print(f"roles table exists: {'roles' in tables}")
        print(f"users table exists: {'users' in tables}")
        print(f"Default roles: {', '.join(role.name for role in roles)}")
        print(f"User records count: {user_count}")


if __name__ == "__main__":
    main()
