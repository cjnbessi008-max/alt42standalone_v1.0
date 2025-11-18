# Function Digest - 함수 정보 3줄 요약 시스템

> 웹앱, LMS와 연동하여 문제 속 함수 정보를 3줄로 요약해주는 스마트폰 UI 애플리케이션

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.1.9-purple.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7-orange.svg)
![Moodle](https://img.shields.io/badge/Moodle-3.7-green.svg)

## 📱 주요 기능

- **3줄 요약**: 문제 속 함수를 명확하게 3줄로 요약
  - 1줄: 함수의 목적
  - 2줄: 파라미터와 리턴 타입
  - 3줄: 핵심 동작 또는 예제
- **Moodle LMS 연동**: Moodle 3.7의 문제 정보를 실시간으로 가져옴
- **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 화면
- **자동 함수 추출**: 문제 텍스트에서 함수를 자동으로 감지
- **사용자 트래킹**: 학습자의 Digest 조회 이력 저장

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│  Frontend (웹)  │
│   HTML/CSS/JS   │
└────────┬────────┘
         │
         ↓ REST API
┌─────────────────┐      ┌──────────────┐
│  PHP Backend    │ ←──→ │  Moodle LMS  │
│   (API Server)  │      │   (3.7)      │
└────────┬────────┘      └──────────────┘
         │
         ↓ PDO
┌─────────────────┐
│  MySQL 5.7 DB   │
│  (Schema)       │
└─────────────────┘
```

## 📋 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (Web Services 활성화 필요)
- **Web Server**: Apache 2.4+ 또는 Nginx

## 🚀 설치 가이드

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 스키마 파일 실행
mysql -u root -p < src/database/schema.sql
```

### 2. PHP 백엔드 설정

```bash
# config.php 파일 수정
cd src/backend
nano config.php
```

다음 설정을 환경에 맞게 수정:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_digest_db');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_webservice_token');
```

### 3. Moodle Web Service 설정

Moodle 관리자 페이지에서:

1. **Site administration → Plugins → Web services → Manage protocols**
   - REST protocol 활성화

2. **Site administration → Plugins → Web services → External services**
   - 새 서비스 생성: "Function Digest Service"
   - 다음 함수 추가:
     - `core_question_get_questions`
     - `core_question_get_question_details`

3. **Site administration → Plugins → Web services → Manage tokens**
   - 토큰 생성 및 복사
   - `config.php`의 `MOODLE_WS_TOKEN`에 입력

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ src/backend/api.php?endpoint=$1 [QSA,L]
</IfModule>
```

#### Nginx

```nginx
location /api {
    rewrite ^/api/(.*)$ /src/backend/api.php?endpoint=$1 last;
}
```

### 5. 프론트엔드 접속

웹 브라우저에서:
```
http://localhost/src/frontend/index.html
```

## 📖 API 사용법

### 1. Function Digest 조회

```bash
GET /api.php?endpoint=digest&question_id=1001
```

**응답:**
```json
{
  "success": true,
  "question_id": 1001,
  "digests": [
    {
      "function_name": "calculate_area",
      "summary_line1": "📐 Calculates the area of a rectangle",
      "summary_line2": "📥 Parameters: width (float), height (float) → Returns: float",
      "summary_line3": "💡 Example: calculate_area(5, 10) returns 50"
    }
  ]
}
```

### 2. Digest 생성

```bash
POST /api.php?endpoint=generate
Content-Type: application/json

{
  "problem_id": 1,
  "function_name": "my_function",
  "function_code": "def my_function(x): return x * 2",
  "language": "python"
}
```

### 3. Moodle 동기화

```bash
GET /api.php?endpoint=moodle_sync&question_id=1001
```

### 4. 헬스 체크

```bash
GET /api.php?endpoint=health
```

## 🎨 UI 스크린샷

### 가상 스마트폰 UI (우측 하단)

