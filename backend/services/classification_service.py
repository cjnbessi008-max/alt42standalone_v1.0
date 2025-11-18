"""
Thinking Style Classification Service
Core business logic for classifying student thinking styles
"""
from typing import List, Dict, Tuple, Optional
from uuid import UUID
from datetime import datetime, timedelta
from collections import defaultdict
import math

from backend.models.thinking_style import (
    ThinkingStyleType,
    ConfidenceLevel,
    InteractionCategory,
    InteractionDB,
    ClassificationInput,
    ClassificationOutput,
    InteractionFactor,
)


class ThinkingStyleClassifier:
    """
    Main classifier for student thinking styles
    Implements multi-factor scoring system
    """

    # Factor weights for each thinking style
    WEIGHTS = {
        ThinkingStyleType.COMPUTATIONAL: {
            'step_by_step_usage': 0.25,
            'formula_reference_time': 0.20,
            'calculation_tool_usage': 0.20,
            'text_preference': 0.15,
            'detailed_work_shown': 0.20,
        },
        ThinkingStyleType.INTUITIVE: {
            'completion_speed': 0.30,
            'skip_intermediate_steps': 0.25,
            'pattern_recognition_accuracy': 0.25,
            'estimation_preference': 0.20,
        },
        ThinkingStyleType.VISUAL: {
            'visual_tool_usage': 0.30,
            'diagram_interaction_time': 0.25,
            'spatial_task_performance': 0.25,
            'image_preference': 0.20,
        }
    }

    # Minimum thresholds
    MIN_DATA_POINTS = 10
    MIN_SCORE_FOR_SIGNIFICANCE = 40.0
    MIN_SCORE_FOR_SECONDARY = 30.0
    HYBRID_THRESHOLD = 10.0  # Points difference for hybrid classification

    def __init__(self):
        """Initialize the classifier"""
        pass

    def classify(self, input_data: ClassificationInput) -> ClassificationOutput:
        """
        Main classification method

        Args:
            input_data: Classification input with student interactions

        Returns:
            ClassificationOutput with scores and classification
        """
        interactions = input_data.interactions

        # Check minimum data requirement
        if len(interactions) < self.MIN_DATA_POINTS:
            return self._insufficient_data_result(input_data.student_id, len(interactions))

        # Calculate factors for each thinking style
        computational_factors = self._calculate_computational_factors(interactions)
        intuitive_factors = self._calculate_intuitive_factors(interactions)
        visual_factors = self._calculate_visual_factors(interactions)

        # Calculate weighted scores
        computational_score = self._calculate_weighted_score(
            computational_factors,
            self.WEIGHTS[ThinkingStyleType.COMPUTATIONAL]
        )
        intuitive_score = self._calculate_weighted_score(
            intuitive_factors,
            self.WEIGHTS[ThinkingStyleType.INTUITIVE]
        )
        visual_score = self._calculate_weighted_score(
            visual_factors,
            self.WEIGHTS[ThinkingStyleType.VISUAL]
        )

        # Determine primary and secondary styles
        primary_style, secondary_style, is_hybrid = self._determine_styles(
            computational_score, intuitive_score, visual_score
        )

        # Determine confidence level
        confidence_level = self._calculate_confidence(
            len(interactions),
            computational_score,
            intuitive_score,
            visual_score
        )

        return ClassificationOutput(
            student_id=input_data.student_id,
            computational_score=computational_score,
            intuitive_score=intuitive_score,
            visual_score=visual_score,
            primary_style=primary_style,
            secondary_style=secondary_style,
            is_hybrid=is_hybrid,
            confidence_level=confidence_level,
            data_points_used=len(interactions),
            factors_breakdown={
                'computational': computational_factors,
                'intuitive': intuitive_factors,
                'visual': visual_factors,
            }
        )

    def _calculate_computational_factors(self, interactions: List[InteractionDB]) -> List[InteractionFactor]:
        """Calculate computational thinking factors"""
        factors = []

        # Step-by-step usage
        step_by_step_count = sum(
            1 for i in interactions
            if i.interaction_type == 'step_by_step_solution'
        )
        step_by_step_ratio = step_by_step_count / len(interactions)
        factors.append(InteractionFactor(
            factor_name='step_by_step_usage',
            weight=self.WEIGHTS[ThinkingStyleType.COMPUTATIONAL]['step_by_step_usage'],
            value=min(step_by_step_ratio * 2, 1.0)  # Normalize
        ))

        # Formula reference time
        formula_interactions = [
            i for i in interactions
            if i.interaction_type == 'formula_reference'
        ]
        avg_formula_time = (
            sum(i.duration_seconds or 0 for i in formula_interactions) /
            len(formula_interactions)
        ) if formula_interactions else 0
        formula_time_normalized = min(avg_formula_time / 60, 1.0)  # Normalize to 0-1 (60 sec max)
        factors.append(InteractionFactor(
            factor_name='formula_reference_time',
            weight=self.WEIGHTS[ThinkingStyleType.COMPUTATIONAL]['formula_reference_time'],
            value=formula_time_normalized
        ))

        # Calculation tool usage
        calc_tool_count = sum(
            1 for i in interactions
            if i.interaction_type == 'calculator_usage'
        )
        calc_tool_ratio = calc_tool_count / len(interactions)
        factors.append(InteractionFactor(
            factor_name='calculation_tool_usage',
            weight=self.WEIGHTS[ThinkingStyleType.COMPUTATIONAL]['calculation_tool_usage'],
            value=min(calc_tool_ratio * 2, 1.0)
        ))

        # Text preference (inverse of visual)
        visual_interactions = sum(
            1 for i in interactions
            if i.interaction_category == InteractionCategory.VISUAL
        )
        text_ratio = 1 - (visual_interactions / len(interactions))
        factors.append(InteractionFactor(
            factor_name='text_preference',
            weight=self.WEIGHTS[ThinkingStyleType.COMPUTATIONAL]['text_preference'],
            value=text_ratio
        ))

        # Detailed work shown
        detailed_work = sum(
            1 for i in interactions
            if i.metadata and i.metadata.get('steps_shown', 0) > 3
        )
        detailed_work_ratio = detailed_work / len(interactions)
        factors.append(InteractionFactor(
            factor_name='detailed_work_shown',
            weight=self.WEIGHTS[ThinkingStyleType.COMPUTATIONAL]['detailed_work_shown'],
            value=detailed_work_ratio
        ))

        return factors

    def _calculate_intuitive_factors(self, interactions: List[InteractionDB]) -> List[InteractionFactor]:
        """Calculate intuitive thinking factors"""
        factors = []

        # Completion speed (faster = more intuitive)
        quick_answers = sum(
            1 for i in interactions
            if i.interaction_type == 'quick_answer'
        )
        avg_time = sum(i.duration_seconds or 0 for i in interactions) / len(interactions)
        speed_score = max(0, 1 - (avg_time / 180))  # 3 min = 0, 0 min = 1
        factors.append(InteractionFactor(
            factor_name='completion_speed',
            weight=self.WEIGHTS[ThinkingStyleType.INTUITIVE]['completion_speed'],
            value=speed_score
        ))

        # Skip intermediate steps
        skip_steps_count = sum(
            1 for i in interactions
            if i.metadata and i.metadata.get('steps_shown', 10) < 2
        )
        skip_ratio = skip_steps_count / len(interactions)
        factors.append(InteractionFactor(
            factor_name='skip_intermediate_steps',
            weight=self.WEIGHTS[ThinkingStyleType.INTUITIVE]['skip_intermediate_steps'],
            value=skip_ratio
        ))

        # Pattern recognition accuracy
        pattern_interactions = [
            i for i in interactions
            if i.interaction_type == 'pattern_recognition'
        ]
        pattern_accuracy = (
            sum(1 for i in pattern_interactions if i.success) /
            len(pattern_interactions)
        ) if pattern_interactions else 0.5
        factors.append(InteractionFactor(
            factor_name='pattern_recognition_accuracy',
            weight=self.WEIGHTS[ThinkingStyleType.INTUITIVE]['pattern_recognition_accuracy'],
            value=pattern_accuracy
        ))

        # Estimation preference
        estimation_count = sum(
            1 for i in interactions
            if i.interaction_type == 'estimation_usage'
        )
        estimation_ratio = estimation_count / len(interactions)
        factors.append(InteractionFactor(
            factor_name='estimation_preference',
            weight=self.WEIGHTS[ThinkingStyleType.INTUITIVE]['estimation_preference'],
            value=min(estimation_ratio * 3, 1.0)
        ))

        return factors

    def _calculate_visual_factors(self, interactions: List[InteractionDB]) -> List[InteractionFactor]:
        """Calculate visual thinking factors"""
        factors = []

        # Visual tool usage
        visual_tool_count = sum(
            1 for i in interactions
            if i.interaction_type in ['diagram_interaction', 'drawing_tool_usage']
        )
        visual_tool_ratio = visual_tool_count / len(interactions)
        factors.append(InteractionFactor(
            factor_name='visual_tool_usage',
            weight=self.WEIGHTS[ThinkingStyleType.VISUAL]['visual_tool_usage'],
            value=min(visual_tool_ratio * 2, 1.0)
        ))

        # Diagram interaction time
        diagram_interactions = [
            i for i in interactions
            if i.interaction_type == 'diagram_interaction'
        ]
        avg_diagram_time = (
            sum(i.duration_seconds or 0 for i in diagram_interactions) /
            len(diagram_interactions)
        ) if diagram_interactions else 0
        diagram_time_normalized = min(avg_diagram_time / 120, 1.0)  # 2 min max
        factors.append(InteractionFactor(
            factor_name='diagram_interaction_time',
            weight=self.WEIGHTS[ThinkingStyleType.VISUAL]['diagram_interaction_time'],
            value=diagram_time_normalized
        ))

        # Spatial task performance
        spatial_interactions = [
            i for i in interactions
            if i.metadata and i.metadata.get('task_type') == 'spatial'
        ]
        spatial_success = (
            sum(1 for i in spatial_interactions if i.success) /
            len(spatial_interactions)
        ) if spatial_interactions else 0.5
        factors.append(InteractionFactor(
            factor_name='spatial_task_performance',
            weight=self.WEIGHTS[ThinkingStyleType.VISUAL]['spatial_task_performance'],
            value=spatial_success
        ))

        # Image preference
        visual_aid_count = sum(
            1 for i in interactions
            if i.interaction_type == 'visual_aid_preference'
        )
        image_ratio = visual_aid_count / len(interactions)
        factors.append(InteractionFactor(
            factor_name='image_preference',
            weight=self.WEIGHTS[ThinkingStyleType.VISUAL]['image_preference'],
            value=min(image_ratio * 2, 1.0)
        ))

        return factors

    def _calculate_weighted_score(
        self,
        factors: List[InteractionFactor],
        weights: Dict[str, float]
    ) -> float:
        """
        Calculate weighted score from factors

        Args:
            factors: List of interaction factors
            weights: Weight dictionary for this thinking style

        Returns:
            Weighted score (0-100)
        """
        total_weighted_value = sum(f.value * f.weight for f in factors)
        total_weight = sum(weights.values())

        # Normalize to 0-100 scale
        score = (total_weighted_value / total_weight) * 100

        return round(min(max(score, 0), 100), 2)

    def _determine_styles(
        self,
        computational: float,
        intuitive: float,
        visual: float
    ) -> Tuple[ThinkingStyleType, ThinkingStyleType, bool]:
        """
        Determine primary and secondary thinking styles

        Returns:
            (primary_style, secondary_style, is_hybrid)
        """
        scores = {
            ThinkingStyleType.COMPUTATIONAL: computational,
            ThinkingStyleType.INTUITIVE: intuitive,
            ThinkingStyleType.VISUAL: visual,
        }

        # Sort by score (descending)
        sorted_styles = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        primary_style, primary_score = sorted_styles[0]
        secondary_style, secondary_score = sorted_styles[1]

        # Check if primary is significant
        if primary_score < self.MIN_SCORE_FOR_SIGNIFICANCE:
            # No strong preference, default to computational
            return (
                ThinkingStyleType.COMPUTATIONAL,
                ThinkingStyleType.NONE,
                False
            )

        # Check for hybrid (two styles close together)
        is_hybrid = (primary_score - secondary_score) <= self.HYBRID_THRESHOLD

        # Check if secondary is significant
        if secondary_score < self.MIN_SCORE_FOR_SECONDARY:
            secondary_style = ThinkingStyleType.NONE
            is_hybrid = False

        return primary_style, secondary_style, is_hybrid

    def _calculate_confidence(
        self,
        data_points: int,
        computational: float,
        intuitive: float,
        visual: float
    ) -> ConfidenceLevel:
        """
        Calculate confidence level of classification

        Args:
            data_points: Number of interaction data points
            computational: Computational score
            intuitive: Intuitive score
            visual: Visual score

        Returns:
            ConfidenceLevel enum
        """
        # Factor 1: Data volume
        if data_points < 20:
            data_confidence = 0.3
        elif data_points < 50:
            data_confidence = 0.6
        else:
            data_confidence = 1.0

        # Factor 2: Score separation (higher difference = more confident)
        scores = sorted([computational, intuitive, visual], reverse=True)
        score_separation = scores[0] - scores[1]

        if score_separation > 30:
            separation_confidence = 1.0
        elif score_separation > 15:
            separation_confidence = 0.7
        else:
            separation_confidence = 0.4

        # Combined confidence
        overall_confidence = (data_confidence + separation_confidence) / 2

        if overall_confidence >= 0.75:
            return ConfidenceLevel.HIGH
        elif overall_confidence >= 0.5:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW

    def _insufficient_data_result(
        self,
        student_id: UUID,
        data_points: int
    ) -> ClassificationOutput:
        """
        Return a default result when there's insufficient data
        """
        return ClassificationOutput(
            student_id=student_id,
            computational_score=33.33,
            intuitive_score=33.33,
            visual_score=33.33,
            primary_style=ThinkingStyleType.COMPUTATIONAL,  # Default
            secondary_style=ThinkingStyleType.NONE,
            is_hybrid=False,
            confidence_level=ConfidenceLevel.LOW,
            data_points_used=data_points,
        )


