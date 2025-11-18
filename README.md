# DMN 상태 모니터링 시스템

**Default Mode Network (DMN) Status Monitoring System**

Moodle LMS와 연동하여 학생의 학습 집중도를 실시간으로 색상으로 표시하는 독립형 웹 애플리케이션입니다.

## 🌟 주요 기능

### 색상 코딩 시스템
- 🟢 **깊은 집중 (Deep Focus)** - 녹색: 최적의 학습 상태
- 🔵 **활동적 학습 (Active Learning)** - 파랑: 참여도 높은 학습
- 🟡 **주의 분산 (Wandering)** - 노랑: 주의가 흩어진 상태
- 🔴 **이탈 (Disengaged)** - 빨강: 학습에서 이탈

### 핵심 기능
- ✅ 실시간 DMN 상태 모니터링
- ✅ WebSocket 기반 5초 간격 업데이트
- ✅ 행동 패턴 기반 집중도 분석
- ✅ Moodle LMS REST API 연동
- ✅ 학생 및 교사 대시보드
- ✅ 집중도 이력 및 분석 차트
- ✅ Docker 기반 간편한 배포

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│           Frontend (React + TypeScript)                 │
│     Student Dashboard | Teacher Dashboard               │
└────────────────┬────────────────────────────────────────┘
                 │ REST API / WebSocket
┌────────────────▼────────────────────────────────────────┐
│           API Gateway (Node.js + Express)               │
│   Authentication | WebSocket | Rate Limiting            │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┼────────────┬──────────────┐
    │            │            │              │
┌───▼────┐  ┌───▼────┐  ┌───▼─────┐  ┌────▼────┐
│  DMN   │  │ Postgre│  │  Redis  │  │ Moodle  │
│Service │  │  SQL   │  │  Cache  │  │   LMS   │
│(Python)│  │   DB   │  │         │  │  (API)  │
└────────┘  └────────┘  └─────────┘  └─────────┘
```

## 🛠️ 기술 스택

### Frontend
- React 18+ with TypeScript
- Material-UI (MUI)
- Socket.IO Client
- Recharts (데이터 시각화)
- Zustand (상태 관리)
- Vite (빌드 도구)

### Backend
- **API Gateway**: Node.js + Express + Socket.IO
- **DMN Service**: Python 3.11 + FastAPI
- **Database**: PostgreSQL 15
- **Cache**: Redis 7

### DevOps
- Docker + Docker Compose
- 환경 변수 기반 설정

## 📋 사전 요구사항

- Docker & Docker Compose
- (선택) Node.js 18+ (로컬 개발용)
- (선택) Python 3.11+ (로컬 개발용)
- Moodle LMS 인스턴스 및 API 토큰 (연동 시)

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 값을 수정하세요:

```env
# Database
POSTGRES_PASSWORD=your_secure_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Moodle Integration (선택)
MOODLE_URL=http://your-moodle-instance.com
MOODLE_API_TOKEN=your_moodle_api_token
```

### 3. Docker Compose로 실행

```bash
docker-compose up -d
```

서비스가 시작되면:
- Frontend: http://localhost:5173
- API Gateway: http://localhost:3000
- DMN Service: http://localhost:8000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### 4. 초기 데이터베이스 설정 확인

데이터베이스 스키마는 자동으로 생성됩니다. 확인하려면:

```bash
docker-compose exec postgres psql -U dmn_user -d dmn_monitoring -c "\dt"
```

## 📖 사용 방법

### 학생 사용

1. 브라우저에서 http://localhost:5173 접속
2. "학생 대시보드" 선택
3. "학습 세션 시작" 버튼 클릭
4. 화면에서 학습 활동 시작
5. 우측 상단의 색상 인디케이터로 집중도 확인

### 교사 사용

1. 브라우저에서 http://localhost:5173 접속
2. "교사 대시보드" 선택
3. 학급 전체의 실시간 집중도 확인
4. 개별 학생 상태 모니터링

## 🔗 Moodle 연동

### 1. Moodle에서 API 토큰 생성

1. Moodle 관리자로 로그인
2. Site administration > Plugins > Web services > Manage tokens
3. 새 토큰 생성
4. 필요한 권한 부여:
   - `core_enrol_get_enrolled_users`
   - `core_course_get_courses`
   - `core_user_get_users_by_field`

### 2. 환경 변수에 토큰 설정

```env
MOODLE_URL=https://your-moodle.com
MOODLE_API_TOKEN=your_generated_token
```

### 3. 학생 및 과정 동기화

```bash
# 과정 동기화
curl -X POST http://localhost:3000/api/moodle/sync/courses

