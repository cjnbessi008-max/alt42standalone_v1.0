"""
DMN Service - FastAPI Application
Main application file for DMN analysis service
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from ..models.dmn_models import (
    DMNAnalysisRequest,
    DMNStatusResponse,
    InteractionEvent,
    SessionCreate,
    SessionResponse,
)
from ..services.dmn_analyzer import dmn_analyzer

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    print("🚀 DMN Service starting up...")
    yield
    # Shutdown
    print("👋 DMN Service shutting down...")


# Initialize FastAPI app
app = FastAPI(
    title="DMN Status Monitoring Service",
    description="API for analyzing student behavior and determining DMN activation status",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "dmn-service",
        "version": "1.0.0"
    }


# DMN Analysis endpoint
@app.post("/api/dmn/analyze", response_model=DMNStatusResponse)
async def analyze_dmn_status(request: DMNAnalysisRequest):
    """
    Analyze student interaction events and determine DMN status.

    This endpoint receives a batch of interaction events and returns
    the current DMN activation status with color coding.

    Args:
        request: DMNAnalysisRequest containing events and metadata

    Returns:
        DMNStatusResponse with status, color code, and behavioral metrics
    """
    try:
        # Perform analysis
        result = dmn_analyzer.analyze(request)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )


# Single event tracking (for real-time streaming)
@app.post("/api/dmn/event")
async def track_event(event: InteractionEvent):
    """
    Track a single interaction event.

    This endpoint can be used for real-time event streaming.
    Events are cached and analyzed in batches.

    Args:
        event: Single InteractionEvent

    Returns:
        Confirmation of event receipt
    """
    try:
        # Cache event for batch analysis
        # In production, this would store to Redis or a message queue
        return {
            "status": "received",
            "event_id": str(event.timestamp),
            "student_id": event.student_id
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Event tracking failed: {str(e)}"
        )


# Get current status
@app.get("/api/dmn/status/{student_id}/{session_id}")
async def get_current_status(student_id: str, session_id: str):
    """
    Get the most recent DMN status for a student session.

    Args:
        student_id: UUID of the student
        session_id: UUID of the learning session

    Returns:
        Latest DMN status or 404 if not found
    """
    # In production, this would query the database
    # For now, return a mock response
    return {
        "message": "This endpoint queries the database for the latest status",
        "student_id": student_id,
        "session_id": session_id,
        "note": "Implement database integration for production"
    }


# Configuration endpoint
@app.put("/api/dmn/config/thresholds")
async def update_thresholds(
    deep_focus: float = None,
    active_learning: float = None,
    wandering: float = None
):
    """
    Update DMN status thresholds for custom tuning.

    Args:
        deep_focus: Threshold for deep focus status (0.0 to 1.0)
        active_learning: Threshold for active learning status (0.0 to 1.0)
        wandering: Threshold for wandering status (0.0 to 1.0)

    Returns:
        Updated threshold configuration
    """
    try:
        dmn_analyzer.update_thresholds(
            deep_focus=deep_focus,
            active_learning=active_learning,
            wandering=wandering
        )

        return {
            "status": "updated",
            "thresholds": dmn_analyzer.THRESHOLDS
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Threshold update failed: {str(e)}"
        )


@app.get("/api/dmn/config/thresholds")
async def get_thresholds():
    """Get current DMN status thresholds"""
    return {
        "thresholds": dmn_analyzer.THRESHOLDS,
        "weights": dmn_analyzer.WEIGHTS
    }


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("DMN_SERVICE_PORT", 8000))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
