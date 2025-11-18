from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import PraiseCard, Student, Achievement
from ..schemas import PraiseCardResponse, PraiseCardFeed
from ..schemas.praise_card import StudentInfo, AchievementInfo
from ..services.praise_card_service import PraiseCardService

router = APIRouter()


def _format_praise_card(card: PraiseCard) -> dict:
    """Format praise card with nested objects"""
    card_dict = {
        "id": str(card.id),
        "student_id": str(card.student_id),
        "title": card.title,
        "ai_message": card.ai_message,
        "card_design": card.card_design,
        "likes_count": card.likes_count,
        "comments_count": card.comments_count,
        "views_count": card.views_count,
        "created_at": card.created_at,
    }

    # Add student info
    if card.student:
        card_dict["student"] = {
            "id": str(card.student.id),
            "name": card.student.name,
            "grade_level": card.student.grade_level,
            "profile_image": card.student.profile_image,
        }

    # Add achievement info
    if card.achievement:
        card_dict["achievement"] = {
            "achievement_type": card.achievement.achievement_type.value,
            "title": card.achievement.title,
            "description": card.achievement.description,
            "value": card.achievement.value,
        }

    return card_dict


@router.get("/feed", response_model=PraiseCardFeed)
def get_feed(
    student_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Get praise cards feed
    - If student_id is provided: get only that student's cards
    - If student_id is None: get all cards (public feed)
    """

    offset = (page - 1) * page_size
    praise_card_service = PraiseCardService(db)

    # Get cards
    if student_id:
        cards = praise_card_service.get_student_feed(
            student_id, limit=page_size, offset=offset
        )
        # Get total count for this student
        total = (
            db.query(PraiseCard)
            .filter(PraiseCard.student_id == student_id, PraiseCard.is_visible == 1)
            .count()
        )
    else:
        cards = praise_card_service.get_all_feed(limit=page_size, offset=offset)
        # Get total count
        total = db.query(PraiseCard).filter(PraiseCard.is_visible == 1).count()

    # Format cards with nested objects
    formatted_cards = [_format_praise_card(card) for card in cards]

    # Calculate if there are more pages
    has_more = (offset + len(cards)) < total

    return {
        "cards": formatted_cards,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_more": has_more,
    }


@router.get("/{card_id}", response_model=PraiseCardResponse)
def get_praise_card(card_id: str, db: Session = Depends(get_db)):
    """Get a specific praise card by ID"""

    card = db.query(PraiseCard).filter(PraiseCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Praise card not found")

    # Increment view count
    praise_card_service = PraiseCardService(db)
    praise_card_service.increment_views(card_id)

    return _format_praise_card(card)


@router.get("/student/{student_id}/latest", response_model=Optional[PraiseCardResponse])
def get_latest_card(student_id: str, db: Session = Depends(get_db)):
    """Get the latest praise card for a student"""

    card = (
        db.query(PraiseCard)
        .filter(PraiseCard.student_id == student_id, PraiseCard.is_visible == 1)
        .order_by(PraiseCard.created_at.desc())
        .first()
    )

    if not card:
        return None

    return _format_praise_card(card)


@router.delete("/{card_id}", status_code=204)
def delete_praise_card(card_id: str, db: Session = Depends(get_db)):
    """Hide/delete a praise card"""

    card = db.query(PraiseCard).filter(PraiseCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Praise card not found")

    # Soft delete by setting is_visible to 0
    card.is_visible = 0
    db.commit()

    return None


@router.get("/student/{student_id}/stats")
def get_student_card_stats(student_id: str, db: Session = Depends(get_db)):
    """Get statistics about a student's praise cards"""

    total_cards = (
        db.query(PraiseCard)
        .filter(PraiseCard.student_id == student_id)
        .count()
    )

    total_likes = (
        db.query(PraiseCard)
        .filter(PraiseCard.student_id == student_id)
        .with_entities(PraiseCard.likes_count)
        .all()
    )
    total_likes_count = sum(card[0] for card in total_likes)

    # Get achievement type distribution
    achievement_types = (
        db.query(Achievement)
        .join(PraiseCard, Achievement.id == PraiseCard.achievement_id)
        .filter(PraiseCard.student_id == student_id)
        .with_entities(Achievement.achievement_type)
        .all()
    )

    achievement_distribution = {}
    for (achievement_type,) in achievement_types:
        type_name = achievement_type.value
        achievement_distribution[type_name] = achievement_distribution.get(type_name, 0) + 1

    return {
        "student_id": student_id,
        "total_cards": total_cards,
        "total_likes": total_likes_count,
        "achievement_distribution": achievement_distribution,
    }
