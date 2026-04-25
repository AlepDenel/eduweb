from app import create_app
from app.extensions import db
from app.models import Role


DEFAULT_ROLES = ["Student", "Moderator", "Admin"]


def seed_roles() -> int:
    inserted_count = 0

    for role_name in DEFAULT_ROLES:
        existing_role = Role.query.filter_by(name=role_name).first()
        if existing_role is None:
            db.session.add(Role(name=role_name))
            inserted_count += 1

    if inserted_count > 0:
        db.session.commit()

    return inserted_count


def main() -> None:
    app = create_app()

    with app.app_context():
        db.create_all()
        inserted_count = seed_roles()
        role_names = [role.name for role in Role.query.order_by(Role.id).all()]

        print("Step 2 setup complete.")
        print("Tables ensured: roles, users")
        print(f"Default roles inserted: {inserted_count}")
        print(f"Current roles: {', '.join(role_names)}")


if __name__ == "__main__":
    main()
