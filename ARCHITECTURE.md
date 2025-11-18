# Deviation Breeze - Architecture Design Document

## 프로젝트 개요

**Deviation Breeze**는 Moodle LMS와 연동하여 학생들의 학습 편차를 실시간으로 분석하고 시각화하는 웹 애플리케이션입니다.
편차가 "바람처럼 퍼져나가는" 시각적 효과로 학생들의 학습 수준 차이를 직관적으로 표현합니다.

## 기술 스택

### Backend
- **PHP**: 7.1.9
- **Database**: MySQL 5.7
- **Framework**: Slim Framework 3.x (lightweight RESTful API)
- **Moodle Integration**: Moodle Web Services API

### Frontend
- **HTML5/CSS3**: 반응형 웹 디자인
- **JavaScript**: ES6+ (Babel transpiling)
- **UI Framework**: Bootstrap 4.6 (PHP 7.1 환경 호환)
- **Visualization**: D3.js v5 (편차 시각화)
- **Animation**: GSAP (GreenSock Animation Platform)

### Infrastructure
- **Web Server**: Apache 2.4+ with mod_php or Nginx with PHP-FPM
- **Development**: Docker Compose (local development)
- **Version Control**: Git

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Deviation Breeze                         │
│                         Web Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │              Main Dashboard (좌측)                      │    │
│  │  ┌─────────────────────────────────────────────┐      │    │
│  │  │    Deviation Visualization Area             │      │    │
│  │  │    (편차 바람 효과 - Breeze Effect)          │      │    │
│  │  └─────────────────────────────────────────────┘      │    │
│  │                                                        │    │
│  │  ┌─────────────────────────────────────────────┐      │    │
│  │  │    Student List & Statistics                │      │    │
│  │  └─────────────────────────────────────────────┘      │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌───────────────────────────┐                                │
│  │   Virtual Smartphone      │  (우측 하단 고정)               │
│  │   ┌───────────────────┐   │                                │
│  │   │  🔋 12:30  📶    │   │                                │
│  │   ├───────────────────┤   │                                │
│  │   │                   │   │                                │
│  │   │   Quiz/Problem    │   │                                │
│  │   │   Display Area    │   │                                │
│  │   │                   │   │                                │
│  │   └───────────────────┘   │                                │
│  └───────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
         │                             ▲
         │ REST API                    │
         ▼                             │
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (PHP)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │   Moodle     │  │  Deviation   │  │   Problem         │   │
│  │  Connector   │  │  Calculator  │  │   Manager         │   │
│  └──────────────┘  └──────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
         │                             │
         │                             │
         ▼                             ▼
