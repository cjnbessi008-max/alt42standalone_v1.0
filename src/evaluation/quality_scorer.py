"""
Quality Score Evaluation Engine
================================
AI-powered evaluation of student thinking quality based on Bloom's Taxonomy.

Uses Claude 3 Sonnet to analyze student responses and assign quality scores
across multiple dimensions: comprehension, analysis, synthesis, logical
reasoning, creativity, and clarity.

Author: AI Agent (Claude)
Date: 2025-11-18
Version: 1.0.0
"""

import anthropic
import logging
import json
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from datetime import datetime
from enum import Enum


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GradeLetter(Enum):
    """Grade letters"""
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    F = "F"


@dataclass
class ComponentScores:
    """Individual component scores (based on Bloom's Taxonomy)"""
    comprehension: float  # Max 20 points
    analysis: float  # Max 25 points
    synthesis: float  # Max 25 points
    logical_reasoning: float  # Max 15 points
    creativity: float  # Max 10 points
    clarity: float  # Max 5 points

    def __post_init__(self):
        """Validate score ranges"""
        assert 0 <= self.comprehension <= 20, "Comprehension must be 0-20"
        assert 0 <= self.analysis <= 25, "Analysis must be 0-25"
        assert 0 <= self.synthesis <= 25, "Synthesis must be 0-25"
        assert 0 <= self.logical_reasoning <= 15, "Logical reasoning must be 0-15"
        assert 0 <= self.creativity <= 10, "Creativity must be 0-10"
        assert 0 <= self.clarity <= 5, "Clarity must be 0-5"

    def total(self) -> float:
        """Calculate total score"""
        return (
            self.comprehension +
            self.analysis +
            self.synthesis +
            self.logical_reasoning +
            self.creativity +
            self.clarity
        )


@dataclass
class QualityScore:
    """Complete quality score evaluation result"""
    total_score: float
    grade_letter: GradeLetter
    component_scores: ComponentScores
    detailed_feedback: str
    strengths: List[str]
    areas_for_improvement: List[str]
    confidence_level: float  # 0.0 to 1.0

    # Metadata
    ai_model_used: str
    evaluation_duration_ms: int
    prompt_tokens: int
    completion_tokens: int
    evaluated_at: datetime


