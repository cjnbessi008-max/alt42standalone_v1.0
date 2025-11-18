"""
일일 카드 자동 생성 스케줄러
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
from loguru import logger

from ..core.config import settings
from ..core.database import SessionLocal
from .card_service import CardService


class CardScheduler:
    """루틴 카드 자동 생성 스케줄러"""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.card_service = CardService()

    def start(self):
        """스케줄러 시작"""
        if not settings.ENABLE_AUTO_GENERATION:
            logger.info("자동 생성이 비활성화되어 있습니다")
            return

        # 일일 카드 생성 작업 등록
        generation_time = settings.CARD_GENERATION_TIME.split(":")
        hour = int(generation_time[0])
        minute = int(generation_time[1])

        self.scheduler.add_job(
            func=self.generate_daily_cards,
            trigger=CronTrigger(hour=hour, minute=minute),
            id='daily_card_generation',
            name='일일 루틴 카드 자동 생성',
            replace_existing=True
        )

        self.scheduler.start()
        logger.info(f"스케줄러 시작 - 매일 {hour:02d}:{minute:02d}에 카드 생성")

    def stop(self):
        """스케줄러 중지"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("스케줄러 중지")

    def generate_daily_cards(self):
        """일일 카드 생성 작업"""
        logger.info(f"일일 카드 자동 생성 시작 - {datetime.now()}")

        db = SessionLocal()
        try:
            results = self.card_service.generate_cards_for_all_students(db)
            logger.info(
                f"일일 카드 생성 완료 - "
                f"성공: {results['success']}, 실패: {results['failed']}"
            )
        except Exception as e:
            logger.error(f"일일 카드 생성 실패: {str(e)}")
        finally:
            db.close()


# 글로벌 스케줄러 인스턴스
card_scheduler = CardScheduler()
