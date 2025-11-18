# 자동 난이도 조정 및 자신감 회복 시스템

## 개요

LMS와 연동하여 학생이 어려움을 겪을 때 자동으로 감지하고, 문제 난이도를 하향 조정하여 자신감을 회복시키는 시스템입니다.

## 주요 기능

### 1. 자동 감지 시스템
- **연속 오답 감지**: 3회 이상 연속 오답 시 자동 알림
- **정답률 모니터링**: 정답률 30% 미만 시 개입
- **신뢰도 점수 추적**: 0-100 점수로 학생 자신감 측정
- **소요 시간 분석**: 목표 시간의 2배 초과 시 알림

### 2. 자신감 회복 프로세스
1. **즉시 난이도 하향**: 현재 난이도에서 2단계 낮은 문제 제공
2. **성공 경험 축적**: 쉬운 문제로 연속 3개 정답 달성
3. **점진적 복귀**: 원래 난이도로 1단계씩 상향
4. **완료 및 축하**: 원래 난이도 복귀 완료

### 3. LMS 연동
- 웹훅을 통한 실시간 성과 데이터 수신
- LMS 점수 추세 자동 분석
- 하향 추세 감지 및 추천 생성
- 교사 알림 자동 전송

## 프로젝트 구조

```
alt42standalone_v1.0/
├── docs/
│   └── auto-difficulty-downward-adjustment.md  # 상세 설계 문서
├── database/
│   └── schema_confidence_system.sql            # PostgreSQL 스키마
├── backend/
│   ├── services/
│   │   └── confidence_recovery_service.py      # 핵심 비즈니스 로직
│   └── api/
│       └── confidence_recovery_api.py          # FastAPI 엔드포인트
└── frontend/
    └── src/
        └── components/
            ├── ConfidenceRecoveryNotification.tsx  # 알림 컴포넌트
            ├── ConfidenceRecoveryNotification.css
            ├── RecoveryProgressWidget.tsx          # 진행 상황 위젯
            └── RecoveryProgressWidget.css
```

## 설치 및 설정

### 1. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb kaist_education_system

# 스키마 적용
psql kaist_education_system < database/schema_confidence_system.sql
```

### 2. 백엔드 설정

```bash
# Python 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install fastapi uvicorn pydantic psycopg2-binary redis

# 개발 서버 실행
cd backend
uvicorn api.confidence_recovery_api:router --reload --port 8000
```

### 3. 프론트엔드 설정

```bash
# Node.js 패키지 설치
cd frontend
npm install

# 개발 서버 실행
npm start
```

## API 엔드포인트

### 신뢰도 확인
```http
GET /api/confidence-recovery/students/{student_id}/confidence-check?module_id={module_id}
```

**응답:**
```json
{
  "needs_intervention": true,
  "current_confidence_score": 45,
  "recommended_action": "difficulty_downward",
  "recommended_difficulty": 2,
  "current_difficulty": 4,
  "trigger_reason": "consecutive_failures",
  "failure_count": 4,
  "estimated_time_minutes": 20
}
```

### 난이도 조정 적용
```http
POST /api/confidence-recovery/students/{student_id}/apply-difficulty-adjustment?module_id={module_id}
```

**요청:**
```json
{
  "adjustment_type": "downward",
  "target_difficulty": 2,
  "reason": "confidence_recovery"
}
```

### 시도 제출
```http
POST /api/confidence-recovery/students/{student_id}/submit-attempt?module_id={module_id}
```

**요청:**
```json
{
  "problem_id": "prob_001",
  "is_correct": true,
  "time_spent": 120,
  "hint_used": false
}
```

### LMS 웹훅
```http
POST /api/confidence-recovery/lms/webhook/student-performance
```

**요청:**
```json
{
  "lms_student_id": "kaist_2024_12345",
  "course_id": "MATH101_2024F",
  "recent_scores": [85, 60, 45, 42],
  "timestamp": "2025-11-18T10:30:00Z"
}
```

## 사용 방법

### 프론트엔드 컴포넌트 통합

```tsx
import ConfidenceRecoveryNotification from './components/ConfidenceRecoveryNotification';
import RecoveryProgressWidget from './components/RecoveryProgressWidget';

function StudentDashboard({ studentId, moduleId }) {
  return (
    <div>
      {/* 자신감 회복 알림 */}
      <ConfidenceRecoveryNotification
        studentId={studentId}
        moduleId={moduleId}
        onAccept={() => console.log('회복 모드 시작')}
        onDecline={() => console.log('나중에')}
      />

      {/* 회복 진행 상황 */}
      <RecoveryProgressWidget
        studentId={studentId}
        moduleId={moduleId}
        refreshInterval={5000}
      />
    </div>
  );
}
```

## 알고리즘 상세

### 신뢰도 점수 계산

```python
새 점수 = 이전 점수 × 0.9 + 정답 보너스 + 속도 보너스

정답 보너스:
  - 정답: +10
  - 오답: -15

속도 보너스 (정답인 경우만):
  = min(5, (목표시간 - 실제시간) / 목표시간 × 10)
