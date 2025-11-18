# LMS 연동 감정 패턴 감지 시스템

AI 기반 학습자 감정 패턴 감지 시스템으로, LMS(Learning Management System)와 연동하여 웹앱에서 학습자의 감정 상태를 실시간으로 분석합니다.

## 주요 기능

### 감정 감지
- **좌절 (Frustration)**: 반복된 오류, 급격한 클릭, 높은 마우스 속도 감지
- **집중 (Concentration)**: 안정적인 상호작용, 높은 정확도, 적절한 타이밍
- **답답함 (Confusion)**: 주저함, 역추적, 느린 응답 시간

### LMS 연동
- Canvas LMS, Moodle, Blackboard 지원
- 커스텀 웹훅 연동
- 실시간 감정 알림 전송
- 개입 권장사항 제공

### 행동 추적
- 클릭 패턴 분석
- 키보드 입력 속도 측정
- 마우스 움직임 추적
- 스크롤 행동 분석

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React + TypeScript)           │
│  - BehaviorTracker: 학습자 행동 자동 추적                 │
│  - EmotionDashboard: 실시간 감정 상태 시각화              │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│              Backend (FastAPI + Python)                  │
│  - EmotionAnalyzer: 행동 패턴 → 감정 분석                │
│  - LMSConnector: LMS 플랫폼과 통신                        │
└───────┬──────────────────────┬──────────────────────────┘
        │                      │
┌───────▼───────┐      ┌───────▼────────┐
│  PostgreSQL   │      │  LMS Platform  │
│  (행동/감정 데이터)│      │  (알림 전송)    │
└───────────────┘      └────────────────┘
```

## 기술 스택

### Backend
- **FastAPI**: 고성능 비동기 웹 프레임워크
- **Python 3.11+**: 메인 프로그래밍 언어
- **PostgreSQL**: 관계형 데이터베이스
- **SQLAlchemy**: ORM
- **Redis**: 캐싱 및 세션 관리
- **Anthropic Claude** (선택): AI 기반 감정 분석 강화

### Frontend
- **React 18**: UI 프레임워크
- **TypeScript**: 타입 안전성
- **Material-UI**: UI 컴포넌트 라이브러리
- **Recharts**: 데이터 시각화
- **Vite**: 빌드 도구

### DevOps
- **Docker & Docker Compose**: 컨테이너화
- **uvicorn**: ASGI 서버

## 빠른 시작

### 사전 요구사항
- Docker & Docker Compose
- Node.js 18+ (로컬 개발시)
- Python 3.11+ (로컬 개발시)

### Docker로 실행 (권장)

1. 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값 설정
```

3. Docker Compose로 실행
```bash
docker-compose up -d
```

4. 서비스 접속
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/api/docs
- Frontend: http://localhost:3000

### 로컬 개발 환경 설정

#### Backend

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp ../.env.example .env

# 서버 실행
python main.py
```

#### Frontend

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
echo "VITE_API_URL=http://localhost:8000" > .env

# 개발 서버 실행
npm run dev
```

## 사용 방법

### 1. 프론트엔드에서 행동 추적 활성화

```tsx
import { BehaviorTracker } from './components/BehaviorTracker';

function LearningModule() {
  return (
    <BehaviorTracker
      studentId="student-uuid"
      sessionId="session-uuid"
      moduleId="module-uuid"
      enabled={true}
    >
      {/* 학습 콘텐츠 */}
      <YourLearningContent />
    </BehaviorTracker>
  );
}
```

### 2. 감정 대시보드 표시

```tsx
import { EmotionDashboard } from './components/EmotionDashboard';

function TeacherView() {
  return (
    <EmotionDashboard
      studentId="student-uuid"
      sessionId="session-uuid"
      refreshInterval={10000}
    />
  );
}
```

### 3. LMS 연동 설정

```bash
curl -X POST http://localhost:8000/api/emotions/lms/configure \
  -H "Content-Type: application/json" \
  -d '{
    "lms_type": "canvas",
    "lms_url": "https://your-canvas-url.com",
    "api_key": "your-api-key",
    "webhook_url": "https://your-webhook-url.com",
    "course_id": "course-123",
    "send_alerts": true,
    "alert_threshold": 0.7
  }'
```

## API 엔드포인트

### 행동 추적
- `POST /api/emotions/behavior-events` - 행동 이벤트 추적
- `POST /api/emotions/analyze` - 감정 분석 요청
- `GET /api/emotions/dashboard/{session_id}` - 대시보드 데이터 조회
- `GET /api/emotions/patterns/{student_id}` - 감정 패턴 조회

### LMS 연동
- `POST /api/emotions/lms/configure` - LMS 연동 설정

### 시스템
- `GET /api/emotions/health` - 헬스 체크

자세한 API 문서는 http://localhost:8000/api/docs 에서 확인하세요.

## 감정 감지 알고리즘

### 좌절 (Frustration) 감지 기준
- 2초 이내 5회 이상 빠른 클릭
- 초당 500픽셀 이상 높은 마우스 속도
- 3회 이상 연속 오답
- 분당 200자 이상 빠른 키입력

### 집중 (Concentration) 감지 기준
- 이벤트 간 2~10초의 안정적인 간격
- 70% 이상의 정답률
- 낮은 역추적 비율 (10% 미만)
- 적은 주저 횟수

### 답답함 (Confusion) 감지 기준
- 30초 이상의 느린 응답
- 30% 이상의 높은 역추적 비율
- 잦은 주저 (3회 이상)
- 30초 이상의 긴 중단

## 환경 변수

주요 환경 변수 설정:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/emotion_detection

# AI Analysis (선택사항)
ANTHROPIC_API_KEY=your_claude_api_key
USE_AI_ANALYSIS=false

# LMS Integration
LMS_TYPE=canvas
LMS_URL=https://your-lms-url.com
LMS_API_KEY=your_api_key
LMS_WEBHOOK_URL=https://your-webhook-url.com

# Thresholds
EMOTION_ALERT_THRESHOLD=0.7
INTERVENTION_THRESHOLD=0.8
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── api/
│   │   └── emotion_routes.py      # API 라우트
│   ├── models/
│   │   ├── behavior.py            # 행동 이벤트 모델
│   │   └── emotion.py             # 감정 상태 모델
│   ├── services/
│   │   ├── emotion_analyzer.py    # 감정 분석 엔진
│   │   └── lms_connector.py       # LMS 연동
│   ├── schemas/
│   │   └── emotion_schemas.py     # Pydantic 스키마
│   ├── main.py                    # FastAPI 애플리케이션
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BehaviorTracker.tsx    # 행동 추적
│   │   │   └── EmotionDashboard.tsx   # 감정 대시보드
│   │   ├── hooks/
│   │   │   └── useBehaviorTracker.ts  # 행동 추적 훅
│   │   ├── services/
│   │   │   └── emotionApi.ts          # API 클라이언트
│   │   └── types/
│   │       └── emotion.ts             # 타입 정의
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## 보안 고려사항

1. **데이터 암호화**: 모든 민감 데이터는 전송 중(TLS 1.3) 및 저장 시(AES-256) 암호화
2. **인증/인가**: JWT 토큰 기반 인증
3. **속도 제한**: API 속도 제한 적용
4. **입력 검증**: 모든 사용자 입력 검증
5. **CORS 정책**: 승인된 도메인만 허용

## 기여하기

기여를 환영합니다! 이슈를 열거나 Pull Request를 제출해주세요.

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 문의

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

---

**개발**: KAIST Touch Math Academy
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
