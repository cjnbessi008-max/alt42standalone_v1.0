"""
AI 기반 인지 부하 분석기
Claude API를 사용한 문제 분석
"""

import json
import os
from typing import Dict, Optional
import anthropic
from .models import (
    ProblemAnalysisRequest,
    AIAnalysisResult,
    IntrinsicLoadMetrics,
    ExtraneousLoadMetrics,
    GermaneLoadMetrics
)


class AIAnalyzer:
    """
    Claude API를 사용한 AI 기반 분석기
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Args:
            api_key: Anthropic API 키 (없으면 환경변수에서 읽음)
        """
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY가 설정되지 않았습니다")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-3-5-sonnet-20241022"

    async def analyze_problem(self, request: ProblemAnalysisRequest) -> AIAnalysisResult:
        """
        문제를 AI로 분석하여 인지 부하 메트릭 생성

        Args:
            request: 문제 분석 요청

        Returns:
            AI 분석 결과
        """
        prompt = self._create_analysis_prompt(request)

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=3000,
                temperature=0.3,  # 일관성을 위해 낮은 temperature
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            response_text = message.content[0].text
            analysis_data = self._parse_response(response_text)

            return AIAnalysisResult(**analysis_data)

        except Exception as e:
            # 에러 시 기본값 반환
            print(f"AI 분석 에러: {str(e)}")
            return self._get_fallback_analysis(request)

    def _create_analysis_prompt(self, request: ProblemAnalysisRequest) -> str:
        """
        분석용 프롬프트 생성
        """
        problem_type_korean = {
            'calculation': '단순 계산',
            'word_problem': '단어 문제',
            'multistep': '다단계 문제',
            'conceptual': '개념 이해',
            'problem_solving': '문제 해결',
            'proof': '증명/논리'
        }

        type_name = problem_type_korean.get(request.problem_type, request.problem_type)

        prompt = f"""당신은 교육 심리학과 인지과학 전문가입니다.
수학 문제의 인지 부하(Cognitive Load)를 분석하여 학생들이 이 문제를 풀 때 필요한 정신적 노력을 수치화해주세요.

## 분석 대상 문제

**문제 유형**: {type_name}
**학년 수준**: {request.grade_level}학년
**답변 방식**: {request.answer_type}

**문제 내용**:
{request.question_text}

---

## 인지 부하 이론 배경

인지 부하는 3가지 차원으로 구성됩니다:

1. **내재적 부하 (Intrinsic Load)**: 문제 자체의 본질적 복잡도
2. **외재적 부하 (Extraneous Load)**: 문제 제시 방식으로 인한 불필요한 부하
3. **본유적 부하 (Germane Load)**: 학습 스키마 구축에 필요한 인지적 노력

---

## 분석 요청

다음 각 차원에서 **1-10점** 척도로 평가해주세요:

### 1. 내재적 부하 (Intrinsic Load)

- **concept_complexity**: 문제에 포함된 수학 개념의 수와 깊이
  - 1-2점: 단일 기초 개념 (예: 한 자리 덧셈)
  - 3-4점: 단일 개념, 약간의 변형
  - 5-6점: 2-3개 개념 결합
  - 7-8점: 여러 개념이 복잡하게 얽힘
  - 9-10점: 추상적/고급 개념의 통합

- **relationship_complexity**: 개념들 간의 상호작용과 관계의 복잡도
  - 1-2점: 관계 없음 또는 매우 단순
  - 3-4점: 직선적 관계
  - 5-6점: 양방향 관계
  - 7-8점: 다차원 관계
  - 9-10점: 순환/재귀적 관계

- **required_steps**: 해결에 필요한 최소 단계 수
  - 1-2점: 1-2단계
  - 3-4점: 3-4단계
  - 5-6점: 5-7단계
  - 7-8점: 8-10단계
  - 9-10점: 10단계 이상 또는 알고리즘적 사고

- **prerequisite_knowledge**: 필요한 선수 학습 개념의 수와 깊이
  - 1-2점: 선수 지식 거의 불필요
  - 3-4점: 1-2개 기초 개념
  - 5-6점: 여러 선수 개념
  - 7-8점: 고급 선수 지식 필요
  - 9-10점: 광범위한 배경 지식 필수

### 2. 외재적 부하 (Extraneous Load)

- **information_density**: 제공된 정보의 양과 관련성
  - 1-2점: 필요한 정보만 간결하게
  - 3-4점: 약간의 추가 정보
  - 5-6점: 중간 정도의 정보 밀도
  - 7-8점: 과도한 정보, 일부 무관
  - 9-10점: 매우 복잡하고 혼란스러운 제시

- **visual_complexity**: 시각 자료의 복잡도
  - 1-2점: 시각 자료 없음 또는 매우 단순
  - 3-4점: 단순한 다이어그램/표
  - 5-6점: 중간 복잡도의 그래픽
  - 7-8점: 복잡한 그래프/다이어그램
  - 9-10점: 여러 시각 요소의 동시 해석 필요

- **linguistic_complexity**: 언어적 난이도 (문장 구조, 어휘)
  - 1-2점: 매우 단순한 문장
  - 3-4점: 기본 문장 구조
  - 5-6점: 중간 복잡도
  - 7-8점: 복잡한 문장, 어려운 어휘
  - 9-10점: 매우 난해한 표현

### 3. 본유적 부하 (Germane Load)

- **abstraction_level**: 추상적 사고의 요구 수준
  - 1-2점: 구체적/실물 기반
  - 3-4점: 반구체적
  - 5-6점: 상징적 표현
  - 7-8점: 추상적 개념
  - 9-10점: 고도로 추상적/메타인지적

- **pattern_recognition**: 패턴 발견 및 적용의 필요성
  - 1-2점: 패턴 인식 불필요
  - 3-4점: 명시적 패턴
  - 5-6점: 숨겨진 패턴 발견
  - 7-8점: 복잡한 패턴 적용
  - 9-10점: 새로운 패턴 생성

- **transfer_potential**: 다른 문제/상황으로의 전이 가능성
  - 1-2점: 매우 특정적, 전이 어려움
  - 3-4점: 제한적 전이
  - 5-6점: 유사 문제로 전이 가능
  - 7-8점: 넓은 범위로 전이 가능
  - 9-10점: 범용적 원리, 광범위한 전이

---

## 추가 분석

- **concepts_identified**: 문제에서 다루는 구체적인 수학 개념 목록 (배열)
- **prerequisite_concepts**: 이 문제를 풀기 위해 미리 알아야 할 개념들 (배열)
- **estimated_time_minutes**: 이 학년 수준 학생이 이 문제를 푸는데 걸릴 예상 시간 (분)
- **recommendations**: 교사가 이 문제를 사용할 때 도움이 될 추천사항 (문자열)

---

## 응답 형식

반드시 다음 JSON 형식으로 응답해주세요:

```json
{{
  "intrinsic": {{
    "concept_complexity": <1-10 점수>,
    "relationship_complexity": <1-10 점수>,
    "required_steps": <1-10 점수>,
    "prerequisite_knowledge": <1-10 점수>,
    "reasoning": "<내재적 부하에 대한 종합 설명>"
  }},
  "extraneous": {{
    "information_density": <1-10 점수>,
    "visual_complexity": <1-10 점수>,
    "linguistic_complexity": <1-10 점수>,
    "reasoning": "<외재적 부하에 대한 종합 설명>"
  }},
  "germane": {{
    "abstraction_level": <1-10 점수>,
    "pattern_recognition": <1-10 점수>,
    "transfer_potential": <1-10 점수>,
    "reasoning": "<본유적 부하에 대한 종합 설명>"
  }},
  "concepts_identified": ["개념1", "개념2", "..."],
  "prerequisite_concepts": ["선수개념1", "선수개념2", "..."],
  "estimated_time_minutes": <숫자>,
  "recommendations": "<교사를 위한 추천사항>"
}}
```

**중요**:
- JSON만 출력하고, 추가 설명은 reasoning 필드에 포함하세요
- 점수는 반드시 1-10 사이의 숫자여야 합니다
- {request.grade_level}학년 수준을 고려하여 평가하세요
"""

        return prompt

    def _parse_response(self, response_text: str) -> Dict:
        """
        Claude 응답에서 JSON 파싱
        """
        # JSON 코드 블록 제거
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            # 일반 코드 블록
            parts = response_text.split("```")
            if len(parts) >= 2:
                response_text = parts[1]

        response_text = response_text.strip()

        try:
            data = json.loads(response_text)
            return data
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 에러: {str(e)}")
            print(f"응답 텍스트: {response_text[:500]}")
            raise

    def _get_fallback_analysis(self, request: ProblemAnalysisRequest) -> AIAnalysisResult:
        """
        AI 분석 실패 시 기본값 반환
        """
        # 문제 유형에 따른 기본값
        type_defaults = {
            'calculation': (3, 2, 2),  # (intrinsic, extraneous, germane)
            'word_problem': (5, 5, 3),
            'multistep': (6, 4, 4),
            'conceptual': (4, 3, 7),
            'problem_solving': (7, 3, 5),
            'proof': (8, 2, 6),
        }

        defaults = type_defaults.get(request.problem_type, (5, 5, 5))

        return AIAnalysisResult(
            intrinsic=IntrinsicLoadMetrics(
                concept_complexity=defaults[0],
                relationship_complexity=defaults[0],
                required_steps=defaults[0],
                prerequisite_knowledge=defaults[0],
                reasoning="AI 분석을 사용할 수 없어 기본값을 사용합니다"
            ),
            extraneous=ExtraneousLoadMetrics(
                information_density=defaults[1],
                visual_complexity=defaults[1],
                linguistic_complexity=defaults[1],
                reasoning="AI 분석을 사용할 수 없어 기본값을 사용합니다"
            ),
            germane=GermaneLoadMetrics(
                abstraction_level=defaults[2],
                pattern_recognition=defaults[2],
                transfer_potential=defaults[2],
                reasoning="AI 분석을 사용할 수 없어 기본값을 사용합니다"
            ),
            concepts_identified=[request.problem_type],
            prerequisite_concepts=[],
            estimated_time_minutes=5,
            recommendations="AI 분석을 다시 시도해주세요"
        )
