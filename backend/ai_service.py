"""
Claude AI service for analyzing student reasoning and providing feedback
"""
import os
import time
from typing import Dict, Optional
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()


class ReasoningAnalyzer:
    """
    Service for analyzing student reasoning using Claude AI
    """

    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")

        self.client = Anthropic(api_key=self.api_key)
        self.model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")

    async def analyze_reasoning(
        self,
        problem_description: str,
        correct_answer: str,
        student_answer: str,
        student_explanation: str,
        language: str = "ko"
    ) -> Dict[str, any]:
        """
        Analyze student's reasoning and provide constructive feedback

        Args:
            problem_description: The problem statement
            correct_answer: The correct answer
            student_answer: What the student submitted
            student_explanation: Student's explanation of their reasoning
            language: 'ko' or 'en'

        Returns:
            Dict containing:
                - identified_misconception: What went wrong
                - reasoning_error_type: Type of error
                - corrective_feedback: How to improve
                - encouragement: Positive reinforcement
                - confidence_score: AI's confidence (0-1)
                - processing_time_ms: Time taken
        """
        start_time = time.time()

        # Build the prompt based on language
        if language == "ko":
            system_prompt = self._build_korean_system_prompt()
            user_prompt = self._build_korean_user_prompt(
                problem_description,
                correct_answer,
                student_answer,
                student_explanation
            )
        else:
            system_prompt = self._build_english_system_prompt()
            user_prompt = self._build_english_user_prompt(
                problem_description,
                correct_answer,
                student_answer,
                student_explanation
            )

        try:
            # Call Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )

            # Parse response
            response_text = response.content[0].text
            analysis = self._parse_analysis_response(response_text, language)

            # Calculate processing time
            processing_time_ms = int((time.time() - start_time) * 1000)
            analysis["processing_time_ms"] = processing_time_ms

            return analysis

        except Exception as e:
            print(f"Error calling Claude API: {str(e)}")
            # Return fallback response
            return self._fallback_analysis(language)

    def _build_korean_system_prompt(self) -> str:
        return """당신은 초등학교 수학 교육 전문가입니다. 학생들의 잘못된 추론을 분석하고 건설적인 피드백을 제공하는 것이 목표입니다.

**중요 원칙:**
1. 학생의 실수를 비난하지 말고, 학습 기회로 전환하세요
2. 구체적이고 실행 가능한 조언을 제공하세요
3. 학생의 노력을 인정하고 격려하세요
4. 개념적 이해에 초점을 맞추세요
5. 간단하고 명확한 언어를 사용하세요

**응답 형식:**
다음 형식으로 정확히 응답해주세요:

MISCONCEPTION: [학생이 잘못 이해한 개념을 한 문장으로]
ERROR_TYPE: [calculation_error|concept_misunderstanding|procedure_error|reading_error]
FEEDBACK: [어떻게 고칠 수 있는지 2-3문장으로 설명]
ENCOURAGEMENT: [긍정적인 격려 한 문장]
CONFIDENCE: [0.00-1.00 사이의 숫자]"""

    def _build_english_system_prompt(self) -> str:
        return """You are an elementary school mathematics education expert. Your goal is to analyze students' incorrect reasoning and provide constructive feedback.

**Key Principles:**
1. Don't criticize mistakes; turn them into learning opportunities
2. Provide specific, actionable advice
3. Acknowledge and encourage student effort
4. Focus on conceptual understanding
5. Use simple, clear language

**Response Format:**
Please respond exactly in this format:

MISCONCEPTION: [What the student misunderstood in one sentence]
ERROR_TYPE: [calculation_error|concept_misunderstanding|procedure_error|reading_error]
FEEDBACK: [How to fix it in 2-3 sentences]
ENCOURAGEMENT: [One sentence of positive reinforcement]
CONFIDENCE: [Number between 0.00-1.00]"""

    def _build_korean_user_prompt(
        self,
        problem: str,
        correct: str,
        student: str,
        explanation: str
    ) -> str:
        return f"""문제: {problem}

정답: {correct}

학생 답변: {student}

학생의 설명: "{explanation}"

이 학생의 추론 과정을 분석하고 건설적인 피드백을 제공해주세요."""

    def _build_english_user_prompt(
        self,
        problem: str,
        correct: str,
        student: str,
        explanation: str
    ) -> str:
        return f"""Problem: {problem}

Correct Answer: {correct}

Student Answer: {student}

Student's Explanation: "{explanation}"

Please analyze this student's reasoning process and provide constructive feedback."""

    def _parse_analysis_response(self, response_text: str, language: str) -> Dict[str, any]:
        """
        Parse the structured response from Claude
        """
        lines = response_text.strip().split("\n")
        result = {
            "identified_misconception": "",
            "reasoning_error_type": "unknown",
            "corrective_feedback": "",
            "encouragement": "",
            "confidence_score": 0.85
        }

        for line in lines:
            line = line.strip()
            if line.startswith("MISCONCEPTION:"):
                result["identified_misconception"] = line.replace("MISCONCEPTION:", "").strip()
            elif line.startswith("ERROR_TYPE:"):
                result["reasoning_error_type"] = line.replace("ERROR_TYPE:", "").strip()
            elif line.startswith("FEEDBACK:"):
                result["corrective_feedback"] = line.replace("FEEDBACK:", "").strip()
            elif line.startswith("ENCOURAGEMENT:"):
                result["encouragement"] = line.replace("ENCOURAGEMENT:", "").strip()
            elif line.startswith("CONFIDENCE:"):
                try:
                    conf_str = line.replace("CONFIDENCE:", "").strip()
                    result["confidence_score"] = float(conf_str)
                except:
                    result["confidence_score"] = 0.85

        # Fallback if parsing fails
        if not result["identified_misconception"]:
            result["identified_misconception"] = response_text[:200]
        if not result["corrective_feedback"]:
            result["corrective_feedback"] = response_text

        return result

    def _fallback_analysis(self, language: str) -> Dict[str, any]:
        """
        Fallback response if AI call fails
        """
        if language == "ko":
            return {
                "identified_misconception": "AI 분석을 수행할 수 없습니다.",
                "reasoning_error_type": "system_error",
                "corrective_feedback": "나중에 다시 시도해주세요. 선생님께 도움을 요청할 수도 있습니다.",
                "encouragement": "계속 노력하면 잘할 수 있어요!",
                "confidence_score": 0.0,
                "processing_time_ms": 0
            }
        else:
            return {
                "identified_misconception": "Unable to perform AI analysis.",
                "reasoning_error_type": "system_error",
                "corrective_feedback": "Please try again later. You can also ask your teacher for help.",
                "encouragement": "Keep trying, you can do it!",
                "confidence_score": 0.0,
                "processing_time_ms": 0
            }


# Singleton instance
_analyzer_instance: Optional[ReasoningAnalyzer] = None

def get_reasoning_analyzer() -> ReasoningAnalyzer:
    """
    Get or create the singleton ReasoningAnalyzer instance
    """
    global _analyzer_instance
    if _analyzer_instance is None:
        _analyzer_instance = ReasoningAnalyzer()
    return _analyzer_instance
