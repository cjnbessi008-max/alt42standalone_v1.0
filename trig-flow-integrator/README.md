# Trig Flow Integrator

> 삼각함수 적분 시각화를 위한 인터랙티브 웹 애플리케이션
> Moodle LMS 연동 지원 | 가상 스마트폰 UI | 부드러운 애니메이션

## 📱 개요

**Trig Flow Integrator**는 학생들이 삼각함수의 적분을 직관적으로 이해할 수 있도록 돕는 교육용 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 형태로 표시되며, 실시간으로 부드러운 파형 변화를 시각화합니다.

### 주요 기능

- 📊 **실시간 시각화**: sin, cos, tan 함수의 적분을 실시간으로 시각화
- 🎬 **부드러운 애니메이션**: 파형이 부드럽게 변화하는 애니메이션 효과
- 🎨 **인터랙티브 컨트롤**: 진폭, 주파수, 위상 등 매개변수를 실시간 조절
- 📐 **정적분 계산**: 특정 구간의 면적(정적분) 계산 기능
- 📱 **모바일 친화적**: 가상 스마트폰 UI로 모바일 경험 최적화
- 🔗 **Moodle 연동**: Moodle LMS와 완벽하게 통합

## 🛠️ 기술 스택

### 프론트엔드
- **HTML5 Canvas**: 고성능 그래픽 렌더링
- **JavaScript ES6+**: 모던 JavaScript
- **CSS3**: 반응형 디자인 및 애니메이션

### 백엔드
- **PHP 7.1.9**: Moodle 호환 버전
- **MySQL 5.7**: 데이터베이스
- **PDO**: 안전한 데이터베이스 연결

### 연동
- **Moodle 3.7**: LMS 플랫폼
- **Moodle Web Services**: REST API 연동

## 📂 프로젝트 구조

```
trig-flow-integrator/
├── database/
│   └── schema.sql              # MySQL 데이터베이스 스키마
├── backend/
│   ├── config/
│   │   ├── database.php        # 데이터베이스 연결 설정
│   │   └── config.php          # 일반 설정 및 헬퍼 함수
│   └── api/
│       ├── moodle_connect.php  # Moodle LMS 연동 API
│       └── problem_data.php    # 문제 데이터 관리 API
├── frontend/
│   ├── index.html              # 메인 HTML 파일
│   ├── css/
│   │   └── smartphone.css      # 가상 스마트폰 UI 스타일
│   └── js/
│       ├── trig-integrator.js  # 삼각함수 적분 계산 엔진
│       └── visualization.js    # Canvas 시각화 엔진
└── README.md                   # 이 파일
```

## 🚀 설치 및 설정

### 1. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE trig_flow_integrator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 임포트
mysql -u root -p trig_flow_integrator < database/schema.sql
```

### 2. PHP 설정

`backend/config/database.php` 파일을 편집하여 데이터베이스 접속 정보를 설정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'trig_flow_integrator');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle 데이터베이스 설정
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'your_moodle_username');
define('MOODLE_DB_PASS', 'your_moodle_password');
```

### 3. Moodle 연동 설정

`backend/config/config.php` 파일에서 Moodle 설정을 업데이트합니다:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_WS_TOKEN', 'your_webservice_token');
```

#### Moodle Web Service 토큰 생성 방법

1. Moodle 관리자로 로그인
2. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스 관리**
3. 새 서비스 생성 및 필요한 함수 추가
4. **토큰 관리**에서 토큰 생성
5. 생성된 토큰을 `MOODLE_WS_TOKEN`에 입력

### 4. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName trig-flow.local
    DocumentRoot /path/to/trig-flow-integrator/frontend

    <Directory /path/to/trig-flow-integrator/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /api /path/to/trig-flow-integrator/backend/api

    <Directory /path/to/trig-flow-integrator/backend/api>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name trig-flow.local;

    root /path/to/trig-flow-integrator/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /path/to/trig-flow-integrator/backend/api;
        try_files $uri $uri/ =404;

        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

## 📖 사용 방법

### 기본 사용

1. 웹 브라우저에서 `index.html` 열기
2. 우측 하단에 가상 스마트폰 화면이 표시됨
3. 함수 선택 (sin, cos, tan)
4. 슬라이더로 매개변수 조절
5. 애니메이션 버튼으로 시각화 시작

### 매개변수 설명

- **진폭 (a)**: 파형의 높이 조절 (-3 ~ 3)
- **주파수 (b)**: 파형의 주기 조절 (0.1 ~ 3)
- **위상 이동 (c)**: 파형을 좌우로 이동 (-3 ~ 3)
- **수직 이동 (d)**: 파형을 상하로 이동 (-3 ~ 3)
- **적분 상수 (C)**: 적분 함수의 상수 조절 (-3 ~ 3)

### 정적분 계산

1. "정적분 계산" 섹션에서 시작점과 끝점 입력
2. "면적 계산" 버튼 클릭
3. 결과가 표시됨

### API 사용

#### 문제 정보 가져오기

```javascript
// GET /api/problem_data.php?action=problems&quiz_id=1
fetch('/api/problem_data.php?action=problems&quiz_id=1')
    .then(response => response.json())
    .then(data => console.log(data));
