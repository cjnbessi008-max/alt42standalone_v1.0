"""
Pipeline API Routes
Endpoints for managing the AI pipeline
"""

import logging
from uuid import UUID
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from app.services.orchestrator import PipelineOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter()
orchestrator = PipelineOrchestrator()


# Request/Response models
class CreateModuleRequest(BaseModel):
    """Request model for creating a module"""

    teacher_request: str = Field(..., description="Teacher's natural language request")
    grade_level: Optional[str] = Field(None, description="Target grade level")
    subject: Optional[str] = Field(default="mathematics", description="Subject area")
    learning_style: Optional[str] = Field(None, description="Preferred learning style")


class PipelineStatusResponse(BaseModel):
    """Response model for pipeline status"""

    module_id: str
    status: str
    current_stage: Optional[str]
    progress_percentage: int
    results: Optional[dict] = None


@router.post("/generate", response_model=dict)
async def generate_module(
    request: CreateModuleRequest, background_tasks: BackgroundTasks
):
    """
    Start module generation pipeline

    This endpoint initiates the AI pipeline to generate a complete educational module
    from the teacher's natural language request.

    The generation happens in background and can be monitored via the status endpoint.
    """
    logger.info(f"Received module generation request: {request.teacher_request[:100]}")

    try:
        # Generate module ID (in production, this would come from database)
        from uuid import uuid4

        module_id = uuid4()

        # Prepare context
        context = {
            "grade_level": request.grade_level,
            "subject": request.subject,
            "learning_style": request.learning_style,
        }

        # Start pipeline in background
        async def run_pipeline_task():
            try:
                await orchestrator.run_pipeline(
                    module_id=module_id,
                    teacher_request=request.teacher_request,
                    context=context,
                )
                logger.info(f"Pipeline completed for module {module_id}")
            except Exception as e:
                logger.error(f"Pipeline failed for module {module_id}: {e}")

        background_tasks.add_task(run_pipeline_task)

        return {
            "module_id": str(module_id),
            "status": "pipeline_started",
            "message": "모듈 생성이 시작되었습니다. 진행 상황은 status 엔드포인트에서 확인하세요.",
            "status_url": f"/api/pipeline/{module_id}/status",
        }

    except Exception as e:
        logger.error(f"Failed to start pipeline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{module_id}/status", response_model=PipelineStatusResponse)
async def get_pipeline_status(module_id: UUID):
    """
    Get pipeline status for a module

    Returns the current status and progress of the module generation pipeline.
    """
    try:
        status = await orchestrator.get_pipeline_status(module_id)
        return PipelineStatusResponse(**status)

    except Exception as e:
        logger.error(f"Failed to get pipeline status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{module_id}/retry/{stage}")
async def retry_pipeline_stage(module_id: UUID, stage: str):
    """
    Retry a failed pipeline stage

    Use this endpoint to retry a specific stage that failed during module generation.
    """
    try:
        # TODO: Implement retry logic
        return {
            "module_id": str(module_id),
            "stage": stage,
            "status": "retry_initiated",
        }

    except Exception as e:
        logger.error(f"Failed to retry stage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
