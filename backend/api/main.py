"""
FastAPI 메인 애플리케이션
한숨 감지 및 휴식 제안 API 엔드포인트
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import sys
import os
import numpy as np

# 서비스 모듈 임포트를 위한 경로 설정
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from services.sigh_detection.sigh_detector import (
    SighDetector,
    SighDetectionResult,
    SighIntensity
)
from services.break_suggestion.break_service import (
    BreakSuggestionService,
    BreakSuggestion,
    BreakActivity
)
from services.lms_integration.lms_client import (
    LMSIntegrationService,
    LMSType,
    StudentSession
)


# FastAPI 앱 생성
app = FastAPI(
    title="Alt42 - Sigh Detection & Break Suggestion API",
    description="LMS 연동 한숨 감지 및 휴식 제안 시스템",
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

# 서비스 인스턴스
sigh_detector = SighDetector()
break_service = BreakSuggestionService()
lms_service = LMSIntegrationService()


# === Pydantic 모델 정의 ===

class AudioAnalysisRequest(BaseModel):
    """오디오 분석 요청"""
    student_id: str = Field(..., description="학생 ID")
    audio_samples: List[float] = Field(..., description="오디오 샘플 데이터")
    sample_rate: int = Field(16000, description="샘플링 레이트 (Hz)")


class SighDetectionResponse(BaseModel):
    """한숨 감지 결과"""
    detected: bool
    intensity: Optional[str] = None
    confidence: float
    timestamp: str
    should_suggest_break: bool
    stress_level: float


class BreakSuggestionRequest(BaseModel):
    """휴식 제안 요청"""
    student_id: str = Field(..., description="학생 ID")
    stress_level: float = Field(..., description="스트레스 레벨 (0.0 ~ 1.0)")
    learning_duration_minutes: int = Field(..., description="학습 지속 시간 (분)")
    sigh_count: int = Field(0, description="최근 한숨 횟수")


class BreakSuggestionResponse(BaseModel):
    """휴식 제안 응답"""
    student_id: str
    stress_level: float
    reason: str
    reason_ko: str
    recommended_activities: List[dict]
    timestamp: str


class LMSRegistrationRequest(BaseModel):
    """LMS 등록 요청"""
    lms_id: str = Field(..., description="LMS 식별자")
    lms_type: str = Field(..., description="LMS 유형 (canvas/moodle/kaist)")
    base_url: str = Field(..., description="LMS API 베이스 URL")
    api_token: str = Field(..., description="API 인증 토큰")


class SessionStartRequest(BaseModel):
    """세션 시작 요청"""
    lms_id: str = Field(..., description="LMS 식별자")
    student_id: str = Field(..., description="학생 ID")
    course_id: str = Field(..., description="강좌 ID")


class SessionUpdateRequest(BaseModel):
    """세션 업데이트 요청"""
    lms_id: str = Field(..., description="LMS 식별자")
    session_id: str = Field(..., description="세션 ID")
    stress_level: float = Field(..., description="스트레스 레벨")


class BreakNotificationRequest(BaseModel):
    """휴식 알림 요청"""
    lms_id: str = Field(..., description="LMS 식별자")
    student_id: str = Field(..., description="학생 ID")
    course_id: str = Field(..., description="강좌 ID")
    reason: str = Field(..., description="휴식 제안 이유")
    reason_ko: str = Field(..., description="휴식 제안 이유 (한국어)")


# === API 엔드포인트 ===

@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "service": "Alt42 - Sigh Detection & Break Suggestion API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


# === 한숨 감지 API ===

@app.post("/api/sigh/analyze", response_model=SighDetectionResponse)
async def analyze_audio(request: AudioAnalysisRequest):
    """
    오디오 신호 분석하여 한숨 감지

    - **student_id**: 학생 ID
    - **audio_samples**: 오디오 샘플 데이터 (float 배열)
    - **sample_rate**: 샘플링 레이트 (기본: 16000Hz)
    """
    try:
        # numpy 배열로 변환
        audio_data = np.array(request.audio_samples, dtype=np.float32)

        # 한숨 감지
        result = sigh_detector.analyze_audio_signal(
            audio_data,
            request.sample_rate
        )

        # 휴식 제안 필요 여부 확인
        should_break = sigh_detector.should_suggest_break()
        stress_level = sigh_detector.get_stress_level()

        return SighDetectionResponse(
            detected=result.detected,
            intensity=result.intensity.value if result.intensity else None,
            confidence=result.confidence,
            timestamp=result.timestamp.isoformat(),
            should_suggest_break=should_break,
            stress_level=stress_level
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sigh/reset/{student_id}")
async def reset_sigh_history(student_id: str):
    """
    학생의 한숨 감지 이력 초기화 (세션 종료 시)

    - **student_id**: 학생 ID
    """
    try:
        sigh_detector.reset_history()
        return {
            "message": f"Sigh detection history reset for student {student_id}",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/sigh/stress-level")
async def get_stress_level():
    """현재 스트레스 레벨 조회"""
    try:
        stress_level = sigh_detector.get_stress_level()
        return {
            "stress_level": stress_level,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === 휴식 제안 API ===

@app.post("/api/break/suggest", response_model=BreakSuggestionResponse)
async def suggest_break(request: BreakSuggestionRequest):
    """
    휴식 제안 생성

    - **student_id**: 학생 ID
    - **stress_level**: 스트레스 레벨 (0.0 ~ 1.0)
    - **learning_duration_minutes**: 학습 지속 시간 (분)
    - **sigh_count**: 최근 한숨 횟수
    """
    try:
        # 휴식 제안 생성
        suggestion = break_service.generate_suggestion(
            student_id=request.student_id,
            stress_level=request.stress_level,
            learning_duration_minutes=request.learning_duration_minutes,
            sigh_count=request.sigh_count
        )

        return BreakSuggestionResponse(
            student_id=suggestion.student_id,
            stress_level=suggestion.stress_level,
            reason=suggestion.reason,
            reason_ko=suggestion.reason_ko,
            recommended_activities=[
                activity.to_dict() for activity in suggestion.recommended_activities
            ],
            timestamp=suggestion.timestamp.isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/break/activities")
async def get_break_activities():
    """
    사용 가능한 모든 휴식 활동 조회
    """
    try:
        activities = [
            activity.to_dict()
            for activity in break_service.BREAK_ACTIVITIES
        ]
        return {
            "activities": activities,
            "total": len(activities)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/break/history/{student_id}")
async def get_break_history(student_id: str, limit: int = 10):
    """
    학생의 휴식 제안 이력 조회

    - **student_id**: 학생 ID
    - **limit**: 조회 개수 (기본: 10)
    """
    try:
        history = break_service.get_suggestion_history(student_id, limit)
        return {
            "student_id": student_id,
            "history": [suggestion.to_dict() for suggestion in history],
            "total": len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === LMS 연동 API ===

@app.post("/api/lms/register")
async def register_lms(request: LMSRegistrationRequest):
    """
    LMS 등록

    - **lms_id**: LMS 식별자
    - **lms_type**: LMS 유형 (canvas/moodle/kaist)
    - **base_url**: LMS API 베이스 URL
    - **api_token**: API 인증 토큰
    """
    try:
        # LMS 유형 검증
        try:
            lms_type = LMSType(request.lms_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid LMS type: {request.lms_type}"
            )

        # LMS 등록
        lms_service.register_lms(
            lms_id=request.lms_id,
            lms_type=lms_type,
            base_url=request.base_url,
            api_token=request.api_token
        )

        return {
            "message": f"LMS registered successfully: {request.lms_id}",
            "lms_type": request.lms_type,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lms/session/start")
async def start_learning_session(request: SessionStartRequest):
    """
    학습 세션 시작

    - **lms_id**: LMS 식별자
    - **student_id**: 학생 ID
    - **course_id**: 강좌 ID
    """
    try:
        session = await lms_service.start_session(
            lms_id=request.lms_id,
            student_id=request.student_id,
            course_id=request.course_id
        )

        if session:
            return {
                "message": "Session started successfully",
                "session": session.to_dict()
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to start session"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lms/session/end")
async def end_learning_session(lms_id: str, session_id: str):
    """
    학습 세션 종료

    - **lms_id**: LMS 식별자
    - **session_id**: 세션 ID
    """
    try:
        success = await lms_service.end_session(lms_id, session_id)

        if success:
            return {
                "message": "Session ended successfully",
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to end session"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/lms/session/stress")
async def update_session_stress(request: SessionUpdateRequest):
    """
    세션 스트레스 레벨 업데이트

    - **lms_id**: LMS 식별자
    - **session_id**: 세션 ID
    - **stress_level**: 스트레스 레벨 (0.0 ~ 1.0)
    """
    try:
        success = await lms_service.update_session_stress(
            lms_id=request.lms_id,
            session_id=request.session_id,
            stress_level=request.stress_level
        )

        if success:
            return {
                "message": "Stress level updated successfully",
                "session_id": request.session_id,
                "stress_level": request.stress_level,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to update stress level"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/lms/notification/break")
async def send_break_notification(
    request: BreakNotificationRequest,
    background_tasks: BackgroundTasks
):
    """
    휴식 제안 알림 전송 (LMS를 통해)

    - **lms_id**: LMS 식별자
    - **student_id**: 학생 ID
    - **course_id**: 강좌 ID
    - **reason**: 휴식 제안 이유
    - **reason_ko**: 휴식 제안 이유 (한국어)
    """
    try:
        # 비동기로 알림 전송 (백그라운드)
        async def send_notification():
            await lms_service.send_break_notification(
                lms_id=request.lms_id,
                student_id=request.student_id,
                course_id=request.course_id,
                reason=f"{request.reason}\n\n{request.reason_ko}"
            )

        background_tasks.add_task(send_notification)

        return {
            "message": "Break notification sent",
            "student_id": request.student_id,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === 통합 워크플로우 API ===

@app.post("/api/workflow/analyze-and-suggest")
async def analyze_and_suggest_workflow(
    request: AudioAnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    통합 워크플로우: 오디오 분석 + 휴식 제안 + LMS 알림

    1. 오디오 분석하여 한숨 감지
    2. 휴식 필요 여부 판단
    3. 필요시 휴식 제안 생성
    4. LMS를 통해 학생에게 알림 전송
    """
    try:
        # 1. 오디오 분석
        audio_data = np.array(request.audio_samples, dtype=np.float32)
        sigh_result = sigh_detector.analyze_audio_signal(
            audio_data,
            request.sample_rate
        )

        # 2. 휴식 필요 여부 확인
        should_break = sigh_detector.should_suggest_break()
        stress_level = sigh_detector.get_stress_level()

        response_data = {
            "sigh_detected": sigh_result.detected,
            "stress_level": stress_level,
            "break_suggested": False,
            "timestamp": datetime.now().isoformat()
        }

        # 3. 휴식 제안 생성 (필요시)
        if should_break:
            suggestion = break_service.generate_suggestion(
                student_id=request.student_id,
                stress_level=stress_level,
                learning_duration_minutes=60,  # 기본값 (실제로는 세션에서 가져와야 함)
                sigh_count=len(sigh_detector.sigh_history)
            )

            response_data["break_suggested"] = True
            response_data["suggestion"] = suggestion.to_dict()

            # 4. LMS 알림 (백그라운드로 전송)
            # 실제로는 LMS ID를 요청에서 받아와야 함
            # 여기서는 예시로 표시

        return response_data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# === 앱 시작/종료 이벤트 ===

@app.on_event("startup")
async def startup_event():
    """앱 시작 시 초기화"""
    print("Alt42 API Server started")
    print("Sigh detection and break suggestion services initialized")


@app.on_event("shutdown")
async def shutdown_event():
    """앱 종료 시 정리"""
    print("Shutting down Alt42 API Server")
    await lms_service.close_all()
    print("LMS connections closed")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
