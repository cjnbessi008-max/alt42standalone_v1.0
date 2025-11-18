# AI Education System - Learning Analytics & Thinking Flow Analysis

LMS와 연동하여 학생의 풀이 시간과 지연 구간을 분석하고 사고흐름을 그래프로 시각화하는 웹 애플리케이션입니다.

## 🎯 주요 기능

### 1. 실시간 학습 활동 추적
- 학생의 모든 활동(입력, 클릭, 포커스 등)을 밀리초 단위로 추적
- 문제 풀이 과정에서의 모든 이벤트를 타임라인으로 기록
- 자동 일시정지(pause) 및 재개 감지

### 2. 사고흐름 분석
- **지연 구간 분석**: 학생이 멈추거나 고민한 구간 자동 식별
  - Pause (3-10초): 짧은 고민
  - Struggle (10초 이상): 어려움을 겪는 구간
  - Exploration: 여러 접근 방법 탐색
  - Verification: 답 확인 단계

- **사고 패턴 분석**
  - 접근 방식: systematic, exploratory, impulsive, careful
  - 집중도: high, medium, low
  - 문제 풀이 단계: 이해 → 해결 → 검증

- **학습 지표 계산**
  - 인지 부하 (Cognitive Load): 문제의 어려움 정도
  - 끈기 (Persistence): 어려움 극복 노력
  - 효율성 (Efficiency): 시간 대비 성과

### 3. 시각화 대시보드
- **활동 타임라인 그래프**: 시간에 따른 활동 빈도
- **지연 구간 표시**: 각 구간의 유형과 지속 시간
- **학습 지표 바 차트**: 인지 부하, 끈기, 효율성 점수
- **단계별 분석**: 문제 풀이 과정의 각 단계 시각화
- **교육적 제안**: AI 기반 개선 방안 제시

### 4. LMS 연동
- LTI 1.3 표준 지원
- Canvas, Moodle, Blackboard 연동
- 자동 성적 동기화 (Grade Passback)
- 학습 분석 데이터 내보내기

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────┐
│           Frontend (React + TS)             │
│  - 학생 문제 풀이 인터페이스                 │
│  - 교사 분석 대시보드                        │
│  - 사고흐름 그래프 시각화                    │
└──────────────┬──────────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────────┐
│        Backend (FastAPI + Python)           │
│  - 활동 추적 API                             │
│  - 사고흐름 분석 엔진                        │
│  - LMS 연동 서비스                           │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│        Database (PostgreSQL)                │
│  - 학습 세션 저장                            │
│  - 활동 이벤트 로깅                          │
│  - 분석 결과 저장                            │
└─────────────────────────────────────────────┘
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **learning_sessions**: 학습 세션 정보
2. **activity_events**: 활동 이벤트 (밀리초 단위 추적)
3. **thinking_flow_analysis**: 사고흐름 분석 결과
4. **delay_segments**: 지연 구간 상세 정보

## 🚀 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Node.js 18+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)
- PostgreSQL 15+ (로컬 개발 시)

### Docker로 실행하기

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 전체 스택 실행
docker-compose up -d

# 3. 데이터베이스 초기화 확인
docker-compose logs db

# 4. 서비스 접속
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8000
# - API 문서: http://localhost:8000/docs
```

### 로컬 개발 환경 설정

#### 백엔드

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 DATABASE_URL 등을 설정

# 데이터베이스 초기화
psql -U postgres -f ../database/schema.sql

# 서버 실행
uvicorn app.main:app --reload
```

#### 프론트엔드

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정
echo "VITE_API_URL=http://localhost:8000" > .env

