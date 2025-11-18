"""
Unit tests for DMN Detection Service
"""

import pytest
from datetime import datetime, timedelta
from uuid import uuid4

import sys
sys.path.insert(0, '/home/user/alt42standalone_v1.0/backend')

from services.dmn_detection_service import (
    DMNDetectionService,
    DMNDetectionConfig,
    ActivityEvent,
    SessionContext,
    CognitivePatternDetector,
)


class TestDMNDetectionService:
    """Test suite for DMN Detection Service"""

    @pytest.fixture
    def service(self):
        """Create DMN detection service instance"""
        return DMNDetectionService()

    @pytest.fixture
    def sample_session(self):
        """Create sample session context"""
        return SessionContext(
            session_id=uuid4(),
            student_id=uuid4(),
            started_at=datetime.utcnow() - timedelta(minutes=30),
            duration_minutes=30.0,
            total_interactions=60,
            recent_activities=[],
            error_rate=0.15
        )

    def test_initialization(self, service):
        """Test service initialization"""
        assert service is not None
        assert isinstance(service.config, DMNDetectionConfig)

    def test_active_learning_state(self, service, sample_session):
        """Test detection of active learning state (low fatigue)"""
        # Create activity with good performance
        activity = ActivityEvent(
            event_id="evt_1",
            student_id=sample_session.student_id,
            session_id=sample_session.session_id,
            event_type="submit",
            timestamp=datetime.utcnow(),
            response_time_ms=2000,
            is_correct=True
        )

        sample_session.duration_minutes = 15.0  # Short session
        sample_session.recent_activities = [activity]

        dmn_score = service.analyze_activity(activity, sample_session)

        assert dmn_score.dmn_score < 0.40
        assert dmn_score.fatigue_level == "active"
        assert not dmn_score.recommendation_triggered

    def test_moderate_fatigue_state(self, service, sample_session):
        """Test detection of moderate fatigue"""
        # Create activity with declining performance
        activity = ActivityEvent(
            event_id="evt_2",
            student_id=sample_session.student_id,
            session_id=sample_session.session_id,
            event_type="submit",
            timestamp=datetime.utcnow(),
            response_time_ms=5000,  # Slow response
            is_correct=False  # Error
        )

        sample_session.duration_minutes = 45.0  # Long session
        sample_session.error_rate = 0.35  # High error rate
        sample_session.recent_activities = [activity] * 10

        dmn_score = service.analyze_activity(activity, sample_session)

        assert dmn_score.dmn_score >= 0.65
        assert dmn_score.fatigue_level in ["moderate", "high"]
        assert dmn_score.recommendation_triggered

    def test_study_duration_scoring(self, service, sample_session):
        """Test study duration impact on DMN score"""
        activity = ActivityEvent(
            event_id="evt_3",
            student_id=sample_session.student_id,
            session_id=sample_session.session_id,
            event_type="click",
            timestamp=datetime.utcnow()
        )

        # Test short session
        sample_session.duration_minutes = 10.0
        score_short = service._calculate_study_duration_score(sample_session)
        assert score_short == 0.0

        # Test optimal session
        sample_session.duration_minutes = 25.0
        score_optimal = service._calculate_study_duration_score(sample_session)
        assert score_optimal == 0.0

        # Test long session
        sample_session.duration_minutes = 60.0
        score_long = service._calculate_study_duration_score(sample_session)
        assert score_long > 0.5

        # Test very long session
        sample_session.duration_minutes = 100.0
        score_very_long = service._calculate_study_duration_score(sample_session)
        assert score_very_long == 1.0

    def test_error_rate_scoring(self, service, sample_session):
        """Test error rate impact on DMN score"""
        # Create activities with varying correctness
        correct_activities = [
            ActivityEvent(
                event_id=f"evt_{i}",
                student_id=sample_session.student_id,
                session_id=sample_session.session_id,
                event_type="submit",
                timestamp=datetime.utcnow(),
                is_correct=True
            )
            for i in range(8)
        ]

        incorrect_activities = [
            ActivityEvent(
                event_id=f"evt_{i}",
                student_id=sample_session.student_id,
                session_id=sample_session.session_id,
                event_type="submit",
                timestamp=datetime.utcnow(),
                is_correct=False
            )
            for i in range(2)
        ]

        sample_session.recent_activities = correct_activities + incorrect_activities
        sample_session.error_rate = 0.2

        score = service._calculate_error_rate_score(sample_session)
        assert 0.0 <= score <= 1.0

    def test_sensitivity_adjustment(self, service, sample_session):
        """Test student sensitivity adjustment"""
        activity = ActivityEvent(
            event_id="evt_4",
            student_id=sample_session.student_id,
            session_id=sample_session.session_id,
            event_type="submit",
            timestamp=datetime.utcnow()
        )

        sample_session.duration_minutes = 50.0

        # Normal sensitivity
        score_normal = service.analyze_activity(activity, sample_session, student_sensitivity=1.0)

        # High sensitivity (more sensitive to fatigue)
        score_high = service.analyze_activity(activity, sample_session, student_sensitivity=1.5)

        # Low sensitivity (less sensitive to fatigue)
        score_low = service.analyze_activity(activity, sample_session, student_sensitivity=0.7)

        assert score_high.dmn_score > score_normal.dmn_score
        assert score_low.dmn_score < score_normal.dmn_score

    def test_component_weights_sum(self, service):
        """Test that component weights sum to 1.0"""
        config = service.config
        total_weight = (
            config.WEIGHT_INTERACTION_SLOWDOWN +
            config.WEIGHT_ERROR_RATE +
            config.WEIGHT_STUDY_DURATION +
            config.WEIGHT_ENGAGEMENT +
            config.WEIGHT_IDLE_TIME
        )
        assert abs(total_weight - 1.0) < 0.001

    def test_fatigue_level_thresholds(self, service):
        """Test fatigue level determination"""
        assert service._determine_fatigue_level(0.30) == "active"
        assert service._determine_fatigue_level(0.50) == "mild"
        assert service._determine_fatigue_level(0.70) == "moderate"
        assert service._determine_fatigue_level(0.90) == "high"


