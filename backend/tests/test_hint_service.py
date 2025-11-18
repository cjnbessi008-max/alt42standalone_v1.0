"""
Tests for hint generation service
"""
import pytest
from app.models import HintRequest, HintType
from app.services.hint_service import HintGenerator


@pytest.fixture
def hint_generator():
    """Fixture for hint generator instance"""
    return HintGenerator()


@pytest.fixture
def sample_hint_request():
    """Sample hint request for testing"""
    return HintRequest(
        student_id="test_student_123",
        problem_id="test_problem_456",
        problem_description="1/4 + 1/3 = ?",
        student_work="I'm not sure how to start...",
        hint_level=1,
        subject="mathematics",
        grade_level="5학년"
    )


def test_hint_generator_initialization(hint_generator):
    """Test that hint generator initializes correctly"""
    assert hint_generator is not None
    assert hint_generator.client is not None
    assert hint_generator.model is not None


def test_build_system_prompt(hint_generator):
    """Test system prompt generation"""
    prompt = hint_generator._build_system_prompt()
    assert "Socratic" in prompt
    assert "NEVER provide the final answer" in prompt
    assert "hint" in prompt.lower()


def test_build_user_prompt(hint_generator, sample_hint_request):
    """Test user prompt generation"""
    prompt = hint_generator._build_user_prompt(sample_hint_request)
    assert sample_hint_request.problem_description in prompt
    assert sample_hint_request.student_work in prompt
    assert str(sample_hint_request.hint_level) in prompt


def test_classify_hint_type(hint_generator):
    """Test hint type classification"""
    # Conceptual hint (with questions)
    conceptual = "What do you notice about the denominators? How are they different?"
    assert hint_generator._classify_hint_type(conceptual) == HintType.CONCEPTUAL

    # Strategic hint
    strategic = "The strategy here is to find a common denominator."
    assert hint_generator._classify_hint_type(strategic) == HintType.STRATEGIC

    # Procedural hint
    procedural = "First, find the LCD. Then, convert each fraction."
    assert hint_generator._classify_hint_type(procedural) == HintType.PROCEDURAL


def test_validate_hint_no_answer(hint_generator):
    """Test hint validation when no answer is provided"""
    result = hint_generator.validate_hint(
        "Think about what you need to do when denominators are different.",
        None
    )
    assert result["valid"] is True


def test_validate_hint_contains_answer(hint_generator):
    """Test hint validation when hint contains the answer"""
    result = hint_generator.validate_hint(
        "The answer is 7/12",
        "7/12"
    )
    assert result["valid"] is False


def test_validate_hint_does_not_contain_answer(hint_generator):
    """Test hint validation when hint does not contain the answer"""
    result = hint_generator.validate_hint(
        "Consider finding a common denominator for 4 and 3.",
        "7/12"
    )
    assert result["valid"] is True


# Note: Actual API call tests would require mocking or a test API key
# These are unit tests for the internal logic