# 개발 서버 실행
npm run dev
```

## 📖 사용 방법

### 학생용 인터페이스

1. 브라우저에서 http://localhost:5173 접속
2. "학생 화면" 선택
3. 문제를 읽고 답변 입력
4. 필요시 "힌트 보기" 클릭
5. "제출하기" 버튼으로 답안 제출
6. 제출 완료 후 세션 ID 확인

### 교사용 대시보드

1. "교사 대시보드" 선택
2. 학생의 세션 ID 입력
3. "분석하기" 버튼 클릭
4. 사고흐름 그래프 및 분석 결과 확인
5. 교육적 제안 검토

## 🔌 API 엔드포인트

### 학습 세션 관리

```
POST   /api/sessions/              # 세션 생성
GET    /api/sessions/{session_id}  # 세션 조회
PATCH  /api/sessions/{session_id}  # 세션 업데이트
```

### 활동 추적

```
POST   /api/sessions/events                # 이벤트 추적
GET    /api/sessions/{session_id}/events   # 세션 이벤트 조회
```

### 사고흐름 분석

```
POST   /api/sessions/{session_id}/analyze  # 세션 분석
GET    /api/sessions/student/{student_id}/progress  # 학생 진행 상황
```

### LMS 연동

```
POST   /api/lms/lti/launch         # LTI 런치 요청 처리
POST   /api/lms/sync                # LMS 데이터 동기화
POST   /api/lms/grade-passback      # 성적 전송
GET    /api/lms/roster/{course_id}  # 수강생 명단 조회
POST   /api/lms/export-analytics    # 분석 데이터 내보내기
```

자세한 API 문서: http://localhost:8000/docs

## 🧪 테스트

### 백엔드 테스트

```bash
cd backend
pytest
```

### 프론트엔드 테스트

```bash
cd frontend
npm test
```

## 📈 분석 알고리즘

### 지연 구간 감지

```python
# 임계값 설정
PAUSE_THRESHOLD = 3000ms    # 3초
STRUGGLE_THRESHOLD = 10000ms  # 10초

# 지연 유형 분류
if gap >= STRUGGLE_THRESHOLD:
    segment_type = "struggle"
elif gap >= PAUSE_THRESHOLD:
    segment_type = "pause"
```

### 학습 지표 계산

**인지 부하 점수 (0-100)**
```
cognitive_load = (
    struggle_count * 40% +
    pause_count * 20% +
    hint_count * 30% +
    time_taken * 10%
)
```

**끈기 점수 (0-100)**
```
persistence = (recovery_rate * 80%) + (completed ? 20% : 0%)
```

**효율성 점수 (0-100)**
```
efficiency = (expected_time / actual_time) * 100
```

## 🎨 프론트엔드 컴포넌트

### 주요 컴포넌트

- **ProblemSolver**: 학생 문제 풀이 인터페이스
- **ThinkingFlowGraph**: 사고흐름 그래프 시각화
- **TeacherDashboard**: 교사용 분석 대시보드

### 커스텀 훅

- **useActivityTracker**: 학생 활동 자동 추적
  - 입력 포커스/블러 감지
  - 입력 변경 추적
  - 버튼 클릭 추적
  - 자동 일시정지 감지

## 🔐 보안 고려사항

- JWT 기반 인증 (LMS 연동)
- CORS 설정
- SQL Injection 방지 (파라미터화된 쿼리)
- XSS 방지 (입력 검증)
- Rate Limiting (추가 예정)

## 📦 배포

### Production 빌드

```bash
# Frontend 빌드
cd frontend
npm run build

# Backend는 Docker로 배포 권장
docker build -t ai-education-backend ./backend
docker run -p 8000:8000 ai-education-backend
```

### 환경 변수

**Backend (.env)**
```
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key
CORS_ORIGINS=["https://yourdomain.com"]
```

**Frontend (.env)**
```
VITE_API_URL=https://api.yourdomain.com
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

## 📞 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.

## 🗺️ 로드맵

### v1.0 (현재)
- ✅ 기본 활동 추적
- ✅ 사고흐름 분석
- ✅ 시각화 대시보드
- ✅ LMS 연동 기본 구조

### v1.1 (예정)
- [ ] 실시간 WebSocket 알림
- [ ] 다중 학생 비교 분석
- [ ] 머신러닝 기반 패턴 예측
- [ ] 모바일 반응형 개선

### v2.0 (장기)
- [ ] 음성 입력 지원
- [ ] 로봇 아바타 연동
- [ ] 다국어 지원 (영어, 일본어)
- [ ] Advanced Analytics Dashboard

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline PRD를 기반으로 개발되었습니다.
