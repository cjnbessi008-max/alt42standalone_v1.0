"""
AI Generation Pipeline endpoints
Handles teacher requests for generating new educational modules
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
import asyncio
import json

from database import get_db
from services.claude_service import ClaudeService
from schemas.generation_schemas import (
    GenerationRequestCreate,
    GenerationRequestResponse,
    GenerationStatus
)

router = APIRouter()


@router.post("/request", response_model=GenerationRequestResponse)
async def create_generation_request(
    request: GenerationRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new generation request from teacher

    This endpoint accepts natural language requests from teachers
    and initiates the AI pipeline to generate educational modules
    """
    from sqlalchemy import text

    try:
        # Insert generation request
        insert_query = text("""
            INSERT INTO ai_education.generation_requests (
                teacher_id, request_text, request_type, module_type, status, current_stage
            ) VALUES (
                :teacher_id, :request_text, :request_type, :module_type, 'pending', 'initializing'
            )
            RETURNING id, created_at
        """)

        result = await db.execute(
            insert_query,
            {
                "teacher_id": str(request.teacher_id),
                "request_text": request.request_text,
                "request_type": request.request_type,
                "module_type": request.module_type
            }
        )

        await db.commit()
        row = result.fetchone()

        # Start background processing
        # In production, this would use Celery task queue
        request_id = row[0]

        return {
            "id": request_id,
            "teacher_id": request.teacher_id,
            "request_text": request.request_text,
            "status": "pending",
            "current_stage": "initializing",
            "progress_percentage": 0,
            "created_at": row[1]
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create request: {str(e)}")


@router.get("/request/{request_id}", response_model=dict)
async def get_generation_request(
    request_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get status of a generation request"""
    from sqlalchemy import text

    query = text("""
        SELECT * FROM ai_education.generation_requests
        WHERE id = :request_id
    """)

    result = await db.execute(query, {"request_id": str(request_id)})
    request_data = result.fetchone()

    if not request_data:
        raise HTTPException(status_code=404, detail="Request not found")

    return dict(request_data._mapping)


@router.websocket("/ws/{request_id}")
async def generation_websocket(
    websocket: WebSocket,
    request_id: UUID
):
    """
    WebSocket endpoint for real-time generation progress updates

    This allows the frontend to receive streaming updates as the AI pipeline
    progresses through different stages
    """
    await websocket.accept()

    try:
        # Simulate pipeline stages
        # In production, this would connect to actual pipeline progress
        stages = [
            ("analyzing_request", 10),
            ("building_world_model", 25),
            ("generating_rules", 40),
            ("creating_schema", 55),
            ("designing_input_strategy", 70),
            ("generating_ui", 85),
            ("finalizing", 95),
            ("completed", 100)
        ]

        for stage, progress in stages:
            await websocket.send_json({
                "request_id": str(request_id),
                "stage": stage,
                "progress": progress,
                "status": "processing" if progress < 100 else "completed"
            })

            # Simulate processing time
            await asyncio.sleep(2)

        await websocket.send_json({
            "request_id": str(request_id),
            "stage": "completed",
            "progress": 100,
            "status": "completed",
            "message": "Module generation completed successfully!"
        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_json({
            "error": str(e),
            "status": "failed"
        })
    finally:
        await websocket.close()
