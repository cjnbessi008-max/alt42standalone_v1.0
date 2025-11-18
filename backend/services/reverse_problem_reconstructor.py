"""
Reverse Problem Reconstructor

This module analyzes problems from Moodle LMS and reconstructs them in reverse:
- Extract complexity metrics from existing problems
- Generate reverse problems (from solution to problem)
- Create problem variations with different complexity levels
- Decompose and reconstruct problem structures

Educational Context:
"Reverse problem" means creating new problems by working backwards from solutions,
or by decomposing existing problems and reassembling them in new ways.
"""

import re
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

from backend.services.moodle_client import MoodleQuestion, QuestionType
from backend.services.complexity_analyzer import (
    ComplexityMetrics,
    ComplexityAnalyzer,
    ComplexityAssessment
)


class ReconstructionStrategy(str, Enum):
    """Strategy for reverse problem reconstruction"""
    REVERSE_SOLUTION = "reverse_solution"  # From answer to problem
    DECOMPOSE_RECOMPOSE = "decompose_recompose"  # Break down and rebuild
    COMPLEXITY_VARIATION = "complexity_variation"  # Create easier/harder versions
    PATTERN_EXTRACTION = "pattern_extraction"  # Extract and apply patterns


@dataclass
class ProblemStructure:
    """Decomposed structure of a problem"""
    topic: str
    operation: str  # add, subtract, multiply, divide, etc.
    entities: List[str]  # numbers, variables, objects involved
    conditions: List[str]  # constraints or conditions
    solution_steps: List[str]
    complexity_level: str


@dataclass
class ReconstructedProblem:
    """A reconstructed problem with metadata"""
    original_id: int
    original_text: str
    reconstructed_text: str
    strategy: ReconstructionStrategy
    structure: ProblemStructure
    complexity_metrics: ComplexityMetrics
    complexity_assessment: ComplexityAssessment
    variations: List[str] = field(default_factory=list)


