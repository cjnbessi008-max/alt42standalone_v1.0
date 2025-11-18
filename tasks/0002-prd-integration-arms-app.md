# Product Requirements Document: Integration Arms App

## 1. Introduction/Overview

### Background
Integration Arms는 KAIST Touch Math Academy에서 개발하는 부분적분(Integration by Parts) 교육용 인터랙티브 앱입니다. 학생들이 부분적분 공식을 시각적이고 직관적으로 이해할 수 있도록 두 개의 로봇 기계팔이 공식의 각 부분을 "당기며" 만드는 독특한 시각화를 제공합니다.

### Problem Statement
부분적분은 미적분학에서 가장 어려운 개념 중 하나입니다:
- 추상적인 수식 조작으로 인해 학생들이 개념적 이해에 어려움
- 왜 u와 dv를 선택해야 하는지 직관적으로 이해하기 어려움
- 공식의 각 부분이 어떻게 변환되는지 시각화 부족
- 기존 교육 방식은 단순 암기 위주

### Solution
Integration Arms 앱은:
1. **두 개의 로봇 팔**이 부분적분 공식의 양쪽을 시각화
2. **애니메이션**으로 u·dv가 u·v - ∫v·du로 변환되는 과정 표현
3. **Moodle LMS 연동**으로 문제를 자동으로 받아와 표시
4. **가상 스마트폰 인터페이스**로 학생들에게 친숙한 UX 제공
5. **인터랙티브 조작**으로 학생이 직접 u와 dv를 선택하며 학습

### Goal
부분적분 공식의 구조적 이해를 80% 이상의 학생이 달성하도록 하며, 학습 시간을 기존 대비 40% 단축

---

## 2. Technical Requirements

### Technology Stack
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Animation**: Canvas API 또는 SVG with GSAP
- **Server**: Apache 2.4+ with mod_php

### System Integration
- Moodle LTI (Learning Tools Interoperability) v1.3 연동
- Moodle Web Services API 사용
- OAuth 2.0 인증

---

## 3. Core Features

### 3.1 Moodle LMS 연동
**FR-1.1**: 시스템은 Moodle Quiz 모듈에서 부분적분 문제를 REST API를 통해 가져와야 함
**FR-1.2**: 문제 형식은 STACK (System for Teaching and Assessment using a Computer algebra Kernel) 또는 Custom Question Type
**FR-1.3**: 학생 인증은 Moodle 세션을 통해 처리
**FR-1.4**: 학생의 풀이 과정과 결과를 Moodle에 자동 제출

### 3.2 가상 스마트폰 디스플레이
**FR-2.1**: 우측 하단에 360x640px 가상 스마트폰 화면 표시
**FR-2.2**: 반응형 디자인으로 실제 모바일에서도 작동
**FR-2.3**: 드래그로 위치 조정 가능
**FR-2.4**: 최소화/최대화 기능

### 3.3 부분적분 공식 시각화
**FR-3.1**: 두 개의 로봇 기계팔이 화면 좌우에 배치
**FR-3.2**: 왼쪽 팔: ∫u·dv (원래 적분식)
**FR-3.3**: 오른쪽 팔: u·v - ∫v·du (변환된 식)
**FR-3.4**: 애니메이션으로 변환 과정을 3-5초에 걸쳐 표현

### 3.4 인터랙티브 문제 풀이
**FR-4.1**: 학생이 적분식에서 u와 dv를 선택
**FR-4.2**: 실시간 피드백 제공 (올바른/잘못된 선택)
**FR-4.3**: 선택 후 du와 v를 자동 계산하여 표시
**FR-4.4**: 단계별 힌트 제공 기능

### 3.5 로봇 팔 애니메이션
**FR-5.1**: 각 팔은 3개의 관절(어깨, 팔꿈치, 손목)을 가짐
**FR-5.2**: 부드러운 inverse kinematics 애니메이션
**FR-5.3**: 수식을 "잡고 당기는" 동작 구현
**FR-5.4**: 애니메이션 속도 조절 가능

---

## 4. User Stories

### Story 1: 문제 로딩
> **As a** 학생,
> **I want to** Moodle에서 자동으로 부분적분 문제를 불러오기,
> **So that** 별도 로그인 없이 바로 학습 시작 가능

**Acceptance Criteria**:
- Moodle 로그인 세션 유지
- 문제 로딩 시간 < 2초
- 문제가 없을 경우 명확한 안내 메시지

