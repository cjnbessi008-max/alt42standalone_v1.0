# 시스템 아키텍처

## 개요

LMS 키워드 버블 시각화 시스템은 클라이언트-서버 아키텍처를 따르며, React 기반 프론트엔드와 FastAPI 기반 백엔드로 구성됩니다.

## 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                        │
│                  React + TypeScript                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │  UI Components                                   │   │
│  │  - KeywordExtractorForm                          │   │
│  │  - KeywordBubbleVisualization (D3.js)            │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Services & State Management                     │   │
│  │  - keywordService (API Client)                   │   │
│  │  - Zustand Store                                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP/REST
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   BACKEND LAYER                          │
│                  Python + FastAPI                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Endpoints                                   │   │
│  │  - POST /api/keywords/extract                    │   │
│  │  - GET /api/modules/{id}/keywords                │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Business Logic                                  │   │
│  │  - KeywordExtractor                              │   │
│  │  - VisualizationGenerator                        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  NLP Processing                                  │   │
│  │  - KoNLPy (Korean)                               │   │
│  │  - NLTK (English)                                │   │
│  │  - TF-IDF (scikit-learn)                         │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │    Redis     │  │  File Store  │  │
│  │ (Persistent) │  │   (Cache)    │  │  (Future)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 주요 컴포넌트

### 1. Frontend Components

#### KeywordExtractorForm
- 사용자 입력을 받는 폼 컴포넌트
- 언어 선택, 추출 옵션 설정
- API 호출 및 에러 처리

#### KeywordBubbleVisualization
- D3.js 기반 인터랙티브 버블 시각화
- Force-directed 레이아웃
- 줌, 팬, 드래그 인터랙션
- 실시간 필터링

### 2. Backend Services

#### KeywordExtractor
**책임:**
- 텍스트에서 키워드 추출
- 언어별 토크나이징 (한국어/영어)
- TF-IDF 기반 중요도 계산
- 키워드 타입 분류
- 키워드 관계 추출

**알고리즘:**
1. 텍스트 전처리 및 토크나이징
2. 불용어(stopwords) 제거
3. 형태소 분석 (한국어의 경우)
4. TF-IDF 스코어 계산
5. 중요도 기반 필터링 및 정렬
6. 키워드 타입 분류
7. Co-occurrence 기반 관계 추출

#### VisualizationGenerator
**책임:**
- 키워드를 버블 노드로 변환
- 노드 크기 계산 (중요도 기반)
- 노드 색상 지정 (타입 기반)
- 초기 위치 계산
- 링크 생성

**레이아웃 알고리즘:**
- **Force-directed**: D3.js force simulation (기본)
- **Circular**: 원형 배치
- **Hierarchical**: 계층형 배치

## 데이터 플로우

### 키워드 추출 프로세스

```
1. User Input
   ↓
2. Frontend: Validation & API Call
   ↓
3. Backend: Receive Request
   ↓
4. KeywordExtractor: Process Text
   - Tokenization
   - Stopword Removal
   - TF-IDF Calculation
   - Keyword Classification
   ↓
5. KeywordExtractor: Extract Relationships
   - Co-occurrence Analysis
   - Relationship Type Determination
   ↓
6. VisualizationGenerator: Create Bubble Data
   - Node Generation
   - Link Generation
   - Layout Calculation
   ↓
7. Backend: Return Response
   ↓
8. Frontend: Render Visualization
   - D3.js Force Simulation
   - Interactive Controls
   - User Interactions
```

## NLP 처리 파이프라인

### 한국어 처리
```
원문 텍스트
    ↓
KoNLPy Okt Tokenizer
    ↓
명사/동사 추출
    ↓
불용어 제거
    ↓
정규화
    ↓
키워드 리스트
```

### 영어 처리
```
원문 텍스트
    ↓
NLTK Word Tokenizer
    ↓
소문자 변환
    ↓
불용어 제거
    ↓
키워드 리스트
```

## 시각화 알고리즘

### Force-Directed Layout (D3.js)

```javascript
forces = {
  charge: -300,        // 노드 간 반발력
  center: (w/2, h/2),  // 중심 위치
  collision: r + 5,    // 충돌 방지
  link: {
    distance: 100,     // 링크 거리
    strength: 0-1      // 링크 강도
  }
}
```

### 버블 크기 계산

```python
def calculate_radius(importance_score):
    min_radius = 20
    max_radius = 80
    normalized = (score - min_score) / (max_score - min_score)
    return min_radius + (normalized * (max_radius - min_radius))
```

## 성능 최적화

### Frontend
- **React.memo**: 불필요한 재렌더링 방지
- **useMemo/useCallback**: 계산 결과 캐싱
- **Virtual DOM**: React의 효율적인 DOM 업데이트
- **Lazy Loading**: 코드 스플리팅

### Backend
- **Async/Await**: 비동기 처리
- **Caching**: Redis를 통한 결과 캐싱 (향후)
- **Connection Pooling**: 데이터베이스 연결 관리
- **Batch Processing**: 대량 데이터 처리 최적화

## 확장성

### 수평 확장
- **Load Balancer**: NGINX를 통한 트래픽 분산
- **Multiple Backend Instances**: Docker Swarm/Kubernetes
- **Database Replication**: PostgreSQL 읽기 복제

### 수직 확장
- **CPU**: NLP 처리 성능 향상
- **Memory**: 대용량 텍스트 처리
- **Storage**: 데이터베이스 용량 증설

## 보안

### API 보안
- **CORS**: 허용된 도메인만 접근
- **Rate Limiting**: API 요청 제한
- **Input Validation**: Pydantic 스키마 검증
- **SQL Injection 방지**: SQLAlchemy ORM

### 데이터 보안
- **Encryption at Rest**: 데이터베이스 암호화
- **Encryption in Transit**: HTTPS/TLS
- **Authentication**: JWT 토큰 (향후)
- **Authorization**: RBAC (향후)

## 모니터링 및 로깅

### 로깅
- **Application Logs**: Python logging module
- **Access Logs**: Uvicorn access logs
- **Error Tracking**: Sentry (향후)

### 모니터링
- **Health Checks**: `/api/health` endpoint
- **Metrics**: Prometheus (향후)
- **Visualization**: Grafana (향후)

## 배포 아키텍처

### Development
```
Local Machine
├── Frontend (Vite Dev Server)
├── Backend (Uvicorn)
└── PostgreSQL (Docker)
```

### Production (향후)
```
Cloud Infrastructure (AWS/GCP)
├── Load Balancer
├── Frontend (S3 + CloudFront)
├── Backend (ECS/EKS)
├── Database (RDS)
└── Cache (ElastiCache)
```

## 기술적 의사결정

### React vs Vue vs Angular
**선택: React**
- 풍부한 생태계
- D3.js와의 우수한 통합
- 컴포넌트 재사용성

### D3.js vs Chart.js vs Recharts
**선택: D3.js**
- 최고의 유연성
- Force-directed 레이아웃 지원
- 커스텀 인터랙션

### FastAPI vs Flask vs Django
**선택: FastAPI**
- 고성능 비동기 처리
- 자동 API 문서화
- Pydantic 기반 타입 검증

### KoNLPy vs mecab-ko
**선택: KoNLPy**
- 설치 용이성
- 다양한 형태소 분석기 지원
- 활발한 커뮤니티