```

### 난이도 조정 트리거

| 조건 | 임계값 | 조치 |
|------|--------|------|
| 연속 오답 | 3회 이상 | 2단계 하향 |
| 정답률 저하 | 30% 미만 | 2단계 하향 |
| 신뢰도 저하 | 40점 미만 | 2-3단계 하향 |
| 소요 시간 과다 | 목표의 2배 초과 | 1단계 하향 |

### 회복 경로 예시

현재 난이도 4 → 목표 난이도 4

1. **즉시 하향 (난이도 2)**: 연속 3개 정답 필요
2. **점진적 복귀 (난이도 3)**: 연속 2개 정답 필요
3. **원래 난이도 복귀 (난이도 4)**: 연속 2개 정답 필요
4. **완료**: 자신감 회복 성공

## LMS 연동 예시

### Canvas LMS 연동

```python
# Canvas 웹훅 설정
webhook_url = "https://your-domain.com/api/confidence-recovery/lms/webhook/student-performance"

# Canvas에서 자동으로 POST 요청 전송
# - 과제 제출 시
# - 퀴즈 완료 시
# - 성적 입력 시
```

### KAIST LMS 연동

```python
# KAIST SSO 인증 후 API 호출
import requests

response = requests.post(
    "https://your-domain.com/api/confidence-recovery/lms/webhook/student-performance",
    json={
        "lms_student_id": "kaist_2024_12345",
        "course_id": "MATH101_2024F",
        "recent_scores": [85, 60, 45],
        "timestamp": "2025-11-18T10:30:00Z"
    },
    headers={"Authorization": f"Bearer {access_token}"}
)
```

## 데이터베이스 스키마

### 주요 테이블

#### student_confidence
학생별 신뢰도 및 난이도 정보

```sql
- student_id: 학생 ID
- module_id: 모듈 ID
- confidence_score: 신뢰도 점수 (0-100)
- current_difficulty: 현재 난이도 (1-5)
- consecutive_failures: 연속 실패 횟수
- in_recovery_mode: 회복 모드 여부
```

#### recovery_path
회복 경로 진행 상황

```sql
- student_id: 학생 ID
- module_id: 모듈 ID
- path_data: 회복 경로 JSON
- progress_percentage: 진행률
- status: 상태 (active/completed/abandoned)
```

#### lms_integration_log
LMS 연동 로그

```sql
- lms_student_id: LMS 학생 ID
- payload: 수신 데이터 JSON
- recommendation_data: 추천 데이터 JSON
- processing_status: 처리 상태
```

## 성능 지표

### 목표 지표

- **자동 감지 정확도**: 90% 이상
- **거짓 양성률**: 10% 미만
- **평균 회복 시간**: 20분 이내
- **복귀 성공률**: 80% 이상
- **학생 만족도**: 4.0/5.0 이상

### 모니터링 쿼리

```sql
-- 회복 성공률
SELECT
  COUNT(CASE WHEN status = 'completed' THEN 1 END)::FLOAT /
  COUNT(*) * 100 as success_rate
FROM recovery_path
WHERE started_at >= CURRENT_DATE - INTERVAL '7 days';

-- 평균 신뢰도 점수 변화
SELECT
  AVG(confidence_gain) as avg_confidence_gain
FROM recovery_path
WHERE status = 'completed';
```

## 테스트

### 단위 테스트

```bash
# Python 테스트
pytest backend/tests/test_confidence_recovery.py

# JavaScript 테스트
npm test
```

### 통합 테스트

```python
# 시나리오 테스트
python backend/tests/integration/test_recovery_flow.py
```

## 트러블슈팅

### 문제: 알림이 표시되지 않음
- 신뢰도 점수 확인: 40점 이상이면 알림 표시 안 됨
- API 응답 확인: 네트워크 탭에서 `/ui-notification` 응답 확인

### 문제: 난이도 조정이 적용되지 않음
- 데이터베이스 연결 확인
- `student_confidence` 테이블 업데이트 확인

### 문제: LMS 웹훅이 작동하지 않음
- 웹훅 URL 확인
- 방화벽/CORS 설정 확인
- `lms_integration_log` 테이블에서 에러 로그 확인

## 향후 개선 사항

### Phase 2 (4주 후)
- [ ] 머신러닝 기반 예측 모델
- [ ] 개인화된 회복 전략
- [ ] 게임화 요소 추가 (배지, 레벨업)

### Phase 3 (8주 후)
- [ ] 다중 LMS 지원 (Canvas, Moodle, Blackboard)
- [ ] 실시간 협업 학습 추천
- [ ] 교사 대시보드 고도화

## 기여

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

MIT License

## 문의

- 프로젝트 관리자: KAIST Touch Math Academy
- 이슈 트래커: GitHub Issues
- 이메일: support@kaist-touchmath.edu

## 참고 자료

- [PRD 문서](tasks/0001-prd-ai-education-pipeline.md)
- [상세 설계 문서](docs/auto-difficulty-downward-adjustment.md)
- [API 문서](http://localhost:8000/docs) (서버 실행 후)
