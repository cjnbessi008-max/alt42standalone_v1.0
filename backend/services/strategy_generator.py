import os
import json
from typing import List
from anthropic import Anthropic
from models import StrategyStep, StepType


class StrategyGenerator:
    """AI 기반 문제 해결 전략 생성기"""

    def __init__(self):
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        self.client = Anthropic(api_key=api_key)
        self.model = "claude-sonnet-4-5-20250929"

    def generate_strategy(self, problem: str, subject: str = "math", difficulty: str = None) -> List[StrategyStep]:
        """
        주어진 문제에 대한 해결 전략을 단계별로 생성

        Args:
            problem: 해결할 문제
            subject: 과목
            difficulty: 난이도

        Returns:
            전략 단계 리스트
        """

        # AI 프롬프트 구성
        prompt = self._build_prompt(problem, subject, difficulty)

        # Claude API 호출
        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            # 응답 파싱
            response_text = message.content[0].text
            steps = self._parse_response(response_text)

            return steps

        except Exception as e:
            print(f"Error generating strategy: {e}")
            # 폴백: 기본 전략 반환
            return self._get_fallback_strategy(problem)

    def _build_prompt(self, problem: str, subject: str, difficulty: str) -> str:
        """AI 프롬프트 생성"""

        prompt = f"""당신은 교육 전문가입니다. 다음 문제에 대한 해결 전략을 단계별로 구조화해서 제공해주세요.

**문제**: {problem}
**과목**: {subject}
**난이도**: {difficulty or '지정되지 않음'}

다음 JSON 형식으로 응답해주세요:

```json
{{
  "steps": [
    {{
      "id": "step-1",
      "type": "analysis|strategy|substep|solution",
      "title": "단계 제목",
      "content": "단계에 대한 자세한 설명",
      "order": 1,
      "parent_id": null,
      "children_ids": []
    }}
  ]
}}
```

**중요 지침**:
1. 전체 전략을 4-8개의 주요 단계로 나누세요
2. 각 주요 단계는 필요시 2-4개의 하위 단계를 가질 수 있습니다
3. 단계 타입:
   - "analysis": 문제 분석 단계
   - "strategy": 해결 전략 수립 단계
   - "substep": 구체적 실행 단계
   - "solution": 최종 답 도출 단계
4. 각 단계는 학생이 이해하기 쉽게 명확하고 간결하게 작성
5. parent_id는 하위 단계인 경우 상위 단계의 id를 지정
6. children_ids는 해당 단계의 모든 하위 단계 id 리스트

한국어로 응답해주세요. JSON만 출력하세요."""

        return prompt

    def _parse_response(self, response_text: str) -> List[StrategyStep]:
        """AI 응답을 파싱하여 StrategyStep 리스트로 변환"""

        try:
            # JSON 추출 (코드 블록 제거)
            json_text = response_text
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0].strip()

            # JSON 파싱
            data = json.loads(json_text)

            # StrategyStep 객체로 변환
            steps = []
            for step_data in data.get("steps", []):
                step = StrategyStep(**step_data)
                steps.append(step)

            return steps

        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Response text: {response_text}")
            raise ValueError(f"Failed to parse AI response: {e}")

    def _get_fallback_strategy(self, problem: str) -> List[StrategyStep]:
        """API 오류 시 기본 전략 반환"""

        return [
            StrategyStep(
                id="step-1",
                type=StepType.ANALYSIS,
                title="문제 분석",
                content=f"문제를 분석합니다: {problem[:50]}...",
                order=1,
                parent_id=None,
                children_ids=["step-1-1", "step-1-2"]
            ),
            StrategyStep(
                id="step-1-1",
                type=StepType.SUBSTEP,
                title="주어진 정보 파악",
                content="문제에서 주어진 정보를 정리합니다.",
                order=1,
                parent_id="step-1",
                children_ids=[]
            ),
            StrategyStep(
                id="step-1-2",
                type=StepType.SUBSTEP,
                title="구하는 것 파악",
                content="문제에서 구하고자 하는 것을 명확히 합니다.",
                order=2,
                parent_id="step-1",
                children_ids=[]
            ),
            StrategyStep(
                id="step-2",
                type=StepType.STRATEGY,
                title="해결 전략 수립",
                content="문제 해결을 위한 전략을 수립합니다.",
                order=2,
                parent_id=None,
                children_ids=[]
            ),
            StrategyStep(
                id="step-3",
                type=StepType.SUBSTEP,
                title="계산 수행",
                content="필요한 계산을 단계별로 수행합니다.",
                order=3,
                parent_id=None,
                children_ids=[]
            ),
            StrategyStep(
                id="step-4",
                type=StepType.SOLUTION,
                title="답 확인",
                content="계산 결과를 확인하고 최종 답을 작성합니다.",
                order=4,
                parent_id=None,
                children_ids=[]
            ),
        ]
