from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import date, timedelta
import logging

from .database import init_db, SessionLocal
from .api import incidents, reports
from .services.report_generator import ReportGenerator

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="LMS Daily Incident Report API",
    description="LMS 일일 사고 흐름 리포트 자동 생성 시스템",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(incidents.router, prefix="/api", tags=["incidents"])
app.include_router(reports.router, prefix="/api", tags=["reports"])


# 스케줄러 설정
scheduler = BackgroundScheduler()


def generate_daily_report_job():
    """
    매일 자정에 실행되는 일일 리포트 생성 작업
    어제 날짜의 리포트를 생성
    """
    try:
        logger.info("Starting daily report generation job...")
        db = SessionLocal()
        yesterday = date.today() - timedelta(days=1)

        generator = ReportGenerator(db)
        report = generator.generate_report(yesterday)

        logger.info(
            f"Daily report generated successfully: "
            f"ID={report.id}, Date={report.report_date}, "
            f"Incidents={report.incidents_count}"
        )

        db.close()
    except Exception as e:
        logger.error(f"Error generating daily report: {str(e)}")


@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 실행"""
    logger.info("Initializing database...")
    init_db()
    logger.info("Database initialized successfully")

    # 스케줄러 시작 (매일 자정 실행)
    scheduler.add_job(
        generate_daily_report_job,
        trigger=CronTrigger(hour=0, minute=0),  # 매일 00:00
        id="daily_report_job",
        name="Generate daily report",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started: Daily report will be generated at 00:00")


@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 실행"""
    logger.info("Shutting down scheduler...")
    scheduler.shutdown()
    logger.info("Scheduler shut down successfully")


@app.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "message": "LMS Daily Incident Report API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "scheduler": scheduler.running
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
