# Product Requirements Document: MathFlow - 수포자 중독형 수학 웹앱

## 1. Introduction/Overview

### Background
대한민국 중·고등학교에는 "수포자(수학을 포기한 자)"가 지속적으로 증가하고 있습니다. 전통적인 수학 교육은 즉각적인 피드백과 보상이 부족하여, 학생들이 수학 학습에 흥미를 잃고 동기를 상실하게 됩니다.

MathFlow는 게임의 중독성 메커니즘을 수학 교육에 접목하여, 수포자들이 다시 수학에 흥미를 느끼고 자발적으로 학습할 수 있도록 설계된 혁신적인 웹 애플리케이션입니다.

### Problem Statement
현재 수포자들이 겪는 주요 문제:
- **즉각적인 보상 부재**: 문제를 풀어도 성취감이 없음
- **단조로운 학습 경험**: 반복적이고 지루한 문제 풀이
- **추상적인 개념**: 이차방정식, 함수 등 개념이 머릿속에서 구체화되지 않음
- **낮은 자존감**: 연속적인 실패로 인한 학습 의욕 상실
- **즉각적 피드백 부족**: 틀렸을 때 왜 틀렸는지 이해하기 어려움

### Solution
MathFlow는 다음과 같은 혁신적 접근을 통해 문제를 해결합니다:

1. **실시간 시각적 애니메이션 변환**: 풀이 과정마다 즉각적인 시각 효과
2. **즉각 보상 루프**: 한 단계 성공 → 미니 쾌감 → 콤보 게이지 → 폭발 효과
3. **개념의 시각화**: 추상적 수학 개념을 애니메이션과 스토리로 변환
4. **개인화된 난이도 조절**: AI 기반 학습 성향 분석으로 최적 난이도 제공
5. **게임 메커니즘**: 스테이지, 레벨, 업적, 보상 시스템

### Goal
수포자들이 수학을 **"재미있는 게임"**으로 인식하도록 전환하여:
- 자발적 학습 동기 형성
- 수학 개념의 직관적 이해
- 학습 지속성 향상 (일일 접속률 50% 이상)
- 수학 성적 향상 (평균 20% 상승)

---

## 2. Goals

### Primary Goals
1. **수포자 재유입**: 수학을 포기한 학생들이 다시 수학 학습을 시작하도록 유도
2. **중독성 확보**: 게임 같은 경험으로 일일 평균 사용 시간 30분 이상 달성
3. **개념 이해도 향상**: 추상적 수학 개념의 시각적 이해를 통한 학습 효과 증대
4. **자존감 회복**: 작은 성공의 반복으로 수학에 대한 자신감 회복
5. **학습 지속성**: 7일 유지율 60% 이상, 30일 유지율 30% 이상

### Secondary Goals
1. 선생님/학부모용 대시보드로 학습 진도 모니터링
2. 학습 데이터 축적을 통한 AI 추천 알고리즘 고도화
3. 소셜 기능을 통한 경쟁과 협력 (친구와 점수 비교)
4. 다양한 학습 스타일 지원 (시각형, 논리형, 실험형)
5. 향후 AI Education System과의 연동 (선생님이 맞춤 문제 생성)

### Success Metrics
- **일일 활성 사용자(DAU)**: 출시 3개월 내 5,000명 이상
- **일일 평균 사용 시간**: 30분 이상
- **문제 풀이 완료율**: 70% 이상
- **7일 유지율**: 60% 이상
- **학생 만족도(NPS)**: 50 이상
- **수학 성적 향상**: 사용 전 대비 평균 20% 상승 (3개월 기준)

---

## 3. User Stories

### Primary User: 중·고등학교 수포자

**Story 1: 첫 성공 경험**
> As a **수포자 학생**, I want to **간단한 문제를 풀고 즉각적으로 시각적 보상을 받고 싶다**, so that **수학에 대한 흥미를 되찾을 수 있다**.

**Acceptance Criteria**:
- 문제를 풀면 즉시 (<1초) 시각 효과 발생
- 풀이 단계마다 미니 애니메이션 (빛나는 라인, 파티클 효과)
- 정답 시 화면 전체 펄스 효과 + 사운드 효과
- 연속 성공 시 콤보 게이지 상승

**Story 2: 개념 시각화**
> As a **수학 개념이 어려운 학생**, I want to **추상적인 수학 개념을 애니메이션으로 보고 싶다**, so that **직관적으로 이해할 수 있다**.

**Acceptance Criteria**:
- 이차방정식 판별식 → 씨앗이 자라는 애니메이션
- 함수 증가/감소 → 캐릭터가 산을 오르내리는 애니메이션
- 부등식 → 저울이 기울어지는 애니메이션
- 개념 설명 없이도 애니메이션만으로 70% 이상 이해 가능

**Story 3: 맞춤형 난이도**
> As a **수학 실력이 다른 학생**, I want to **내 수준에 맞는 문제가 자동으로 나오길 원한다**, so that **너무 쉽지도, 어렵지도 않게 학습할 수 있다**.

**Acceptance Criteria**:
- 첫 5문제로 실력 측정 (진단 평가)
- 정답률 70-80%를 유지하도록 난이도 자동 조절
- 약한 영역은 쉬운 단계부터 시작
- 강한 영역은 빠르게 난이도 상승

**Story 4: 게임 같은 경험**
> As a **게임을 좋아하는 학생**, I want to **수학 문제 풀이가 게임 스테이지 같았으면 좋겠다**, so that **마치 게임하는 것처럼 수학을 즐길 수 있다**.

**Acceptance Criteria**:
- 스테이지 시스템 (1-1, 1-2, ... 형식)
- 레벨업, 경험치, 업적 시스템
- 일일 퀘스트 및 보상
- 리더보드 (주간/월간 랭킹)

### Secondary User: 선생님/학부모

**Story 5: 학습 모니터링**
> As a **선생님/학부모**, I want to **학생의 학습 진도와 약점을 확인하고 싶다**, so that **적절한 도움을 줄 수 있다**.

**Acceptance Criteria**:
- 학생별 대시보드 (학습 시간, 문제 풀이 수, 정답률)
- 영역별 강점/약점 분석
- 학습 히스토리 그래프
- 주간 리포트 자동 발송

---

## 4. Functional Requirements

### Phase 1: 핵심 학습 경험 (Core Learning Experience)

**FR-1.1: 풀이 입력 시스템**
- System MUST support multiple input methods:
  - **텍스트 입력**: 수식을 텍스트로 입력 (예: "2x + 3 = 7")
  - **수식 에디터**: MathQuill 기반 수학 수식 입력기
  - **손글씨 인식** (Phase 2): 태블릿/터치스크린에서 손으로 쓴 수식 인식
- System MUST validate input in real-time
- System MUST support step-by-step solution entry

