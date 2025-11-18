"""Main FastAPI Application - LMS Integration & Perspective Tips System"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .api import tips, lms_integration

# FastAPI 앱 초기화
app = FastAPI(
    title="ALT42 - AI Learning & Teaching Platform",
    description="LMS 연동 및 맞춤 관점 전환 팁 제공 시스템",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS 설정 (프론트엔드 연동)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",  # Vite dev server
        "https://alt42.kaist.ac.kr"  # 프로덕션
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 라우터 등록
app.include_router(tips.router)
app.include_router(lms_integration.router)


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "ALT42 - AI Learning & Teaching Platform API",
        "version": "1.0.0",
        "features": [
            "LMS Integration (Canvas, Moodle)",
            "Problem Type Classification (이차함수, 도형 등)",
            "Perspective Shift Tips (맞춤 관점 전환 팁)",
            "Student Learning Profiles",
            "Real-time Tip Recommendations"
        ],
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {
        "status": "healthy",
        "service": "alt42-api",
        "version": "1.0.0"
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """글로벌 예외 처리"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc)
        }
    )


# 스타트업/셧다운 이벤트
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시"""
    print("🚀 ALT42 API Server Starting...")
    print("📚 LMS Integration: Canvas, Moodle")
    print("💡 Perspective Tips: Ready")
    print("📊 Problem Types: 이차함수, 평면도형, 입체도형, 삼각함수 등")


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시"""
    print("👋 ALT42 API Server Shutting Down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
