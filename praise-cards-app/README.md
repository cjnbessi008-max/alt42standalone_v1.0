# ✨ 오늘 너 잘했어 - 칭찬 카드 시스템

AI가 자동으로 생성하는 SNS 스타일 칭찬 카드 웹앱입니다. 학생들의 학습 활동을 감지하고, Claude AI로 개인화된 격려 메시지를 만들어 카드로 보여줍니다.

## 🎯 주요 기능

### 1. 자동 성취 감지
- ✅ **높은 정확도** (80% 이상)
- 🔥 **연속 학습** (3일 이상)
- 🏆 **모듈 완료**
- ⏰ **일일 학습 시간** (30분 이상)
- 📈 **진도율 향상** (20% 이상)
- 💯 **만점** (100% 정확도)
- 🎉 **첫 모듈 완료**

### 2. AI 격려 메시지
- Claude API를 사용한 개인화된 메시지 생성
- 학생 이름, 성취 내용을 반영한 맞춤형 격려
- 따뜻하고 진심 어린 톤

### 3. SNS 스타일 피드
- Instagram/Facebook 스타일 카드 UI
- 좋아요, 댓글, 조회수 기능
- 실시간 피드 업데이트
- 무한 스크롤 지원

### 4. 다양한 카드 디자인
각 성취 유형마다 다른 그라데이션 테마:
- 🎯 정확도 (보라색)
- 🔥 연속 학습 (핑크)
- 🏆 트로피 (골드)
- ⏰ 학습 시간 (파스텔)
- 🚀 진도 향상 (오렌지-옐로우)
- ⭐ 만점 (스카이블루)

## 🛠 기술 스택

### Backend
- **FastAPI** - 고성능 Python 웹 프레임워크
- **SQLAlchemy** - ORM
- **PostgreSQL** - 데이터베이스
- **Redis** - 캐싱 및 세션 관리
- **Anthropic Claude API** - AI 메시지 생성
- **Pydantic** - 데이터 검증

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **Framer Motion** - 애니메이션
- **TanStack Query** - 데이터 패칭 및 캐싱
- **Axios** - HTTP 클라이언트
- **Lucide React** - 아이콘

### Infrastructure
- **Docker & Docker Compose** - 컨테이너화
- **PostgreSQL 15** - 데이터베이스
- **Redis 7** - 캐시

## 📦 설치 및 실행

### 사전 요구사항
- Docker & Docker Compose
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com/)에서 발급)

### 1. 저장소 클론
```bash
cd praise-cards-app
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열고 Anthropic API 키를 입력하세요:
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
```

### 3. Docker로 실행
```bash
docker-compose up -d
```

서비스가 시작되면:
- 🌐 Frontend: http://localhost:3000
- 🔧 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

### 4. 종료
```bash
docker-compose down
```

데이터까지 삭제하려면:
```bash
docker-compose down -v
```

## 📱 사용 방법

### 1. 학생 생성
```bash
curl -X POST http://localhost:8000/api/v1/students/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "김민수",
    "email": "minsu@example.com",
    "grade_level": 5
  }'
```

### 2. 학습 세션 기록 (자동으로 카드 생성)
```bash
curl -X POST http://localhost:8000/api/v1/learning-sessions/ \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student-uuid-here",
    "module_name": "수학 기초",
    "duration_minutes": 45,
    "questions_attempted": 20,
    "questions_correct": 17,
    "progress_percentage": 85.0
  }'
```

성취 조건을 만족하면 자동으로 칭찬 카드가 생성됩니다!

### 3. 웹앱에서 카드 확인
http://localhost:3000 에서 피드를 확인하세요.

## 🏗 프로젝트 구조

```
praise-cards-app/
├── backend/
│   ├── app/
│   │   ├── models/          # 데이터베이스 모델
│   │   │   ├── student.py
│   │   │   ├── achievement.py
│   │   │   ├── praise_card.py
│   │   │   ├── learning_session.py
│   │   │   └── card_interaction.py
│   │   ├── api/             # API 엔드포인트
│   │   │   ├── students.py
│   │   │   ├── learning_sessions.py
│   │   │   ├── praise_cards.py
│   │   │   └── interactions.py
│   │   ├── services/        # 비즈니스 로직
│   │   │   ├── achievement_detector.py
│   │   │   ├── ai_message_generator.py
│   │   │   └── praise_card_service.py
│   │   ├── schemas/         # Pydantic 스키마
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── PraiseCard.tsx
│   │   │   ├── Feed.tsx
│   │   │   └── *.css
│   │   ├── pages/           # 페이지
│   │   │   └── HomePage.tsx
│   │   ├── services/        # API 클라이언트
│   │   │   └── api.ts
│   │   ├── types/           # TypeScript 타입
│   │   ├── styles/          # 글로벌 스타일
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## 🎨 성취 기준 커스터마이징

`backend/app/config.py`에서 성취 기준을 조정할 수 있습니다:

```python
class Settings(BaseSettings):
    # Achievement thresholds
    HIGH_ACCURACY_THRESHOLD: int = 80  # 80%
    CONSECUTIVE_DAYS_THRESHOLD: int = 3
    DAILY_LEARNING_TIME_THRESHOLD: int = 30  # minutes
    PROGRESS_BOOST_THRESHOLD: int = 20  # 20%
```

## 📊 API 엔드포인트

### Students
- `POST /api/v1/students/` - 학생 생성
- `GET /api/v1/students/{id}` - 학생 조회
- `GET /api/v1/students/` - 학생 목록
- `PATCH /api/v1/students/{id}` - 학생 수정

### Learning Sessions
- `POST /api/v1/learning-sessions/` - 학습 세션 생성 (자동 카드 생성)
- `GET /api/v1/learning-sessions/{id}` - 세션 조회
- `GET /api/v1/learning-sessions/student/{id}` - 학생별 세션 목록

### Praise Cards
- `GET /api/v1/praise-cards/feed` - 피드 조회
- `GET /api/v1/praise-cards/{id}` - 카드 조회
- `GET /api/v1/praise-cards/student/{id}/latest` - 최신 카드
- `GET /api/v1/praise-cards/student/{id}/stats` - 통계

### Interactions
- `POST /api/v1/interactions/like` - 좋아요
- `DELETE /api/v1/interactions/like/{card_id}/{student_id}` - 좋아요 취소
- `POST /api/v1/interactions/comment` - 댓글 작성
- `GET /api/v1/interactions/card/{id}/comments` - 댓글 목록

## 🔧 개발 모드

### Backend 개발
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend 개발
```bash
cd frontend
npm install
npm run dev
```

## 🚀 배포

프로덕션 배포 시:

1. `.env` 파일에서 `DEBUG=false` 설정
2. `SECRET_KEY` 변경
3. HTTPS 설정
4. 도메인에 맞게 CORS 설정 조정
5. 데이터베이스 백업 설정

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

## 📄 라이선스

MIT License

## 💡 향후 개선 사항

- [ ] 실시간 알림 (WebSocket)
- [ ] 선생님 대시보드
- [ ] 배지 및 레벨 시스템
- [ ] 카드 공유 기능
- [ ] 다국어 지원
- [ ] 모바일 앱
- [ ] 성취 통계 그래프
- [ ] 학급별 리더보드

## 📧 문의

질문이나 제안사항이 있으시면 이슈를 열어주세요!

---

Made with ❤️ and Claude AI
