# LMS 연동 개념 선택 시스템

AI 기반으로 문제의 본질 개념을 자동 추천하고, 교사가 선택/확인할 수 있는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 🎯 핵심 기능
- **AI 개념 추천**: 문제 텍스트를 분석하여 관련 개념을 자동으로 추천
- **계층적 개념 관리**: 트리 구조로 개념 간 관계를 체계적으로 관리
- **문제-개념 매핑**: 문제와 개념을 다대다 관계로 연결
- **신뢰도 점수**: AI 추천의 신뢰도를 0-1 범위로 제공
- **교사 확인**: AI 추천 개념을 교사가 검토하고 승인
- **Moodle LTI 연동**: Moodle 3.7+ LMS와 표준 LTI 1.3 프로토콜로 연동

### 📊 AI 분석 방법
1. **키워드 기반 분석** (기본)
   - TF-IDF 알고리즘
   - 개념 키워드 매칭
   - 가중치 기반 점수 계산

2. **OpenAI API 연동** (선택)
   - GPT-3.5/4.0 기반 고급 분석
   - 맥락 이해 및 의미론적 매칭
   - 하이브리드 모드 지원

## 기술 스택

### Backend
- **PHP 7.4+** with Slim Framework 4
- **MySQL 5.7+** 데이터베이스
- **Eloquent ORM** (Laravel의 독립형 ORM)
- **JWT 인증**
- **RESTful API**

### Frontend
- **HTML5 + Bootstrap 4**
- **jQuery** (간단한 SPA)
- **Responsive Design**

### AI/ML
- 키워드 기반 NLP (기본 내장)
- OpenAI API (선택 사항)

### LMS 연동
- LTI 1.3 표준 프로토콜
- Moodle 3.7+ 지원
- OAuth 1.0 서명 검증

## 설치 방법

### 1. 사전 요구사항
```bash
# PHP 7.4 이상
php -v

# MySQL 5.7 이상
mysql --version

# Composer
composer --version
```

### 2. 프로젝트 클론 및 의존성 설치
```bash
git clone <repository-url>
cd alt42standalone_v1.0

# Composer 의존성 설치
composer install
```

### 3. 환경 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정 (데이터베이스 정보 입력)
nano .env
```

**.env 설정 예시:**
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lms_concept_system
DB_USERNAME=root
DB_PASSWORD=your_password

JWT_SECRET=your-random-secret-key

# OpenAI API (선택 사항)
OPENAI_API_KEY=sk-xxxxx
OPENAI_MODEL=gpt-3.5-turbo
```

### 4. 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# SQL 스크립트 실행
mysql -u root -p < database/schema.sql
```

또는 MySQL 내에서:
```sql
source database/schema.sql;
```

### 5. 서버 실행
```bash
# 개발 서버 실행 (PHP 내장 서버)
composer start

# 또는
php -S localhost:8000 -t public
```

서버가 실행되면 http://localhost:8000 에서 접속 가능합니다.

### 6. 프로덕션 배포 (Apache/Nginx)

**Apache .htaccess 설정:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.php [QSA,L]
```

**Nginx 설정:**
```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

## API 문서

### 인증 API

#### 회원가입
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "teacher1",
  "email": "teacher1@example.com",
  "password": "password123",
  "role": "teacher",
  "full_name": "김교사"
}
```

#### 로그인
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "teacher1",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

### 개념 API

#### 개념 목록 조회 (트리 구조)
```
GET /api/concepts?format=tree&subject=mathematics
```

#### 개념 상세 조회
```
GET /api/concepts/{id}
```

#### 개념 생성
```
POST /api/concepts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "분수의 덧셈",
  "name_en": "Fraction Addition",
  "description": "분수를 더하는 방법",
  "subject": "mathematics",
  "level": 3,
  "parent_id": 5,
  "keywords": [
    {"keyword": "분수", "weight": 0.8},
    {"keyword": "덧셈", "weight": 1.0}
  ]
}
```

### 문제 API

#### 문제 목록 조회
```
GET /api/problems?page=1&limit=20&subject=mathematics&difficulty=medium
```

#### 문제 생성
```
POST /api/problems
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "분수 덧셈 문제",
  "content": "1/2 + 1/3을 계산하시오.",
  "subject": "mathematics",
  "difficulty": "easy",
  "grade_level": 5,
  "concepts": [
    {
      "concept_id": 6,
      "is_primary": true,
      "confidence_score": 1.0
    }
  ]
}
```

#### 개념 연결/해제
```
POST /api/problems/{id}/concepts
DELETE /api/problems/{id}/concepts/{conceptId}
PUT /api/problems/{id}/concepts/{conceptId}/confirm
```

### AI 분석 API

#### 문제 텍스트 분석
```
POST /api/ai/analyze
Content-Type: application/json

{
  "content": "두 분수 1/2와 1/3을 더하는 문제입니다.",
  "subject": "mathematics"
}

Response:
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "concept_id": 6,
        "concept_name": "분수의 덧셈",
        "concept_path": "수학 > 수와 연산 > 분수 > 분수의 덧셈",
        "confidence": 0.95,
        "matched_keywords": ["분수", "덧셈", "더하기"],
        "method": "keyword"
      }
    ],
    "processing_time_ms": 25,
    "method": "keyword"
  }
}
```

#### 기존 문제에 대한 개념 추천 및 자동 연결
```
POST /api/ai/suggest-for-problem/{id}
```

#### 일괄 분석
```
POST /api/ai/batch-analyze
Content-Type: application/json

{
  "problem_ids": [1, 2, 3, 4, 5]
}
```

