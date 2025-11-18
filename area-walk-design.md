# Area Walk - 적분 시각화 교육 웹앱 설계 문서

## 1. 프로젝트 개요

### 1.1 목적
적분의 물리적 의미(면적)를 캐릭터의 이동으로 시각화하여 학생들이 직관적으로 이해할 수 있도록 돕는 교육용 웹 애플리케이션

### 1.2 핵심 개념
- **적분 = 면적**: ∫f(x)dx를 그래프 아래 면적으로 표현
- **캐릭터 이동**: 면적의 크기만큼 캐릭터가 이동
- **실시간 피드백**: 학생의 답안에 따라 즉각적인 시각적 피드백 제공

### 1.3 대상 사용자
- 중/고등학교 학생 (적분 개념 학습)
- 교사 (Moodle LMS를 통한 문제 출제 및 관리)

---

## 2. 기술 스택

### 2.1 환경 요구사항
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **웹 브라우저**: Chrome, Firefox, Safari (최신 2개 버전)

### 2.2 프론트엔드
- HTML5
- CSS3 (Flexbox, Grid)
- JavaScript (ES6+)
- Canvas API (2D 그래픽 렌더링)
- jQuery 3.x (Moodle 호환성)

### 2.3 백엔드
- PHP 7.1.9
- MySQL 5.7
- PDO (데이터베이스 접근)
- JSON (API 응답 형식)

### 2.4 Moodle 통합
- Moodle Question Type Plugin
- Moodle Web Services API
- REST API

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   Moodle LMS (3.7)                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │    Area Walk Question Type Plugin                │   │
│  │    (문제 생성, 관리, 성적 처리)                   │   │
│  └────────────────┬─────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────┘
                    │ Moodle API
                    │
┌───────────────────▼─────────────────────────────────────┐
│              Area Walk Backend (PHP)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  API Controller                                   │  │
│  │  - getProblem()    - submitAnswer()              │  │
│  │  - getProgress()   - calculateIntegral()         │  │
│  └───────────┬──────────────────────────────────────┘  │
│              │                                          │
│  ┌───────────▼──────────────────────────────────────┐  │
│  │  Business Logic                                   │  │
│  │  - 적분 계산    - 면적 계산                       │  │
│  │  - 정답 검증    - 진도 추적                       │  │
│  └───────────┬──────────────────────────────────────┘  │
└──────────────┼─────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────┐
│                  MySQL Database (5.7)                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Tables:                                          │  │
│  │  - area_walk_problems   - area_walk_attempts     │  │
│  │  - area_walk_functions  - area_walk_progress     │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
               │
               │ JSON API
               │
┌──────────────▼─────────────────────────────────────────┐
│         Area Walk Frontend (HTML/CSS/JS)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Virtual Smartphone Container (우측 하단)        │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Canvas Visualization Engine              │  │  │
│  │  │  - 함수 그래프 렌더링                      │  │  │
│  │  │  - 적분 면적 표시 (색상 채우기)            │  │  │
│  │  │  - 캐릭터 애니메이션                       │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  UI Components                            │  │  │
│  │  │  - 문제 표시   - 입력 폼                   │  │  │
│  │  │  - 힌트 버튼   - 제출 버튼                 │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

---

## 4. 데이터베이스 스키마

### 4.1 area_walk_problems (문제 정보)
```sql
CREATE TABLE area_walk_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    function_expr VARCHAR(255) NOT NULL COMMENT '적분할 함수 (예: x^2, sin(x))',
    lower_bound DECIMAL(10,4) NOT NULL COMMENT '적분 하한',
    upper_bound DECIMAL(10,4) NOT NULL COMMENT '적분 상한',
    correct_answer DECIMAL(10,4) NOT NULL COMMENT '정답 (적분값)',
    tolerance DECIMAL(10,4) DEFAULT 0.01 COMMENT '오차 허용 범위',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    character_sprite VARCHAR(255) DEFAULT 'default.png' COMMENT '캐릭터 이미지',
    background_image VARCHAR(255) DEFAULT 'default_bg.png',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.2 area_walk_attempts (학생 시도 기록)
```sql
CREATE TABLE area_walk_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Moodle user ID',
    user_answer DECIMAL(10,4) NOT NULL,
    is_correct TINYINT(1) NOT NULL,
    time_spent_seconds INT DEFAULT 0,
    hint_used TINYINT(1) DEFAULT 0,
    attempt_number INT DEFAULT 1,
    session_data JSON COMMENT '상세 인터랙션 데이터',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES area_walk_problems(id),
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.3 area_walk_progress (학습 진도)
```sql
CREATE TABLE area_walk_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    best_score DECIMAL(5,2) DEFAULT 0.00,
    total_attempts INT DEFAULT 0,
    last_accessed_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES area_walk_problems(id),
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.4 area_walk_functions (함수 라이브러리)
```sql
CREATE TABLE area_walk_functions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '함수명 (예: Linear, Quadratic)',
    expression VARCHAR(255) NOT NULL COMMENT '수학 표현식',
    latex_notation VARCHAR(255) COMMENT 'LaTeX 표기법',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(50) COMMENT '카테고리 (polynomial, trigonometric, exponential)',
    visualization_color VARCHAR(7) DEFAULT '#3498db' COMMENT '그래프 색상',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. API 설계

