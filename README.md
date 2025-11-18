# ALT42 Standalone v1.0

Moodle 3.7 연동 넓이 학습 웹앱 - Area Chime 기능 포함

## 개요

우측 하단 가상 스마트폰 화면에 표시되는 넓이 학습 앱입니다. LMS(Moodle)와 연동하여 문제 정보를 받아서 동작하며, **넓이가 완성될 때 조용한 종소리 'Area Chime'**을 재생합니다.

## 주요 기능

- **Moodle 3.7 연동**: 문제 정보를 Moodle LMS에서 가져옴
- **넓이 그리기**: 캔버스에 도형을 그려서 넓이 계산
- **Area Chime**: 넓이 완성 시 조용한 종소리 재생
- **가상 스마트폰 UI**: 우측 하단에 고정된 스마트폰 화면
- **진행률 추적**: 실시간 완성도 표시
- **볼륨 조절**: 종소리 볼륨 사용자 설정 가능

## 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **HTML5**: 캔버스 API
- **CSS3**: 반응형 디자인
- **JavaScript**: Vanilla JS (ES6+)
- **Web Audio API**: 종소리 재생

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── api/
│   │   ├── MoodleAPI.php          # Moodle API 연동
│   │   ├── questions.php          # 문제 API
│   │   └── responses.php          # 답안/진행 상황 API
│   ├── config/
│   │   ├── config.php             # 앱 설정
│   │   └── database.php           # DB 연결
│   ├── database/
│   │   └── schema.sql             # 데이터베이스 스키마
│   ├── assets/
│   │   ├── audio/
│   │   │   ├── README.md          # 오디오 파일 가이드
│   │   │   ├── area-chime.mp3     # 종소리 파일 (추가 필요)
│   │   │   └── area-chime.ogg     # 대체 포맷 (선택)
│   │   ├── css/
│   │   │   └── smartphone.css     # 스마트폰 UI 스타일
│   │   └── js/
│   │       ├── area-chime.js      # 종소리 재생 모듈
│   │       ├── area-detector.js   # 넓이 완성 감지
│   │       └── app.js             # 메인 앱 로직
│   └── views/
│       └── index.html             # 메인 화면
├── public/
│   └── index.php                  # 공개 진입점
└── README.md
```

## 설치 및 설정

### 1. 데이터베이스 설정

```bash
mysql -u root -p < src/database/schema.sql
```

### 2. 설정 파일 수정

`src/config/config.php` 파일을 열고 다음 정보를 수정:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'alt42_db');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle 연동 설정
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_API_TOKEN', 'your_moodle_api_token');
```

### 3. Area Chime 사운드 파일 추가

**중요**: 조용한 종소리 오디오 파일을 준비해야 합니다.

#### 추천 다운로드 출처:
1. **Freesound.org**: https://freesound.org/ (검색어: "chime", "bell", "soft bell")
2. **Zapsplat**: https://www.zapsplat.com/
3. **Mixkit**: https://mixkit.co/free-sound-effects/

다운로드한 파일을 다음 위치에 저장:
```
src/assets/audio/area-chime.mp3
src/assets/audio/area-chime.ogg (선택사항)
```

**참고**: 오디오 파일이 없어도 Web Audio API를 사용한 fallback 기능으로 간단한 종소리가 재생됩니다.

### 4. 웹 서버 설정

Apache 또는 Nginx에서 `public/` 디렉토리를 document root로 설정:

#### Apache (.htaccess 예시)
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php [QSA,L]
</IfModule>
```

## 사용 방법

### 1. Moodle에서 앱 열기

Moodle 퀴즈에서 다음과 같이 링크:

```
https://your-domain.com/public/?question_id=1001&user_id=123
```

- `question_id`: Moodle 문제 ID
- `user_id`: Moodle 사용자 ID

### 2. 넓이 그리기

1. 캔버스에 마우스/터치로 도형 그리기
2. 진행률이 실시간으로 표시됨
3. 95% 이상 완성되면 자동으로 Area Chime 재생

### 3. 답안 제출

1. 도형을 완성한 후 "제출하기" 버튼 클릭
2. Moodle에 자동으로 성적 기록

## Area Chime 기능

### 특징
- **조용한 종소리**: 부드러운 사인파 기반 (C5 음, 523.25Hz)
- **페이드 아웃**: 1.5초 동안 자연스럽게 소리 감소
- **볼륨 조절**: 사용자가 슬라이더로 조절 가능
- **다중 포맷 지원**: MP3, OGG, Web Audio API fallback

### 재생 조건
- 넓이 완성도 95% 이상 달성 시
- 도형이 닫힌 상태일 때
- 종소리 활성화 상태일 때

### 테스트 방법

1. 앱 실행 후 하단의 종소리 상태 뱃지 클릭
2. 즉시 Area Chime 재생
3. 볼륨 슬라이더로 소리 크기 조절

## API 엔드포인트

### 문제 API (`/src/api/questions.php`)

#### 문제 가져오기
```
GET /src/api/questions.php?action=get&id=1
```

#### 문제 목록
```
GET /src/api/questions.php?action=list&course_id=10
```

#### Moodle 동기화
```
POST /src/api/questions.php?action=sync
{
  "moodle_question_id": 1001,
  "course_id": 10
}
```

### 답안 API (`/src/api/responses.php`)

#### 답안 제출
```
POST /src/api/responses.php?action=submit
{
  "user_id": 123,
  "question_id": 1,
  "answer": 15.0
}
```

#### 진행 상황 업데이트
```
POST /src/api/responses.php?action=update_progress
{
  "response_id": 1,
  "shape_type": "rectangle",
  "progress_data": {...},
  "completion_percentage": 75
}
```

#### 넓이 완성
```
POST /src/api/responses.php?action=complete_area
{
  "response_id": 1
}
```

## 데이터베이스 스키마

### questions
- Moodle 문제 정보 저장
- 도형 타입, 넓이 데이터 포함

### student_responses
- 학생 답안 기록
- 정답 여부, 넓이 완성 여부 추적

### area_progress
- 실시간 그리기 진행 상황
- 좌표, 완성도 저장

### app_settings
- 앱 설정 (종소리 활성화, 볼륨 등)

## 트러블슈팅

### 종소리가 재생되지 않을 때
1. 브라우저 콘솔에서 에러 확인
2. `src/assets/audio/` 디렉토리에 오디오 파일 존재 확인
3. 볼륨이 0이 아닌지 확인
4. 브라우저에서 자동 재생 차단 해제

### Moodle 연동이 안 될 때
1. Moodle API 토큰 확인
2. Moodle에서 Web Services 활성화 확인
3. CORS 설정 확인

### 캔버스가 작동하지 않을 때
1. 브라우저가 HTML5 Canvas 지원하는지 확인
2. JavaScript 콘솔에서 에러 확인

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy - ALT42 Project

## 버전

- **v1.0.0** (2025-11-18): Area Chime 기능 추가
  - 넓이 완성 시 조용한 종소리 재생
  - 가상 스마트폰 UI 구현
  - Moodle 3.7 연동
  - 실시간 진행률 추적
