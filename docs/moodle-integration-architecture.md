# Moodle LMS Integration Architecture
## 학생 개인별 최적 문제 수량 산출 시스템

### 1. 시스템 개요

#### 목적
Moodle 3.7 LMS와 연동하여 각 학생의 학습 데이터를 분석하고, 개인별 최적 문제 수량을 자동으로 산출하는 시스템

#### 기술 스택
- **LMS**: Moodle 3.7
- **Database**: MySQL 5.7
- **Backend**: PHP 7.1.9
- **Integration**: Moodle Plugin API + REST API

---

### 2. 아키텍처 설계

```
┌─────────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │   AI Problem Optimizer Plugin (Local Plugin)       │     │
│  │   - Student Performance Tracking                   │     │
│  │   - Optimal Problem Calculation                    │     │
│  │   - Admin Dashboard                                │     │
│  └────────────┬───────────────────────────────────────┘     │
│               │                                              │
└───────────────┼──────────────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────┐
│                     MySQL 5.7 Database                        │
│  ┌─────────────────────┐  ┌──────────────────────────────┐  │
│  │  Moodle Core Tables │  │  AI Optimizer Tables         │  │
│  │  - mdl_user         │  │  - mdl_ai_student_metrics    │  │
│  │  - mdl_course       │  │  - mdl_ai_problem_history    │  │
│  │  - mdl_quiz         │  │  - mdl_ai_optimization_log   │  │
│  │  - mdl_quiz_attempts│  │  - mdl_ai_problem_config     │  │
│  └─────────────────────┘  └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

### 3. 핵심 기능

#### 3.1 학생 성취도 추적
- 문제 풀이 정확도
- 문제 풀이 속도 (초당 정답률)
- 학습 패턴 분석
- 난이도별 성과 추적

#### 3.2 최적 문제 수량 산출 알고리즘
학생별 최적 문제 수는 다음 요소를 기반으로 계산:

**입력 변수**:
1. **정확도 (accuracy)**: 최근 20문제 정답률 (0-1)
2. **평균 풀이 시간 (avg_time)**: 문제당 평균 소요 시간 (초)
3. **학습 지속도 (consistency)**: 최근 7일 학습 일수
4. **난이도 적응도 (difficulty_adaptation)**: 현재 난이도에서의 성과

**계산 공식**:
```
base_problems = 10  // 기본 문제 수

// 1. 정확도 기반 조정
accuracy_factor =
  if accuracy >= 0.9: 1.3      // 높은 정확도 → 더 많은 문제
  elif accuracy >= 0.7: 1.0    // 보통 정확도 → 기본
  else: 0.7                    // 낮은 정확도 → 적은 문제 (집중 학습)

// 2. 속도 기반 조정
speed_factor =
  if avg_time < 30s: 1.2       // 빠른 풀이 → 더 많은 문제
  elif avg_time < 60s: 1.0     // 보통 속도 → 기본
  else: 0.8                    // 느린 풀이 → 적은 문제

// 3. 지속도 기반 조정
consistency_factor =
  if learning_days >= 5: 1.1   // 꾸준한 학습 → 약간 증가
  else: 1.0                    // 기본

