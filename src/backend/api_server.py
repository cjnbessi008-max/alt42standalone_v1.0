"""
FastAPI Server for Emotion Analysis System
감정 분석 시스템 API 서버

LMS 연동 및 감정 분석 기능을 제공하는 REST API
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import os

# 로컬 모듈 import (실제 구현시 경로 조정 필요)
# from lms_integration import LMSEmotionCollector, LMSWebhookHandler, EmotionType
# from emotion_volatility_analyzer import EmotionVolatilityAnalyzer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Emotion Analysis API",
    description="LMS와 연동하여 학생 감정을 분석하는 API",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터베이스 연결 문자열 (환경변수에서 읽기)
DB_CONNECTION_STRING = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/emotion_analysis"
)

# 전역 객체 (앱 시작시 초기화)
emotion_collector = None
webhook_handler = None
volatility_analyzer = None


# Pydantic 모델 정의
class EmotionCollectRequest(BaseModel):
    """감정 데이터 수집 요청 모델"""
    student_id: str = Field(..., description="학생 ID")
    module_id: str = Field(..., description="모듈 ID")
    session_id: str = Field(..., description="세션 ID")
    emotion_type: str = Field(..., description="감정 유형")
    emotion_intensity: int = Field(..., ge=1, le=10, description="감정 강도 (1-10)")
    context: Optional[Dict[str, Any]] = Field(None, description="추가 컨텍스트")


class WebhookPayload(BaseModel):
    """LMS 웹훅 페이로드 모델"""
    student_id: str
    module_id: str
    session_id: str
    activity_type: str
    result: str
    time_spent: int
    timestamp: Optional[str] = None


class AnalysisRequest(BaseModel):
    """분석 요청 모델"""
    student_id: Optional[str] = None
    module_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# 애플리케이션 라이프사이클 이벤트
@app.on_event("startup")
async def startup_event():
    """앱 시작시 초기화"""
    global emotion_collector, webhook_handler, volatility_analyzer

    logger.info("Starting Emotion Analysis API Server...")

    # 실제 구현시 활성화
    # emotion_collector = LMSEmotionCollector(DB_CONNECTION_STRING)
    # await emotion_collector.initialize()
    #
    # webhook_handler = LMSWebhookHandler(emotion_collector)
    #
    # volatility_analyzer = EmotionVolatilityAnalyzer(DB_CONNECTION_STRING)
    # await volatility_analyzer.initialize()

    logger.info("Emotion Analysis API Server started successfully")


@app.on_event("shutdown")
async def shutdown_event():
    """앱 종료시 리소스 정리"""
    logger.info("Shutting down Emotion Analysis API Server...")

    # 실제 구현시 활성화
    # if emotion_collector:
    #     await emotion_collector.close()
    # if volatility_analyzer:
    #     await volatility_analyzer.close()

    logger.info("Emotion Analysis API Server shutdown complete")


# API 엔드포인트
@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "service": "Emotion Analysis API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/emotions/collect")
async def collect_emotion(request: EmotionCollectRequest):
    """
    감정 데이터 수집 엔드포인트

    LMS나 학습 앱에서 학생의 감정 데이터를 전송합니다.
    """
    try:
        # 실제 구현시 활성화
        # emotion_data = await emotion_collector.collect_emotion_data(
        #     student_id=request.student_id,
        #     module_id=request.module_id,
        #     session_id=request.session_id,
        #     emotion_type=EmotionType(request.emotion_type),
        #     emotion_intensity=request.emotion_intensity,
        #     context=request.context
        # )
        #
        # return {
        #     "status": "success",
        #     "emotion_data_id": emotion_data.id,
        #     "message": "Emotion data collected successfully"
        # }

        # 테스트용 응답
        return {
            "status": "success",
            "message": "Emotion data collected successfully (test mode)",
            "data": request.dict()
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to collect emotion data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/lms/webhook/learning-activity")
async def receive_lms_webhook(payload: WebhookPayload):
    """
    LMS 웹훅 수신 엔드포인트

    LMS에서 학습 활동 이벤트를 받아 감정을 추론하고 저장합니다.
    """
    try:
        # 실제 구현시 활성화
        # result = await webhook_handler.handle_learning_activity_webhook(
        #     payload.dict()
        # )
        # return result

        # 테스트용 응답
        return {
            "status": "success",
            "message": "Webhook processed successfully (test mode)",
            "payload": payload.dict()
        }

    except Exception as e:
        logger.error(f"Failed to process webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@app.get("/api/analysis/volatility-report")
async def get_volatility_report(
    student_id: Optional[str] = Query(None, description="학생 ID"),
    module_id: Optional[str] = Query(None, description="모듈 ID")
):
    """
    감정 기복 분석 리포트 조회 엔드포인트

    시간대별 감정 기복을 분석한 리포트를 반환합니다.
    """
    try:
        # 실제 구현시 활성화
        # report = await volatility_analyzer.generate_volatility_report(
        #     student_id=student_id,
        #     module_id=module_id
        # )
        # return report

        # 테스트용 더미 리포트
        return {
            "status": "success",
            "summary": {
                "total_timeslots_analyzed": 50,
                "avg_volatility": 2.8,
                "max_volatility": 5.2,
                "most_volatile_day": {
                    "day": "Wednesday",
                    "avg_volatility": 3.5
                },
                "most_volatile_hour": {
                    "hour": "14:00",
                    "avg_volatility": 4.1
                }
            },
            "top_volatile_timeslots": [
                {
                    "time_slot": {
                        "hour": 14,
                        "day_of_week": 3,
                        "label": "Wednesday 14:00-15:00"
                    },
                    "volatility_score": 5.2,
                    "avg_intensity": 7.5,
                    "emotion_distribution": {
                        "frustrated": 8,
                        "confused": 5,
                        "neutral": 2
                    },
                    "sample_count": 15,
                    "volatility_level": "extreme"
                }
            ],
            "volatility_by_day": {
                "Monday": 3.2,
                "Tuesday": 2.5,
                "Wednesday": 3.5,
                "Thursday": 2.8,
                "Friday": 3.1
            },
            "volatility_by_hour": {
                "09:00": 2.3,
                "10:00": 3.1,
                "14:00": 4.1
            },
            "recommendations": [
                "⚠️ Wednesday 14:00-15:00 시간대에 감정 기복이 가장 심합니다."
            ]
        }

    except Exception as e:
        logger.error(f"Failed to generate volatility report: {e}")
        raise HTTPException(status_code=500, detail="Report generation failed")


@app.get("/api/analysis/high-volatility-timeslots")
async def get_high_volatility_timeslots(
    student_id: Optional[str] = Query(None, description="학생 ID"),
    module_id: Optional[str] = Query(None, description="모듈 ID"),
    threshold: str = Query("high", description="기복 레벨 임계값"),
    limit: int = Query(10, ge=1, le=50, description="최대 결과 개수")
):
    """
    높은 기복 시간대 조회 엔드포인트

    감정 기복이 높은 시간대를 반환합니다.
    """
    try:
        # 실제 구현시 활성화
        # high_volatility = await volatility_analyzer.get_high_volatility_timeslots(
        #     student_id=student_id,
        #     module_id=module_id,
        #     threshold=threshold,
        #     limit=limit
        # )
        #
        # return {
        #     "status": "success",
        #     "count": len(high_volatility),
        #     "timeslots": [slot.to_dict() for slot in high_volatility]
        # }

        # 테스트용 응답
        return {
            "status": "success",
            "count": 2,
            "timeslots": [
                {
                    "time_slot": {
                        "hour": 14,
                        "day_of_week": 3,
                        "label": "Wednesday 14:00-15:00"
                    },
                    "volatility_score": 5.2,
                    "volatility_level": "extreme"
                }
            ]
        }

    except Exception as e:
        logger.error(f"Failed to get high volatility timeslots: {e}")
        raise HTTPException(status_code=500, detail="Query failed")


# 실행
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