### Story 2: 시각적 학습
> **As a** 학생,
> **I want to** 부분적분 공식이 변환되는 과정을 애니메이션으로 보기,
> **So that** 공식의 구조를 직관적으로 이해

**Acceptance Criteria**:
- 애니메이션 재생/일시정지/반복 가능
- 각 단계별 설명 텍스트 표시
- 60fps 부드러운 애니메이션

### Story 3: 인터랙티브 연습
> **As a** 학생,
> **I want to** 직접 u와 dv를 선택하고 결과를 확인,
> **So that** 능동적으로 학습하고 즉각적인 피드백 받기

**Acceptance Criteria**:
- 드래그 앤 드롭 또는 클릭으로 선택
- 즉시 정답/오답 피드백
- 틀렸을 경우 힌트 제공

### Story 4: 모바일 경험
> **As a** 학생,
> **I want to** 스마트폰에서도 동일한 경험,
> **So that** 언제 어디서나 학습 가능

**Acceptance Criteria**:
- 터치 인터페이스 지원
- 모바일 화면에 최적화된 UI
- 가로/세로 모드 모두 지원

---

## 5. Data Models

### 5.1 Database Schema (MySQL 5.7)

```sql
-- 문제 정보
CREATE TABLE integration_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    problem_latex TEXT NOT NULL,
    correct_u VARCHAR(255),
    correct_dv VARCHAR(255),
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 풀이 기록
CREATE TABLE student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,
    selected_u VARCHAR(255),
    selected_dv VARCHAR(255),
    is_correct BOOLEAN,
    attempt_time FLOAT,
    hint_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES integration_problems(id),
    INDEX idx_user_problem (moodle_user_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 애니메이션 설정
CREATE TABLE animation_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    animation_speed FLOAT DEFAULT 1.0,
    auto_play BOOLEAN DEFAULT TRUE,
    show_hints BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습 진도
CREATE TABLE learning_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    average_time FLOAT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_progress (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 6. API Specifications

### 6.1 Moodle Integration Endpoints

#### GET /api/problem.php
문제 정보 가져오기

**Request**:
```
GET /api/problem.php?session_token={token}&question_id={id}
```

**Response**:
```json
{
    "success": true,
    "problem": {
        "id": 123,
        "latex": "\\int x \\sin(x) dx",
        "difficulty": "medium",
        "hints": ["u를 미분하기 쉬운 항으로 선택", "dv는 적분 가능한 항"]
    }
}
```

#### POST /api/submit.php
답안 제출

**Request**:
```json
{
    "session_token": "abc123",
    "problem_id": 123,
    "selected_u": "x",
    "selected_dv": "\\sin(x)dx"
}
```

**Response**:
```json
{
    "success": true,
    "is_correct": true,
    "feedback": "정답입니다! x를 u로 선택하면 미분 시 상수가 됩니다.",
    "next_steps": {
        "du": "dx",
        "v": "-\\cos(x)"
    }
}
```

### 6.2 Animation Control Endpoints

#### GET /api/animation-state.php
애니메이션 상태 조회

#### POST /api/save-progress.php
학습 진도 저장

---

## 7. UI/UX Design

### 7.1 가상 스마트폰 레이아웃

```
┌─────────────────────────────────────┐
│  Integration Arms        [─][□][×] │ <- 헤더
├─────────────────────────────────────┤
│                                     │
│     문제: ∫ x·sin(x) dx            │
│                                     │
├─────────────────────────────────────┤
│  [왼쪽 로봇팔]      [오른쪽 로봇팔] │
│                                     │
│   ∫ u·dv      →      u·v - ∫v·du   │
│                                     │
│   [애니메이션 영역 - 360px]          │
│                                     │
├─────────────────────────────────────┤
│  u 선택:  [ x ] [sin(x)]           │
│  dv 선택: [ x ] [sin(x)dx]         │
│                                     │
│  [제출] [힌트] [다시보기]            │
├─────────────────────────────────────┤
│  진도: ████░░░░░ 45%               │
└─────────────────────────────────────┘
```

### 7.2 컬러 스킴
- **Primary**: #2196F3 (파란색 - 수학적 신뢰감)
- **Secondary**: #FF9800 (주황색 - 로봇 팔 강조)
- **Success**: #4CAF50 (정답)
- **Error**: #F44336 (오답)
- **Background**: #FAFAFA

### 7.3 Typography
- **수식**: KaTeX 렌더링
- **본문**: Noto Sans KR, 16px
- **버튼**: 18px, bold

---

## 8. Animation Specifications

### 8.1 로봇 팔 구조

각 팔은 3개의 세그먼트:
1. **Upper Arm**: 100px
2. **Forearm**: 80px
3. **Hand**: 40px

### 8.2 애니메이션 시퀀스

**Phase 1: 초기 상태 (0-1초)**
- 왼쪽 팔: ∫u·dv를 표시
- 오른쪽 팔: 비활성 상태

**Phase 2: 변환 시작 (1-3초)**
- 왼쪽 팔이 u·dv를 "잡고" 당김
- 수식이 분해되는 애니메이션
- u → u (그대로), dv → v (적분)

**Phase 3: 재조합 (3-4초)**
- 오른쪽 팔이 활성화
- u·v 생성 및 배치
- -∫v·du 생성

**Phase 4: 완료 (4-5초)**
- 최종 공식 강조
- 색상 변화로 완성 표시

### 8.3 Easing Functions
- 팔 움직임: `easeInOutCubic`
- 수식 변환: `easeOutQuad`
- 강조 효과: `bounce`

---

## 9. Technical Architecture

### 9.1 Directory Structure

```
integration-arms/
├── public/
│   ├── index.php                 # 메인 진입점
│   ├── css/
│   │   ├── main.css             # 메인 스타일
│   │   ├── smartphone.css       # 스마트폰 UI
│   │   └── animations.css       # 애니메이션 스타일
│   ├── js/
│   │   ├── app.js               # 메인 앱 로직
│   │   ├── robot-arm.js         # 로봇 팔 클래스
│   │   ├── animation-engine.js  # 애니메이션 엔진
│   │   ├── math-parser.js       # 수식 파싱
│   │   └── moodle-connector.js  # Moodle API 연결
│   ├── img/
│   │   ├── robot-segment-*.svg  # 로봇 팔 SVG
│   │   └── icons/
│   └── lib/
│       ├── katex/               # 수식 렌더링
│       └── gsap/                # 애니메이션 라이브러리
├── src/
│   ├── config/
│   │   ├── database.php         # DB 설정
│   │   └── moodle.php           # Moodle 설정
│   ├── api/
│   │   ├── problem.php          # 문제 API
│   │   ├── submit.php           # 제출 API
│   │   └── progress.php         # 진도 API
│   ├── models/
│   │   ├── Problem.php
│   │   ├── Attempt.php
│   │   └── Progress.php
│   ├── services/
│   │   ├── MoodleService.php    # Moodle 연동 서비스
│   │   └── GradingService.php   # 채점 로직
│   └── utils/
│       ├── Session.php          # 세션 관리
│       └── Logger.php           # 로깅
├── database/
│   ├── schema.sql               # DB 스키마
│   └── seed.sql                 # 샘플 데이터
├── tests/
│   ├── unit/
│   └── integration/
├── docs/
│   └── API.md
├── .htaccess
├── composer.json
└── README.md
```

### 9.2 Class Diagram

```
┌─────────────────────┐
│   MoodleService     │
├─────────────────────┤
│ - apiUrl            │
│ - token             │
├─────────────────────┤
│ + fetchProblem()    │
│ + submitAnswer()    │
│ + syncProgress()    │
└─────────────────────┘
          │
          │ uses
          ▼
