# Truth Temperature 🌡️

**부등식이 참이면 따뜻하게, 거짓이면 차갑게! 온도로 배우는 수학 학습 앱**

Truth Temperature는 Moodle LMS와 연동되어 부등식 문제의 성립 여부를 온도로 시각화하는 교육용 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에서 온도 변화를 통해 수학적 개념을 직관적으로 학습할 수 있습니다.

---

## ✨ 주요 기능

### 🎯 핵심 기능
- **부등식 평가**: 수학 부등식의 참/거짓 판단 학습
- **온도 시각화**:
  - ✅ 참(True): 따뜻한 온도 (30°C ~ 50°C)
  - ❌ 거짓(False): 차가운 온도 (-20°C ~ 10°C)
- **가상 스마트폰**: 우측 하단에 고정된 모바일 화면에서 실시간 온도 표시
- **Moodle 연동**: LMS에서 문제를 가져와 학습 진행

### 📊 학습 기능
- 문제별 응답 시간 측정
- 세션별 정답률 추적
- 문제 난이도 분류 (쉬움, 보통, 어려움)
- 카테고리별 문제 관리

---

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7+

### Frontend
- **HTML5/CSS3**: 반응형 디자인
- **JavaScript (Vanilla)**: ES6+
- **REST API**: JSON 기반 통신

### Database
- **MySQL 5.7**: 데이터 저장소
- **PDO**: 안전한 데이터베이스 연결

---

## 📁 프로젝트 구조

```
truth-temperature/
├── backend/              # PHP 백엔드
│   ├── config/
│   │   └── database.php  # 데이터베이스 설정
│   ├── api/
│   │   └── api.php       # REST API 엔드포인트
│   ├── models/           # 데이터 모델
│   │   ├── Problem.php
│   │   ├── Session.php
│   │   └── Response.php
│   └── utils/            # 유틸리티
│       └── InequalityEvaluator.php
├── frontend/             # 웹 프론트엔드
│   ├── css/
│   │   └── smartphone.css
│   ├── js/
│   │   └── smartphone.js
│   ├── images/
│   └── index.html        # 독립 실행형 데모
├── moodle-plugin/        # Moodle 활동 모듈
│   ├── version.php
│   ├── lib.php
│   └── view.php
├── database/             # 데이터베이스 스키마
│   └── schema.sql
└── docs/                 # 문서
```

---

## 🚀 설치 가이드

### 1. 필수 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Apache/Nginx 웹 서버
- Moodle 3.7+ (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 3. 백엔드 설정

`backend/config/database.php` 파일에서 데이터베이스 연결 정보 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'truth_temperature');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
RewriteEngine On
RewriteBase /truth-temperature/

# API 라우팅
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ backend/api/api.php/$1 [L,QSA]
```

#### Nginx

```nginx
location /truth-temperature/ {
    try_files $uri $uri/ /truth-temperature/backend/api/api.php?$args;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    include fastcgi_params;
}
```

### 5. 독립 실행형 테스트

Moodle 없이 앱을 테스트하려면:

```bash
# 웹 서버 문서 루트에 복사
cp -r truth-temperature/ /var/www/html/

# 브라우저에서 열기
http://localhost/truth-temperature/frontend/index.html
```

### 6. Moodle 플러그인 설치 (선택사항)

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r truth-temperature/moodle-plugin/ mod/truthtemp/

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

---

## 📖 사용 방법

### 일반 사용자

1. **문제 풀기**
   - 화면에 표시된 부등식을 읽습니다
   - "참(True)" 또는 "거짓(False)" 버튼을 클릭합니다

2. **온도 확인**
   - 우측 하단 스마트폰 화면에서 온도를 확인합니다
   - 부등식이 참이면 따뜻한 온도 (주황색/빨간색)
   - 부등식이 거짓이면 차가운 온도 (파란색)

3. **결과 확인**
   - 정답 여부와 함께 정확한 온도가 표시됩니다
   - 다음 문제로 자동 이동합니다

### 관리자/교사

#### 문제 추가 (SQL)

```sql
INSERT INTO problems (
    moodle_question_id,
    question_text,
    inequality_expression,
    left_side,
    right_side,
    operator,
    correct_answer,
    difficulty_level,
    category
) VALUES (
    10,
    '3 × 4는 15보다 작습니까?',
    '3 × 4 < 15',
    '3 * 4',
    '15',
    '<',
    TRUE,
    'medium',
    'multiplication'
);
```

#### 문제 추가 (API)

```bash
curl -X POST http://localhost/truth-temperature/backend/api/api.php/problems \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_question_id": 10,
    "question_text": "3 × 4는 15보다 작습니까?",
    "inequality_expression": "3 × 4 < 15",
    "left_side": "3 * 4",
    "right_side": "15",
    "operator": "<",
    "correct_answer": true,
    "difficulty_level": "medium",
    "category": "multiplication"
  }'
