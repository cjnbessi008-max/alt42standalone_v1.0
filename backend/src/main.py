"""
워밍업 문제 추천 시스템 - FastAPI 메인 애플리케이션
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import warmup

# FastAPI 앱 생성
app = FastAPI(
    title="워밍업 문제 추천 시스템",
    description="LMS와 연동하여 동일 유형의 쉬운 워밍업 문제를 즉시 추천하는 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 설정 (웹앱과의 통신을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포시에는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(warmup.router)


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "service": "워밍업 문제 추천 시스템",
        "version": "1.0.0",
        "description": "LMS와 연동하여 동일 유형의 쉬운 워밍업 문제를 즉시 추천",
        "docs": "/docs",
        "api_base": "/api/warmup"
    }


@app.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
