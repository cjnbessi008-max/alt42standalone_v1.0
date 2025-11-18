# Riemann Densify - Interactive Riemann Sum Visualization

**리만 합 밀도화 시각화 앱** - Moodle LMS와 연동하여 리만 합의 조밀화(Densification) 과정을 보여주는 인터랙티브 웹 애플리케이션

<img src="https://via.placeholder.com/800x400/667eea/ffffff?text=Riemann+Densify+App" alt="Riemann Densify App"/>

## 📱 주요 기능

### 1. **가상 스마트폰 화면 표시**
- 우측 하단에 가상 스마트폰 화면 표시
- 실제 모바일 앱처럼 보이는 인터페이스
- Canvas를 이용한 고품질 수학 시각화

### 2. **Riemann Densify 애니메이션**
- 리만 합의 막대(rectangles)가 점점 조밀해지는 과정을 5초 동안 애니메이션으로 표시
- 분할 수(n)가 5개에서 100개까지 부드럽게 증가
- 실시간으로 리만 합 값과 오차가 업데이트됨

### 3. **Moodle LMS 연동**
- MySQL 5.7 데이터베이스를 통한 문제 정보 수신
- PHP 7.1.9 백엔드 API
- Moodle 3.7과 완벽 호환

### 4. **다양한 Riemann Sum 타입 지원**
- 좌측 합(Left Riemann Sum)
- 우측 합(Right Riemann Sum)
- 중점 합(Midpoint Riemann Sum)
- 사다리꼴(Trapezoid Rule)

### 5. **실시간 계산 및 피드백**
- 리만 합 근사값 표시
- 정확한 적분값과 비교
- 오차(Error) 계산 및 색상 코드 표시

## 🛠️ 기술 스택

### Frontend
- **HTML5** + **CSS3** (순수 JavaScript)
- **Canvas API** - 그래프 및 시각화
- **Fetch API** - 비동기 통신

### Backend
- **PHP 7.1.9** - 서버 사이드 로직
- **MySQL 5.7** - 데이터베이스

### Integration
- **Moodle 3.7** - 학습 관리 시스템

## 📂 프로젝트 구조

```
riemann-app/
├── index.html                  # 메인 HTML 파일
├── css/
│   └── style.css              # 스타일시트 (스마트폰 UI 포함)
├── js/
│   ├── riemann-calculator.js  # 리만 합 계산 로직
│   ├── canvas-renderer.js     # Canvas 렌더링 및 애니메이션
│   ├── moodle-api.js          # Moodle API 클라이언트
│   └── app.js                 # 메인 애플리케이션 로직
├── php/
│   ├── get-problem.php        # 특정 문제 가져오기
│   ├── get-all-problems.php   # 모든 문제 목록
│   ├── submit-answer.php      # 답안 제출
│   └── check-connection.php   # 연결 상태 확인
└── config/
    ├── database.php           # 데이터베이스 설정
    └── database-schema.sql    # 데이터베이스 스키마 및 샘플 데이터
```

## 🚀 설치 및 설정

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 (Moodle 데이터베이스 사용 시 생략)
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 및 샘플 데이터 적용
USE moodle;
SOURCE config/database-schema.sql;
```

### 2. PHP 설정

`config/database.php` 파일을 열어 데이터베이스 연결 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password_here');
define('DB_PORT', '3306');
```

### 3. 웹 서버 설정

**Apache 설정 예시:**

```apache
<VirtualHost *:80>
    ServerName riemann.local
    DocumentRoot /path/to/riemann-app

    <Directory /path/to/riemann-app>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler application/x-httpd-php
    </FilesMatch>
</VirtualHost>
```

**Nginx 설정 예시:**

