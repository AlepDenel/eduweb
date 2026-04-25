from ..extensions import db


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

    users = db.relationship("User", back_populates="role", lazy=True)

    def __repr__(self) -> str:
        return f"<Role {self.name}>"
