# LMS 병목 지점 감지 시스템 - 구현 가이드

## 개요

이 문서는 LMS와 연동하여 학습자가 어려움을 겪는 문제 유형을 실시간으로 감지하고 즉각 알려주는 웹 애플리케이션의 구현을 설명합니다.

## 시스템 아키텍처

### 전체 구조
```
┌─────────────────────────────────────────────────────────┐
│              React Frontend (Port 3000)                  │
│  - 실시간 대시보드                                         │
│  - 병목 지점 시각화                                        │
│  - WebSocket 알림                                         │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API / WebSocket
┌──────────────────▼──────────────────────────────────────┐
│           FastAPI Backend (Port 8000)                    │
│  - 병목 감지 알고리즘                                      │
│  - 성과 분석 엔진                                          │
│  - 실시간 이벤트 처리                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────────┐
│          PostgreSQL Database (Port 5432)                 │
│  - 학생 데이터                                            │
│  - 문제 유형                                              │
│  - 시도 기록                                              │
│  - 병목 지점 기록                                         │
└──────────────────────────────────────────────────────────┘
```

## 핵심 기능

### 1. 병목 지점 감지 알고리즘

시스템은 다음 5가지 지표를 분석하여 병목 지점을 감지합니다:

#### 1.1 정답률 (Accuracy Rate)
- **임계값**: 60% 미만
- **의미**: 학생이 해당 유형의 문제를 얼마나 정확하게 풀었는지
- **계산**: (정답 수 / 전체 시도 수) × 100

#### 1.2 평균 해결 시간 (Average Solving Time)
- **임계값**: 예상 시간의 150% 이상
- **의미**: 문제 해결에 얼마나 시간이 걸리는지
- **계산**: 실제 소요 시간 / 예상 소요 시간

#### 1.3 평균 시도 횟수 (Average Attempts)
- **임계값**: 3회 이상
- **의미**: 문제를 맞히기 위해 평균적으로 몇 번을 시도하는지
- **계산**: 총 시도 횟수 / 문제 수

#### 1.4 포기율 (Abandonment Rate)
- **임계값**: 30% 이상
- **의미**: 시작했지만 완료하지 않은 문제의 비율
- **계산**: (포기한 문제 수 / 전체 시도 수) × 100

#### 1.5 종합 난이도 점수 (Difficulty Score)
- **임계값**: 70점 이상
- **의미**: 위의 모든 지표를 종합한 난이도
- **계산**:
  ```python
  difficulty_score = (
      0.35 × (100 - accuracy_rate) +           # 정답률 역수
      0.25 × (time_ratio - 1) × 100 +          # 시간 초과 정도
      0.20 × (avg_attempts - 1) × 33.33 +      # 재시도 횟수
      0.20 × abandonment_rate                   # 포기율
  )
  ```

### 2. 심각도 분류

감지된 병목 지점은 난이도 점수에 따라 4단계로 분류됩니다:

- **Critical (매우 심각)**: 90점 이상 - 즉각적인 개입 필요
- **High (심각)**: 80-89점 - 빠른 시일 내 개선 필요
- **Medium (보통)**: 70-79점 - 주의 깊게 모니터링 필요
- **Low (경미)**: 70점 미만 - 경과 관찰

### 3. 개인화된 추천

병목 지점이 감지되면 자동으로 다음 정보를 제공합니다:

- **집중 영역**: 개선이 필요한 구체적인 개념
- **학습 전략**: 맞춤형 학습 방법 제안
- **추천 자료**: 해당 문제 유형 관련 학습 리소스

## 데이터베이스 스키마

### 주요 테이블

1. **students**: 학생 정보
2. **problem_types**: 문제 유형 (분수, 소수, 방정식 등)
3. **problems**: 개별 문제
4. **student_attempts**: 학생의 문제 시도 기록 (핵심 데이터)
5. **bottleneck_detections**: 감지된 병목 지점
6. **performance_metrics**: 집계된 성과 메트릭
7. **notifications**: 학생/선생님 알림

### 데이터 흐름

```
1. 학생이 문제 시도
   ↓
2. student_attempts 테이블에 기록
   ↓
3. performance_metrics 업데이트 (실시간 집계)
   ↓
4. 병목 감지 알고리즘 실행
   ↓
5. 병목 발견 시 bottleneck_detections에 저장
   ↓
6. notification 생성 및 WebSocket으로 즉시 알림
```

## API 엔드포인트

### Students
- `GET /api/students` - 학생 목록 조회
- `GET /api/students/{id}` - 특정 학생 조회
- `POST /api/students` - 학생 생성

### Attempts
- `POST /api/attempts` - 문제 시도 제출 (병목 감지 트리거)

### Bottlenecks
- `GET /api/bottlenecks/students/{id}` - 학생의 병목 지점 조회
- `POST /api/bottlenecks/students/{id}/analyze` - 병목 분석 실행
- `POST /api/bottlenecks/students/{id}/resolve/{bottleneck_id}` - 병목 해소

### Performance
- `GET /api/performance/students/{id}/summary` - 성과 요약
- `GET /api/performance/students/{id}/realtime` - 실시간 성과 (최근 30분)

### WebSocket
- `WS /ws/bottlenecks/{student_id}` - 실시간 병목 알림