# 학생 동기화 (과정 ID 필요)
curl -X POST http://localhost:3000/api/moodle/sync/students \
  -H "Content-Type: application/json" \
  -d '{"courseId": 123}'
```

## 🔧 로컬 개발 환경

### Backend 개발

#### DMN Service (Python)

```bash
cd backend/dmn-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.api.main:app --reload --port 8000
```

#### API Gateway (Node.js)

```bash
cd backend/api-gateway
npm install
npm run dev
```

### Frontend 개발

```bash
cd frontend
npm install
npm run dev
```

## 📊 DMN 분석 알고리즘

시스템은 다음 행동 지표를 분석하여 DMN 상태를 판단합니다:

### 측정 지표
- **상호작용 빈도**: 클릭, 키보드 입력, 스크롤
- **마우스 활동도**: 마우스 움직임 강도
- **키보드 활동**: 초당 키 입력 횟수
- **페이지 포커스**: 페이지 활성화 시간
- **유휴 시간**: 활동 없는 시간

### 참여도 점수 계산

```python
engagement_score = (
    0.30 * interaction_frequency +
    0.15 * mouse_intensity +
    0.20 * keyboard_activity +
    0.20 * page_focus +
    0.10 * click_patterns +
    0.05 * scroll_activity
) * idle_penalty
```

### 상태 임계값

- **Deep Focus**: engagement ≥ 0.75
- **Active Learning**: engagement ≥ 0.55
- **Wandering**: engagement ≥ 0.35
- **Disengaged**: engagement < 0.35

임계값은 `/api/dmn/config/thresholds` API로 조정 가능합니다.

## 🧪 API 엔드포인트

### DMN 분석
- `POST /api/dmn/analyze` - DMN 상태 분석
- `POST /api/dmn/event` - 단일 이벤트 추적
- `GET /api/dmn/status/:studentId/:sessionId` - 현재 상태 조회
- `GET /api/dmn/history/:studentId` - 이력 조회
- `GET /api/dmn/analytics/:studentId` - 분석 데이터

### Moodle 연동
- `POST /api/moodle/sync/students` - 학생 동기화
- `POST /api/moodle/sync/courses` - 과정 동기화
- `GET /api/moodle/status` - 연결 상태 확인

### 학생 관리
- `GET /api/students` - 학생 목록
- `POST /api/students/sessions` - 세션 시작
- `PUT /api/students/sessions/:sessionId/end` - 세션 종료

자세한 API 문서는 http://localhost:8000/docs (DMN Service Swagger UI)에서 확인하세요.

## 🐛 문제 해결

### Docker 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs

# 특정 서비스 로그
docker-compose logs dmn-service
docker-compose logs api-gateway
```

### WebSocket 연결 실패

1. CORS 설정 확인 (`.env`의 `ALLOWED_ORIGINS`)
2. 방화벽에서 포트 3000 허용 확인
3. 브라우저 콘솔에서 에러 확인

### 데이터베이스 연결 오류

```bash
# PostgreSQL 상태 확인
docker-compose exec postgres pg_isready -U dmn_user

# 데이터베이스 재시작
docker-compose restart postgres
```

## 📈 성능 최적화

### 권장 설정
- 동시 사용자: 100명 이하
- WebSocket 업데이트 간격: 5초
- 이벤트 버퍼 크기: 30초 윈도우

### 확장 방법
- Redis를 사용한 세션 관리 확장
- PostgreSQL 읽기 복제본 추가
- Nginx 리버스 프록시 사용
- Kubernetes로 수평 확장

## 🔒 보안 고려사항

- JWT 토큰 기반 인증 (구현 예정)
- HTTPS 사용 권장 (프로덕션)
- Moodle API 토큰 안전하게 보관
- Rate limiting 적용됨 (15분당 100 요청)
- SQL Injection 방지 (Parameterized queries)

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 🤝 기여

이슈 리포트와 풀 리퀘스트를 환영합니다!

## 📞 지원

문제가 발생하면 GitHub Issues에 등록해 주세요.

---

**개발**: AI Education System Pipeline Team
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
