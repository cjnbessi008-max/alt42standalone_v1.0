"""
API routes for student solutions
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.db.database import get_db
from app.models.student_solution import (
    StudentSolution, StudentAction, Student, Problem, ActionType
)
from app.schemas.flowchart import ActionData

router = APIRouter()


@router.post("/track-action")
async def track_student_action(
    student_id: UUID,
    solution_id: UUID,
    action_type: str,
    action_data: dict = None,
    db: Session = Depends(get_db)
):
    """
    Track a student action during problem solving
    """
    # Verify solution exists
    solution = db.query(StudentSolution).filter(StudentSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Get the last action to determine sequence number
    last_action = db.query(StudentAction)\
        .filter(StudentAction.solution_id == solution_id)\
        .order_by(StudentAction.sequence_number.desc())\
        .first()

    sequence_number = (last_action.sequence_number + 1) if last_action else 1

    # Calculate time since previous action
    time_since_previous = None
    if last_action:
        time_diff = datetime.utcnow() - last_action.timestamp
        time_since_previous = time_diff.total_seconds()

    # Create new action
    new_action = StudentAction(
        solution_id=solution_id,
        student_id=student_id,
        action_type=ActionType(action_type),
        action_data=action_data,
        sequence_number=sequence_number,
        previous_action_id=last_action.id if last_action else None,
        time_since_previous=time_since_previous
    )

    db.add(new_action)

    # Update solution
    solution.attempts_count = sequence_number
    if action_type == ActionType.VIEW_HINT:
        solution.hints_used_count += 1

    db.commit()
    db.refresh(new_action)

    return {
        "action_id": new_action.id,
        "sequence_number": sequence_number,
        "timestamp": new_action.timestamp
    }


@router.post("/start-solution")
async def start_solution(
    student_id: UUID,
    problem_id: UUID,
    module_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Start a new solution session for a student
    """
    # Verify student and problem exist
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    problem = db.query(Problem).filter(Problem.id == problem_id).first()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Create new solution
    solution = StudentSolution(
        student_id=student_id,
        module_id=module_id,
        problem_id=problem_id,
        started_at=datetime.utcnow()
    )

    db.add(solution)
    db.commit()
    db.refresh(solution)

    # Track initial action
    initial_action = StudentAction(
        solution_id=solution.id,
        student_id=student_id,
        action_type=ActionType.VIEW_PROBLEM,
        action_data={"problem_id": str(problem_id)},
        sequence_number=1
    )

    db.add(initial_action)
    db.commit()

    return {
        "solution_id": solution.id,
        "started_at": solution.started_at,
        "problem_id": problem_id
    }


@router.post("/submit-answer")
async def submit_answer(
    solution_id: UUID,
    answer: dict,
    db: Session = Depends(get_db)
):
    """
    Submit student's answer for a problem
    """
    solution = db.query(StudentSolution).filter(StudentSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    problem = db.query(Problem).filter(Problem.id == solution.problem_id).first()

    # Check if answer is correct (simplified comparison)
    is_correct = answer == problem.correct_answer

    # Update solution
    solution.final_answer = answer
    solution.is_correct = is_correct
    solution.completed_at = datetime.utcnow()

    time_spent = (datetime.utcnow() - solution.started_at).total_seconds()
    solution.time_spent_seconds = int(time_spent)

    # Track answer submission action
    action_type = ActionType.CORRECT_ANSWER if is_correct else ActionType.INCORRECT_ANSWER
    last_action = db.query(StudentAction)\
        .filter(StudentAction.solution_id == solution_id)\
        .order_by(StudentAction.sequence_number.desc())\
        .first()

    new_action = StudentAction(
        solution_id=solution_id,
        student_id=solution.student_id,
        action_type=action_type,
        action_data={"answer": answer, "is_correct": is_correct},
        sequence_number=(last_action.sequence_number + 1) if last_action else 1,
        previous_action_id=last_action.id if last_action else None
    )

    db.add(new_action)
    db.commit()
    db.refresh(solution)

    return {
        "solution_id": solution.id,
        "is_correct": is_correct,
        "time_spent_seconds": solution.time_spent_seconds,
        "completed_at": solution.completed_at
    }


@router.get("/solution/{solution_id}/actions")
async def get_solution_actions(
    solution_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get all actions for a solution
    """
    solution = db.query(StudentSolution).filter(StudentSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    actions = db.query(StudentAction)\
        .filter(StudentAction.solution_id == solution_id)\
        .order_by(StudentAction.sequence_number)\
        .all()

    return {
        "solution_id": solution_id,
        "total_actions": len(actions),
        "actions": [
            {
                "id": action.id,
                "action_type": action.action_type,
                "action_data": action.action_data,
                "timestamp": action.timestamp,
                "sequence_number": action.sequence_number,
                "time_since_previous": action.time_since_previous
            }
            for action in actions
        ]
    }


@router.get("/student/{student_id}/solutions")
async def get_student_solutions(
    student_id: UUID,
    module_id: UUID = None,
    db: Session = Depends(get_db)
):
    """
    Get all solutions for a student, optionally filtered by module
    """
    query = db.query(StudentSolution).filter(StudentSolution.student_id == student_id)

    if module_id:
        query = query.filter(StudentSolution.module_id == module_id)

    solutions = query.order_by(StudentSolution.started_at.desc()).all()

    return {
        "student_id": student_id,
        "total_solutions": len(solutions),
        "solutions": [
            {
                "id": sol.id,
                "problem_id": sol.problem_id,
                "module_id": sol.module_id,
                "started_at": sol.started_at,
                "completed_at": sol.completed_at,
                "is_correct": sol.is_correct,
                "time_spent_seconds": sol.time_spent_seconds,
                "attempts_count": sol.attempts_count,
                "hints_used_count": sol.hints_used_count
            }
            for sol in solutions
        ]
    }
