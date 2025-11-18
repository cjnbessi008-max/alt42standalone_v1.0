# Learning Stress Indicator System (학습 스트레스 지표 시스템)

LMS와 연동하여 학습 스트레스 지표를 3단계로 제공하는 웹 애플리케이션

## 📋 Overview (개요)

이 시스템은 학생들의 학습 활동을 분석하여 스트레스 레벨을 측정하고, 교사와 LMS에 실시간 피드백을 제공합니다.

### 스트레스 레벨 (3단계)

- **LOW (낮음) 😊**: 학생이 편안하게 학습 중
- **MEDIUM (보통) 😐**: 적당한 도전과 노력 필요
- **HIGH (높음) 😰**: 학생이 어려움을 겪고 있음 - 교사 개입 권장

### 주요 기능

- ✅ 실시간 학습 스트레스 측정
- ✅ 4가지 요인 분석 (오답률, 학습 시간, 재시도 횟수, 응답 시간 추세)
- ✅ 개인화된 권장사항 제공
- ✅ 통계 대시보드
- ✅ LMS 연동 API
- ✅ 반응형 웹 인터페이스

## 🏗️ Architecture (아키텍처)

```
┌─────────────────────────────────────────┐
│       Frontend (React + TypeScript)     │
│  - Stress Dashboard                     │
│  - Stress Indicator Visualization       │
│  - Learning Activity Simulator          │
└───────────────┬─────────────────────────┘
                │ REST API
┌───────────────▼─────────────────────────┐
│      Backend (FastAPI + Python)         │
│  - Stress Calculation Engine            │
│  - LMS Integration API                  │
│  - In-memory Database                   │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│      Database (PostgreSQL)              │
│  - Students, Modules                    │
│  - Learning Activities                  │
│  - Stress Indicators                    │
└─────────────────────────────────────────┘
```

## 📊 Stress Calculation Logic (스트레스 계산 로직)

스트레스 점수는 다음 4가지 요인의 가중 평균으로 계산됩니다:

1. **오답률 (35%)**: 높을수록 스트레스 증가
2. **학습 시간 (25%)**: 장시간 학습 시 스트레스 증가
3. **재시도 횟수 (20%)**: 많을수록 스트레스 증가
4. **응답 시간 추세 (20%)**: 느려질수록 스트레스 증가

### 레벨 분류 기준

- **0-35점**: LOW (낮음)
- **35-60점**: MEDIUM (보통)
- **60-100점**: HIGH (높음)

## 🚀 Getting Started (시작하기)

### Prerequisites (사전 요구사항)

- Python 3.11+
- Node.js 16+
- PostgreSQL 15+ (선택사항)

### Backend Setup (백엔드 설정)

```bash
# 백엔드 디렉토리로 이동
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면 다음 URL에서 확인할 수 있습니다:
- API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### Frontend Setup (프론트엔드 설정)

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

웹 애플리케이션이 http://localhost:3000 에서 실행됩니다.

### Database Setup (데이터베이스 설정)

PostgreSQL 사용 시:

```bash
# PostgreSQL 데이터베이스 생성
createdb learning_stress_indicator

# 스키마 적용
psql learning_stress_indicator < backend/schema.sql
```

## 📡 API Endpoints (API 엔드포인트)

### 스트레스 계산

```http
POST /api/stress/calculate
Content-Type: application/json

{
  "student_id": "student001",
  "module_id": "module001",
  "session_id": "session_123",
  "time_spent_minutes": 15.5,
  "problems_attempted": 10,
  "problems_correct": 8,
  "retry_count": 2,
  "average_response_time": 30.0,
  "response_time_trend": 0.1
}
```

### 학생별 스트레스 지표 조회

```http
GET /api/stress/indicator/{student_id}?module_id=module001&limit=10
```

### 모듈별 스트레스 지표 조회

```http
GET /api/stress/module/{module_id}?stress_level=HIGH&limit=50
```

### 스트레스 메트릭 통계

```http
GET /api/stress/metrics?module_id=module001
```

### LMS 연동

```http
POST /api/lms/stress
Content-Type: application/json

{
  "lms_type": "canvas",
  "course_id": "course123",
  "student_ids": ["student001", "student002"],
  "module_id": "module001"
}
```

## 🔌 LMS Integration (LMS 연동)

### 지원하는 LMS

- Canvas
- Moodle
- Blackboard
- 기타 LTI 호환 시스템

### 연동 방법

1. LMS에서 External Tool 추가
2. API 엔드포인트 설정: `{YOUR_API_URL}/api/lms/stress`
3. 인증 토큰 설정
4. 학생 ID 매핑 확인

자세한 내용은 각 LMS의 문서를 참조하세요.

## 🧪 Example Usage (사용 예시)

### Python 클라이언트

```python
import requests

