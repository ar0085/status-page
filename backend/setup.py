from setuptools import setup, find_packages

setup(
    name="status-page",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.115.12",
        "uvicorn==0.34.2",
        "sqlalchemy==2.0.28",
        "pydantic==2.11.4",
        "pydantic-settings==2.9.1",
        "alembic==1.13.1",
        "psycopg2-binary==2.9.9",
        "python-jose[cryptography]==3.4.0",
        "passlib[bcrypt]==1.7.4",
        "python-multipart==0.0.9",
        "email-validator==2.2.0",
        "python-socketio==5.11.1",
        "httpx==0.28.1",
    ],
)
