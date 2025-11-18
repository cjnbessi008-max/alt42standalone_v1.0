# Function Live Sync 📊

**함수식이 변하면 그래프가 살아 움직이는 실시간 학습 시스템**

Moodle/LMS와 연동하여 수학 함수 그래프를 실시간으로 시각화하고 학습할 수 있는 웹 애플리케이션입니다. 우측 하단에 가상 스마트폰 화면이 표시되어 모바일 환경을 시뮬레이션합니다.

## 🎯 주요 기능

- ✨ **실시간 그래프 렌더링**: 함수식을 입력하면 즉시 그래프로 변환
- 📱 **스마트폰 시뮬레이션**: 우측 하단에 가상 스마트폰 화면 표시
- 🔄 **실시간 동기화**: 변경사항을 서버에 자동 저장
- 📐 **다양한 함수 지원**: 일차, 이차, 삼차, 삼각, 지수, 로그 함수
- 🎨 **부드러운 애니메이션**: 그래프 변경 시 애니메이션 효과
- 🔌 **Moodle 연동**: Moodle LMS에서 문제 정보 가져오기
- 💾 **MySQL 저장**: 학생 세션 및 답안 자동 저장

## 🛠 기술 스택

### 프론트엔드
- **HTML5 Canvas**: 그래프 렌더링
- **Vanilla JavaScript**: 함수 파서 및 애플리케이션 로직
- **CSS3**: 반응형 디자인 및 스마트폰 시뮬레이션

### 백엔드
- **PHP 7.1.9+**: REST API 서버
- **MySQL 5.7**: 데이터베이스

### 호환성
- **Moodle 3.7**: LMS 연동 (선택 사항)

## 📁 프로젝트 구조

```
function-live-sync/
├── frontend/
│   ├── index.html              # 메인 페이지
│   ├── css/
│   │   └── style.css          # 스타일시트
│   └── js/
│       ├── parser.js          # 수학 함수 파서
│       ├── graph.js           # 그래프 렌더링 엔진
│       └── app.js             # 메인 애플리케이션
├── backend/
│   ├── api/
│   │   ├── config.php         # 데이터베이스 설정
│   │   ├── problems.php       # 문제 CRUD API
│   │   └── sync.php           # 실시간 동기화 API
│   └── moodle/                # Moodle 플러그인 (향후)
├── database/
│   └── schema.sql             # MySQL 스키마
└── README.md
```

## 🚀 설치 방법

### 1. 환경 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- (선택) Moodle 3.7

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE function_live_sync CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 import
mysql -u root -p function_live_sync < database/schema.sql
```

### 3. 백엔드 설정

`backend/api/config.php` 파일을 열고 데이터베이스 설정을 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_live_sync');
define('DB_USER', 'root');           // 사용자 이름
define('DB_PASS', 'your_password');  // 비밀번호
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName function-live-sync.local
    DocumentRoot /path/to/function-live-sync/frontend

    <Directory /path/to/function-live-sync/frontend>
        AllowOverride All
        Require all granted
    </Directory>

    Alias /backend /path/to/function-live-sync/backend
    <Directory /path/to/function-live-sync/backend>
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name function-live-sync.local;
    root /path/to/function-live-sync/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /backend {
        alias /path/to/function-live-sync/backend;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
}
```

### 5. 실행

브라우저에서 접속:
```
http://localhost/function-live-sync/frontend/index.html
```

또는 URL 파라미터로 문제 ID 지정:
```
http://localhost/function-live-sync/frontend/index.html?problem_id=1
```

## 📖 사용 방법

### 기본 사용법

1. **함수 입력**: 상단 입력 필드에 함수식 입력 (예: `y = 2x + 3`)
2. **그래프 확인**: 우측 스마트폰 화면에서 실시간 그래프 확인
3. **샘플 선택**: 드롭다운에서 미리 정의된 함수 선택 가능
4. **답안 제출**: 완료 후 "답안 제출" 버튼 클릭

### 지원하는 함수 형식

