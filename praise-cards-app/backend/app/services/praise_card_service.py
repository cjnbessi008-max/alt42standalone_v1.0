from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

from ..models import PraiseCard, Achievement, Student
from .ai_message_generator import AIMessageGenerator
from .achievement_detector import AchievementDetector


class PraiseCardService:
    """Service for creating and managing praise cards"""

    def __init__(self, db: Session):
        self.db = db
        self.ai_generator = AIMessageGenerator()
        self.achievement_detector = AchievementDetector(db)

    def process_learning_session(
        self, student_id: str, learning_session_id: str
    ) -> List[PraiseCard]:
        """
        Process a completed learning session:
        1. Detect achievements
        2. Generate praise cards for new achievements
        Returns list of newly created praise cards
        """
        # Detect achievements
        achievements = self.achievement_detector.detect_achievements(
            student_id, learning_session_id
        )

        # Generate praise cards for each achievement
        praise_cards = []
        for achievement in achievements:
            # Save achievement to DB
            self.db.add(achievement)
            self.db.flush()  # Get the achievement ID

            # Create praise card
            card = self.create_praise_card(achievement)
            if card:
                praise_cards.append(card)

        self.db.commit()
        return praise_cards

    def create_praise_card(self, achievement: Achievement) -> Optional[PraiseCard]:
        """Create a praise card for an achievement"""

        # Check if card already exists
        existing = (
            self.db.query(PraiseCard)
            .filter(PraiseCard.achievement_id == achievement.id)
            .first()
        )

        if existing:
            return existing

        # Get student info
        student = (
            self.db.query(Student).filter(Student.id == achievement.student_id).first()
        )

        if not student:
            return None

        # Generate AI message
        ai_message = self.ai_generator.generate_praise_message(student, achievement)

        # Get card design
        card_design = self.ai_generator.get_card_design(achievement.achievement_type)

        # Create praise card
        praise_card = PraiseCard(
            student_id=student.id,
            achievement_id=achievement.id,
            title=achievement.title,
            ai_message=ai_message,
            card_design=card_design,
        )

        self.db.add(praise_card)

        # Mark achievement as having card generated
        achievement.is_card_generated = 1

        try:
            self.db.commit()
            self.db.refresh(praise_card)
            return praise_card
        except Exception as e:
            self.db.rollback()
            print(f"Error creating praise card: {e}")
            return None

    def get_student_feed(
        self, student_id: str, limit: int = 20, offset: int = 0
    ) -> List[PraiseCard]:
        """Get praise cards feed for a student"""

        cards = (
            self.db.query(PraiseCard)
            .filter(PraiseCard.student_id == student_id, PraiseCard.is_visible == 1)
            .order_by(PraiseCard.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        return cards

    def get_all_feed(self, limit: int = 50, offset: int = 0) -> List[PraiseCard]:
        """Get all praise cards (for teachers or public feed)"""

        cards = (
            self.db.query(PraiseCard)
            .filter(PraiseCard.is_visible == 1)
            .order_by(PraiseCard.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )

        return cards

    def increment_views(self, card_id: str) -> bool:
        """Increment view count for a card"""
        try:
            card = self.db.query(PraiseCard).filter(PraiseCard.id == card_id).first()
            if card:
                card.views_count += 1
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.db.rollback()
            print(f"Error incrementing views: {e}")
            return False
