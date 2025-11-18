"""
Learning Stress Indicator API
학습 스트레스 지표 제공 API (FastAPI)
"""
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    LearningActivity,
    StressIndicator,
    StressMetrics,
    StressLevel,
    LMSIntegrationRequest,
    LMSIntegrationResponse
)
from .stress_calculator import StressCalculator
from .database import StressDatabase

# FastAPI 애플리케이션 생성
app = FastAPI(
    title="Learning Stress Indicator API",
    description="학습 스트레스 지표를 측정하고 LMS와 연동하는 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 연동을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한 필요
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 인스턴스 (인메모리)
db = StressDatabase()
calculator = StressCalculator()


@app.get("/")
async def root():
    """API 루트 엔드포인트"""
    return {
        "message": "Learning Stress Indicator API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "calculate_stress": "/api/stress/calculate",
            "get_indicator": "/api/stress/indicator/{student_id}",
            "get_metrics": "/api/stress/metrics",
            "lms_integration": "/api/lms/stress"
        }
    }


@app.post("/api/stress/calculate", response_model=StressIndicator)
async def calculate_stress(activity: LearningActivity):
    """
    학습 활동 데이터로부터 스트레스 지표를 계산합니다.

    **Parameters:**
    - **activity**: 학습 활동 데이터

    **Returns:**
    - 계산된 스트레스 지표
    """
    try:
        # 스트레스 계산
        indicator = calculator.calculate_stress(activity)

        # 데이터베이스에 저장
        db.save_indicator(indicator)

        return indicator

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스트레스 계산 오류: {str(e)}")


@app.get("/api/stress/indicator/{student_id}", response_model=List[StressIndicator])
async def get_student_stress_indicators(
    student_id: str,
    module_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """
    특정 학생의 스트레스 지표 조회

    **Parameters:**
    - **student_id**: 학생 ID
    - **module_id**: 모듈 ID (선택)
    - **limit**: 최대 결과 수

    **Returns:**
    - 스트레스 지표 목록
    """
    indicators = db.get_indicators_by_student(student_id, module_id, limit)

    if not indicators:
        raise HTTPException(status_code=404, detail="스트레스 지표를 찾을 수 없습니다.")

    return indicators


@app.get("/api/stress/metrics", response_model=StressMetrics)
async def get_stress_metrics(
    module_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    스트레스 메트릭 통계 조회

    **Parameters:**
    - **module_id**: 모듈 ID (선택)
    - **start_date**: 시작 날짜 (선택)
    - **end_date**: 종료 날짜 (선택)

    **Returns:**
    - 스트레스 메트릭 통계
    """
    metrics = db.get_metrics(module_id, start_date, end_date)
    return metrics


@app.get("/api/stress/module/{module_id}", response_model=List[StressIndicator])
async def get_module_stress_indicators(
    module_id: str,
    stress_level: Optional[StressLevel] = None,
    limit: int = Query(50, ge=1, le=500)
):
    """
    특정 모듈의 스트레스 지표 조회

    **Parameters:**
    - **module_id**: 모듈 ID
    - **stress_level**: 스트레스 레벨 필터 (선택)
    - **limit**: 최대 결과 수

    **Returns:**
    - 스트레스 지표 목록
    """
    indicators = db.get_indicators_by_module(module_id, stress_level, limit)

    if not indicators:
        raise HTTPException(status_code=404, detail="스트레스 지표를 찾을 수 없습니다.")

    return indicators


@app.post("/api/lms/stress", response_model=LMSIntegrationResponse)
async def lms_integration(request: LMSIntegrationRequest):
    """
    LMS 연동: 강좌별 학습 스트레스 지표 제공

    **Parameters:**
    - **request**: LMS 연동 요청 데이터

    **Returns:**
    - 스트레스 지표 및 통계
    """
    try:
        # LMS 연동 로직
        # 실제 구현에서는 LMS API를 호출하여 데이터를 가져옴
        # 여기서는 데이터베이스에서 조회

        indicators = []

        if request.student_ids:
            # 특정 학생들의 지표 조회
            for student_id in request.student_ids:
                student_indicators = db.get_indicators_by_student(
                    student_id,
                    request.module_id,
                    limit=10
                )
                indicators.extend(student_indicators)
        else:
            # 모듈 전체 조회
            if request.module_id:
                indicators = db.get_indicators_by_module(request.module_id, limit=500)
            else:
                indicators = db.get_all_indicators(limit=500)

        # 메트릭 계산
        metrics = db.calculate_metrics_from_indicators(indicators)

        return LMSIntegrationResponse(
            success=True,
            message=f"LMS 연동 성공: {len(indicators)}개의 스트레스 지표를 조회했습니다.",
            stress_indicators=indicators,
            metrics=metrics
        )

    except Exception as e:
        return LMSIntegrationResponse(
            success=False,
            message=f"LMS 연동 실패: {str(e)}",
            stress_indicators=[],
            metrics=None
        )


@app.delete("/api/stress/reset")
async def reset_database():
    """
    데이터베이스 초기화 (개발용)

    **Returns:**
    - 성공 메시지
    """
    db.reset()
    return {"message": "데이터베이스가 초기화되었습니다."}


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "database": {
            "total_indicators": len(db.indicators),
            "total_students": len(set(i.student_id for i in db.indicators))
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
