# AI Education System - Concentration Tracking & Easy Problem Bypass

> **LMS 연동 웹앱**: 학생의 집중력이 떨어졌을 때 자동으로 쉬운 문제를 추천하는 지능형 학습 시스템

## 🎯 프로젝트 개요

이 프로젝트는 KAIST Touch Math Academy를 위한 AI 교육 시스템의 핵심 기능 중 하나인 **집중력 추적 및 난이도 자동 조절** 기능을 구현합니다.

### 주요 기능

1. **실시간 집중력 모니터링**
   - 문제 풀이 시간 분석
   - 정답률 추적
   - 상호작용 패턴 분석
   - 집중력 점수 실시간 계산 (0.0 ~ 1.0)

2. **자동 난이도 조절**
   - 집중력 저하 감지 (임계값: 0.40)
   - 반복적인 오답 감지 (3회 이상)
   - 과도한 시간 소요 감지 (5분 이상)

3. **쉬운 문제 우회 제안**
   - 학생에게 친화적인 UI로 제안
   - 현재 난이도에서 1-2단계 낮은 문제 추천
   - 학생이 선택 가능 (수락/거부)

4. **학습 효과 추적**
   - 우회 이벤트 로그
   - 성공률 분석
   - 교사 대시보드용 통계

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React + TypeScript)           │
│  • ConcentrationIndicator 컴포넌트                       │
│  • BypassPrompt 컴포넌트                                 │
│  • useConcentrationTracking Hook                         │
└───────────────────┬─────────────────────────────────────┘
                    │ REST API
