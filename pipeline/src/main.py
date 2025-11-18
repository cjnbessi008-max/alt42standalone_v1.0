"""
AI Education Pipeline - FastAPI Application
Handles AI-powered module generation and highlight clip extraction
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime, date
import os

from .services.highlight_generator import HighlightGenerator
from .services.world_model_service import WorldModelService
from .services.database import get_db_connection
from .models.schemas import (
    ModuleRequest,
    ModuleResponse,
    HighlightClip,
    DailyHighlight,
    GenerationStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Education Pipeline",
    description="AI-powered educational module generation with highlight clips",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
highlight_generator = HighlightGenerator()
world_model_service = WorldModelService()


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "AI Education Pipeline",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected",
        "claude_api": "configured",
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# MODULE GENERATION ENDPOINTS
# ============================================================================

@app.post("/api/modules", response_model=ModuleResponse)
async def create_module(
    request: ModuleRequest,
    background_tasks: BackgroundTasks
):
    """
    Create a new educational module from teacher's natural language request
    """
    try:
        logger.info(f"Creating module: {request.name}")

        # Create module record
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO modules (name, description, subject, grade_level, teacher_id, status)
            VALUES (%s, %s, %s, %s, %s, 'generating')
            RETURNING id, created_at
        """, (request.name, request.description, request.subject,
              request.grade_level, request.teacher_id))

        module_id, created_at = cursor.fetchone()
        conn.commit()

        # Start background generation
        background_tasks.add_task(
            generate_module_pipeline,
            module_id,
            request.description,
            request.grade_level
        )

        cursor.close()
        conn.close()

        return ModuleResponse(
            id=module_id,
            name=request.name,
            description=request.description,
            status="generating",
            created_at=created_at
        )

    except Exception as e:
        logger.error(f"Error creating module: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/modules/{module_id}")
async def get_module(module_id: str):
    """Get module details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, name, description, subject, grade_level, status,
                   world_model, created_at, updated_at
            FROM modules
            WHERE id = %s
        """, (module_id,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="Module not found")

        return {
            "id": result[0],
            "name": result[1],
            "description": result[2],
            "subject": result[3],
            "grade_level": result[4],
            "status": result[5],
            "world_model": result[6],
            "created_at": result[7],
            "updated_at": result[8]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching module: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# HIGHLIGHT CLIPS ENDPOINTS
# ============================================================================

@app.post("/api/modules/{module_id}/highlights/generate")
async def generate_highlights(
    module_id: str,
    background_tasks: BackgroundTasks
):
    """
    Generate highlight clips for a module using AI
    """
    try:
        logger.info(f"Generating highlights for module: {module_id}")

        # Start background highlight generation
        background_tasks.add_task(
            generate_highlight_clips,
            module_id
        )

        return {
            "message": "Highlight generation started",
            "module_id": module_id,
            "status": "processing"
        }

    except Exception as e:
        logger.error(f"Error starting highlight generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/modules/{module_id}/highlights")
async def get_module_highlights(module_id: str):
    """
    Get all highlight clips for a module
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, title, description, clip_type, content,
                   key_concepts, difficulty_level, estimated_duration_minutes,
                   order_index, is_featured, created_at
            FROM highlight_clips
            WHERE module_id = %s
            ORDER BY order_index, created_at
        """, (module_id,))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        highlights = []
        for row in results:
            highlights.append({
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "clip_type": row[3],
                "content": row[4],
                "key_concepts": row[5],
                "difficulty_level": row[6],
                "estimated_duration_minutes": row[7],
                "order_index": row[8],
                "is_featured": row[9],
                "created_at": row[10]
            })

        return {"highlights": highlights, "count": len(highlights)}

    except Exception as e:
        logger.error(f"Error fetching highlights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/highlights/daily")
