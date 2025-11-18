"""
API 테스트 스크립트
"""

import asyncio
import sys
from models import ProblemAnalysisRequest, ProblemType, AnswerType
from main import analyze_problem


async def test_simple_calculation():
    """단순 계산 문제 테스트"""
    print("=" * 60)
    print("테스트 1: 단순 계산 문제")
    print("=" * 60)

    request = ProblemAnalysisRequest(
        problem_id=1,
        problem_type=ProblemType.CALCULATION,
        question_text="7 + 8 = ?",
        answer_type=AnswerType.NUMERICAL,
        grade_level=2
    )

    result = await analyze_problem(request)
    print(f"문제: {request.question_text}")
    print(f"학년: {request.grade_level}")
    print(f"내재적 부하: {result.intrinsic_load}")
    print(f"외재적 부하: {result.extraneous_load}")
    print(f"본유적 부하: {result.germane_load}")
    print(f"총점: {result.total_score}")
    print(f"난이도: {result.difficulty_level}")
    print(f"예상 시간: {result.estimated_time_minutes}분")
    print()


async def test_word_problem():
    """단어 문제 테스트"""
    print("=" * 60)
    print("테스트 2: 단어 문제")
    print("=" * 60)

    request = ProblemAnalysisRequest(
        problem_id=2,
        problem_type=ProblemType.WORD_PROBLEM,
        question_text="""
        철수는 사과를 12개 가지고 있었습니다.
        영희에게 5개를 주고, 민수에게 3개를 주었습니다.
        철수에게 남은 사과는 몇 개입니까?
        """,
        answer_type=AnswerType.NUMERICAL,
        grade_level=3
    )

    result = await analyze_problem(request)
    print(f"문제: {request.question_text.strip()}")
    print(f"학년: {request.grade_level}")
    print(f"내재적 부하: {result.intrinsic_load}")
    print(f"외재적 부하: {result.extraneous_load}")
    print(f"본유적 부하: {result.germane_load}")
    print(f"총점: {result.total_score}")
    print(f"난이도: {result.difficulty_level}")
    print(f"예상 시간: {result.estimated_time_minutes}분")
    print()


async def test_multistep_problem():
    """다단계 문제 테스트"""
    print("=" * 60)
    print("테스트 3: 다단계 분수 문제")
    print("=" * 60)

    request = ProblemAnalysisRequest(
        problem_id=3,
        problem_type=ProblemType.MULTISTEP,
        question_text="""
        다음 분수를 더하고 약분하세요:
        2/4 + 3/6 = ?
        """,
        answer_type=AnswerType.NUMERICAL,
        grade_level=5
    )

    result = await analyze_problem(request)
    print(f"문제: {request.question_text.strip()}")
    print(f"학년: {request.grade_level}")
    print(f"내재적 부하: {result.intrinsic_load}")
    print(f"외재적 부하: {result.extraneous_load}")
    print(f"본유적 부하: {result.germane_load}")
    print(f"총점: {result.total_score}")
    print(f"난이도: {result.difficulty_level}")
    print(f"예상 시간: {result.estimated_time_minutes}분")
    print()


async def test_conceptual_problem():
    """개념 이해 문제 테스트"""
    print("=" * 60)
    print("테스트 4: 개념 이해 문제")
    print("=" * 60)

    request = ProblemAnalysisRequest(
        problem_id=4,
        problem_type=ProblemType.CONCEPTUAL,
        question_text="""
        분수란 무엇인지 설명하고, 일상생활에서 분수가 사용되는 예를 3가지 들어보세요.
        """,
        answer_type=AnswerType.ESSAY,
        grade_level=4
    )

    result = await analyze_problem(request)
    print(f"문제: {request.question_text.strip()}")
    print(f"학년: {request.grade_level}")
    print(f"내재적 부하: {result.intrinsic_load}")
    print(f"외재적 부하: {result.extraneous_load}")
    print(f"본유적 부하: {result.germane_load}")
    print(f"총점: {result.total_score}")
    print(f"난이도: {result.difficulty_level}")
    print(f"예상 시간: {result.estimated_time_minutes}분")
    print()


async def main():
    """모든 테스트 실행"""
    print("\n" + "=" * 60)
    print("인지 부하 분석 API 테스트 시작")
    print("=" * 60 + "\n")

    try:
        await test_simple_calculation()
        await test_word_problem()
        await test_multistep_problem()
        await test_conceptual_problem()

        print("=" * 60)
        print("모든 테스트 완료!")
        print("=" * 60)

    except Exception as e:
        print(f"\n오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
