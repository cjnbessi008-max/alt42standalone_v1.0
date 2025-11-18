"""
Tests for Focus Analyzer Service
"""
import pytest
from backend.services.focus_analyzer import FocusAnalyzer


class TestFocusAnalyzer:
    """Test cases for FocusAnalyzer."""

    def test_calculate_focus_score_perfect_session(self):
        """Test focus score calculation for a perfect session."""
        score = FocusAnalyzer.calculate_focus_score(
            active_time=3000,  # 50 minutes
            idle_time=0,
            interaction_count=150,
            context_switches=0,
            total_duration=3000
        )

        assert score > 90, "Perfect session should have high focus score"
        assert score <= 100, "Focus score should not exceed 100"

    def test_calculate_focus_score_poor_session(self):
        """Test focus score calculation for a poor session."""
        score = FocusAnalyzer.calculate_focus_score(
            active_time=300,  # 5 minutes active
            idle_time=2700,  # 45 minutes idle
            interaction_count=10,
            context_switches=20,
            total_duration=3000
        )

        assert score < 40, "Poor session should have low focus score"
        assert score >= 0, "Focus score should not be negative"

    def test_calculate_focus_score_zero_duration(self):
        """Test focus score calculation with zero duration."""
        score = FocusAnalyzer.calculate_focus_score(
            active_time=0,
            idle_time=0,
            interaction_count=0,
            context_switches=0,
            total_duration=0
        )

        assert score == 0, "Zero duration should result in zero score"

    def test_calculate_focus_score_moderate_session(self):
        """Test focus score calculation for a moderate session."""
        score = FocusAnalyzer.calculate_focus_score(
            active_time=2000,  # ~33 minutes
            idle_time=1000,  # ~17 minutes
            interaction_count=80,
            context_switches=3,
            total_duration=3000
        )

        assert 40 <= score <= 80, "Moderate session should have medium focus score"

    def test_calculate_engagement_score_empty_metrics(self):
        """Test engagement score with no metrics."""
        score = FocusAnalyzer.calculate_engagement_score([])
        assert score == 0, "Empty metrics should result in zero engagement score"