### 5.1 Base URL
```
/area-walk/api/v1/
```

### 5.2 API Endpoints

#### 5.2.1 GET /problems/{id}
문제 정보 가져오기

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "title": "이차함수의 적분",
        "description": "f(x) = x² 함수의 0부터 2까지의 정적분을 구하세요",
        "function": {
            "expression": "x^2",
            "latex": "f(x) = x^2",
            "lower_bound": 0,
            "upper_bound": 2
        },
        "character": {
            "sprite": "character_default.png",
            "start_position": 0
        },
        "background": "bg_default.png",
        "hints": [
            "적분은 그래프 아래 면적과 같습니다",
            "∫x²dx = x³/3 + C"
        ]
    }
}
```

#### 5.2.2 POST /problems/{id}/submit
답안 제출

**Request:**
```json
{
    "user_id": 123,
    "answer": 2.6667,
    "time_spent": 120,
    "hint_used": false,
    "session_data": {
        "interactions": 5,
        "replays": 2
    }
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "is_correct": true,
        "user_answer": 2.6667,
        "correct_answer": 2.6667,
        "error_percentage": 0.0,
        "feedback": "정답입니다! 캐릭터가 정확한 거리만큼 이동했습니다.",
        "score": 100,
        "animation_data": {
            "character_move_distance": 2.6667,
            "area_fill_color": "#2ecc71",
            "success_effect": true
        }
    }
}
```

#### 5.2.3 GET /progress/{user_id}
사용자 진도 조회

**Response:**
```json
{
    "success": true,
    "data": {
        "user_id": 123,
        "total_problems": 10,
        "completed": 7,
        "in_progress": 2,
        "not_started": 1,
        "average_score": 85.5,
        "total_time_spent": 3600,
        "problems": [
            {
                "problem_id": 1,
                "title": "이차함수의 적분",
                "status": "completed",
                "best_score": 100,
                "attempts": 1
            }
        ]
    }
}
```

#### 5.2.4 POST /calculate-integral
적분 계산 (검증용)

**Request:**
```json
{
    "function": "x^2",
    "lower_bound": 0,
    "upper_bound": 2,
    "method": "numerical"
}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "result": 2.6667,
        "method": "simpson",
        "accuracy": "high",
        "computation_time_ms": 15
    }
}
```

---

## 6. UI/UX 설계

### 6.1 가상 스마트폰 레이아웃

```
┌─────────────────────────────────────────────────┐
│  Main Content Area (Moodle 페이지)              │
│                                                  │
│  [문제 설명 영역]                                │
│                                                  │
│                                  ┌─────────────┐│
│                                  │ Virtual     ││
│                                  │ Smartphone  ││
│                                  │ ┌─────────┐ ││
│                                  │ │  📱     │ ││
│                                  │ │         │ ││
│                                  │ │ Canvas  │ ││
│                                  │ │  Area   │ ││
│                                  │ │         │ ││
│                                  │ └─────────┘ ││
│                                  │ [Controls]  ││
│                                  └─────────────┘│
└─────────────────────────────────────────────────┘
```

**위치**: 우측 하단 고정 (position: fixed)
**크기**: 375px × 667px (iPhone 8 비율)

### 6.2 Canvas 영역 구성

```
┌───────────────────────────────────┐
│  Title: f(x) = x²                 │
├───────────────────────────────────┤
│  ┌─────────────────────────────┐  │
│  │   Y                         │  │
│  │   │    ╱‾‾‾╲                │  │
│  │   │   ╱     ╲               │  │
│  │   │  ╱▓▓▓▓▓▓▓╲              │  │ <- 적분 면적 (색칠)
│  │   │ ╱▓▓▓▓▓▓▓▓▓╲             │  │
│  │   └──────────────> X        │  │
│  │     0    🚶    2            │  │ <- 캐릭터
│  └─────────────────────────────┘  │
├───────────────────────────────────┤
│  [?] 힌트  [▶] 재생  [✓] 제출   │
│  입력: [2.6667] ← 답안 입력창     │
└───────────────────────────────────┘
```

### 6.3 UI 컴포넌트

1. **문제 헤더**
   - 함수 수식 (LaTeX 렌더링)
   - 적분 범위 표시

2. **캔버스 영역**
   - 좌표계 (X, Y 축)
   - 함수 그래프 (곡선)
   - 적분 영역 (색칠된 면적)
   - 캐릭터 스프라이트

3. **컨트롤 패널**
   - 힌트 버튼
   - 애니메이션 재생 버튼
   - 답안 입력 필드
   - 제출 버튼

4. **피드백 영역**
   - 정답/오답 메시지
   - 오차 범위 표시
   - 격려 메시지

---

## 7. 적분 시각화 로직

### 7.1 렌더링 파이프라인

```javascript
// 1. 좌표계 설정
setupCoordinateSystem(canvas, bounds);

