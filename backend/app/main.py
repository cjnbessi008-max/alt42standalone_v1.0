"""
LMS Bottleneck Detection System - FastAPI Application
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from typing import Dict
import json

from .api import (
    students_router,
    attempts_router,
    bottlenecks_router,
    performance_router
)
from .database import engine, Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, student_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket
        logger.info(f"WebSocket connected for student {student_id}")

    def disconnect(self, student_id: str):
        if student_id in self.active_connections:
            del self.active_connections[student_id]
            logger.info(f"WebSocket disconnected for student {student_id}")

    async def send_personal_message(self, student_id: str, message: dict):
        if student_id in self.active_connections:
            await self.active_connections[student_id].send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        for connection in self.active_connections.values():
            await connection.send_text(json.dumps(message))


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting LMS Bottleneck Detection System")

    # Create database tables (in production, use Alembic migrations)
    # async with engine.begin() as conn:
    #     await conn.run_sync(Base.metadata.create_all)

    yield

    logger.info("Shutting down LMS Bottleneck Detection System")


# Create FastAPI app
app = FastAPI(
    title="LMS Bottleneck Detection API",
    description="실시간 학습 병목 지점 감지 시스템",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(students_router)
app.include_router(attempts_router)
app.include_router(bottlenecks_router)
app.include_router(performance_router)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "LMS Bottleneck Detection API",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "LMS Bottleneck Detection API",
        "docs": "/docs",
        "health": "/health"
    }


# WebSocket endpoint for real-time bottleneck notifications
@app.websocket("/ws/bottlenecks/{student_id}")
async def websocket_bottleneck_endpoint(websocket: WebSocket, student_id: str):
    """
    WebSocket endpoint for real-time bottleneck notifications

    Usage:
        const ws = new WebSocket('ws://localhost:8000/ws/bottlenecks/{student_id}');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Bottleneck update:', data);
        };
    """
    await manager.connect(student_id, websocket)

    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection",
            "message": f"Connected to bottleneck detection for student {student_id}",
            "student_id": student_id
        }))

        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()
            # Echo back (can be used for ping/pong)
            await websocket.send_text(json.dumps({
                "type": "echo",
                "data": data
            }))

    except WebSocketDisconnect:
        manager.disconnect(student_id)
        logger.info(f"Client {student_id} disconnected")


# Function to send bottleneck alerts (called from background tasks)
async def send_bottleneck_alert(student_id: str, bottleneck_data: dict):
    """
    Send bottleneck alert to connected client via WebSocket

    This should be called when a new bottleneck is detected
    """
    await manager.send_personal_message(student_id, {
        "type": "bottleneck_detected",
        "data": bottleneck_data,
        "timestamp": bottleneck_data.get("detected_at")
    })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
