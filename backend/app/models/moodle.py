"""Moodle configuration model."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class MoodleConfig(Base, TimestampMixin):
    """Moodle LMS configuration for integration."""

    __tablename__ = "moodle_config"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # Moodle connection details
    moodle_url: Mapped[str] = mapped_column(
        String(255), nullable=False
    )  # e.g., 'https://moodle.example.com'
    api_token: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # Moodle web services token

    # Sync settings
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auto_sync_interval_minutes: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )  # NULL means manual sync only
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_sync_status: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # 'success', 'failed', 'partial'
    last_sync_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Sync filters
    course_ids: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated course IDs to sync, NULL means all
    quiz_types: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # Comma-separated quiz types, NULL means all

    # Grade sync settings
    sync_grades_back: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # Whether to send grades back to Moodle

    def __repr__(self) -> str:
        return f"<MoodleConfig(id={self.id}, url={self.moodle_url}, sync_enabled={self.sync_enabled})>"
