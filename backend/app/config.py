import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    APP_HOST = os.getenv("APP_HOST", "127.0.0.1")
    APP_PORT = int(os.getenv("APP_PORT", "5000"))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"

    @classmethod
    def validate(cls) -> None:
        required_values = {
            "SECRET_KEY": cls.SECRET_KEY,
            "DB_HOST": cls.DB_HOST,
            "DB_PORT": cls.DB_PORT,
            "DB_NAME": cls.DB_NAME,
            "DB_USER": cls.DB_USER,
            "DB_PASSWORD": cls.DB_PASSWORD,
        }
        missing_keys = [key for key, value in required_values.items() if not value]

        if missing_keys:
            missing_text = ", ".join(missing_keys)
            raise RuntimeError(
                "Missing environment variables: "
                f"{missing_text}. Copy '.env.example' to '.env' and fill in the values."
            )

    @classmethod
    def get_database_uri(cls) -> str:
        password = quote_plus(cls.DB_PASSWORD)
        return (
            f"mysql+pymysql://{cls.DB_USER}:{password}"
            f"@{cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}"
        )