| 함수 타입 | 예시 | 설명 |
|----------|------|------|
| 일차함수 | `y = 2x + 1` | 기울기 m, y절편 b |
| 이차함수 | `y = x^2` | 포물선 |
| 삼차함수 | `y = x^3 - 3x` | 3차 다항식 |
| 삼각함수 | `y = sin(x)`, `y = cos(x)` | 주기 함수 |
| 지수함수 | `y = e^x` | 지수 증가 |
| 로그함수 | `y = ln(x)` | 자연 로그 |

### 수학 기호 및 함수

```
연산자: +, -, *, /, ^(제곱)
삼각함수: sin(), cos(), tan()
로그: ln() (자연로그), log() (상용로그)
기타: sqrt() (제곱근), abs() (절댓값), exp() (지수)
상수: pi (π), e (자연상수)
```

## 🔌 Moodle 연동

### 1. Moodle에서 사용

```php
// Moodle 활동 모듈에서 호출
$url = 'http://function-live-sync.local/frontend/index.html';
$params = [
    'problem_id' => $question_id,
    'student_id' => $USER->id,
    'moodle_session' => sesskey()
];

$iframe_url = $url . '?' . http_build_query($params);

echo '<iframe src="' . $iframe_url . '" width="100%" height="800px"></iframe>';
```

### 2. API를 통한 문제 생성

```bash
curl -X POST http://localhost/backend/api/problems.php \
  -H "Content-Type: application/json" \
  -d '{
    "title": "일차함수 학습",
    "description": "y = mx + b 형태의 함수를 그려보세요",
    "function_type": "linear",
    "initial_function": "y = x",
    "moodle_question_id": 123,
    "x_range_min": -10,
    "x_range_max": 10,
    "y_range_min": -10,
    "y_range_max": 10
  }'
```

## 🎨 커스터마이징

### 그래프 스타일 변경

`frontend/js/app.js`에서 그래프 옵션 수정:

```javascript
this.graph = new GraphRenderer('graph-canvas', {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    gridSize: 1,
    backgroundColor: '#ffffff',
    gridColor: '#e0e0e0',
    functionColor: '#2196F3',
    lineWidth: 2,
    animate: true
});
```

### 스마트폰 크기 조정

`frontend/css/style.css`에서 `.smartphone` 클래스 수정:

```css
.smartphone {
    width: 375px;    /* 가로 크기 */
    height: 667px;   /* 세로 크기 */
}
```

## 🧪 API 문서

### 문제 조회
```
GET /backend/api/problems.php?id=1
```

### 세션 시작
```
POST /backend/api/sync.php
{
  "action": "start_session",
  "problem_id": 1,
  "student_id": "student123"
}
```

### 함수 동기화
```
POST /backend/api/sync.php
{
  "action": "sync_function",
  "session_token": "abc123...",
  "function_expression": "y = 2x + 3",
  "graph_data": [...]
}
```

### 답안 제출
```
POST /backend/api/sync.php
{
  "action": "submit_answer",
  "session_token": "abc123...",
  "submitted_function": "y = 2x + 3"
}
```

## 🐛 문제 해결

### 데이터베이스 연결 오류
- `backend/api/config.php`에서 DB 설정 확인
- MySQL 서비스 실행 확인: `sudo service mysql status`

### 그래프가 표시되지 않음
- 브라우저 콘솔(F12) 확인
- Canvas 지원 브라우저 사용 (Chrome, Firefox, Safari)

### CORS 오류
- `backend/api/config.php`에서 CORS 헤더 설정 확인
- 프로덕션 환경에서는 특정 도메인만 허용하도록 변경

## 📊 데이터베이스 스키마

주요 테이블:
- `problems`: 문제 정보
- `student_sessions`: 학생 세션
- `function_changes`: 함수 변경 로그
- `student_answers`: 학생 답안
- `sync_status`: 실시간 동기화 상태

## 🤝 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 📄 라이선스

MIT License

## 👨‍💻 개발자

KAIST Touch Math Academy

## 📞 지원

문제가 있으시면 Issue를 등록해주세요.

---

**Function Live Sync** - 함수식이 변하면 그래프가 살아 움직입니다! 📊✨