### LTI 연동 API

#### LTI 설정 조회
```
GET /lti/config
```

#### LTI 런치 (Moodle에서 POST)
```
POST /lti/launch
Content-Type: application/x-www-form-urlencoded

oauth_consumer_key=...&user_id=...&...
```

#### 성적 전송
```
POST /lti/grade-passback
Content-Type: application/json

{
  "sourced_id": "...",
  "score": 85,
  "max_score": 100
}
```

## Moodle 연동 설정

### 1. Moodle에 LTI 도구 등록

1. Moodle 관리자 로그인
2. **사이트 관리 → 플러그인 → 활동 모듈 → 외부 도구 → 도구 관리**
3. **도구 수동 구성** 클릭
4. 다음 정보 입력:
   - **도구 이름**: LMS Concept System
   - **도구 URL**: `http://your-domain.com/lti/launch`
   - **Consumer key**: `moodle_key_12345`
   - **Shared secret**: `moodle_secret_67890`
   - **Launch Container**: 새 창
   - **Privacy**: 이름, 이메일 공유

5. 저장

### 2. 과정에 활동 추가

1. Moodle 과정 편집 모드
2. **활동 또는 리소스 추가 → 외부 도구**
3. 위에서 등록한 LTI 도구 선택
4. 저장

학생이 해당 활동을 클릭하면 자동으로 SSO 로그인되어 본 시스템으로 이동합니다.

## 사용 방법

### 교사 워크플로우

1. **로그인**
   - http://localhost:8000/dashboard.html
   - 또는 Moodle LTI 런치

2. **문제 생성**
   - "문제 생성" 메뉴
   - 제목, 내용, 과목, 난이도 입력
   - "AI 개념 추천받기" 클릭

3. **개념 검토 및 선택**
   - AI가 추천한 개념 목록 확인
   - 신뢰도 점수 참고
   - 체크박스로 선택/해제
   - "문제 저장" 클릭

4. **개념 관리**
   - "개념 관리" 메뉴
   - 트리 구조로 개념 탐색
   - 새 개념 추가/수정

### 학생 워크플로우

1. Moodle에서 활동 클릭 (LTI 런치)
2. 자동 로그인 및 문제 풀이 화면
3. 문제 풀이 후 제출
4. 점수가 Moodle gradebook으로 자동 전송

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                    # 웹 루트
│   ├── index.php             # 엔트리 포인트
│   └── dashboard.html        # 프론트엔드 UI
├── src/
│   ├── Controllers/          # API 컨트롤러
│   │   ├── ConceptController.php
│   │   ├── ProblemController.php
│   │   ├── AIController.php
│   │   ├── AuthController.php
│   │   └── LTIController.php
│   ├── Models/               # Eloquent 모델
│   │   ├── User.php
│   │   ├── Concept.php
│   │   ├── Problem.php
│   │   └── ...
│   ├── Services/             # 비즈니스 로직
│   │   ├── AIConceptAnalyzer.php
│   │   └── LTIService.php
│   ├── Utils/                # 유틸리티
│   │   ├── Database.php
│   │   └── JWTHelper.php
│   └── routes/               # 라우트 정의
│       ├── concepts.php
│       ├── problems.php
│       ├── ai.php
│       ├── auth.php
│       └── lti.php
├── config/                   # 설정 파일
│   ├── database.php
│   ├── app.php
│   └── lti.php
├── database/
│   └── schema.sql           # 데이터베이스 스키마
├── composer.json
├── .env.example
└── README.md
```

## 데이터베이스 구조

### 주요 테이블

- **users** - 사용자 (교사/학생/관리자)
- **concepts** - 개념 (계층 구조)
- **concept_keywords** - 개념 키워드 (AI 매칭용)
- **problems** - 문제
- **problem_concepts** - 문제-개념 연결 (다대다)
- **student_progress** - 학생 진도
- **concept_mastery** - 개념별 숙련도
- **lti_sessions** - LTI 세션
- **lti_consumers** - LTI 소비자 (Moodle 등)

## 확장 가능성

### 고급 AI 기능
- OpenAI API 연동으로 더 정확한 개념 추천
- 문제 난이도 자동 분류
- 학습자 맞춤형 문제 생성

### 추가 LMS 지원
- Canvas LMS
- Blackboard
- Google Classroom

### 학습 분석
- 개념별 학습 패턴 분석
- 취약 개념 자동 탐지
- 학습 경로 추천

## 라이선스

MIT License

## 기여자

- 개발: AI Education System Team
- 문의: support@example.com

## 트러블슈팅

### 1. composer install 실패
```bash
# PHP 확장 모듈 확인
php -m

# 필요한 확장: pdo, pdo_mysql, mbstring, json
```

### 2. 데이터베이스 연결 오류
```bash
# MySQL 서비스 확인
systemctl status mysql

# .env 파일의 DB 정보 확인
cat .env
```

### 3. JWT 토큰 오류
```bash
# JWT_SECRET이 설정되어 있는지 확인
grep JWT_SECRET .env
```

### 4. CORS 오류
- `config/app.php`에서 `cors.allowed_origins` 설정 확인

## 향후 개발 계획

- [ ] Vue.js 기반 프론트엔드 리팩토링
- [ ] 실시간 협업 기능
- [ ] 모바일 앱 개발
- [ ] 다국어 지원 (영어, 중국어 등)
- [ ] 고급 통계 대시보드
- [ ] WebSocket 기반 실시간 업데이트
