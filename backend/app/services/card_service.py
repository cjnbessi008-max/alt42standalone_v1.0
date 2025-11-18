"""
루틴 카드 생성 및 관리 서비스
"""
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from loguru import logger

from ..models.routine_card import RoutineCard
from ..models.student import Student
from ..models.learning_progress import LearningProgress
from ..models.card_activity import CardActivity
from ..schemas.routine_card import RoutineCardCreate
from .ai_service import AIService


class CardService:
    """루틴 카드 서비스"""

    def __init__(self):
        self.ai_service = AIService()

    def generate_card_for_student(
        self,
        db: Session,
        student_id: UUID,
        card_date: Optional[date] = None,
        force_regenerate: bool = False
    ) -> RoutineCard:
        """
        학생을 위한 루틴 카드 생성

        Args:
            db: 데이터베이스 세션
            student_id: 학생 ID
            card_date: 카드 날짜 (기본값: 오늘)
            force_regenerate: 기존 카드가 있어도 재생성 여부

        Returns:
            생성된 루틴 카드
        """
        if card_date is None:
            card_date = date.today()

        # 학생 정보 조회
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"학생을 찾을 수 없습니다: {student_id}")

        # 기존 카드 확인
        existing_card = db.query(RoutineCard).filter(
            and_(
                RoutineCard.student_id == student_id,
                RoutineCard.card_date == card_date
            )
        ).first()

        if existing_card and not force_regenerate:
            logger.info(f"기존 카드 반환 - 학생: {student.name}, 날짜: {card_date}")
            return existing_card

        # 학습 진행 데이터 조회
        learning_progress = self._get_recent_learning_progress(db, student_id)

        # AI로 카드 생성
        logger.info(f"새 카드 생성 시작 - 학생: {student.name}, 날짜: {card_date}")

        card_data = self.ai_service.generate_routine_card(
            student_name=student.name,
            grade_level=student.grade_level or "미지정",
            learning_progress=learning_progress,
            card_date=card_date
        )

        # 기존 카드 삭제 (재생성인 경우)
        if existing_card:
            db.delete(existing_card)
            db.commit()

        # 새 카드 생성
        new_card = RoutineCard(
            student_id=student_id,
            card_date=card_date,
            title=card_data['title'],
            learning_goals=card_data.get('learning_goals', []),
            recommended_activities=card_data.get('recommended_activities', []),
            progress_summary=card_data.get('progress_summary', {}),
            motivation_message=card_data.get('motivation_message', ''),
            next_steps=card_data.get('next_steps', []),
            ai_metadata={
                'model': self.ai_service.model,
                'generated_at': datetime.now().isoformat(),
                'learning_records_used': len(learning_progress)
            },
            status='active'
        )

        db.add(new_card)
        db.commit()
        db.refresh(new_card)

        logger.info(f"카드 생성 완료 - ID: {new_card.id}")

        return new_card

    def _get_recent_learning_progress(
        self,
        db: Session,
        student_id: UUID,
        limit: int = 10
    ) -> List[dict]:
        """최근 학습 진행 데이터 조회"""
        progress_records = db.query(LearningProgress).filter(
            LearningProgress.student_id == student_id
        ).order_by(
            LearningProgress.updated_at.desc()
        ).limit(limit).all()

        return [
            {
                'subject': record.subject,
                'topic': record.topic,
                'completion_rate': float(record.completion_rate) if record.completion_rate else 0,
                'score': float(record.score) if record.score else 0,
                'time_spent_minutes': record.time_spent_minutes,
                'last_activity_at': record.last_activity_at.isoformat() if record.last_activity_at else None
            }
            for record in progress_records
        ]

    def get_today_card(self, db: Session, student_id: UUID) -> Optional[RoutineCard]:
        """오늘의 카드 조회"""
        return db.query(RoutineCard).filter(
            and_(
                RoutineCard.student_id == student_id,
                RoutineCard.card_date == date.today()
            )
        ).first()

    def get_student_cards(
        self,
        db: Session,
        student_id: UUID,
        limit: int = 30
    ) -> List[RoutineCard]:
        """학생의 카드 목록 조회"""
        return db.query(RoutineCard).filter(
            RoutineCard.student_id == student_id
        ).order_by(
            RoutineCard.card_date.desc()
        ).limit(limit).all()

    def mark_card_viewed(self, db: Session, card_id: UUID) -> RoutineCard:
        """카드 조회 표시"""
        card = db.query(RoutineCard).filter(RoutineCard.id == card_id).first()
        if not card:
            raise ValueError(f"카드를 찾을 수 없습니다: {card_id}")

        if not card.viewed_at:
            card.viewed_at = datetime.now()
            db.commit()
            db.refresh(card)

            # 활동 로그
            activity = CardActivity(
                card_id=card_id,
                student_id=card.student_id,
                activity_type='viewed',
                activity_data={}
            )
            db.add(activity)
            db.commit()

        return card

    def mark_card_completed(self, db: Session, card_id: UUID) -> RoutineCard:
        """카드 완료 표시"""
        card = db.query(RoutineCard).filter(RoutineCard.id == card_id).first()
        if not card:
            raise ValueError(f"카드를 찾을 수 없습니다: {card_id}")

        card.status = 'completed'
        card.completed_at = datetime.now()
        db.commit()
        db.refresh(card)

        # 활동 로그
        activity = CardActivity(
            card_id=card_id,
            student_id=card.student_id,
            activity_type='completed',
            activity_data={}
        )
        db.add(activity)
        db.commit()

        return card

    def generate_cards_for_all_students(self, db: Session) -> dict:
        """모든 학생을 위한 카드 일괄 생성"""
        students = db.query(Student).all()
        results = {
            'total': len(students),
            'success': 0,
            'failed': 0,
            'errors': []
        }

        for student in students:
            try:
                self.generate_card_for_student(
                    db=db,
                    student_id=student.id,
                    card_date=date.today(),
                    force_regenerate=False
                )
                results['success'] += 1
            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'student_id': str(student.id),
                    'student_name': student.name,
                    'error': str(e)
                })
                logger.error(f"카드 생성 실패 - 학생: {student.name}, 오류: {str(e)}")

        logger.info(f"일괄 생성 완료 - 성공: {results['success']}, 실패: {results['failed']}")
        return results
