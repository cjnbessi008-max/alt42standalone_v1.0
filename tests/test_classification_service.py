"""
Unit tests for Thinking Style Classification Service
"""
import pytest
from uuid import uuid4
from datetime import datetime

from backend.models.thinking_style import (
    ThinkingStyleType,
    ConfidenceLevel,
    InteractionCategory,
    InteractionDB,
    ClassificationInput,
)
from backend.services.classification_service import (
    ThinkingStyleClassifier,
    RecommendationEngine,
)


class TestThinkingStyleClassifier:
    """Test suite for ThinkingStyleClassifier"""

    @pytest.fixture
    def classifier(self):
        """Fixture for classifier instance"""
        return ThinkingStyleClassifier()

    @pytest.fixture
    def sample_interactions_computational(self):
        """Sample interactions for computational thinking style"""
        student_id = uuid4()
        module_id = uuid4()
        interactions = []

        # Create 20 interactions favoring computational style
        for i in range(20):
            interaction = InteractionDB(
                id=uuid4(),
                student_id=student_id,
                module_id=module_id,
                problem_id=uuid4(),
                interaction_type='step_by_step_solution' if i % 2 == 0 else 'calculator_usage',
                interaction_category=InteractionCategory.COMPUTATIONAL,
                duration_seconds=60 + i * 5,
                success=True,
                metadata={'steps_shown': 5},
                occurred_at=datetime.now(),
            )
            interactions.append(interaction)

        return interactions

    @pytest.fixture
    def sample_interactions_visual(self):
        """Sample interactions for visual thinking style"""
        student_id = uuid4()
        module_id = uuid4()
        interactions = []

        # Create 20 interactions favoring visual style
        for i in range(20):
            interaction = InteractionDB(
                id=uuid4(),
                student_id=student_id,
                module_id=module_id,
                problem_id=uuid4(),
                interaction_type='diagram_interaction' if i % 2 == 0 else 'drawing_tool_usage',
                interaction_category=InteractionCategory.VISUAL,
                duration_seconds=90 + i * 3,
                success=True,
                metadata={'task_type': 'spatial'},
                occurred_at=datetime.now(),
            )
            interactions.append(interaction)

        return interactions

    @pytest.fixture
    def sample_interactions_insufficient(self):
        """Sample interactions with insufficient data"""
        student_id = uuid4()
        module_id = uuid4()
        interactions = []

        # Only 5 interactions (below minimum threshold)
        for i in range(5):
            interaction = InteractionDB(
                id=uuid4(),
                student_id=student_id,
                module_id=module_id,
                problem_id=uuid4(),
                interaction_type='quick_answer',
                interaction_category=InteractionCategory.NEUTRAL,
                duration_seconds=30,
                success=True,
                metadata={},
                occurred_at=datetime.now(),
            )
            interactions.append(interaction)

        return interactions

    def test_classification_computational_style(
        self,
        classifier,
        sample_interactions_computational
    ):
        """Test classification of computational thinking style"""
        student_id = sample_interactions_computational[0].student_id

        input_data = ClassificationInput(
            student_id=student_id,
            interactions=sample_interactions_computational,
        )

        result = classifier.classify(input_data)

        assert result.primary_style == ThinkingStyleType.COMPUTATIONAL
        assert result.computational_score > 50.0
        assert result.data_points_used == 20
        assert result.confidence_level in [ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH]

    def test_classification_visual_style(
        self,
        classifier,
        sample_interactions_visual
    ):
        """Test classification of visual thinking style"""
        student_id = sample_interactions_visual[0].student_id

        input_data = ClassificationInput(
            student_id=student_id,
            interactions=sample_interactions_visual,
        )

        result = classifier.classify(input_data)

        assert result.primary_style == ThinkingStyleType.VISUAL
        assert result.visual_score > 50.0
        assert result.data_points_used == 20

    def test_classification_insufficient_data(
        self,
        classifier,
        sample_interactions_insufficient
    ):
        """Test classification with insufficient data"""
        student_id = sample_interactions_insufficient[0].student_id

        input_data = ClassificationInput(
            student_id=student_id,
            interactions=sample_interactions_insufficient,
        )

        result = classifier.classify(input_data)

        # Should return low confidence result
        assert result.confidence_level == ConfidenceLevel.LOW
        assert result.data_points_used == 5
        # Default scores when insufficient data
        assert result.computational_score == 33.33
        assert result.intuitive_score == 33.33
        assert result.visual_score == 33.33

    def test_score_ranges(self, classifier, sample_interactions_computational):
        """Test that scores are within valid ranges (0-100)"""
        student_id = sample_interactions_computational[0].student_id

        input_data = ClassificationInput(
            student_id=student_id,
            interactions=sample_interactions_computational,
        )

        result = classifier.classify(input_data)

        assert 0 <= result.computational_score <= 100
        assert 0 <= result.intuitive_score <= 100
        assert 0 <= result.visual_score <= 100

    def test_hybrid_classification(self, classifier):
        """Test hybrid (multiple strong styles) classification"""
        student_id = uuid4()
        module_id = uuid4()
        interactions = []

        # Create balanced interactions between computational and visual
        for i in range(20):
            if i < 10:
                interaction_type = 'step_by_step_solution'
                category = InteractionCategory.COMPUTATIONAL
            else:
                interaction_type = 'diagram_interaction'
                category = InteractionCategory.VISUAL

            interaction = InteractionDB(
                id=uuid4(),
                student_id=student_id,
                module_id=module_id,
                problem_id=uuid4(),
                interaction_type=interaction_type,
                interaction_category=category,
                duration_seconds=60,
                success=True,
                metadata={'steps_shown': 5},
                occurred_at=datetime.now(),
            )
            interactions.append(interaction)

        input_data = ClassificationInput(
            student_id=student_id,
            interactions=interactions,
        )

        result = classifier.classify(input_data)

        # May or may not be hybrid depending on exact scores
        # But should have two relatively high scores
        scores = [
            result.computational_score,
            result.intuitive_score,
            result.visual_score
        ]
        scores.sort(reverse=True)

        # Top two scores should be relatively close if hybrid
        if result.is_hybrid:
            assert abs(scores[0] - scores[1]) <= classifier.HYBRID_THRESHOLD