// 2. 함수 그래프 그리기
drawFunctionGraph(ctx, functionExpr, xMin, xMax);

// 3. 적분 영역 채우기
fillIntegralArea(ctx, functionExpr, lowerBound, upperBound, color);

// 4. 캐릭터 위치 계산 및 렌더링
const distance = calculateIntegralValue(functionExpr, lowerBound, upperBound);
drawCharacter(ctx, startX + distance, yPosition, sprite);

// 5. 애니메이션 (선택적)
animateCharacterWalk(ctx, startX, targetX, duration);
```

### 7.2 적분 계산 알고리즘

**수치 적분법 (Simpson's Rule)**

```php
function calculateIntegral($functionExpr, $lowerBound, $upperBound, $n = 1000) {
    $h = ($upperBound - $lowerBound) / $n;
    $sum = evaluateFunction($functionExpr, $lowerBound)
         + evaluateFunction($functionExpr, $upperBound);

    for ($i = 1; $i < $n; $i++) {
        $x = $lowerBound + $i * $h;
        $multiplier = ($i % 2 == 0) ? 2 : 4;
        $sum += $multiplier * evaluateFunction($functionExpr, $x);
    }

    return ($h / 3) * $sum;
}
```

### 7.3 캐릭터 이동 애니메이션

```javascript
function animateCharacterWalk(startX, endX, integralValue, duration = 2000) {
    const distance = Math.abs(endX - startX);
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out-cubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (distance * eased);
        drawCharacter(currentX, characterY);

        // 면적도 함께 채우기 (진행률에 따라)
        fillIntegralArea(startX, startX + (distance * eased), 'rgba(46, 204, 113, 0.5)');

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 애니메이션 완료 - 결과 표시
            showResult(integralValue);
        }
    }

    animate();
}
```

### 7.4 면적 계산 시각화

```javascript
function fillIntegralArea(ctx, func, a, b, color = 'rgba(52, 152, 219, 0.3)') {
    const steps = 100;
    const dx = (b - a) / steps;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(transformX(a), transformY(0));

    for (let i = 0; i <= steps; i++) {
        const x = a + i * dx;
        const y = evaluateFunction(func, x);
        ctx.lineTo(transformX(x), transformY(y));
    }

    ctx.lineTo(transformX(b), transformY(0));
    ctx.closePath();
    ctx.fill();

    // 면적 값 표시
    const midX = (a + b) / 2;
    const midY = evaluateFunction(func, midX) / 2;
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Area ≈ ${integralValue.toFixed(2)}`,
                 transformX(midX), transformY(midY));
}
```

---

## 8. Moodle 플러그인 통합

### 8.1 Question Type Plugin 구조

```
/question/type/areawalk/
├── version.php              # 플러그인 메타데이터
├── question.php            # 문제 타입 클래스
├── questiontype.php        # 문제 타입 정의
├── renderer.php            # HTML 렌더러
├── edit_areawalk_form.php  # 문제 생성 폼
├── lang/
│   ├── en/
│   │   └── qtype_areawalk.php
│   └── ko/
│       └── qtype_areawalk.php
├── db/
│   ├── install.xml         # 데이터베이스 스키마
│   └── access.php          # 권한 설정
├── styles.css
└── module.js               # JavaScript 통합
```

### 8.2 Moodle과의 데이터 흐름

```
Teacher creates question in Moodle
    ↓
Question data stored in mdl_question + area_walk_problems
    ↓
Student accesses quiz
    ↓
Moodle renders Area Walk iframe
    ↓
Frontend loads via API (getProblem)
    ↓
Student interacts and submits
    ↓
Backend validates and calculates score
    ↓
Result sent back to Moodle (grade recorded)
```

---

## 9. 개발 우선순위 (MVP)

### Phase 1: 기본 인프라 (Week 1)
- [x] 프로젝트 구조 설정
- [ ] 데이터베이스 스키마 생성
- [ ] 기본 API 엔드포인트 (GET /problems, POST /submit)
- [ ] 간단한 HTML 프론트엔드

### Phase 2: 시각화 엔진 (Week 2)
- [ ] Canvas 좌표계 설정
- [ ] 함수 그래프 렌더링 (다항함수)
- [ ] 적분 영역 채우기
- [ ] 정적 캐릭터 배치

### Phase 3: 인터랙션 (Week 3)
- [ ] 답안 입력 및 검증
- [ ] 피드백 메시지
- [ ] 캐릭터 이동 애니메이션
- [ ] 힌트 시스템

### Phase 4: Moodle 통합 (Week 4)
- [ ] Question Type Plugin 개발
- [ ] Moodle API 연동
- [ ] 성적 연동
- [ ] 가상 스마트폰 UI (우측 하단 배치)

### Phase 5: 고도화 (Week 5+)
- [ ] 다양한 함수 지원 (삼각함수, 지수함수)
- [ ] 복잡한 애니메이션
- [ ] 통계 및 진도 추적
- [ ] 반응형 디자인

---

## 10. 보안 고려사항

### 10.1 입력 검증
- 함수 표현식 파싱 시 악성 코드 방지 (eval 사용 금지)
- 화이트리스트 기반 함수 허용 (x, sin, cos, exp, log 등)
- SQL Injection 방지 (PDO Prepared Statements)

### 10.2 인증/인가
- Moodle 세션 토큰 검증
- API 요청 시 사용자 ID 검증
- CSRF 토큰 사용

### 10.3 데이터 보호
- 민감 정보 암호화 (성적, 개인 정보)
- HTTPS 강제 사용
- XSS 방지 (HTML 출력 시 이스케이프)

---

## 11. 성능 최적화

### 11.1 프론트엔드
- Canvas 렌더링 최적화 (더블 버퍼링)
- 이미지 스프라이트 사용 (캐릭터 애니메이션)
- Lazy Loading (문제 데이터)

### 11.2 백엔드
- 적분 계산 결과 캐싱 (Redis)
- 데이터베이스 쿼리 최적화 (인덱스 활용)
- API 응답 압축 (gzip)

### 11.3 데이터베이스
- 복합 인덱스 설정 (user_id, problem_id)
- 파티셔닝 (attempts 테이블 - 날짜별)
- 커넥션 풀 사용

---

## 12. 테스트 전략

### 12.1 단위 테스트
- 적분 계산 함수 (PHPUnit)
- API 엔드포인트 (PHPUnit + HTTP 테스트)
- JavaScript 함수 (Jest)

### 12.2 통합 테스트
- Moodle 플러그인 연동
- End-to-End 시나리오 (Selenium)

### 12.3 수동 테스트
- 다양한 함수로 적분 계산 정확도 검증
- UI/UX 사용성 테스트
- 브라우저 호환성 테스트

---

## 13. 배포 및 유지보수

### 13.1 배포 환경
- **Development**: localhost (XAMPP/MAMP)
- **Staging**: 테스트 서버 (Moodle 3.7)
- **Production**: KAIST 서버

### 13.2 모니터링
- 에러 로깅 (PHP error_log)
- API 응답 시간 모니터링
- 사용자 인터랙션 추적 (Google Analytics)

### 13.3 백업
- 데이터베이스 일일 백업
- 코드 버전 관리 (Git)

---

## 14. 향후 확장 계획

### 14.1 고급 기능
- 다중 적분 (이중 적분, 삼중 적분)
- 극좌표 적분
- 벡터 필드 시각화

### 14.2 게임화 요소
- 레벨 시스템
- 뱃지 및 업적
- 리더보드

### 14.3 AI 활용
- 학생 수준별 문제 추천
- 오답 패턴 분석
- 개인화된 힌트 제공

---

## 15. 참고 자료

- Moodle Question Type API: https://docs.moodle.org/dev/Question_types
- Canvas API Tutorial: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- Numerical Integration: Simpson's Rule
- MathJax for LaTeX rendering: https://www.mathjax.org/

---

**문서 버전**: 1.0
**작성일**: 2025-11-18
**작성자**: Claude AI Assistant
**상태**: Initial Design - Ready for Implementation
