from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..db.session import get_db
from ..schemas.checklist import (
    ChecklistCreate,
    ChecklistResponse,
    ChecklistItemResponse,
    ChecklistProgressUpdate,
)
from ..services.checklist_generator import ChecklistGenerator
from ..models.checklist import Checklist
from ..models.module import Module

router = APIRouter(prefix="/api/checklists", tags=["checklists"])


@router.post("/", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
def create_checklist(
    checklist_data: ChecklistCreate,
    db: Session = Depends(get_db),
):
    """Create a new checklist"""
    checklist = Checklist(**checklist_data.model_dump())
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    return checklist


@router.post(
    "/generate/pipeline/{module_id}",
    response_model=ChecklistResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_pipeline_checklist(
    module_id: UUID,
    teacher_id: UUID,
    db: Session = Depends(get_db),
):
    """Generate automatic pipeline checklist for module creation"""
    # Verify module exists
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module {module_id} not found",
        )

    # Generate checklist
    checklist = ChecklistGenerator.generate_pipeline_checklist(
        db, module_id, teacher_id
    )

    return checklist


@router.post(
    "/generate/learning/{module_id}/{student_id}",
    response_model=ChecklistResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_learning_checklist(
    module_id: UUID,
    student_id: UUID,
    db: Session = Depends(get_db),
):
    """Generate automatic learning progress checklist for a student"""
    # Verify module exists
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Module {module_id} not found",
        )

    # Generate checklist
    checklist = ChecklistGenerator.generate_learning_checklist(
        db, module, student_id
    )

    return checklist


@router.get("/{checklist_id}", response_model=ChecklistResponse)
def get_checklist(
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    """Get checklist with all items"""
    try:
        checklist = ChecklistGenerator.get_checklist_with_items(db, checklist_id)
        return checklist
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/module/{module_id}", response_model=List[ChecklistResponse])
def get_module_checklists(
    module_id: UUID,
    db: Session = Depends(get_db),
):
    """Get all checklists for a module"""
    checklists = db.query(Checklist).filter(Checklist.module_id == module_id).all()
    return checklists


@router.get("/student/{student_id}", response_model=List[ChecklistResponse])
def get_student_checklists(
    student_id: UUID,
    db: Session = Depends(get_db),
):
    """Get all checklists for a student"""
    checklists = db.query(Checklist).filter(Checklist.student_id == student_id).all()
    return checklists


@router.put("/items/progress", response_model=ChecklistItemResponse)
def update_item_progress(
    progress_update: ChecklistProgressUpdate,
    db: Session = Depends(get_db),
):
    """Update progress of a checklist item"""
    try:
        item = ChecklistGenerator.update_item_progress(
            db,
            progress_update.item_id,
            progress_update.is_completed,
            progress_update.progress_percentage,
        )
        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_checklist(
    checklist_id: UUID,
    db: Session = Depends(get_db),
):
    """Delete a checklist and all its items"""
    checklist = db.query(Checklist).filter(Checklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Checklist {checklist_id} not found",
        )

    db.delete(checklist)
    db.commit()
    return None
