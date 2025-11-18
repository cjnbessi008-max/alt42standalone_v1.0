"""
Key Condition Text Processor for Probability and Combinatorics Problems

This module automatically identifies and extracts key conditions from
mathematical problems, particularly focused on probability and combinatorics.
"""

import re
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum


class ConditionType(Enum):
    """Types of key conditions in probability/combinatorics problems"""
    INDEPENDENCE = "independence"  # 독립 사건
    CONSTRAINT = "constraint"  # 제약 조건
    ASSUMPTION = "assumption"  # 가정
    REQUIREMENT = "requirement"  # 요구 사항
    EXCEPTION = "exception"  # 예외 조건
    SAMPLE_SPACE = "sample_space"  # 표본 공간
    EVENT = "event"  # 사건 정의
    PROBABILITY = "probability"  # 확률 값


@dataclass
class KeyCondition:
    """Represents a key condition found in a problem"""
    text: str  # 추출된 조건 텍스트
    start_pos: int  # 시작 위치
    end_pos: int  # 끝 위치
    condition_type: ConditionType  # 조건 유형
    category: str  # 세부 카테고리
    importance: str  # critical, high, medium, low
    explanation: str  # 설명


class ProbabilityTextProcessor:
    """Processor for extracting key conditions from probability problems"""

    # 확률/조합론 관련 키워드 사전 (한국어 + 영어)
    PROBABILITY_KEYWORDS = {
        'independence': [
            r'독립(?:적)?(?:인|이)?(?:\s*사건)?',
            r'서로\s*독립',
            r'independent(?:ly)?',
            r'mutually\s+independent',
        ],
        'constraint': [
            r'(?:단|다만)',
            r'(?:조건|제약)(?:은|이)?',
            r'(?:~(?:해야|할)\s*(?:한다|함))',
            r'must|should|constraint',
        ],
        'assumption': [
            r'가정(?:하|한다|할\s*때)',
            r'(?:라고)?\s*하[자면]',
            r'assume|given\s+that|suppose',
        ],
        'probability_value': [
            r'확률(?:은|이)?',
            r'P\s*\(',
            r'probability\s+(?:of|is|that)',
            r'\d+/\d+',  # 분수 형태 확률
            r'\d+\.\d+',  # 소수 형태 확률
        ],
        'sample_space': [
            r'표본\s*공간',
            r'전체\s*경우(?:의\s*수)?',
            r'sample\s+space',
            r'all\s+possible\s+outcomes',
        ],
        'event': [
            r'사건\s*[A-Z가-힣]',
            r'경우',
            r'event\s*[A-Z]',
            r'outcome',
        ],
        'combination': [
            r'조합',
            r'[nN]C[rRkK]',
            r'C\s*\(\s*\d+\s*,\s*\d+\s*\)',
            r'combination',
            r'choose',
        ],
        'permutation': [
            r'순열',
            r'[nN]P[rRkK]',
            r'P\s*\(\s*\d+\s*,\s*\d+\s*\)',
            r'permutation',
            r'arrange',
        ],
    }

    # 중요도 결정 키워드
    CRITICAL_MARKERS = [
        r'반드시', r'필수', r'단', r'다만', r'오직', r'only', r'must', r'exclusively'
    ]

    HIGH_IMPORTANCE_MARKERS = [
        r'모든', r'각', r'every', r'all', r'each'
    ]

    def __init__(self):
        """Initialize the text processor"""
        self.compiled_patterns = self._compile_patterns()

    def _compile_patterns(self) -> Dict[str, List[re.Pattern]]:
        """Compile all regex patterns for efficiency"""
        compiled = {}
        for category, patterns in self.PROBABILITY_KEYWORDS.items():
            compiled[category] = [re.compile(p, re.IGNORECASE) for p in patterns]
        return compiled

    def extract_key_conditions(self, problem_text: str) -> List[KeyCondition]:
        """
        Extract all key conditions from a problem text

        Args:
            problem_text: The problem statement text

        Returns:
            List of KeyCondition objects
        """
        conditions = []

        # 문장 단위로 분리
        sentences = self._split_sentences(problem_text)

        current_pos = 0
        for sentence in sentences:
            # 문장에서 조건 추출
            sentence_conditions = self._extract_from_sentence(
                sentence, current_pos
            )
            conditions.extend(sentence_conditions)
            current_pos += len(sentence)

        # 중복 제거 및 중요도 순 정렬
        conditions = self._deduplicate_conditions(conditions)
        conditions.sort(key=lambda c: self._importance_score(c), reverse=True)

        return conditions

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences (Korean + English)"""
        # 한국어: 마침표, 물음표, 느낌표
        # 영어: 마침표, 물음표, 느낌표
        sentences = re.split(r'[.?!]\s+', text)
        return [s.strip() for s in sentences if s.strip()]

    def _extract_from_sentence(
        self, sentence: str, base_pos: int
    ) -> List[KeyCondition]:
        """Extract conditions from a single sentence"""
        conditions = []

        # 각 카테고리별로 패턴 매칭
        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                matches = pattern.finditer(sentence)
                for match in matches:
                    condition = self._create_condition(
                        sentence, match, category, base_pos
                    )
                    if condition:
                        conditions.append(condition)

        return conditions

    def _create_condition(
        self, sentence: str, match: re.Match, category: str, base_pos: int
    ) -> KeyCondition:
        """Create a KeyCondition object from a regex match"""
        # 매칭된 위치 주변 컨텍스트 추출 (전후 20자)
        start = max(0, match.start() - 20)
        end = min(len(sentence), match.end() + 20)
        context = sentence[start:end].strip()

        # 조건 타입 결정
        condition_type = self._determine_condition_type(category, context)

        # 중요도 결정
        importance = self._determine_importance(context)

        # 설명 생성
        explanation = self._generate_explanation(condition_type, category)

        return KeyCondition(
            text=context,
            start_pos=base_pos + start,
            end_pos=base_pos + end,
            condition_type=condition_type,
            category=category,
            importance=importance,
            explanation=explanation
        )

    def _determine_condition_type(
        self, category: str, context: str
    ) -> ConditionType:
        """Determine the type of condition based on category and context"""
        type_mapping = {
            'independence': ConditionType.INDEPENDENCE,
            'constraint': ConditionType.CONSTRAINT,
            'assumption': ConditionType.ASSUMPTION,
            'probability_value': ConditionType.PROBABILITY,
            'sample_space': ConditionType.SAMPLE_SPACE,
            'event': ConditionType.EVENT,
        }
        return type_mapping.get(category, ConditionType.REQUIREMENT)

    def _determine_importance(self, context: str) -> str:
        """Determine importance level based on markers in context"""
        # Critical markers
        for marker in self.CRITICAL_MARKERS:
            if re.search(marker, context, re.IGNORECASE):
                return "critical"

        # High importance markers
        for marker in self.HIGH_IMPORTANCE_MARKERS:
            if re.search(marker, context, re.IGNORECASE):
                return "high"

        # Default to medium
        return "medium"

    def _generate_explanation(
        self, condition_type: ConditionType, category: str
    ) -> str:
        """Generate explanation for the condition"""
        explanations = {
            ConditionType.INDEPENDENCE: "사건들이 서로 영향을 주지 않는 독립적인 관계입니다.",
            ConditionType.CONSTRAINT: "문제 해결을 위해 반드시 고려해야 할 제약 조건입니다.",
            ConditionType.ASSUMPTION: "문제에서 주어진 가정 또는 전제 조건입니다.",
            ConditionType.PROBABILITY: "확률값 또는 확률 계산과 관련된 조건입니다.",
            ConditionType.SAMPLE_SPACE: "모든 가능한 결과의 집합을 정의합니다.",
            ConditionType.EVENT: "특정 사건 또는 경우를 정의합니다.",
        }
        return explanations.get(
            condition_type,
            "문제 해결에 필요한 핵심 조건입니다."
        )

    def _deduplicate_conditions(
        self, conditions: List[KeyCondition]
    ) -> List[KeyCondition]:
        """Remove duplicate or overlapping conditions"""
        if not conditions:
            return []

        # 위치 기준으로 정렬
        sorted_conditions = sorted(conditions, key=lambda c: c.start_pos)

        deduplicated = [sorted_conditions[0]]
        for condition in sorted_conditions[1:]:
            # 이전 조건과 겹치지 않으면 추가
            if condition.start_pos >= deduplicated[-1].end_pos:
                deduplicated.append(condition)
            # 겹치지만 중요도가 더 높으면 교체
            elif self._importance_score(condition) > self._importance_score(deduplicated[-1]):
                deduplicated[-1] = condition

        return deduplicated

    def _importance_score(self, condition: KeyCondition) -> int:
        """Calculate numeric importance score for sorting"""
        importance_values = {
            "critical": 4,
            "high": 3,
            "medium": 2,
            "low": 1
        }
        return importance_values.get(condition.importance, 0)

    def generate_highlight_metadata(
        self, problem_text: str, problem_id: str = None
    ) -> Dict:
        """
        Generate complete highlight metadata for frontend consumption

        Args:
            problem_text: The problem statement
            problem_id: Optional problem identifier

        Returns:
            Dictionary with highlight metadata in JSON-serializable format
        """
        conditions = self.extract_key_conditions(problem_text)

        return {
            "problem_id": problem_id,
            "problem_text": problem_text,
            "total_conditions": len(conditions),
            "conditions": [
                {
                    "id": idx,
                    "text": cond.text,
                    "start_pos": cond.start_pos,
                    "end_pos": cond.end_pos,
                    "type": cond.condition_type.value,
                    "category": cond.category,
                    "importance": cond.importance,
                    "explanation": cond.explanation
                }
                for idx, cond in enumerate(conditions)
            ]
        }


# Example usage and testing
if __name__ == "__main__":
    processor = ProbabilityTextProcessor()

    # 샘플 문제 (한국어)
    sample_problem_kr = """
    주머니에 빨간 공 3개와 파란 공 5개가 들어있다.
    이 주머니에서 임의로 2개의 공을 동시에 꺼낼 때,
    두 공이 모두 같은 색일 확률을 구하시오.
    단, 각 공을 선택할 확률은 모두 같다.
    """

    # 샘플 문제 (영어)
    sample_problem_en = """
    A bag contains 3 red balls and 5 blue balls.
    If we randomly select 2 balls simultaneously,
    find the probability that both balls are the same color.
    Assume that each ball has an equal probability of being selected.
    """

    print("=== Korean Problem Analysis ===")
    result_kr = processor.generate_highlight_metadata(sample_problem_kr, "prob_001")
    print(f"Found {result_kr['total_conditions']} key conditions:")
    for cond in result_kr['conditions']:
        print(f"\n- Type: {cond['type']}")
        print(f"  Importance: {cond['importance']}")
        print(f"  Text: {cond['text']}")
        print(f"  Explanation: {cond['explanation']}")

    print("\n" + "="*50)
    print("=== English Problem Analysis ===")
    result_en = processor.generate_highlight_metadata(sample_problem_en, "prob_002")
    print(f"Found {result_en['total_conditions']} key conditions:")
    for cond in result_en['conditions']:
        print(f"\n- Type: {cond['type']}")
        print(f"  Importance: {cond['importance']}")
        print(f"  Text: {cond['text']}")
        print(f"  Explanation: {cond['explanation']}")
