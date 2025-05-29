from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # Database settings - Use DATABASE_URL if provided (for production), otherwise construct from components
    DATABASE_URL: Optional[str] = None
    db_host: str = "localhost"
    db_port: str = "5432"
    db_user: str = "postgres"
    db_password: str = "admin"
    db_name: str = "postgres"

    # Auth settings
    JWT_SECRET: str = "your-secret-key"  # Default for development
    CLERK_SECRET_KEY: str = ""

    # Environment settings
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"

    # Frontend URLs for CORS
    FRONTEND_URL: Optional[str] = None
    ALLOWED_ORIGINS: str = ""

    # Demo data configuration
    CREATE_DEMO_DATA: bool = (
        False  # Set to true in production for one-time demo data creation
    )
    ALLOW_TEST_USERS: bool = False  # Allow test users in production

    def get_database_url(self) -> str:
        """Get database URL - prioritize DATABASE_URL env var for production"""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # Fallback to constructed URL for development
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