┌───────────────────▼─────────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│  • /api/concentration/* 엔드포인트                       │
│  • concentration-service.js (집중력 계산 로직)           │
└───────────┬────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────┐
│                PostgreSQL Database                       │
│  • student_attempts (시도 기록 + 메트릭)                │
│  • concentration_scores (집중력 점수)                    │
│  • bypass_events (우회 이벤트 로그)                     │
│  • concentration_thresholds (임계값 설정)               │
└─────────────────────────────────────────────────────────┘
```

## 📊 데이터 모델

### 집중력 점수 계산 알고리즘

```javascript
concentrationScore =
  timeEfficiencyScore  × 0.25 +  // 시간 효율성
  successRateScore     × 0.35 +  // 정답률
  engagementScore      × 0.20 +  // 참여도 (상호작용 빈도)
  focusScore           × 0.20    // 집중 유지 (탭 전환, 일시정지)
```

### 우회 트리거 조건

- `concentrationScore < 0.40` (집중력 저하)
- `failureCount >= 3` (연속 오답 3회 이상)
- `avgTimeSpent > 300초` (평균 5분 이상 소요)

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- npm 또는 yarn

### 설치

1. **데이터베이스 설정**

```bash
# PostgreSQL 데이터베이스 생성
createdb ai_education

# 마이그레이션 실행
psql -d ai_education -f database/migrations/001_concentration_tracking_schema.sql
```

2. **백엔드 설정**

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp ../.env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력

# 서버 시작
npm run dev
```

3. **프론트엔드 설정**

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 테스트

백엔드 서버: http://localhost:3000
프론트엔드 앱: http://localhost:5173

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConcentrationIndicator.tsx  # 집중력 표시 UI
│   │   │   └── BypassPrompt.tsx            # 우회 제안 다이얼로그
│   │   ├── hooks/
│   │   │   └── useConcentrationTracking.ts # 집중력 추적 Hook
│   │   └── ...
│   └── package.json
├── backend/                     # Node.js 백엔드
│   ├── routes/
│   │   └── concentration.js    # 집중력 API 라우트
│   ├── services/
│   │   └── concentration-service.js  # 집중력 계산 로직
│   ├── server.js              # Express 서버
│   └── package.json
├── database/                    # 데이터베이스
│   └── migrations/
│       └── 001_concentration_tracking_schema.sql
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # PRD 문서
└── README.md
```

## 🔌 API 엔드포인트

### 집중력 조회

```http
GET /api/concentration/:studentId/:moduleId
```

학생의 현재 집중력 상태를 조회합니다.

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "studentId": "uuid",
    "moduleId": "uuid",
    "currentConcentrationScore": 0.65,
    "timeEfficiencyScore": 0.80,
    "successRateScore": 0.60,
    "engagementScore": 0.70,
    "focusScore": 0.50,
    "shouldOfferBypass": false
  }
}
```

### 집중력 점수 계산

```http
POST /api/concentration/calculate
Content-Type: application/json

{
  "studentId": "uuid",
  "moduleId": "uuid",
  "recentAttemptsWindow": 5
}
```

최근 시도를 기반으로 집중력 점수를 새로 계산합니다.

### 우회 필요 여부 확인

```http
POST /api/concentration/check-bypass
Content-Type: application/json

{
  "studentId": "uuid",
  "moduleId": "uuid",
  "currentProblemId": "uuid"
}
```

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "shouldOffer": true,
    "triggerReason": "low_concentration",
    "concentrationScore": 0.35,
    "failureCount": 2,
    "avgTimeSpent": 180,
    "threshold": 0.40,
    "difficultyReduction": 1
  }
}
```

### 우회 제안

```http
POST /api/concentration/offer-bypass
Content-Type: application/json

{
  "studentId": "uuid",
  "moduleId": "uuid",
  "originalProblemId": "uuid",
  "originalDifficulty": 3,
  "triggerReason": "low_concentration",
  "concentrationScore": 0.35
}
```

쉬운 문제를 선택하고 우회 이벤트를 로그에 기록합니다.

### 우회 수락/거부

```http
PUT /api/concentration/bypass/:bypassEventId/accept
PUT /api/concentration/bypass/:bypassEventId/decline
```

### 우회 완료

```http
PUT /api/concentration/bypass/:bypassEventId/complete
Content-Type: application/json

{
  "success": true,
  "returnToOriginal": false
}
```

## 💡 사용 예시

### React 컴포넌트에서 사용

```tsx
import React from 'react';
import { useConcentrationTracking } from './hooks/useConcentrationTracking';
import ConcentrationIndicator from './components/ConcentrationIndicator';
import BypassPrompt from './components/BypassPrompt';

function ProblemSolver({ studentId, moduleId, problem }) {
  const {
    concentrationScore,
    bypassOffer,
    showBypassPrompt,
    acceptBypass,
    declineBypass,
    startProblem,
    trackInteraction,
    checkAndOfferBypass
  } = useConcentrationTracking(studentId, moduleId);

  React.useEffect(() => {
    startProblem(problem.id);
  }, [problem.id]);

  const handleSubmitAnswer = async (answer) => {
    // 답안 제출 로직
    // ...

    // 우회 필요 여부 확인
    await checkAndOfferBypass(problem.id, problem.difficulty);
  };

  return (
    <div>
      {concentrationScore && (
        <ConcentrationIndicator
          score={concentrationScore.score}
          timeEfficiencyScore={concentrationScore.timeEfficiencyScore}
          successRateScore={concentrationScore.successRateScore}
          engagementScore={concentrationScore.engagementScore}
          focusScore={concentrationScore.focusScore}
          showDetails
        />
      )}

      {/* 문제 풀이 UI */}
      <div onClick={trackInteraction}>
        {/* 문제 내용 */}
      </div>

      {showBypassPrompt && bypassOffer && (
        <BypassPrompt
          open={showBypassPrompt}
          triggerReason={bypassOffer.bypassEvent.trigger_reason}
          originalDifficulty={bypassOffer.bypassEvent.original_difficulty}
          bypassDifficulty={bypassOffer.easierProblem.difficulty_level}
          concentrationScore={bypassOffer.bypassEvent.concentration_score}
          onAccept={acceptBypass}
          onDecline={declineBypass}
        />
      )}
    </div>
  );
}
```

## 🎨 UI 컴포넌트

### ConcentrationIndicator

학생의 집중력 상태를 시각적으로 표시합니다.

**특징:**
- 그라데이션 배경으로 시각적 매력
- 퍼센트 기반 프로그레스 바
- 상세 메트릭 표시 옵션
- 색상 코딩 (녹색: 우수, 주황: 보통, 빨강: 저하)

### BypassPrompt

쉬운 문제로 우회를 제안하는 다이얼로그입니다.

**특징:**
- 트리거 이유별 맞춤 메시지
- 난이도 비교 시각화
- 친화적인 UI/UX
- 학생이 선택 가능 (수락/거부)

## 📈 모니터링 및 분석

### 데이터베이스 뷰

시스템은 다음과 같은 유용한 뷰를 제공합니다:

**student_concentration_status**: 학생별 현재 집중력 상태

```sql
SELECT * FROM student_concentration_status
WHERE student_id = 'uuid';
```

**bypass_statistics**: 모듈별 우회 통계

```sql
SELECT * FROM bypass_statistics
WHERE module_id = 'uuid';
```

## 🔒 보안 고려사항

- Rate limiting: 15분당 100 요청
- CORS 설정으로 허용된 origin만 접근 가능
- Helmet.js로 보안 헤더 설정
- SQL Injection 방지 (파라미터화된 쿼리)
- 입력 검증 (Joi 사용 권장)

## 🚧 향후 개선사항

- [ ] JWT 인증 추가
- [ ] WebSocket을 통한 실시간 집중력 업데이트
- [ ] 머신러닝 기반 집중력 예측
- [ ] A/B 테스팅 프레임워크
- [ ] 교사 대시보드 UI
- [ ] 모바일 앱 지원
- [ ] 다국어 지원 (i18n)

## 📝 라이센스

MIT License

## 👥 기여

KAIST Touch Math Academy 팀

## 📞 문의

이슈나 질문이 있으시면 GitHub Issues를 이용해주세요.

---

**Built with ❤️ for better education**