┌─────────────────────┐
│   Problem           │
├─────────────────────┤
│ - id                │
│ - latex             │
│ - correctU          │
│ - correctDv         │
├─────────────────────┤
│ + validate()        │
│ + getHints()        │
└─────────────────────┘
          │
          │ has many
          ▼
┌─────────────────────┐
│   Attempt           │
├─────────────────────┤
│ - userId            │
│ - selectedU         │
│ - selectedDv        │
│ - isCorrect         │
├─────────────────────┤
│ + submit()          │
│ + grade()           │
└─────────────────────┘
```

---

## 10. Moodle Integration Details

### 10.1 인증 플로우

```
Student → Moodle Login
              ↓
        Generate Token
              ↓
        Redirect to Integration Arms
              ↓
        Validate Token
              ↓
        Load Problem
```

### 10.2 Moodle Web Services 설정

필요한 Moodle Functions:
- `core_webservice_get_site_info`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_attempt_data`
- `mod_quiz_save_attempt`
- `core_user_get_users_by_field`

### 10.3 Custom Question Type

Moodle에 설치할 Custom Question Type:
- **Name**: `qtype_integration`
- **Format**: LaTeX 기반 부분적분 문제
- **Grading**: 자동 채점 + 부분 점수

---

## 11. Performance Requirements

