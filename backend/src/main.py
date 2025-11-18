"""
Main FastAPI Application
Backend API for KAIST Touch Math Academy AI Education System
Equation Simplification Animation Feature
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
import time
from typing import Dict, Any

from .api.equations import router as equations_router


# Create FastAPI app
app = FastAPI(
    title="KAIST Touch Math Academy - Equation Animation API",
    description="""
    AI-powered equation simplification and animation system.

    ## Features

    * **Equation Simplification**: Automatically simplify mathematical equations
    * **Step-by-Step Animation**: Generate animation data for visual learning
    * **Multiple Strategies**: Support for expand, factor, collect, and auto strategies
    * **Equation Solving**: Solve linear equations with detailed steps

    ## Educational Focus

    Designed for KAIST Touch Math Academy to enhance mathematics education
    through visual, animated equation transformations.
    """,
    version="1.0.0",
    contact={
        "name": "KAIST Touch Math Academy",
        "email": "support@kaist-math.edu",
    },
    license_info={
        "name": "MIT License",
    },
)


# CORS Configuration
# Allow frontend to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development
        "http://localhost:5173",  # Vite development
        "https://kaist-math.edu",  # Production (example)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time header to all responses"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}"
    return response


# Include routers
app.include_router(equations_router)


# Root endpoint
@app.get("/", tags=["root"])
async def root() -> Dict[str, Any]:
    """
    Root endpoint - API information
    """
    return {
        "name": "KAIST Touch Math Academy - Equation Animation API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
            "equations": "/api/equations",
        },
        "features": [
            "Equation simplification with step-by-step animation",
            "Linear equation solving",
            "Multiple simplification strategies",
            "Real-time LaTeX rendering support",
        ]
    }


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "service": "equation-animation-api",
        "version": "1.0.0"
    }


# Custom OpenAPI schema
def custom_openapi():
    """
    Customize OpenAPI schema with additional information
    """
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title="KAIST Touch Math Academy - Equation Animation API",
        version="1.0.0",
        description=app.description,
        routes=app.routes,
    )

    # Add custom schema information
    openapi_schema["info"]["x-logo"] = {
        "url": "https://kaist.ac.kr/favicon.ico"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi


# Exception handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "detail": f"The requested resource '{request.url.path}' was not found",
            "suggestion": "Check the API documentation at /docs"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    """Handle 500 errors"""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred",
            "suggestion": "Please contact support if the issue persists"
        }
    )


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Run on application startup
    """
    print("=" * 60)
    print("KAIST Touch Math Academy - Equation Animation API")
    print("=" * 60)
    print("Status: Starting...")
    print("Version: 1.0.0")
    print("Documentation: http://localhost:8000/docs")
    print("=" * 60)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Run on application shutdown
    """
    print("=" * 60)
    print("Shutting down Equation Animation API...")
    print("=" * 60)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
