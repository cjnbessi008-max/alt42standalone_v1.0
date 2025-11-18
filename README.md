# 메타인지 미러링 시스템 (Metacognitive Mirroring System)

LMS와 연동하여 학습자의 문제 풀이 단계마다 "내가 지금 뭘 하고 있는지" 자동으로 요약해주는 AI 기반 메타인지 학습 지원 시스템입니다.

## 주요 기능

### 🧠 실시간 메타인지 요약
- **AI 기반 분석**: Claude AI가 학습자의 행동을 실시간으로 분석
- **자연어 요약**: 각 단계마다 "지금 무엇을 하고 있는지" 한국어로 자동 요약
- **격려 메시지**: 학습자를 격려하고 긍정적인 피드백 제공

### 📊 학습 과정 시각화
- **단계별 추적**: 문제 읽기 → 분석 → 전략 수립 → 실행 → 검증 → 반성
- **타임라인 뷰**: 각 단계에 소요된 시간과 진행 상황 시각화
- **진행률 표시**: 실시간 학습 진행률 확인

### 🎯 인지 전략 식별
- **자동 전략 인식**: 사용한 문제 해결 전략 자동 식별
- **전략 분류**: 문제 분석, 시각화, 단계별 계획, 검증, 자기 수정 등
- **메타인지 능력 향상**: 자신의 사고 과정을 인식하고 개선

### 🔗 LMS 연동
- **LTI 1.3 지원**: 표준 LMS와 쉽게 연동
- **xAPI 통합**: 학습 데이터를 LMS로 전송
- **학습 분석**: LMS에서 학습 과정 데이터 활용 가능

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)           │
│  - Metacognitive Mirror UI                          │
│  - Real-time WebSocket                              │
│  - Material-UI Components                           │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│           API Gateway (Node.js + Express)           │
│  - REST API                                         │
│  - WebSocket (Socket.io)                            │
│  - Authentication & Rate Limiting                   │
└────────┬───────────────────────┬────────────────────┘
         │                       │
┌────────▼──────────┐   ┌────────▼────────────┐
│  AI Service       │   │  PostgreSQL         │
│  (Python FastAPI) │   │  - Learning Data    │
│  - Claude API     │   │  - Summaries        │
│  - Step Detection │   │  - LMS Integration  │
│  - Caching        │   └─────────────────────┘
└───────────────────┘
         │
┌────────▼──────────┐
│     Redis         │
│  - Session Cache  │
│  - Real-time Pub  │
└───────────────────┘
```

## 빠른 시작

### 필수 요구사항

- Docker & Docker Compose
- Anthropic API Key (Claude AI 사용)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **환경 변수 설정**
```bash
# 루트 디렉토리에 .env 파일 생성
cp .env.example .env

# ANTHROPIC_API_KEY 설정
echo "ANTHROPIC_API_KEY=your-api-key-here" >> .env
```

3. **Docker Compose로 실행**
```bash
docker-compose up -d
```

4. **서비스 확인**
- Frontend: http://localhost:3001
- API Gateway: http://localhost:3000
- AI Service: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 수동 설치 (개발 환경)

#### 1. 데이터베이스 초기화
```bash
# PostgreSQL 실행
psql -U postgres -d metacognitive_db -f backend/database/schema.sql
```

#### 2. API Gateway 실행
```bash
cd backend/api-gateway
npm install
cp .env.example .env
# .env 파일 설정 후
npm run dev
```

#### 3. AI Service 실행
```bash
cd backend/ai-service
pip install -r requirements.txt
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 설정 후
python main.py
```

#### 4. Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

## API 문서

### REST API Endpoints

#### Sessions (학습 세션)
- `POST /api/sessions` - 새 세션 생성
- `GET /api/sessions/:sessionId` - 세션 조회
- `PATCH /api/sessions/:sessionId/end` - 세션 종료
- `GET /api/sessions/:sessionId/stats` - 세션 통계

#### Steps (학습 단계)
- `POST /api/steps` - 새 단계 생성
- `PATCH /api/steps/:stepId/end` - 단계 종료
- `GET /api/steps/session/:sessionId` - 세션의 모든 단계
- `GET /api/steps/session/:sessionId/current` - 현재 활성 단계

#### Actions (학습 행동)
- `POST /api/actions` - 행동 기록
- `GET /api/actions/session/:sessionId` - 세션의 모든 행동
- `GET /api/actions/step/:stepId` - 단계의 모든 행동

#### Summaries (메타인지 요약)
- `POST /api/summaries/generate` - AI 요약 생성
- `GET /api/summaries/session/:sessionId` - 세션의 모든 요약

#### LMS Integration
- `POST /api/lms/lti/launch` - LTI 런치
- `POST /api/lms/xapi/statements` - xAPI 스테이트먼트 전송

### WebSocket Events

#### Client → Server
```typescript
// 세션 참여
socket.emit('join-session', sessionId);

// 행동 전송
socket.emit('action', {
  sessionId,
  actionType: 'input',
  actionData: { field: 'numerator', value: '2' }
});

