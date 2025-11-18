# MathFlow Backend

FastAPI 기반 MathFlow 백엔드 API

## 개발 서버 실행

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

http://localhost:8000/docs 에서 API 문서 확인

## 기술 스택

- FastAPI
- SQLAlchemy (async)
- PostgreSQL
- Redis
- Pydantic V2
- JWT Authentication

## 프로젝트 구조

```
backend/
├── app/
│   ├── main.py      # FastAPI 앱
│   ├── api/         # API 엔드포인트
│   ├── core/        # 설정
│   ├── models/      # DB 모델
│   └── schemas/     # Pydantic 스키마
└── tests/          # 테스트
```