```

---

## 🔌 API 문서

### 엔드포인트

#### 1. GET /api/problems
문제 목록 조회

**Query Parameters:**
- `category` (선택): 카테고리 필터
- `difficulty` (선택): 난이도 필터 (easy, medium, hard)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "question_text": "5 + 3은 10보다 작습니까?",
      "inequality_expression": "5 + 3 < 10",
      "difficulty_level": "easy"
    }
  ]
}
```

#### 2. POST /api/session
세션 생성

**Request Body:**
```json
{
  "moodle_user_id": 123,
  "username": "student01"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": 456,
  "session_token": "abc123..."
}
```

#### 3. POST /api/submit
답변 제출

**Request Body:**
```json
{
  "session_id": 456,
  "problem_id": 1,
  "user_answer": true,
  "response_time_ms": 3500
}
```

**Response:**
```json
{
  "success": true,
  "is_correct": true,
  "correct_answer": true,
  "temperature": 42,
  "temperature_type": "hot",
  "response_id": 789
}
```

---

## 🎨 온도 범위 및 색상

| 온도 범위 | 타입 | 색상 | 의미 |
|----------|------|------|------|
| 35°C ~ 50°C | Hot | 🔴 빨간색 | 부등식이 참 (매우 확실) |
| 20°C ~ 34°C | Warm | 🟠 주황색 | 부등식이 참 |
| 0°C ~ 19°C | Cool | 🔵 파란색 | 부등식이 거짓 |
| -20°C ~ -1°C | Cold | ❄️ 진한 파란색 | 부등식이 거짓 (매우 확실) |

---

## 🧪 테스트

### 데이터베이스 테스트

```bash
# 샘플 데이터 삽입 확인
mysql -u root -p truth_temperature -e "SELECT * FROM problems LIMIT 5;"
```

### API 테스트

```bash
# 문제 조회
curl http://localhost/truth-temperature/backend/api/api.php/problems

# 세션 생성
curl -X POST http://localhost/truth-temperature/backend/api/api.php/session \
  -H "Content-Type: application/json" \
  -d '{"moodle_user_id": 1, "username": "test"}'
```

### 프론트엔드 테스트

1. 브라우저에서 `frontend/index.html` 열기
2. 문제에 답하고 온도 변화 확인
3. 개발자 도구(F12) 콘솔에서 에러 확인

---

## 🔧 트러블슈팅

### 문제: 데이터베이스 연결 실패

**해결방법:**
1. MySQL 서비스가 실행 중인지 확인: `systemctl status mysql`
2. `backend/config/database.php`에서 연결 정보 확인
3. MySQL 사용자 권한 확인

### 문제: API 호출 오류 (CORS)

**해결방법:**
`backend/api/api.php`에 CORS 헤더가 설정되어 있는지 확인:
```php
header('Access-Control-Allow-Origin: *');
```

### 문제: 온도가 표시되지 않음

**해결방법:**
1. 브라우저 콘솔에서 JavaScript 에러 확인
2. API 응답 확인: Network 탭
3. `frontend/js/smartphone.js`에서 API_BASE_URL 확인

---

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

---

## 👥 기여

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

---

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**만든 날짜**: 2025-11-18
**버전**: 1.0.0
**호환성**: Moodle 3.7+, PHP 7.1.9+, MySQL 5.7
