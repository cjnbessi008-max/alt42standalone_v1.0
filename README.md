# Curvy Log - Emotional Log Animation System

LMS(Moodle)와 연동하여 문제 정보 및 학습 로그를 감성적인 곡선 애니메이션으로 시각화하는 웹 애플리케이션입니다.

## 주요 기능

- **Moodle 3.7 연동**: PHP 7.1.9, MySQL 5.7 환경에서 Moodle LMS와 완벽 호환
- **가상 스마트폰 디스플레이**: 우측 하단에 실제 스마트폰 화면처럼 표시
- **감성적 곡선 애니메이션**: Catmull-Rom 스플라인 보간법을 사용한 부드러운 로그 그래프
- **실시간 데이터 시각화**: 퀴즈 시도 기록 및 사용자 활동 로그를 실시간으로 표현
- **인터랙티브 컨트롤**: 애니메이션 속도, 곡선 강도 조절 가능

## 기술 스택

### Backend
- **PHP**: 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

### Frontend
- **HTML5 Canvas**: 고성능 그래픽 렌더링
- **Vanilla JavaScript**: 의존성 없는 순수 자바스크립트
- **CSS3**: 반응형 디자인 및 애니메이션

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 설치 및 실행 중
- 웹 서버 (Apache 2.4+ 또는 Nginx)
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)

## 설치 방법

### 1. 파일 복사

```bash
# 웹 서버 루트 디렉토리로 이동
cd /var/www/html

# 프로젝트 파일 복사
cp -r alt42standalone_v1.0 curvy-log
cd curvy-log
```

### 2. 데이터베이스 설정

`config/database.php` 파일을 열어 Moodle 데이터베이스 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');           // 데이터베이스 호스트
define('DB_NAME', 'moodle');              // Moodle 데이터베이스 이름
define('DB_USER', 'moodle_user');         // 데이터베이스 사용자
define('DB_PASS', 'your_password_here');  // 데이터베이스 비밀번호
```

### 3. 권한 설정

```bash
# PHP가 파일을 읽을 수 있도록 권한 설정
chmod 755 -R .
chown www-data:www-data -R .
```

### 4. Apache 설정 (선택사항)

`.htaccess` 파일이 필요한 경우:

```apache
RewriteEngine On
RewriteBase /curvy-log/

# API 요청 처리
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ api/$1 [L]
```

## 사용 방법

### 1. 웹 브라우저에서 접속

```
http://your-domain.com/curvy-log/
```

### 2. 데이터 로드

1. **User ID** 입력 (Moodle 사용자 ID)
2. **Data Type** 선택:
   - **Quiz Attempts**: 퀴즈 시도 기록
   - **Activity Logs**: 사용자 활동 로그
3. **Load Data** 버튼 클릭

### 3. 애니메이션 재생

1. **Animation Speed** 슬라이더로 속도 조절 (0.5x ~ 5x)
2. **Curve Intensity** 슬라이더로 곡선 강도 조절 (0 ~ 1)
3. **Play Animation** 버튼 클릭

### 4. 우측 하단 가상 스마트폰 화면에서 시각화 확인

## API 엔드포인트

### 1. 활동 로그 조회

**GET** `/api/get_log_data.php`

**Parameters:**
- `user_id` (optional): 사용자 ID
- `course_id` (optional): 코스 ID
- `limit` (optional): 결과 개수 (기본값: 50)

**Response:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "x": 0,
      "y": 14.2345,
      "timestamp": 1634567890,
      "event": "\\core\\event\\course_viewed",
      "action": "viewed",
      "user": "홍길동",
      "course": "수학 101"
    }
  ],
  "metadata": {
    "userId": 2,
    "courseId": 5,
    "generatedAt": 1634567890
  }
}
```

### 2. 퀴즈 데이터 조회

**GET** `/api/get_quiz_data.php`

**Parameters:**
- `user_id` (optional): 사용자 ID
- `quiz_id` (optional): 퀴즈 ID

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "x": 0,
      "y": 4.234,
      "rawScore": 85.5,
      "attempt": 1,
      "quizName": "중간고사",
      "userName": "김철수",
      "timeTaken": 1800,
      "timestamp": 1634567890
    }
  ],
  "metadata": {
    "userId": 3,
    "quizId": 10,
    "generatedAt": 1634567890
  }
}
```

## 커스터마이징

### 색상 테마 변경

`js/app.js`의 `initializeApp()` 함수에서 색상을 변경할 수 있습니다:

```javascript
curvyLog = new CurvyLog('curvyCanvas', {
    colors: {
        primary: '#4ECDC4',    // 주 색상
        secondary: '#FF6B6B',  // 보조 색상
        accent: '#FFE66D'      // 강조 색상
    }
});
```

### 애니메이션 설정 변경

```javascript
curvyLog = new CurvyLog('curvyCanvas', {
    animationSpeed: 2,        // 기본 속도
    curveIntensity: 0.6,      // 곡선 강도
    lineWidth: 3,             // 선 두께
    pointRadius: 6,           // 점 크기
    padding: 40               // 여백
});
```

### 스마트폰 디스플레이 위치 변경

`css/style.css`에서 `.smartphone` 클래스 수정:

```css
.smartphone {
    position: fixed;
    bottom: 20px;   /* 하단 여백 */
    right: 20px;    /* 우측 여백 */
    /* 또는 left: 20px; 로 좌측에 배치 */
}
```

## 프로젝트 구조

```
curvy-log/
├── index.html              # 메인 HTML 파일
├── README.md               # 프로젝트 문서
├── config/
│   └── database.php        # 데이터베이스 설정
├── api/
│   ├── get_log_data.php    # 활동 로그 API
│   └── get_quiz_data.php   # 퀴즈 데이터 API
├── css/
│   └── style.css           # 스타일시트
└── js/
    ├── curvy-log.js        # 핵심 애니메이션 엔진
    └── app.js              # 애플리케이션 로직
```

## Moodle 데이터베이스 테이블 참조

### 활동 로그
- **테이블**: `mdl_logstore_standard_log`
- **주요 필드**: `eventname`, `component`, `action`, `timecreated`, `userid`, `courseid`

### 퀴즈 데이터
- **테이블**: `mdl_quiz_attempts`
- **관련 테이블**: `mdl_quiz`, `mdl_user`
- **주요 필드**: `sumgrades`, `timefinish`, `timestart`, `attempt`

## 트러블슈팅

### 데이터가 로드되지 않을 때

1. 데이터베이스 연결 정보 확인
2. PHP 에러 로그 확인: `tail -f /var/log/apache2/error.log`
3. 브라우저 콘솔에서 API 응답 확인
4. Moodle 데이터베이스에 실제 데이터가 있는지 확인

### 애니메이션이 작동하지 않을 때

1. 브라우저 콘솔에서 JavaScript 에러 확인
2. Canvas 지원 브라우저인지 확인
3. 데모 데이터로 테스트: 브라우저 콘솔에서 `loadDemoData()` 실행

### CORS 에러 발생 시

API PHP 파일 상단에 다음 헤더가 있는지 확인:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
```

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy

## 버전

1.0.0 (2024)

## 지원

문의사항이나 버그 리포트는 이슈 트래커에 등록해주세요.