```
┌──────────────────┐
│  📱 12:00  🔋100%│  ← Status Bar
├──────────────────┤
│ 📱 Function Digest│
│                  │
│ ┌──────────────┐ │
│ │calculate_area│ │
│ ├──────────────┤ │
│ │📐 Calculates │ │  ← Line 1: Purpose
│ │the area...   │ │
│ ├──────────────┤ │
│ │📥 Parameters │ │  ← Line 2: Params
│ │width, height │ │
│ ├──────────────┤ │
│ │💡 Example:   │ │  ← Line 3: Example
│ │area(5,10)=50 │ │
│ └──────────────┘ │
│        ⚫        │  ← Home Button
└──────────────────┘
```

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── backend/              # PHP 백엔드
│   │   ├── config.php        # 설정 파일
│   │   ├── Database.php      # DB 연결 클래스
│   │   ├── MoodleAPI.php     # Moodle 연동
│   │   ├── FunctionDigestGenerator.php  # Digest 생성 로직
│   │   └── api.php           # REST API 엔드포인트
│   │
│   ├── frontend/             # 프론트엔드
│   │   ├── index.html        # 메인 페이지
│   │   ├── styles.css        # 스타일시트
│   │   └── app.js            # JavaScript 로직
│   │
│   └── database/             # 데이터베이스
│       └── schema.sql        # MySQL 스키마
│
├── docs/                     # 문서
├── tasks/                    # PRD 및 태스크
└── README.md                 # 이 파일
```

## 🔧 개발 가이드

### 새로운 언어 지원 추가

`FunctionDigestGenerator.php`의 `generateParametersLine()` 수정:

```php
private function generateParametersLine($functionName, $code, $language) {
    switch ($language) {
        case 'python':
            // Python logic
            break;
        case 'javascript':
            // JavaScript logic
            break;
        case 'java':
            // Java logic
            break;
    }
}
```

### AI 통합 (Claude API 예제)

```php
public function generateWithAI($functionCode) {
    $apiKey = 'your-claude-api-key';
    $prompt = "Summarize this function in 3 lines:\n" . $functionCode;

    // Call Claude API
    $response = $this->callClaudeAPI($apiKey, $prompt);

    return [
        'line1' => $response['lines'][0],
        'line2' => $response['lines'][1],
        'line3' => $response['lines'][2]
    ];
}
```

## 🧪 테스트

### 데이터베이스 테스트

```bash
# 샘플 데이터 확인
mysql -u root -p function_digest_db -e "SELECT * FROM function_digests;"
```

### API 테스트

```bash
# Health check
curl http://localhost/api.php?endpoint=health

# Get digest
curl http://localhost/api.php?endpoint=digest&question_id=1
```

### 프론트엔드 테스트

1. 브라우저에서 `index.html` 열기
2. 문제 선택 후 "Load Digest" 클릭
3. 우측 하단 스마트폰 화면에 Digest 표시 확인

## 🔒 보안 고려사항

1. **SQL Injection 방지**: PDO Prepared Statements 사용
2. **XSS 방지**: `escapeHtml()` 함수로 출력 이스케이프
3. **CSRF 방지**: 프로덕션에서 토큰 추가 필요
4. **API 인증**: Moodle 토큰 안전하게 보관
5. **HTTPS**: 프로덕션 환경에서 필수

## 🚧 향후 계획

- [ ] AI 기반 자동 요약 (Claude API 통합)
- [ ] 다국어 지원 (한국어, 영어)
- [ ] 더 많은 프로그래밍 언어 지원
- [ ] 모바일 네이티브 앱 버전
- [ ] 학습 분석 대시보드
- [ ] 함수 복잡도 분석

## 📄 라이선스

MIT License

## 👥 기여자

- 개발: Claude & Team
- 디자인: Function Digest Team

## 📞 지원

문제가 발생하면 이슈를 등록해주세요:
- GitHub Issues: [Repository URL]
- Email: support@example.com

---

**Made with ❤️ for better coding education**
