from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.database import Session, FocusDataPoint, Student
from app.models.schemas import SessionCreate, FocusDataCreate
from datetime import datetime, timedelta
from typing import Optional, List


class SessionService:
    @staticmethod
    async def create_session(db: AsyncSession, session_data: SessionCreate) -> Session:
        """새 세션 생성"""
        session = Session(
            student_name=session_data.student_name,
            start_time=datetime.utcnow(),
            status="active",
        )
        db.add(session)

        # 학생 정보 업데이트 또는 생성
        stmt = select(Student).where(Student.name == session_data.student_name)
        result = await db.execute(stmt)
        student = result.scalar_one_or_none()

        if student:
            student.total_session_count += 1
            student.last_session_date = datetime.utcnow()
        else:
            student = Student(
                name=session_data.student_name,
                total_session_count=1,
                last_session_date=datetime.utcnow(),
            )
            db.add(student)

        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_session(db: AsyncSession, session_id: str) -> Optional[Session]:
        """세션 조회"""
        stmt = select(Session).where(Session.id == session_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def end_session(db: AsyncSession, session_id: str) -> Optional[Session]:
        """세션 종료"""
        session = await SessionService.get_session(db, session_id)
        if not session:
            return None

        session.end_time = datetime.utcnow()
        session.status = "completed"

        # 세션 시간 계산
        if session.start_time:
            duration = (session.end_time - session.start_time).total_seconds()
            session.duration = int(duration)

        # 평균 집중도 계산
        stmt = select(func.avg(FocusDataPoint.score)).where(
            FocusDataPoint.session_id == session_id
        )
        result = await db.execute(stmt)
        avg_focus = result.scalar() or 0.0
        session.average_focus = float(avg_focus)

        # 학생 통계 업데이트
        stmt = select(Student).where(Student.name == session.student_name)
        result = await db.execute(stmt)
        student = result.scalar_one_or_none()

        if student:
            # 전체 세션의 평균 집중도 재계산
            stmt = select(func.avg(Session.average_focus)).where(
                Session.student_name == student.name,
                Session.status == "completed"
            )
            result = await db.execute(stmt)
            student.average_focus_score = float(result.scalar() or 0.0)

        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def pause_session(db: AsyncSession, session_id: str) -> Optional[Session]:
        """세션 일시정지"""
        session = await SessionService.get_session(db, session_id)
        if not session:
            return None

        session.status = "paused"
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def resume_session(db: AsyncSession, session_id: str) -> Optional[Session]:
        """세션 재개"""
        session = await SessionService.get_session(db, session_id)
        if not session:
            return None

        session.status = "active"
        await db.commit()
        await db.refresh(session)
        return session

    @staticmethod
    async def get_all_sessions(
        db: AsyncSession, limit: Optional[int] = None, status: Optional[str] = None
    ) -> List[Session]:
        """모든 세션 조회"""
        stmt = select(Session).order_by(Session.start_time.desc())

        if status:
            stmt = stmt.where(Session.status == status)

        if limit:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def get_student_sessions(
        db: AsyncSession, student_name: str, limit: Optional[int] = None
    ) -> List[Session]:
        """학생별 세션 조회"""
        stmt = (
            select(Session)
            .where(Session.student_name == student_name)
            .order_by(Session.start_time.desc())
        )

        if limit:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()
