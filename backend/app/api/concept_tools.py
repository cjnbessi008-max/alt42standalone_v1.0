"""Concept Tool API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.concept_tool import ConceptTool
from ..schemas.concept_tool import ConceptToolCreate, ConceptToolResponse

router = APIRouter()


@router.get("/", response_model=List[ConceptToolResponse])
def list_tools(
    skip: int = 0,
    limit: int = 100,
    category: str = None,
    difficulty_level: str = None,
    db: Session = Depends(get_db)
):
    """List all concept tools with optional filters."""
    query = db.query(ConceptTool)

    if category:
        query = query.filter(ConceptTool.tool_category == category)
    if difficulty_level:
        query = query.filter(ConceptTool.difficulty_level == difficulty_level)

    tools = query.offset(skip).limit(limit).all()
    return tools


@router.get("/{tool_name}", response_model=ConceptToolResponse)
def get_tool(tool_name: str, db: Session = Depends(get_db)):
    """Get a specific concept tool by name."""
    tool = db.query(ConceptTool).filter(ConceptTool.tool_name == tool_name).first()
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    return tool


@router.post("/", response_model=ConceptToolResponse, status_code=201)
def create_tool(tool: ConceptToolCreate, db: Session = Depends(get_db)):
    """Create a new concept tool."""
    # Check if tool already exists
    existing = db.query(ConceptTool).filter(ConceptTool.tool_name == tool.tool_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tool name already exists")

    db_tool = ConceptTool(**tool.model_dump())
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    return db_tool


@router.get("/categories/list")
def list_categories(db: Session = Depends(get_db)):
    """List all unique tool categories."""
    categories = db.query(ConceptTool.tool_category).distinct().all()
    return {"categories": [cat[0] for cat in categories if cat[0]]}
