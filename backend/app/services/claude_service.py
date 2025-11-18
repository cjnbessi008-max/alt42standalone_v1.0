"""
Claude API integration service
"""
from anthropic import Anthropic
from typing import Dict, Any, List
import json
from ..config import get_settings


class ClaudeService:
    """
    Service for interacting with Claude AI API
    """

    def __init__(self):
        settings = get_settings()
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.claude_model

    async def analyze_learning_pattern(
        self,
        student_data: Dict[str, Any],
        activity_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Analyze learning patterns and generate metacognitive insights

        Args:
            student_data: Student information
            activity_history: List of recent learning activities

        Returns:
            Dict containing analysis results and insights
        """
        prompt = self._build_analysis_prompt(student_data, activity_history)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                temperature=0.7,
                system=self._get_system_prompt(),
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse the response
            response_text = message.content[0].text
            return self._parse_analysis_response(response_text)

        except Exception as e:
            print(f"Error calling Claude API: {e}")
            return {
                "error": str(e),
                "insights": []
            }

    def _get_system_prompt(self) -> str:
        """Get the system prompt for Claude"""
        return """당신은 교육 심리학과 메타인지 전문가입니다.
학생의 학습 활동 데이터를 분석하여 메타인지 성장 포인트를 발견하고,
학생과 교사에게 유용한 인사이트를 제공하는 역할을 합니다.

메타인지 성장 영역:
1. 자기 조절 능력 (Self-Regulation): 힌트 의존도, 학습 계획, 집중도
2. 학습 효율성 (Learning Efficiency): 문제 해결 속도, 정확도 향상
3. 실수에서의 학습 (Learning from Errors): 오답 분석 및 개선
4. 자기 인식 (Self-Awareness): 자기평가 정확도, 난이도 인식
5. 학습 전략 발전 (Strategy Development): 접근 방식의 변화와 발전

분석 시 다음을 포함하세요:
- 구체적인 수치와 비교 데이터
- 긍정적이고 격려하는 톤
- 실행 가능한 조언
- 학생의 노력과 성장 강조

응답은 반드시 JSON 형식으로 작성하세요."""

    def _build_analysis_prompt(
        self,
        student_data: Dict[str, Any],
        activity_history: List[Dict[str, Any]]
    ) -> str:
        """Build the analysis prompt for Claude"""

        prompt = f"""다음 학생의 학습 데이터를 분석하여 오늘의 메타인지 성장 포인트를 추출해주세요.

## 학생 정보
- 이름: {student_data.get('name', 'Unknown')}
- 학년: {student_data.get('grade_level', 'Unknown')}

## 최근 학습 활동 데이터
{json.dumps(activity_history, ensure_ascii=False, indent=2)}

## 요청사항
위 데이터를 분석하여 다음 형식의 JSON으로 응답해주세요:

{{
  "insights": [
    {{
      "dimension": "자기_조절_능력|학습_효율성|실수에서의_학습|자기_인식|학습_전략_발전",
      "title": "성장 포인트 제목 (간결하게)",
      "description": "구체적인 설명 (수치 포함)",
      "recommendation": "실행 가능한 조언",
      "improvement_percentage": 개선 퍼센트 (숫자만),
      "confidence_score": 0.0-1.0,
      "evidence_data": {{
        "metric": "관련 지표",
        "previous_value": 이전 값,
        "current_value": 현재 값,
        "comparison_period": "비교 기간"
      }}
    }}
  ],
  "summary": "전체 학습 요약",
  "key_achievements": ["주요 성취 1", "주요 성취 2"],
  "recommendations": ["추천 사항 1", "추천 사항 2"]
}}

최소 3개, 최대 5개의 인사이트를 생성해주세요. 학생의 성장에 초점을 맞추고 긍정적인 톤을 유지해주세요."""

        return prompt

    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse Claude's response into structured data

        Args:
            response_text: Raw text response from Claude

        Returns:
            Parsed dictionary
        """
        try:
            # Try to extract JSON from the response
            # Claude might wrap JSON in markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                json_text = response_text.strip()

            parsed = json.loads(json_text)
            return parsed

        except json.JSONDecodeError as e:
            print(f"Error parsing Claude response: {e}")
            print(f"Response text: {response_text}")
            return {
                "error": "Failed to parse response",
                "raw_response": response_text,
                "insights": []
            }
