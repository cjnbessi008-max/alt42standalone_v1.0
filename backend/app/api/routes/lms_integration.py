"""
API routes for LMS integration (LTI 1.3)
"""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from typing import Dict, Any
from uuid import UUID
import jwt
from datetime import datetime, timedelta

from app.db.database import get_db
from app.core.config import settings
from app.models.student_solution import Student, Module

router = APIRouter()


@router.post("/lti/login")
async def lti_login_initiation(request: Request):
    """
    LTI 1.3 Login Initiation endpoint
    This is the entry point from the LMS
    """
    form_data = await request.form()

    # Extract LTI parameters
    iss = form_data.get("iss")  # Issuer (LMS platform)
    login_hint = form_data.get("login_hint")  # User identifier
    target_link_uri = form_data.get("target_link_uri")  # Where to redirect after auth
    lti_message_hint = form_data.get("lti_message_hint", "")

    # Validate required parameters
    if not all([iss, login_hint, target_link_uri]):
        raise HTTPException(
            status_code=400,
            detail="Missing required LTI parameters"
        )

    # Build OIDC authentication request
    auth_request = {
        "iss": iss,
        "login_hint": login_hint,
        "target_link_uri": target_link_uri,
        "lti_message_hint": lti_message_hint,
        "client_id": settings.LTI_CLIENT_ID,
        "redirect_uri": f"{request.base_url}api/v1/lms/lti/launch",
        "response_type": "id_token",
        "response_mode": "form_post",
        "scope": "openid",
        "nonce": _generate_nonce(),
        "state": _generate_state()
    }

    # In production, redirect to LMS authorization endpoint
    # For now, return the auth request data
    return {
        "message": "LTI login initiated",
        "auth_request": auth_request,
        "next_step": "Redirect to LMS authorization endpoint"
    }


@router.post("/lti/launch")
async def lti_launch(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    LTI 1.3 Launch endpoint
    Receives the ID token from the LMS after authentication
    """
    form_data = await request.form()
    id_token = form_data.get("id_token")
    state = form_data.get("state")

    if not id_token:
        raise HTTPException(status_code=400, detail="Missing ID token")

    try:
        # Decode and validate ID token (simplified - use proper JWT validation in production)
        # In production, verify signature using LMS public key
        decoded_token = jwt.decode(
            id_token,
            options={"verify_signature": False}  # ONLY for demo - MUST verify in production
        )

        # Extract user and context information
        user_id = decoded_token.get("sub")
        user_name = decoded_token.get("name", "")
        user_email = decoded_token.get("email", "")
        context_id = decoded_token.get("https://purl.imsglobal.org/spec/lti/claim/context", {}).get("id")
        resource_link_id = decoded_token.get("https://purl.imsglobal.org/spec/lti/claim/resource_link", {}).get("id")

        # Get or create student
        student = db.query(Student).filter(Student.lms_user_id == user_id).first()

        if not student:
            student = Student(
                lms_user_id=user_id,
                name=user_name,
                email=user_email
            )
            db.add(student)
            db.commit()
            db.refresh(student)

        # Create session token for the student
        session_token = _create_session_token(student.id)

        return {
            "message": "LTI launch successful",
            "student_id": student.id,
            "session_token": session_token,
            "user_name": user_name,
            "context_id": context_id,
            "resource_link_id": resource_link_id,
            "redirect_url": f"/student/dashboard?token={session_token}"
        }

    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid ID token: {str(e)}")


@router.post("/lti/deep-link")
async def lti_deep_link(request: Request):
    """
    LTI 1.3 Deep Linking endpoint
    Allows teachers to select content from within the LMS
    """
    form_data = await request.form()
    id_token = form_data.get("id_token")

    if not id_token:
        raise HTTPException(status_code=400, detail="Missing ID token")

    # Decode token
    decoded_token = jwt.decode(
        id_token,
        options={"verify_signature": False}  # ONLY for demo
    )

    # Return available modules/content for selection
    return {
        "message": "Deep linking endpoint",
        "available_modules": [
            {
                "id": "fractions-module",
                "title": "Fractions Learning Module",
                "description": "Interactive fractions learning with visual flowcharts"
            }
        ]
    }


@router.get("/lti/jwks")
async def lti_jwks():
    """
    JSON Web Key Set endpoint
    Provides public keys for LMS to verify our signatures
    """
    # In production, generate and serve actual JWKS
    return {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "kid": "key-1",
                "alg": "RS256",
                "n": "example-modulus",
                "e": "AQAB"
            }
        ]
    }


@router.post("/grade-passback")
async def grade_passback(
    solution_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Send grade back to LMS using LTI Assignment and Grade Services (AGS)
    """
    from app.models.student_solution import StudentSolution

    solution = db.query(StudentSolution).filter(
        StudentSolution.id == solution_id
    ).first()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Calculate score (0-1 scale for LTI)
    score = 1.0 if solution.is_correct else 0.0

    # In production, use LTI AGS to send grade
    # For now, return grade data
    grade_data = {
        "userId": str(solution.student_id),
        "scoreGiven": score,
        "scoreMaximum": 1.0,
        "comment": f"Time spent: {solution.time_spent_seconds}s, Attempts: {solution.attempts_count}",
        "activityProgress": "Completed" if solution.completed_at else "InProgress",
        "gradingProgress": "FullyGraded" if solution.completed_at else "PendingManual",
        "timestamp": solution.completed_at.isoformat() if solution.completed_at else datetime.utcnow().isoformat()
    }

    return {
        "message": "Grade prepared for passback",
        "grade_data": grade_data,
        "note": "In production, this would be sent to LMS via AGS endpoint"
    }


@router.get("/student/{lms_user_id}/link")
async def link_lms_student(
    lms_user_id: str,
    db: Session = Depends(get_db)
):
    """
    Link LMS user to internal student record
    """
    student = db.query(Student).filter(Student.lms_user_id == lms_user_id).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return {
        "lms_user_id": lms_user_id,
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "created_at": student.created_at
    }


def _generate_nonce() -> str:
    """Generate a unique nonce for OIDC"""
    import secrets
    return secrets.token_urlsafe(32)


def _generate_state() -> str:
    """Generate a unique state parameter for OIDC"""
    import secrets
    return secrets.token_urlsafe(32)


def _create_session_token(student_id: UUID) -> str:
    """Create a session JWT token for the student"""
    payload = {
        "student_id": str(student_id),
        "exp": datetime.utcnow() + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_MINUTES // 60),
        "iat": datetime.utcnow()
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token
