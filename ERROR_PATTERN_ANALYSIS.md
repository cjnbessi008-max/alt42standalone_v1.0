# 실수 패턴 분석 웹앱 (Error Pattern Analysis System)

## 개요
Moodle LMS와 연동하여 학생의 오답 시 실수 이유를 수집하고, AI 기반 패턴 분석을 제공하는 독립형 웹 애플리케이션

## 기술 스택

### Frontend
- **React 18.2+** with TypeScript
- **Material-UI (MUI) v5** - UI 컴포넌트 라이브러리
- **Recharts** - 데이터 시각화
- **React Query** - 서버 상태 관리
- **React Router v6** - 라우팅

### Backend
- **Node.js 18+** with TypeScript
- **Express 4.18+** - REST API 서버
- **MySQL 5.7** - 데이터베이스
- **mysql2** - MySQL 드라이버 (Promise 지원)
- **TypeORM** - ORM (MySQL 5.7 호환)
- **Passport.js** - 인증

### Moodle 연동
- **Moodle Web Services REST API**
- **LTI 1.3** (선택적, 고급 통합)

### AI & 분석
- **Claude API** (Anthropic) - 패턴 인사이트 생성
- **통계 분석 라이브러리** - 기본 패턴 분석

### DevOps
- **Docker & Docker Compose** - 컨테이너화
- **Nginx** - 리버스 프록시
- **PM2** - Node.js 프로세스 관리

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────┐│
│  │  Student View   │  │  Teacher View    │  │ Admin View  ││
│  │  (오답 이유 선택)│  │  (패턴 대시보드)   │  │ (설정 관리) ││
│  └─────────────────┘  └──────────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │ Auth Module  │  │ Error Module │  │ Pattern Analysis  │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │Moodle Sync   │  │ AI Service   │  │ Report Generator  │ │
│  └──────────────┘  └──────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
    ┌─────────────┐      ┌──────────────┐    ┌──────────────┐
    │   MySQL     │      │ Moodle REST  │    │  Claude API  │
    │  Database   │      │     API      │    │  (Anthropic) │
    └─────────────┘      └──────────────┘    └──────────────┘
```

## 데이터베이스 스키마 (MySQL 5.7)

### 1. users (사용자 테이블)
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user_id (moodle_user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. error_categories (실수 유형 카테고리)
```sql
CREATE TABLE error_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_ko VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**기본 카테고리:**
1. 개념 이해 부족 (Conceptual Misunderstanding)
2. 계산 실수 (Calculation Error)
3. 문제 해석 오류 (Problem Interpretation Error)
4. 공식 적용 오류 (Formula Application Error)
5. 부주의/실수 (Careless Mistake)
6. 시간 부족 (Time Pressure)
7. 풀이 과정 오류 (Solution Process Error)
8. 기타 (Other)

### 3. quiz_attempts (퀴즈 시도 기록)
```sql
CREATE TABLE quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_quiz_id INT NOT NULL,
  moodle_attempt_id INT UNIQUE,
  user_id INT NOT NULL,
  quiz_name VARCHAR(255),
  subject VARCHAR(100),
  grade_level VARCHAR(50),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_quiz (user_id, moodle_quiz_id),
  INDEX idx_completed_at (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4. question_errors (오답 기록)
```sql
CREATE TABLE question_errors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  user_id INT NOT NULL,
  moodle_question_id INT NOT NULL,
  question_text TEXT,
  question_type VARCHAR(50),
  correct_answer TEXT,
  student_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_errors (user_id, is_correct),
  INDEX idx_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 5. error_reasons (실수 이유 선택 기록)
```sql
CREATE TABLE error_reasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_error_id INT NOT NULL,
  category_id INT NOT NULL,
  user_id INT NOT NULL,
  confidence_level ENUM('확실함', '아마도', '잘 모르겠음') DEFAULT '아마도',
  student_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_error_id) REFERENCES question_errors(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES error_categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, category_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 6. pattern_analysis_cache (패턴 분석 캐시)
```sql
CREATE TABLE pattern_analysis_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL,
  target_id INT,
  target_type VARCHAR(50),
  period_start DATE,
  period_end DATE,
  analysis_data JSON,
  ai_insights TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  INDEX idx_type_target (analysis_type, target_id, target_type),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 7. moodle_sync_log (Moodle 동기화 로그)
