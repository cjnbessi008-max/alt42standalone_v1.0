"""
AI Education System Pipeline - Backend API
Color Partition Feature Implementation
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Literal
import uvicorn

from services.function_analyzer import FunctionAnalyzer

app = FastAPI(
    title="AI Education System - Color Partition API",
    description="Backend API for function analysis and visualization",
    version="1.0.0"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class FunctionAnalysisRequest(BaseModel):
    expression: str  # e.g., "x**2 - 4*x + 3"
    x_min: float = -10
    x_max: float = 10
    properties: List[Literal["increasing", "decreasing", "concave_up", "concave_down", "positive", "negative"]] = [
        "increasing", "decreasing", "concave_up", "concave_down"
    ]

class Interval(BaseModel):
    start: float
    end: float
    property: str
    color: str
    description: str

class FunctionAnalysisResponse(BaseModel):
    expression: str
    intervals: List[Interval]
    plot_points: List[Dict[str, float]]  # {x: float, y: float}
    derivative: Optional[str] = None
    second_derivative: Optional[str] = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Color Partition API",
        "version": "1.0.0"
    }

@app.post("/api/analyze-function", response_model=FunctionAnalysisResponse)
async def analyze_function(request: FunctionAnalysisRequest):
    """
    Analyze a mathematical function and return intervals with their properties.

    Example request:
    {
        "expression": "x**2 - 4*x + 3",
        "x_min": -2,
        "x_max": 6,
        "properties": ["increasing", "decreasing", "concave_up"]
    }
    """
    try:
        analyzer = FunctionAnalyzer()
        result = analyzer.analyze(
            expression=request.expression,
            x_min=request.x_min,
            x_max=request.x_max,
            properties=request.properties
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid function expression: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/api/visualizations/{visualization_id}")
async def get_visualization(visualization_id: str):
    """Get saved visualization data (for Moodle/LMS integration)"""
    # TODO: Implement database retrieval
    return {
        "id": visualization_id,
        "status": "not_implemented",
        "message": "Database integration pending"
    }

@app.post("/api/visualizations")
async def save_visualization(data: dict):
    """Save visualization data for later retrieval"""
    # TODO: Implement database storage
    return {
        "id": "temp_id",
        "status": "not_implemented",
        "message": "Database integration pending"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
