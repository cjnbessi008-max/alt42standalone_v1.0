"""Data import API endpoints."""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import io
from datetime import datetime

from ..database import get_db
from ..models.student import Student
from ..models.concept_tool import ConceptTool
from ..models.usage_session import UsageSession
from ..models.teacher import Teacher

router = APIRouter()


@router.post("/csv/students")
async def import_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import students from CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        required_cols = ['student_id']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")

        imported = 0
        errors = []

        for _, row in df.iterrows():
            try:
                # Check if student exists
                existing = db.query(Student).filter(Student.student_id == row['student_id']).first()
                if existing:
                    continue

                student = Student(
                    student_id=row['student_id'],
                    name=row.get('name'),
                    grade_level=str(row.get('grade_level')) if pd.notna(row.get('grade_level')) else None,
                    performance_level=row.get('performance_level'),
                    gender=row.get('gender')
                )
                db.add(student)
                imported += 1
            except Exception as e:
                errors.append(f"Row {_}: {str(e)}")

        db.commit()

        return {
            "message": "Import completed",
            "imported": imported,
            "errors": errors[:10]  # Return first 10 errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.post("/csv/sessions")
async def import_sessions_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import usage sessions from CSV file."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be CSV")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        required_cols = ['student_id', 'tool_name', 'session_start']
        if not all(col in df.columns for col in required_cols):
            raise HTTPException(status_code=400, detail=f"CSV must contain columns: {required_cols}")

        imported = 0
        errors = []

        # Create lookup dictionaries
        students_map = {s.student_id: s.id for s in db.query(Student).all()}
        tools_map = {t.tool_name: t.id for t in db.query(ConceptTool).all()}

        for idx, row in df.iterrows():
            try:
                student_uuid = students_map.get(row['student_id'])
                tool_uuid = tools_map.get(row['tool_name'])

                if not student_uuid:
                    errors.append(f"Row {idx}: Student {row['student_id']} not found")
                    continue
                if not tool_uuid:
                    errors.append(f"Row {idx}: Tool {row['tool_name']} not found")
                    continue

                session = UsageSession(
                    student_id=student_uuid,
                    tool_id=tool_uuid,
                    session_start=pd.to_datetime(row['session_start']),
                    session_end=pd.to_datetime(row['session_end']) if pd.notna(row.get('session_end')) else None,
                    duration_seconds=int(row['duration_seconds']) if pd.notna(row.get('duration_seconds')) else None,
                    interactions_count=int(row['interactions_count']) if pd.notna(row.get('interactions_count')) else 0,
                    completed=bool(row.get('completed', False)),
                    success_rate=float(row['success_rate']) if pd.notna(row.get('success_rate')) else None,
                    context=row.get('context'),
                    device_type=row.get('device_type')
                )
                db.add(session)
                imported += 1

                if imported % 100 == 0:
                    db.commit()  # Commit in batches

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")

        db.commit()

        return {
            "message": "Import completed",
            "imported": imported,
            "errors": errors[:20]  # Return first 20 errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/template/students")
def get_students_template():
    """Get CSV template for students import."""
    return {
        "columns": ["student_id", "name", "grade_level", "performance_level", "gender"],
        "example": {
            "student_id": "S001",
            "name": "Student A",
            "grade_level": "3",
            "performance_level": "high",
            "gender": "F"
        }
    }


@router.get("/template/sessions")
def get_sessions_template():
    """Get CSV template for sessions import."""
    return {
        "columns": [
            "student_id", "tool_name", "session_start", "session_end",
            "duration_seconds", "interactions_count", "completed",
            "success_rate", "context", "device_type"
        ],
        "example": {
            "student_id": "S001",
            "tool_name": "FractionVisualizer",
            "session_start": "2024-01-15 10:30:00",
            "session_end": "2024-01-15 10:35:00",
            "duration_seconds": "300",
            "interactions_count": "25",
            "completed": "True",
            "success_rate": "85.5",
            "context": "classroom",
            "device_type": "tablet"
        }
    }
