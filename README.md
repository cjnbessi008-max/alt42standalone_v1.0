# Incorrect Solutions Comparison System

독립형 웹앱으로 구현된 **풀이 비교 학습 시스템**입니다. AI가 생성한 올바른 풀이와 의도적으로 틀린 풀이를 비교하며 학습할 수 있는 교육용 플랫폼입니다.

## 🎯 주요 기능

### 1. AI 기반 솔루션 생성
- **올바른 풀이**: 명확한 단계별 정답 풀이 자동 생성
- **잘못된 풀이**: 전형적인 학생 실수 패턴을 반영한 오답 풀이 생성
- **실수 유형**: Sign Error, Order of Operations, Fraction Addition 등 다양한 오류 패턴

### 2. 비교 학습 인터페이스
- 두 풀이를 나란히 제시하여 학생이 올바른 풀이 선택
- 즉각적인 피드백 제공
- 틀린 풀이에 대한 자세한 설명

### 3. Moodle LMS 연동
- Moodle 3.7과 완벽 호환
- 성적 자동 동기화
- 학습 활동 로그 전송

### 4. 학습 분석
- 학생별 정확도 추적
- 실수 유형별 성과 분석
- 학습 시간 통계

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **Database**: MySQL 5.7
- **Architecture**: MVC Pattern with RESTful API

### Frontend
- **HTML5/CSS3**: 반응형 디자인
- **JavaScript**: Vanilla JS (ES6+)
- **UI/UX**: Modern, accessible interface

### AI Integration
- **Anthropic Claude API**: 솔루션 생성 및 설명
- **Model**: Claude 3 Sonnet

### Moodle Integration
- **Version**: Moodle 3.7
- **Integration**: Web Services API
- **Features**: Grade sync, Activity logging

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── config/                  # 설정 파일
│   ├── app.php             # 앱 설정
│   └── database.php        # DB 연결
├── database/               # 데이터베이스
│   └── schema.sql          # MySQL 스키마
├── src/
│   ├── controllers/        # API 컨트롤러
│   │   ├── ProblemController.php
│   │   └── AttemptController.php
│   ├── models/             # 데이터 모델
│   │   ├── BaseModel.php
│   │   ├── Problem.php
│   │   ├── Solution.php
│   │   └── StudentAttempt.php
│   └── services/           # 비즈니스 로직
│       ├── AIService.php
│       └── MoodleService.php
├── api/                    # API 엔드포인트
│   └── index.php           # API 라우터
├── public/                 # 프론트엔드
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       └── app.js
└── tests/                  # 테스트 파일
```

## 🚀 설치 및 설정

### 1. 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Apache/Nginx 웹 서버
- Composer (선택사항)
- Moodle 3.7 (연동 시)

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE incorrect_solutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 적용
mysql -u root -p incorrect_solutions < database/schema.sql
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

필수 설정:
- `DB_*`: 데이터베이스 접속 정보
- `ANTHROPIC_API_KEY`: Claude API 키 (AI 솔루션 생성용)
- `MOODLE_*`: Moodle 연동 설정 (선택사항)

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteBase /

# API 라우팅
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/index.php [QSA,L]

# Frontend
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ public/index.html [QSA,L]
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/alt42standalone_v1.0/public;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        rewrite ^/api/(.*)$ /api/index.php last;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 5. Moodle 연동 (선택사항)

#### Moodle에서 Web Services 활성화

1. **사이트 관리** → **플러그인** → **웹 서비스** → **개요**
2. "웹 서비스 활성화" 체크
3. 프로토콜 활성화: REST 프로토콜
4. 서비스 생성: "Incorrect Solutions Integration"
5. 필요한 함수 추가:
   - `mod_assign_save_grade`
   - `core_user_get_users_by_field`
   - `core_course_get_courses`
   - `core_enrol_get_enrolled_users`

#### 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. 사용자 선택 및 서비스 선택
3. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 설정

#### Moodle 활동 추가

```php
// Moodle 코스에서 외부 도구(External Tool) 추가
// URL: https://your-domain.com/?course_id={course_id}&activity_id={activity_id}
```

## 📖 사용 방법

### 학생 사용법

1. **문제 선택**
   - 난이도, 과목, 학년 필터 선택
   - "랜덤 문제 시작" 클릭

2. **풀이 비교**
   - 두 개의 풀이(A, B) 중 올바른 것 선택
   - 시간 제한 없음 (시간은 기록됨)

3. **피드백 확인**
   - 정답/오답 즉시 확인
   - 틀린 경우 상세한 설명 제공

4. **통계 확인**
   - 우측 상단 "통계" 버튼
   - 정확도, 평균 시간, 최근 시도 확인

### 교사 사용법

#### 새 문제 생성 (AI 자동 생성)

```bash
# API를 통한 문제 생성
curl -X POST http://localhost/api/problems/with-solutions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "분수의 덧셈",
    "description": "1/2 + 1/3을 계산하세요.",
    "subject": "mathematics",
    "difficulty_level": "medium",
    "grade_level": "초등 3학년",
    "problem_data": {
      "equation": "1/2 + 1/3 = ?"
    }
  }'