// 최종 계산
optimal_problems = base_problems × accuracy_factor × speed_factor × consistency_factor
optimal_problems = ROUND(CLAMP(optimal_problems, 5, 30))  // 5-30 문제 범위로 제한
```

#### 3.3 적응형 난이도 조정
- 학생이 연속 3회 이상 90% 이상 정답: 난이도 상승
- 학생이 연속 3회 이하 60% 미만 정답: 난이도 하락
- 최적 난이도 구간: 70-85% 정답률 유지

---

### 4. 데이터베이스 스키마

#### 4.1 학생 성과 메트릭 테이블
```sql
CREATE TABLE mdl_ai_student_metrics (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,

    -- 성과 지표
    total_attempts INT(10) DEFAULT 0,
    correct_attempts INT(10) DEFAULT 0,
    accuracy DECIMAL(5,4) DEFAULT 0.0000,

    -- 시간 지표
    avg_time_per_problem INT(10) DEFAULT 0,  -- 초 단위
    total_time_spent INT(10) DEFAULT 0,      -- 초 단위

    -- 학습 패턴
    consecutive_learning_days INT(5) DEFAULT 0,
    last_activity_date INT(10) DEFAULT 0,    -- Unix timestamp

    -- 난이도 추적
    current_difficulty_level INT(2) DEFAULT 1,  -- 1-5
    difficulty_adaptation_score DECIMAL(5,4) DEFAULT 0.5000,

    -- 최적화 결과
    recommended_problems INT(5) DEFAULT 10,
    last_calculated INT(10) DEFAULT 0,       -- Unix timestamp

    -- 메타데이터
    timecreated INT(10) NOT NULL,
    timemodified INT(10) NOT NULL,

    KEY idx_user_course (userid, courseid),
    KEY idx_last_activity (last_activity_date),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4.2 문제 풀이 이력 테이블
```sql
CREATE TABLE mdl_ai_problem_history (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,
    quizid BIGINT(10) UNSIGNED NOT NULL,

    -- 문제 정보
    problem_type VARCHAR(50) NOT NULL,
    difficulty_level INT(2) NOT NULL,

    -- 풀이 결과
    is_correct TINYINT(1) NOT NULL,
    time_spent INT(10) NOT NULL,            -- 초 단위
    attempt_number INT(5) DEFAULT 1,

    -- 학생 답안
    student_answer TEXT,
    correct_answer TEXT,

    -- 메타데이터
    timecreated INT(10) NOT NULL,

    KEY idx_user_course (userid, courseid),
    KEY idx_quiz (quizid),
    KEY idx_timecreated (timecreated),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id),
    FOREIGN KEY (quizid) REFERENCES mdl_quiz(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4.3 최적화 로그 테이블
```sql
CREATE TABLE mdl_ai_optimization_log (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    courseid BIGINT(10) UNSIGNED NOT NULL,

    -- 최적화 파라미터
    accuracy DECIMAL(5,4) NOT NULL,
    avg_time INT(10) NOT NULL,
    consistency_days INT(5) NOT NULL,
    difficulty_level INT(2) NOT NULL,

    -- 계산 결과
    accuracy_factor DECIMAL(5,2) NOT NULL,
    speed_factor DECIMAL(5,2) NOT NULL,
    consistency_factor DECIMAL(5,2) NOT NULL,
    recommended_problems INT(5) NOT NULL,

    -- 메타데이터
    calculation_version VARCHAR(10) DEFAULT '1.0',
    timecreated INT(10) NOT NULL,

    KEY idx_user_course (userid, courseid),
    KEY idx_timecreated (timecreated),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4.4 문제 설정 테이블
```sql
CREATE TABLE mdl_ai_problem_config (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    courseid BIGINT(10) UNSIGNED NOT NULL,

    -- 기본 설정
    base_problems INT(5) DEFAULT 10,
    min_problems INT(5) DEFAULT 5,
    max_problems INT(5) DEFAULT 30,

    -- 난이도 임계값
    difficulty_up_threshold DECIMAL(5,4) DEFAULT 0.9000,
    difficulty_down_threshold DECIMAL(5,4) DEFAULT 0.6000,
    optimal_accuracy_min DECIMAL(5,4) DEFAULT 0.7000,
    optimal_accuracy_max DECIMAL(5,4) DEFAULT 0.8500,

    -- 시간 임계값 (초)
    fast_time_threshold INT(10) DEFAULT 30,
    slow_time_threshold INT(10) DEFAULT 60,

    -- 지속도 임계값 (일)
    high_consistency_days INT(5) DEFAULT 5,

    -- 메타데이터
    timecreated INT(10) NOT NULL,
    timemodified INT(10) NOT NULL,

    UNIQUE KEY idx_courseid (courseid),
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. Moodle 플러그인 구조

```
/local/aiproblemoptimizer/
├── version.php                 # 플러그인 메타데이터
├── settings.php                # 관리자 설정 페이지
├── lang/
│   ├── en/
│   │   └── local_aiproblemoptimizer.php
│   └── ko/
│       └── local_aiproblemoptimizer.php
├── db/
│   ├── install.xml            # 데이터베이스 스키마
│   ├── upgrade.php            # 업그레이드 스크립트
│   └── access.php             # 권한 정의
├── classes/
│   ├── optimizer.php          # 최적화 알고리즘 클래스
│   ├── metrics_tracker.php    # 성과 추적 클래스
│   ├── api.php                # REST API 핸들러
│   └── task/
│       └── calculate_optimal_problems.php  # 스케줄 작업
├── lib.php                    # 핵심 함수 라이브러리
├── index.php                  # 대시보드 메인 페이지
└── styles.css                 # 스타일시트
```

---

### 6. API 엔드포인트

#### 6.1 학생 최적 문제 수 조회
```
GET /local/aiproblemoptimizer/api.php?action=get_optimal_problems
Parameters:
  - userid: int (required)
  - courseid: int (required)

Response:
{
  "success": true,
  "data": {
    "userid": 123,
    "courseid": 45,
    "recommended_problems": 15,
    "current_accuracy": 0.85,
    "avg_time": 45,
    "difficulty_level": 3,
    "last_calculated": 1638360000
  }
}
```

#### 6.2 문제 풀이 결과 기록
```
POST /local/aiproblemoptimizer/api.php?action=record_attempt
Parameters:
  - userid: int (required)
  - courseid: int (required)
  - quizid: int (required)
  - problem_type: string (required)
  - difficulty_level: int (required)
  - is_correct: bool (required)
  - time_spent: int (required, seconds)
  - student_answer: string (optional)

Response:
{
  "success": true,
  "data": {
    "attempt_id": 789,
    "updated_metrics": {
      "accuracy": 0.87,
      "recommended_problems": 16
    }
  }
}
```

#### 6.3 학생 성과 대시보드
```
GET /local/aiproblemoptimizer/api.php?action=get_student_dashboard
Parameters:
  - userid: int (required)
  - courseid: int (required)

Response:
{
  "success": true,
  "data": {
    "overall_stats": {
      "total_attempts": 150,
      "accuracy": 0.83,
      "total_time_hours": 12.5
    },
    "recent_performance": [
      {"date": "2025-11-18", "accuracy": 0.85, "problems_solved": 15},
      {"date": "2025-11-17", "accuracy": 0.80, "problems_solved": 12}
    ],
    "difficulty_progress": {
      "current_level": 3,
      "level_1_mastery": 1.0,
      "level_2_mastery": 0.95,
      "level_3_mastery": 0.75
    },
    "recommendations": {
      "optimal_problems": 16,
      "suggested_difficulty": 3,
      "study_tips": "당신의 정확도가 높습니다. 더 도전적인 문제를 시도해보세요."
    }
  }
}
```

---

### 7. 구현 단계

#### Phase 1: 데이터베이스 및 기본 구조 (1-2일)
- MySQL 테이블 생성
- Moodle 플러그인 기본 구조 설정
- 설치 스크립트 작성

#### Phase 2: 성과 추적 시스템 (2-3일)
- 문제 풀이 이력 기록 기능
- 실시간 메트릭 계산
- Moodle 퀴즈 이벤트 후킹

#### Phase 3: 최적화 알고리즘 구현 (2-3일)
- 최적 문제 수 계산 로직
- 난이도 적응 알고리즘
- 개인화 파라미터 조정

#### Phase 4: API 및 UI (2-3일)
- REST API 엔드포인트 구현
- 학생 대시보드 UI
- 교사 관리 인터페이스

#### Phase 5: 테스트 및 최적화 (2일)
- 단위 테스트
- 통합 테스트
- 성능 최적화

**총 예상 개발 기간: 9-13일**

---

### 8. 보안 고려사항

1. **인증 및 권한**
   - Moodle 세션 기반 인증
   - 역할 기반 접근 제어 (RBAC)
   - 학생은 자신의 데이터만 조회

2. **데이터 보호**
   - SQL Injection 방지 (prepared statements)
   - XSS 방지 (output escaping)
   - CSRF 토큰 검증

3. **개인정보 보호**
   - 학생 데이터 암호화 (필요시)
   - GDPR/개인정보보호법 준수
   - 데이터 보관 기간 정책

---

### 9. 성능 최적화

1. **데이터베이스**
   - 적절한 인덱스 설정
   - 쿼리 최적화
   - 캐싱 전략 (Moodle MUC 활용)

2. **계산 효율성**
   - 배치 처리 (스케줄 작업)
   - 증분 계산 (전체 재계산 최소화)
   - 결과 캐싱 (5분 TTL)

3. **확장성**
   - 비동기 처리 (대량 학생 처리시)
   - 데이터 파티셔닝 (연도별)
   - 로그 아카이빙

---

### 10. 모니터링 및 유지보수

1. **로깅**
   - 모든 API 호출 로깅
   - 에러 추적
   - 성능 메트릭

2. **알림**
   - 시스템 오류 알림
   - 이상 패턴 감지 (비정상적인 문제 수)

3. **리포팅**
   - 일일 통계 리포트
   - 주간 성과 분석
   - 월간 최적화 효과 리포트

---

### 11. 향후 개선 방향

1. **머신러닝 통합**
   - 더 정교한 예측 모델
   - 학습 패턴 클러스터링
   - 추천 시스템 고도화

2. **실시간 적응**
   - 문제 풀이 중 실시간 난이도 조정
   - 동적 힌트 제공

3. **협업 학습**
   - 그룹 기반 최적화
   - 동료 비교 분석

4. **다중 과목 지원**
   - 수학 외 다른 과목 확장
   - 과목간 상관관계 분석
