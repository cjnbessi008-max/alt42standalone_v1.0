"""Database connection management"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import redis

# Moodle Database (MySQL 5.7 - Read-only)
MOODLE_DATABASE_URL = (
    f"mysql+pymysql://{settings.MOODLE_DB_USER}:{settings.MOODLE_DB_PASSWORD}"
    f"@{settings.MOODLE_DB_HOST}:{settings.MOODLE_DB_PORT}/{settings.MOODLE_DB_NAME}"
)

moodle_engine = create_engine(
    MOODLE_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

MoodleSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=moodle_engine)
MoodleBase = declarative_base()


# Application Database (PostgreSQL)
APP_DATABASE_URL = (
    f"postgresql://{settings.APP_DB_USER}:{settings.APP_DB_PASSWORD}"
    f"@{settings.APP_DB_HOST}:{settings.APP_DB_PORT}/{settings.APP_DB_NAME}"
)

app_engine = create_engine(
    APP_DATABASE_URL,
    pool_pre_ping=True,
    echo=False
)

AppSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=app_engine)
AppBase = declarative_base()


# Redis Cache
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)


def get_moodle_db():
    """Get Moodle database session"""
    db = MoodleSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_app_db():
    """Get application database session"""
    db = AppSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_redis():
    """Get Redis client"""
    return redis_client