```

#### 수동 문제 생성

데이터베이스에 직접 추가하거나 API를 통해 문제와 솔루션을 별도로 생성할 수 있습니다.

## 🔌 API 문서

### Problems

#### `GET /api/problems`
모든 문제 조회

**Query Parameters:**
- `subject`: 과목 필터
- `difficulty`: 난이도 필터
- `grade_level`: 학년 필터
- `limit`: 결과 개수 제한

#### `GET /api/problems/{id}`
특정 문제 조회

#### `GET /api/problems/random`
랜덤 문제 조회

#### `GET /api/problems/{id}/comparison`
비교용 솔루션 쌍 조회 (1개 정답, 1개 오답)

#### `POST /api/problems/with-solutions`
AI로 문제 및 솔루션 자동 생성

**Request Body:**
```json
{
  "title": "문제 제목",
  "description": "문제 설명",
  "subject": "mathematics",
  "difficulty_level": "medium",
  "grade_level": "초등 3학년",
  "problem_data": {}
}
```

### Attempts

#### `POST /api/attempts`
학생 시도 제출

**Request Body:**
```json
{
  "student_id": 1,
  "problem_id": 1,
  "selected_solution_id": 5,
  "correct_solution_id": 5,
  "incorrect_solution_id": 6,
  "time_spent_seconds": 120,
  "hints_used": 0,
  "moodle_activity_id": 10
}
```

#### `GET /api/attempts/{student_id}`
학생 시도 이력 조회

#### `GET /api/attempts/{student_id}/stats`
학생 통계 조회

#### `GET /api/attempts/leaderboard`
리더보드 조회

## 🧪 테스트

### 샘플 데이터 추가

```sql
-- 샘플 문제 추가
INSERT INTO problems (title, description, subject, difficulty_level, grade_level, problem_data) VALUES
('분수의 덧셈', '1/2 + 1/3을 계산하세요.', 'mathematics', 'medium', '초등 3학년', '{"equation": "1/2 + 1/3 = ?"}');

-- 올바른 솔루션
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, explanation, generated_by) VALUES
(1, 'correct', '올바른 풀이',
'[
  {"step_number": 1, "description": "분모를 같게 만듭니다", "calculation": "1/2 = 3/6, 1/3 = 2/6", "result": "3/6, 2/6"},
  {"step_number": 2, "description": "분자끼리 더합니다", "calculation": "3/6 + 2/6", "result": "5/6"}
]',
'5/6',
'분수의 덧셈은 분모를 같게 만든 후 분자끼리 더합니다.',
'manual');

-- 잘못된 솔루션
INSERT INTO solutions (problem_id, solution_type, title, steps, final_answer, mistake_type, mistake_description, explanation, generated_by) VALUES
(1, 'incorrect', '잘못된 풀이',
'[
  {"step_number": 1, "description": "분자와 분모를 각각 더합니다", "calculation": "1+1=2, 2+3=5", "result": "2/5"}
]',
'2/5',
'Fraction Addition',
'분자와 분모를 각각 더하는 실수를 했습니다.',
'분수의 덧셈에서 분자와 분모를 각각 더하면 안 됩니다. 반드시 분모를 같게 만든 후 분자만 더해야 합니다.',
'manual');
```

## 🔧 문제 해결

### 일반적인 문제

**1. 데이터베이스 연결 실패**
```
Error: Database connection failed
```
→ `.env` 파일의 DB 설정 확인

**2. API 404 에러**
```
Endpoint not found
```
→ 웹 서버 rewrite 규칙 확인 (.htaccess 또는 nginx.conf)

**3. AI 솔루션 생성 실패**
```
AI API key not configured
```
→ `.env`에 `ANTHROPIC_API_KEY` 설정

**4. Moodle 동기화 실패**
```
Moodle API error: Invalid token
```
→ Moodle 토큰 재생성 및 web services 활성화 확인

## 🤝 기여

문제 보고 및 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 📄 라이선스

이 프로젝트는 교육용 목적으로 개발되었습니다.

## 👨‍💻 개발자

KAIST Touch Math Academy

## 📧 문의

기술 지원 및 문의: support@example.com

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
