"""
Module and Problem API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ...database import get_db
from ...models.module import Module, Problem
from ...schemas.module import ModuleCreate, ModuleResponse, ProblemCreate, ProblemResponse

router = APIRouter()


# Module endpoints
@router.post("/", response_model=ModuleResponse, status_code=201)
def create_module(module: ModuleCreate, db: Session = Depends(get_db)):
    """Create a new module."""
    db_module = Module(
        name=module.name,
        description=module.description,
        teacher_id=module.teacher_id,
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module


@router.get("/", response_model=List[ModuleResponse])
def list_modules(
    skip: int = 0,
    limit: int = 100,
    teacher_id: UUID = None,
    db: Session = Depends(get_db)
):
    """List all modules."""
    query = db.query(Module)

    if teacher_id:
        query = query.filter(Module.teacher_id == teacher_id)

    modules = query.offset(skip).limit(limit).all()
    return modules


@router.get("/{module_id}", response_model=ModuleResponse)
def get_module(module_id: UUID, db: Session = Depends(get_db)):
    """Get a specific module."""
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


# Problem endpoints
@router.post("/problems", response_model=ProblemResponse, status_code=201)
def create_problem(problem: ProblemCreate, db: Session = Depends(get_db)):
    """Create a new problem in a module."""
    # Verify module exists
    module = db.query(Module).filter(Module.id == problem.module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    db_problem = Problem(
        module_id=problem.module_id,
        problem_type=problem.problem_type,
        question_text=problem.question_text,
        correct_answer=problem.correct_answer,
        hints=problem.hints,
        difficulty=problem.difficulty,
        order_index=problem.order_index,
    )
    db.add(db_problem)
    db.commit()
    db.refresh(db_problem)
    return db_problem


@router.get("/{module_id}/problems", response_model=List[ProblemResponse])
def list_problems(module_id: UUID, db: Session = Depends(get_db)):
    """List all problems in a module."""
    problems = db.query(Problem).filter(
        Problem.module_id == module_id
    ).order_by(Problem.order_index).all()
    return problems
