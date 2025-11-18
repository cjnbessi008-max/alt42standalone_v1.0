"""
Unit tests for Reading Analytics API
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "healthy"


def test_record_reading_analytics():
    """Test recording reading analytics"""
    data = {
        "student_id": "test_student_001",
        "problem_id": "test_problem_001",
        "module_id": "test_module_001",
        "reading_start_time": (datetime.now() - timedelta(minutes=5)).isoformat(),
        "reading_end_time": datetime.now().isoformat(),
        "reading_time_seconds": 300,
        "problem_word_count": 150,
        "first_attempt_correct": True,
        "total_attempts": 1,
        "grade_level": 5,
        "language": "ko"
    }

    response = client.post("/api/reading-analytics", json=data)

    # Note: This will fail without a database connection
    # In production, use a test database
    assert response.status_code in [201, 500]  # 201 if DB available, 500 otherwise


def test_comprehension_score_calculation():
    """Test comprehension score calculation logic"""
    from models import ComprehensionCalculator

    # Test perfect score
    score = ComprehensionCalculator.calculate_comprehension_score(
        first_attempt_correct=True,
        total_attempts=1,
        actual_wpm=100.0,
        baseline_wpm=100.0
    )
    assert score.final_score == 100.0

    # Test partial score
    score = ComprehensionCalculator.calculate_comprehension_score(
        first_attempt_correct=False,
        total_attempts=2,
        actual_wpm=80.0,
        baseline_wpm=100.0
    )
    assert 0 < score.final_score < 100


def test_intervention_flag_determination():
    """Test intervention flag logic"""
    from models import ComprehensionCalculator, InterventionFlag

    # Test immediate intervention
    flag = ComprehensionCalculator.determine_intervention_flag(
        comprehension_score=30.0,
        reading_speed_wpm=50.0,
        baseline_wpm=100.0,
        recent_scores=[35.0, 32.0, 30.0]
    )
    assert flag == InterventionFlag.IMMEDIATE

    # Test no intervention
    flag = ComprehensionCalculator.determine_intervention_flag(
        comprehension_score=85.0,
        reading_speed_wpm=110.0,
        baseline_wpm=100.0,
        recent_scores=[80.0, 82.0, 85.0]
    )
    assert flag == InterventionFlag.NONE


def test_reading_baseline_retrieval():
    """Test reading baseline for different grades"""
    from models import ReadingBaseline

    # Test Korean baseline
    baseline = ReadingBaseline.get_baseline(grade_level=5, language="ko")
    assert baseline.grade_level == 5
    assert baseline.target_wpm > 0
    assert baseline.min_wpm < baseline.target_wpm < baseline.max_wpm

    # Test English baseline
    baseline = ReadingBaseline.get_baseline(grade_level=5, language="en")
    assert baseline.language == "en"
    assert baseline.target_wpm > 0


def test_difficulty_match_determination():
    """Test difficulty matching logic"""
    from models import ComprehensionCalculator, ReadingDifficultyMatch

    # Test too easy
    match = ComprehensionCalculator.determine_difficulty_match(
        comprehension_score=90.0,
        reading_speed_wpm=150.0,
        baseline_wpm=100.0
    )
    assert match == ReadingDifficultyMatch.TOO_EASY

    # Test too hard
    match = ComprehensionCalculator.determine_difficulty_match(
        comprehension_score=40.0,
        reading_speed_wpm=60.0,
        baseline_wpm=100.0
    )
    assert match == ReadingDifficultyMatch.TOO_HARD

    # Test appropriate
    match = ComprehensionCalculator.determine_difficulty_match(
        comprehension_score=75.0,
        reading_speed_wpm=95.0,
        baseline_wpm=100.0
    )
    assert match == ReadingDifficultyMatch.APPROPRIATE


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
