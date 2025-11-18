# Angle Light - LMS 연동 벡터 학습 웹앱

두 벡터의 각도를 빛의 감도로 시각화하여 학습하는 인터랙티브 교육 웹 애플리케이션

## 주요 기능

- **벡터 각도 시각화**: 두 벡터 사이의 각도를 빛의 밝기로 표현
- **Moodle LMS 연동**: Moodle 3.7에서 문제 정보를 받아 동작
- **가상 스마트폰 UI**: 우측 하단에 모바일 화면 시뮬레이터
- **학습 진행 추적**: 학생별 문제 풀이 기록 및 진행상황 관리

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (Canvas API)
- **LMS**: Moodle 3.7 연동

## 설치 방법

### 1. 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
```

### 2. 설정 파일 수정

`config/database.php` 및 `config/moodle.php` 파일에서 환경에 맞게 수정:

```php
// config/database.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'angle_light');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// config/moodle.php
define('MOODLE_URL', 'https://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');
```

### 3. 웹 서버 설정

Apache 또는 Nginx에서 `public/` 디렉토리를 document root로 설정

### 4. 접속

브라우저에서 `http://localhost/` 접속

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/              # 설정 파일
│   ├── database.php     # DB 연결 설정
│   └── moodle.php       # Moodle API 설정
├── database/            # 데이터베이스 스키마
│   └── schema.sql       # MySQL 테이블 정의
├── public/              # 웹 루트 디렉토리
│   ├── index.php        # 메인 페이지
│   ├── css/
│   │   └── style.css    # 스타일시트
│   └── js/
│       ├── angle-light.js      # 벡터 각도 시각화
│       └── smartphone-ui.js    # 스마트폰 UI
├── src/                 # PHP 소스 코드
│   ├── api/
│   │   ├── problems.php        # 문제 데이터 API
│   │   └── progress.php        # 진행상황 API
│   ├── moodle/
│   │   └── connector.php       # Moodle 연동
│   └── utils/
│       └── db.php              # DB 유틸리티
└── README.md            # 이 파일
```

## API 엔드포인트

### GET /src/api/problems.php
문제 목록 가져오기

**Parameters:**
- `student_id` (optional): 학생 ID
- `moodle_course_id` (optional): Moodle 코스 ID

**Response:**
```json
{
  "success": true,
  "problems": [
    {
      "id": 1,
      "title": "벡터 각도 문제 1",
      "vector1": {"x": 1, "y": 0},
      "vector2": {"x": 0.707, "y": 0.707},
      "target_angle": 45
    }
  ]
}
```

### POST /src/api/progress.php
학습 진행상황 저장

**Parameters:**
- `student_id`: 학생 ID
- `problem_id`: 문제 ID
- `answer`: 학생 답안
- `is_correct`: 정답 여부

## Moodle 연동 설정

### Moodle 웹 서비스 활성화

1. Moodle 관리자 페이지 → **Site administration** → **Plugins** → **Web services**
2. **Enable web services** 체크
3. **External services** 추가 및 토큰 생성
4. 생성된 토큰을 `config/moodle.php`에 설정

### 필요한 Moodle 함수

- `core_course_get_courses`: 코스 목록 가져오기
- `mod_quiz_get_quizzes_by_courses`: 퀴즈 정보 가져오기
- `core_user_get_users`: 학생 정보 가져오기

## 사용 방법

1. Moodle에서 학생으로 로그인
2. 외부 도구로 Angle Light 앱 접속
3. 우측 하단 스마트폰 화면에서 문제 확인
4. 두 벡터를 조작하여 목표 각도 맞추기
5. 각도가 정확할수록 빛이 밝게 표시됨
6. 정답 제출 시 Moodle에 자동 기록

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy
