"""
Pytest configuration and fixtures
"""
import pytest
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpassword123",
        "full_name": "Test User",
        "role": "student"
    }


@pytest.fixture
def sample_session_data():
    """Sample focus session data for testing."""
    return {
        "user_id": 1,
        "module_name": "Test Module",
        "day_of_week": 1,  # Tuesday
        "hour_of_day": 14,  # 2 PM
        "active_time_seconds": 2000,
        "idle_time_seconds": 500,
        "interaction_count": 50,
        "context_switches": 2
    }
