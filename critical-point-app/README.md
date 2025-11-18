# Critical Point Highlight - 극값 강조 학습 앱

수학 함수의 극값(Critical Points)을 시각적으로 학습할 수 있는 독립형 웹 애플리케이션입니다.

## 📱 주요 기능

- **스마트폰 시뮬레이터**: 우측 하단에 실제 스마트폰처럼 표시되는 앱 화면
- **극값 자동 탐지**: 수치 미분을 사용한 정확한 극값 계산
- **반짝이는 애니메이션**: 극값 지점이 시각적으로 강조되며 깜빡임
- **Moodle LMS 연동**: MySQL 데이터베이스를 통한 문제 관리 및 학습 기록
- **다양한 함수 유형**: 이차, 삼차, 사차, 삼각 함수 등 지원

## 🛠 기술 스택

- **Frontend**:
  - HTML5 + CSS3 (Gradient & Animation)
  - Vanilla JavaScript (ES6+)
  - Canvas API (그래프 렌더링)

- **Backend**:
  - PHP 7.1.9
  - MySQL 5.7
  - Moodle 3.7 호환

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- 웹 서버 (Apache 2.4+ 또는 Nginx)
- 모던 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)

## 🚀 설치 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd critical-point-app
```

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성 (Moodle 데이터베이스 사용 시 생략)
CREATE DATABASE moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 적용
mysql -u root -p moodle < database/schema.sql
```

### 3. API 설정

`api/config.php` 파일을 수정하여 데이터베이스 연결 정보를 설정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### 4. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName critical-point.local
    DocumentRoot /path/to/critical-point-app/public

    <Directory /path/to/critical-point-app/public>
        AllowOverride All
        Require all granted
    </Directory>

    # API 경로
    Alias /api /path/to/critical-point-app/api
    <Directory /path/to/critical-point-app/api>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name critical-point.local;
    root /path/to/critical-point-app/public;

    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /api {
        alias /path/to/critical-point-app/api;
        index index.php;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

### 5. 권한 설정

```bash
# 로그 디렉토리 생성 및 권한 설정
mkdir -p logs
chmod 755 logs
chown www-data:www-data logs  # 또는 적절한 웹 서버 사용자
```

## 📖 사용 방법

### 기본 사용

1. 브라우저에서 `http://critical-point.local` (또는 설정한 도메인) 접속
2. **"새 문제 불러오기"** 버튼을 클릭하여 문제 로드
3. 그래프에서 함수 곡선 확인
4. **"극값 표시"** 버튼을 클릭하여 극값 찾기 및 애니메이션 표시
5. 우측 하단 스마트폰 화면에서 시각적으로 극값 확인

### URL 파라미터

학생 ID를 전달하여 학습 기록을 추적할 수 있습니다:

```
http://critical-point.local?student_id=12345
```

### API 엔드포인트

#### 문제 가져오기
```http
GET /api/getProblem.php?type=1
GET /api/getProblem.php?id=5
```

**응답 예시:**
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "name": "이차 함수",
    "equation": "f(x) = -x² + 4x + 1",
    "description": "기본적인 이차 함수입니다. 극댓값을 찾아보세요!",
    "function_type": 1,
    "difficulty": 1
  }
}
```

#### 결과 기록
```http
POST /api/logResult.php
Content-Type: application/json

{
  "problem_id": 1,
  "student_id": "12345",
  "critical_points": [
    {"x": 2, "y": 5, "type": "maximum"}
  ],
  "time_spent": 45
}
```

## 🏗 프로젝트 구조

```
critical-point-app/
├── public/
│   └── index.html              # 메인 HTML 파일
├── assets/
│   ├── css/
│   │   └── style.css           # 스타일시트 (스마트폰 UI 포함)
│   └── js/
│       ├── mathEngine.js       # 수학 계산 엔진 (극값 탐지)
│       ├── graphRenderer.js    # Canvas 그래프 렌더링
│       └── app.js              # 메인 애플리케이션 로직
├── api/
│   ├── config.php              # 데이터베이스 설정
│   ├── getProblem.php          # 문제 조회 API
│   └── logResult.php           # 결과 기록 API
├── database/
│   └── schema.sql              # MySQL 스키마 정의
└── README.md
```

## 🎨 커스터마이징

### 함수 추가

`assets/js/mathEngine.js`의 `getSampleFunction()` 메서드에서 새로운 함수를 추가할 수 있습니다:

```javascript
{
    id: 6,
    name: '새로운 함수',
    equation: 'f(x) = ...',
    func: (x) => /* JavaScript 함수 */,
    description: '설명'
}
```

### 스타일 변경

`assets/css/style.css`에서 색상, 크기, 애니메이션 등을 변경할 수 있습니다:

```css
/* 극댓값 색상 변경 */
.critical-point-max {
    border-left-color: #your-color;
}

/* 반짝임 속도 조절 */
@keyframes blink {
    /* 애니메이션 타이밍 수정 */
}
```

## 🔧 문제 해결

### 그래프가 표시되지 않는 경우

1. 브라우저 콘솔(F12)에서 JavaScript 오류 확인
2. Canvas 요소가 올바르게 로드되었는지 확인
3. `graphRenderer.initCanvas()` 호출 확인

### API 연결 오류

1. PHP 오류 로그 확인: `logs/error.log`
2. 데이터베이스 연결 정보 확인: `api/config.php`
3. CORS 설정 확인 (다른 도메인에서 접속 시)

### 극값이 정확하지 않은 경우

`mathEngine.js`의 `findCriticalPoints()` 메서드에서 파라미터 조정:

```javascript
// step 값을 줄여 더 정밀하게 탐색
this.mathEngine.findCriticalPoints(func, -5, 5, 0.01);
```

## 📊 데이터베이스 스키마

### 주요 테이블

- `mdl_critical_point_problems`: 문제 정보
- `mdl_critical_point_sessions`: 학습 세션
- `mdl_critical_point_attempts`: 시도 기록
- `mdl_critical_point_analytics`: 분석 데이터

### 쿼리 예시

```sql
-- 학생별 진행 상황 조회
SELECT * FROM vw_student_progress WHERE student_id = '12345';

-- 문제별 난이도 분석
SELECT * FROM vw_problem_difficulty ORDER BY success_rate ASC;
```

## 🔐 보안 고려사항

- SQL Injection 방지: PDO Prepared Statements 사용
- XSS 방지: 사용자 입력 이스케이프
- CORS 설정: 필요한 도메인만 허용
- 입력 검증: 모든 API 입력값 검증

## 📝 라이센스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 🤝 기여

버그 리포트 및 기능 제안은 이슈 트래커를 통해 제출해주세요.

## 📞 지원

문의사항이 있으시면 이슈를 생성하거나 프로젝트 관리자에게 연락하세요.
