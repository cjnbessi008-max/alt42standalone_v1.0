# LMS 피로도 모니터링 & 휴식 알림 시스템

## 개요 (Overview)

이 시스템은 학습 진도율을 기반으로 학생의 피로도를 실시간으로 예측하고, 적절한 시점에 휴식을 권장하는 통합 LMS 기능입니다.

**주요 기능:**
- 📊 실시간 피로도 점수 계산 및 모니터링
- 🔔 개인화된 휴식 알림 및 권장사항
- 📈 학습 패턴 분석 및 최적화
- 🎯 학습 효율성 향상 (15-20% 예상)
- 💪 학습 중단율 감소 (25% 예상)

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│  FatigueIndicator | BreakModal | BreakTimer                 │
└───────────────────┬─────────────────────────────────────────┘
                    │ WebSocket + REST API
┌───────────────────▼─────────────────────────────────────────┐
│                FastAPI Backend                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ FatigueCalculator → MetricsAPI → WebSocketManager   │   │
│  └──────────────────────────────────────────────────────┘   │
└──────┬─────────────────────┬────────────────────────────────┘
       │                     │
┌──────▼──────┐    ┌────────▼─────────┐
│ PostgreSQL  │    │  Redis (Cache)   │
│ (Sessions,  │    │  (WebSocket      │
│  Metrics)   │    │   Pub/Sub)       │
└─────────────┘    └──────────────────┘
```

---

## 설치 및 설정

### 1. 환경 요구사항

**Backend:**
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

**Frontend:**
- Node.js 18+
- React 18+
- TypeScript 4.9+

### 2. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb education_db

# 마이그레이션 실행
psql -d education_db -f database/migrations/001_fatigue_monitoring_schema.sql
```

### 3. Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (.env 파일)
cat > .env << EOF
DATABASE_URL=postgresql://user:password@localhost:5432/education_db
REDIS_URL=redis://localhost:6379/0
DEBUG=true
METRIC_INTERVAL=120
AUTO_BREAK=true
MANDATORY_BREAK_THRESHOLD=85
EOF

# 서버 실행
uvicorn main:app --reload --port 8000
```

### 4. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정 (.env)
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
EOF

# 개발 서버 실행
npm start
```

---

## 사용 방법

### Backend API 사용

#### 1. 학습 세션 시작

```python
import requests

# 새 세션 시작
response = requests.post(
    'http://localhost:8000/api/fatigue/sessions',
    json={
        'student_id': 'uuid-student-123',
        'module_id': 'uuid-module-456'
    }
)

session = response.json()
session_id = session['id']
```

#### 2. 피로도 측정 기록

```python
# 학습 활동마다 피로도 측정 (2-3분마다)
response = requests.post(
    'http://localhost:8000/api/fatigue/metrics',
    json={
        'session_id': session_id,
        'complexity_level': 3,  # 1-5
        'problems_completed': 5,
        'correct_answers': 4,
        'response_times': [45.2, 52.1, 38.5, 60.3, 48.7],  # seconds
        'interaction_count': 12
    }
)

metric = response.json()
print(f"피로도: {metric['fatigue_score']}/100")
print(f"레벨: {metric['fatigue_level']}/5")
print(f"권장사항: {metric['recommendation']}")
```

#### 3. 휴식 수락 및 완료

```python
# 휴식 수락
recommendation_id = 'uuid-recommendation-789'
requests.put(f'http://localhost:8000/api/fatigue/breaks/{recommendation_id}/accept')

# 휴식 완료
requests.put(
    f'http://localhost:8000/api/fatigue/breaks/{recommendation_id}/complete',
    json={
        'actual_duration_minutes': 10,
        'activities': ['stretch', 'walk', 'hydrate']
    }
)
```

### Frontend 컴포넌트 사용

#### 기본 통합

```tsx
import FatigueMonitoringContainer from './components/fatigue/FatigueMonitoringContainer';

function LearningModule() {
  const studentId = 'uuid-student-123';
  const moduleId = 'uuid-module-456';

  return (
    <FatigueMonitoringContainer
      studentId={studentId}
      moduleId={moduleId}
      onMetricUpdate={(score) => {
        console.log('Current fatigue:', score);
      }}
    >
      {/* 학습 콘텐츠 */}
      <YourLearningContent />
    </FatigueMonitoringContainer>
  );
}
```

