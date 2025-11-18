"""
Tests for Recommendation Engine Service
"""
import pytest
from backend.services.recommendation_engine import RecommendationEngine


class TestRecommendationEngine:
    """Test cases for RecommendationEngine."""

    def test_day_names_constant(self):
        """Test that day names are correctly defined."""
        assert len(RecommendationEngine.DAY_NAMES) == 7
        assert RecommendationEngine.DAY_NAMES[0] == "Monday"
        assert RecommendationEngine.DAY_NAMES[6] == "Sunday"

    def test_calculate_confidence_high_sessions(self):
        """Test confidence calculation with many sessions."""
        confidence = RecommendationEngine.calculate_confidence(
            session_count=20,
            score_std_dev=5.0
        )

        assert confidence > 70, "Many sessions with low std dev should have high confidence"
        assert confidence <= 100, "Confidence should not exceed 100"

    def test_calculate_confidence_few_sessions(self):
        """Test confidence calculation with few sessions."""
        confidence = RecommendationEngine.calculate_confidence(
            session_count=2,
            score_std_dev=15.0
        )

        assert confidence < 50, "Few sessions with high std dev should have low confidence"
        assert confidence >= 0, "Confidence should not be negative"

    def test_calculate_confidence_perfect_consistency(self):
        """Test confidence with perfect consistency (zero std dev)."""
        confidence = RecommendationEngine.calculate_confidence(
            session_count=10,
            score_std_dev=0.0
        )

        assert confidence > 50, "Perfect consistency should boost confidence"

    def test_calculate_confidence_high_variance(self):
        """Test confidence with high variance."""
        confidence = RecommendationEngine.calculate_confidence(
            session_count=10,
            score_std_dev=25.0
        )

        # High variance should reduce confidence
        assert confidence < RecommendationEngine.calculate_confidence(10, 5.0)