```nginx
server {
    listen 80;
    server_name riemann.local;
    root /path/to/riemann-app;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 4. 로그 디렉토리 생성

```bash
mkdir -p logs
chmod 777 logs
```

### 5. 앱 실행

브라우저에서 다음 URL로 접속:

```
http://riemann.local/
또는
http://localhost/riemann-app/
```

문제 ID를 지정하여 특정 문제 로드:

```
http://localhost/riemann-app/?problem=1
```

## 📖 사용 방법

### 기본 사용법

1. **문제 선택**: URL 파라미터로 문제 ID 지정 (`?problem=1`)
2. **분할 수 조정**: 슬라이더로 리만 합의 분할 수(n) 조정
3. **타입 선택**: 드롭다운에서 리만 합 타입 선택 (좌측/우측/중점/사다리꼴)
4. **Densify 실행**: "Densify 시작" 버튼 클릭하여 애니메이션 시작
5. **결과 확인**: 실시간으로 업데이트되는 리만 합, 적분값, 오차 확인

### Densify 애니메이션

- **시작**: "Densify 시작" 버튼 클릭
- **일시정지**: 애니메이션 중 "일시정지" 버튼 클릭
- **초기화**: "초기화" 버튼으로 초기 상태로 복귀
- **진행 상황**: 하단 프로그레스 바로 진행률 확인

### 우측 하단 스마트폰 화면

- 가상 스마트폰 화면에 실시간 그래프 표시
- Moodle 연결 상태 표시 (초록색: 연결됨, 빨간색: 미연결)
- 현재 진행 상황과 상태 메시지 표시

## 🗄️ 데이터베이스 스키마

### 주요 테이블

#### `mdl_riemann_problems`
문제 정보를 저장하는 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 문제 ID (Primary Key) |
| title | VARCHAR(255) | 문제 제목 |
| function_expr | VARCHAR(255) | 함수 표현식 (예: "x*x") |
| function_display | VARCHAR(255) | 표시용 함수 (예: "f(x) = x²") |
| interval_a | DECIMAL | 적분 구간 시작점 |
| interval_b | DECIMAL | 적분 구간 끝점 |
| riemann_type | ENUM | 리만 합 타입 |
| exact_answer | DECIMAL | 정확한 적분값 |
| difficulty | ENUM | 난이도 (easy/medium/hard) |

#### `mdl_riemann_submissions`
학생 답안 제출 기록

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 제출 ID (Primary Key) |
| problem_id | INT | 문제 ID (Foreign Key) |
| user_id | INT | Moodle 사용자 ID |
| submitted_answer | DECIMAL | 제출한 답 |
| correct_answer | DECIMAL | 정답 |
| error_value | DECIMAL | 절대 오차 |
| percent_error | DECIMAL | 백분율 오차 |
| is_correct | TINYINT | 정답 여부 |

#### `mdl_riemann_progress`
학생 진행 상황 추적

| 컬럼 | 타입 | 설명 |
|------|------|------|
| user_id | INT | 사용자 ID |
| problem_id | INT | 문제 ID |
| attempts | INT | 시도 횟수 |
| correct_attempts | INT | 정답 횟수 |
| best_error | DECIMAL | 최소 오차 |
| completed | TINYINT | 완료 여부 |

## 🔧 API 엔드포인트

### GET `/php/check-connection.php`
Moodle 데이터베이스 연결 상태 확인

**응답:**
```json
{
  "success": true,
  "message": "Connected to Moodle database",
  "database": {
    "host": "localhost",
    "name": "moodle",
    "mysql_version": "5.7.34"
  }
}
```

### GET `/php/get-problem.php?id=1`
특정 문제 정보 가져오기

**응답:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "기본 함수의 적분",
    "function": "x*x",
    "function_display": "f(x) = x²",
    "interval_a": 0,
    "interval_b": 2,
    "riemann_type": "midpoint",
    "exact_answer": 2.6667
  }
}
```

### GET `/php/get-all-problems.php`
모든 활성 문제 목록 가져오기

**응답:**
```json
{
  "success": true,
  "count": 8,
  "problems": [...]
}
```

### POST `/php/submit-answer.php`
학생 답안 제출

