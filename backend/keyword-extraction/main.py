from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import logging

from services.keyword_extractor import KeywordExtractor
from services.visualization_generator import VisualizationGenerator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="LMS Keyword Extraction API",
    description="Extract and visualize keywords from LMS content",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
keyword_extractor = KeywordExtractor()
visualization_generator = VisualizationGenerator()


# Pydantic models
class ExtractionOptions(BaseModel):
    min_importance: float = Field(default=0.3, ge=0, le=1)
    max_keywords: int = Field(default=20, ge=1, le=100)
    include_relationships: bool = True


class ExtractionRequest(BaseModel):
    content: str = Field(..., min_length=1)
    language: Literal["ko", "en"] = "ko"
    extraction_options: Optional[ExtractionOptions] = None


class Keyword(BaseModel):
    id: str
    keyword: str
    normalized_keyword: str
    keyword_type: Literal["concept", "operation", "entity", "attribute"]
    importance_score: float
    frequency: int
    category: str
    source_content: str


class KeywordRelationship(BaseModel):
    id: str
    source_keyword_id: str
    target_keyword_id: str
    relationship_type: Literal["has_part", "related_to", "prerequisite"]
    strength: float


class BubbleNode(Keyword):
    x: float
    y: float
    radius: float
    color: str
    fx: Optional[float] = None
    fy: Optional[float] = None


class BubbleLink(BaseModel):
    source: str
    target: str
    strength: float
    relationship_type: str


class VisualizationData(BaseModel):
    nodes: List[BubbleNode]
    links: List[BubbleLink]


class ExtractionResponse(BaseModel):
    keywords: List[Keyword]
    relationships: List[KeywordRelationship]
    visualization_data: VisualizationData


@app.get("/")
async def root():
    return {
        "message": "LMS Keyword Extraction API",
        "version": "1.0.0",
        "endpoints": {
            "/api/keywords/extract": "POST - Extract keywords from content",
            "/api/health": "GET - Health check",
        },
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/keywords/extract", response_model=ExtractionResponse)
async def extract_keywords(request: ExtractionRequest):
    """
    Extract keywords from LMS content and generate visualization data
    """
    try:
        logger.info(f"Extracting keywords from content (language: {request.language})")

        # Set default options if not provided
        options = request.extraction_options or ExtractionOptions()

        # Extract keywords
        keywords, relationships = keyword_extractor.extract(
            content=request.content,
            language=request.language,
            min_importance=options.min_importance,
            max_keywords=options.max_keywords,
            include_relationships=options.include_relationships,
        )

        # Generate visualization data
        visualization_data = visualization_generator.generate(keywords, relationships)

        logger.info(f"Extracted {len(keywords)} keywords with {len(relationships)} relationships")

        return ExtractionResponse(
            keywords=keywords,
            relationships=relationships,
            visualization_data=visualization_data,
        )

    except Exception as e:
        logger.error(f"Error extracting keywords: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Keyword extraction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