#### 커스텀 통합

```tsx
import { useFatigueMonitoring } from './hooks/useFatigueMonitoring';
import FatigueIndicator from './components/fatigue/FatigueIndicator';

function CustomLearningModule() {
  const {
    fatigueState,
    recordMetric,
    currentRecommendation
  } = useFatigueMonitoring('student-id');

  // 학습 활동마다 호출
  const handleProblemCompleted = (problemData) => {
    recordMetric({
      complexityLevel: problemData.difficulty,
      problemsCompleted: 1,
      correctAnswers: problemData.isCorrect ? 1 : 0,
      responseTimes: [problemData.timeSpent],
      interactionCount: problemData.clicks
    });
  };

  return (
    <div>
      <FatigueIndicator
        fatigueScore={fatigueState.fatigueScore}
        fatigueLevel={fatigueState.fatigueLevel}
        trend={fatigueState.trend}
      />

      {/* 학습 UI */}
    </div>
  );
}
```

---

## 피로도 계산 알고리즘

### 수식

```
Fatigue Score (0-100) = weighted sum of:
  - Base Fatigue (40%): 세션 지속 시간 기반
  - Complexity Load (25%): 문제 난이도 기반
  - Error Impact (20%): 오답률 기반
  - Pace Pressure (15%): 학습 속도 압박도

Final Score = Raw Score × Circadian Modifier × Interaction Modifier
```

### 피로도 레벨

| 레벨 | 점수 범위 | 상태 | 권장 조치 |
|------|-----------|------|-----------|
| 1 | 0-30 | 최상 (Fresh) | 학습 계속 |
| 2 | 31-50 | 양호 (Mild) | 모니터링 |
| 3 | 51-70 | 주의 (Moderate) | 5분 휴식 권장 |
| 4 | 71-85 | 피로 (High) | 15분 휴식 필요 |
| 5 | 86-100 | 위험 (Exhaustion) | 30분 휴식 필수 |

### 휴식 유형

- **Micro (2-3분)**: 눈 운동, 간단한 스트레칭
- **Short (5-10분)**: 걷기, 수분 섭취, 스트레칭
- **Medium (15-20분)**: 산책, 간식, 전신 스트레칭
- **Long (30+분)**: 실외 활동, 식사, 적극적 휴식

---

## API 레퍼런스

### 세션 관리

```
POST   /api/fatigue/sessions          - 새 세션 시작
GET    /api/fatigue/sessions/{id}     - 세션 상세 조회
PUT    /api/fatigue/sessions/{id}/end - 세션 종료
GET    /api/fatigue/sessions/active   - 활성 세션 목록
```

### 측정 기록

```
POST   /api/fatigue/metrics            - 피로도 측정 기록
GET    /api/fatigue/metrics/{session}  - 세션 측정 기록 조회
```

### 휴식 관리

```
POST   /api/fatigue/breaks/recommend         - 휴식 권장
PUT    /api/fatigue/breaks/{id}/accept       - 휴식 수락
PUT    /api/fatigue/breaks/{id}/dismiss      - 휴식 거절
PUT    /api/fatigue/breaks/{id}/complete     - 휴식 완료
```

### WebSocket

```
WS     /api/fatigue/realtime/{session}  - 실시간 업데이트
```

**이벤트:**
- `fatigue_updated`: 피로도 변경
- `break_recommended`: 휴식 권장
- `break_reminder`: 휴식 리마인더
- `recovery_progress`: 회복 진행률

---

## 설정 옵션

### 환경 변수

