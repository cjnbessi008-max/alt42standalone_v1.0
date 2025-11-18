# Truth Light - AI 교육 시스템

> 명제의 참/거짓을 빛의 변화로 경험하는 혁신적인 학습 웹앱

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange.svg)
![Moodle](https://img.shields.io/badge/Moodle-3.7-green.svg)

## 📖 개요

Truth Light는 학생들이 수학적/논리적 명제의 참과 거짓을 직관적으로 이해할 수 있도록 돕는 독립형 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에서 학습자의 답변에 따라 조명의 밝기가 변화하여, 시각적 피드백을 통한 몰입형 학습 경험을 제공합니다.

### 핵심 기능

- **🔆 Truth Light 시각화**: 정답일 때 밝게 빛나고, 오답일 때 어두워지는 동적 조명 효과
- **📱 가상 스마트폰 UI**: 실제 스마트폰과 유사한 인터페이스로 친숙한 학습 환경 제공
- **🔗 Moodle LMS 연동**: Moodle 3.7 웹 서비스를 통한 문제 데이터 동기화
- **📊 실시간 학습 통계**: 정답률, 학습 시간, 진도 등 실시간 피드백
- **🎯 개인화된 학습 경험**: 사용자별 학습 기록 및 진도 관리

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (HTML/CSS/JS)               │
│  • Virtual Smartphone UI                                │
│  • Truth Light Visualization                            │
│  • Interactive Learning Interface                       │
└────────────────────┬────────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────────┐
│                 Backend API (PHP 7.1.9)                 │
│  • RESTful Endpoints                                    │
│  • Moodle Web Services Connector                        │
│  • Session Management                                   │
└────────┬───────────────────────────────┬────────────────┘
         │                               │
┌────────▼──────────┐         ┌─────────▼────────────────┐
│  MySQL 5.7 DB     │         │  Moodle 3.7 LMS          │
│  • Questions      │         │  • User Data             │
│  • Sessions       │         │  • Question Bank         │
│  • Progress       │         │  • Course Info           │
└───────────────────┘         └──────────────────────────┘
```

## 🚀 빠른 시작

### 필수 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4 또는 Nginx
- **Moodle**: 3.7 (선택사항, 연동 시)

### 설치 방법

#### 1. 프로젝트 클론/다운로드

```bash
cd /var/www/html
git clone [repository-url] truth-light-app
cd truth-light-app
```

#### 2. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql

# 또는 직접 실행
mysql -u root -p < database/schema.sql
```

#### 3. 환경 설정

```bash
# 설정 파일 복사
cp config/config.php config/config.local.php

# config.local.php 파일 편집
nano config/config.local.php
```

**config.local.php** 예시:
```php
<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'truth_light_db');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle Configuration (선택사항)
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

#### 4. 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 부여
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs

# 웹 서버 사용자에게 권한 부여
chown -R www-data:www-data /var/www/html/truth-light-app
```

#### 5. 웹 서버 설정

**Apache (.htaccess)**:
```apache
RewriteEngine On
RewriteBase /truth-light-app/

# API 라우팅
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/api.php/$1 [L,QSA]
```

**Nginx (nginx.conf)**:
```nginx
location /truth-light-app/ {
    alias /var/www/html/truth-light-app/public/;
    index index.html;

    location ~ ^/truth-light-app/api/(.*)$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME /var/www/html/truth-light-app/api/api.php;
        include fastcgi_params;
    }
}
```

#### 6. 접속 확인

브라우저에서 다음 URL로 접속:
```
http://localhost/truth-light-app/public/
```

## 📚 API 문서

### 엔드포인트

#### 문제 관련

**GET** `/api/questions`
- 문제 목록 가져오기
- 쿼리 파라미터:
  - `limit`: 문제 개수 (기본값: 10)
  - `category`: 카테고리 필터 (선택사항)

**GET** `/api/question?id={id}`
- 특정 문제 조회

**GET** `/api/categories`
- 문제 카테고리 목록

#### 세션 관련

**POST** `/api/session`
- 학습 세션 시작
- Body: `{ "user_id": 1 }`
- 응답: `{ "session_id": 123, "session_token": "..." }`

**PUT** `/api/session`
- 학습 세션 종료
- Body: `{ "session_id": 123 }`

#### 답변 관련

**POST** `/api/answer`
- 답변 제출
- Body:
```json
{
  "session_id": 123,
  "question_id": 456,
  "answer": true,
  "time_spent": 15,
  "confidence_level": 80
}
```
- 응답:
```json
{
  "success": true,
  "is_correct": true,
  "correct_answer": true,
  "light_brightness": 100,
  "message": "정답입니다! 🎉"
}
```

#### 진도 관련

**GET** `/api/progress?user_id={id}`
- 사용자 학습 진도 조회

#### Moodle 연동

**GET** `/api/moodle-test`
- Moodle 연결 테스트

### API 사용 예시

```javascript
// 문제 가져오기
fetch('/api/api.php/questions?limit=5')
  .then(res => res.json())
  .then(data => console.log(data));

// 답변 제출
fetch('/api/api.php/answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 1,
    question_id: 1,
    answer: true,
    time_spent: 10
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## 🔧 Moodle 연동 설정

### 1. Moodle 웹 서비스 활성화

1. Moodle 관리자 계정으로 로그인
2. `사이트 관리` → `고급 기능` → `웹 서비스 활성화` 체크
3. `사이트 관리` → `플러그인` → `웹 서비스` → `외부 서비스 관리`
4. 새 서비스 생성: "Truth Light API"

### 2. 토큰 생성

1. `사이트 관리` → `플러그인` → `웹 서비스` → `토큰 관리`
2. 새 토큰 생성
3. 생성된 토큰을 `config.local.php`의 `MOODLE_TOKEN`에 설정

### 3. 필요한 함수 권한 부여

- `core_user_get_users_by_field`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_get_quiz_access_information`

## 📊 데이터베이스 스키마

주요 테이블:

- **users**: 사용자 정보 (Moodle 동기화)
- **questions**: 문제 은행
- **learning_sessions**: 학습 세션
- **answer_attempts**: 답변 시도 기록
- **user_progress**: 사용자 학습 진도

자세한 스키마는 `database/schema.sql` 참조

## 🎨 커스터마이징

### 조명 색상 변경

`public/css/style.css`에서 CSS 변수 수정:

```css
:root {
    --light-true: #FFD700;        /* 참일 때 조명 색상 */
    --light-false: #2c3e50;       /* 거짓일 때 조명 색상 */
    --light-glow-true: rgba(255, 215, 0, 0.8);
    --light-glow-false: rgba(44, 62, 80, 0.3);
}
```

### 스마트폰 화면 크기 조정

```css
.smartphone-frame {
    width: 360px;   /* 너비 조정 */
    height: 720px;  /* 높이 조정 */
}
```

## 🐛 문제 해결

### API 호출 실패

```bash
# 로그 확인
tail -f logs/app.log

# PHP 에러 로그 확인
tail -f /var/log/apache2/error.log
```

### 데이터베이스 연결 오류

1. MySQL 서비스 확인: `systemctl status mysql`
2. 데이터베이스 권한 확인:
```sql
GRANT ALL PRIVILEGES ON truth_light_db.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
```

### Moodle 연동 실패

1. Moodle 웹 서비스 활성화 확인
2. 토큰 유효성 확인
3. CORS 설정 확인 (필요시 Moodle 설정)

## 📈 성능 최적화

### 캐싱 활성화

```php
// config.local.php
define('CACHE_ENABLED', true);
define('CACHE_TTL', 3600); // 1시간
```

### 데이터베이스 인덱스 확인

```sql
SHOW INDEX FROM questions;
SHOW INDEX FROM answer_attempts;
```

## 🔐 보안 고려사항

- ✅ SQL Injection 방지 (PDO Prepared Statements 사용)
- ✅ XSS 방지 (출력 이스케이프)
- ✅ CSRF 토큰 (추후 추가 권장)
- ✅ 세션 타임아웃 (1시간)
- ✅ API Rate Limiting (60 req/min)

## 🤝 기여하기

프로젝트 개선을 위한 기여를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 👥 개발팀

- **KAIST Touch Math Academy**
- **AI Education System Pipeline**

## 📞 지원

- 이슈 트래커: [GitHub Issues]
- 이메일: support@kaist-touchmath.ac.kr
- 문서: [Wiki]

## 🗺️ 로드맵

- [x] v1.0: 기본 Truth Light 기능
- [ ] v1.1: 다양한 문제 유형 지원
- [ ] v1.2: 학습 분석 대시보드
- [ ] v1.3: 소셜 학습 기능
- [ ] v2.0: AI 기반 적응형 학습

---

**Truth Light** - 빛으로 배우는 진리의 세계 ✨
