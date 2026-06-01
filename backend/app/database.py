import time
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
from .config import settings

# For PostgreSQL, we create the engine
# We use connect_args only if it's SQLite, which is not the case here.
engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """
    Dependency to get a database session.
    Closes the session after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_db(max_retries: int = 10, delay: int = 3):
    """
    Wait for the database to become responsive before starting the application.
    This is highly useful when spinning up services via docker-compose.
    """
    print("Connecting to the database...")
    for i in range(max_retries):
        try:
            # Try to connect and run a simple query
            conn = engine.connect()
            conn.close()
            print("Successfully connected to the database!")
            return True
        except OperationalError as e:
            print(f"Database not ready yet (attempt {i+1}/{max_retries}). Retrying in {delay}s...")
            time.sleep(delay)
    
    print("Could not connect to the database. Exiting...")
    raise Exception("Database connection failed")
