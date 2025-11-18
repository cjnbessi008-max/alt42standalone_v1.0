"""
루틴 카드 API 엔드포인트
"""
from typing import List
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..schemas.routine_card import (
    RoutineCardResponse,
    RoutineCardDetail,
    CardGenerationRequest
)
from ..services.card_service import CardService

router = APIRouter(prefix="/api/v1/cards", tags=["cards"])
card_service = CardService()


@router.post("/generate", response_model=RoutineCardResponse)
def generate_card(
    request: CardGenerationRequest,
    db: Session = Depends(get_db)
):
    """
    학생을 위한 성공 루틴 카드 생성

    - **student_id**: 학생 ID (필수)
    - **card_date**: 카드 날짜 (선택, 기본값: 오늘)
    - **force_regenerate**: 기존 카드가 있어도 재생성 (선택, 기본값: false)
    """
    try:
        card = card_service.generate_card_for_student(
            db=db,
            student_id=request.student_id,
            card_date=request.card_date,
            force_regenerate=request.force_regenerate
        )
        return card
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"카드 생성 실패: {str(e)}")


@router.get("/today/{student_id}", response_model=RoutineCardResponse)
def get_today_card(
    student_id: UUID,
    db: Session = Depends(get_db)
):
    """
    학생의 오늘 루틴 카드 조회

    카드가 없으면 자동으로 생성됩니다.
    """
    try:
        # 먼저 오늘 카드 확인
        card = card_service.get_today_card(db=db, student_id=student_id)

        # 없으면 생성
        if not card:
            card = card_service.generate_card_for_student(
                db=db,
                student_id=student_id,
                card_date=date.today()
            )

        # 조회 표시
        card = card_service.mark_card_viewed(db=db, card_id=card.id)

        return card
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{card_id}", response_model=RoutineCardResponse)
def get_card(
    card_id: UUID,
    db: Session = Depends(get_db)
):
    """특정 카드 조회"""
    from ..models.routine_card import RoutineCard

    card = db.query(RoutineCard).filter(RoutineCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="카드를 찾을 수 없습니다")

    # 조회 표시
    card = card_service.mark_card_viewed(db=db, card_id=card_id)

    return card


@router.get("/student/{student_id}", response_model=List[RoutineCardResponse])
def get_student_cards(
    student_id: UUID,
    limit: int = Query(default=30, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """학생의 카드 목록 조회"""
    cards = card_service.get_student_cards(
        db=db,
        student_id=student_id,
        limit=limit
    )
    return cards


@router.post("/{card_id}/complete", response_model=RoutineCardResponse)
def complete_card(
    card_id: UUID,
    db: Session = Depends(get_db)
):
    """카드 완료 표시"""
    try:
        card = card_service.mark_card_completed(db=db, card_id=card_id)
        return card
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/generate-all")
def generate_all_cards(db: Session = Depends(get_db)):
    """
    모든 학생을 위한 카드 일괄 생성

    관리자용 엔드포인트 - 스케줄러에서 호출
    """
    try:
        results = card_service.generate_cards_for_all_students(db=db)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