┌──────────────────┐         ┌──────────────────┐
│  Moodle 3.7      │         │   MySQL 5.7      │
│  Web Services    │         │   Database       │
│  API             │         │                  │
└──────────────────┘         └──────────────────┘
```

## 주요 컴포넌트

### 1. Moodle Connector (PHP)
**파일**: `backend/src/MoodleConnector.php`

**책임**:
- Moodle Web Services API 인증
- 퀴즈/문제 데이터 조회
- 학생 목록 및 성적 조회
- 실시간 데이터 동기화

**주요 메서드**:
```php
- authenticate(): 토큰 기반 인증
- getQuizzes(): 퀴즈 목록 조회
- getQuizQuestions($quizId): 퀴즈 문제 조회
- getStudentAttempts($quizId): 학생 응시 기록
- getStudentGrades($courseId): 학생 성적 데이터
```

### 2. Deviation Calculator (PHP)
**파일**: `backend/src/DeviationCalculator.php`

**책임**:
- 학생별 학습 편차 계산
- 표준편차, 평균, 분산 통계 분석
- 학습 그룹 클러스터링 (상/중/하 또는 custom)
- 편차 추세 분석

**알고리즘**:
```
편차 점수 = (학생 점수 - 평균 점수) / 표준편차
시각화 강도 = abs(편차 점수) * 가중치
```

### 3. Problem Manager (PHP)
**파일**: `backend/src/ProblemManager.php`

**책임**:
- 문제 캐싱 및 관리
- 문제 난이도 분석
- adaptive learning 알고리즘 (편차에 따른 문제 추천)

### 4. Virtual Smartphone UI (JavaScript)
**파일**: `frontend/js/smartphone-simulator.js`

**책임**:
- 모바일 디바이스 시뮬레이션
- 터치 인터랙션 에뮬레이션
- 문제 표시 및 답안 입력
- 반응형 크기 조절

**특징**:
- 우측 하단 고정 위치
- 드래그 가능 (선택적)
- 실제 스마트폰 비율 (9:16 또는 9:19.5)

### 5. Deviation Breeze Visualizer (JavaScript + D3.js)
**파일**: `frontend/js/breeze-visualizer.js`

**책임**:
- 편차 데이터를 "바람 효과"로 시각화
- 파티클 애니메이션 (학생별 위치 표현)
- 실시간 업데이트
- 인터랙티브 툴팁 (학생 정보 표시)

**시각화 개념**:
```
- 각 학생 = 파티클 (원 또는 아이콘)
- 평균 = 중심점
- 편차 크기 = 중심에서의 거리
- 바람 효과 = 파티클들이 흩날리는 애니메이션
- 색상 = 성적 수준 (빨강: 낮음, 노랑: 중간, 초록: 높음)
```

## 데이터베이스 스키마

### 주요 테이블

#### 1. `courses`
Moodle 코스 정보 캐싱
```sql
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_course_id (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 2. `students`
학생 정보
```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 3. `quizzes`
퀴즈/문제 정보
```sql
CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL UNIQUE,
    course_id INT NOT NULL,
    quiz_name VARCHAR(255) NOT NULL,
    question_count INT DEFAULT 0,
    time_limit INT DEFAULT 0,
    last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_moodle_quiz_id (moodle_quiz_id),
    INDEX idx_course_id (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 4. `quiz_attempts`
학생 응시 기록
```sql
CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_attempt_id INT NOT NULL UNIQUE,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    time_spent INT DEFAULT 0,
    attempt_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_quiz_student (quiz_id, student_id),
    INDEX idx_attempt_date (attempt_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 5. `deviation_analytics`
편차 분석 결과 저장
```sql
CREATE TABLE deviation_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    avg_score DECIMAL(5,2) NOT NULL,
    std_deviation DECIMAL(5,2) NOT NULL,
    deviation_score DECIMAL(5,2) NOT NULL COMMENT 'Z-score',
    percentile INT NOT NULL,
    cluster_group ENUM('high', 'medium', 'low') NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_quiz_student (quiz_id, student_id),
    INDEX idx_deviation_score (deviation_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### 6. `app_settings`
애플리케이션 설정
```sql
CREATE TABLE app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## API 엔드포인트

### RESTful API 구조

**Base URL**: `/api/v1`

#### Authentication
```
POST   /auth/login          - Moodle 토큰 설정
POST   /auth/logout         - 세션 종료
GET    /auth/status         - 인증 상태 확인
```

#### Courses & Quizzes
```
GET    /courses             - 코스 목록 조회
GET    /courses/:id/quizzes - 특정 코스의 퀴즈 목록
GET    /quizzes/:id         - 퀴즈 상세 정보
GET    /quizzes/:id/questions - 퀴즈 문제 목록
```

#### Students & Attempts
```
GET    /students            - 학생 목록
GET    /students/:id        - 학생 상세 정보
GET    /quizzes/:id/attempts - 퀴즈 응시 기록
POST   /attempts            - 새 응시 기록 (스마트폰에서 제출)
```

#### Deviation Analysis
```
GET    /deviation/quiz/:id          - 특정 퀴즈의 편차 분석
GET    /deviation/student/:id       - 특정 학생의 편차 추이
GET    /deviation/visualization/:id - 시각화 데이터 (JSON)
POST   /deviation/calculate         - 편차 재계산 트리거
```

#### Smartphone Simulator
```
GET    /smartphone/current-problem  - 현재 표시할 문제
POST   /smartphone/submit-answer    - 답안 제출
GET    /smartphone/feedback         - 즉각 피드백
```

## 프로젝트 디렉토리 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── config/
│   │   ├── database.php        # DB 설정
│   │   ├── moodle.php          # Moodle API 설정
│   │   └── app.php             # 애플리케이션 설정
│   ├── src/
│   │   ├── Controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── QuizController.php
│   │   │   ├── StudentController.php
│   │   │   └── DeviationController.php
│   │   ├── Models/
│   │   │   ├── Course.php
│   │   │   ├── Student.php
│   │   │   ├── Quiz.php
│   │   │   └── Attempt.php
│   │   ├── Services/
│   │   │   ├── MoodleConnector.php
│   │   │   ├── DeviationCalculator.php
│   │   │   └── ProblemManager.php
│   │   └── Utils/
│   │       ├── Database.php
│   │       └── ResponseHelper.php
│   ├── public/
│   │   └── index.php           # API entry point
│   └── vendor/                 # Composer dependencies
│
├── frontend/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css
│   │   │   ├── smartphone.css
│   │   │   └── breeze-viz.css
│   │   ├── js/
│   │   │   ├── main.js
│   │   │   ├── smartphone-simulator.js
│   │   │   ├── breeze-visualizer.js
│   │   │   └── api-client.js
│   │   └── img/
│   │       └── smartphone-frame.png
│   └── index.html              # Main application
│
├── database/
│   ├── schema.sql              # 전체 스키마
│   ├── migrations/             # 마이그레이션 파일들
│   └── seeds/                  # 초기 데이터
│
├── docker/
│   ├── docker-compose.yml
│   ├── php/
│   │   └── Dockerfile
│   └── mysql/
│       └── my.cnf
│
├── docs/
│   ├── API.md                  # API 문서
│   ├── DEPLOYMENT.md           # 배포 가이드
│   └── MOODLE_SETUP.md         # Moodle 연동 설정
│
├── tests/
│   ├── backend/
│   └── frontend/
│
├── .env.example
├── composer.json
├── package.json
├── README.md
└── ARCHITECTURE.md (this file)
```

## 핵심 기능 플로우

### 1. 데이터 동기화 플로우
```
1. Moodle Web Services API 인증
2. 코스 목록 조회 및 캐싱
3. 퀴즈 데이터 가져오기
4. 학생 응시 기록 동기화
5. 편차 계산 및 저장
6. 프론트엔드로 데이터 전송
```

### 2. 편차 시각화 플로우
```
1. 사용자가 퀴즈 선택
2. Backend에서 편차 분석 데이터 조회
3. D3.js로 시각화 데이터 렌더링
   - 파티클 생성 (각 학생)
   - 위치 계산 (편차에 따라)
   - 바람 애니메이션 시작
4. 실시간 업데이트 (WebSocket or Polling)
```

### 3. 스마트폰 문제 표시 플로우
```
1. 교사가 퀴즈 선택 및 특정 문제 푸시
2. Backend에서 문제 데이터 준비
3. 스마트폰 시뮬레이터에 문제 표시
4. 학생이 답안 입력
5. Backend로 답안 제출
6. 즉시 정답/오답 피드백
7. 편차 데이터 업데이트
8. 시각화 자동 갱신
```

## 보안 고려사항

1. **Moodle API 토큰 보안**
   - 환경변수로 관리 (.env)
   - HTTPS 필수
   - 토큰 갱신 메커니즘

2. **SQL Injection 방지**
   - PDO Prepared Statements 사용
   - 모든 입력값 검증

3. **XSS 방지**
   - 출력 시 htmlspecialchars() 사용
   - Content Security Policy 헤더

4. **CSRF 보호**
   - CSRF 토큰 사용
   - SameSite 쿠키 설정

5. **접근 제어**
   - Role-based access control (교사/학생)
   - Session 관리

## 성능 최적화

1. **캐싱 전략**
   - Moodle 데이터 로컬 캐싱 (5분 TTL)
   - 편차 계산 결과 캐싱
   - Redis 도입 고려 (향후)

2. **데이터베이스 최적화**
   - 적절한 인덱스 설정
   - 쿼리 최적화
   - Connection pooling

3. **프론트엔드 최적화**
   - 자산 압축 (minify)
   - 이미지 최적화
   - Lazy loading

## 확장성 고려사항

### Phase 1 (Current)
- 단일 서버 배포
- 최대 100명 동시 사용자 지원

### Phase 2 (Future)
- 로드 밸런서 도입
- 데이터베이스 레플리케이션
- Redis 캐싱 레이어

### Phase 3 (Future)
- 마이크로서비스 아키텍처
- Kubernetes 배포
- 실시간 WebSocket 통신

## 개발 로드맵

### Sprint 1 (Week 1-2)
- [x] 아키텍처 설계
- [ ] 프로젝트 구조 생성
- [ ] 데이터베이스 스키마 구현
- [ ] Moodle API 연동 기본 구현

### Sprint 2 (Week 3-4)
- [ ] 편차 계산 알고리즘 구현
- [ ] RESTful API 개발
- [ ] 기본 프론트엔드 레이아웃

### Sprint 3 (Week 5-6)
- [ ] 스마트폰 시뮬레이터 UI 구현
- [ ] Deviation Breeze 시각화 구현
- [ ] 실시간 데이터 업데이트

### Sprint 4 (Week 7-8)
- [ ] 통합 테스트
- [ ] 성능 최적화
- [ ] 문서화 및 배포 준비

## 참고자료

- Moodle Web Services API: https://docs.moodle.org/dev/Web_services
- D3.js Documentation: https://d3js.org/
- Slim Framework: https://www.slimframework.com/docs/v3/
- MySQL 5.7 Reference: https://dev.mysql.com/doc/refman/5.7/en/

---

**작성자**: AI Assistant
**작성일**: 2025-11-18
**버전**: 1.0.0
