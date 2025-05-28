from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database settings
    db_host: str = "localhost"
    db_port: str = "5432"
    db_user: str = "postgres"
    db_password: str = "admin"
    db_name: str = "postgres"

    # Auth settings
    JWT_SECRET: str = "your-secret-key"  # Default for development
    CLERK_SECRET_KEY: str

    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL from components"""
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"


settings = Settings()
