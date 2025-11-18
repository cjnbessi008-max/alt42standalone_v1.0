from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from models import ProblemRequest, StrategyResponse
from services.strategy_generator import StrategyGenerator

# 환경 변수 로드
load_dotenv()

# FastAPI 앱 생성
app = FastAPI(
    title="Problem Solving Strategy Visualizer API",
    description="AI 기반 문제 해결 전략 생성 및 시각화 API",
    version="1.0.0"
)

# CORS 설정
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 전략 생성기 초기화
strategy_generator = None

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 초기화"""
    global strategy_generator
    try:
        strategy_generator = StrategyGenerator()
        print("Strategy generator initialized successfully")
    except Exception as e:
        print(f"Warning: Failed to initialize strategy generator: {e}")
        print("API will use fallback strategies")


@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "status": "ok",
        "message": "Problem Solving Strategy Visualizer API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """상세 헬스 체크"""
    return {
        "status": "healthy",
        "strategy_generator": strategy_generator is not None
    }


@app.post("/api/strategy", response_model=StrategyResponse)
async def generate_strategy(request: ProblemRequest):
    """
    문제에 대한 해결 전략 생성

    Args:
        request: 문제 입력 요청

    Returns:
        전략 단계들을 포함한 응답
    """

    if not strategy_generator:
        raise HTTPException(
            status_code=503,
            detail="Strategy generator is not initialized. Please check ANTHROPIC_API_KEY."
        )

    try:
        # 전략 생성
        steps = strategy_generator.generate_strategy(
            problem=request.problem,
            subject=request.subject,
            difficulty=request.difficulty
        )

        # 응답 생성
        response = StrategyResponse(
            problem=request.problem,
            steps=steps,
            total_steps=len(steps)
        )

        return response

    except Exception as e:
        print(f"Error in generate_strategy endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate strategy: {str(e)}"
        )


@app.post("/api/strategy/demo")
async def get_demo_strategy():
    """
    데모용 전략 반환 (API 키 없이도 작동)
    """

    demo_problem = "1/2 + 1/3을 계산하세요."

    if strategy_generator:
        try:
            steps = strategy_generator.generate_strategy(demo_problem)
        except:
            steps = strategy_generator._get_fallback_strategy(demo_problem)
    else:
        # Fallback 전략 직접 생성
        from models import StrategyStep, StepType
        steps = [
            StrategyStep(
                id="step-1",
                type=StepType.ANALYSIS,
                title="문제 분석",
                content="두 분수 1/2와 1/3의 덧셈 문제입니다.",
                order=1,
                parent_id=None,
                children_ids=["step-1-1", "step-1-2"]
            ),
            StrategyStep(
                id="step-1-1",
                type=StepType.SUBSTEP,
                title="분수 확인",
                content="첫 번째 분수: 1/2, 두 번째 분수: 1/3",
                order=1,
                parent_id="step-1",
                children_ids=[]
            ),
            StrategyStep(
                id="step-1-2",
                type=StepType.SUBSTEP,
                title="연산 확인",
                content="수행할 연산: 덧셈(+)",
                order=2,
                parent_id="step-1",
                children_ids=[]
            ),
            StrategyStep(
                id="step-2",
                type=StepType.STRATEGY,
                title="통분하기",
                content="분모가 다르므로 통분이 필요합니다. 2와 3의 최소공배수는 6입니다.",
                order=2,
                parent_id=None,
                children_ids=["step-2-1", "step-2-2"]
            ),
            StrategyStep(
                id="step-2-1",
                type=StepType.SUBSTEP,
                title="1/2를 6으로 통분",
                content="1/2 = 3/6 (분자와 분모에 3을 곱함)",
                order=1,
                parent_id="step-2",
                children_ids=[]
            ),
            StrategyStep(
                id="step-2-2",
                type=StepType.SUBSTEP,
                title="1/3을 6으로 통분",
                content="1/3 = 2/6 (분자와 분모에 2를 곱함)",
                order=2,
                parent_id="step-2",
                children_ids=[]
            ),
            StrategyStep(
                id="step-3",
                type=StepType.SUBSTEP,
                title="분자끼리 더하기",
                content="3/6 + 2/6 = (3+2)/6 = 5/6",
                order=3,
                parent_id=None,
                children_ids=[]
            ),
            StrategyStep(
                id="step-4",
                type=StepType.SOLUTION,
                title="최종 답",
                content="1/2 + 1/3 = 5/6",
                order=4,
                parent_id=None,
                children_ids=[]
            ),
        ]

    return StrategyResponse(
        problem=demo_problem,
        steps=steps,
        total_steps=len(steps)
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