```sql
CREATE TABLE moodle_sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  status ENUM('success', 'failed', 'partial') NOT NULL,
  records_synced INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_status_date (status, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## API 엔드포인트

### 인증 (Authentication)
```
POST   /api/auth/login           # 로그인
POST   /api/auth/logout          # 로그아웃
GET    /api/auth/me              # 현재 사용자 정보
POST   /api/auth/moodle-sso      # Moodle SSO 연동
```

### 학생용 (Student APIs)
```
GET    /api/student/errors                    # 내 오답 목록
GET    /api/student/errors/:id                # 오답 상세
POST   /api/student/errors/:id/reason         # 실수 이유 선택
PUT    /api/student/errors/:id/reason         # 실수 이유 수정
GET    /api/student/categories                # 실수 유형 카테고리 목록
GET    /api/student/my-patterns               # 내 실수 패턴 요약
```

### 교사용 (Teacher APIs)
```
GET    /api/teacher/students                  # 담당 학생 목록
GET    /api/teacher/class-patterns            # 학급 전체 패턴 분석
GET    /api/teacher/student/:id/patterns      # 특정 학생 패턴 분석
GET    /api/teacher/question/:id/patterns     # 특정 문제 패턴 분석
GET    /api/teacher/category-distribution     # 실수 유형별 분포
GET    /api/teacher/insights                  # AI 생성 인사이트
POST   /api/teacher/report/generate           # 리포트 생성
```

### Moodle 연동 (Moodle Integration)
```
POST   /api/moodle/sync/quizzes              # 퀴즈 동기화
POST   /api/moodle/sync/attempts             # 시도 기록 동기화
POST   /api/moodle/sync/users                # 사용자 동기화
GET    /api/moodle/sync/status               # 동기화 상태
```

### 관리자용 (Admin APIs)
```
GET    /api/admin/categories                 # 카테고리 관리
POST   /api/admin/categories                 # 카테고리 추가
PUT    /api/admin/categories/:id             # 카테고리 수정
GET    /api/admin/system-stats               # 시스템 통계
GET    /api/admin/sync-logs                  # 동기화 로그
```

## 주요 기능 상세

### 1. 학생 실수 이유 선택 플로우
```
1. 학생이 Moodle에서 퀴즈 완료
2. 오답이 있을 경우 본 시스템으로 리다이렉트 (또는 알림)
3. 오답 목록 표시 (문제, 정답, 내 답변)
4. 각 오답마다 실수 이유 선택 (다중 선택 가능)
5. 확신도 선택 (확실함/아마도/잘 모르겠음)
6. 선택적 메모 작성
7. 제출 후 즉시 간단한 피드백 제공
```

### 2. 교사 대시보드 - 패턴 분석

#### 개인 학생 분석
- 시간대별 실수 유형 추이 (라인 차트)
- 실수 유형별 분포 (파이 차트)
- 가장 많이 틀린 문제 유형
- 개선 추이 (before/after 비교)
- AI 생성 맞춤형 학습 조언

#### 학급 전체 분석
- 학급 평균 vs 개인 비교
- 공통적으로 어려워하는 문제 유형
- 실수 유형별 학생 그룹핑
- 주간/월간 리포트

#### AI 인사이트 (Claude 활용)
```
분석 데이터를 Claude API에 전송하여:
- 패턴 해석 및 설명
- 맞춤형 학습 전략 제안
- 개선 우선순위 추천
- 유사 학생 그룹 식별
```

### 3. Moodle 연동 방식

#### Option A: REST API (권장)
```javascript
// Moodle Web Services 사용
// 1. Moodle에서 Web Services 활성화
// 2. Custom Service 생성 및 토큰 발급
// 3. 필요한 함수 활성화:
//    - mod_quiz_get_user_attempts
//    - mod_quiz_get_attempt_review
//    - core_user_get_users
```

#### Option B: LTI 1.3 (고급)
- Moodle에서 LTI Tool 등록
- Deep Linking 지원
- Grades Passback 지원

### 4. 데이터 동기화 전략
```
1. 실시간 Webhook (Moodle 플러그인 필요)
2. 주기적 Polling (15분마다)
3. 수동 동기화 버튼
4. 증분 동기화 (마지막 sync 이후 데이터만)
```

## 배포 구조 (Docker Compose)

```yaml
services:
  frontend:
    - React 앱 (Nginx로 서빙)
    - 포트: 3000

  backend:
    - Node.js API 서버
    - 포트: 5000

  mysql:
    - MySQL 5.7
    - 포트: 3306
    - 볼륨: 데이터 영구 저장

  nginx:
    - 리버스 프록시
    - 포트: 80, 443 (SSL)
```

## 보안 고려사항

1. **인증/인가**
   - JWT 토큰 기반 인증
   - Role-based Access Control (RBAC)
   - Moodle 세션 검증

2. **데이터 보호**
   - 개인정보 암호화 (AES-256)
   - SQL Injection 방지 (TypeORM)
   - XSS 방지 (React 기본 escaping)

3. **API 보안**
   - Rate Limiting
   - CORS 설정
   - API Key/Token 관리

## 성능 최적화

1. **데이터베이스**
   - 인덱스 최적화
   - 쿼리 캐싱
   - Connection Pooling

2. **API**
   - Redis 캐싱 (선택적)
   - 패턴 분석 결과 캐싱
   - 페이지네이션

3. **Frontend**
   - Code Splitting
   - Lazy Loading
   - React Query 캐싱

## 개발 로드맵

### Phase 1: Core System (2주)
- [ ] 프로젝트 셋업 및 데이터베이스 구축
- [ ] 기본 인증 시스템
- [ ] 오답 기록 CRUD API
- [ ] 실수 이유 선택 API

### Phase 2: Student UI (1주)
- [ ] 오답 목록 화면
- [ ] 실수 이유 선택 인터페이스
- [ ] 내 패턴 요약 화면

### Phase 3: Teacher Dashboard (2주)
- [ ] 학생 목록 및 개별 분석
- [ ] 패턴 시각화 차트
- [ ] 학급 전체 분석

### Phase 4: Moodle Integration (1주)
- [ ] Moodle REST API 연동
- [ ] 데이터 동기화 모듈
- [ ] SSO 연동

### Phase 5: AI Analysis (1주)
- [ ] Claude API 통합
- [ ] 인사이트 생성 로직
- [ ] 리포트 생성

### Phase 6: Deployment (1주)
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인
- [ ] 모니터링 설정

## 참고 자료

- [Moodle Web Services API](https://docs.moodle.org/dev/Web_services)
- [MySQL 5.7 Documentation](https://dev.mysql.com/doc/refman/5.7/en/)
- [LTI 1.3 Specification](https://www.imsglobal.org/spec/lti/v1p3/)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference)