```

#### 학생 진행 상황 저장

```javascript
// POST /api/problem_data.php
const progressData = {
    action: 'start_progress',
    user_id: 123,
    problem_id: 1,
    session_id: 'session_abc123'
};

fetch('/api/problem_data.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(progressData)
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🎓 교육적 활용

### 학습 목표

1. **시각적 이해**: 삼각함수와 그 적분의 관계를 시각적으로 이해
2. **매개변수 영향**: 각 매개변수가 함수에 미치는 영향 파악
3. **정적분 개념**: 정적분과 면적의 관계 학습
4. **실시간 탐구**: 인터랙티브한 환경에서 자유롭게 탐구

### 수업 활용 예시

1. **도입**: 삼각함수의 기본 개념 복습
2. **탐구**: 학생들이 직접 매개변수를 조절하며 변화 관찰
3. **발견**: 적분과 원함수의 관계 발견
4. **응용**: 실생활 문제에 적용

## 🔧 커스터마이징

### 색상 변경

`frontend/css/smartphone.css` 파일에서 색상을 변경할 수 있습니다:

```css
:root {
    --color-primary: #667eea;
    --color-secondary: #764ba2;
    --color-original: #3498db;
    --color-integral: #e74c3c;
}
```

### 함수 추가

`frontend/js/trig-integrator.js`의 `functions` 객체에 새 함수를 추가:

```javascript
csc: {
    original: (x, a, b, c, d) => a / Math.sin(b * x + c) + d,
    integral: (x, a, b, c, d, C) => {
        // 적분 공식 구현
    },
    name: 'csc(x)',
    integralName: '...'
}
```

## 📊 데이터베이스 스키마

### 주요 테이블

#### trig_problems
삼각함수 문제 정보 저장

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_quiz_id | INT | Moodle 퀴즈 ID |
| function_type | ENUM | 함수 타입 (sin, cos, tan) |
| difficulty_level | TINYINT | 난이도 (1-5) |
| coefficient | DECIMAL | 계수 (a) |
| frequency | DECIMAL | 주파수 (b) |

#### student_progress
학생의 진행 상황 추적

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_user_id | INT | Moodle 사용자 ID |
| problem_id | INT | 문제 ID |
| is_correct | BOOLEAN | 정답 여부 |
| time_spent_seconds | INT | 소요 시간 |

## 🐛 문제 해결

### 캔버스가 표시되지 않는 경우

1. 브라우저 콘솔에서 JavaScript 오류 확인
2. `visualizationCanvas` ID가 올바른지 확인
3. CSS 파일이 제대로 로드되었는지 확인

### Moodle 연동 오류

1. Web Service 토큰이 올바른지 확인
2. Moodle에서 Web Services가 활성화되어 있는지 확인
3. 필요한 함수가 서비스에 추가되어 있는지 확인

### 데이터베이스 연결 오류

1. MySQL 서비스가 실행 중인지 확인
2. 데이터베이스 접속 정보가 올바른지 확인
3. 사용자에게 적절한 권한이 있는지 확인

## 📝 라이선스

이 프로젝트는 교육 목적으로 자유롭게 사용할 수 있습니다.

## 👥 기여

버그 리포트나 기능 제안은 이슈로 등록해 주세요.

## 📞 지원

문제가 발생하거나 도움이 필요한 경우:
- GitHub Issues에 문의
- 프로젝트 문서 참조

---

**Made with ❤️ for Education**