**요청:**
```json
{
  "problem_id": 1,
  "user_id": 123,
  "answer": 2.667,
  "actual_answer": 2.6667
}
```

**응답:**
```json
{
  "success": true,
  "submission": {
    "id": 42,
    "is_correct": true,
    "error": 0.0003,
    "percent_error": 0.01,
    "feedback": "정답입니다! 잘하셨습니다."
  }
}
```

## 🎨 커스터마이징

### 함수 추가

`js/moodle-api.js`의 `parseFunctionString()` 메서드를 수정하여 새로운 함수 지원:

```javascript
parseFunctionString(functionStr) {
    let jsCode = functionStr
        .replace(/\^/g, '**')
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        // 여기에 새로운 함수 추가
        .replace(/ln/g, 'Math.log');

    return new Function('x', `return ${jsCode};`);
}
```

### 애니메이션 속도 조정

`js/canvas-renderer.js`의 `animateDensify()` 메서드에서 duration 변경:

```javascript
const duration = 5000; // 5초 -> 원하는 시간(밀리초)으로 변경
```

### 최대 분할 수 변경

`js/app.js`의 `startDensify()` 함수에서 targetN 변경:

```javascript
const targetN = 100; // 최대 분할 수
```

### 색상 테마 변경

`css/style.css`에서 색상 변수 수정:

```css
/* 주요 그라디언트 색상 */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* 원하는 색상으로 변경 */
background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
```

## 🐛 문제 해결

### Moodle 연결 실패

1. `config/database.php`의 데이터베이스 정보 확인
2. MySQL 서비스 실행 여부 확인: `sudo service mysql status`
3. PHP MySQL 확장 설치 여부 확인: `php -m | grep mysql`
4. 데이터베이스 사용자 권한 확인

### Canvas가 표시되지 않음

1. 브라우저 콘솔에서 JavaScript 에러 확인
2. Canvas 크기 설정 확인 (`width`, `height` 속성)
3. 최신 브라우저 사용 (Chrome, Firefox, Safari, Edge)

### 애니메이션이 작동하지 않음

1. `requestAnimationFrame` 지원 여부 확인
2. JavaScript 콘솔에서 에러 메시지 확인
3. 브라우저 개발자 도구에서 네트워크 탭 확인

### PHP 에러

1. PHP 버전 확인: `php -v` (7.1.9 이상 필요)
2. 에러 로그 확인: `tail -f logs/php-error.log`
3. PHP 설정 확인: `php.ini`의 `display_errors`, `error_reporting`

## 🔒 보안 고려사항

1. **SQL Injection 방지**: Prepared Statements 사용
2. **XSS 방지**: 사용자 입력 검증 및 이스케이프 처리
3. **CSRF 방지**: 프로덕션 환경에서 CSRF 토큰 구현 권장
4. **비밀번호 보안**: `config/database.php`를 `.gitignore`에 추가
5. **HTTPS 사용**: 프로덕션 환경에서 SSL 인증서 적용

## 📊 샘플 문제

데이터베이스에 포함된 샘플 문제:

1. **f(x) = x²** on [0, 2] - 기본 함수의 적분
2. **f(x) = x³** on [0, 1] - 3차 함수의 적분
3. **f(x) = 2x + 1** on [0, 3] - 선형 함수의 적분
4. **f(x) = sin(x)** on [0, π] - 삼각 함수의 적분
5. **f(x) = e^x** on [0, 1] - 지수 함수의 적분
6. **f(x) = 1/x** on [1, 2] - 역수 함수의 적분
7. **f(x) = √x** on [0, 4] - 제곱근 함수의 적분
8. **f(x) = x² - 4x + 3** on [0, 4] - 2차 다항식의 적분

## 📝 라이센스

이 프로젝트는 교육 목적으로 사용됩니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 📧 연락처

문의사항이 있으시면 이슈를 통해 연락주세요.

---

**Made with ❤️ for Mathematics Education**
