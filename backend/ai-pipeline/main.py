"""
FastAPI Application for Higher Derivative Lines
Provides REST API for derivative calculation and graph generation
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Tuple
import uvicorn

from math_engine.calculus import DerivativeCalculator, GraphGenerator, LineStyleManager

# Initialize FastAPI app
app = FastAPI(
    title="Higher Derivative Lines API",
    description="Calculate and visualize higher-order derivatives with different line styles",
    version="1.0.0"
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
derivative_calc = DerivativeCalculator()
graph_generator = GraphGenerator()
style_manager = LineStyleManager()


# Pydantic models for request/response
class DerivativeRequest(BaseModel):
    """Request model for derivative calculation"""
    function: str = Field(..., description="Mathematical function as string (e.g., 'x**2 + 2*x + 1')")
    max_order: int = Field(default=4, ge=0, le=10, description="Maximum derivative order to calculate")

    class Config:
        json_schema_extra = {
            "example": {
                "function": "x**3 - 3*x**2 + 2*x + 1",
                "max_order": 3
            }
        }


class GraphRequest(BaseModel):
    """Request model for graph generation"""
    function: str = Field(..., description="Mathematical function as string")
    max_order: int = Field(default=4, ge=0, le=10, description="Maximum derivative order")
    domain_min: float = Field(default=-10, description="Minimum x value")
    domain_max: float = Field(default=10, description="Maximum x value")
    num_points: int = Field(default=500, ge=50, le=2000, description="Number of points to plot")
    color_scheme: str = Field(default="professional", description="Color scheme to use")
    visible_orders: Optional[List[int]] = Field(default=None, description="Which derivative orders to show")

    class Config:
        json_schema_extra = {
            "example": {
                "function": "x**3 - 3*x**2 + 2*x + 1",
                "max_order": 3,
                "domain_min": -2,
                "domain_max": 4,
                "num_points": 500,
                "color_scheme": "professional",
                "visible_orders": [0, 1, 2, 3]
            }
        }


class MoodleQuestionRequest(BaseModel):
    """Request model from Moodle LMS"""
    question_id: int = Field(..., description="Moodle question ID")
    user_id: int = Field(..., description="Student user ID")
    function: str = Field(..., description="Function to analyze")
    required_orders: List[int] = Field(default=[0, 1, 2], description="Required derivative orders")

    class Config:
        json_schema_extra = {
            "example": {
                "question_id": 12345,
                "user_id": 67890,
                "function": "x**2 + 2*x + 1",
                "required_orders": [0, 1, 2]
            }
        }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Higher Derivative Lines API",
        "version": "1.0.0",
        "endpoints": {
            "derivatives": "/api/derivatives",
            "graph": "/api/graph",
            "styles": "/api/styles",
            "moodle": "/api/moodle/question"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.post("/api/derivatives")
async def calculate_derivatives(request: DerivativeRequest):
    """
    Calculate derivatives of a function up to specified order

    Returns symbolic expressions and critical points
    """
    try:
        # Calculate derivatives
        derivatives = derivative_calc.calculate_derivatives(
            request.function,
            max_order=request.max_order
        )

        # Find critical points
        critical_points = derivative_calc.find_critical_points(
            request.function,
            domain=(-10, 10)
        )

        # Format response
        response = {
            "function": request.function,
            "derivatives": {
                order: str(expr) for order, expr in derivatives.items()
            },
            "critical_points": critical_points.get("critical_points", []),
            "inflection_points": critical_points.get("inflection_points", []),
            "max_order": request.max_order
        }

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.post("/api/graph")
async def generate_graph(request: GraphRequest):
    """
    Generate complete graph data for derivatives with styling

    Returns datasets, grid configuration, and legend information
    ready for frontend rendering
    """
    try:
        # Generate graph data
        graph_data = graph_generator.export_for_frontend(
            function_str=request.function,
            max_order=request.max_order,
            domain=(request.domain_min, request.domain_max),
            num_points=request.num_points,
            color_scheme=request.color_scheme
        )

        # Filter visible orders if specified
        if request.visible_orders is not None:
            graph_data['datasets'] = [
                ds for ds in graph_data['datasets']
                if ds['order'] in request.visible_orders
            ]
            graph_data['legend'] = [
                leg for leg in graph_data['legend']
                if any(ds['order'] in request.visible_orders for ds in graph_data['datasets'])
            ]

        return graph_data

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/api/styles")
async def get_styles(
    max_order: int = Query(default=4, ge=0, le=10),
    color_scheme: str = Query(default="professional")
):
    """
    Get line style configuration for derivatives

    Returns style information for each derivative order
    """
    try:
        styles = style_manager.get_all_styles(max_order, color_scheme)
        legend = style_manager.get_legend_config(list(range(max_order + 1)))

        return {
            "styles": styles,
            "legend": legend,
            "color_schemes": list(style_manager.color_schemes.keys())
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/api/color-schemes")
async def get_color_schemes():
    """Get available color schemes"""
    return {
        "schemes": style_manager.color_schemes,
        "default": "professional"
    }


@app.post("/api/moodle/question")
async def process_moodle_question(request: MoodleQuestionRequest):
    """
    Process a question from Moodle LMS

    Generates graph data for specified function and derivative orders
    Returns data formatted for display in virtual smartphone screen
    """
    try:
        # Generate graph data
        graph_data = graph_generator.export_for_frontend(
            function_str=request.function,
            max_order=max(request.required_orders),
            domain=(-10, 10),
            num_points=500,
            color_scheme="professional"
        )

        # Filter to only required orders
        graph_data['datasets'] = [
            ds for ds in graph_data['datasets']
            if ds['order'] in request.required_orders
        ]

        # Add Moodle-specific metadata
        response = {
            "question_id": request.question_id,
            "user_id": request.user_id,
            "graph_data": graph_data,
            "display_config": {
                "show_legend": True,
                "show_grid": True,
                "interactive": True,
                "virtual_screen_position": "bottom-right"
            }
        }

        return response

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@app.get("/api/examples")
async def get_examples():
    """Get example functions for testing"""
    return {
        "examples": [
            {
                "name": "Cubic Polynomial",
                "function": "x**3 - 3*x**2 + 2*x + 1",
                "description": "A cubic function with critical points"
            },
            {
                "name": "Quadratic",
                "function": "x**2 - 4*x + 3",
                "description": "Simple quadratic function"
            },
            {
                "name": "Trigonometric",
                "function": "sin(x)",
                "description": "Sine function (periodic derivatives)"
            },
            {
                "name": "Exponential",
                "function": "exp(x)",
                "description": "Exponential function (constant derivative)"
            },
            {
                "name": "Polynomial",
                "function": "x**4 - 4*x**3 + 6*x**2 - 4*x + 1",
                "description": "Fourth-degree polynomial"
            }
        ]
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