async def get_daily_highlights(
    target_date: Optional[date] = None,
    grade_level: Optional[str] = None
):
    """
    Get daily recommended highlight clips
    """
    try:
        if not target_date:
            target_date = date.today()

        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            SELECT dh.id, dh.date, dh.recommendation_reason, dh.ai_confidence_score,
                   hc.id, hc.title, hc.description, hc.clip_type, hc.content,
                   hc.key_concepts, hc.difficulty_level, hc.module_id
            FROM daily_highlights dh
            JOIN highlight_clips hc ON dh.clip_id = hc.id
            WHERE dh.date = %s
        """
        params = [target_date]

        if grade_level:
            query += " AND dh.target_grade_level = %s"
            params.append(grade_level)

        query += " ORDER BY dh.ai_confidence_score DESC"

        cursor.execute(query, params)
        results = cursor.fetchall()
        cursor.close()
        conn.close()

        daily_highlights = []
        for row in results:
            daily_highlights.append({
                "id": row[0],
                "date": row[1],
                "recommendation_reason": row[2],
                "confidence_score": float(row[3]),
                "clip": {
                    "id": row[4],
                    "title": row[5],
                    "description": row[6],
                    "clip_type": row[7],
                    "content": row[8],
                    "key_concepts": row[9],
                    "difficulty_level": row[10],
                    "module_id": row[11]
                }
            })

        return {
            "date": target_date,
            "highlights": daily_highlights,
            "count": len(daily_highlights)
        }

    except Exception as e:
        logger.error(f"Error fetching daily highlights: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/highlights/daily/generate")
async def generate_daily_highlights(background_tasks: BackgroundTasks):
    """
    Generate daily highlight recommendations using AI
    """
    try:
        background_tasks.add_task(create_daily_recommendations)
        return {
            "message": "Daily highlight generation started",
            "date": date.today()
        }
    except Exception as e:
        logger.error(f"Error starting daily highlight generation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STUDENT PROGRESS ENDPOINTS
# ============================================================================

@app.get("/api/students/{student_id}/progress")
async def get_student_progress(student_id: str, clip_id: Optional[str] = None):
    """Get student progress on highlight clips"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if clip_id:
            cursor.execute("""
                SELECT id, clip_id, status, progress_percentage,
                       time_spent_seconds, attempts_count, started_at, completed_at
                FROM student_clip_progress
                WHERE student_id = %s AND clip_id = %s
            """, (student_id, clip_id))
        else:
            cursor.execute("""
                SELECT id, clip_id, status, progress_percentage,
                       time_spent_seconds, attempts_count, started_at, completed_at
                FROM student_clip_progress
                WHERE student_id = %s
                ORDER BY updated_at DESC
            """, (student_id,))

        results = cursor.fetchall()
        cursor.close()
        conn.close()

        progress_data = []
        for row in results:
            progress_data.append({
                "id": row[0],
                "clip_id": row[1],
                "status": row[2],
                "progress_percentage": row[3],
                "time_spent_seconds": row[4],
                "attempts_count": row[5],
                "started_at": row[6],
                "completed_at": row[7]
            })

        return {"progress": progress_data, "count": len(progress_data)}

    except Exception as e:
        logger.error(f"Error fetching student progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# BACKGROUND TASKS
# ============================================================================

async def generate_module_pipeline(module_id: str, description: str, grade_level: str):
    """Background task to generate module and highlights"""
    try:
        logger.info(f"Starting pipeline for module {module_id}")

        # Step 1: Generate world model
        world_model = await world_model_service.generate_world_model(
            description, grade_level
        )

        # Update module with world model
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE modules
            SET world_model = %s, status = 'active'
            WHERE id = %s
        """, (world_model, module_id))
        conn.commit()
        cursor.close()
        conn.close()

        # Step 2: Generate highlight clips
        await generate_highlight_clips(module_id)

        logger.info(f"Pipeline completed for module {module_id}")

    except Exception as e:
        logger.error(f"Pipeline error for module {module_id}: {str(e)}")
        # Update module status to failed
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE modules SET status = 'failed' WHERE id = %s
        """, (module_id,))
        conn.commit()
        cursor.close()
        conn.close()


async def generate_highlight_clips(module_id: str):
    """Generate highlight clips for a module"""
    try:
        logger.info(f"Generating highlight clips for module {module_id}")

        # Get module details
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name, description, world_model, grade_level
            FROM modules WHERE id = %s
        """, (module_id,))

        result = cursor.fetchone()
        if not result:
            raise ValueError(f"Module {module_id} not found")

        name, description, world_model, grade_level = result

        # Generate highlights using AI
        highlights = await highlight_generator.generate_highlights(
            module_name=name,
            module_description=description,
            world_model=world_model,
            grade_level=grade_level
        )

        # Save highlights to database
        for idx, highlight in enumerate(highlights):
            cursor.execute("""
                INSERT INTO highlight_clips
                (module_id, title, description, clip_type, content,
                 key_concepts, difficulty_level, estimated_duration_minutes, order_index)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                module_id,
                highlight['title'],
                highlight['description'],
                highlight['clip_type'],
                highlight['content'],
                highlight['key_concepts'],
                highlight.get('difficulty_level', 3),
                highlight.get('estimated_duration_minutes', 10),
                idx
            ))

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Generated {len(highlights)} highlight clips for module {module_id}")

    except Exception as e:
        logger.error(f"Error generating highlights: {str(e)}")
        raise


async def create_daily_recommendations():
    """Create daily highlight recommendations"""
    try:
        logger.info("Creating daily highlight recommendations")

        # Use AI to select best highlights for today
        recommendations = await highlight_generator.generate_daily_recommendations()

        conn = get_db_connection()
        cursor = conn.cursor()

        for rec in recommendations:
            cursor.execute("""
                INSERT INTO daily_highlights
                (date, clip_id, target_grade_level, recommendation_reason, ai_confidence_score)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (date, clip_id) DO UPDATE
                SET recommendation_reason = EXCLUDED.recommendation_reason,
                    ai_confidence_score = EXCLUDED.ai_confidence_score
            """, (
                date.today(),
                rec['clip_id'],
                rec['target_grade_level'],
                rec['reason'],
                rec['confidence']
            ))

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Created {len(recommendations)} daily recommendations")

    except Exception as e:
        logger.error(f"Error creating daily recommendations: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
