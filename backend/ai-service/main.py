from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import logging

from services.summarizer import MetacognitiveSummarizer
from services.step_detector import StepDetector
from database import init_db

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Metacognitive Mirroring AI Service",
    description="AI-powered metacognitive summary generation service",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
summarizer = MetacognitiveSummarizer()
step_detector = StepDetector()

# Request/Response models
class Action(BaseModel):
    id: str
    action_type: str
    action_data: Dict[str, Any]
    timestamp: str
    sequence_number: int

class Step(BaseModel):
    id: str
    session_id: str
    step_number: int
    step_type: str
    started_at: str
    ended_at: Optional[str] = None
    cognitive_strategies: List[str] = []

class SummarizeRequest(BaseModel):
    step: Step
    actions: List[Action]
    language: str = "ko"
    student_context: Optional[Dict[str, Any]] = None
    problem_context: Optional[Dict[str, Any]] = None

class SummarizeResponse(BaseModel):
    summary: str
    strategies: List[str]
    confidence: Optional[float] = None
    model: str
    generation_time_ms: int

class DetectStepRequest(BaseModel):
    session_id: str
    recent_actions: List[Action]
    current_step: Optional[Step] = None

class DetectStepResponse(BaseModel):
    should_create_new_step: bool
    suggested_step_type: Optional[str] = None
    reason: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "claude_configured": bool(os.getenv("ANTHROPIC_API_KEY"))
    }

@app.post("/api/summarize", response_model=SummarizeResponse)
async def generate_summary(request: SummarizeRequest):
    """
    Generate metacognitive summary for a learning step

    This endpoint uses Claude AI to analyze student actions and generate
    an encouraging, educational summary of what the student is doing.
    """
    try:
        logger.info(f"Generating summary for step {request.step.id}")

        result = await summarizer.generate_summary(
            step=request.step,
            actions=request.actions,
            language=request.language,
            student_context=request.student_context,
            problem_context=request.problem_context
        )

        logger.info(f"Summary generated successfully: {result['summary'][:50]}...")
        return result

    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")

@app.post("/api/detect-step", response_model=DetectStepResponse)
async def detect_step(request: DetectStepRequest):
    """
    Detect if a new learning step should be created based on recent actions

    Analyzes action patterns to determine semantic transitions in the
    learning process (e.g., moving from reading to analyzing).
    """
    try:
        logger.info(f"Detecting step for session {request.session_id}")

        result = await step_detector.should_create_new_step(
            recent_actions=request.recent_actions,
            current_step=request.current_step
        )

        return result

    except Exception as e:
        logger.error(f"Error detecting step: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to detect step: {str(e)}")

@app.post("/api/analyze-strategies")
async def analyze_strategies(actions: List[Action]):
    """
    Analyze cognitive strategies used based on action patterns

    Returns a list of identified cognitive strategies (e.g., visualization,
    step-by-step planning, verification) based on student actions.
    """
    try:
        strategies = await step_detector.identify_strategies(actions)
        return {"strategies": strategies}

    except Exception as e:
        logger.error(f"Error analyzing strategies: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze strategies: {str(e)}")

@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup"""
    logger.info("Starting AI Service...")
    await init_db()
    logger.info("AI Service started successfully")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
