# 🎯 Shift Trail - 벡터 평행이동 학습 시스템

Moodle LMS와 연동되는 벡터 평행이동 시각화 학습 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에서 벡터를 드래그하여 평행이동시키고, 이동 경로가 Trail(선)로 표시됩니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [Moodle 연동 설정](#moodle-연동-설정)
- [사용 방법](#사용-방법)
- [프로젝트 구조](#프로젝트-구조)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)

## ✨ 주요 기능

### 🎨 Shift Trail 시각화
- **벡터 평행이동**: 마우스 드래그로 벡터를 이동
- **Trail 기록**: 이동 경로를 실시간으로 선으로 표시
- **이동 데이터 계산**: 이동 거리, 각도, ΔX, ΔY 자동 계산
- **애니메이션 재생**: Trail 이동 경로를 애니메이션으로 복습

### 📱 가상 스마트폰 디스플레이
- **우측 하단 배치**: 데스크톱 화면 우측 하단에 가상 스마트폰 표시
- **iPhone 스타일**: 노치, 홈 인디케이터 등 실제 디바이스 UI
- **반응형 디자인**: 다양한 화면 크기에 대응

### 🔗 Moodle LMS 연동
- **문제 동기화**: Moodle의 퀴즈/문제 정보 자동 수신
- **사용자 인증**: Moodle 사용자 정보 연동
- **성적 전송**: 학습 결과를 Moodle 성적표에 자동 제출
- **LTI 지원**: LTI 1.1 프로토콜로 원활한 통합

### 📊 학습 분석
- **진행 상황 추적**: 학생의 시도 횟수, 정답률 기록
- **통계 대시보드**: 평균 거리, 평균 점수 등 시각화
- **상세 피드백**: 각 시도에 대한 즉각적인 피드백 제공

## 🛠 기술 스택

### Backend
- **PHP 7.1.9**: 서버 사이드 로직
- **MySQL 5.7**: 데이터베이스
- **RESTful API**: JSON 기반 API 통신

### Frontend
- **HTML5 Canvas**: 벡터 그래픽 렌더링
- **Vanilla JavaScript**: 프론트엔드 로직 (프레임워크 없음)
- **CSS3**: 반응형 스타일링

### Integration
- **Moodle 3.7**: LMS 연동
- **LTI 1.1**: 표준 학습 도구 통합
- **Moodle Web Services**: API 통신

## 💻 시스템 요구사항

### 서버
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+
- **PHP 확장**: PDO, PDO_MySQL, cURL, JSON, mbstring

### 클라이언트
- **브라우저**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+
- **JavaScript**: ES6 지원 필수
- **해상도**: 1280x720 이상 권장

### Moodle
- **버전**: Moodle 3.7.x
- **Web Services**: 활성화 필요
- **LTI**: External Tool 기능 활성화

## 📦 설치 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE shift_trail_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'shift_trail'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON shift_trail_db.* TO 'shift_trail'@'localhost';
FLUSH PRIVILEGES;

# 스키마 적용
USE shift_trail_db;
SOURCE database/schema.sql;
```

### 3. 환경 설정

```bash
# 환경 변수 파일 복사
cp .env.example .env

# .env 파일 편집
nano .env
```

**.env 파일 설정 예시:**

```env
# Database
DB_HOST=localhost
DB_NAME=shift_trail_db
DB_USER=shift_trail
DB_PASS=your_password

# Moodle
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token_here
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName shift-trail.local
    DocumentRoot /path/to/alt42standalone_v1.0/frontend

    <Directory /path/to/alt42standalone_v1.0/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Backend API 설정
    Alias /backend /path/to/alt42standalone_v1.0/backend/public
    <Directory /path/to/alt42standalone_v1.0/backend/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/shift_trail_error.log
    CustomLog ${APACHE_LOG_DIR}/shift_trail_access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name shift-trail.local;

    root /path/to/alt42standalone_v1.0/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /backend {
        alias /path/to/alt42standalone_v1.0/backend/public;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    location ~ /\.ht {
        deny all;
    }
}
```

### 5. 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs
chmod 755 logs

# 업로드 디렉토리 (필요시)
mkdir -p uploads
chmod 755 uploads

# 웹 서버 사용자에게 소유권 부여
chown -R www-data:www-data logs uploads
```

### 6. 웹 서버 재시작

```bash
# Apache
sudo systemctl restart apache2

# Nginx
sudo systemctl restart nginx
sudo systemctl restart php7.1-fpm
```

### 7. 설치 확인

브라우저에서 `http://shift-trail.local` 접속하여 정상 작동 확인

## 🔗 Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 → 고급 기능**
   - ✅ "웹 서비스 활성화" 체크
   - 저장

### 2. External Service 생성

1. **사이트 관리 → 서버 → 웹 서비스 → External Services**
2. "새 서비스 추가" 클릭
3. 설정:
   - **이름**: Shift Trail Service
   - **짧은 이름**: shift_trail
   - ✅ 활성화
4. "함수 추가" 클릭하여 다음 함수들을 추가:
   - `core_user_get_users_by_field`
   - `core_course_get_courses`
   - `core_grades_update_grades`

### 3. Web Service 사용자 및 토큰 생성

1. **사이트 관리 → 사용자 → 권한 → 역할 정의**
   - "새 역할" 생성: "Web Service User"
   - 필요한 권한 부여

2. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
   - "토큰 생성" 클릭
   - 사용자 선택
   - 서비스: "Shift Trail Service"
   - 토큰 복사하여 `.env` 파일의 `MOODLE_TOKEN`에 설정

### 4. LTI External Tool 설정

1. Moodle 코스로 이동
2. **편집 모드 켜기**
3. "활동 또는 리소스 추가" → **External Tool** 선택
4. 설정:
   - **활동 이름**: Shift Trail - 벡터 평행이동
   - **Tool URL**: `http://shift-trail.local/lti/launch.php`
   - **Consumer Key**: `shift_trail`
   - **Shared Secret**: (설정한 비밀키)
5. 저장

### 5. LTI 런치 핸들러 생성

`backend/public/lti/launch.php` 파일을 생성하여 LTI 요청을 처리합니다.

```php
<?php
require_once __DIR__ . '/../src/services/MoodleService.php';

$moodleService = new MoodleService();
$ltiParams = $_POST;

$launchResult = $moodleService->handleLtiLaunch($ltiParams);

if ($launchResult['success']) {
    // 사용자 세션 설정
    session_start();
    $_SESSION['user_id'] = $launchResult['user_id'];
    $_SESSION['course_id'] = $launchResult['course_id'];
    $_SESSION['problem_id'] = $launchResult['problem_id'];

    // Shift Trail 앱으로 리다이렉트
    $redirectUrl = '/index.html?' . http_build_query([
        'student_id' => $launchResult['user_id'],
        'problem_id' => $launchResult['problem_id']
    ]);

    header("Location: $redirectUrl");
    exit;
} else {
    http_response_code(400);
    echo "LTI Launch Failed: " . $launchResult['error'];
}
```

## 📖 사용 방법

### 학생 사용 방법

1. **Moodle 코스 접속**
   - Moodle에서 "Shift Trail" 활동 클릭

2. **문제 확인**
   - 좌측 패널에서 문제 정보 확인
   - 학습 목표 및 사용 방법 읽기

3. **벡터 이동**
   - 우측 하단 스마트폰 화면의 벡터를 클릭
   - 원하는 위치로 드래그하여 평행이동
   - 이동 경로가 Trail로 표시됨

4. **결과 확인**
   - 좌측 패널에서 이동 거리, 각도 등 확인
   - Trail 포인트 개수 확인

5. **제출**
   - "제출하기" 버튼 클릭
   - 피드백 확인
   - 성적이 자동으로 Moodle에 전송됨

### 교사 사용 방법

1. **문제 생성**
   - Moodle 퀴즈에서 새 문제 생성
   - 문제 유형: External Tool
   - Shift Trail 도구 선택

2. **학생 진행 상황 모니터링**
   - Moodle 성적표에서 학생 성적 확인
   - 상세 로그는 데이터베이스에서 조회 가능

3. **통계 확인**
   - `trails` 테이블: 각 학생의 Trail 데이터
   - `submissions` 테이블: 제출 내역
   - `trail_interactions` 테이블: 상세 상호작용 로그

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # PHP 백엔드
│   ├── config/                # 설정 파일
│   │   ├── database.php       # DB 연결
│   │   └── constants.php      # 상수 정의
│   ├── src/
│   │   ├── api/               # API 엔드포인트
│   │   │   └── trails.php     # Trail API
│   │   ├── models/            # 데이터 모델
│   │   ├── services/          # 비즈니스 로직
│   │   │   ├── TrailService.php       # Trail 처리
│   │   │   └── MoodleService.php      # Moodle 연동
│   │   └── utils/             # 유틸리티
│   │       └── ResponseHelper.php     # API 응답
│   └── public/                # 공개 디렉토리
│       └── index.php          # 진입점
│
├── frontend/                   # 프론트엔드
│   ├── index.html             # 메인 HTML
│   ├── css/
│   │   └── main.css           # 메인 스타일
│   └── js/
│       ├── app.js             # 메인 앱
│       ├── shift-trail.js     # Shift Trail 모듈 (핵심!)
│       ├── smartphone-display.js      # 스마트폰 UI
│       └── api-client.js      # API 클라이언트
│
├── database/                   # 데이터베이스
│   ├── schema.sql             # DB 스키마
│   ├── migrations/            # 마이그레이션
│   └── fixtures/              # 테스트 데이터
│
├── moodle-plugin/             # Moodle 플러그인 (선택)
│   ├── classes/
│   └── templates/
│
├── docs/                      # 문서
│   ├── API.md                # API 문서
│   ├── ARCHITECTURE.md       # 아키텍처
│   └── SHIFT_TRAIL_FEATURE.md # Shift Trail 기능 명세
│
├── .env.example               # 환경 변수 예시
└── README.md                  # 이 파일
```

## 📚 API 문서

### Trail API

#### POST /api/trails
Trail 생성

**Request:**
```json
{
  "problem_id": 1,
  "student_id": 123,
  "session_id": "session_abc123",
  "vector_start_x": 100.00,
  "vector_start_y": 100.00,
  "vector_end_x": 200.00,
  "vector_end_y": 200.00,
  "trail_points": [
    {"x": 100, "y": 100, "timestamp": 0},
    {"x": 150, "y": 150, "timestamp": 500},
    {"x": 200, "y": 200, "timestamp": 1000}
  ],
  "trail_color": "#3498db",
  "trail_width": 3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trail_id": 456,
    "translation": {
      "dx": 100,
      "dy": 100,
      "distance": 141.42,
      "angle": 45.00
    }
  }
}
```

#### GET /api/trails/:id
Trail 조회

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "problem_id": 1,
    "student_id": 123,
    "vector_start_x": 100.00,
    "vector_start_y": 100.00,
    "vector_end_x": 200.00,
    "vector_end_y": 200.00,
    "trail_points": [...],
    "translation_distance": 141.42,
    "translation_angle": 45.00,
    "is_correct": true,
    "score": 10.00
  }
}
```

#### POST /api/trails/:id/submit
Trail 제출

**Request:**
```json
{
  "is_correct": true,
  "score": 10.0,
  "feedback": "정답입니다!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Trail submitted successfully"
  }
}
```

더 많은 API 문서는 `docs/API.md` 참조

## 🐛 문제 해결

### 데이터베이스 연결 오류

**증상:** "Database connection failed"

**해결 방법:**
1. `.env` 파일의 DB 설정 확인
2. MySQL 서비스 실행 확인: `sudo systemctl status mysql`
3. DB 사용자 권한 확인
4. PHP PDO 확장 설치 확인: `php -m | grep pdo`

### Moodle 연동 오류

**증상:** "Moodle API request failed"

**해결 방법:**
1. Moodle Web Services 활성화 확인
2. 토큰 유효성 확인
3. 방화벽 설정 확인
4. CORS 설정 확인

### Canvas 렌더링 문제

**증상:** 벡터가 표시되지 않음

**해결 방법:**
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. Canvas 크기가 0이 아닌지 확인
3. 브라우저가 HTML5 Canvas를 지원하는지 확인
4. 개발자 도구에서 Canvas 요소 검사

### 스마트폰 디스플레이가 보이지 않음

**증상:** 우측 하단에 스마트폰 화면이 표시되지 않음

**해결 방법:**
1. 화면 해상도가 1280x720 이상인지 확인
2. 모바일 기기에서는 숨김 처리됨 (의도된 동작)
3. CSS `z-index` 충돌 확인
4. JavaScript 콘솔에서 초기화 오류 확인

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

**Powered by:**
- Moodle 3.7
- PHP 7.1.9
- MySQL 5.7

**© 2024 Shift Trail - Vector Translation Learning System**
