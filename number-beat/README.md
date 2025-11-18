# Number Beat - 숫자 리듬 게임

## 개요

Number Beat는 숫자를 음악 리듬에 맞춰 배열하는 교육용 게임 애플리케이션입니다. Moodle LMS와 연동되어 문제를 받아오고, 학생들의 학습 진도를 추적합니다.

### 주요 기능

- 🎵 **리듬 기반 학습**: 음악 리듬 패턴에 맞춰 숫자를 배열
- 📱 **가상 스마트폰 UI**: 우측 하단에 표시되는 스마트폰 화면
- 🔗 **Moodle 연동**: LMS에서 문제 정보를 자동으로 가져옴
- 📊 **실시간 통계**: 학생의 학습 진도 및 성과 추적
- 🎯 **난이도 조절**: 쉬움/보통/어려움 세 단계

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Web Server**: Apache (권장)

## 프로젝트 구조

```
number-beat/
├── api/                      # Backend API
│   ├── game_api.php         # 게임 API 엔드포인트
│   └── moodle_integration.php # Moodle 연동 모듈
├── config/                   # 설정 파일
│   └── config.php           # 데이터베이스 및 앱 설정
├── database/                 # 데이터베이스
│   └── schema.sql           # 데이터베이스 스키마
├── public/                   # 공개 웹 파일
│   ├── index.html           # 메인 HTML
│   ├── css/
│   │   └── style.css        # 스타일시트
│   ├── js/
│   │   ├── config.js        # 프론트엔드 설정
│   │   ├── audio.js         # 오디오 관리
│   │   ├── rhythm.js        # 리듬 엔진
│   │   ├── game.js          # 게임 로직
│   │   └── app.js           # 앱 초기화
│   ├── audio/               # 오디오 파일
│   └── images/              # 이미지 파일
└── docs/                    # 문서
    ├── INSTALLATION.md      # 설치 가이드
    ├── API.md              # API 문서
    └── MOODLE_INTEGRATION.md # Moodle 연동 가이드
```

## 설치

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 웹 서버 (mod_rewrite 활성화)
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 스키마 실행
mysql -u root -p < database/schema.sql
```

### 3. 설정 파일 수정

`config/config.php` 파일을 편집하여 환경에 맞게 설정:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'number_beat');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle 설정
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');
```

### 4. 웹 서버 설정

#### Apache .htaccess (public 폴더)

```apache
RewriteEngine On
RewriteBase /

# API 요청을 api/ 폴더로 라우팅
RewriteRule ^api/(.*)$ ../api/$1 [L]

# 나머지는 index.html로
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.html [L]
```

### 5. 권한 설정

```bash
# 웹 서버가 읽을 수 있도록 권한 설정
chmod -R 755 number-beat/
chown -R www-data:www-data number-beat/
```

### 6. 웹 브라우저로 접속

```
http://localhost/number-beat/public/
```

## Moodle 연동

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**로 이동
3. "웹 서비스 활성화" 체크
4. 프로토콜: **REST** 활성화

### 2. 웹 서비스 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. 새 토큰 생성
3. 생성된 토큰을 `config.php`의 `MOODLE_TOKEN`에 입력

### 3. 문제 형식

Moodle 문제는 다음 커스텀 필드를 포함해야 합니다:

```json
{
  "number_sequence": "3,1,5,2,4",
  "rhythm_pattern": "quarter,quarter,quarter,quarter,quarter",
  "correct_order": "1,2,3,4,5"
}
```

### 4. 동기화 실행

```javascript
// API를 통해 Moodle과 동기화
fetch('/api/game_api.php/sync-moodle', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ course_id: 1 })
});
```

## 사용 방법

### 교사용

1. Moodle에서 Number Beat 문제 생성
2. 동기화 실행하여 문제 가져오기
3. 학생들에게 게임 URL 공유

### 학생용

1. 웹 브라우저로 게임 접속
2. 학생 ID 입력
3. 난이도 선택
4. "게임 시작" 클릭
5. 리듬 패턴을 보고 듣기
6. 리듬에 맞춰 숫자를 순서대로 선택
7. "제출" 버튼으로 답안 제출

## API 엔드포인트

### GET `/api/game_api.php/get-problem`

문제 가져오기

**Parameters:**
- `difficulty`: easy | medium | hard
- `student_id`: 학생 ID

**Response:**
```json
{
  "id": 1,
  "title": "순서대로 배열하기",
  "description": "1부터 5까지 숫자를 순서대로 배열하세요",
  "number_sequence": "3,1,5,2,4",
  "rhythm_pattern": "quarter,quarter,quarter,quarter,quarter",
  "time_limit": 60,
  "points": 100
}
```

### POST `/api/game_api.php/submit-answer`

답안 제출

**Body:**
```json
{
  "student_id": 1,
  "problem_id": 1,
  "submitted_order": "1,2,3,4,5",
  "rhythm_accuracy": 95.5,
  "time_spent": 45
}
```

**Response:**
```json
{
  "is_correct": true,
  "score": 150,
  "mistakes": 0,
  "rhythm_accuracy": 95.5,
  "correct_order": "1,2,3,4,5"
}
```

### GET `/api/game_api.php/get-progress`

학생 진도 조회

**Parameters:**
- `student_id`: 학생 ID

**Response:**
```json
{
  "total_problems_attempted": 10,
  "total_problems_correct": 8,
  "success_rate": 80,
  "total_score": 1200,
  "average_rhythm_accuracy": 92.3,
  "current_streak": 3,
  "best_streak": 5
}
```

## 리듬 패턴

### 지원 비트 타입

- **whole**: 2초 (온음표)
- **half**: 1초 (2분음표)
- **quarter**: 0.5초 (4분음표)
- **eighth**: 0.25초 (8분음표)

### 패턴 예시

```javascript
// 쉬운 패턴
"quarter,quarter,quarter,quarter"

// 중간 패턴
"half,quarter,quarter,half"

// 어려운 패턴
"quarter,eighth,eighth,half,quarter,eighth"
```

## 점수 계산

### 기본 점수

- 쉬움: 100점
- 보통: 150점
- 어려움: 200점

### 보너스

- **시간 보너스**: 제한 시간의 50% 이내 완료 시 1.5배
- **리듬 보너스**: 리듬 정확도 90% 이상 시 1.2배

### 최종 점수 공식

```
최종점수 = 기본점수 × 시간보너스 × 리듬보너스
```

## 개발

### 로컬 개발 환경

```bash
# PHP 내장 서버 실행 (테스트용)
cd number-beat/public
php -S localhost:8000
```

### 디버그 모드

`config/config.php`에서:

```php
define('DEBUG_MODE', true);
```

## 문제 해결

### 데이터베이스 연결 오류

- MySQL 서비스가 실행 중인지 확인
- `config.php`의 데이터베이스 설정 확인
- 사용자 권한 확인

### Moodle 연동 오류

- Moodle Web Services가 활성화되어 있는지 확인
- 토큰이 유효한지 확인
- CORS 설정 확인

### 오디오 재생 안됨

- 브라우저가 자동 재생을 차단하는지 확인
- 사용자 인터랙션 후 재생 시도
- 오디오 파일이 존재하는지 확인

## 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 기여

버그 리포트 및 기능 제안은 이슈 트래커를 통해 제출해주세요.

## 지원

문의사항: [support@example.com](mailto:support@example.com)