class TestCognitivePatternDetector:
    """Test suite for Cognitive Pattern Detector"""

    def test_mind_wandering_detection(self):
        """Test mind wandering pattern detection"""
        # Simulate rapid, low-quality interactions
        activities = [
            ActivityEvent(
                event_id=f"evt_{i}",
                student_id=uuid4(),
                session_id=uuid4(),
                event_type="click",
                timestamp=datetime.utcnow() - timedelta(seconds=i),
                response_time_ms=800,
                interaction_quality=0.2
            )
            for i in range(10)
        ]

        is_wandering = CognitivePatternDetector.detect_mind_wandering(activities)
        assert is_wandering

    def test_frustration_detection(self):
        """Test frustration pattern detection"""
        # Simulate repeated errors with rapid retries
        activities = []
        base_time = datetime.utcnow()

        for i in range(6):
            activities.append(
                ActivityEvent(
                    event_id=f"evt_{i}",
                    student_id=uuid4(),
                    session_id=uuid4(),
                    event_type="submit",
                    timestamp=base_time + timedelta(seconds=i * 3),
                    is_correct=False
                )
            )

        is_frustrated = CognitivePatternDetector.detect_frustration(activities)
        assert is_frustrated

    def test_flow_state_detection(self):
        """Test flow state pattern detection"""
        # Simulate consistent, high-quality interactions
        activities = [
            ActivityEvent(
                event_id=f"evt_{i}",
                student_id=uuid4(),
                session_id=uuid4(),
                event_type="submit",
                timestamp=datetime.utcnow() - timedelta(seconds=i * 10),
                response_time_ms=2000 + (i % 3) * 200,  # Low variance
                is_correct=True,
                interaction_quality=0.9
            )
            for i in range(15)
        ]

        is_in_flow = CognitivePatternDetector.detect_zone_of_flow(activities)
        assert is_in_flow


class TestUtilityFunctions:
    """Test utility functions"""

    def test_time_of_day_factor(self):
        """Test time of day fatigue factor calculation"""
        from services.dmn_detection_service import calculate_time_of_day_factor

        morning = datetime.strptime("09:00", "%H:%M")
        afternoon = datetime.strptime("14:00", "%H:%M")
        evening = datetime.strptime("19:00", "%H:%M")
        night = datetime.strptime("23:00", "%H:%M")

        assert calculate_time_of_day_factor(morning) < 1.0
        assert calculate_time_of_day_factor(afternoon) > 1.0
        assert calculate_time_of_day_factor(evening) == 1.0
        assert calculate_time_of_day_factor(night) > 1.0

    def test_break_effectiveness_calculation(self):
        """Test break effectiveness calculation"""
        from services.dmn_detection_service import calculate_break_effectiveness

        # Effective break
        effectiveness_good = calculate_break_effectiveness(
            dmn_score_before=0.75,
            dmn_score_after=0.35,
            break_duration_minutes=5
        )
        assert effectiveness_good > 0.5

        # Ineffective break
        effectiveness_poor = calculate_break_effectiveness(
            dmn_score_before=0.75,
            dmn_score_after=0.70,
            break_duration_minutes=5
        )
        assert effectiveness_poor < 0.3


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
