from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from ..database import get_db
from ..models import CardInteraction, PraiseCard
from ..models.card_interaction import InteractionType
from ..schemas import InteractionCreate, InteractionResponse

router = APIRouter()


@router.post("/like", response_model=InteractionResponse, status_code=201)
def like_card(
    praise_card_id: str, student_id: str, db: Session = Depends(get_db)
):
    """Like a praise card"""

    # Verify card exists
    card = db.query(PraiseCard).filter(PraiseCard.id == praise_card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Praise card not found")

    # Create like interaction
    interaction = CardInteraction(
        praise_card_id=praise_card_id,
        student_id=student_id,
        interaction_type=InteractionType.LIKE,
    )

    try:
        db.add(interaction)
        # Increment like count on card
        card.likes_count += 1
        db.commit()
        db.refresh(interaction)
        return interaction
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400, detail="Already liked this card"
        )


@router.delete("/like/{card_id}/{student_id}", status_code=204)
def unlike_card(card_id: str, student_id: str, db: Session = Depends(get_db)):
    """Unlike a praise card"""

    # Find the like interaction
    interaction = (
        db.query(CardInteraction)
        .filter(
            CardInteraction.praise_card_id == card_id,
            CardInteraction.student_id == student_id,
            CardInteraction.interaction_type == InteractionType.LIKE,
        )
        .first()
    )

    if not interaction:
        raise HTTPException(status_code=404, detail="Like not found")

    # Get the card and decrement like count
    card = db.query(PraiseCard).filter(PraiseCard.id == card_id).first()
    if card and card.likes_count > 0:
        card.likes_count -= 1

    db.delete(interaction)
    db.commit()

    return None


@router.post("/comment", response_model=InteractionResponse, status_code=201)
def comment_on_card(
    praise_card_id: str,
    student_id: str,
    comment_text: str,
    db: Session = Depends(get_db),
):
    """Add a comment to a praise card"""

    # Verify card exists
    card = db.query(PraiseCard).filter(PraiseCard.id == praise_card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Praise card not found")

    # Validate comment
    if not comment_text or len(comment_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    if len(comment_text) > 500:
        raise HTTPException(
            status_code=400, detail="Comment too long (max 500 characters)"
        )

    # Create comment interaction
    interaction = CardInteraction(
        praise_card_id=praise_card_id,
        student_id=student_id,
        interaction_type=InteractionType.COMMENT,
        comment_text=comment_text.strip(),
    )

    db.add(interaction)
    # Increment comment count on card
    card.comments_count += 1
    db.commit()
    db.refresh(interaction)

    return interaction


@router.get("/card/{card_id}/comments", response_model=List[InteractionResponse])
def get_card_comments(
    card_id: str, skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    """Get all comments for a praise card"""

    comments = (
        db.query(CardInteraction)
        .filter(
            CardInteraction.praise_card_id == card_id,
            CardInteraction.interaction_type == InteractionType.COMMENT,
        )
        .order_by(CardInteraction.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return comments


@router.delete("/comment/{interaction_id}", status_code=204)
def delete_comment(interaction_id: str, db: Session = Depends(get_db)):
    """Delete a comment"""

    interaction = (
        db.query(CardInteraction)
        .filter(
            CardInteraction.id == interaction_id,
            CardInteraction.interaction_type == InteractionType.COMMENT,
        )
        .first()
    )

    if not interaction:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Get the card and decrement comment count
    card = db.query(PraiseCard).filter(
        PraiseCard.id == interaction.praise_card_id
    ).first()
    if card and card.comments_count > 0:
        card.comments_count -= 1

    db.delete(interaction)
    db.commit()

    return None


@router.get("/card/{card_id}/has-liked/{student_id}")
def has_student_liked(card_id: str, student_id: str, db: Session = Depends(get_db)):
    """Check if a student has liked a specific card"""

    like = (
        db.query(CardInteraction)
        .filter(
            CardInteraction.praise_card_id == card_id,
            CardInteraction.student_id == student_id,
            CardInteraction.interaction_type == InteractionType.LIKE,
        )
        .first()
    )

    return {"has_liked": like is not None}
