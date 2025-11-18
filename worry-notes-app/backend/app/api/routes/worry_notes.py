"""
Worry Notes API Routes
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.worry_note import (
    WorryNoteCreate,
    WorryNoteUpdate,
    WorryNoteResponse,
    WorryNoteList
)
from app.services.worry_note_service import WorryNoteService
from app.api.deps import get_current_user

router = APIRouter()


@router.post("", response_model=WorryNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_worry_note(
    note_data: WorryNoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new worry note (student only)
    """
    if not current_user.is_student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can create worry notes"
        )

    service = WorryNoteService(db)
    note = await service.create_note(
        student_id=current_user.id,
        note_data=note_data
    )
    return note


@router.get("", response_model=WorryNoteList)
async def list_worry_notes(
    # Filters
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    student_id: Optional[UUID] = Query(None),
    course_id: Optional[UUID] = Query(None),
    is_crisis: Optional[bool] = Query(None),
    # Pagination
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    # Auth
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List worry notes with filters

    - Students: See only their own notes
    - Teachers/Counselors: See notes from their courses or assigned to them
    - Admins: See all notes
    """
    service = WorryNoteService(db)

    # Apply role-based filtering
    if current_user.is_student:
        student_id = current_user.id  # Override filter to only show own notes

    notes, total = await service.list_notes(
        category=category,
        priority=priority,
        status=status,
        student_id=student_id,
        course_id=course_id,
        is_crisis=is_crisis,
        current_user=current_user,
        skip=skip,
        limit=limit
    )

    return WorryNoteList(
        items=notes,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{note_id}", response_model=WorryNoteResponse)
async def get_worry_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a single worry note by ID
    """
    service = WorryNoteService(db)
    note = await service.get_note(note_id, current_user)

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worry note not found"
        )

    return note


@router.patch("/{note_id}", response_model=WorryNoteResponse)
async def update_worry_note(
    note_id: UUID,
    note_data: WorryNoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a worry note (teachers/counselors/admins only)
    """
    if current_user.is_student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students cannot update worry notes"
        )

    service = WorryNoteService(db)
    note = await service.update_note(note_id, note_data, current_user)

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worry note not found"
        )

    return note


@router.patch("/{note_id}/resolve", response_model=WorryNoteResponse)
async def resolve_worry_note(
    note_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark a worry note as resolved
    """
    service = WorryNoteService(db)
    note = await service.resolve_note(note_id, current_user)

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worry note not found"
        )

    return note


@router.patch("/{note_id}/assign", response_model=WorryNoteResponse)
async def assign_worry_note(
    note_id: UUID,
    assigned_to: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Assign a worry note to a counselor/teacher (teachers/admins only)
    """
    if not (current_user.is_teacher or current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers and admins can assign worry notes"
        )

    service = WorryNoteService(db)
    note = await service.assign_note(note_id, assigned_to, current_user)

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worry note not found"
        )

    return note


@router.get("/my/concerns", response_model=WorryNoteList)
async def get_my_concerns(
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user's worry notes (students only)
    """
    if not current_user.is_student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )

    service = WorryNoteService(db)
    notes, total = await service.list_notes(
        student_id=current_user.id,
        status=status,
        current_user=current_user,
        skip=skip,
        limit=limit
    )

    return WorryNoteList(
        items=notes,
        total=total,
        skip=skip,
        limit=limit
    )
