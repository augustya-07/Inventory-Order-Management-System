import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Inventory & Order Management System"
    API_V1_STR: str = "/api/v1"
    
    # Defaulting to a local PostgreSQL container URL for local development
    _db_url = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@db:5432/inventory_db"
    )
    # Platforms like Render/Railway sometimes inject 'postgres://' which SQLAlchemy 1.4+ does not support.
    # We automatically rewrite it to 'postgresql://' for seamless production deployment.
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
        
    DATABASE_URL: str = _db_url

settings = Settings()
