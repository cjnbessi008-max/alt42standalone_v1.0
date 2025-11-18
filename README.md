# LMS 연동 감정 기복 분석 시스템

LMS(Learning Management System)와 연동하여 학생들의 학습 중 감정 변화를 추적하고, 시간대별 감정 기복이 심한 시간을 분석하는 시스템입니다.

## 🎯 주요 기능

### 1. 감정 데이터 수집
- LMS와 실시간 연동하여 학생의 감정 데이터 수집
- 8가지 감정 유형 추적: happy, excited, neutral, confused, frustrated, anxious, bored, engaged
- 감정 강도 측정 (1-10 스케일)
- 학습 활동 컨텍스트와 함께 저장

### 2. 시간대별 감정 기복 분석
- 시간대(hour) 및 요일별 감정 변화 패턴 분석
- 표준편차 기반 감정 기복 점수 계산
- 감정 기복 레벨 분류: low, medium, high, extreme
- 급격한 감정 변화 이벤트 감지

### 3. 시각화 대시보드
- 감정 기복이 심한 시간대 TOP 5
- 요일별/시간대별 평균 기복 차트
- 감정 분포 시각화
- 개선 권장사항 제공

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── backend/
│   │   ├── api_server.py              # FastAPI 서버
│   │   └── lms_integration.py         # LMS 연동 모듈
│   ├── frontend/
│   │   └── EmotionVolatilityDashboard.tsx  # React 대시보드
│   ├── database/
│   │   └── emotion_schema.sql         # 데이터베이스 스키마
│   └── analysis/
│       └── emotion_volatility_analyzer.py  # 분석 엔진
├── docs/
├── tests/
├── requirements.txt
├── README.md
└── tasks/
    └── 0001-prd-ai-education-pipeline.md
```

## 🚀 시작하기

### 사전 요구사항

- Python 3.11+
- PostgreSQL 15+
- Node.js 18+ (프론트엔드)
- Redis 7+ (선택사항, 캐싱용)

### 설치

1. **저장소 클론**
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

2. **Python 가상환경 생성 및 활성화**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows
```

3. **의존성 설치**
```bash
pip install -r requirements.txt
```

4. **데이터베이스 설정**
```bash
# PostgreSQL 데이터베이스 생성
createdb emotion_analysis

# 스키마 적용
psql -d emotion_analysis -f src/database/emotion_schema.sql
```

5. **환경변수 설정**
```bash
# .env 파일 생성
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/emotion_analysis
API_PORT=8000
LOG_LEVEL=INFO
EOF
```

### 실행

**백엔드 API 서버 실행:**
```bash
cd src/backend
python api_server.py
```

API 서버는 `http://localhost:8000`에서 실행됩니다.

**API 문서 확인:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 📊 데이터베이스 스키마

### 주요 테이블

1. **emotion_logs**: 학생 감정 로그
   - 실시간 감정 데이터 저장
   - 학습 컨텍스트 포함

2. **emotion_hourly_aggregates**: 시간대별 감정 집계
   - 성능 최적화를 위한 집계 테이블
   - 감정 기복 점수 사전 계산

3. **emotion_change_events**: 감정 변화 이벤트
   - 급격한 감정 변화 추적
   - 변화 트리거 분석

## 🔌 API 엔드포인트

### 감정 데이터 수집
```http
POST /api/emotions/collect
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "session_id": "uuid",
  "emotion_type": "frustrated",
  "emotion_intensity": 7,
  "context": {
    "activity_type": "problem_solving",
    "difficulty": "hard"
  }
}
```

### 감정 기복 리포트 조회
```http
GET /api/analysis/volatility-report?student_id=uuid&module_id=uuid
```

**응답 예시:**
```json
{
  "status": "success",
  "summary": {
    "total_timeslots_analyzed": 50,
    "avg_volatility": 2.8,
    "max_volatility": 5.2,
    "most_volatile_day": {
      "day": "Wednesday",
      "avg_volatility": 3.5
    },
    "most_volatile_hour": {
      "hour": "14:00",
      "avg_volatility": 4.1
    }
  },
  "top_volatile_timeslots": [...],
  "recommendations": [...]
}
```

### LMS 웹훅 수신
```http
POST /api/lms/webhook/learning-activity
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "session_id": "uuid",
  "activity_type": "problem_solving",
  "result": "correct",
  "time_spent": 45,
  "timestamp": "2025-11-18T10:30:00Z"
}
```

## 🎨 프론트엔드 대시보드

React 기반 감정 기복 시각화 대시보드를 제공합니다.

**주요 기능:**
- 실시간 데이터 업데이트
- 인터랙티브 차트 및 그래프
- 감정 기복 히트맵
- 개선 권장사항 표시

**사용 예시:**
```tsx
import EmotionVolatilityDashboard from './src/frontend/EmotionVolatilityDashboard';

<EmotionVolatilityDashboard
  studentId="student-123"
  moduleId="module-456"
  apiBaseUrl="http://localhost:8000"
/>
```

## 📈 분석 메트릭

### 감정 기복 점수 (Volatility Score)
- **계산 방식**: 표준편차 기반
- **범위**: 0 ~ ∞ (일반적으로 0-10)
- **해석**:
  - 0-1.5: 낮음 (안정적)
  - 1.5-2.5: 보통
  - 2.5-3.5: 높음
  - 3.5+: 극심 (주의 필요)

### 감정 강도 (Emotion Intensity)
- **범위**: 1-10
- **해석**:
  - 1-3: 약한 감정
  - 4-6: 보통 감정
  - 7-8: 강한 감정
  - 9-10: 매우 강한 감정

## 🔧 설정 및 커스터마이징

### 기복 임계값 조정
`src/analysis/emotion_volatility_analyzer.py` 파일의 `VOLATILITY_THRESHOLDS` 수정:

```python
VOLATILITY_THRESHOLDS = {
    "low": 1.5,
    "medium": 2.5,
    "high": 3.5,
    "extreme": 5.0
}
```

### 감정 추론 로직 커스터마이징
`src/backend/lms_integration.py`의 `_infer_emotion_from_activity` 메서드 수정

## 🧪 테스트

```bash
# 단위 테스트 실행
pytest tests/

# 커버리지 확인
pytest --cov=src tests/
```

## 📝 개발 로드맵

- [ ] Phase 1: 기본 감정 수집 및 분석 (완료)
- [ ] Phase 2: ML 기반 감정 추론 모델
- [ ] Phase 3: 실시간 알림 시스템
- [ ] Phase 4: 다양한 LMS 플랫폼 연동 (Canvas, Moodle 등)
- [ ] Phase 5: 모바일 앱 지원

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

This project is licensed under the MIT License.

## 👥 팀

KAIST Touch Math Academy - AI Education System Team

## 📞 문의

- 기술 문의: [개발팀 이메일]
- 교육 관련 문의: [교육팀 이메일]
- 버그 리포트: GitHub Issues

---

**참고 문서:**
- [PRD: AI Education System Pipeline](tasks/0001-prd-ai-education-pipeline.md)
- [API Documentation](http://localhost:8000/docs)
- [Database Schema](src/database/emotion_schema.sql)