```bash
# 데이터베이스
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# 피로도 측정
METRIC_INTERVAL=120              # 측정 간격 (초)
AUTO_BREAK=true                  # 자동 휴식 권장
MANDATORY_BREAK_THRESHOLD=85     # 강제 휴식 임계값

# 세션
MAX_SESSION_DURATION=180         # 최대 세션 시간 (분)
IDLE_TIMEOUT=15                  # 유휴 타임아웃 (분)

# 휴식 시간
MICRO_BREAK_DURATION=3           # Micro 휴식 (분)
SHORT_BREAK_DURATION=10          # Short 휴식 (분)
MEDIUM_BREAK_DURATION=15         # Medium 휴식 (분)
LONG_BREAK_DURATION=30           # Long 휴식 (분)

# 알림
BREAK_REMINDER=true              # 휴식 리마인더 활성화
REMINDER_INTERVAL=10             # 리마인더 간격 (분)
MAX_REMINDERS=3                  # 최대 리마인더 횟수

# 개인화
CALIBRATION_SESSIONS=10          # 프로필 보정 세션 수
ADAPTIVE_THRESHOLD=true          # 적응형 임계값
```

---

## 테스트

### Backend 테스트

```bash
cd backend
pytest tests/fatigue/ -v
```

### Frontend 테스트

```bash
cd frontend
npm test -- --coverage
```

---

## 성능 최적화

### 데이터베이스

- 인덱스가 적용된 쿼리 사용
- 세션/학생 ID에 복합 인덱스
- 시계열 데이터 파티셔닝 (대용량 시)

### WebSocket

- Redis Pub/Sub로 다중 인스턴스 확장
- 연결당 heartbeat로 유효성 확인
- 학생당 최대 연결 수 제한

### 프론트엔드

- 피로도 표시 컴포넌트 메모이제이션
- WebSocket 재연결 로직
- 로컬 상태 캐싱

---

## 모니터링 및 분석

### 주요 메트릭

```python
# 학생 분석 조회
response = requests.get(
    f'/api/fatigue/analytics/{student_id}',
    params={
        'start_date': '2024-01-01',
        'end_date': '2024-01-31'
    }
)

analytics = response.json()
print(f"평균 피로도: {analytics['average_fatigue_score']}")
print(f"휴식 준수율: {analytics['break_compliance_rate']}%")
print(f"최적 학습 시간: {analytics['optimal_learning_hours']}")
```

### 대시보드 메트릭

- 평균 세션 피로도
- 휴식 준수율
- 시간대별 피로도 패턴
- 모듈별 피로도 비교

---

## 문제 해결

### WebSocket 연결 실패

```bash
# Redis 확인
redis-cli ping

# 방화벽 설정 확인
sudo ufw allow 8000
```

### 피로도 계산 오류

```python
# 로그 확인
tail -f logs/fatigue.log

# 디버그 모드 활성화
DEBUG=true python -m uvicorn main:app
```

### 데이터베이스 마이그레이션 실패

```bash
# 롤백
psql -d education_db -c "DROP SCHEMA fatigue CASCADE;"

# 재실행
psql -d education_db -f database/migrations/001_fatigue_monitoring_schema.sql
```

---

## 로드맵

### Phase 1 (현재) ✅
- [x] 핵심 피로도 계산 알고리즘
- [x] 실시간 WebSocket 연동
- [x] 기본 휴식 권장 시스템
- [x] React 컴포넌트

### Phase 2 (다음 단계)
- [ ] 머신러닝 기반 개인화
- [ ] 학부모 알림 통합
- [ ] 모바일 앱 지원
- [ ] A/B 테스트 프레임워크

### Phase 3 (장기)
- [ ] 웨어러블 기기 통합 (심박수, 활동량)
- [ ] AI 코칭 시스템
- [ ] 게임화 요소 (휴식 뱃지, 리워드)
- [ ] 다국어 지원

---

## 기여 가이드

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조

---

## 지원 및 문의

- 📧 Email: support@kaist-touchmath.edu
- 📖 Documentation: https://docs.kaist-touchmath.edu/fatigue
- 🐛 Issues: https://github.com/kaist-touchmath/issues

---

## 참고 자료

- [Pomodoro Technique](https://francescocirillo.com/pages/pomodoro-technique)
- [20-20-20 Rule for Eyes](https://www.aao.org/eye-health/tips-prevention/computer-usage)
- [Cognitive Load Theory](https://en.wikipedia.org/wiki/Cognitive_load)
- [Circadian Rhythm and Learning](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6314462/)