class ReverseProblemReconstructor:
    """
    Reconstructs problems in reverse from Moodle LMS questions

    This class implements various strategies for reverse problem construction:
    1. Reverse solution: Start with answer and work backwards
    2. Decompose-recompose: Break problem into parts and reassemble
    3. Complexity variation: Generate easier/harder versions
    4. Pattern extraction: Identify patterns and create new problems
    """

    def __init__(self, language: str = "ko"):
        """
        Initialize reconstructor

        Args:
            language: Target language for reconstructed problems ('ko' or 'en')
        """
        self.language = language
        self.analyzer = ComplexityAnalyzer(language=language)

    def analyze_question_complexity(
        self,
        question: MoodleQuestion
    ) -> Tuple[ComplexityMetrics, ComplexityAssessment]:
        """
        Analyze complexity of a Moodle question

        Args:
            question: MoodleQuestion to analyze

        Returns:
            Tuple of (ComplexityMetrics, ComplexityAssessment)
        """
        # Extract metrics from question structure
        metrics = self._extract_complexity_metrics(question)

        # Get complexity assessment
        assessment = self.analyzer.analyze_problem(metrics, self.language)

        return metrics, assessment

    def _extract_complexity_metrics(
        self,
        question: MoodleQuestion
    ) -> ComplexityMetrics:
        """
        Extract complexity metrics from Moodle question

        Args:
            question: MoodleQuestion to analyze

        Returns:
            ComplexityMetrics object
        """
        # Count conditions in question text
        condition_count = self._count_conditions(question.question_text)

        # Estimate nesting depth from question structure
        nesting_depth = self._estimate_nesting_depth(question)

        # Count entities (numbers, variables, objects)
        entity_count = self._count_entities(question.question_text)

        # Check for cyclical dependencies (usually false for simple problems)
        has_cyclical = self._detect_cyclical_dependencies(question)

        return ComplexityMetrics(
            condition_count=condition_count,
            nesting_depth=nesting_depth,
            entity_count=entity_count,
            has_cyclical_dependencies=has_cyclical
        )

    def _count_conditions(self, text: str) -> int:
        """Count logical conditions in problem text"""
        # Look for conditional keywords
        condition_patterns = [
            r'if\b', r'when\b', r'while\b', r'unless\b',
            r'만약', r'경우', r'때', r'조건'
        ]

        count = 0
        for pattern in condition_patterns:
            count += len(re.findall(pattern, text, re.IGNORECASE))

        # Look for comparison operators
        comparison_patterns = [r'>', r'<', r'>=', r'<=', r'==', r'!=']
        for pattern in comparison_patterns:
            count += text.count(pattern)

        return count

    def _estimate_nesting_depth(self, question: MoodleQuestion) -> int:
        """Estimate nesting depth from question structure"""
        depth = 1  # Base depth

        # Multi-step problems have higher depth
        if question.question_type == QuestionType.CALCULATED:
            depth += 1

        # Matching questions have nested structure
        if question.question_type == QuestionType.MATCHING:
            depth += 1

        # Check for nested parentheses in question text
        text = question.question_text
        max_parens = 0
        current_parens = 0

        for char in text:
            if char == '(':
                current_parens += 1
                max_parens = max(max_parens, current_parens)
            elif char == ')':
                current_parens -= 1

        depth += max_parens

        return min(depth, 5)  # Cap at 5

    def _count_entities(self, text: str) -> int:
        """Count entities (numbers, variables, objects) in text"""
        # Count numbers
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)

        # Count variables (single letters or Greek letters)
        variables = re.findall(r'\b[a-zA-Z]\b|\\[a-z]+', text)

        # Count Korean counting words
        korean_numbers = re.findall(r'[일이삼사오육칠팔구십백천만]', text)

        total_entities = len(set(numbers)) + len(set(variables)) + len(set(korean_numbers))

        return min(total_entities, 10)  # Cap at 10

    def _detect_cyclical_dependencies(self, question: MoodleQuestion) -> bool:
        """Detect if question has cyclical dependencies"""
        # Simple heuristic: look for recursive patterns
        text = question.question_text.lower()

        cyclical_keywords = [
            'recursive', 'iteration', 'loop', 'repeat',
            '재귀', '반복', '순환'
        ]

        return any(keyword in text for keyword in cyclical_keywords)

    def decompose_problem(self, question: MoodleQuestion) -> ProblemStructure:
        """
        Decompose problem into structural components

        Args:
            question: MoodleQuestion to decompose

        Returns:
            ProblemStructure object
        """
        text = question.question_text

        # Extract topic (simple heuristic)
        topic = self._extract_topic(text, question.question_type)

        # Extract operation
        operation = self._extract_operation(text)

        # Extract entities
        entities = self._extract_entities(text)

        # Extract conditions
        conditions = self._extract_conditions(text)

        # Infer solution steps
        solution_steps = self._infer_solution_steps(question)

        # Get complexity level
        metrics, assessment = self.analyze_question_complexity(question)
        complexity_level = assessment.complexity_level

        return ProblemStructure(
            topic=topic,
            operation=operation,
            entities=entities,
            conditions=conditions,
            solution_steps=solution_steps,
            complexity_level=complexity_level
        )

    def _extract_topic(self, text: str, question_type: QuestionType) -> str:
        """Extract topic from question text"""
        # Math topics
        math_topics = {
            'fraction': ['fraction', '분수', 'numerator', 'denominator'],
            'algebra': ['equation', 'solve', '방정식', '미지수'],
            'geometry': ['triangle', 'circle', '삼각형', '원', 'area', '넓이'],
            'arithmetic': ['add', 'subtract', 'multiply', 'divide', '더하기', '빼기', '곱하기', '나누기']
        }

        text_lower = text.lower()
        for topic, keywords in math_topics.items():
            if any(keyword in text_lower for keyword in keywords):
                return topic

        return 'general_math'

    def _extract_operation(self, text: str) -> str:
        """Extract mathematical operation from text"""
        operations = {
            'addition': ['+', 'add', 'sum', 'plus', '더하기', '더하다', '합'],
            'subtraction': ['-', 'subtract', 'minus', 'difference', '빼기', '빼다', '차'],
            'multiplication': ['×', '*', 'multiply', 'times', '곱하기', '곱하다'],
            'division': ['÷', '/', 'divide', '나누기', '나누다'],
            'comparison': ['>', '<', 'compare', '비교', '크다', '작다']
        }

        text_lower = text.lower()
        for operation, keywords in operations.items():
            if any(keyword in text_lower for keyword in keywords):
                return operation

        return 'unknown'

    def _extract_entities(self, text: str) -> List[str]:
        """Extract entities from text"""
        entities = []

        # Extract numbers
        numbers = re.findall(r'\b\d+(?:\.\d+)?\b', text)
        entities.extend([f"num_{n}" for n in numbers[:5]])  # Limit to 5

        # Extract variables
        variables = re.findall(r'\b([a-zA-Z])\b', text)
        entities.extend([f"var_{v}" for v in set(variables)[:3]])

        return entities

    def _extract_conditions(self, text: str) -> List[str]:
        """Extract conditions from text"""
        conditions = []

        # Simple pattern matching for conditions
        condition_sentences = re.split(r'[.!?]', text)

        for sentence in condition_sentences:
            if any(word in sentence.lower() for word in ['if', 'when', 'given', '만약', '주어진']):
                conditions.append(sentence.strip())

        return conditions[:3]  # Limit to 3 conditions

    def _infer_solution_steps(self, question: MoodleQuestion) -> List[str]:
        """Infer solution steps from question structure"""
        steps = []

        if question.question_type == QuestionType.NUMERICAL:
            steps = [
                "Step 1: Identify the given values",
                "Step 2: Apply the mathematical operation",
                "Step 3: Calculate the result"
            ]
        elif question.question_type == QuestionType.MULTICHOICE:
            steps = [
                "Step 1: Read the question carefully",
                "Step 2: Evaluate each option",
                "Step 3: Select the correct answer"
            ]
        else:
            steps = [
                "Step 1: Understand the problem",
                "Step 2: Solve step by step"
            ]

        return steps

    def reconstruct_reverse(
        self,
        question: MoodleQuestion,
        strategy: ReconstructionStrategy = ReconstructionStrategy.REVERSE_SOLUTION
    ) -> ReconstructedProblem:
        """
        Reconstruct problem in reverse

        Args:
            question: Original Moodle question
            strategy: Reconstruction strategy to use

        Returns:
            ReconstructedProblem object
        """
        # Decompose the problem
        structure = self.decompose_problem(question)

        # Analyze complexity
        metrics, assessment = self.analyze_question_complexity(question)

        # Generate reconstructed text based on strategy
        if strategy == ReconstructionStrategy.REVERSE_SOLUTION:
            reconstructed_text = self._reverse_from_solution(question, structure)
        elif strategy == ReconstructionStrategy.DECOMPOSE_RECOMPOSE:
            reconstructed_text = self._decompose_and_recompose(question, structure)
        elif strategy == ReconstructionStrategy.COMPLEXITY_VARIATION:
            reconstructed_text = self._create_complexity_variation(question, structure)
        else:
            reconstructed_text = self._extract_and_apply_pattern(question, structure)

        # Generate variations
        variations = self._generate_variations(question, structure)

        return ReconstructedProblem(
            original_id=question.id,
            original_text=question.question_text,
            reconstructed_text=reconstructed_text,
            strategy=strategy,
            structure=structure,
            complexity_metrics=metrics,
            complexity_assessment=assessment,
            variations=variations
        )

    def _reverse_from_solution(
        self,
        question: MoodleQuestion,
        structure: ProblemStructure
    ) -> str:
        """Create problem by working backwards from solution"""
        if self.language == "ko":
            template = f"""
[역으로 구성된 문제]

주제: {structure.topic}
연산: {structure.operation}

다음 답이 주어졌을 때, 원래 문제를 재구성하세요:

답: [정답이 여기에 표시됨]

힌트:
- 사용된 개념: {', '.join(structure.entities[:3])}
- 필요한 단계 수: {len(structure.solution_steps)}

이 답을 얻기 위해 어떤 문제가 주어졌을까요?
"""
        else:
            template = f"""
[Reverse-Constructed Problem]

Topic: {structure.topic}
Operation: {structure.operation}

Given the following answer, reconstruct the original problem:

Answer: [Answer would be shown here]

Hints:
- Concepts used: {', '.join(structure.entities[:3])}
- Number of steps required: {len(structure.solution_steps)}

What problem would lead to this answer?
"""

        return template.strip()

    def _decompose_and_recompose(
        self,
        question: MoodleQuestion,
        structure: ProblemStructure
    ) -> str:
        """Decompose problem and recompose in new form"""
        if self.language == "ko":
            template = f"""
[분해 및 재구성된 문제]

원래 문제 구조:
- 주제: {structure.topic}
- 연산: {structure.operation}
- 조건: {len(structure.conditions)}개
- 복잡도: {structure.complexity_level}

재구성된 형태:

단계 1: {structure.solution_steps[0] if structure.solution_steps else '문제 이해'}
단계 2: {structure.solution_steps[1] if len(structure.solution_steps) > 1 else '계산 수행'}

새로운 문제: {question.question_text}

[추가 변형 가능]
"""
        else:
            template = f"""
[Decomposed and Recomposed Problem]

Original problem structure:
- Topic: {structure.topic}
- Operation: {structure.operation}
- Conditions: {len(structure.conditions)}
- Complexity: {structure.complexity_level}

Recomposed form:

Step 1: {structure.solution_steps[0] if structure.solution_steps else 'Understand the problem'}
Step 2: {structure.solution_steps[1] if len(structure.solution_steps) > 1 else 'Perform calculation'}

New problem: {question.question_text}

[Additional variations possible]
"""

        return template.strip()

    def _create_complexity_variation(
        self,
        question: MoodleQuestion,
        structure: ProblemStructure
    ) -> str:
        """Create easier or harder version of problem"""
        if self.language == "ko":
            template = f"""
[복잡도 변형 문제]

원래 복잡도: {structure.complexity_level}

쉬운 버전: [조건 감소, 단순화]
{question.question_text}

보통 버전: [원래 문제]
{question.question_text}

어려운 버전: [조건 추가, 복잡도 증가]
{question.question_text}
"""
        else:
            template = f"""
[Complexity Variation]

Original complexity: {structure.complexity_level}

Easy version: [Reduced conditions, simplified]
{question.question_text}

Medium version: [Original problem]
{question.question_text}

Hard version: [Additional conditions, increased complexity]
{question.question_text}
"""

        return template.strip()

    def _extract_and_apply_pattern(
        self,
        question: MoodleQuestion,
        structure: ProblemStructure
    ) -> str:
        """Extract pattern from problem and apply to new context"""
        pattern_description = f"Pattern: {structure.operation} with {len(structure.entities)} entities"

        if self.language == "ko":
            template = f"""
[패턴 추출 및 적용]

추출된 패턴: {pattern_description}
주제: {structure.topic}

원래 문제:
{question.question_text}

동일한 패턴의 새로운 문제:
[이 패턴을 다른 맥락에 적용한 새로운 문제]
"""
        else:
            template = f"""
[Pattern Extraction and Application]

Extracted pattern: {pattern_description}
Topic: {structure.topic}

Original problem:
{question.question_text}

New problem with same pattern:
[New problem applying this pattern to different context]
"""

        return template.strip()

    def _generate_variations(
        self,
        question: MoodleQuestion,
        structure: ProblemStructure
    ) -> List[str]:
        """Generate problem variations"""
        variations = []

        # Variation 1: Change numbers
        if structure.entities:
            variations.append("Variation with different numbers")

        # Variation 2: Change context
        variations.append("Same structure, different context")

        # Variation 3: Simplify
        if structure.complexity_level in ['complex', 'very_complex']:
            variations.append("Simplified version")

        return variations
