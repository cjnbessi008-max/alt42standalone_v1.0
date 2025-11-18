# 🎢 Slope Sense - 기울기·경사 느낌 학습

**Slope Sense**는 Moodle LMS와 연동하여 수학 기울기(slope) 개념을 애니메이션으로 표현하는 교육용 웹 애플리케이션입니다. 가상 스마트폰 화면에서 인터랙티브한 애니메이션을 통해 학생들이 기울기를 직관적으로 이해할 수 있도록 돕습니다.

## ✨ 주요 기능

### 🎯 교육 기능
- **인터랙티브 기울기 시각화**: 두 점 사이의 기울기를 애니메이션으로 표현
- **4가지 애니메이션 타입**:
  - 🎱 공 굴리기 (Ball Roll)
  - ⛷️ 스키어 (Skier)
  - 🚗 자동차 (Car Drive)
  - 💧 물 흐름 (Water Flow)
- **Rise/Run 시각화**: 기울기의 구성 요소를 시각적으로 표시
- **난이도별 문제**: 5단계 난이도 시스템
- **힌트 시스템**: 학습을 돕는 단계별 힌트 제공

### 📱 UI/UX
- **가상 스마트폰 인터페이스**: 우측 하단에 배치된 모바일 앱 스타일 UI
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **실시간 통계**: 정답률, 시도 횟수 등 학습 진행 상황 추적
- **진행 바**: 학습 진행도를 시각적으로 표시

### 🔗 Moodle LMS 연동
- **완벽한 Moodle 3.7 통합**
- **자동 성적 동기화**: Moodle 성적표에 자동 기록
- **세션 관리**: 안전한 사용자 세션 추적
- **활동 추적**: 학습 시간, 시도 횟수, 힌트 사용 등 상세 기록

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5 Canvas API**: 애니메이션 렌더링
- **Vanilla JavaScript (ES6)**: 프론트엔드 로직
- **CSS3**: 스마트폰 UI 스타일링

### 아키텍처
- **MVC 패턴**: 깔끔한 코드 구조
- **RESTful API**: 프론트엔드-백엔드 통신
- **PDO**: 안전한 데이터베이스 접근

## 📁 프로젝트 구조

```
slope-sense/
├── api/
│   ├── endpoints.php           # REST API 엔드포인트
│   └── moodle-integration.php  # Moodle 연동 로직
├── assets/
│   ├── css/
│   │   └── smartphone.css      # 스마트폰 UI 스타일
│   └── js/
│       ├── slope-animation.js  # 애니메이션 엔진
│       └── app.js              # 메인 애플리케이션
├── config/
│   ├── config.php              # 애플리케이션 설정
│   └── database.php            # 데이터베이스 연결
├── moodle/
│   ├── version.php             # Moodle 플러그인 버전
│   ├── lib.php                 # Moodle 라이브러리 함수
│   └── view.php                # Moodle 뷰 페이지
├── sql/
│   └── schema.sql              # 데이터베이스 스키마
└── index.html                  # 메인 애플리케이션 페이지
```

## 📦 설치 방법

### 1. 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7
- Apache 또는 Nginx 웹 서버

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE slope_sense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'slope_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON slope_sense.* TO 'slope_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
mysql -u slope_user -p slope_sense < sql/schema.sql
```

### 3. 애플리케이션 설정

`config/config.php` 파일을 수정하여 데이터베이스 및 Moodle 연동 설정:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'slope_sense');
define('DB_USER', 'slope_user');
define('DB_PASS', 'your_password');

// Moodle 설정
define('MOODLE_DIR', '/path/to/your/moodle');
define('MOODLE_URL', 'https://your-moodle-site.com');
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName slope-sense.yourdomain.com
    DocumentRoot /path/to/slope-sense

    <Directory /path/to/slope-sense>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/slope-sense-error.log
    CustomLog ${APACHE_LOG_DIR}/slope-sense-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name slope-sense.yourdomain.com;
    root /path/to/slope-sense;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 5. Moodle 플러그인 설치 (선택사항)

```bash
# Moodle의 mod 디렉토리로 복사
cp -r moodle/ /path/to/moodle/mod/slopesense/

# Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications
```

## 🚀 사용 방법

### 독립 실행형 모드

브라우저에서 직접 접근:

```
http://your-domain/slope-sense/index.html?user_id=1&course_id=1&activity_id=1
```

### Moodle 통합 모드

1. Moodle 코스에 "Slope Sense" 활동 추가
2. 활동 설정:
   - 이름: "기울기 학습"
   - 설명: 활동 설명 입력
   - 난이도: 원하는 난이도 선택
3. 학생들이 활동을 클릭하면 자동으로 앱 실행

## 🎮 조작 방법

### 기본 조작

1. **문제 확인**: 화면 상단의 문제를 읽습니다
2. **애니메이션 관찰**: Canvas에서 기울기 애니메이션을 확인합니다
3. **기울기 입력**: 계산한 기울기를 입력 필드에 입력합니다
4. **제출**: "제출" 버튼을 클릭하여 답안을 제출합니다

### 애니메이션 컨트롤

- **재생/일시정지**: 애니메이션을 시작하거나 멈춥니다
- **속도 조절**: 0.5x ~ 3.0x 속도 조절 가능
- **애니메이션 타입**: 4가지 타입 중 선택
- **다시보기**: 애니메이션을 처음부터 다시 재생

### 학습 도구

- **힌트**: 막힐 때 힌트 버튼 클릭
- **통계**: 상단에서 실시간 정답률 확인
- **진행도**: 하단 진행 바로 학습 진행 상황 확인

## 🔧 API 엔드포인트

### GET /api/endpoints.php?action=init

세션 초기화 및 문제 목록 가져오기

**Parameters:**
- `course_id`: Moodle 코스 ID
- `activity_id`: Moodle 활동 ID
- `user_id`: 사용자 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "session_id": 123,
      "token": "abc..."
    },
    "problems": [...]
  }
}
```

### POST /api/endpoints.php

답안 제출

**Body:**
```json
{
  "action": "submit_answer",
  "session_id": 123,
  "problem_id": 1,
  "user_id": 1,
  "answer": 0.5,
  "time_spent": 30,
  "hints_used": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "correct_answer": 0.5
  }
}
```

### GET /api/endpoints.php?action=get_progress

사용자 진행 상황 조회

**Parameters:**
- `user_id`: 사용자 ID
- `course_id`: 코스 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "total_attempts": 10,
    "correct_attempts": 8,
    "avg_time": 45.2,
    "avg_hints": 0.5
  }
}
```

## 🎨 커스터마이징

### 새로운 애니메이션 타입 추가

`assets/js/slope-animation.js`에서 새로운 draw 메서드 추가:

```javascript
drawCustomAnimation(x, y, t) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // 여기에 커스텀 애니메이션 코드 작성

    this.ctx.restore();
}
```

### 문제 추가

`sql/schema.sql`에 INSERT 문 추가하거나 Moodle 관리 인터페이스 사용

### UI 테마 변경

`assets/css/smartphone.css`에서 색상 및 스타일 수정:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --success-color: #d4edda;
    --error-color: #f8d7da;
}
```

## 🔒 보안 고려사항

- **SQL Injection 방지**: PDO prepared statements 사용
- **XSS 방지**: 모든 사용자 입력 sanitization
- **CSRF 보호**: 세션 토큰 검증
- **세션 관리**: 안전한 세션 타임아웃 (기본 1시간)
- **데이터베이스 접근**: 최소 권한 원칙

## 📊 데이터베이스 스키마

### slope_problems
문제 정보 저장

### slope_sessions
사용자 세션 관리

### slope_user_attempts
사용자 시도 기록 및 성적 추적

자세한 스키마는 `sql/schema.sql` 참조

## 🐛 문제 해결

### 데이터베이스 연결 실패

```bash
# PHP 오류 로그 확인
tail -f logs/error.log

# MySQL 연결 테스트
php -r "new PDO('mysql:host=localhost;dbname=slope_sense', 'slope_user', 'password');"
```

### Moodle 통합 문제

- `config/config.php`에서 `MOODLE_DIR` 경로 확인
- Moodle 플러그인이 올바르게 설치되었는지 확인
- Moodle의 `config.php` 파일이 올바른지 확인

### 애니메이션 표시 안 됨

- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas API를 지원하는 최신 브라우저 사용
- `DEBUG_MODE`를 `true`로 설정하여 디버그 정보 확인

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 개발자

- **이름**: Slope Sense Team
- **버전**: 1.0.0
- **최종 업데이트**: 2024-01-18

## 🙏 감사의 말

- Moodle 커뮤니티
- HTML5 Canvas API
- 모든 기여자분들

## 📞 지원

문제가 발생하거나 질문이 있으시면:
- Issue 트래커 사용
- 개발팀 이메일 문의
- Moodle 포럼에서 토론

---

**Made with ❤️ for better math education**
