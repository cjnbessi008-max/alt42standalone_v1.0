"""
LMS Integration API for Emotion Data Collection
LMS와 연동하여 감정 데이터를 수집하는 API

이 모듈은 다양한 LMS 플랫폼 (Canvas, Moodle, 사용자 정의 LMS)과
연동하여 학생의 학습 활동 중 감정 데이터를 수집하고 저장합니다.
"""

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
import json
import logging

# 외부 라이브러리 (requirements.txt에 추가 필요)
# import asyncpg  # PostgreSQL async driver
# from fastapi import FastAPI, HTTPException, Depends
# from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmotionType(str, Enum):
    """감정 유형 Enum"""
    HAPPY = "happy"
    EXCITED = "excited"
    NEUTRAL = "neutral"
    CONFUSED = "confused"
    FRUSTRATED = "frustrated"
    ANXIOUS = "anxious"
    BORED = "bored"
    ENGAGED = "engaged"


class EmotionDataPoint:
    """감정 데이터 포인트 모델"""
    def __init__(
        self,
        student_id: str,
        module_id: str,
        session_id: str,
        emotion_type: EmotionType,
        emotion_intensity: int,
        context: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ):
        self.id = str(uuid.uuid4())
        self.student_id = student_id
        self.module_id = module_id
        self.session_id = session_id
        self.emotion_type = emotion_type
        self.emotion_intensity = emotion_intensity
        self.context = context or {}
        self.timestamp = timestamp or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "student_id": self.student_id,
            "module_id": self.module_id,
            "session_id": self.session_id,
            "emotion_type": self.emotion_type.value,
            "emotion_intensity": self.emotion_intensity,
            "context": self.context,
            "timestamp": self.timestamp.isoformat()
        }


