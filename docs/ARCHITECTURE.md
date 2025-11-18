# 시스템 아키텍처

## 개요

LMS 감정 기복 분석 시스템은 다음과 같은 계층 구조로 구성됩니다:

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React Dashboard)                  │
│         감정 기복 시각화 및 리포트 표시                    │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│           Backend API Server (FastAPI)                   │
│    - LMS 웹훅 수신                                       │
│    - 감정 데이터 수집                                     │
│    - 분석 리포트 제공                                     │
└────────┬────────────────────────┬───────────────────────┘
         │                        │
┌────────▼─────────┐    ┌─────────▼──────────┐
│  LMS Integration │    │ Emotion Volatility │
│      Module      │    │      Analyzer      │
│                  │    │                    │
│ - 감정 추론      │    │ - 시간대별 분석    │
│ - 데이터 수집    │    │ - 기복 점수 계산   │
│ - 웹훅 처리      │    │ - 리포트 생성      │
└────────┬─────────┘    └─────────┬──────────┘
         │                        │
         └──────────┬─────────────┘
                    │
         ┌──────────▼───────────┐
         │  PostgreSQL Database │
         │                      │
         │ - emotion_logs       │
         │ - hourly_aggregates  │
         │ - change_events      │
         └──────────────────────┘
```

## 주요 컴포넌트

### 1. Frontend Layer
- **기술**: React + TypeScript
- **책임**:
  - 감정 기복 데이터 시각화
  - 사용자 인터랙션 처리
  - API 호출 및 상태 관리
- **주요 컴포넌트**:
  - `EmotionVolatilityDashboard`: 메인 대시보드

### 2. Backend API Layer
- **기술**: FastAPI (Python)
- **책임**:
  - RESTful API 엔드포인트 제공
  - 요청 검증 및 인증
  - 비즈니스 로직 조율
- **주요 엔드포인트**:
  - `POST /api/emotions/collect`: 감정 데이터 수집
  - `POST /api/lms/webhook/learning-activity`: LMS 웹훅 수신
  - `GET /api/analysis/volatility-report`: 분석 리포트 조회

### 3. LMS Integration Module
- **파일**: `src/backend/lms_integration.py`
- **책임**:
  - LMS와의 통신 처리
  - 학습 활동으로부터 감정 추론
  - 감정 데이터 저장
- **주요 클래스**:
  - `LMSEmotionCollector`: 감정 데이터 수집
  - `LMSWebhookHandler`: 웹훅 처리
  - `EmotionDataPoint`: 감정 데이터 모델

### 4. Emotion Volatility Analyzer
- **파일**: `src/analysis/emotion_volatility_analyzer.py`
- **책임**:
  - 시간대별 감정 기복 분석
  - 통계 계산 (표준편차, 평균 등)
  - 리포트 생성 및 권장사항 제시
- **주요 클래스**:
  - `EmotionVolatilityAnalyzer`: 분석 엔진
  - `EmotionVolatilityMetrics`: 메트릭 모델
  - `TimeSlot`: 시간대 모델

### 5. Database Layer
- **기술**: PostgreSQL 15+
- **책임**:
  - 감정 데이터 영구 저장
  - 시간대별 집계
  - 효율적인 쿼리 지원
- **주요 테이블**:
  - `emotion_logs`: 원본 감정 로그
  - `emotion_hourly_aggregates`: 시간대별 집계
  - `emotion_change_events`: 감정 변화 이벤트

## 데이터 흐름

### 1. 감정 데이터 수집 플로우

```
LMS/학습앱
    │
    │ (학습 활동 이벤트)
    ▼
LMS Webhook Handler
    │
    │ (감정 추론)
    ▼
Emotion Collector
    │
    │ (데이터 저장)
    ▼
Database
    │
    │ (변화 감지)
    ▼
Change Event Recorder
```

### 2. 분석 리포트 생성 플로우

```
Frontend Request
    │
    │ (GET /api/analysis/volatility-report)
    ▼
API Server
    │
    │ (분석 요청)
    ▼
Volatility Analyzer
    │
    │ (데이터 조회)
    ▼
Database
    │
    │ (시간대별 그룹화)
    ▼
Volatility Analyzer
    │
    │ (통계 계산)
    ▼
Metrics Generation
    │
    │ (권장사항 생성)
    ▼
Report Builder
    │
    │ (JSON 응답)
    ▼
Frontend Dashboard
```

## 확장성 고려사항

### 수평 확장
- **API 서버**: 무상태(stateless) 설계로 여러 인스턴스 배포 가능
- **로드 밸런서**: Nginx 또는 AWS ALB 사용
- **데이터베이스**: Read Replica를 통한 읽기 성능 향상

### 성능 최적화
- **캐싱**: Redis를 사용한 분석 결과 캐싱
- **배치 처리**: 시간대별 집계를 배치 작업으로 처리
- **인덱싱**: 자주 조회되는 컬럼에 인덱스 적용

### 모니터링
- **로깅**: Structlog를 사용한 구조화된 로깅
- **메트릭**: Prometheus + Grafana
- **알림**: 높은 기복 감지시 자동 알림

## 보안 고려사항

### 인증 & 인가
- JWT 토큰 기반 인증
- Role-Based Access Control (RBAC)
- LMS 웹훅 서명 검증

### 데이터 보안
- 학생 개인정보 암호화 (AES-256)
- TLS 1.3를 통한 전송 암호화
- 정기적인 백업 및 감사 로그

### API 보안
- Rate Limiting (100 req/hour)
- Input Validation (Pydantic)
- CORS 정책 적용

## 배포 아키텍처

### 개발 환경
```
Docker Compose
├── FastAPI Server (port 8000)
├── PostgreSQL (port 5432)
├── Redis (port 6379)
└── React Dev Server (port 3000)
```

### 프로덕션 환경
```
AWS/Azure/GCP
├── Application Load Balancer
├── ECS/Kubernetes Cluster
│   ├── API Server Pods (Auto-scaling)
│   └── Background Workers
├── RDS PostgreSQL (Multi-AZ)
├── ElastiCache Redis
└── S3 (정적 파일)
```

## 기술 스택 요약

| 계층 | 기술 | 용도 |
|------|------|------|
| Frontend | React 18 + TypeScript | UI/UX |
| Backend | FastAPI + Python 3.11 | REST API |
| Database | PostgreSQL 15 | 데이터 저장 |
| Caching | Redis 7 | 성능 최적화 |
| 배포 | Docker + Kubernetes | 컨테이너 오케스트레이션 |
| 모니터링 | Prometheus + Grafana | 메트릭 수집/시각화 |

## 향후 개선 사항

1. **실시간 처리**: WebSocket을 통한 실시간 감정 데이터 스트리밍
2. **ML 모델**: 딥러닝 기반 감정 예측 모델 적용
3. **다중 LMS 지원**: Canvas, Moodle 등 다양한 LMS 플랫폼 연동
4. **모바일 앱**: React Native 기반 모바일 대시보드
5. **예측 분석**: 미래 감정 패턴 예측 및 조기 경보