**FR-1.2: 실시간 시각적 피드백**
- System MUST provide visual feedback within 1 second of each action:
  - **식 정리**: 빛나는 라인 애니메이션
  - **오류 발견**: 붉은 잉크 번짐 효과 (shake + red highlight)
  - **부분 정답**: 초록색 체크마크 + 파티클 효과
  - **정답 도달**: 화면 전체 펄스 + 폭죽 애니메이션
- System MUST synchronize animations with learning flow
- System MUST allow users to replay animations

**FR-1.3: 즉각 보상 루프**
- System MUST reward every successful step:
  - **미니 쾌감**: 효과음 (ding) + 시각 펄스 (0.3초)
  - **진행 표시**: 프로그레스 바가 채워짐
  - **포인트 획득**: +10, +20 등 숫자가 튀어오름 (bounce animation)
- System MUST implement combo system:
  - **연속 성공**: 콤보 게이지 상승 (1x → 2x → 3x)
  - **콤보 완성**: 5연속 성공 시 "COMBO!" 애니메이션 + 보너스 포인트
  - **콤보 해제 효과**: 게이지가 "폭발"하며 화면 전체 시각 효과
- System MUST track daily streaks (연속 접속 일수)

**FR-1.4: 개념 시각화 애니메이션**
- System MUST generate concept-specific animations:
  - **이차방정식 판별식**:
    - b²-4ac > 0: 씨앗이 두 개 싹으로 자람
    - b²-4ac = 0: 씨앗이 하나 싹으로 자람
    - b²-4ac < 0: 씨앗이 시들어버림 (허근)
  - **함수 증가/감소**:
    - 증가 함수: 캐릭터가 산을 오름
    - 감소 함수: 캐릭터가 산을 내려감
    - 극값: 정상/골짜기에서 깃발 꽂음
  - **부등식**:
    - 양쪽 저울에 무게 표시
    - 부등호 방향으로 저울 기울어짐
  - **삼각함수**:
    - 단위원 위에서 점이 회전
    - sin/cos/tan 값이 실시간으로 변화
- System MUST allow animation speed control (0.5x, 1x, 2x)
- System MUST provide animation replay functionality

### Phase 2: 개인화 & 적응형 학습 (Personalization & Adaptive Learning)

**FR-2.1: 학습 성향 분석**
- System MUST perform initial diagnostic assessment (5-10 problems)
- System MUST track student behavior:
  - 문제 풀이 시간
  - 오답 패턴
  - 힌트 사용 빈도
  - 포기율 (중도 이탈)
  - 선호 문제 유형
- System MUST identify weak/strong areas across topics:
  - 대수 (방정식, 부등식)
  - 함수 (일차, 이차, 지수, 로그)
  - 기하 (도형, 삼각함수)
  - 확률과 통계
- System MUST update student profile in real-time

**FR-2.2: 난이도 자동 조절**
- System MUST maintain target accuracy rate of 70-80%
- System MUST adjust difficulty based on:
  - Recent accuracy (last 10 problems)
  - Time spent per problem
  - Hint usage
  - Confidence level (optional student self-report)
- System MUST implement difficulty levels:
  - Level 1: 기초 (basic concepts)
  - Level 2: 응용 (application)
  - Level 3: 심화 (advanced)
  - Level 4: 최고난이도 (challenge)
- System MUST gradually increase difficulty for mastered topics

**FR-2.3: 맞춤 학습 경로 생성**
- System MUST generate personalized learning paths:
  - **약한 영역 우선**: 쉬운 문제로 자신감 회복
  - **빠른 보상**: 5분 내 성공 경험 제공
  - **점진적 상승**: 난이도를 천천히 올림
- System MUST provide multiple pathways:
  - **속도형**: 많은 문제를 빠르게
  - **정확형**: 적은 문제를 깊이 있게
  - **탐험형**: 다양한 유형의 문제
- System MUST allow students to switch paths

### Phase 3: 게임화 & 동기 부여 (Gamification & Motivation)

**FR-3.1: 스테이지 시스템**
- System MUST organize content into stages:
  - **World 1: 대수의 세계**
    - Stage 1-1: 일차방정식
    - Stage 1-2: 연립방정식
    - Stage 1-3: 이차방정식
    - Stage 1-4: 고차방정식
    - Boss Stage: 종합 문제
  - **World 2: 함수의 세계**
  - **World 3: 기하의 세계**
  - **World 4: 확률과 통계의 세계**
- System MUST lock stages until prerequisites are met
- System MUST show progress within each stage (e.g., 7/10 problems completed)
- System MUST provide visual stage map (similar to game level selection)

**FR-3.2: 레벨 & 경험치 시스템**
- System MUST implement player leveling:
  - Level 1 (초보): 0-100 XP
  - Level 2-5 (중수): 100-1000 XP (exponential curve)
  - Level 6-10 (고수): 1000-5000 XP
  - Level 11+ (마스터): 5000+ XP
- System MUST award XP for:
  - Problem completion: 10-50 XP (based on difficulty)
  - Combo bonuses: +10 XP per combo level
  - Daily quests: 100 XP
  - Perfect stage clear (100% accuracy): 200 XP
- System MUST show level-up animation with rewards

**FR-3.3: 업적 시스템**
- System MUST include achievements:
  - **첫 걸음**: 첫 문제 풀이
  - **연속 학습**: 7일 연속 접속
  - **정확한 사수**: 10문제 연속 정답
  - **속도광**: 1분 안에 문제 해결
  - **완벽주의자**: 스테이지 100% 정답
  - **탐험가**: 모든 영역 최소 1문제 풀이
- System MUST display achievement badges
- System MUST provide achievement tracking progress

**FR-3.4: 일일 퀘스트 & 보상**
- System MUST generate daily quests:
  - "오늘 5문제 풀기" → 50 XP
  - "이차방정식 3문제 풀기" → 30 XP
  - "3연속 콤보 달성" → 40 XP
- System MUST provide streak bonuses:
  - 7일 연속: 보너스 아이템
  - 30일 연속: 특별 뱃지
- System MUST implement daily reward calendar (출석 체크)

**FR-3.5: 리더보드 & 소셜 기능** (Phase 2)
- System SHOULD implement leaderboards:
  - 주간 랭킹 (top 100)
  - 월간 랭킹
  - 학교별 랭킹
  - 친구 랭킹
- System SHOULD support friend system:
  - 친구 추가/삭제
  - 친구 점수 비교
  - 친구에게 도전장 보내기

### Phase 4: 문제 생성 & 관리 (Problem Generation & Management)

