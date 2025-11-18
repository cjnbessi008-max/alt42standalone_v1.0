"""
Complexity Analyzer for Educational Problems

Based on PRD FR-2.2, evaluates problem complexity using:
- Number of conditions (> 5 = complex)
- Nesting depth (> 3 levels = complex)
- Number of entities involved (> 4 = complex)
- Cyclical dependencies (any = complex)
"""

from dataclasses import dataclass
from typing import List, Optional, Dict, Any
from enum import Enum


class ComplexityLevel(Enum):
    """Complexity levels for educational problems"""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    VERY_COMPLEX = "very_complex"


@dataclass
class ComplexityMetrics:
    """Metrics used to assess problem complexity"""
    condition_count: int
    nesting_depth: int
    entity_count: int
    has_cyclical_dependencies: bool

    @property
    def is_complex(self) -> bool:
        """
        Determine if the problem is complex based on PRD thresholds:
        - Condition count > 5 OR
        - Nesting depth > 3 OR
        - Entity count > 4 OR
        - Any cyclical dependencies
        """
        return (
            self.condition_count > 5 or
            self.nesting_depth > 3 or
            self.entity_count > 4 or
            self.has_cyclical_dependencies
        )

    @property
    def complexity_level(self) -> ComplexityLevel:
        """Calculate the overall complexity level"""
        if self.has_cyclical_dependencies:
            return ComplexityLevel.VERY_COMPLEX

        complexity_score = 0
        if self.condition_count > 5:
            complexity_score += 2
        elif self.condition_count > 3:
            complexity_score += 1

        if self.nesting_depth > 3:
            complexity_score += 2
        elif self.nesting_depth > 2:
            complexity_score += 1

        if self.entity_count > 4:
            complexity_score += 2
        elif self.entity_count > 3:
            complexity_score += 1

        if complexity_score >= 4:
            return ComplexityLevel.VERY_COMPLEX
        elif complexity_score >= 2:
            return ComplexityLevel.COMPLEX
        elif complexity_score >= 1:
            return ComplexityLevel.MODERATE
        else:
            return ComplexityLevel.SIMPLE


@dataclass
class ComplexityAssessment:
    """Complete assessment of problem complexity"""
    metrics: ComplexityMetrics
    level: ComplexityLevel
    requires_focus_card: bool
    recommendations: List[str]
    focus_message: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "metrics": {
                "condition_count": self.metrics.condition_count,
                "nesting_depth": self.metrics.nesting_depth,
                "entity_count": self.metrics.entity_count,
                "has_cyclical_dependencies": self.metrics.has_cyclical_dependencies,
            },
            "level": self.level.value,
            "requires_focus_card": self.requires_focus_card,
            "recommendations": self.recommendations,
            "focus_message": self.focus_message,
        }


class ComplexityAnalyzer:
    """Analyzes problem complexity and determines if focus card is needed"""

    # Messages for focus cards (Korean and English)
    FOCUS_MESSAGES = {
        ComplexityLevel.COMPLEX: {
            "ko": "🎯 잠깐! 이 문제는 복잡도가 높습니다.\n\n심호흡을 하고 차근차근 풀어봅시다.",
            "en": "🎯 Hold on! This problem is quite complex.\n\nTake a deep breath and solve it step by step.",
        },
        ComplexityLevel.VERY_COMPLEX: {
            "ko": "🧠 주의! 매우 복잡한 문제입니다.\n\n시간을 충분히 갖고, 필요하면 메모하면서 풀어보세요.",
            "en": "🧠 Attention! This is a very complex problem.\n\nTake your time, and take notes if needed.",
        },
    }

    def __init__(self, language: str = "ko"):
        """
        Initialize analyzer

        Args:
            language: Language for focus messages ('ko' or 'en')
        """
        self.language = language

    def analyze_problem(
        self,
        condition_count: int = 0,
        nesting_depth: int = 0,
        entity_count: int = 0,
        has_cyclical_dependencies: bool = False,
    ) -> ComplexityAssessment:
        """
        Analyze problem complexity

        Args:
            condition_count: Number of logical conditions in the problem
            nesting_depth: Depth of nested logic
            entity_count: Number of entities/concepts involved
            has_cyclical_dependencies: Whether problem has circular dependencies

        Returns:
            ComplexityAssessment with full analysis
        """
        metrics = ComplexityMetrics(
            condition_count=condition_count,
            nesting_depth=nesting_depth,
            entity_count=entity_count,
            has_cyclical_dependencies=has_cyclical_dependencies,
        )

        level = metrics.complexity_level
        requires_focus = level in [ComplexityLevel.COMPLEX, ComplexityLevel.VERY_COMPLEX]

        # Generate recommendations
        recommendations = self._generate_recommendations(metrics, level)

        # Get focus message if needed
        focus_message = None
        if requires_focus and level in self.FOCUS_MESSAGES:
            focus_message = self.FOCUS_MESSAGES[level].get(self.language)

        return ComplexityAssessment(
            metrics=metrics,
            level=level,
            requires_focus_card=requires_focus,
            recommendations=recommendations,
            focus_message=focus_message,
        )

    def _generate_recommendations(
        self,
        metrics: ComplexityMetrics,
        level: ComplexityLevel,
    ) -> List[str]:
        """Generate recommendations based on complexity"""
        recommendations = []

        if level == ComplexityLevel.SIMPLE:
            recommendations.append("This problem is straightforward. Proceed with confidence!")

        if metrics.condition_count > 5:
            recommendations.append(
                "Break down the conditions into smaller logical groups"
            )

        if metrics.nesting_depth > 3:
            recommendations.append(
                "Consider simplifying the nested logic or using visual aids"
            )

        if metrics.entity_count > 4:
            recommendations.append(
                "Create a diagram to visualize relationships between entities"
            )

        if metrics.has_cyclical_dependencies:
            recommendations.append(
                "Identify the cyclical pattern and break it down systematically"
            )
            recommendations.append(
                "Consider using ontology-based approach for complex relationships"
            )

        if level in [ComplexityLevel.COMPLEX, ComplexityLevel.VERY_COMPLEX]:
            recommendations.append("Take breaks if needed - complex problems require sustained focus")

        return recommendations


# Example usage
if __name__ == "__main__":
    analyzer = ComplexityAnalyzer(language="ko")

    # Example 1: Simple problem
    print("=== Simple Problem ===")
    assessment1 = analyzer.analyze_problem(
        condition_count=2,
        nesting_depth=1,
        entity_count=2,
    )
    print(f"Level: {assessment1.level.value}")
    print(f"Requires Focus Card: {assessment1.requires_focus_card}")
    print(f"Recommendations: {assessment1.recommendations}\n")

    # Example 2: Complex problem
    print("=== Complex Problem ===")
    assessment2 = analyzer.analyze_problem(
        condition_count=6,
        nesting_depth=4,
        entity_count=5,
    )
    print(f"Level: {assessment2.level.value}")
    print(f"Requires Focus Card: {assessment2.requires_focus_card}")
    print(f"Focus Message: {assessment2.focus_message}")
    print(f"Recommendations: {assessment2.recommendations}\n")

    # Example 3: Very complex problem with cycles
    print("=== Very Complex Problem ===")
    assessment3 = analyzer.analyze_problem(
        condition_count=8,
        nesting_depth=5,
        entity_count=6,
        has_cyclical_dependencies=True,
    )
    print(f"Level: {assessment3.level.value}")
    print(f"Requires Focus Card: {assessment3.requires_focus_card}")
    print(f"Focus Message: {assessment3.focus_message}")
    print(f"Recommendations: {assessment3.recommendations}")
