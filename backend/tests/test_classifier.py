"""
Tests for Answer Classifier Service
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.classifier import (
    AnswerClassifier,
    should_request_teacher_review,
    get_classification_emoji,
    get_classification_color
)
from app.models.schemas import ErrorType


class TestAnswerClassifier:
    """AnswerClassifier 서비스 테스트"""

    @pytest.fixture
    def classifier(self):
        """Classifier 인스턴스 생성"""
        return AnswerClassifier(
            api_key="test-api-key",
            model="claude-3-sonnet-20240229"
        )

    @pytest.fixture
    def sample_classification_response(self):
        """샘플 AI 응답"""
        return """
        {
            "classification": "개념",
            "confidence": 0.92,
            "reasoning": "학생이 분수 덧셈의 통분 개념을 이해하지 못했습니다.",
            "feedback": "분수를 더할 때는 먼저 분모를 같게 만들어야 합니다.",
            "recommended_action": "통분 개념과 최소공배수 찾기를 복습하세요."
        }
        """

    def test_build_classification_prompt(self, classifier):
        """분류 프롬프트 생성 테스트"""
        prompt = classifier._build_classification_prompt(
            problem_text="1/3 + 1/4 = ?",
            correct_answer="7/12",
            student_answer="2/7",
            work_shown="1+1=2, 3+4=7"
        )

        # 프롬프트에 필요한 정보가 포함되어 있는지 확인
        assert "1/3 + 1/4 = ?" in prompt
        assert "7/12" in prompt
        assert "2/7" in prompt
        assert "1+1=2, 3+4=7" in prompt
        assert "개념" in prompt
        assert "계산" in prompt
        assert "조건누락" in prompt

    def test_parse_classification_response_valid(self, classifier, sample_classification_response):
        """유효한 AI 응답 파싱 테스트"""
        result = classifier._parse_classification_response(sample_classification_response)

        assert result['classification'] == '개념'
        assert result['confidence'] == 0.92
        assert '통분' in result['reasoning']
        assert '분모' in result['feedback']

    def test_parse_classification_response_invalid_json(self, classifier):
        """잘못된 JSON 응답 처리 테스트"""
        with pytest.raises(ValueError):
            classifier._parse_classification_response("Not a JSON response")

    def test_parse_classification_response_missing_fields(self, classifier):
        """필수 필드 누락 테스트"""
        invalid_response = '{"classification": "개념"}'

        with pytest.raises(ValueError, match="Missing required field"):
            classifier._parse_classification_response(invalid_response)

    def test_parse_classification_response_invalid_type(self, classifier):
        """잘못된 분류 타입 테스트"""
        invalid_response = """
        {
            "classification": "잘못된타입",
            "confidence": 0.9,
            "reasoning": "test",
            "feedback": "test"
        }
        """

        with pytest.raises(ValueError, match="Invalid classification"):
            classifier._parse_classification_response(invalid_response)

    def test_parse_classification_response_out_of_range_confidence(self, classifier):
        """신뢰도 범위 초과 테스트"""
        invalid_response = """
        {
            "classification": "개념",
            "confidence": 1.5,
            "reasoning": "test",
            "feedback": "test"
        }
        """

        with pytest.raises(ValueError, match="Confidence out of range"):
            classifier._parse_classification_response(invalid_response)

    def test_fallback_classification(self, classifier):
        """폴백 분류 테스트"""
        result = classifier._fallback_classification(
            student_answer="wrong",
            correct_answer="correct"
        )

        assert result['classification'] in ['개념', '계산', '조건누락']
        assert result['confidence'] == 0.3  # 낮은 신뢰도
        assert '자동 분류 실패' in result['reasoning']

    def test_fallback_classification_short_answer(self, classifier):
        """짧은 답변 폴백 분류 테스트"""
        result = classifier._fallback_classification(
            student_answer="x",
            correct_answer="correct answer"
        )

        assert result['classification'] == '조건누락'
        assert '너무 짧' in result['reasoning']

    @pytest.mark.asyncio
    async def test_classify_answer_success(self, classifier, sample_classification_response):
        """분류 성공 테스트"""
        # Mock Claude API response
        mock_response = Mock()
        mock_response.content = [Mock(text=sample_classification_response)]

        with patch.object(classifier.client.messages, 'create', return_value=mock_response):
            result = await classifier.classify_answer(
                problem_text="1/3 + 1/4 = ?",
                correct_answer="7/12",
                student_answer="2/7"
            )

            assert result['classification'] == '개념'
            assert result['confidence'] == 0.92
            assert '통분' in result['reasoning']

    @pytest.mark.asyncio
    async def test_classify_answer_api_failure(self, classifier):
        """API 실패 시 폴백 테스트"""
        # Mock API failure
        with patch.object(
            classifier.client.messages,
            'create',
            side_effect=Exception("API Error")
        ):
            result = await classifier.classify_answer(
                problem_text="test problem",
                correct_answer="correct",
                student_answer="wrong"
            )

            # Should return fallback classification
            assert result['confidence'] == 0.3
            assert '자동 분류 실패' in result['reasoning']

    def test_get_model_version(self, classifier):
        """모델 버전 조회 테스트"""
        assert classifier.get_model_version() == "claude-3-sonnet-20240229"


class TestUtilityFunctions:
    """유틸리티 함수 테스트"""

    def test_should_request_teacher_review_low_confidence(self):
        """낮은 신뢰도 검토 요청 테스트"""
        assert should_request_teacher_review(0.5) is True
        assert should_request_teacher_review(0.59) is True

    def test_should_request_teacher_review_high_confidence(self):
        """높은 신뢰도 검토 불필요 테스트"""
        assert should_request_teacher_review(0.6) is False
        assert should_request_teacher_review(0.85) is False
        assert should_request_teacher_review(1.0) is False

    def test_should_request_teacher_review_custom_threshold(self):
        """커스텀 임계값 테스트"""
        assert should_request_teacher_review(0.7, threshold=0.8) is True
        assert should_request_teacher_review(0.9, threshold=0.8) is False

    def test_get_classification_emoji(self):
        """분류 타입별 이모지 테스트"""
        assert get_classification_emoji(ErrorType.CONCEPT) == "💡"
        assert get_classification_emoji(ErrorType.CALCULATION) == "🔢"
        assert get_classification_emoji(ErrorType.CONDITION_OMISSION) == "📋"

    def test_get_classification_color(self):
        """분류 타입별 색상 테스트"""
        concept_color = get_classification_color(ErrorType.CONCEPT)
        calculation_color = get_classification_color(ErrorType.CALCULATION)
        condition_color = get_classification_color(ErrorType.CONDITION_OMISSION)

        assert concept_color == "#FF6B6B"
        assert calculation_color == "#4ECDC4"
        assert condition_color == "#FFD93D"


class TestPromptEngineering:
    """프롬프트 엔지니어링 테스트"""

    @pytest.fixture
    def classifier(self):
        return AnswerClassifier(api_key="test-api-key")

    def test_prompt_includes_examples(self, classifier):
        """프롬프트에 예시가 포함되어 있는지 테스트"""
        prompt = classifier._build_classification_prompt(
            problem_text="test",
            correct_answer="test",
            student_answer="test"
        )

        # 프롬프트에 예시 섹션이 있어야 함
        assert "예시 1:" in prompt
        assert "예시 2:" in prompt
        assert "예시 3:" in prompt

    def test_prompt_includes_all_categories(self, classifier):
        """프롬프트에 모든 분류 카테고리가 설명되어 있는지 테스트"""
        prompt = classifier._build_classification_prompt(
            problem_text="test",
            correct_answer="test",
            student_answer="test"
        )

        assert "개념 (Concept)" in prompt
        assert "계산 (Calculation)" in prompt
        assert "조건누락 (Condition Omission)" in prompt

    def test_prompt_with_work_shown(self, classifier):
        """학생 풀이가 있는 경우 프롬프트 테스트"""
        prompt = classifier._build_classification_prompt(
            problem_text="test",
            correct_answer="test",
            student_answer="test",
            work_shown="step 1, step 2"
        )

        assert "학생의 풀이 과정" in prompt
        assert "step 1, step 2" in prompt

    def test_prompt_with_context(self, classifier):
        """문제 컨텍스트가 있는 경우 프롬프트 테스트"""
        prompt = classifier._build_classification_prompt(
            problem_text="test",
            correct_answer="test",
            student_answer="test",
            problem_context={"difficulty": 3, "topic": "fractions"}
        )

        assert "문제 정보" in prompt or "problem_context" in prompt.lower()


# Integration Tests
class TestClassifierIntegration:
    """통합 테스트"""

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_classification_concept_error(self):
        """실제 개념 오류 분류 테스트 (실제 API 호출)"""
        # Skip if no API key
        import os
        if not os.getenv('ANTHROPIC_API_KEY'):
            pytest.skip("No API key available")

        classifier = AnswerClassifier(api_key=os.getenv('ANTHROPIC_API_KEY'))

        result = await classifier.classify_answer(
            problem_text="1/3 + 1/4 = ?",
            correct_answer="7/12",
            student_answer="2/7",
            work_shown="분자끼리 더하고 분모끼리 더했습니다: 1+1=2, 3+4=7"
        )

        # 개념 오류로 분류되어야 함
        assert result['classification'] == '개념'
        assert result['confidence'] > 0.7
        assert len(result['reasoning']) > 50
        assert len(result['feedback']) > 30

    @pytest.mark.asyncio
    @pytest.mark.integration
    async def test_real_classification_calculation_error(self):
        """실제 계산 오류 분류 테스트"""
        import os
        if not os.getenv('ANTHROPIC_API_KEY'):
            pytest.skip("No API key available")

        classifier = AnswerClassifier(api_key=os.getenv('ANTHROPIC_API_KEY'))

        result = await classifier.classify_answer(
            problem_text="1/3 + 1/4 = ?",
            correct_answer="7/12",
            student_answer="8/12",
            work_shown="분모를 12로 통분했습니다. 1/3 = 4/12, 1/4 = 4/12, 4+4=8"
        )

        # 계산 오류로 분류되어야 함
        assert result['classification'] == '계산'
        assert result['confidence'] > 0.7
