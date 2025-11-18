# Absolute Tunnel - 절댓값 부등식 학습 앱

Moodle LMS와 연동하여 절댓값 부등식을 3D 공간감 있게 시각화하는 교육용 웹 애플리케이션입니다.

## 📱 주요 기능

- **3D 터널 시각화**: Three.js를 활용한 절댓값 부등식의 공간적 표현
- **Moodle LMS 연동**: 문제 정보를 Moodle에서 가져와 학습 진행 상황 동기화
- **스마트폰 UI**: 우측 하단에 표시되는 가상 스마트폰 화면
- **실시간 피드백**: 학생 답안에 대한 즉각적인 피드백
- **학습 분석**: 시도 횟수, 소요 시간, 상호작용 횟수 추적

## 🛠 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Engine**: Three.js r128
- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7

## 📁 프로젝트 구조

```
absolute-tunnel/
├── api/                    # API 엔드포인트
│   ├── moodle_api.php     # Moodle Web Service 연동
│   └── problems.php       # 문제 관리 REST API
├── app/                   # 메인 앱
│   └── index.html        # 메인 HTML 파일
├── assets/               # 정적 자산
│   ├── css/
│   │   ├── smartphone.css  # 스마트폰 UI 스타일
│   │   └── style.css      # 전역 스타일
│   └── js/
│       ├── absolute-tunnel-engine.js  # 3D 시각화 엔진
│       └── app.js        # 앱 메인 로직
├── config/               # 설정 파일
│   ├── config.php       # 앱 설정
│   └── database.php     # DB 연결
├── database/            # 데이터베이스
│   └── schema.sql      # DB 스키마
└── logs/               # 로그 파일
```

## 🚀 설치 및 실행

### 1. 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 설치 및 Web Service 활성화

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 초기화
mysql -u root -p < database/schema.sql
```

### 3. 설정 파일 수정

`config/config.php` 파일을 편집하여 환경에 맞게 설정:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'absolute_tunnel');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName absolute-tunnel.local
    DocumentRoot /path/to/absolute-tunnel

    <Directory /path/to/absolute-tunnel>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name absolute-tunnel.local;
    root /path/to/absolute-tunnel;
    index app/index.html;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
    }
}
```

### 5. 로그 디렉토리 권한 설정

```bash
mkdir -p logs
chmod 755 logs
```

### 6. 브라우저에서 실행

```
http://localhost/absolute-tunnel/app/index.html
```

## 📖 Moodle 연동 설정

### 1. Moodle Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리** > **플러그인** > **웹 서비스** > **개요**
3. 다음 단계 수행:
   - 웹 서비스 활성화
   - 프로토콜 활성화 (REST)
   - 외부 서비스 생성
   - 기능 추가
   - 서비스 사용자 선택
   - 토큰 생성

### 2. 필요한 Moodle 기능 (Capabilities)

- `core_user_get_users_by_field`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_start_attempt`
- `mod_quiz_process_attempt`
- `core_grades_update_grades`

### 3. 토큰 설정

생성된 토큰을 `config/config.php`의 `MOODLE_TOKEN`에 입력합니다.

## 🎮 사용 방법

### 학생 사용자

1. 앱 접속 (세션 토큰 포함 URL)
2. 절댓값 부등식 문제 확인
3. 3D 터널로 시각화된 해의 범위 관찰
4. 답안 입력 및 제출
5. 즉각적인 피드백 받기
6. 다음 문제로 이동

### 교사 사용자

1. Moodle에서 퀴즈 생성
2. 절댓값 부등식 문제 추가
3. 학생들에게 Absolute Tunnel 링크 제공
4. 학습 진행 상황 모니터링

## 🔧 API 엔드포인트

### 문제 관리

#### GET `/api/problems.php`
문제 목록 조회

**파라미터:**
- `id`: 특정 문제 ID (선택)
- `difficulty`: 난이도 필터 (1-5)
- `type`: 문제 유형 (linear, quadratic, compound)
- `moodle_question_id`: Moodle 문제 ID

**응답:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "equation": "|x - 2| < 3",
      "solution_range": "{\"min\": -1, \"max\": 5}",
      "difficulty_level": 1
    }
  ]
}
```

#### POST `/api/problems.php`
문제 생성 및 진행 상황 기록

**액션:**
- `create_problem`: 새 문제 생성
- `record_progress`: 학생 진행 상황 기록
- `create_session`: 학습 세션 생성
- `validate_session`: 세션 검증

## 🎨 커스터마이징

### 테마 변경

`assets/css/smartphone.css` 파일에서 CSS 변수 수정:

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    /* ... */
}
```

### 3D 시각화 설정

`assets/js/absolute-tunnel-engine.js`에서 다음 설정 조정:

```javascript
// 터널 반지름
const radius = 2;

// 카메라 위치
this.camera.position.z = 5;

// 안개 효과
this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 100);
```

## 📊 데이터베이스 스키마

### problems
문제 정보 저장

- `id`: 문제 ID
- `moodle_question_id`: Moodle 문제 ID
- `problem_type`: 문제 유형
- `equation`: 절댓값 부등식 방정식
- `solution_range`: 해의 범위 (JSON)
- `difficulty_level`: 난이도 (1-5)

### student_progress
학생 진행 상황 추적

- `moodle_user_id`: 학생 ID
- `problem_id`: 문제 ID
- `attempt_count`: 시도 횟수
- `is_correct`: 정답 여부
- `time_spent_seconds`: 소요 시간
- `visualization_interactions`: 시각화 상호작용 횟수

### learning_sessions
학습 세션 관리

- `moodle_user_id`: 사용자 ID
- `session_token`: 세션 토큰
- `is_active`: 활성 상태

## 🐛 트러블슈팅

### 데이터베이스 연결 오류

```
Database Connection Failed
```

**해결방법:**
- `config/config.php`의 DB 설정 확인
- MySQL 서비스 실행 여부 확인
- 사용자 권한 확인

### Moodle API 연동 오류

```
Moodle API Error: HTTP 403
```

**해결방법:**
- Moodle 웹 서비스 활성화 확인
- 토큰 유효성 확인
- 필요한 기능(Capabilities) 권한 확인

### 3D 시각화가 표시되지 않음

**해결방법:**
- 브라우저 콘솔에서 JavaScript 오류 확인
- Three.js CDN 로드 확인
- WebGL 지원 브라우저 사용

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여자

- KAIST Touch Math Academy

## 📞 문의

문의사항은 이슈 트래커를 통해 등록해주세요.

## 🔄 버전 히스토리

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 기본 3D 터널 시각화
- Moodle LMS 연동
- 스마트폰 UI 구현
- 학습 진행 상황 추적
