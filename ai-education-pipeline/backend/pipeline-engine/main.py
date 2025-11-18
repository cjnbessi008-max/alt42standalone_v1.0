"""
AI Education Pipeline Engine
FastAPI application that orchestrates Claude API for educational module generation
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

from engines.world_model import WorldModelEngine
from engines.rule_generator import RuleGeneratorEngine
from utils.logger import setup_logger
from utils.database import Database

load_dotenv()

app = FastAPI(
    title="AI Education Pipeline Engine",
    description="Orchestrates AI-powered educational module generation",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = setup_logger("PipelineEngine")
db = Database()

# Request/Response Models
class GenerateRequest(BaseModel):
    jobId: UUID4
    moduleId: UUID4
    teacherRequest: str
    stage: str = "world_model"

class GenerateResponse(BaseModel):
    success: bool
    jobId: UUID4
    message: str
    data: Optional[Dict[str, Any]] = None

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("🚀 Pipeline Engine starting up")
    await db.connect()

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("👋 Pipeline Engine shutting down")
    await db.disconnect()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "pipeline-engine",
        "version": "0.1.0"
    }

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_module(
    request: GenerateRequest,
    background_tasks: BackgroundTasks
):
    """
    Start module generation pipeline
    Processes teacher request through Claude API
    """
    logger.info(f"Generation request received for module {request.moduleId}")

    try:
        # Add background task for processing
        background_tasks.add_task(
            process_generation,
            request.jobId,
            request.moduleId,
            request.teacherRequest,
            request.stage
        )

        return GenerateResponse(
            success=True,
            jobId=request.jobId,
            message=f"Pipeline started for stage: {request.stage}"
        )

    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_generation(
    job_id: UUID4,
    module_id: UUID4,
    teacher_request: str,
    stage: str
):
    """
    Background task for processing generation
    """
    logger.info(f"Processing job {job_id} for stage {stage}")

    try:
        if stage == "world_model":
            engine = WorldModelEngine()
            result = await engine.process(teacher_request, module_id)

            # Store result
            await db.update_job(
                job_id,
                status="completed",
                output_data=result
            )

            # Update module with world model
            await db.update_module(module_id, {"world_model": result})

            logger.info(f"World model generation completed for job {job_id}")

        elif stage == "rules":
            # Get world model from module
            module = await db.get_module(module_id)
            world_model = module.get("world_model")

            engine = RuleGeneratorEngine()
            result = await engine.process(world_model, module_id)

            await db.update_job(
                job_id,
                status="completed",
                output_data=result
            )

            logger.info(f"Rule generation completed for job {job_id}")

        else:
            logger.warning(f"Stage {stage} not yet implemented")
            await db.update_job(
                job_id,
                status="failed",
                error_log=f"Stage {stage} not implemented"
            )

    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        await db.update_job(
            job_id,
            status="failed",
            error_log=str(e)
        )

@app.get("/api/status/{job_id}")
async def get_job_status(job_id: UUID4):
    """Get generation job status"""
    try:
        job = await db.get_job(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        return {
            "success": True,
            "job": job
        }
    except Exception as e:
        logger.error(f"Failed to get job status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
