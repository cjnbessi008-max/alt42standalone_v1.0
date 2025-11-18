from sqlalchemy import Column, String, Text, Boolean, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from .base import BaseModel


class LMSIntegration(BaseModel):
    """LMS integration configuration model"""
    __tablename__ = "lms_integrations"

    name = Column(String(255), nullable=False)
    lms_type = Column(String(50), nullable=False)  # canvas, moodle, blackboard, etc.

    # LTI 1.3 Configuration
    issuer = Column(String(500), nullable=False)
    client_id = Column(String(255), nullable=False)
    auth_login_url = Column(String(500), nullable=False)
    auth_token_url = Column(String(500), nullable=False)
    key_set_url = Column(String(500), nullable=False)

    # OAuth credentials
    deployment_id = Column(String(255))

    # Configuration
    public_key = Column(Text)
    private_key = Column(Text)

    # Settings
    is_active = Column(Boolean, default=True)
    settings = Column(JSONB)

    # Metadata
    last_sync = Column(DateTime)