// 요약 요청
socket.emit('request-summary', { stepId });
```

#### Server → Client
```typescript
// 단계 변경 알림
socket.on('step-detected', (step) => {
  console.log('New step:', step);
});

// 요약 업데이트
socket.on('summary-update', (summary) => {
  console.log('Summary:', summary);
});
```

## 데이터베이스 스키마

### 주요 테이블

**learning_sessions**
- 학습 세션 정보 저장
- student_id, module_id, problem_id
- 시작/종료 시간, 상태, LMS 컨텍스트

**learning_steps**
- 학습 단계 정보
- step_type: reading, analyzing, strategy-planning, executing, verifying, reflecting
- 메타인지 요약, 인지 전략

**learning_actions**
- 세부 학습 행동 기록
- action_type, action_data
- 시퀀스 번호로 순서 보장

**metacognitive_summaries**
- AI 생성 메타인지 요약
- 요약 텍스트, AI 모델, 신뢰도 점수

**lms_integration_log**
- LMS 연동 로그
- LTI, xAPI 이벤트 추적

## 설정 및 커스터마이징

### AI 요약 커스터마이징

`backend/ai-service/services/summarizer.py`에서 프롬프트 수정:

```python
# 언어별 템플릿 수정
templates = {
    'ko': {
        'reading': '문제를 꼼꼼히 읽으며 이해하고 있어요.',
        # ... 추가 템플릿
    }
}
```

### 단계 감지 알고리즘 조정

`backend/ai-service/services/step_detector.py`에서 임계값 수정:

```python
# 시간 임계값 (초)
TIME_THRESHOLD = 5.0

# 액션 패턴 매칭
STEP_TRANSITION_PATTERNS = {
    'reading': ['scroll', 'focus', 'highlight'],
    # ... 패턴 추가
}
```

### UI 커스터마이징

`frontend/src/components/MetacognitiveMirror.tsx`에서 UI 수정:

```typescript
// 단계 타입 한글 레이블
const STEP_TYPE_LABELS: Record<string, string> = {
  'reading': '문제 읽기',
  // ... 레이블 추가
};
```

## LMS 연동 가이드

### LTI 1.3 연동

1. LMS에서 LTI 앱 등록
2. Client ID와 Deployment ID 획득
3. `.env`에 설정:
```bash
LMS_LTI_KEY=your-client-id
LMS_LTI_SECRET=your-secret
```

### xAPI 연동

1. LMS의 xAPI 엔드포인트 확인
2. `.env`에 설정:
```bash
LMS_XAPI_ENDPOINT=https://lms.example.com/xapi
```

3. xAPI 스테이트먼트 자동 전송 활성화

## 성능 최적화

### 캐싱 전략
- Redis를 사용한 요약 캐싱 (기본 1시간 TTL)
- 유사 액션 패턴 재사용으로 AI API 호출 40% 감소

### 부하 분산
- API Gateway 레이트 리미팅: 1000 req/min
- WebSocket 연결 풀링
- 데이터베이스 인덱스 최적화

## 보안

### 인증
- JWT 토큰 기반 인증
- WebSocket 연결 시 토큰 검증

### 데이터 보호
- PostgreSQL: 암호화된 연결
- Redis: 비밀번호 보호
- API: HTTPS 전용 (프로덕션)

### 교육 데이터 개인정보
- FERPA/COPPA 준수
- 한국 개인정보보호법(PIPA) 준수
- 데이터 보존 정책: 1년 후 자동 삭제

## 모니터링 및 로깅

### 로그 위치
- API Gateway: `backend/api-gateway/logs/`
- AI Service: stdout (Docker logs)
- Database: PostgreSQL logs

### 주요 메트릭
- 요약 생성 지연시간: 목표 < 2초 (95th percentile)
- 시스템 가동률: 목표 > 99.5%
- 액션 추적 정확도: > 99.9%

## 문제 해결

### Claude API 오류
```bash
# AI Service 로그 확인
docker logs metacognitive-ai-service

# API 키 확인
echo $ANTHROPIC_API_KEY
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 스키마 재적용
docker-compose exec postgres psql -U postgres -d metacognitive_db -f /docker-entrypoint-initdb.d/schema.sql
```

### WebSocket 연결 실패
```bash
# CORS 설정 확인
# backend/api-gateway/.env 에서 CORS_ORIGIN 확인

# WebSocket 포트 확인
netstat -an | grep 3000
```

## 기여 및 개발

### 개발 환경 설정
```bash
# Pre-commit hooks 설치
npm install -g husky

# Linting
cd backend/api-gateway && npm run lint
cd frontend && npm run lint
```

### 테스트 실행
```bash
# Backend tests
cd backend/api-gateway && npm test

# Frontend tests
cd frontend && npm test
```

## 라이선스

MIT License

## 문의

- 기술 문의: [개발팀 이메일]
- 교육학적 문의: [교육팀 이메일]
- 버그 리포트: GitHub Issues

## 관련 문서

- [시스템 설계 문서](docs/metacognitive-mirroring-design.md)
- [PRD 문서](tasks/0001-prd-ai-education-pipeline.md)
- [API 상세 문서](docs/api-reference.md)

---

**개발**: KAIST Touch Math Academy
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