### 11.1 Response Times
- 문제 로딩: < 2초
- 답안 제출 및 피드백: < 1초
- 애니메이션 프레임레이트: 60 FPS
- Moodle API 호출: < 3초

### 11.2 Browser Support
- Chrome 80+
- Firefox 75+
- Safari 13+
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

### 11.3 Scalability
- 동시 접속자: 100명 (초기)
- 데이터베이스 쿼리 최적화: 인덱스 활용
- CDN 사용: 정적 리소스

---

## 12. Security Requirements

### 12.1 인증 및 권한
- Moodle 세션 토큰 검증
- CSRF 토큰 사용
- XSS 방지: 입력 sanitization

### 12.2 데이터 보호
- SQL Injection 방지: Prepared Statements
- HTTPS 필수
- 민감 정보 암호화

### 12.3 로깅 및 감사
- 모든 API 호출 로깅
- 학생 활동 추적 (개인정보 보호 준수)

---

## 13. Testing Strategy

### 13.1 Unit Tests
- PHP 백엔드 로직 (PHPUnit)
- JavaScript 함수 (Jest)

### 13.2 Integration Tests
- Moodle API 연동
- 데이터베이스 쿼리

### 13.3 E2E Tests
- 사용자 시나리오 (Selenium)
- 모바일 디바이스 테스트

### 13.4 Performance Tests
- Load testing (100 concurrent users)
- Animation performance profiling

---

## 14. Deployment Plan

### 14.1 Phase 1: Development (Weeks 1-4)
- 프로젝트 구조 설정
- Moodle 연동 구현
- 기본 UI 구현

### 14.2 Phase 2: Animation (Weeks 5-6)
- 로봇 팔 애니메이션 구현
- 수식 변환 시각화
- 인터랙션 추가

### 14.3 Phase 3: Testing (Week 7)
- 통합 테스트
- 사용자 테스트
- 버그 수정

### 14.4 Phase 4: Pilot (Week 8)
- 소규모 학생 그룹 테스트
- 피드백 수집 및 개선

### 14.5 Phase 5: Production (Week 9+)
- 전체 배포
- 모니터링 및 유지보수

---

## 15. Success Metrics

### 15.1 학습 효과
- 부분적분 개념 이해도: 80% 이상
- 문제 풀이 정확도: 70% 이상
- 학습 시간 단축: 40% 이상

### 15.2 사용자 만족도
- NPS (Net Promoter Score): 50 이상
- 앱 사용 빈도: 주 3회 이상
- 세션 시간: 평균 10분 이상

### 15.3 기술 지표
- 페이지 로드 시간: < 2초
- 에러율: < 1%
- 가동률: 99.5% 이상

---

## 16. Future Enhancements

### 16.1 Phase 2 Features
- AI 기반 문제 추천
- 학습 경로 자동 생성
- 소셜 학습 기능 (친구 비교)

### 16.2 Phase 3 Features
- VR/AR 지원
- 음성 인터페이스
- 다국어 지원

### 16.3 다른 수학 개념으로 확장
- 치환 적분
- 삼각 치환
- 부분 분수 분해

---

## 17. Risks and Mitigations

### Risk 1: Moodle API 변경
**Mitigation**: API 버전 고정, wrapper 패턴 사용

### Risk 2: 애니메이션 성능 저하
**Mitigation**: Canvas 대신 WebGL 고려, 프레임 드롭 처리

### Risk 3: 학생 이탈률
**Mitigation**: 게임화 요소 추가, 즉각적인 피드백

### Risk 4: 모바일 호환성
**Mitigation**: Progressive Web App, 철저한 디바이스 테스트

---

## 18. Appendix

### 18.1 부분적분 공식
```
∫ u dv = uv - ∫ v du
```

### 18.2 예제 문제

**Easy**:
- ∫ x·e^x dx
- ∫ x·cos(x) dx

**Medium**:
- ∫ x²·sin(x) dx
- ∫ x·ln(x) dx

**Hard**:
- ∫ e^x·cos(x) dx
- ∫ x²·e^(-x) dx

### 18.3 References
- Moodle 3.7 Documentation
- KaTeX Documentation
- GSAP Animation Library
- Canvas API Specification

---

**Document Version**: 1.0
**Last Updated**: 2025-11-18
**Author**: Claude (AI Agent)
**Status**: Draft - Ready for Implementation
