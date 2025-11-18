"""
Cognitive Load Analysis Service
FastAPI 메인 애플리케이션
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import asyncio
from datetime import datetime

from .models import (
    ProblemAnalysisRequest,
    CognitiveLoadResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse,
    QuizAnalysisSummary,
    DifficultyLevel
)
from .calculator import CognitiveLoadCalculator
from .ai_analyzer import AIAnalyzer


# FastAPI 앱 초기화
app = FastAPI(
    title="Cognitive Load Analysis Service",
    description="문제 유형별 인지 부하 수치화 시스템",
    version="1.0.0"
)

# CORS 설정 (Moodle에서 접근 가능하도록)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 글로벌 인스턴스
calculator = CognitiveLoadCalculator()
ai_analyzer = None  # 초기화는 startup에서

# 간단한 인메모리 캐시
cache: Dict[int, CognitiveLoadResponse] = {}


@app.on_event("startup")
async def startup_event():
    """앱 시작 시 초기화"""
    global ai_analyzer
    try:
        ai_analyzer = AIAnalyzer()
        print("✓ AI Analyzer 초기화 완료")
    except Exception as e:
        print(f"⚠ AI Analyzer 초기화 실패: {str(e)}")
        print("  기본 규칙 기반 분석만 사용됩니다")


@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "service": "Cognitive Load Analysis",
        "status": "running",
        "version": "1.0.0",
        "ai_available": ai_analyzer is not None
    }


@app.get("/health")
async def health_check():
    """상태 확인"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache_size": len(cache)
    }


@app.post("/api/analyze-problem", response_model=CognitiveLoadResponse)
async def analyze_problem(request: ProblemAnalysisRequest):
    """
    단일 문제의 인지 부하를 분석합니다.

    Args:
        request: 문제 분석 요청

    Returns:
        인지 부하 분석 결과
    """
    try:
        # 캐시 확인
        if request.problem_id in cache:
            print(f"캐시에서 반환: 문제 {request.problem_id}")
            return cache[request.problem_id]

        # 규칙 기반 분석
        rule_analysis = calculator.calculate_rule_based(request)

        # AI 기반 분석
        if ai_analyzer:
            try:
                ai_analysis = await ai_analyzer.analyze_problem(request)
            except Exception as e:
                print(f"AI 분석 에러: {str(e)}")
                ai_analysis = ai_analyzer._get_fallback_analysis(request)
        else:
            # AI 없이 기본값 사용
            from .ai_analyzer import AIAnalyzer
            temp_analyzer = AIAnalyzer.__new__(AIAnalyzer)
            ai_analysis = temp_analyzer._get_fallback_analysis(request)

        # 종합 점수 계산
        result = calculator.compute_final_score(
            ai_analysis,
            rule_analysis,
            request.problem_type,
            request.grade_level
        )

        # 응답 생성
        response = CognitiveLoadResponse(
            problem_id=request.problem_id,
            intrinsic_load=result['intrinsic'],
            extraneous_load=result['extraneous'],
            germane_load=result['germane'],
            total_score=result['total'],
            difficulty_level=result['level'],
            analysis_details=result['details'],
            estimated_time_minutes=result['details']['estimated_time'],
            recommendations=result['details']['recommendations']
        )

        # 캐시에 저장
        cache[request.problem_id] = response

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")


@app.post("/api/batch-analyze", response_model=BatchAnalysisResponse)
async def batch_analyze(request: BatchAnalysisRequest):
    """
    여러 문제를 일괄 분석합니다.

    Args:
        request: 일괄 분석 요청

    Returns:
        일괄 분석 결과
    """
    try:
        results = []

        # 병렬 처리
        tasks = [analyze_problem(problem) for problem in request.problems]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # 에러 처리
        valid_results = [r for r in results if isinstance(r, CognitiveLoadResponse)]

        if not valid_results:
            raise HTTPException(status_code=500, detail="모든 분석 실패")

        # 통계 계산
        total_loads = [r.total_score for r in valid_results]
        avg_load = sum(total_loads) / len(total_loads)

        # 난이도 분포
        distribution = {level: 0 for level in DifficultyLevel}
        for result in valid_results:
            distribution[result.difficulty_level] += 1

        return BatchAnalysisResponse(
            results=valid_results,
            total_analyzed=len(valid_results),
            average_load=round(avg_load, 2),
            distribution=distribution
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일괄 분석 실패: {str(e)}")


@app.get("/api/cognitive-load/{problem_id}", response_model=CognitiveLoadResponse)
async def get_cognitive_load(problem_id: int):
    """
    캐시된 인지 부하 점수를 조회합니다.

    Args:
        problem_id: 문제 ID

    Returns:
        인지 부하 분석 결과
    """
    if problem_id in cache:
        return cache[problem_id]
    else:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다")


@app.post("/api/analyze-quiz", response_model=QuizAnalysisSummary)
async def analyze_quiz(quiz_problems: List[ProblemAnalysisRequest]):
    """
    퀴즈 전체의 인지 부하를 분석하고 균형을 평가합니다.

    Args:
        quiz_problems: 퀴즈 문제 목록

    Returns:
        퀴즈 분석 요약
    """
    try:
        # 모든 문제 분석
        batch_request = BatchAnalysisRequest(problems=quiz_problems)
        batch_result = await batch_analyze(batch_request)

        # 인지 부하 목록
        cognitive_loads = [r.total_score for r in batch_result.results]

        # 균형 분석
        balance_analysis = calculator.analyze_quiz_balance(cognitive_loads)

        # 예상 소요 시간 계산
        total_time = sum(r.estimated_time_minutes for r in batch_result.results)

        return QuizAnalysisSummary(
            quiz_id=0,  # 임시값
            total_questions=len(batch_result.results),
            average_cognitive_load=batch_result.average_load,
            load_distribution=batch_result.distribution,
            recommended_time_minutes=total_time,
            balance_score=balance_analysis['balance_score'],
            warnings=balance_analysis['warnings']
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"퀴즈 분석 실패: {str(e)}")


@app.delete("/api/cache/{problem_id}")
async def clear_cache(problem_id: int):
    """
    특정 문제의 캐시를 삭제합니다.

    Args:
        problem_id: 문제 ID
    """
    if problem_id in cache:
        del cache[problem_id]
        return {"message": f"문제 {problem_id}의 캐시가 삭제되었습니다"}
    else:
        raise HTTPException(status_code=404, detail="캐시를 찾을 수 없습니다")


@app.delete("/api/cache")
async def clear_all_cache():
    """
    전체 캐시를 삭제합니다.
    """
    cache.clear()
    return {"message": "전체 캐시가 삭제되었습니다"}


@app.get("/api/stats")
async def get_stats():
    """
    서비스 통계를 반환합니다.
    """
    if not cache:
        return {
            "total_analyzed": 0,
            "cache_size": 0
        }

    total_scores = [r.total_score for r in cache.values()]
    difficulty_counts = {}
    for result in cache.values():
        level = result.difficulty_level
        difficulty_counts[level] = difficulty_counts.get(level, 0) + 1

    return {
        "total_analyzed": len(cache),
        "cache_size": len(cache),
        "average_load": round(sum(total_scores) / len(total_scores), 2),
        "difficulty_distribution": difficulty_counts,
        "min_load": round(min(total_scores), 2),
        "max_load": round(max(total_scores), 2)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
