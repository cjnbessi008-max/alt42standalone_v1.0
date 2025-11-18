from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.database import FocusDataPoint
from app.models.schemas import FocusDataCreate
from datetime import datetime
from typing import List


class FocusService:
    @staticmethod
    async def save_focus_data(db: AsyncSession, focus_data: FocusDataCreate) -> FocusDataPoint:
        """집중도 데이터 저장"""
        focus_point = FocusDataPoint(
            session_id=focus_data.session_id,
            timestamp=datetime.fromtimestamp(focus_data.timestamp / 1000),
            score=focus_data.score,
            face_detected=focus_data.face_detected,
            gaze_score=focus_data.gaze_score,
            head_pose_score=focus_data.head_pose_score,
            movement_score=focus_data.movement_score,
            head_pose=focus_data.head_pose.dict() if focus_data.head_pose else None,
            gaze_direction=focus_data.gaze_direction.dict() if focus_data.gaze_direction else None,
        )

        db.add(focus_point)
        await db.commit()
        await db.refresh(focus_point)
        return focus_point

    @staticmethod
    async def save_focus_data_batch(
        db: AsyncSession, session_id: str, focus_data_list: List[FocusDataCreate]
    ) -> int:
        """집중도 데이터 일괄 저장"""
        focus_points = []
        for focus_data in focus_data_list:
            focus_point = FocusDataPoint(
                session_id=session_id,
                timestamp=datetime.fromtimestamp(focus_data.timestamp / 1000),
                score=focus_data.score,
                face_detected=focus_data.face_detected,
                gaze_score=focus_data.gaze_score,
                head_pose_score=focus_data.head_pose_score,
                movement_score=focus_data.movement_score,
                head_pose=focus_data.head_pose.dict() if focus_data.head_pose else None,
                gaze_direction=focus_data.gaze_direction.dict() if focus_data.gaze_direction else None,
            )
            focus_points.append(focus_point)

        db.add_all(focus_points)
        await db.commit()
        return len(focus_points)

    @staticmethod
    async def get_session_focus_data(
        db: AsyncSession, session_id: str, limit: int = None
    ) -> List[FocusDataPoint]:
        """세션별 집중도 데이터 조회"""
        stmt = (
            select(FocusDataPoint)
            .where(FocusDataPoint.session_id == session_id)
            .order_by(FocusDataPoint.timestamp)
        )

        if limit:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def calculate_session_stats(db: AsyncSession, session_id: str) -> dict:
        """세션 통계 계산"""
        # 전체 데이터 조회
        focus_data = await FocusService.get_session_focus_data(db, session_id)

        if not focus_data:
            return {
                "totalDuration": 0,
                "averageFocus": 0,
                "highFocusTime": 0,
                "mediumFocusTime": 0,
                "lowFocusTime": 0,
                "distractionCount": 0,
            }

        # 총 시간 (초)
        if len(focus_data) > 1:
            total_duration = (focus_data[-1].timestamp - focus_data[0].timestamp).total_seconds()
        else:
            total_duration = 0

        # 평균 집중도
        avg_focus = sum(d.score for d in focus_data) / len(focus_data)

        # 집중도 레벨별 시간 계산 (데이터 포인트 수로 근사)
        high_count = sum(1 for d in focus_data if d.score >= 70)
        medium_count = sum(1 for d in focus_data if 40 <= d.score < 70)
        low_count = sum(1 for d in focus_data if d.score < 40)

        interval = total_duration / len(focus_data) if len(focus_data) > 0 else 0
        high_time = int(high_count * interval)
        medium_time = int(medium_count * interval)
        low_time = int(low_count * interval)

        # 산만함 횟수 (연속 5개 이상 낮은 점수)
        distraction_count = 0
        consecutive_low = 0
        for d in focus_data:
            if d.score < 40:
                consecutive_low += 1
                if consecutive_low == 5:
                    distraction_count += 1
                    consecutive_low = 0
            else:
                consecutive_low = 0

        return {
            "totalDuration": int(total_duration),
            "averageFocus": round(avg_focus, 2),
            "highFocusTime": high_time,
            "mediumFocusTime": medium_time,
            "lowFocusTime": low_time,
            "distractionCount": distraction_count,
        }