class TestRecommendationEngine:
    """Test suite for RecommendationEngine"""

    @pytest.fixture
    def recommendation_engine(self):
        """Fixture for recommendation engine instance"""
        return RecommendationEngine()

    def test_computational_recommendations(self, recommendation_engine):
        """Test recommendations for computational style"""
        recommendations = recommendation_engine.get_recommendations(
            ThinkingStyleType.COMPUTATIONAL
        )

        assert 'content_format' in recommendations
        assert 'problem_types' in recommendations
        assert 'teaching_tips' in recommendations

        # Check that recommendations are non-empty
        assert len(recommendations['content_format']) > 0
        assert len(recommendations['problem_types']) > 0
        assert len(recommendations['teaching_tips']) > 0

    def test_intuitive_recommendations(self, recommendation_engine):
        """Test recommendations for intuitive style"""
        recommendations = recommendation_engine.get_recommendations(
            ThinkingStyleType.INTUITIVE
        )

        assert 'content_format' in recommendations
        assert len(recommendations['content_format']) > 0

    def test_visual_recommendations(self, recommendation_engine):
        """Test recommendations for visual style"""
        recommendations = recommendation_engine.get_recommendations(
            ThinkingStyleType.VISUAL
        )

        assert 'content_format' in recommendations
        assert len(recommendations['content_format']) > 0

    def test_all_styles_have_recommendations(self, recommendation_engine):
        """Test that all thinking styles have recommendations"""
        for style in [
            ThinkingStyleType.COMPUTATIONAL,
            ThinkingStyleType.INTUITIVE,
            ThinkingStyleType.VISUAL
        ]:
            recommendations = recommendation_engine.get_recommendations(style)
            assert recommendations is not None
            assert len(recommendations) > 0


# ============================================================
# Integration Tests
# ============================================================

class TestClassificationIntegration:
    """Integration tests for classification workflow"""

    def test_full_classification_workflow(self):
        """Test complete classification workflow"""
        # 1. Create classifier and recommendation engine
        classifier = ThinkingStyleClassifier()
        rec_engine = RecommendationEngine()

        # 2. Generate sample interactions
        student_id = uuid4()
        module_id = uuid4()
        interactions = []

        for i in range(30):
            interaction = InteractionDB(
                id=uuid4(),
                student_id=student_id,
                module_id=module_id,
                problem_id=uuid4(),
                interaction_type='diagram_interaction',
                interaction_category=InteractionCategory.VISUAL,
                duration_seconds=80,
                success=True,
                metadata={},
                occurred_at=datetime.now(),
            )
            interactions.append(interaction)

        # 3. Classify
        input_data = ClassificationInput(
            student_id=student_id,
            interactions=interactions,
        )
        classification_result = classifier.classify(input_data)

        # 4. Get recommendations
        recommendations = rec_engine.get_recommendations(
            classification_result.primary_style
        )

        # 5. Verify complete workflow
        assert classification_result.student_id == student_id
        assert classification_result.primary_style == ThinkingStyleType.VISUAL
        assert recommendations is not None
        assert 'content_format' in recommendations


# ============================================================
# Performance Tests
# ============================================================

class TestClassificationPerformance:
    """Performance tests for classification"""

    def test_classification_performance_large_dataset(self):
        """Test classification with large number of interactions"""
        import time

        classifier = ThinkingStyleClassifier()
        student_id = uuid4()
        module_id = uuid4()

        # Generate 1000 interactions
        interactions = []
        for i in range(1000):
            interaction = InteractionDB(
                id=uuid4(),
                student_id=student_id,
                module_id=module_id,
                problem_id=uuid4(),
                interaction_type='calculator_usage',
                interaction_category=InteractionCategory.COMPUTATIONAL,
                duration_seconds=60,
                success=True,
                metadata={},
                occurred_at=datetime.now(),
            )
            interactions.append(interaction)

        input_data = ClassificationInput(
            student_id=student_id,
            interactions=interactions,
        )

        # Measure classification time
        start_time = time.time()
        result = classifier.classify(input_data)
        end_time = time.time()

        classification_time = end_time - start_time

        # Classification should complete in reasonable time (< 1 second)
        assert classification_time < 1.0
        assert result.data_points_used == 1000


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