**FR-4.1: 문제 은행 시스템**
- System MUST maintain problem database:
  - 최소 1,000개 이상의 문제 (출시 시)
  - 난이도별 분류 (1-4)
  - 주제별 분류 (대수, 함수, 기하, 통계)
  - 태그 시스템 (예: #이차방정식, #판별식, #근의공식)
- System MUST support problem metadata:
  - Difficulty level
  - Estimated solve time
  - Success rate (historical data)
  - Required knowledge (prerequisites)
  - Visual animation type

**FR-4.2: 문제 추천 알고리즘**
- System MUST recommend problems based on:
  - Student's current level
  - Recent performance
  - Weak areas
  - Time of day (easier problems in the morning/late night)
  - Session duration (shorter sessions → easier problems)
- System MUST avoid problem repetition within 7 days
- System MUST implement spaced repetition for weak concepts

**FR-4.3: 문제 검증 시스템**
- System MUST validate all problems:
  - Correct answer verification
  - Solution step validation
  - Difficulty calibration (based on actual student data)
- System MUST flag problematic questions:
  - Success rate < 20% (too hard)
  - Success rate > 95% (too easy)
  - High skip rate
  - Many student reports

**FR-4.4: 선생님 문제 생성 (Future Integration with AI Education System)**
- System SHOULD allow teachers to:
  - Create custom problems via natural language (AI-powered)
  - Assign custom problem sets to students
  - Track student performance on custom problems
- System SHOULD integrate with AI Education Pipeline for automatic problem generation

### Phase 5: 사용자 인터페이스 (User Interface)

**FR-5.1: 문제 풀이 화면**
- System MUST provide clean, distraction-free interface:
  - Large, readable fonts (minimum 18px)
  - High-contrast text (WCAG AA compliance)
  - Minimal UI elements during solving
  - Full-screen mode option
- System MUST show:
  - Problem statement with visual aid
  - Input area (text/equation editor)
  - Hint button (cost: -10 XP)
  - Skip button (visible after 3 minutes)
  - Progress indicator (X/10 problems)
  - Timer (optional, can be hidden)

**FR-5.2: 대시보드**
- System MUST provide student dashboard:
  - **현재 레벨 & XP**: Progress bar to next level
  - **오늘의 퀘스트**: Checklist with rewards
  - **학습 통계**:
    - 오늘 풀이한 문제 수
    - 이번 주 학습 시간
    - 정답률 (overall & by topic)
  - **다음 스테이지**: Recommended next stage
  - **업적**: Recent achievements
- System MUST provide parent/teacher dashboard:
  - Student progress overview
  - Time spent per session
  - Problem-solving statistics
  - Weak/strong areas visualization
  - Weekly/monthly reports

**FR-5.3: 애니메이션 설정**
- System MUST allow users to customize:
  - Animation speed (0.5x, 1x, 2x)
  - Animation complexity (simple, normal, fancy)
  - Sound effects (on/off, volume)
  - Visual effects intensity (reduced motion option)

**FR-5.4: 접근성 (Accessibility)**
- System MUST support:
  - Keyboard navigation
  - Screen reader compatibility
  - High contrast mode
  - Adjustable text size
  - Dyslexia-friendly font option

### Phase 6: 데이터 & 분석 (Data & Analytics)

**FR-6.1: 학습 데이터 수집**
- System MUST collect anonymized data:
  - Problem-solving behavior (time, steps, errors)
  - Animation interaction (replays, speed adjustments)
  - Navigation patterns
  - Device and browser information
- System MUST comply with data privacy regulations (GDPR, COPPA, PIPA)

**FR-6.2: 분석 대시보드 (Admin)**
- System MUST provide admin analytics:
  - DAU/MAU metrics
  - Retention rates (D1, D7, D30)
  - Average session duration
  - Problem completion rates by difficulty
  - Feature usage statistics (animations, hints, etc.)
  - Heatmaps of user interactions

**FR-6.3: A/B 테스트 프레임워크**
- System SHOULD support A/B testing:
  - Different animation styles
  - Reward amounts
  - Difficulty progression curves
  - UI variations
- System SHOULD automatically determine winning variants

---

## 5. Non-Goals (Out of Scope)

### Out of Scope for MVP

1. **손글씨 인식**: Phase 2로 연기 (MVP는 텍스트/수식 에디터만)
2. **음성 입력**: 음성으로 문제 풀이는 미래 기능
3. **모바일 네이티브 앱**: 웹앱만 제공 (반응형 디자인)
4. **실시간 대전 모드**: 친구와 실시간 대결은 Phase 2
5. **아바타 커스터마이징**: 캐릭터 꾸미기 기능은 미래 추가
6. **상점 시스템**: XP로 아이템 구매는 Phase 2
7. **구독/결제**: 무료 서비스로 시작 (수익화는 추후 검토)
8. **오프라인 모드**: 온라인 필수 (오프라인은 Phase 3)
9. **다국어 지원**: 한국어만 (영어는 Phase 2)
10. **타 교과 지원**: 수학만 (물리, 화학 등은 별도 프로젝트)

### Explicitly Not Supported

1. **작문형 서술식 답안**: 선택형/단답형만 지원
2. **선생님과 1:1 채팅**: 자동 학습만 (개인 지도는 별도)
3. **수업 시간표 연동**: 독립적 학습 도구
4. **성적 자동 입력**: 학교 시스템과 미연동

---

## 6. Design Considerations

### 6.1 User Interface/UX

**Design Philosophy**:
- **중독성 우선**: 모든 인터랙션에 즉각적 피드백
- **시각적 풍부함**: 애니메이션과 색상을 통한 몰입
- **단순한 학습 흐름**: 3클릭 이내에 문제 풀이 시작
- **성취감 극대화**: 작은 성공도 크게 축하
- **비언어적 전달**: 애니메이션만으로도 개념 이해 가능

**Color Palette**:
- **Primary**: #4F46E5 (Indigo) - 집중과 학습
- **Success**: #10B981 (Green) - 정답 및 성공
- **Error**: #EF4444 (Red) - 오답 및 경고
- **Warning**: #F59E0B (Amber) - 힌트 및 주의
- **Combo**: #8B5CF6 (Purple) - 특별 효과
- **Background**: #F9FAFB (Light Gray) - 깨끗한 배경

**Typography**:
- Heading: Pretendard Bold, 24-48px
- Body: Pretendard Regular, 16-18px
- Math: KaTeX fonts (for equation rendering)
- Dyslexia option: OpenDyslexic font

**Key Animations**:
1. **미니 쾌감 펄스**: 0.3초, scale(1.1), ease-out
2. **콤보 폭발**: 1초, 파티클 30개, radial expansion
3. **정답 펄스**: 0.5초, 화면 전체 opacity wave
4. **레벨업**: 2초, 빛나는 별 + 텍스트 확대

### 6.2 System Architecture

**High-Level Architecture**:

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend (Next.js + React)              │
│  Problem Solving UI | Dashboard | Animations            │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API + WebSocket
┌──────────────────▼──────────────────────────────────────┐
│              Backend API (FastAPI - Python)             │
│  Auth | Problem Service | User Service | Analytics      │
└────┬──────────────┬────────────────┬────────────────────┘
     │              │                │
┌────▼─────┐  ┌────▼──────┐  ┌──────▼──────┐
│PostgreSQL│  │   Redis   │  │   Claude    │
│(Users,   │  │  (Cache,  │  │    API      │
│Problems, │  │  Sessions)│  │ (Future AI) │
│Progress) │  │           │  └─────────────┘
└──────────┘  └───────────┘
```

**Component Breakdown**:

1. **Frontend (Next.js)**
   - Server-side rendering for SEO and performance
   - React for interactive UI
   - Framer Motion for animations
   - KaTeX for math rendering
   - Chart.js for progress visualization

2. **Backend (FastAPI)**
   - High-performance Python web framework
   - Async/await for concurrent requests
   - Pydantic for data validation
   - JWT for authentication
   - WebSocket for real-time features

3. **Database (PostgreSQL)**
   - User profiles and authentication
   - Problem bank with metadata
   - Student progress and statistics
   - Achievement tracking
   - JSONB for flexible schema (learning analytics)

4. **Cache (Redis)**
   - Session management
   - Problem recommendation cache
   - Leaderboard rankings
   - Rate limiting

5. **AI Integration (Future)**
   - Claude API for concept explanations
   - Problem generation assistance
   - Hint generation
   - Natural language problem parsing

### 6.3 Data Models

**Core Entities**:

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'parent', 'admin')),
    grade_level INTEGER, -- 7-12 for middle/high school
    school VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Student Profiles
CREATE TABLE student_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    total_problems_solved INTEGER DEFAULT 0,
    total_study_time_minutes INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}'::jsonb, -- animation settings, etc.
    learning_stats JSONB DEFAULT '{}'::jsonb, -- weak/strong areas
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Problems
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(50) NOT NULL, -- algebra, function, geometry, statistics
    sub_topic VARCHAR(50), -- linear_equation, quadratic_equation, etc.
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 4),
    problem_text TEXT NOT NULL,
    problem_latex TEXT, -- LaTeX representation
    correct_answer TEXT NOT NULL,
    solution_steps JSONB, -- array of solution steps
    animation_type VARCHAR(50), -- seed_growth, mountain_climb, etc.
    animation_config JSONB, -- animation parameters
    hints JSONB, -- array of hints
    estimated_solve_time_seconds INTEGER,
    prerequisite_topics TEXT[], -- array of required topics
    tags TEXT[], -- array of tags
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    success_rate DECIMAL(5,2), -- calculated from attempts
    avg_solve_time_seconds INTEGER -- calculated from attempts
);

-- Problem Attempts
CREATE TABLE problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    problem_id UUID NOT NULL REFERENCES problems(id),
    answer_submitted TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    solve_time_seconds INTEGER,
    hints_used INTEGER DEFAULT 0,
    combo_level INTEGER DEFAULT 0, -- combo count at time of solving
    xp_earned INTEGER NOT NULL,
    attempted_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attempts_user_problem ON problem_attempts(user_id, problem_id);
CREATE INDEX idx_attempts_user_time ON problem_attempts(user_id, attempted_at);

-- Stages (Game progression)
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_number INTEGER NOT NULL,
    stage_number INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    topic VARCHAR(50) NOT NULL,
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 4),
    required_problems INTEGER DEFAULT 10, -- problems to complete stage
    unlock_criteria JSONB, -- what's needed to unlock
    is_boss_stage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(world_number, stage_number)
);

-- Student Stage Progress
CREATE TABLE student_stage_progress (
    user_id UUID REFERENCES users(id),
    stage_id UUID REFERENCES stages(id),
    status VARCHAR(20) CHECK (status IN ('locked', 'unlocked', 'in_progress', 'completed')),
    problems_completed INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    best_accuracy DECIMAL(5,2),
    completed_at TIMESTAMP,
    PRIMARY KEY (user_id, stage_id)
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- icon identifier
    criteria JSONB NOT NULL, -- unlock criteria
    xp_reward INTEGER DEFAULT 0,
    badge_rarity VARCHAR(20) CHECK (badge_rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Student Achievements
CREATE TABLE student_achievements (
    user_id UUID REFERENCES users(id),
    achievement_id UUID REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Daily Quests
CREATE TABLE daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    quest_date DATE NOT NULL,
    quest_type VARCHAR(50) NOT NULL, -- solve_n_problems, topic_focus, combo_achievement
    quest_description TEXT NOT NULL,
    quest_criteria JSONB NOT NULL, -- specific requirements
    xp_reward INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    UNIQUE(user_id, quest_date, quest_type)
);

-- Learning Analytics
CREATE TABLE learning_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    problems_attempted INTEGER DEFAULT 0,
    problems_correct INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    max_combo INTEGER DEFAULT 0,
    session_data JSONB -- detailed interaction data
);

-- Parent/Teacher Access
CREATE TABLE user_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id),
    observer_id UUID NOT NULL REFERENCES users(id), -- parent or teacher
    relationship_type VARCHAR(20) CHECK (relationship_type IN ('parent', 'teacher')),
    granted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, observer_id)
);
```

### 6.4 Technology Stack

**Frontend**:
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: TailwindCSS + Headless UI
- **Animations**: Framer Motion
- **Math Rendering**: KaTeX (faster than MathJax)
- **Charts**: Recharts
- **State Management**: Zustand (lightweight)
- **API Client**: Axios with React Query
- **WebSocket**: Socket.io-client
- **Testing**: Vitest + React Testing Library

**Backend**:
- **Framework**: FastAPI (Python 3.11+)
- **Authentication**: FastAPI-Users + JWT
- **Database ORM**: SQLAlchemy 2.0 (async)
- **Migration**: Alembic
- **Validation**: Pydantic V2
- **Task Queue**: Celery + Redis (for background jobs)
- **WebSocket**: FastAPI WebSocket support
- **Testing**: Pytest + httpx

**Database & Cache**:
- **Primary DB**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Connection Pooling**: asyncpg + aioredis

**DevOps**:
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (Frontend) + Railway/Render (Backend)
- **Monitoring**: Sentry (errors) + Plausible Analytics (privacy-first)
- **Logging**: Structured logging with Loguru

**AI/Future**:
- **LLM**: Claude API (for explanations, hint generation)
- **Embeddings**: For semantic problem search (Phase 2)

---

## 7. Technical Considerations

### 7.1 Performance Optimization

**Frontend Performance**:
- **Code Splitting**: Lazy load animation components
- **Image Optimization**: Next.js Image component with WebP
- **Math Rendering**: Lazy render KaTeX only when problem is displayed
- **Animation Performance**: Use CSS transforms (GPU-accelerated)
- **Bundle Size**: Keep initial bundle < 200KB gzipped

**Backend Performance**:
- **Database Indexing**: Index on user_id, problem_id, attempted_at
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
- **Caching Strategy**:
  - Problem data: Cache for 1 hour
  - Leaderboards: Cache for 5 minutes
  - User profiles: Cache for 10 minutes
- **Connection Pooling**: Max 20 connections per instance
- **Rate Limiting**: 100 requests/minute per user

**Target Metrics**:
- Initial page load: < 2 seconds
- Time to Interactive (TTI): < 3 seconds
- API response time (p95): < 200ms
- Animation frame rate: 60 FPS

### 7.2 Animation System Design

**Animation Framework**:
- **Library**: Framer Motion for declarative animations
- **Performance**: Use `will-change` CSS property
- **Reduced Motion**: Respect `prefers-reduced-motion` media query

**Animation Categories**:

1. **Micro-interactions** (< 0.5s):
   - Button hover/press
   - Input focus
   - Checkmark appear

2. **Feedback Animations** (0.3-1s):
   - Mini pulse (correct step)
   - Error shake
   - Combo gauge fill

3. **Celebration Animations** (1-3s):
   - Level up
   - Achievement unlock
   - Stage complete

4. **Concept Animations** (2-5s):
   - Seed growth (quadratic discriminant)
   - Mountain climb (function behavior)
   - Custom per concept

**Animation Data Structure**:
```typescript
interface Animation {
  type: 'seed_growth' | 'mountain_climb' | 'scale_balance' | 'custom';
  duration: number; // seconds
  frames: AnimationFrame[];
  audioFile?: string;
  config: Record<string, any>; // animation-specific parameters
}

interface AnimationFrame {
  timestamp: number; // 0-1 (percentage of duration)
  elements: ElementAnimation[];
}

interface ElementAnimation {
  elementId: string;
  transform: Transform;
  opacity?: number;
  color?: string;
}
```

### 7.3 Problem Recommendation Algorithm

**Recommendation Strategy**:

```python
def recommend_next_problem(user_id: str, session_context: dict) -> Problem:
    """
    Recommend next problem based on multiple factors.
    """
    user_profile = get_user_profile(user_id)
    recent_performance = get_recent_attempts(user_id, limit=10)

    # Calculate factors
    accuracy_rate = calculate_accuracy(recent_performance)
    weak_topics = identify_weak_topics(user_profile, recent_performance)
    current_difficulty = user_profile.current_difficulty_level

    # Adjust difficulty to maintain 70-80% accuracy
    if accuracy_rate > 0.85:
        target_difficulty = min(current_difficulty + 1, 4)
    elif accuracy_rate < 0.60:
        target_difficulty = max(current_difficulty - 1, 1)
    else:
        target_difficulty = current_difficulty

    # Prioritize weak topics with easier problems
    if weak_topics:
        topic = weak_topics[0]
        # Start one level easier for weak topics
        target_difficulty = max(target_difficulty - 1, 1)
    else:
        topic = select_next_topic_in_curriculum(user_profile)

    # Find suitable problem
    problem = find_problem(
        topic=topic,
        difficulty=target_difficulty,
        exclude_recent_days=7,  # avoid repetition
        user_id=user_id
    )

    return problem
```

**Spaced Repetition**:
- Wrong answers: Review after 1 day, 3 days, 7 days
- Correct answers: Review after 7 days, 30 days
- Mastered (3x correct): No further repetition

### 7.4 Security Considerations

**Authentication & Authorization**:
- **Password**: bcrypt hashing (cost factor 12)
- **JWT Tokens**:
  - Access token: 15 minutes expiry
  - Refresh token: 7 days expiry, stored in httpOnly cookie
- **Role-based Access Control**: Student, Teacher, Parent, Admin
- **API Rate Limiting**: Redis-based, 100 req/min per user

**Data Protection**:
- **PII Encryption**: Encrypt sensitive fields (email, real name) at rest
- **HTTPS Only**: Enforce TLS 1.3
- **CORS**: Whitelist only production domains
- **SQL Injection**: Use parameterized queries (SQLAlchemy ORM)
- **XSS Prevention**: React's default escaping + Content Security Policy

**Privacy Compliance**:
- **COPPA (Children's Privacy)**: Parental consent for users < 13
- **GDPR**: Right to access, delete data
- **PIPA (Korea)**: Minimize personal data collection
- **Data Anonymization**: Analytics use anonymized user IDs

**Admin Security**:
- **2FA**: Require for admin accounts
- **Audit Logs**: Log all admin actions
- **Principle of Least Privilege**: Minimize permissions

### 7.5 Analytics & Monitoring

**Key Metrics to Track**:

1. **Engagement Metrics**:
   - DAU/MAU ratio
   - Average session duration
   - Sessions per user per day
   - Retention (D1, D7, D30)

2. **Learning Metrics**:
   - Problems attempted per session
   - Overall accuracy rate
   - Accuracy by topic
   - Average solve time
   - Hint usage rate
   - Skip rate

3. **Gamification Metrics**:
   - XP earned per day
   - Level distribution
   - Achievement unlock rate
   - Combo frequency
   - Quest completion rate

4. **Technical Metrics**:
   - API latency (p50, p95, p99)
   - Error rate
   - Database query time
   - Cache hit rate

**Monitoring Stack**:
- **Error Tracking**: Sentry
- **Application Monitoring**: Sentry Performance
- **User Analytics**: Plausible or PostHog (privacy-friendly)
- **Uptime Monitoring**: Better Uptime
- **Logging**: Structured JSON logs with Loguru

### 7.6 Initial Content Strategy

**Problem Bank Requirements**:

Minimum viable content for launch:

| Topic | Subtopic | Difficulty 1 | Difficulty 2 | Difficulty 3 | Difficulty 4 | Total |
|-------|----------|--------------|--------------|--------------|--------------|-------|
| 대수 | 일차방정식 | 30 | 40 | 20 | 10 | 100 |
| 대수 | 이차방정식 | 30 | 40 | 20 | 10 | 100 |
| 대수 | 부등식 | 20 | 30 | 15 | 10 | 75 |
| 함수 | 일차함수 | 25 | 35 | 20 | 10 | 90 |
| 함수 | 이차함수 | 25 | 35 | 20 | 10 | 90 |
| 기하 | 도형 | 20 | 30 | 15 | 10 | 75 |
| 확률 | 확률 기초 | 20 | 30 | 15 | 10 | 75 |
| **Total** | | **170** | **240** | **125** | **70** | **605** |

**Content Creation Process**:
1. **Manual Creation**: Core problems (200) written by teachers
2. **Template-based Generation**: Variations of core problems (300)
3. **AI-assisted Generation** (Future): Claude API to generate more problems (100+)

**Problem Quality Criteria**:
- Clear problem statement (< 50 words)
- Unambiguous correct answer
- 2-3 hints available
- Appropriate animation assigned
- Validated by 2 teachers
- Target solve time estimated

---

## 8. Success Metrics

### Primary KPIs

**1. User Engagement**
- **DAU (Daily Active Users)**: 5,000 within 3 months
- **MAU (Monthly Active Users)**: 15,000 within 3 months
- **DAU/MAU Ratio**: > 0.3 (sticky product)
- **Average Session Duration**: 30 minutes
- **Sessions per User per Day**: 1.5

**2. Retention**
- **D1 Retention**: 60% (users return next day)
- **D7 Retention**: 40% (users return after 1 week)
- **D30 Retention**: 25% (users return after 1 month)

**3. Learning Effectiveness**
- **Problem Completion Rate**: 70% (problems started → completed)
- **Overall Accuracy**: 65-75% (sweet spot for learning)
- **Improvement Rate**: 20% increase in accuracy after 1 month
- **Concept Mastery**: 50% of users master at least 3 topics

**4. User Satisfaction**
- **NPS (Net Promoter Score)**: > 50
- **App Store Rating**: 4.5+ stars
- **Student Survey**: 80% say "math is more fun now"
- **Parent Satisfaction**: 70% see improvement in child's attitude

**5. Gamification Engagement**
- **Daily Quest Completion**: 60% of active users
- **Achievement Unlocks**: Average 10 per user per month
- **Combo Achievement**: 40% of users reach 5x combo
- **Streak Maintenance**: 30% of users have 7+ day streak

### Secondary Metrics

**6. Content Metrics**
- **Problem Coverage**: 80% of problems attempted at least once
- **Average Attempts per Problem**: 3-5 (indicates replayability)
- **Hint Usage**: 30% of problems (not too high, not too low)
- **Skip Rate**: < 20% (problems are not too frustrating)

**7. Technical Performance**
- **Uptime**: 99.5%
- **Error Rate**: < 1%
- **API Latency (p95)**: < 300ms
- **Time to Interactive**: < 3 seconds

**8. Business Metrics** (Future)
- **Cost per Active User**: < $0.50/month (server + AI costs)
- **Organic Growth Rate**: 20% month-over-month
- **Referral Rate**: 15% of users invite friends

### Monitoring Dashboard

**Real-time Dashboard** (for team):
- Current online users
- Problems solved today
- Error rate (last 1 hour)
- Server health (CPU, memory, DB connections)

**Daily Report** (automated):
- DAU, new users, retention
- Top problems (most attempted, highest skip rate)
- Top students (leaderboard)
- Error summary

**Weekly Report** (for stakeholders):
- Engagement trends (graphs)
- Learning outcomes (accuracy improvements)
- User feedback summary
- Feature usage (animations, hints, etc.)

**Monthly Review** (strategic):
- Cohort retention analysis
- Content gap analysis
- User persona insights
- Roadmap adjustments

### A/B Testing Plan

**Phase 1 Tests** (after 2 weeks of launch):
- **Animation Intensity**: Fancy vs. Simple
- **XP Rewards**: 10/20/30 vs. 20/40/60 (doubling)
- **Combo Threshold**: 3 vs. 5 consecutive correct
- **Hint Cost**: Free vs. -10 XP vs. -20 XP

**Evaluation Criteria**:
- Retention impact
- Session duration impact
- Problem completion rate
- User satisfaction (survey)

---

## 9. Open Questions

### High Priority (Needed before development)

1. **Target Device & Browser**
   - **Question**: 주요 사용 기기가 무엇인가? (PC, 태블릿, 모바일?)
   - **Impact**: 반응형 디자인 우선순위, 터치 인터랙션 설계
   - **Needed by**: UI 설계 시작 전

2. **Authentication Method**
   - **Question**: 학교 계정 연동이 필요한가, 아니면 자체 회원가입?
   - **Impact**: 인증 시스템 설계
   - **Needed by**: Sprint 1

3. **Content Creation**
   - **Question**: 초기 문제 600개를 누가 작성하나? (선생님? 외주? AI?)
   - **Impact**: 출시 일정, 콘텐츠 품질
   - **Needed by**: Sprint 2

4. **Deployment Budget**
   - **Question**: 월 서버 비용 예산은? (사용자 규모에 따라 $100-$1000+)
   - **Impact**: 인프라 선택 (Vercel, AWS, etc.)
   - **Needed by**: Sprint 3

5. **Legal/Privacy**
   - **Question**: 만 13세 미만 학생 대상인가? (COPPA 준수 필요)
   - **Impact**: 부모 동의 프로세스 필요 여부
   - **Needed by**: Sprint 2

### Medium Priority (Needed during development)

6. **Animation Design Resources**
   - **Question**: 애니메이션을 직접 디자인할 디자이너가 있는가?
   - **Impact**: 애니메이션 복잡도, 외주 필요 여부
   - **Needed by**: Sprint 4

7. **Teacher Dashboard Priority**
   - **Question**: MVP에 선생님/학부모 대시보드가 필수인가?
   - **Impact**: 개발 범위, 출시 일정
   - **Needed by**: Sprint 3

8. **Social Features**
   - **Question**: 친구 기능이 MVP에 필수인가, Phase 2인가?
   - **Impact**: 개발 우선순위
   - **Needed by**: Sprint 5

9. **Problem Difficulty Validation**
   - **Question**: 문제 난이도를 어떻게 검증하나? (베타 테스터? 실제 학생 데이터?)
   - **Impact**: 콘텐츠 QA 프로세스
   - **Needed by**: Sprint 4

10. **Accessibility Priority**
    - **Question**: 시각 장애, 색맹 학생 지원이 MVP 필수인가?
    - **Impact**: 접근성 기능 개발 범위
    - **Needed by**: Sprint 5

### Low Priority (Post-MVP)

11. **Monetization Strategy**
    - **Question**: 수익 모델은? (구독? 광고? 학교 라이선스?)
    - **Impact**: 기능 제한, 결제 시스템
    - **Needed by**: Phase 2

12. **AI Education System Integration**
    - **Question**: 언제, 어떻게 AI Education Pipeline과 연동하나?
    - **Impact**: API 설계, 데이터 스키마 호환성
    - **Needed by**: Phase 2

13. **Expansion to Other Subjects**
    - **Question**: 수학 외 과목(물리, 화학) 확장 계획?
    - **Impact**: 아키텍처 일반화 필요성
    - **Needed by**: Phase 3

---

## 10. Development Phases & Timeline

### Phase 0: Setup & Planning (Week 1-2)

**Sprint 0: Project Setup**
- [ ] Initialize Next.js + FastAPI monorepo
- [ ] Setup Docker development environment
- [ ] Configure PostgreSQL + Redis
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Create design system (colors, typography, components)
- **Deliverable**: Working dev environment

### Phase 1: Core MVP (Week 3-8)

**Sprint 1: Authentication & User Management** (Week 3-4)
- [ ] User registration/login (JWT)
- [ ] Student profile creation
- [ ] Parent/teacher account linking
- [ ] Basic dashboard UI
- **Deliverable**: Working auth system

**Sprint 2: Problem System** (Week 5-6)
- [ ] Problem database schema
- [ ] Problem CRUD API
- [ ] Problem recommendation algorithm (basic)
- [ ] Create 100 initial problems (manual)
- **Deliverable**: Problem bank with API

**Sprint 3: Problem Solving UI** (Week 7-8)
- [ ] Problem display with KaTeX rendering
- [ ] Text input + equation editor (MathQuill)
- [ ] Answer validation
- [ ] Basic feedback (correct/incorrect)
- [ ] Progress tracking
- **Deliverable**: Functional problem-solving interface

### Phase 2: Gamification & Animations (Week 9-14)

**Sprint 4: Animations & Visual Feedback** (Week 9-10)
- [ ] Implement Framer Motion animations
- [ ] Mini pulse on correct step
- [ ] Error shake effect
- [ ] Full-screen pulse on correct answer
- [ ] Combo gauge UI + animation
- **Deliverable**: Engaging visual feedback system

**Sprint 5: Concept Animations** (Week 11-12)
- [ ] Seed growth animation (discriminant)
- [ ] Mountain climb animation (functions)
- [ ] Scale balance animation (inequalities)
- [ ] Circle rotation animation (trigonometry)
- [ ] Animation replay controls
- **Deliverable**: 4 concept animations working

**Sprint 6: Gamification Core** (Week 13-14)
- [ ] XP and leveling system
- [ ] Achievement system
- [ ] Daily quests generation
- [ ] Streak tracking
- [ ] Leaderboard (basic)
- **Deliverable**: Full gamification mechanics

### Phase 3: Adaptive Learning (Week 15-18)

**Sprint 7: Learning Analytics** (Week 15-16)
- [ ] Track problem attempts with metadata
- [ ] Calculate accuracy by topic
- [ ] Identify weak/strong areas
- [ ] Learning session tracking
- **Deliverable**: Learning analytics backend

**Sprint 8: Adaptive Algorithm** (Week 17-18)
- [ ] Implement difficulty adjustment algorithm
- [ ] Personalized problem recommendation
- [ ] Spaced repetition logic
- [ ] Topic progression system
- **Deliverable**: Adaptive learning system

### Phase 4: Polish & Launch Prep (Week 19-22)

**Sprint 9: Stage System & Content** (Week 19-20)
- [ ] Create stage structure (worlds, stages)
- [ ] Stage progression logic
- [ ] Visual stage map UI
- [ ] Expand problem bank to 600+ problems
- **Deliverable**: Full content structure

**Sprint 10: Dashboards** (Week 21)
- [ ] Student dashboard (stats, quests, achievements)
- [ ] Parent/teacher dashboard (monitoring)
- [ ] Admin dashboard (analytics)
- **Deliverable**: All dashboard views

**Sprint 11: Testing & Optimization** (Week 22)
- [ ] Performance optimization (< 3s TTI)
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] Accessibility audit (WCAG AA)
- [ ] Security audit
- **Deliverable**: Production-ready app

### Phase 5: Beta Launch (Week 23-26)

**Sprint 12: Beta Testing** (Week 23-24)
- [ ] Deploy to staging environment
- [ ] Recruit 50-100 beta testers (students + parents)
- [ ] Collect feedback (surveys + interviews)
- [ ] Monitor analytics and error logs
- **Deliverable**: Beta version with real users

**Sprint 13: Iteration & Fixes** (Week 25-26)
- [ ] Fix critical bugs
- [ ] Adjust difficulty algorithm based on data
- [ ] Improve animations based on feedback
- [ ] Optimize problem recommendation
- **Deliverable**: Improved version

### Phase 6: Public Launch (Week 27-28)

**Sprint 14: Launch Preparation** (Week 27)
- [ ] Deploy to production
- [ ] Setup monitoring (Sentry, analytics)
- [ ] Create onboarding tutorial
- [ ] Prepare marketing materials
- **Deliverable**: Public launch

**Sprint 15: Post-Launch Support** (Week 28+)
- [ ] Monitor user growth and retention
- [ ] A/B test key features
- [ ] Iterate based on data
- [ ] Plan Phase 2 features
- **Deliverable**: Stable, growing product

---

## 11. Risk Analysis & Mitigation

### High-Risk Items

**Risk 1: Content Quality & Quantity**
- **Risk**: 600개 문제 작성에 시간이 오래 걸리거나 품질이 낮음
- **Impact**: 출시 지연, 학습 효과 저하
- **Mitigation**:
  - 초기에는 200개 핵심 문제로 시작 (베타 테스트)
  - 템플릿 기반 자동 생성으로 300개 추가
  - AI(Claude)로 100개 보조 생성
  - 베타 테스터 피드백으로 지속적 개선

**Risk 2: Animation Performance**
- **Risk**: 복잡한 애니메이션이 저사양 기기에서 느림
- **Impact**: 사용자 경험 저하, 이탈
- **Mitigation**:
  - CSS transforms 사용 (GPU 가속)
  - 저사양 모드 제공 (간단한 애니메이션)
  - 성능 모니터링 및 최적화
  - 최소 사양 명시 (Chrome 90+, 2GB RAM)

**Risk 3: Addictiveness Backfire**
- **Risk**: 너무 중독성이 강해 과몰입 우려 (부모/학교 반발)
- **Impact**: 평판 악화, 사용 제한
- **Mitigation**:
  - 일일 사용 시간 제한 옵션 (부모 설정)
  - 적절한 휴식 권장 (30분마다 알림)
  - 학습 효과 강조 (점수보다 이해도)
  - 건전한 게임화 (협력 > 경쟁)

**Risk 4: Difficulty Calibration**
- **Risk**: 난이도 조절 알고리즘이 정확하지 않아 너무 쉽거나 어려움
- **Impact**: 학습 효과 저하, 사용자 이탈
- **Mitigation**:
  - 베타 테스트로 난이도 검증
  - 실시간 데이터 기반 조정
  - 수동 난이도 조절 옵션 제공
  - A/B 테스트로 최적값 탐색

### Medium-Risk Items

**Risk 5: User Acquisition**
- **Risk**: 초기 사용자 확보 실패
- **Mitigation**: 학교/학원 파트너십, SNS 마케팅, 무료 체험 제공

**Risk 6: Server Costs**
- **Risk**: 사용자 급증 시 서버 비용 폭증
- **Mitigation**: 효율적 캐싱, 스케일링 전략, 비용 모니터링

**Risk 7: Cheating**
- **Risk**: 학생들이 답을 공유하거나 자동화 도구 사용
- **Mitigation**: 문제 풀 무작위 제공, 풀이 과정 검증, 이상 패턴 탐지

---

## 12. Future Enhancements (Phase 2+)

### Phase 2: Advanced Features (Month 4-6)

1. **손글씨 인식**: 태블릿에서 손으로 문제 풀기
2. **실시간 대전**: 친구와 1:1 대결 모드
3. **AI 튜터**: Claude API로 개념 설명 및 힌트 생성
4. **음성 피드백**: 정답/오답 시 음성 안내
5. **아바타 커스터마이징**: XP로 아바타 꾸미기
6. **길드 시스템**: 친구들과 팀을 만들어 협력 학습

### Phase 3: Platform Expansion (Month 7-12)

1. **모바일 네이티브 앱**: iOS/Android 앱 출시
2. **다국어 지원**: 영어, 일본어 등
3. **다른 과목 확장**: 물리, 화학, 생물
4. **AI Education Pipeline 연동**: 선생님이 맞춤 문제 생성 가능
5. **학교 라이선스**: B2B 모델 (학교/학원 단체 구독)
6. **오프라인 모드**: 인터넷 없이도 일부 기능 사용 가능

### Phase 4: Advanced Intelligence (Year 2)

1. **완전 맞춤형 커리큘럼**: AI가 학생별 최적 학습 경로 생성
2. **예측 분석**: 시험 성적 예측, 약점 사전 경고
3. **교사용 인사이트**: 반 전체 학습 패턴 분석
4. **VR/AR 수학 세계**: 메타버스에서 수학 개념 체험

---

## 13. Appendices

### Appendix A: Animation Specifications

**1. Seed Growth Animation** (이차방정식 판별식)

```typescript
// Discriminant > 0: Two real roots
{
  type: 'seed_growth',
  duration: 3.0,
  config: {
    discriminant: 'positive', // positive, zero, negative
    seedPosition: { x: '50%', y: '80%' },
    sproutCount: 2,
    growthCurve: 'ease-out',
    finalHeight: '60%'
  },
  frames: [
    { time: 0.0, state: 'seed_planted' },
    { time: 0.5, state: 'seed_cracking' },
    { time: 1.5, state: 'sprouts_emerging' },
    { time: 3.0, state: 'full_grown' }
  ]
}
```

**2. Mountain Climb Animation** (함수 증가/감소)

```typescript
{
  type: 'mountain_climb',
  duration: 4.0,
  config: {
    functionType: 'increasing', // increasing, decreasing, local_max, local_min
    characterType: 'hiker',
    mountainShape: 'quadratic', // linear, quadratic, cubic, etc.
    showPath: true
  },
  frames: [
    { time: 0.0, position: { x: 0, y: 0 }, action: 'start_walking' },
    { time: 2.0, position: { x: 50, y: 80 }, action: 'climbing' },
    { time: 4.0, position: { x: 100, y: 100 }, action: 'plant_flag' }
  ]
}
```

### Appendix B: Sample Problems

**Example 1: Linear Equation (Difficulty 1)**
```json
{
  "problem_text": "다음 방정식을 풀어보세요: 2x + 3 = 11",
  "problem_latex": "2x + 3 = 11",
  "correct_answer": "4",
  "solution_steps": [
    { "step": "양변에서 3을 뺍니다", "equation": "2x = 8" },
    { "step": "양변을 2로 나눕니다", "equation": "x = 4" }
  ],
  "hints": [
    "먼저 상수항을 오른쪽으로 이항해보세요",
    "이항할 때는 부호가 바뀝니다",
    "마지막에 x의 계수로 양변을 나누세요"
  ],
  "animation_type": "scale_balance",
  "estimated_solve_time_seconds": 60
}
```

**Example 2: Quadratic Equation (Difficulty 3)**
```json
{
  "problem_text": "다음 이차방정식의 근의 개수를 판별식을 이용해 구하세요: x² - 4x + 4 = 0",
  "problem_latex": "x^2 - 4x + 4 = 0",
  "correct_answer": "1",
  "solution_steps": [
    { "step": "판별식 D = b² - 4ac를 구합니다", "equation": "D = (-4)² - 4(1)(4)" },
    { "step": "계산합니다", "equation": "D = 16 - 16 = 0" },
    { "step": "D = 0이므로 중근(근이 1개)입니다", "equation": "근의 개수 = 1" }
  ],
  "hints": [
    "판별식은 D = b² - 4ac 입니다",
    "a=1, b=-4, c=4를 대입해보세요",
    "D=0이면 중근, D>0이면 2개, D<0이면 0개입니다"
  ],
  "animation_type": "seed_growth",
  "animation_config": {
    "discriminant": "zero"
  },
  "estimated_solve_time_seconds": 120
}
```

### Appendix C: API Endpoints

**Authentication**
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login
POST   /api/auth/refresh           - Refresh access token
POST   /api/auth/logout            - Logout
GET    /api/auth/me                - Get current user info
```

**Problems**
```
GET    /api/problems/recommend     - Get recommended next problem
GET    /api/problems/:id           - Get problem details
POST   /api/problems/:id/attempt   - Submit answer
GET    /api/problems/:id/hint      - Get next hint (costs XP)
POST   /api/problems/:id/skip      - Skip problem
```

**User Progress**
```
GET    /api/users/me/profile       - Get student profile (level, XP, stats)
GET    /api/users/me/progress      - Get learning progress by topic
GET    /api/users/me/achievements  - Get unlocked achievements
GET    /api/users/me/quests        - Get today's quests
POST   /api/users/me/settings      - Update preferences
```

**Stages**
```
GET    /api/stages                 - Get all stages with unlock status
GET    /api/stages/:id             - Get stage details
GET    /api/stages/:id/progress    - Get progress in stage
POST   /api/stages/:id/start       - Start a stage
```

**Leaderboard**
```
GET    /api/leaderboard/weekly     - Get weekly leaderboard
GET    /api/leaderboard/monthly    - Get monthly leaderboard
GET    /api/leaderboard/friends    - Get friend rankings
```

**Analytics (Teacher/Parent)**
```
GET    /api/analytics/student/:id/overview     - Student overview
GET    /api/analytics/student/:id/sessions     - Learning sessions
GET    /api/analytics/student/:id/weak-areas   - Weak topic analysis
```

### Appendix D: Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/mathflow
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI (Future)
ANTHROPIC_API_KEY=your-claude-api-key

# Monitoring
SENTRY_DSN=your-sentry-dsn

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

---

## 14. Document Control

- **Version**: 1.0.0
- **Author**: AI Agent (Claude)
- **Created**: 2025-11-18
- **Status**: Draft for Review
- **Target Audience**: Developers, Product Managers, Educators
- **Next Review**: After initial feedback
- **Approval Required From**:
  - Technical Lead
  - Product Owner
  - Education Advisor

---

## 15. Next Steps

1. **Review this PRD**: Get feedback from stakeholders
2. **Answer open questions**: Fill in high-priority unknowns
3. **Setup development environment**: Initialize codebase
4. **Create initial design mockups**: UI/UX wireframes
5. **Begin Sprint 1**: Start development!

---

**이 문서에 대한 피드백을 환영합니다!** 🚀
