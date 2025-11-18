# 🎭 Variable Dance

**변수가 춤추듯 이동하며 해집합이 동적으로 변화하는 수학 학습 웹앱**

Moodle 3.7 LMS와 연동하여 문제 정보를 받아 우측 하단 가상 스마트폰 화면에 표시되는 인터랙티브 수학 학습 시스템입니다.

---

## 📋 목차

- [특징](#-특징)
- [기술 스택](#-기술-스택)
- [시스템 요구사항](#-시스템-요구사항)
- [설치 가이드](#-설치-가이드)
- [Moodle 연동 설정](#-moodle-연동-설정)
- [사용 방법](#-사용-방법)
- [API 문서](#-api-문서)
- [문제 타입](#-문제-타입)
- [프로젝트 구조](#-프로젝트-구조)
- [개발 및 디버깅](#-개발-및-디버깅)
- [라이선스](#-라이선스)

---

## ✨ 특징

### 🎯 핵심 기능

1. **변수 이동 시각화**: 슬라이더를 통해 변수 값을 조정하면 실시간으로 해집합이 변화
2. **춤추는 애니메이션**: 변수가 이동할 때마다 파티클 애니메이션 효과
3. **가상 스마트폰 UI**: 우측 하단에 배치된 모바일 스타일 인터페이스
4. **Moodle LMS 연동**: Moodle 3.7에서 문제 정보 자동 동기화
5. **학습 분석**: 변수 이동 이벤트 로깅 및 학습 패턴 분석

### 📚 지원하는 수학 문제

- ✅ **일차방정식** (Linear Equations): `ax + b = 0`
- ✅ **이차방정식** (Quadratic Equations): `ax² + bx + c = 0`
- ✅ **연립방정식** (System of Equations): 두 개의 일차방정식

### 🎨 UI/UX

- 다크모드 기반의 현대적인 디자인
- 반응형 레이아웃 (데스크톱, 태블릿, 모바일)
- Canvas 기반 실시간 그래프 시각화
- 부드러운 애니메이션 효과

---

## 🛠 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **PDO**: 데이터베이스 연결

### 프론트엔드
- **HTML5 / CSS3**
- **Vanilla JavaScript** (ES6+)
- **Canvas API**: 그래프 시각화

### LMS 연동
- **Moodle**: 3.7
- **Moodle Web Services API**: RESTful API

---

## 💻 시스템 요구사항

### 서버 요구사항

- **운영체제**: Linux / Windows / macOS
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (선택사항)

### PHP 확장 모듈

```bash
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

필수 확장:
- `pdo`
- `pdo_mysql`
- `json`
- `curl`
- `mbstring`

---

## 📦 설치 가이드

### 1. 프로젝트 클론

```bash
cd /var/www/html  # 또는 웹 서버 루트 디렉토리
git clone <repository-url> variable-dance
cd variable-dance
```

### 2. 데이터베이스 설정

MySQL에 접속하여 데이터베이스 생성:

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE variable_dance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (선택사항)
CREATE USER 'vdance_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON variable_dance.* TO 'vdance_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

스키마 임포트:

```bash
mysql -u root -p variable_dance < database/schema.sql
```

### 3. 설정 파일 수정

`config/config.php` 파일을 환경에 맞게 수정:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'variable_dance');
define('DB_USER', 'vdance_user');  // 생성한 사용자명
define('DB_PASS', 'your_password'); // 비밀번호

// Moodle 설정
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_api_token');
```

### 4. 파일 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs  # Apache 사용자

# 설정 파일 보호
chmod 640 config/config.php
chown www-data:www-data config/config.php
```

### 5. 웹 서버 설정

#### Apache

`.htaccess` 파일이 이미 포함되어 있습니다. `mod_rewrite`가 활성화되어 있는지 확인:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx

`/etc/nginx/sites-available/variable-dance` 파일 생성:

```nginx
server {
    listen 80;
    server_name variable-dance.local;

    root /var/www/html/variable-dance/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location /api/ {
        try_files $uri $uri/ =404;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/variable-dance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. 브라우저에서 접속

```
http://localhost/variable-dance/public/index.html
```

---

## 🔗 Moodle 연동 설정

### 1. Moodle Web Services 활성화

Moodle 관리자로 로그인:

1. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크

2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭
   - 이름: `Variable Dance API`
   - 활성화 체크

3. **사이트 관리 > 플러그인 > 웹 서비스 > 관리 토큰**
   - "토큰 생성" 클릭
   - 사용자 선택
   - 서비스: `Variable Dance API`
   - 토큰 복사

### 2. Variable Dance 설정

복사한 토큰을 `config/config.php`에 추가:

```php
define('MOODLE_TOKEN', 'your_copied_token_here');
```

### 3. 연결 테스트

브라우저 콘솔에서:

```javascript
// Ctrl + Shift + M 단축키 사용
// 또는
testMoodle();
```

성공 시 Moodle 사이트 정보가 표시됩니다.

---

## 📖 사용 방법

### 기본 사용법

1. **문제 선택**
   - 왼쪽 문제 목록에서 원하는 문제 클릭
   - 우측 하단 스마트폰 화면에 문제 표시

2. **변수 조정**
   - 슬라이더를 드래그하여 변수 값 변경
   - 실시간으로 방정식과 해집합 업데이트

3. **시각화 확인**
   - Canvas 그래프에서 해의 위치 확인
   - 애니메이션 효과 관찰

4. **문제 닫기**
   - 스마트폰 화면 우측 상단 X 버튼 클릭
   - 또는 ESC 키

### 단축키

| 단축키 | 기능 |
|--------|------|
| `ESC` | 스마트폰 닫기 |
| `Ctrl + Space` | 스마트폰 토글 (최소화/복원) |
| `Ctrl + Shift + M` | Moodle 연결 테스트 |

---

## 🔌 API 문서

### 문제 관리 API

#### 1. 모든 문제 가져오기

```
GET /api/problem-handler.php?action=get_all_problems
```

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "일차방정식: 변수 a의 이동",
      "problem_type": "linear",
      "equation": { "equation": "ax + b = 0" },
      "variables": {
        "a": { "min": -10, "max": 10, "initial": 2, "step": 0.5 },
        "b": { "min": -10, "max": 10, "initial": 4, "step": 0.5 }
      }
    }
  ]
}
```

#### 2. 특정 문제 가져오기

```
GET /api/problem-handler.php?action=get_problem&id=1
```

#### 3. 해집합 계산

```
POST /api/problem-handler.php?action=calculate_solution
Content-Type: application/json

{
  "problem_id": 1,
  "variables": {
    "a": 2,
    "b": 4
  }
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "type": "single",
    "description": "x = -2",
    "solutions": [-2],
    "equation": "2x + 4 = 0"
  }
}
```

#### 4. 학습 세션 생성

```
POST /api/problem-handler.php?action=create_session
Content-Type: application/json

{
  "student_id": 1,
  "problem_id": 1
}
```

#### 5. 변수 이동 이벤트 로깅

```
POST /api/problem-handler.php?action=log_event
Content-Type: application/json

{
  "session_id": 123,
  "variable_name": "a",
  "old_value": 2,
  "new_value": 3,
  "solution_before": { "solutions": [-2] },
  "solution_after": { "solutions": [-1.33] }
}
```

### Moodle 연동 API

#### 1. Moodle 연결 테스트

```
GET /api/moodle-connector.php?action=test
```

#### 2. Moodle 문제 가져오기

```
GET /api/moodle-connector.php?action=get_problem&problem_id=1001
```

#### 3. Moodle에 결과 제출

```
POST /api/moodle-connector.php?action=submit_result
Content-Type: application/json

{
  "user_id": 5,
  "problem_id": 1001,
  "score": 85,
  "attempts": [...]
}
```

---

## 📐 문제 타입

### 1. 일차방정식 (Linear)

**방정식**: `ax + b = 0`

**변수**:
- `a`: 계수 (-10 ~ 10)
- `b`: 상수항 (-10 ~ 10)

**해**:
- `a ≠ 0`: `x = -b/a`
- `a = 0, b = 0`: 무수히 많은 해
- `a = 0, b ≠ 0`: 해 없음

### 2. 이차방정식 (Quadratic)

**방정식**: `ax² + bx + c = 0`

**변수**:
- `a`: 이차항 계수 (-5 ~ 5, a ≠ 0)
- `b`: 일차항 계수 (-10 ~ 10)
- `c`: 상수항 (-10 ~ 10)

**해** (판별식 `D = b² - 4ac`):
- `D > 0`: 서로 다른 두 실근
- `D = 0`: 중근
- `D < 0`: 허근 (실근 없음)

### 3. 연립방정식 (System)

**방정식**:
```
a1*x + b1*y = c1
a2*x + b2*y = c2
```

**변수**:
- `a1, b1, c1`: 첫 번째 방정식 계수
- `a2, b2, c2`: 두 번째 방정식 계수

**해** (판별식 `det = a1*b2 - a2*b1`):
- `det ≠ 0`: 유일한 해 (교점)
- `det = 0, 비례`: 무수히 많은 해 (일치)
- `det = 0, 비비례`: 해 없음 (평행)

---

## 📂 프로젝트 구조

```
variable-dance/
├── api/                      # PHP 백엔드 API
│   ├── moodle-connector.php  # Moodle LMS 연동
│   └── problem-handler.php   # 문제 관리 및 계산
├── config/                   # 설정 파일
│   └── config.php            # 데이터베이스 및 Moodle 설정
├── database/                 # 데이터베이스 스키마
│   └── schema.sql            # MySQL 테이블 정의
├── public/                   # 프론트엔드 (웹 루트)
│   ├── index.html            # 메인 HTML
│   ├── css/
│   │   └── style.css         # 스타일시트
│   └── js/
│       ├── api.js            # API 통신 모듈
│       ├── app.js            # 메인 앱 로직
│       ├── variable-dance.js # Variable Dance 엔진
│       └── visualization.js  # Canvas 시각화
├── logs/                     # 로그 파일 (자동 생성)
└── README.md                 # 이 문서
```

---

## 🧪 개발 및 디버깅

### 디버그 모드 활성화

`config/config.php`:

```php
define('DEBUG_MODE', true);
```

### 브라우저 콘솔 로그

Variable Dance는 상세한 콘솔 로그를 제공합니다:

```javascript
// 현재 통계 확인
variableDance.getStatistics();

// 이벤트 히스토리
variableDance.eventHistory;

// API 직접 호출
API.getAllProblems();
```

### 로그 파일

서버 로그는 `logs/app.log`에 저장됩니다:

```bash
tail -f logs/app.log
```

### 샘플 데이터

데이터베이스 스키마에 3개의 샘플 문제가 포함되어 있습니다:
1. 일차방정식
2. 이차방정식
3. 연립방정식

### 문제 추가

MySQL에서 직접 추가:

```sql
INSERT INTO problems (
  moodle_problem_id, problem_type, title, description,
  equation, variables, constraints, solution_set, difficulty_level
) VALUES (
  1004, 'linear', '새 문제', '설명',
  '{"equation": "2x + 3 = 0"}',
  '{"x": {"min": -10, "max": 10, "initial": 0, "step": 1}}',
  '{}',
  '{"type": "single", "formula": "x = -1.5"}',
  'easy'
);
```

---

## 🤝 기여

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 📞 문의

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**🎭 Variable Dance - 수학을 춤추게 하다!**
