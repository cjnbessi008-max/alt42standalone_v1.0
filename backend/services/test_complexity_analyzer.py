"""
Unit tests for complexity_analyzer module
"""

import pytest
from complexity_analyzer import (
    ComplexityAnalyzer,
    ComplexityMetrics,
    ComplexityLevel,
    ComplexityAssessment,
)


class TestComplexityMetrics:
    """Test ComplexityMetrics dataclass"""

    def test_simple_problem_not_complex(self):
        """Simple problems should not be flagged as complex"""
        metrics = ComplexityMetrics(
            condition_count=2, nesting_depth=1, entity_count=2, has_cyclical_dependencies=False
        )
        assert not metrics.is_complex
        assert metrics.complexity_level == ComplexityLevel.SIMPLE

    def test_high_condition_count_is_complex(self):
        """Problems with >5 conditions should be complex"""
        metrics = ComplexityMetrics(
            condition_count=6, nesting_depth=1, entity_count=2, has_cyclical_dependencies=False
        )
        assert metrics.is_complex
        assert metrics.complexity_level in [ComplexityLevel.COMPLEX, ComplexityLevel.VERY_COMPLEX]

    def test_high_nesting_depth_is_complex(self):
        """Problems with nesting depth >3 should be complex"""
        metrics = ComplexityMetrics(
            condition_count=2, nesting_depth=4, entity_count=2, has_cyclical_dependencies=False
        )
        assert metrics.is_complex
        assert metrics.complexity_level in [ComplexityLevel.COMPLEX, ComplexityLevel.VERY_COMPLEX]

    def test_high_entity_count_is_complex(self):
        """Problems with >4 entities should be complex"""
        metrics = ComplexityMetrics(
            condition_count=2, nesting_depth=1, entity_count=5, has_cyclical_dependencies=False
        )
        assert metrics.is_complex
        assert metrics.complexity_level in [ComplexityLevel.COMPLEX, ComplexityLevel.VERY_COMPLEX]

    def test_cyclical_dependencies_is_very_complex(self):
        """Any cyclical dependencies should make it very complex"""
        metrics = ComplexityMetrics(
            condition_count=2, nesting_depth=1, entity_count=2, has_cyclical_dependencies=True
        )
        assert metrics.is_complex
        assert metrics.complexity_level == ComplexityLevel.VERY_COMPLEX

    def test_moderate_complexity(self):
        """Problems with some complexity should be moderate"""
        metrics = ComplexityMetrics(
            condition_count=4, nesting_depth=2, entity_count=3, has_cyclical_dependencies=False
        )
        complexity_level = metrics.complexity_level
        assert complexity_level in [ComplexityLevel.MODERATE, ComplexityLevel.COMPLEX]


class TestComplexityAnalyzer:
    """Test ComplexityAnalyzer class"""

    def test_analyze_simple_problem(self):
        """Test analysis of a simple problem"""
        analyzer = ComplexityAnalyzer(language="en")
        assessment = analyzer.analyze_problem(
            condition_count=2, nesting_depth=1, entity_count=2
        )

        assert isinstance(assessment, ComplexityAssessment)
        assert assessment.level == ComplexityLevel.SIMPLE
        assert not assessment.requires_focus_card
        assert assessment.focus_message is None

    def test_analyze_complex_problem(self):
        """Test analysis of a complex problem"""
        analyzer = ComplexityAnalyzer(language="ko")
        assessment = analyzer.analyze_problem(
            condition_count=6, nesting_depth=4, entity_count=5
        )

        assert assessment.level in [ComplexityLevel.COMPLEX, ComplexityLevel.VERY_COMPLEX]
        assert assessment.requires_focus_card
        assert assessment.focus_message is not None
        assert len(assessment.recommendations) > 0

    def test_analyze_very_complex_problem(self):
        """Test analysis of a very complex problem with cycles"""
        analyzer = ComplexityAnalyzer(language="ko")
        assessment = analyzer.analyze_problem(
            condition_count=8,
            nesting_depth=5,
            entity_count=6,
            has_cyclical_dependencies=True,
        )

        assert assessment.level == ComplexityLevel.VERY_COMPLEX
        assert assessment.requires_focus_card
        assert assessment.focus_message is not None
        assert "ontology" in " ".join(assessment.recommendations).lower()

    def test_korean_language_messages(self):
        """Test that Korean messages are provided correctly"""
        analyzer = ComplexityAnalyzer(language="ko")
        assessment = analyzer.analyze_problem(
            condition_count=6, nesting_depth=4, entity_count=5
        )

        if assessment.focus_message:
            # Check if message contains Korean characters
            assert any('\uac00' <= char <= '\ud7a3' for char in assessment.focus_message)

    def test_english_language_messages(self):
        """Test that English messages are provided correctly"""
        analyzer = ComplexityAnalyzer(language="en")
        assessment = analyzer.analyze_problem(
            condition_count=6, nesting_depth=4, entity_count=5
        )

        if assessment.focus_message:
            # Check if message is in English
            assert "complex" in assessment.focus_message.lower() or "problem" in assessment.focus_message.lower()

    def test_assessment_to_dict(self):
        """Test conversion of assessment to dictionary"""
        analyzer = ComplexityAnalyzer(language="ko")
        assessment = analyzer.analyze_problem(
            condition_count=6, nesting_depth=4, entity_count=5
        )

        result_dict = assessment.to_dict()

        assert "metrics" in result_dict
        assert "level" in result_dict
        assert "requires_focus_card" in result_dict
        assert "recommendations" in result_dict
        assert result_dict["metrics"]["condition_count"] == 6
        assert result_dict["metrics"]["nesting_depth"] == 4
        assert result_dict["metrics"]["entity_count"] == 5

    def test_recommendations_for_high_conditions(self):
        """Test that recommendations include advice for high condition count"""
        analyzer = ComplexityAnalyzer(language="en")
        assessment = analyzer.analyze_problem(condition_count=7)

        recommendations_text = " ".join(assessment.recommendations).lower()
        assert "condition" in recommendations_text or "logical" in recommendations_text

    def test_recommendations_for_high_nesting(self):
        """Test that recommendations include advice for high nesting depth"""
        analyzer = ComplexityAnalyzer(language="en")
        assessment = analyzer.analyze_problem(nesting_depth=4)

        recommendations_text = " ".join(assessment.recommendations).lower()
        assert "nested" in recommendations_text or "nesting" in recommendations_text or "visual" in recommendations_text

    def test_recommendations_for_high_entities(self):
        """Test that recommendations include advice for many entities"""
        analyzer = ComplexityAnalyzer(language="en")
        assessment = analyzer.analyze_problem(entity_count=6)

        recommendations_text = " ".join(assessment.recommendations).lower()
        assert "diagram" in recommendations_text or "visualize" in recommendations_text or "entities" in recommendations_text

    def test_edge_case_zero_values(self):
        """Test with all zero values"""
        analyzer = ComplexityAnalyzer(language="en")
        assessment = analyzer.analyze_problem()

        assert assessment.level == ComplexityLevel.SIMPLE
        assert not assessment.requires_focus_card

    def test_edge_case_exact_thresholds(self):
        """Test with values exactly at thresholds"""
        analyzer = ComplexityAnalyzer(language="en")

        # Exactly at threshold (should not be complex)
        assessment1 = analyzer.analyze_problem(condition_count=5)
        assert not assessment1.requires_focus_card

        # One over threshold (should be complex)
        assessment2 = analyzer.analyze_problem(condition_count=6)
        assert assessment2.requires_focus_card


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
