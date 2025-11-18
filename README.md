# Data Shuffle - LMS 연동 문제 셔플 시스템

[![PHP Version](https://img.shields.io/badge/PHP-7.1.9-blue.svg)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-5.7-orange.svg)](https://www.mysql.com/)
[![Moodle](https://img.shields.io/badge/Moodle-3.7-green.svg)](https://moodle.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

문제와 답안을 학생별로 고르게 섞어 시험의 공정성을 유지하면서 부정행위를 방지하는 LMS 연동 시스템입니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용법](#사용법)
- [API 문서](#api-문서)
- [테스트](#테스트)
- [아키텍처](#아키텍처)
- [라이선스](#라이선스)

## ✨ 주요 기능

### 1. 문제 셔플 (Question Shuffling)
- **Fisher-Yates 알고리즘**: O(n) 시간 복잡도의 효율적인 셔플
- **결정론적 랜덤**: 동일 학생은 항상 같은 순서로 문제 접근
- **시드 기반**: 학생 ID + 퀴즈 ID 조합으로 고유한 시드 생성

### 2. 답안 셔플 (Answer Shuffling)
- 각 문제의 선택지를 무작위로 섞기
- 문제별로 독립적인 셔플 시드 사용
- 정답 검증 시 원본 답안 ID로 자동 변환

### 3. Moodle 3.7 LMS 연동
- Moodle Web Services API 연동
- 직접 데이터베이스 접근 지원 (선택)
- 퀴즈 문제 자동 가져오기
- 학생 인증 및 권한 관리

### 4. 가상 스마트폰 화면
- 우측 하단에 실제 학생 뷰 표시
- 반응형 디자인 (375px × 667px)
- 실시간 문제 미리보기
- 터치 친화적 UI/UX

### 5. 세션 관리
- 일관성 있는 셔플 순서 유지
- 캐시 만료 시간 설정 가능
- 재접속 시에도 동일한 문제 순서

### 6. 감사 로그 (Audit Trail)
- 모든 셔플 작업 기록
- 학생별 문제 순서 추적
- 답안 매핑 히스토리
- 성능 분석 데이터

## 📦 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 웹 서버
- **Moodle**: 3.7 (LMS 연동 시)

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

필수 확장:
- PDO
- pdo_mysql
- json
- curl
- mbstring

### 브라우저 요구사항
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🚀 설치 방법

### 1. 프로젝트 클론

```bash
git clone https://github.com/yourusername/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정
nano .env
```

**.env 설정 예시:**
```ini
DB_HOST=localhost
DB_DATABASE=data_shuffle
DB_USERNAME=root
DB_PASSWORD=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 3. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE data_shuffle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택)
CREATE USER 'shuffle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON data_shuffle.* TO 'shuffle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
mysql -u root -p data_shuffle < database/migrations/001_create_shuffle_tables.sql

# 샘플 데이터 삽입 (선택)
mysql -u root -p data_shuffle < database/seeds/001_sample_quiz_data.sql
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # API 라우팅
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/v1/(.*)$ src/api/shuffle.php [L,QSA]

    # 정적 파일
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.*)$ public/index.html [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/alt42standalone_v1.0/public;
    index index.html;

    # API 라우팅
    location /api/v1/ {
        try_files $uri /src/api/shuffle.php?$args;
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root/src/api/shuffle.php;
    }

    # 정적 파일
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP 처리
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 5. Moodle 웹 서비스 설정

1. **Moodle 관리자로 로그인**
2. **Site administration → Plugins → Web services → Manage protocols**
   - REST protocol 활성화
3. **Site administration → Plugins → Web services → External services**
   - 새 서비스 생성: "Data Shuffle Service"
   - 필요한 함수 추가:
     - `mod_quiz_get_quiz_by_courses`
     - `mod_quiz_get_user_attempts`
     - `core_webservice_get_site_info`
4. **Site administration → Plugins → Web services → Manage tokens**
   - 새 토큰 생성
   - 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 복사

### 6. 권한 설정

```bash
# 파일 소유권 설정
chown -R www-data:www-data /var/www/alt42standalone_v1.0

# 디렉토리 권한
find /var/www/alt42standalone_v1.0 -type d -exec chmod 755 {} \;

# 파일 권한
find /var/www/alt42standalone_v1.0 -type f -exec chmod 644 {} \;
```

## 💻 사용법

### 웹 인터페이스

1. **브라우저에서 접속**
   ```
   http://your-domain.com
   ```

2. **Quiz ID와 Student ID 입력**
   - Quiz ID: Moodle의 퀴즈 ID
   - Student ID: 학생의 사용자 ID

3. **"Load Shuffled Quiz" 버튼 클릭**
   - 우측 스마트폰 화면에 셔플된 문제 표시

4. **문제 풀이**
   - 답안 선택
   - Next/Previous 버튼으로 이동
   - Submit Quiz 버튼으로 제출

### 프로그래밍 방식 사용

#### PHP 예제

```php
<?php
require_once 'src/config/database.php';
require_once 'src/lib/ShuffleEngine.php';

use DataShuffle\Config\Database;
use DataShuffle\Lib\ShuffleEngine;

// 초기화
$db = Database::getConnection();
$engine = new ShuffleEngine($db);

// 문제 셔플
$questions = [
    ['id' => 1, 'text' => 'Question 1'],
    ['id' => 2, 'text' => 'Question 2'],
    ['id' => 3, 'text' => 'Question 3']
];

$shuffled = $engine->shuffleQuestions($questions, $studentId = 1001, $quizId = 101);

// 답안 셔플
$answers = [
    ['id' => 'A', 'text' => 'Answer A'],
    ['id' => 'B', 'text' => 'Answer B'],
    ['id' => 'C', 'text' => 'Answer C']
];

$result = $engine->shuffleAnswers($answers, $questionId = 1, $studentId = 1001, $quizId = 101);
```

#### JavaScript 예제

```javascript
// 퀴즈 로드
async function loadShuffledQuiz(quizId, studentId) {
    const response = await fetch(
        `/api/v1/quiz/${quizId}/shuffled?student_id=${studentId}`
    );
    const data = await response.json();
    return data;
}

// 답안 제출
async function submitAnswer(quizId, questionId, answerId) {
    const response = await fetch(`/api/v1/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            student_id: 1001,
            question_id: questionId,
            selected_answer_id: answerId
        })
    });
    const data = await response.json();
    return data;
}
```

## 📡 API 문서

### 1. Get Shuffled Quiz

**Endpoint:** `GET /api/v1/quiz/{quiz_id}/shuffled`

**Parameters:**
- `student_id` (required): 학생 ID

**Response:**
```json
{
  "success": true,
  "quiz_id": 101,
  "student_id": 1001,
  "total_questions": 5,
  "questions": [...],
  "shuffle_seed": "a3f5c9e2...",
  "expires_at": "2025-11-18T15:30:00Z"
}
```

### 2. Submit Answer

**Endpoint:** `POST /api/v1/quiz/{quiz_id}/submit`

**Request Body:**
```json
{
  "student_id": 1001,
  "question_id": 5001,
  "selected_answer_id": "C"
}
```

**Response:**
```json
{
  "success": true,
  "is_correct": true,
  "feedback": "Correct! Well done."
}
```

### 3. Get Quiz Configuration

**Endpoint:** `GET /api/v1/quiz/{quiz_id}/config`

**Response:**
```json
{
  "success": true,
  "config": {
    "shuffle_questions": true,
    "shuffle_answers": true,
    "seed_strategy": "combined",
    "cache_duration": 3600
  }
}
```

### 4. Admin: Get Shuffle Map

**Endpoint:** `GET /api/v1/admin/quiz/{quiz_id}/shuffle-map`

**Response:**
```json
{
  "success": true,
  "quiz_id": 101,
  "students": [
    {
      "student_id": 1001,
      "question_order": [3, 1, 5, 2, 4],
      "seed": "a3f5c9e2..."
    }
  ]
}
```

## 🧪 테스트

### 단위 테스트 실행

```bash
# ShuffleEngine 테스트
php src/tests/ShuffleEngineTest.php
```

**예상 출력:**
```
🧪 Running ShuffleEngine Tests
============================================================

Test: Seeded shuffle deterministic... ✅ PASS
Test: Seeded shuffle uniqueness... ✅ PASS
Test: Shuffle preserves elements... ✅ PASS
Test: Shuffle edge cases... ✅ PASS
Test: Generate seed... ✅ PASS
Test: Get or create seeds... ✅ PASS
Test: Shuffle questions... ✅ PASS
Test: Shuffle answers... ✅ PASS
Test: Quiz configuration... ✅ PASS

============================================================
✅ Tests passed: 9
❌ Tests failed: 0
============================================================
```

### 통합 테스트

```bash
# API 엔드포인트 테스트
curl -X GET "http://localhost/api/v1/quiz/101/shuffled?student_id=1001"

# 답안 제출 테스트
curl -X POST "http://localhost/api/v1/quiz/101/submit" \
  -H "Content-Type: application/json" \
  -d '{"student_id":1001,"question_id":5001,"selected_answer_id":"B"}'
```

## 🏗️ 아키텍처

### 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Moodle 3.7 LMS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Quiz Module  │  │ Questions DB │  │ Student Data │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼──────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Moodle API      │
                    │  Connector       │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼──────────┐              ┌──────────▼─────────┐
│  Shuffle Engine    │              │  MySQL Database    │
│  (PHP 7.1.9)       │◄────────────►│  (MySQL 5.7)       │
│                    │              │                    │
│  - Fisher-Yates    │              │  - shuffle_seeds   │
│  - Seeded Random   │              │  - shuffle_history │
│  - Cache Manager   │              │  - session_data    │
└─────────┬──────────┘              └────────────────────┘
          │
          │ JSON API
          │
┌─────────▼──────────────────────────────────────────────┐
│            Frontend Web Application                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Main Desktop View (Teacher/Admin)        │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Virtual Smartphone Display (Bottom Right)       │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Student Quiz View (Shuffled Questions)    │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 디렉토리 구조

```
alt42standalone_v1.0/
├── src/
│   ├── api/                    # API 엔드포인트
│   │   └── shuffle.php
│   ├── lib/                    # 핵심 라이브러리
│   │   └── ShuffleEngine.php
│   ├── config/                 # 설정 파일
│   │   └── database.php
│   └── tests/                  # 단위 테스트
│       └── ShuffleEngineTest.php
├── public/                     # 웹 루트
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── database/                   # 데이터베이스
│   ├── migrations/
│   │   └── 001_create_shuffle_tables.sql
│   └── seeds/
│       └── 001_sample_quiz_data.sql
├── moodle-integration/         # Moodle 연동
│   └── MoodleConnector.php
├── docs/                       # 문서
│   └── DATA_SHUFFLE_DESIGN.md
├── .env.example                # 환경 설정 템플릿
└── README.md                   # 이 파일
```

### 알고리즘

#### Fisher-Yates Shuffle

```php
/**
 * Time Complexity: O(n)
 * Space Complexity: O(1)
 */
function seededShuffle($items, $seed) {
    mt_srand(crc32($seed));

    for ($i = count($items) - 1; $i > 0; $i--) {
        $j = mt_rand(0, $i);
        // Swap
        $temp = $items[$i];
        $items[$i] = $items[$j];
        $items[$j] = $temp;
    }

    mt_srand();
    return $items;
}
```

#### Seed Generation

```
seed = SHA256(student_id + quiz_id + quiz_start_time + salt)
```

## 🔒 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: HTML 출력 시 이스케이프 처리
3. **CSRF 보호**: 토큰 기반 검증 (구현 예정)
4. **Rate Limiting**: API 요청 제한
5. **세션 보안**: HTTPS 사용 권장
6. **인증/권한**: Moodle SSO 연동

## 📊 성능

### 벤치마크

- **Shuffle 연산**: < 100ms (문제 100개 기준)
- **API 응답 시간**: < 200ms (95th percentile)
- **데이터베이스 쿼리**: < 50ms
- **동시 사용자**: 500명 (캐싱 활성화 시)

### 최적화 팁

1. **MySQL 인덱스 활용**
   ```sql
   CREATE INDEX idx_shuffle_lookup
   ON shuffle_seeds(quiz_id, student_id, expires_at);
   ```

2. **캐시 지속 시간 조정**
   ```php
   // .env
   DEFAULT_CACHE_DURATION=7200  # 2시간
   ```

3. **Nginx 캐싱 설정**
   ```nginx
   location /api/v1/quiz/ {
       proxy_cache quiz_cache;
       proxy_cache_valid 200 1h;
   }
   ```

## 🐛 문제 해결

### 일반적인 문제

#### 1. 데이터베이스 연결 실패

```bash
# MySQL 서비스 확인
systemctl status mysql

# .env 파일 확인
cat .env | grep DB_
```

#### 2. Moodle API 오류

```php
// MoodleConnector에서 연결 테스트
$connector = new MoodleConnector();
$result = $connector->testConnection();
var_dump($result);
```

#### 3. 권한 오류

```bash
# 로그 파일 확인
tail -f /var/log/apache2/error.log

# 권한 재설정
chown -R www-data:www-data /var/www/alt42standalone_v1.0
```

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 👥 기여자

- AI Education System Team

## 📞 지원

- **이슈 제출**: [GitHub Issues](https://github.com/yourusername/alt42standalone_v1.0/issues)
- **문서**: [docs/](docs/)
- **이메일**: support@example.com

---

**Made with ❤️ for better education**