class QualityScoreEvaluator:
    """
    AI-powered quality score evaluator

    Uses Claude 3 Sonnet to evaluate student thinking quality across
    multiple dimensions based on Bloom's Taxonomy.
    """

    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        """
        Initialize evaluator

        Args:
            api_key: Anthropic API key
            model: Claude model to use
        """
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model
        logger.info(f"Initialized QualityScoreEvaluator with model {model}")

    def evaluate(
        self,
        response_text: str,
        student_name: str = "Student",
        grade_level: str = "Unknown",
        activity_name: str = "Activity",
        question_text: Optional[str] = None,
        subject: str = "Mathematics"
    ) -> QualityScore:
        """
        Evaluate thinking quality of a student response

        Args:
            response_text: Student's response text
            student_name: Student name (for context)
            grade_level: Student grade level
            activity_name: Name of activity/assignment
            question_text: Original question (if available)
            subject: Subject area (default: Mathematics)

        Returns:
            QualityScore object with evaluation results
        """
        start_time = time.time()

        # Build evaluation prompt
        prompt = self._build_evaluation_prompt(
            response_text=response_text,
            student_name=student_name,
            grade_level=grade_level,
            activity_name=activity_name,
            question_text=question_text,
            subject=subject
        )

        # Call Claude API
        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                temperature=0.3,  # Lower temperature for consistent grading
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # Parse response
            evaluation_result = self._parse_evaluation_response(response)

            # Calculate duration
            duration_ms = int((time.time() - start_time) * 1000)

            # Build QualityScore object
            quality_score = QualityScore(
                total_score=evaluation_result['total_score'],
                grade_letter=GradeLetter(evaluation_result['grade_letter']),
                component_scores=ComponentScores(**evaluation_result['component_scores']),
                detailed_feedback=evaluation_result['detailed_feedback'],
                strengths=evaluation_result['strengths'],
                areas_for_improvement=evaluation_result['areas_for_improvement'],
                confidence_level=evaluation_result['confidence_level'],
                ai_model_used=self.model,
                evaluation_duration_ms=duration_ms,
                prompt_tokens=response.usage.input_tokens,
                completion_tokens=response.usage.output_tokens,
                evaluated_at=datetime.now()
            )

            logger.info(
                f"Evaluated response: {quality_score.total_score}/100 "
                f"(Grade: {quality_score.grade_letter.value}) "
                f"in {duration_ms}ms"
            )

            return quality_score

        except Exception as e:
            logger.error(f"Error during evaluation: {str(e)}")
            raise

    def _build_evaluation_prompt(
        self,
        response_text: str,
        student_name: str,
        grade_level: str,
        activity_name: str,
        question_text: Optional[str],
        subject: str
    ) -> str:
        """
        Build evaluation prompt for Claude

        Args:
            response_text: Student response
            student_name: Student name
            grade_level: Grade level
            activity_name: Activity name
            question_text: Original question
            subject: Subject area

        Returns:
            Formatted prompt string
        """
        question_section = ""
        if question_text:
            question_section = f"""
Original Question:
{question_text}
"""

        prompt = f"""Role: You are an expert educational assessment specialist focusing on evaluating student thinking quality in {subject} education. You use Bloom's Taxonomy as a framework for evaluation.

Context:
- Student: {student_name} (Grade {grade_level})
- Activity: {activity_name}
- Subject: {subject}
- Evaluation Date: {datetime.now().strftime('%Y-%m-%d')}

{question_section}

Student Response:
\"\"\"
{response_text}
\"\"\"

Task: Evaluate the quality of thinking demonstrated in this student response based on the following criteria (Bloom's Taxonomy):

1. **Comprehension (0-20 points)**: Does the student understand core {subject} concepts?
   - Shows understanding of fundamental concepts
   - Correctly identifies key information
   - Demonstrates conceptual knowledge

2. **Analysis (0-25 points)**: Can the student break down problems into components?
   - Identifies relationships between concepts
   - Distinguishes between facts and inferences
   - Recognizes patterns and structures

3. **Synthesis (0-25 points)**: Does the student combine ideas to form new understanding?
   - Integrates multiple concepts
   - Creates connections across topics
   - Develops coherent arguments or solutions

4. **Logical Reasoning (0-15 points)**: Is the argumentation coherent and well-structured?
   - Uses valid logical steps
   - Provides clear justifications
   - Maintains consistency

5. **Creativity (0-10 points)**: Does the student show novel approaches or insights?
   - Original thinking or unique perspectives
   - Creative problem-solving strategies
   - Goes beyond standard approaches

6. **Clarity (0-5 points)**: Is the expression of ideas clear and well-organized?
   - Clear communication
   - Organized presentation
   - Appropriate terminology

Grading Scale:
- 90-100: Exceptional thinking (A)
- 80-89: Strong thinking (B)
- 70-79: Adequate thinking (C)
- 60-69: Developing thinking (D)
- 0-59: Needs improvement (F)

IMPORTANT INSTRUCTIONS:
1. Be fair and consistent in your evaluation
2. Consider the student's grade level when evaluating complexity
3. Provide specific, actionable feedback
4. Identify both strengths and areas for improvement
5. Base your confidence level on how well the response demonstrates clear thinking

Output Format (MUST BE VALID JSON):
{{
  "total_score": <number between 0-100>,
  "grade_letter": "<A/B/C/D/F>",
  "component_scores": {{
    "comprehension": <number between 0-20>,
    "analysis": <number between 0-25>,
    "synthesis": <number between 0-25>,
    "logical_reasoning": <number between 0-15>,
    "creativity": <number between 0-10>,
    "clarity": <number between 0-5>
  }},
  "detailed_feedback": "<2-3 sentences of specific, constructive feedback>",
  "strengths": ["<specific strength 1>", "<specific strength 2>"],
  "areas_for_improvement": ["<specific area 1>", "<specific area 2>"],
  "confidence_level": <number between 0.0-1.0>
}}

Evaluate now and output ONLY the JSON (no additional text before or after):"""

        return prompt

    def _parse_evaluation_response(self, response: Any) -> Dict[str, Any]:
        """
        Parse Claude API response and extract evaluation data

        Args:
            response: Claude API response object

        Returns:
            Parsed evaluation dictionary
        """
        # Extract text from response
        content = response.content[0].text

        # Find JSON in response (in case there's extra text)
        # Look for JSON object between curly braces
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)

        if not json_match:
            raise ValueError("No valid JSON found in API response")

        json_str = json_match.group(0)

        # Parse JSON
        try:
            evaluation_data = json.loads(json_str)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            logger.error(f"Response content: {content}")
            raise

        # Validate required fields
        required_fields = [
            'total_score', 'grade_letter', 'component_scores',
            'detailed_feedback', 'strengths', 'areas_for_improvement',
            'confidence_level'
        ]

        for field in required_fields:
            if field not in evaluation_data:
                raise ValueError(f"Missing required field: {field}")

        # Validate component scores
        component_required = [
            'comprehension', 'analysis', 'synthesis',
            'logical_reasoning', 'creativity', 'clarity'
        ]

        for component in component_required:
            if component not in evaluation_data['component_scores']:
                raise ValueError(f"Missing component score: {component}")

        return evaluation_data

    def evaluate_batch(
        self,
        responses: List[Dict[str, Any]],
        batch_size: int = 10
    ) -> List[QualityScore]:
        """
        Evaluate multiple responses in batches

        Args:
            responses: List of response dictionaries
            batch_size: Number of responses to process concurrently

        Returns:
            List of QualityScore objects
        """
        results = []

        for i in range(0, len(responses), batch_size):
            batch = responses[i:i + batch_size]
            logger.info(f"Processing batch {i // batch_size + 1} ({len(batch)} responses)")

            for response_data in batch:
                try:
                    score = self.evaluate(
                        response_text=response_data.get('response_text', ''),
                        student_name=response_data.get('student_name', 'Student'),
                        grade_level=response_data.get('grade_level', 'Unknown'),
                        activity_name=response_data.get('activity_name', 'Activity'),
                        question_text=response_data.get('question_text'),
                        subject=response_data.get('subject', 'Mathematics')
                    )
                    results.append(score)

                except Exception as e:
                    logger.error(
                        f"Error evaluating response for "
                        f"{response_data.get('student_name')}: {e}"
                    )
                    # Continue with next response

            # Small delay between batches to avoid rate limits
            if i + batch_size < len(responses):
                time.sleep(1)

        logger.info(f"Completed batch evaluation: {len(results)}/{len(responses)} successful")
        return results

    @staticmethod
    def calculate_grade_letter(total_score: float) -> GradeLetter:
        """
        Calculate grade letter from total score

        Args:
            total_score: Total score (0-100)

        Returns:
            GradeLetter enum
        """
        if total_score >= 90:
            return GradeLetter.A
        elif total_score >= 80:
            return GradeLetter.B
        elif total_score >= 70:
            return GradeLetter.C
        elif total_score >= 60:
            return GradeLetter.D
        else:
            return GradeLetter.F


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    import os

    # Get API key from environment
    api_key = os.getenv('ANTHROPIC_API_KEY')

    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable not set")
        exit(1)

    # Initialize evaluator
    evaluator = QualityScoreEvaluator(api_key=api_key)

    # Sample student response
    sample_response = """
    분수의 덧셈을 계산하기 위해서는 먼저 분모를 같게 만들어야 합니다.
    1/2 + 1/3의 경우, 분모 2와 3의 최소공배수는 6입니다.

    1/2 = 3/6 (분자와 분모에 3을 곱함)
    1/3 = 2/6 (분자와 분모에 2를 곱함)

    이제 분모가 같으므로 분자만 더하면 됩니다:
    3/6 + 2/6 = 5/6

    따라서 답은 5/6입니다.

    (Translation: To add fractions, we first need to make the denominators equal.
    For 1/2 + 1/3, the least common multiple of 2 and 3 is 6.
    Converting: 1/2 = 3/6, 1/3 = 2/6
    Now we can add: 3/6 + 2/6 = 5/6
    Therefore, the answer is 5/6.)
    """

    # Evaluate
    print("Evaluating student response...\n")

    try:
        score = evaluator.evaluate(
            response_text=sample_response,
            student_name="지수 (Jisu)",
            grade_level="3학년 (Grade 3)",
            activity_name="분수 덧셈 문제 (Fraction Addition Problem)",
            question_text="1/2 + 1/3을 계산하시오. (Calculate 1/2 + 1/3)",
            subject="Mathematics"
        )

        # Display results
        print("=" * 60)
        print("QUALITY SCORE EVALUATION RESULTS")
        print("=" * 60)
        print(f"\nTotal Score: {score.total_score}/100")
        print(f"Grade Letter: {score.grade_letter.value}")
        print(f"Confidence: {score.confidence_level:.2f}")

        print(f"\nComponent Scores:")
        print(f"  - Comprehension: {score.component_scores.comprehension}/20")
        print(f"  - Analysis: {score.component_scores.analysis}/25")
        print(f"  - Synthesis: {score.component_scores.synthesis}/25")
        print(f"  - Logical Reasoning: {score.component_scores.logical_reasoning}/15")
        print(f"  - Creativity: {score.component_scores.creativity}/10")
        print(f"  - Clarity: {score.component_scores.clarity}/5")

        print(f"\nDetailed Feedback:")
        print(f"  {score.detailed_feedback}")

        print(f"\nStrengths:")
        for strength in score.strengths:
            print(f"  ✓ {strength}")

        print(f"\nAreas for Improvement:")
        for area in score.areas_for_improvement:
            print(f"  → {area}")

        print(f"\nEvaluation Metadata:")
        print(f"  - Model: {score.ai_model_used}")
        print(f"  - Duration: {score.evaluation_duration_ms}ms")
        print(f"  - Tokens: {score.prompt_tokens} prompt + {score.completion_tokens} completion")
        print(f"  - Evaluated at: {score.evaluated_at}")

        print("\n" + "=" * 60)

    except Exception as e:
        print(f"Error during evaluation: {e}")