## 프론트엔드 컴포넌트

### StudentDashboard
메인 대시보드 컴포넌트:
- 전체 통계 카드 (정답률, 시도 횟수, 활성 병목)
- 병목 지점 목록
- 성과 분석 차트
- 강점/약점 영역 표시

### BottleneckCard
개별 병목 지점 카드:
- 심각도 표시 (색상 코딩)
- 상세 메트릭 (정답률, 난이도 점수, 평균 시간)
- 개선 방안 및 추천 자료
- 해결 버튼

### PerformanceChart
성과 시각화:
- 문제 유형별 정답률 및 숙련도 차트
- 색상 코딩 (녹색: 80%+, 파란색: 60-80%, 주황색: 40-60%, 빨간색: 40% 미만)

## 실시간 알림 시스템

### WebSocket 연결 흐름

```javascript
// 1. 연결 생성
const ws = new WebSocket('ws://localhost:8000/ws/bottlenecks/{student_id}');

// 2. 연결 확인 메시지 수신
{
  "type": "connection",
  "message": "Connected to bottleneck detection for student {id}",
  "student_id": "{id}"
}

// 3. 병목 감지 시 알림 수신
{
  "type": "bottleneck_detected",
  "data": {
    "problem_type_name": "분수의 덧셈",
    "severity": "high",
    "difficulty_score": 85.2,
    ...
  },
  "timestamp": "2025-11-18T12:34:56Z"
}
```

### 자동 재연결
- 연결 끊김 시 자동으로 재연결 시도
- 지수 백오프 방식 (2초, 4초, 8초, 16초, 32초)
- 최대 5회 재시도

## 배포 방법

### Docker Compose 사용 (권장)

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 전체 시스템 시작
docker-compose up -d

# 3. 서비스 확인
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
# - PostgreSQL: localhost:5432

# 4. 로그 확인
docker-compose logs -f

# 5. 중지
docker-compose down
```

### 로컬 개발 환경

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# PostgreSQL 실행 필요 (Docker 또는 로컬)
export DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/lms_bottleneck"

uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 데이터베이스 초기화

```bash
# Docker를 사용하는 경우 자동으로 초기화됨
# 수동 초기화:
docker exec -it lms_bottleneck_db psql -U postgres -d lms_bottleneck -f /docker-entrypoint-initdb.d/schema.sql
```

## 성능 고려사항

### 병목 감지 최적화
- 백그라운드 태스크로 실행 (응답 시간 단축)
- 최근 30일 데이터만 분석 (설정 가능)
- 최소 시도 횟수 요구 (기본 5회)

### 데이터베이스 인덱스
- student_id, problem_type_id에 인덱스
- submitted_at에 인덱스 (시간 범위 쿼리 최적화)
- is_active 플래그에 부분 인덱스

### 캐싱 전략
- React Query로 프론트엔드 캐싱 (60초)
- 자주 조회되는 데이터는 Redis 캐싱 가능 (향후 개선)

## 모니터링 및 로깅

### 로그 레벨
- INFO: 일반 작동 로그
- WARNING: 경고 (재시도, 성능 이슈 등)
- ERROR: 오류 (데이터베이스 실패, API 오류 등)

### 주요 모니터링 지표
- 병목 감지 실행 시간
- API 응답 시간
- WebSocket 연결 수
- 데이터베이스 쿼리 성능

## 보안 고려사항

### 현재 구현
- CORS 설정 (프로덕션에서는 특정 도메인만 허용)
- SQL Injection 방지 (SQLAlchemy ORM 사용)
- 입력 검증 (Pydantic 모델)

### 향후 개선
- JWT 인증 추가
- HTTPS/WSS 사용
- Rate Limiting
- KAIST SSO 연동

## 확장 가능성

### 향후 기능
1. **예측 분석**: 머신러닝으로 병목 예측
2. **선생님 대시보드**: 반 전체 병목 지점 조회
3. **자동 학습 경로 생성**: 병목 기반 맞춤 문제 추천
4. **다국어 지원**: 영어, 중국어 등
5. **모바일 앱**: React Native 기반

### 스케일링
- 수평 확장: 백엔드 서버 여러 대
- 읽기 전용 복제본: PostgreSQL Read Replica
- 캐싱 레이어: Redis 추가
- 로드 밸런서: Nginx 또는 AWS ALB

## 문제 해결

### "WebSocket 연결 실패"
- 백엔드 서버가 실행 중인지 확인
- CORS 설정 확인
- 브라우저 콘솔에서 상세 오류 확인

### "데이터베이스 연결 실패"
- PostgreSQL이 실행 중인지 확인 (`docker ps`)
- DATABASE_URL 환경 변수 확인
- 포트 5432가 사용 가능한지 확인

### "병목 지점이 감지되지 않음"
- 최소 시도 횟수 확인 (기본 5회)
- 임계값이 너무 높은지 확인
- 수동으로 분석 실행: "병목 지점 분석" 버튼 클릭

## 라이선스

MIT License

## 지원

문의사항이나 버그 리포트는 GitHub Issues에 등록해주세요.

## 기여

Pull Request를 환영합니다! 기여 전 이슈를 먼저 생성해주세요.
