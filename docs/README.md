# Stat Story Mode - 통계 스토리 학습 앱

중고등학교 통계 교과를 스토리 기반으로 학습하는 웹 애플리케이션입니다.

## 📱 개요

**Stat Story Mode**는 Moodle LMS와 연동하여 통계 개념을 스토리텔링 방식으로 학습할 수 있는 교육용 웹앱입니다. 우측 하단에 가상 스마트폰 화면으로 표시되며, 학생들이 캐릭터와의 대화를 통해 자연스럽게 통계 개념을 익힐 수 있습니다.

## ✨ 주요 기능

### 1. 스토리 기반 학습
- 캐릭터와의 대화를 통한 개념 학습
- 실생활 예시를 활용한 문제 해결
- 단계별 진행으로 체계적인 학습

### 2. 다양한 통계 개념
- **기술통계**: 평균, 중앙값, 최빈값, 범위, 분산, 표준편차
- **확률**: 기본 확률 개념
- **상관분석**: 상관관계, 상관계수

### 3. 대화형 인터페이스
- 스마트폰 UI로 친숙한 사용자 경험
- 즉각적인 피드백 제공
- 힌트 시스템

### 4. Moodle 연동
- 학생 정보 동기화
- 진도 및 성적 관리
- 자동 성적 기록

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **LMS**: Moodle 3.7
- **Libraries**:
  - Axios (HTTP 클라이언트)
  - MathJax (수식 렌더링)

## 📋 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항)

## 🚀 설치 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE stat_story_mode CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 생성
mysql -u root -p stat_story_mode < database/schema.sql

# 초기 데이터 입력
mysql -u root -p stat_story_mode < database/seed.sql
```

### 3. 환경 설정

`config/database.php`와 `config/moodle.php` 파일에서 데이터베이스 및 Moodle 연동 정보를 설정하세요.

```php
// config/database.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'stat_story_mode');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// config/moodle.php (Moodle 사용시)
define('MOODLE_URL', 'http://your-moodle-url');
define('MOODLE_TOKEN', 'your_webservice_token');
```

환경변수로 설정할 수도 있습니다:

```bash
export DB_HOST=localhost
export DB_NAME=stat_story_mode
export DB_USER=username
export DB_PASS=password
export MOODLE_URL=http://moodle.example.com
export MOODLE_TOKEN=your_token
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName stat-story.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        AllowOverride All
        Require all granted
    </Directory>

    # API 라우팅
    Alias /api /path/to/alt42standalone_v1.0/api
    <Directory /path/to/alt42standalone_v1.0/api>
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name stat-story.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location /api {
        alias /path/to/alt42standalone_v1.0/api;
        try_files $uri $uri/ /api/story_controller.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 5. 접속

웹 브라우저에서 `http://localhost` 또는 설정한 도메인으로 접속합니다.

## 📖 사용 방법

### 학생 사용자

1. **학생 ID 설정**: 첫 접속시 학생 ID를 입력합니다.
2. **스토리 선택**: 학습하고 싶은 통계 개념의 스토리를 선택합니다.
3. **스토리 진행**:
   - 캐릭터의 대화를 읽고 개념을 이해합니다.
   - 문제를 풀고 즉각적인 피드백을 받습니다.
   - 필요시 힌트를 사용합니다.
4. **진도 확인**: 내 진행 상황에서 학습 현황을 확인합니다.

### 교사/관리자

Moodle 관리자 페이지에서:
- 학생 진도 현황 확인
- 성적 조회
- 스토리 시나리오 관리 (데이터베이스 직접 수정)

## 📊 데이터베이스 구조

### 주요 테이블

- `story_scenarios`: 스토리 시나리오 정보
- `story_steps`: 스토리 진행 단계
- `student_progress`: 학생별 진행 상황
- `student_answers`: 학생 답안 기록
- `stat_concepts`: 통계 개념 마스터 데이터
- `characters`: 스토리 캐릭터
- `moodle_integration`: Moodle 연동 설정

자세한 스키마는 `database/schema.sql` 파일을 참조하세요.

## 🔧 API 엔드포인트

### 스토리 관련

- `GET /api/story_controller.php/scenarios` - 스토리 목록
- `GET /api/story_controller.php/scenario?id={id}` - 스토리 상세
- `GET /api/story_controller.php/steps?scenario_id={id}` - 단계 목록
- `POST /api/story_controller.php/start` - 스토리 시작
- `POST /api/story_controller.php/submit_answer` - 답안 제출
- `POST /api/story_controller.php/next_step` - 다음 단계
- `POST /api/story_controller.php/use_hint` - 힌트 사용

### 진행 상황

- `GET /api/story_controller.php/progress?student_id={id}` - 진행 상황 조회

### 통계 개념

- `GET /api/story_controller.php/concepts` - 개념 목록

## 🎨 커스터마이징

### 새로운 스토리 시나리오 추가

```sql
-- 시나리오 추가
INSERT INTO story_scenarios (title, description, stat_concept, difficulty_level, target_grade)
VALUES ('새 스토리', '설명', 'mean', 'basic', '중1');

-- 단계 추가
INSERT INTO story_steps (scenario_id, step_order, step_type, character_name, dialogue_text)
VALUES (1, 1, 'dialogue', '김선생님', '안녕하세요!');
```

### UI 스타일 변경

`public/css/smartphone.css` 파일에서 색상, 폰트, 레이아웃을 수정할 수 있습니다.

```css
/* 메인 색상 변경 */
.smartphone-header {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

## 🔌 Moodle 연동 설정

### 1. Moodle Web Service 활성화

1. 사이트 관리 > 플러그인 > 웹 서비스 > 개요
2. "웹 서비스 활성화" 체크
3. 프로토콜 활성화: REST 프로토콜 활성화

### 2. 웹 서비스 사용자 생성

1. 사용자 생성 (예: statservice)
2. 역할 할당: 웹 서비스 역할

### 3. 토큰 생성

1. 사이트 관리 > 서버 > 웹 서비스 > 토큰 관리
2. 토큰 추가
3. 생성된 토큰을 `config/moodle.php`에 설정

### 4. 필요한 함수 허용

- `core_user_get_users_by_field`
- `core_course_get_courses`
- `core_enrol_get_enrolled_users`
- `core_grades_update_grades`

## 🐛 문제 해결

### 데이터베이스 연결 오류

```bash
# PHP 에러 로그 확인
tail -f /var/log/php/error.log

# MySQL 로그 확인
tail -f /var/log/mysql/error.log
```

### Moodle API 연결 오류

- Moodle 웹 서비스가 활성화되어 있는지 확인
- 토큰이 유효한지 확인
- Moodle URL이 올바른지 확인

### 스마트폰 화면이 표시되지 않음

- 브라우저 콘솔(F12)에서 JavaScript 오류 확인
- CSS 파일이 제대로 로드되었는지 확인

## 📝 라이센스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 👥 기여

버그 리포트, 기능 제안, 풀 리퀘스트를 환영합니다!

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Stat Story Mode** - 통계를 즐겁게 배우는 새로운 방법! 📊✨