# 스트레스 계산
activity = {
    "student_id": "student001",
    "module_id": "module001",
    "session_id": "session_123",
    "time_spent_minutes": 45.0,
    "problems_attempted": 20,
    "problems_correct": 12,
    "retry_count": 8,
    "average_response_time": 35.0,
    "response_time_trend": -0.3
}

response = requests.post(
    "http://localhost:8000/api/stress/calculate",
    json=activity
)

indicator = response.json()
print(f"스트레스 레벨: {indicator['stress_level']}")
print(f"스트레스 점수: {indicator['stress_score']}")
print(f"권장사항: {indicator['recommendations']}")
```

### JavaScript 클라이언트

```javascript
// 스트레스 메트릭 조회
fetch('http://localhost:8000/api/stress/metrics?module_id=module001')
  .then(response => response.json())
  .then(metrics => {
    console.log('총 학생 수:', metrics.total_students);
    console.log('높은 스트레스:', metrics.high_stress_count);
    console.log('평균 점수:', metrics.average_stress_score);
  });
```

## 📚 Data Models (데이터 모델)

### LearningActivity

```typescript
{
  student_id: string;          // 학생 ID
  module_id: string;           // 모듈 ID
  session_id: string;          // 세션 ID
  time_spent_minutes: number;  // 학습 시간 (분)
  problems_attempted: number;  // 시도한 문제 수
  problems_correct: number;    // 정답 문제 수
  retry_count: number;         // 재시도 횟수
  average_response_time: number; // 평균 응답 시간 (초)
  response_time_trend: number; // 응답 시간 추세 (-1 ~ 1)
}
```

### StressIndicator

```typescript
{
  student_id: string;
  module_id: string;
  session_id: string;
  stress_level: "LOW" | "MEDIUM" | "HIGH";
  stress_score: number;        // 0-100
  factors: {
    error_rate: StressFactor;
    time_spent: StressFactor;
    retry_count: StressFactor;
    response_trend: StressFactor;
  };
  timestamp: string;
  recommendations: string[];
}
```

## 🎨 UI Components (UI 컴포넌트)

### StressDashboard

전체 통계를 보여주는 대시보드:
- 총 학생 수
- 평균 스트레스 점수
- 레벨별 분포 차트
- 경고 알림

### StressIndicatorCard

개별 학생의 스트레스 지표 카드:
- 스트레스 레벨 배지
- 점수 표시
- 요인별 막대 그래프
- 권장사항

## 🔧 Configuration (설정)

### Backend 환경 변수

```bash
# .env 파일 생성
DATABASE_URL=postgresql://user:password@localhost/learning_stress_indicator
REDIS_URL=redis://localhost:6379
API_PORT=8000
```

### Frontend 환경 변수

```bash
# .env 파일 생성
REACT_APP_API_URL=http://localhost:8000
```

## 📈 Monitoring & Analytics (모니터링 및 분석)

### 헬스 체크

```http
GET /health
```

응답:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-18T10:30:00",
  "database": {
    "total_indicators": 150,
    "total_students": 25
  }
}
```

## 🛡️ Security (보안)

- ✅ CORS 설정
- ✅ 입력 데이터 검증 (Pydantic)
- ✅ SQL 인젝션 방지
- ✅ Rate Limiting (향후 추가 예정)
- ✅ 인증/인가 (향후 추가 예정)

## 🗺️ Roadmap (로드맵)

### Phase 1 (현재) ✅
- [x] 기본 스트레스 계산 로직
- [x] REST API 구현
- [x] React 프론트엔드
- [x] 인메모리 데이터베이스

### Phase 2 (다음 단계)
- [ ] PostgreSQL 완전 연동
- [ ] 실시간 업데이트 (WebSocket)
- [ ] 사용자 인증 (JWT)
- [ ] 고급 분석 및 리포트

### Phase 3 (미래)
- [ ] AI 기반 개인화 권장사항
- [ ] 다국어 지원
- [ ] 모바일 앱
- [ ] 센서 데이터 통합

## 🤝 Contributing (기여하기)

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License (라이선스)

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 Authors (작성자)

- KAIST Touch Math Academy
- AI Education System Pipeline Team

## 📞 Support (지원)

문의사항이 있으시면 다음으로 연락주세요:
- 이메일: support@kaist-touchmath.edu
- 이슈 트래커: GitHub Issues

---

**Made with ❤️ for better education**
