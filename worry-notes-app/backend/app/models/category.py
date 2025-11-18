"""
Category Model
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ARRAY
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

from app.core.database import Base


class Category(Base):
    """Category model - for customization and tracking"""

    __tablename__ = "categories"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Names
    name = Column(String(50), unique=True, nullable=False)
    display_name_en = Column(String(100), nullable=False)
    display_name_ko = Column(String(100), nullable=False)

    # Description
    description = Column(Text)

    # AI Categorization
    keywords = Column(ARRAY(String))  # Keywords for AI categorization

    # Visual
    color = Column(String(7))  # Hex color code
    icon = Column(String(50))  # Icon identifier

    # Sorting
    sort_order = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Category {self.name}>"
