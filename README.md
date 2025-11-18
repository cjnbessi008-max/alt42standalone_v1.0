# Mental Care Messaging System for LMS

학생의 학습 속도를 모니터링하고 속도 감소 시 멘탈 케어 메시지를 제공하는 실시간 시스템

## 📋 개요

이 시스템은 LMS(Learning Management System)와 연동하여 학생들의 학습 속도를 실시간으로 분석하고, 학습 속도가 감소하거나 어려움을 겪을 때 자동으로 격려와 조언 메시지를 제공합니다.

### 주요 기능

- ✅ **실시간 학습 속도 분석**: 30분 단위로 학생의 학습 속도를 추적
- 📊 **다중 지표 모니터링**: 속도, 정확도, 세션 시간, 힌트 사용 등
- 💬 **자동 멘탈 케어 메시지**: 한국어/영어 이중 언어 지원
- 🔔 **WebSocket 실시간 알림**: 즉각적인 메시지 전달
- 📈 **학습 패턴 분석**: 연속 오답, 문제 막힘, 장시간 학습 감지
- 💡 **맞춤형 조언**: 상황에 맞는 학습 전략 제안

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                       │
│  - Mental Care Message Card                             │
│  - Notification Container                               │
│  - WebSocket Client                                     │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API / WebSocket
┌───────────────────▼─────────────────────────────────────┐
│              API Gateway (FastAPI)                       │
│  - Progress Tracking API                                │
│  - Mental Care Messaging API                            │
│  - WebSocket Handler                                    │
└───────┬──────────────────────┬──────────────────────────┘
        │                      │
┌───────▼─────────┐   ┌───────▼──────────────────┐
│ Learning Speed  │   │ Mental Care Message      │
│ Analyzer        │   │ Generator                │
│ (Python)        │   │ (Python)                 │
└─────────────────┘   └──────────────────────────┘
        │                      │
┌───────▼──────────────────────▼──────────────────┐
│          PostgreSQL Database                     │
│  - student_progress                              │
│  - student_attempts                              │
│  - learning_speed_metrics                        │
│  - mental_care_messages_sent                     │
└──────────────────────────────────────────────────┘
```

## 🚀 시작하기

### 필수 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (선택사항, 캐싱용)

### 데이터베이스 설정

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE mental_care_db;

# 스키마 적용
\c mental_care_db
\i database/schemas/student_progress_tracking.sql
```

### 백엔드 설치 및 실행

```bash
# 가상환경 생성
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력

# API 서버 실행
cd api-gateway
python progress_api.py
```

서버는 `http://localhost:8000` 에서 실행됩니다.

### 프론트엔드 설치 및 실행

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

프론트엔드는 `http://localhost:3000` 에서 실행됩니다.

## 📚 API 문서

### REST API Endpoints

#### 1. 학습 시도 제출
```http
POST /api/attempts/submit
Content-Type: application/json

{
  "student_id": "uuid",
  "module_id": "uuid",
  "problem_id": "uuid",
  "is_correct": true,
  "time_spent_seconds": 120,
  "hints_used": 0,
  "attempts_count": 1,
  "difficulty_level": 3
}
```

**응답**:
```json
{
  "student_id": "uuid",
  "module_id": "uuid",
  "current_speed_score": 12.5,
  "accuracy_rate": 0.85,
  "speed_trend": "decreasing",
  "problems_in_window": 5,
  "triggers_detected": ["speed_decrease_40%"],
  "message_sent": {
    "message_id": "uuid",
    "message_type": "encouragement",
    "text_ko": "조금 천천히 가도 괜찮아요...",
    "text_en": "It's okay to slow down...",
    "severity": "medium",
    "recommended_actions": ["encourage", "suggest_strategy"]
  }
}
```

#### 2. 학습 진도 조회
```http
GET /api/progress/{student_id}/{module_id}
```

#### 3. 메시지 피드백 제출
```http
POST /api/messages/feedback
Content-Type: application/json

{
  "message_id": "uuid",
  "student_id": "uuid",
  "reaction": "helpful"  // helpful | not_helpful | neutral
}
```

### WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/{student_id}');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'mental_care_message') {
    // 메시지 처리
    console.log(message.data.text_ko);
  }
};
```

## 🎯 트리거 조건

시스템은 다음 조건에서 멘탈 케어 메시지를 전송합니다:

| 트리거 | 조건 | 심각도 | 메시지 유형 |
|--------|------|--------|-------------|
| 속도 감소 (경미) | 20% 감소 | Low | 격려 |
| 속도 감소 (보통) | 40% 감소 | Medium | 전략 팁 |
| 속도 감소 (심각) | 60% 감소 | High | 휴식 제안 |
| 연속 오답 | 4문제 이상 | Medium | 격려 + 힌트 |
| 장시간 학습 | 90분 이상 | Medium | 휴식 제안 |
| 낮은 정확도 | 50% 미만 | Medium | 전략 팁 |
| 문제 막힘 | 15분 이상 | Medium | 힌트 제안 |

## 💬 메시지 예시

### 한국어 메시지
- **격려**: "잠깐! 조금 천천히 풀고 있는 것 같아요. 괜찮아요, 속도보다 이해가 더 중요해요! 😊"
- **휴식 제안**: "와! 오랜 시간 열심히 했네요! 👏 이제 잠깐 쉬는 시간을 가지는 게 어떨까요?"
- **전략 팁**: "이 문제가 까다롭나봐요. 비슷한 예제를 먼저 확인해보거나, 힌트를 사용해보는 건 어떨까요? 💡"
- **축하**: "속도가 빨라지고 있어요! 정말 잘하고 있어요! 계속 이렇게 해봐요! 🎉"

### English Messages
- **Encouragement**: "Taking your time? That's okay! Understanding is more important than speed! 😊"
- **Break Suggestion**: "Wow! You've been working hard for a long time! 👏 How about a short break?"
- **Strategy Tip**: "This problem seems tricky. How about checking similar examples first, or using a hint? 💡"
- **Celebration**: "Your speed is improving! You're doing great! Keep it up! 🎉"

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend
pytest tests/
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

### 수동 테스트

학습 속도 분석기 테스트:
```bash
cd backend/services/progress-tracking
python learning_speed_analyzer.py
```

메시지 생성기 테스트:
```bash
cd backend/services/mental-care-messaging
python message_generator.py
```

## 📊 데이터베이스 스키마

주요 테이블:
- `students`: 학생 정보
- `modules`: 학습 모듈
- `student_progress`: 전체 진도 추적
- `student_attempts`: 개별 문제 시도 기록
- `learning_speed_metrics`: 학습 속도 집계
- `mental_care_messages_sent`: 전송된 메시지 로그

## 🔧 설정

`config/mental-care.config.json` 파일에서 시스템 설정을 변경할 수 있습니다:

```json
{
  "analyzer": {
    "time_window_minutes": 30,
    "thresholds": {
      "speed_decrease_moderate": 0.40,
      "long_session_minutes": 90
    }
  },
  "messaging": {
    "default_language": "ko"
  }
}
```

## 🌐 프론트엔드 컴포넌트 사용법

### MentalCareMessageCard

개별 메시지를 표시하는 컴포넌트:

```tsx
import MentalCareMessageCard from './components/MentalCareMessageCard';

<MentalCareMessageCard
  message={message}
  language="ko"
  studentId={studentId}
  showFeedback={true}
  onClose={() => handleClose()}
/>
```

### MentalCareNotificationContainer

실시간 메시지를 관리하는 컨테이너:

```tsx
import MentalCareNotificationContainer from './components/MentalCareNotificationContainer';

<MentalCareNotificationContainer
  studentId={studentId}
  language="ko"
  maxVisibleMessages={3}
  autoHideDelay={0}
/>
```

## 📈 분석 및 모니터링

### 시스템 상태 확인
```http
GET /api/admin/system-status
```

### 메시지 효과성 분석
```http
GET /api/analytics/message-effectiveness?days=30
```

### 학습 속도 트렌드
```http
GET /api/analytics/speed-trends/{student_id}/{module_id}?days=7
```

## 🔐 보안 고려사항

- JWT 인증 (향후 추가 예정)
- HTTPS/WSS 프로토콜 사용
- CORS 설정 적용
- Rate Limiting 적용
- SQL Injection 방지 (Parameterized queries)
- XSS 방지 (Output encoding)

## 📝 라이센스

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 👥 기여

이 시스템은 다음 PRD를 기반으로 개발되었습니다:
- `tasks/0001-prd-ai-education-pipeline.md`

## 📞 문의

- 기술 문의: Development Team
- 교육 문의: Educational Team Lead
- 제품 문의: Product Owner

## 🗺️ 로드맵

### Phase 1 (현재)
- ✅ 학습 속도 분석 엔진
- ✅ 멘탈 케어 메시지 시스템
- ✅ 실시간 WebSocket 알림
- ✅ 프론트엔드 UI 컴포넌트

### Phase 2 (계획 중)
- [ ] 데이터베이스 연동 완료
- [ ] JWT 인증 시스템
- [ ] 관리자 대시보드
- [ ] 분석 대시보드 (차트/그래프)
- [ ] A/B 테스트 프레임워크

### Phase 3 (향후)
- [ ] 머신러닝 기반 개인화
- [ ] 다국어 지원 확장 (중국어, 일본어)
- [ ] 음성 메시지 지원
- [ ] 모바일 앱 통합

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Status**: Development
