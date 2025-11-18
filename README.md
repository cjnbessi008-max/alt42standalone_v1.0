# Graph Blend - LMS 연동 수학 학습 앱

Moodle LMS와 연동하여 수학 문제를 그래프로 시각화하는 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에 Graph Blend 기능을 통해 범위가 자연스럽게 이어지는 그래프를 표시합니다.

## 주요 기능

### 1. Graph Blend (그래프 블렌딩)
- 수학적 범위를 그래프로 자연스럽게 시각화
- 부등식, 범위, 함수의 정의역 등을 직관적으로 표현
- 부드러운 그라디언트 블렌딩 효과로 범위의 경계를 명확히 표시
- 열린/닫힌 구간을 시각적으로 구분 (원형 마커)

### 2. Moodle LMS 연동
- Moodle 3.7 Web Services API 연동
- 퀴즈 문제 자동 가져오기
- 학생 응답 데이터 동기화

### 3. 스마트폰 시뮬레이터
- 우측 하단에 실제 스마트폰 화면 모방
- 터치/스와이프 시뮬레이션
- 반응형 그래프 렌더링

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (Web Services 활성화 필요)
- **웹서버**: Apache 또는 Nginx
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 및 테이블 생성
source database/schema.sql
```

### 2. 설정 파일 수정

#### config/database.php
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'graph_blend_lms');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

#### config/moodle_config.php
```php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

### 3. Moodle Web Services 설정

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 웹 서비스 관리**로 이동
3. **웹 서비스 활성화** 체크
4. 새 서비스 생성:
   - 이름: `graph_blend_service`
   - 사용 가능한 함수 추가:
     - `core_course_get_contents`
     - `core_enrol_get_users_courses`
     - `mod_quiz_get_quiz_by_courses`
     - `mod_quiz_get_attempt_data`
5. 토큰 생성:
   - **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
   - 새 토큰 생성 후 `config/moodle_config.php`에 입력

### 4. 웹서버 설정

#### Apache (.htaccess)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1.php [L]
</IfModule>
```

#### Nginx
```nginx
location /api/ {
    rewrite ^/api/(.*)$ /api/$1.php last;
}

location ~ \.php$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_index index.php;
    include fastcgi_params;
}
```

### 5. 프로젝트 실행

```bash
# 개발 서버 실행 (PHP 내장 서버)
cd public
php -S localhost:8000

# 브라우저에서 접속
# http://localhost:8000
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/                 # 설정 파일
│   ├── database.php       # 데이터베이스 연결 설정
│   └── moodle_config.php  # Moodle API 설정
├── classes/               # PHP 클래스
│   └── MoodleConnector.php # Moodle 연동 클래스
├── public/                # 공개 웹 루트
│   ├── index.php         # 메인 페이지
│   ├── css/
│   │   └── style.css     # 스타일시트
│   └── js/
│       ├── graph-blend.js          # 그래프 렌더링
│       └── smartphone-simulator.js # 스마트폰 UI
├── api/                   # API 엔드포인트
│   ├── get_problems.php  # 문제 조회 API
│   └── sync_moodle.php   # Moodle 동기화 API
├── database/              # 데이터베이스
│   └── schema.sql        # 스키마 정의
└── README.md             # 이 파일
```

## API 사용법

### 문제 목록 조회
```
GET /api/get_problems.php

응답:
{
  "success": true,
  "problems": [
    {
      "id": 1,
      "title": "부등식 풀이",
      "description": "x > 3 을 수직선에 나타내시오",
      "problem_type": "inequality",
      "min_value": 3,
      "max_value": 10
    }
  ],
  "statistics": {
    "total": 3,
    "attempts": 15,
    "accuracy": 85.5
  }
}
```

### 특정 문제 조회
```
GET /api/get_problems.php?id=1

응답:
{
  "success": true,
  "problem": {
    "id": 1,
    "title": "부등식 풀이",
    "ranges": [
      {
        "range_start": 3,
        "range_end": 10,
        "range_type": "open",
        "color": "#2196F3",
        "opacity": 0.6
      }
    ]
  }
}
```

### Moodle 동기화
```
GET /api/sync_moodle.php?quiz_id=101

응답:
{
  "success": true,
  "message": "Sync completed",
  "synced": [1, 2, 3]
}
```

## Graph Blend 기능 설명

### 범위 타입 (Range Types)

1. **closed** (`[a, b]`): 양 끝점 포함
2. **open** (`(a, b)`): 양 끝점 불포함
3. **half_open_left** (`(a, b]`): 왼쪽 열림, 오른쪽 닫힘
4. **half_open_right** (`[a, b)`): 왼쪽 닫힘, 오른쪽 열림

### 블렌딩 효과

그래프의 범위는 그라디언트를 사용하여 자연스럽게 표현됩니다:
- 범위의 시작과 끝에서 투명도가 점진적으로 변화
- 중앙 부분은 최대 불투명도 유지
- 여러 범위가 겹칠 때 시각적으로 구분 가능

### 사용자 정의

그래프 설정 패널에서 다음을 조정할 수 있습니다:
- **범위 시작/끝**: 그래프의 X축 범위
- **그리드 간격**: 눈금 간격
- **Blend 효과 표시**: 블렌딩 효과 켜기/끄기

## 문제 해결

### 데이터베이스 연결 오류
```
Error: Database connection failed
```
- `config/database.php`의 DB 정보 확인
- MySQL 서비스 실행 여부 확인
- 사용자 권한 확인

### Moodle API 오류
```
Error: Moodle API error: HTTP 403
```
- Moodle Web Services 활성화 여부 확인
- 토큰 유효성 확인
- 필요한 함수가 서비스에 추가되었는지 확인

### 그래프가 표시되지 않음
- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas가 지원되는 브라우저인지 확인
- 문제 데이터에 `ranges` 정보가 있는지 확인

## 개발 정보

### 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

### 주요 클래스

#### GraphBlend (JavaScript)
그래프 렌더링 및 블렌딩 효과를 담당하는 메인 클래스

주요 메소드:
- `render()`: 그래프 렌더링
- `drawBlendedRange()`: 블렌딩 효과가 있는 범위 그리기
- `drawRangeMarker()`: 범위 끝점 마커 그리기

#### MoodleConnector (PHP)
Moodle Web Services API와 통신하는 클래스

주요 메소드:
- `request($function, $params)`: Moodle API 요청
- `getQuizQuestions($quizId)`: 퀴즈 문제 가져오기
- `getCourseContents($courseId)`: 코스 내용 가져오기

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해 주세요.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Environment**: MySQL 5.7, PHP 7.1.9, Moodle 3.7