class LMSEmotionCollector:
    """LMS와 연동하여 감정 데이터를 수집하는 클래스"""

    def __init__(self, db_connection_string: str):
        self.db_connection_string = db_connection_string
        self.db_pool = None
        logger.info("LMS Emotion Collector initialized")

    async def initialize(self):
        """데이터베이스 연결 초기화"""
        # asyncpg를 사용한 연결 풀 생성
        # self.db_pool = await asyncpg.create_pool(self.db_connection_string)
        logger.info("Database connection pool created")

    async def close(self):
        """리소스 정리"""
        if self.db_pool:
            # await self.db_pool.close()
            logger.info("Database connection pool closed")

    async def collect_emotion_data(
        self,
        student_id: str,
        module_id: str,
        session_id: str,
        emotion_type: EmotionType,
        emotion_intensity: int,
        context: Optional[Dict[str, Any]] = None
    ) -> EmotionDataPoint:
        """
        LMS로부터 감정 데이터를 수집하고 저장

        Args:
            student_id: 학생 ID
            module_id: 모듈 ID
            session_id: 세션 ID
            emotion_type: 감정 유형
            emotion_intensity: 감정 강도 (1-10)
            context: 추가 컨텍스트 정보

        Returns:
            EmotionDataPoint: 저장된 감정 데이터 포인트
        """
        # 감정 강도 검증
        if not 1 <= emotion_intensity <= 10:
            raise ValueError("Emotion intensity must be between 1 and 10")

        # 감정 데이터 포인트 생성
        emotion_data = EmotionDataPoint(
            student_id=student_id,
            module_id=module_id,
            session_id=session_id,
            emotion_type=emotion_type,
            emotion_intensity=emotion_intensity,
            context=context
        )

        # 데이터베이스에 저장
        await self._save_emotion_data(emotion_data)

        # 감정 변화 감지 및 기록
        await self._detect_emotion_change(emotion_data)

        logger.info(
            f"Emotion data collected: student={student_id}, "
            f"emotion={emotion_type.value}, intensity={emotion_intensity}"
        )

        return emotion_data

    async def _save_emotion_data(self, emotion_data: EmotionDataPoint):
        """감정 데이터를 데이터베이스에 저장"""
        query = """
            INSERT INTO emotion_logs (
                id, student_id, module_id, session_id,
                emotion_type, emotion_intensity, timestamp, context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """

        # async with self.db_pool.acquire() as conn:
        #     await conn.execute(
        #         query,
        #         emotion_data.id,
        #         emotion_data.student_id,
        #         emotion_data.module_id,
        #         emotion_data.session_id,
        #         emotion_data.emotion_type.value,
        #         emotion_data.emotion_intensity,
        #         emotion_data.timestamp,
        #         json.dumps(emotion_data.context)
        #     )

        logger.debug(f"Emotion data saved to database: {emotion_data.id}")

    async def _detect_emotion_change(self, current_emotion: EmotionDataPoint):
        """
        급격한 감정 변화를 감지하고 기록

        감정 강도가 3 이상 변화하거나, 정반대 감정으로 바뀐 경우 이벤트 기록
        """
        # 이전 감정 데이터 조회
        query = """
            SELECT emotion_type, emotion_intensity
            FROM emotion_logs
            WHERE student_id = $1 AND session_id = $2
            ORDER BY timestamp DESC
            LIMIT 1 OFFSET 1
        """

        # async with self.db_pool.acquire() as conn:
        #     previous = await conn.fetchrow(
        #         query,
        #         current_emotion.student_id,
        #         current_emotion.session_id
        #     )

        # 예시 데이터 (실제로는 DB에서 조회)
        previous = None

        if previous:
            prev_emotion_type = previous['emotion_type']
            prev_intensity = previous['emotion_intensity']
            intensity_delta = abs(current_emotion.emotion_intensity - prev_intensity)

            # 감정 변화 임계값 체크
            if intensity_delta >= 3 or self._is_opposite_emotion(
                prev_emotion_type, current_emotion.emotion_type.value
            ):
                await self._record_emotion_change_event(
                    current_emotion,
                    prev_emotion_type,
                    intensity_delta
                )

    def _is_opposite_emotion(self, emotion1: str, emotion2: str) -> bool:
        """두 감정이 정반대인지 확인"""
        opposite_pairs = [
            {"happy", "frustrated"},
            {"excited", "bored"},
            {"engaged", "anxious"}
        ]

        for pair in opposite_pairs:
            if {emotion1, emotion2} == pair:
                return True
        return False

    async def _record_emotion_change_event(
        self,
        current_emotion: EmotionDataPoint,
        from_emotion: str,
        intensity_delta: int
    ):
        """감정 변화 이벤트 기록"""
        query = """
            INSERT INTO emotion_change_events (
                student_id, module_id, session_id,
                from_emotion, to_emotion, intensity_delta,
                timestamp, trigger_context
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """

        # async with self.db_pool.acquire() as conn:
        #     await conn.execute(
        #         query,
        #         current_emotion.student_id,
        #         current_emotion.module_id,
        #         current_emotion.session_id,
        #         from_emotion,
        #         current_emotion.emotion_type.value,
        #         intensity_delta,
        #         current_emotion.timestamp,
        #         json.dumps(current_emotion.context)
        #     )

        logger.info(
            f"Emotion change event recorded: {from_emotion} -> "
            f"{current_emotion.emotion_type.value} (Δ={intensity_delta})"
        )

    async def batch_collect_emotions(
        self,
        emotion_data_list: List[EmotionDataPoint]
    ) -> int:
        """
        여러 감정 데이터를 배치로 수집

        Args:
            emotion_data_list: 감정 데이터 포인트 리스트

        Returns:
            int: 성공적으로 저장된 데이터 개수
        """
        success_count = 0

        for emotion_data in emotion_data_list:
            try:
                await self._save_emotion_data(emotion_data)
                success_count += 1
            except Exception as e:
                logger.error(f"Failed to save emotion data: {e}")

        logger.info(f"Batch emotion data collected: {success_count}/{len(emotion_data_list)}")
        return success_count