class RecommendationEngine:
    """
    Generate personalized learning recommendations based on thinking style
    """

    RECOMMENDATIONS = {
        ThinkingStyleType.COMPUTATIONAL: {
            'content_format': [
                'Step-by-step written solutions',
                'Formula sheets and reference guides',
                'Detailed explanations with logical flow',
                'Practice problems with worked examples',
            ],
            'problem_types': [
                'Multi-step calculation problems',
                'Algebraic manipulations',
                'Proof-based questions',
                'Algorithm implementation',
            ],
            'teaching_tips': [
                'Provide clear, logical progression',
                'Break complex problems into steps',
                'Encourage showing all work',
                'Use systematic problem-solving frameworks',
            ],
        },
        ThinkingStyleType.INTUITIVE: {
            'content_format': [
                'Pattern recognition exercises',
                'Quick estimation challenges',
                'Multiple-choice assessments',
                'Real-world application problems',
            ],
            'problem_types': [
                'Pattern completion tasks',
                'Number sense activities',
                'Strategic games',
                'Estimation problems',
            ],
            'teaching_tips': [
                'Encourage gut-feeling approaches',
                'Validate intuitive leaps',
                'Provide immediate feedback',
                'Use discovery-based learning',
            ],
        },
        ThinkingStyleType.VISUAL: {
            'content_format': [
                'Diagrams and visual representations',
                'Interactive visualizations',
                'Concept maps',
                'Video tutorials',
            ],
            'problem_types': [
                'Geometry and spatial reasoning',
                'Graph analysis',
                'Visual pattern matching',
                'Diagram-based problems',
            ],
            'teaching_tips': [
                'Use visual aids consistently',
                'Encourage drawing and sketching',
                'Provide concept maps',
                'Use color coding and highlighting',
            ],
        },
    }

    def get_recommendations(self, primary_style: ThinkingStyleType) -> Dict[str, List[str]]:
        """
        Get recommendations for a thinking style

        Args:
            primary_style: Student's primary thinking style

        Returns:
            Dictionary of recommendations by category
        """
        return self.RECOMMENDATIONS.get(
            primary_style,
            self.RECOMMENDATIONS[ThinkingStyleType.COMPUTATIONAL]  # Default
        )
