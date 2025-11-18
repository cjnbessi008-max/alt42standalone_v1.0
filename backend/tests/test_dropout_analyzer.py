"""
Unit tests for Dropout Analyzer
"""
import pytest
from app.services.dropout_analyzer import DropoutAnalyzer, DropoutMetrics, SessionData


class TestDropoutMetrics:
    """Test DropoutMetrics calculations"""

    def test_idle_time_ratio(self):
        """Test idle time ratio calculation"""
        session_data = SessionData(
            session_id="test-session",
            student_id="test-student",
            module_id="test-module",
            total_duration_seconds=1000,
            active_duration_seconds=600,
            events=[],
            attempts=[],
            dropout_point=None
        )
        metrics = DropoutMetrics(session_data)
        assert metrics.calculate_idle_time_ratio() == 0.4

    def test_accuracy_rate(self):
        """Test accuracy rate calculation"""
        session_data = SessionData(
            session_id="test-session",
            student_id="test-student",
            module_id="test-module",
            total_duration_seconds=1000,
            active_duration_seconds=800,
            events=[],
            attempts=[
                {'is_correct': True, 'time_spent_seconds': 30},
                {'is_correct': False, 'time_spent_seconds': 20},
                {'is_correct': True, 'time_spent_seconds': 25},
                {'is_correct': True, 'time_spent_seconds': 35},
            ],
            dropout_point=None
        )
        metrics = DropoutMetrics(session_data)
        assert metrics.calculate_accuracy_rate() == 0.75

    def test_consecutive_errors(self):
        """Test consecutive errors calculation"""
        session_data = SessionData(
            session_id="test-session",
            student_id="test-student",
            module_id="test-module",
            total_duration_seconds=1000,
            active_duration_seconds=800,
            events=[],
            attempts=[
                {'is_correct': True, 'time_spent_seconds': 30},
                {'is_correct': False, 'time_spent_seconds': 20},
                {'is_correct': False, 'time_spent_seconds': 25},
                {'is_correct': False, 'time_spent_seconds': 35},
            ],
            dropout_point=None
        )
        metrics = DropoutMetrics(session_data)
        current, max_errors = metrics.calculate_consecutive_errors()
        assert current == 3
        assert max_errors == 3


class TestDropoutAnalyzer:
    """Test DropoutAnalyzer"""

    def test_high_error_rate_detection(self):
        """Test high error rate detection"""
        session_data = SessionData(
            session_id="test-session",
            student_id="test-student",
            module_id="test-module",
            total_duration_seconds=600,
            active_duration_seconds=500,
            events=[],
            attempts=[
                {'is_correct': False, 'time_spent_seconds': 30, 'hints_used': 0},
                {'is_correct': False, 'time_spent_seconds': 25, 'hints_used': 1},
                {'is_correct': False, 'time_spent_seconds': 35, 'hints_used': 2},
                {'is_correct': False, 'time_spent_seconds': 40, 'hints_used': 1},
                {'is_correct': False, 'time_spent_seconds': 30, 'hints_used': 0},
            ],
            dropout_point="problem_5"
        )

        analyzer = DropoutAnalyzer()
        result = analyzer.analyze_session(session_data)

        assert result['primary_reason'] == 'high_error_rate'
        assert result['confidence'] > 0.5

    def test_session_fatigue_detection(self):
        """Test session fatigue detection"""
        session_data = SessionData(
            session_id="test-session",
            student_id="test-student",
            module_id="test-module",
            total_duration_seconds=7200,  # 2 hours
            active_duration_seconds=5400,
            events=[],
            attempts=[
                {'is_correct': True, 'time_spent_seconds': 30, 'hints_used': 0}
                for _ in range(50)
            ],
            dropout_point="problem_50"
        )

        analyzer = DropoutAnalyzer()
        result = analyzer.analyze_session(session_data)

        assert result['primary_reason'] == 'session_fatigue'

    def test_recommendations(self):
        """Test recommendations generation"""
        analyzer = DropoutAnalyzer()
        recommendations = analyzer.RECOMMENDATIONS['high_error_rate']

        assert 'ko' in recommendations
        assert 'en' in recommendations
        assert 'actions' in recommendations
        assert len(recommendations['actions']) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