class LMSWebhookHandler:
    """LMS 웹훅을 처리하는 클래스"""

    def __init__(self, emotion_collector: LMSEmotionCollector):
        self.emotion_collector = emotion_collector

    async def handle_learning_activity_webhook(
        self,
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        LMS로부터 받은 학습 활동 웹훅 처리

        Args:
            webhook_data: 웹훅 데이터
                {
                    "student_id": "uuid",
                    "module_id": "uuid",
                    "session_id": "uuid",
                    "activity_type": "problem_solving",
                    "result": "correct" | "incorrect",
                    "time_spent": 45,
                    "timestamp": "2025-11-18T10:30:00Z"
                }

        Returns:
            Dict: 처리 결과
        """
        try:
            # 학습 활동 결과로부터 감정 추론
            inferred_emotion = self._infer_emotion_from_activity(webhook_data)

            # 감정 데이터 수집
            emotion_data = await self.emotion_collector.collect_emotion_data(
                student_id=webhook_data["student_id"],
                module_id=webhook_data["module_id"],
                session_id=webhook_data["session_id"],
                emotion_type=inferred_emotion["emotion_type"],
                emotion_intensity=inferred_emotion["intensity"],
                context={
                    "activity_type": webhook_data.get("activity_type"),
                    "result": webhook_data.get("result"),
                    "time_spent": webhook_data.get("time_spent")
                }
            )

            return {
                "status": "success",
                "emotion_data_id": emotion_data.id,
                "message": "Emotion data collected from webhook"
            }

        except Exception as e:
            logger.error(f"Webhook processing failed: {e}")
            return {
                "status": "error",
                "message": str(e)
            }

    def _infer_emotion_from_activity(
        self,
        activity_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        학습 활동 데이터로부터 감정 추론

        간단한 규칙 기반 추론 (실제로는 ML 모델 사용 가능)
        """
        result = activity_data.get("result")
        time_spent = activity_data.get("time_spent", 0)

        # 기본값
        emotion_type = EmotionType.NEUTRAL
        intensity = 5

        # 결과 기반 감정 추론
        if result == "correct":
            if time_spent < 30:
                emotion_type = EmotionType.EXCITED
                intensity = 8
            else:
                emotion_type = EmotionType.HAPPY
                intensity = 7
        elif result == "incorrect":
            if time_spent > 120:
                emotion_type = EmotionType.FRUSTRATED
                intensity = 7
            else:
                emotion_type = EmotionType.CONFUSED
                intensity = 6

        # 시간 기반 조정 (너무 오래 걸린 경우)
        if time_spent > 180:
            emotion_type = EmotionType.BORED
            intensity = 8

        return {
            "emotion_type": emotion_type,
            "intensity": intensity,
            "confidence": 0.7  # 추론 신뢰도
        }


# FastAPI 엔드포인트 예시 (실제 구현시 사용)
"""
app = FastAPI(title="LMS Emotion Integration API")
emotion_collector = LMSEmotionCollector(db_connection_string="postgresql://...")
webhook_handler = LMSWebhookHandler(emotion_collector)

@app.on_event("startup")
async def startup():
    await emotion_collector.initialize()

@app.on_event("shutdown")
async def shutdown():
    await emotion_collector.close()

@app.post("/api/lms/webhook/learning-activity")
async def receive_learning_activity_webhook(webhook_data: Dict[str, Any]):
    result = await webhook_handler.handle_learning_activity_webhook(webhook_data)
    return result

@app.post("/api/emotions/collect")
async def collect_emotion(
    student_id: str,
    module_id: str,
    session_id: str,
    emotion_type: EmotionType,
    emotion_intensity: int,
    context: Optional[Dict[str, Any]] = None
):
    emotion_data = await emotion_collector.collect_emotion_data(
        student_id=student_id,
        module_id=module_id,
        session_id=session_id,
        emotion_type=emotion_type,
        emotion_intensity=emotion_intensity,
        context=context
    )
    return emotion_data.to_dict()
"""
