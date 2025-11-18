# Log Gear - 로그 기어 학습 앱

곱셈→덧셈으로 바뀌는 과정을 기계 톱니로 시각화하여 로그의 원리를 교육하는 웹 애플리케이션입니다.

## 📱 주요 기능

- **가상 스마트폰 UI**: 우측 하단에 스마트폰 화면 형태로 앱 표시
- **기어 시각화**: 로그 원리 (log(a×b) = log(a) + log(b))를 기계 톱니로 애니메이션 표현
- **Moodle LMS 연동**: Moodle 3.7의 문제를 동기화하고 결과 전송
- **실시간 통계**: 학습자의 정답률과 시도 횟수 추적
- **오프라인 모드**: API 없이도 데모 문제로 동작 가능

## 🎯 학습 원리

```
곱셈 (Multiplication)           로그 변환 (Logarithm)          덧셈 (Addition)
    a × b            →         log(a) + log(b)        →      결과

[기어 1] [기어 2]              [로그 기어 1] [로그 기어 2]      [출력 기어]
```

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **PDO**: Database abstraction
- **cURL**: Moodle API 통신

### Frontend
- **HTML5** + **CSS3**
- **JavaScript** (ES6+)
- **Canvas API**: 기어 애니메이션

### Integration
- **Moodle**: 3.7
- **Moodle Web Services**: RESTful API

## 📋 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- PHP Extensions:
  - PDO
  - pdo_mysql
  - curl
  - json

## 🚀 설치 방법

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd log-gear-app
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE log_gear_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 스키마 임포트
mysql -u root -p log_gear_db < database/schema.sql
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

필수 설정 항목:
```env
DB_HOST=localhost
DB_NAME=log_gear_db
DB_USER=your_username
DB_PASS=your_password

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1 [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/log-gear-app/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        try_files $uri $uri/ /api/$uri.php;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        }
    }
}
```

### 5. Moodle 웹 서비스 설정

#### Moodle 관리자 패널에서:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**
   - "웹 서비스 활성화" 체크

2. **웹 서비스 > 외부 서비스**
   - 새 서비스 생성: "Log Gear App"
   - 다음 함수 추가:
     - `mod_quiz_get_quiz_questions`
     - `core_webservice_get_site_info`
     - `core_grades_update_grades`

3. **웹 서비스 > 토큰 관리**
   - 사용자에게 토큰 생성
   - 서비스: "Log Gear App" 선택
   - 생성된 토큰을 `.env` 파일에 추가

## 📖 사용 방법

### 독립형 모드 (Standalone)

1. 웹 브라우저에서 `http://localhost/log-gear-app/public/` 접속
2. "랜덤 문제" 버튼 클릭하여 문제 불러오기
3. 우측 스마트폰 화면에서 문제 확인
4. 답 입력 후 "제출" 버튼 클릭
5. "기어 동작 보기" 버튼으로 로그 변환 과정 시각화

### Moodle 연동 모드

1. Moodle에서 Quiz ID 확인
2. "Moodle 연동" 섹션에 Quiz ID 입력
3. "Moodle 문제 동기화" 버튼 클릭
4. 동기화된 문제들이 자동으로 로드됨
5. 학생 답변이 자동으로 Moodle 성적부에 전송

## 🎨 UI 구성

### 좌측 패널 (컨트롤러)
- 문제 선택 및 난이도 설정
- Moodle 동기화 컨트롤
- 학습 통계 표시

### 우측 스마트폰 화면
- 문제 표시 영역
- 기어 시각화 캔버스
- 답변 입력 폼
- 피드백 메시지

## 🔌 API 엔드포인트

### Problems API

```http
GET /api/problems.php
GET /api/problems.php?id={id}
GET /api/problems.php?random=1&difficulty={easy|medium|hard}
POST /api/problems.php
```

### Sessions API

```http
POST /api/sessions.php
PUT /api/sessions.php
GET /api/sessions.php?session_id={session_id}
```

### Moodle API

```http
GET /api/moodle.php?action=sync_questions&quiz_id={id}
POST /api/moodle.php?action=validate_user
POST /api/moodle.php?action=send_grade
```

## 🗄 데이터베이스 스키마

### problems
- 문제 데이터 저장
- operand1, operand2: 피연산자
- operation: multiply/divide
- moodle_question_id: Moodle 문제 연결

### student_sessions
- 학습 세션 관리
- session_id: 고유 세션 식별자
- moodle_user_id: Moodle 사용자 연결

### problem_attempts
- 학생의 문제 풀이 기록
- is_correct: 정답 여부
- time_spent: 소요 시간
- gear_animation_completed: 애니메이션 시청 여부

## 🧪 테스트

### 샘플 문제 확인

```bash
mysql -u root -p log_gear_db
SELECT * FROM problems;
```

### API 테스트

```bash
# 랜덤 문제 가져오기
curl http://localhost/api/problems.php?random=1

# 세션 생성
curl -X POST http://localhost/api/sessions.php \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1}'
```

## 🎓 교육적 가치

1. **시각적 학습**: 추상적인 로그 개념을 물리적 기어로 표현
2. **상호작용**: 학생이 직접 문제를 풀고 애니메이션 확인
3. **즉각 피드백**: 정답/오답 즉시 표시
4. **LMS 통합**: 기존 Moodle 환경에 자연스럽게 통합

## 🔧 트러블슈팅

### 데이터베이스 연결 오류
```bash
# MySQL 서비스 확인
sudo service mysql status

# 권한 확인
GRANT ALL PRIVILEGES ON log_gear_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### Moodle 연동 실패
- Moodle 웹 서비스가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- 방화벽에서 Moodle 서버 접근이 허용되는지 확인

### 기어 애니메이션 미표시
- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas API 지원 브라우저 사용 (Chrome, Firefox, Edge)

## 📝 라이선스

MIT License

## 👥 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!

## 📞 문의

문제가 발생하면 GitHub Issues에 등록해주세요.

---

**Made with ❤️ for Math Education**
