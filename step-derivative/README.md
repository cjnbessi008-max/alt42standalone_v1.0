# Step Derivative - 단계별 미분 학습 앱

복잡한 미분을 단계적으로 쪼개서 보여주는 웹 기반 학습 애플리케이션입니다. Moodle LMS와 연동하여 우측 하단 가상 스마트폰 화면에 표시됩니다.

## 기술 스택

- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)

## 주요 기능

### 1. Moodle LMS 연동
- Moodle 웹 서비스 API를 통한 문제 동기화
- 학생 진행 상황 자동 저장
- 성적 자동 제출

### 2. 단계별 미분 계산
다음 미분 규칙을 지원합니다:
- 상수 규칙 (Constant Rule)
- 거듭제곱 규칙 (Power Rule)
- 상수배 규칙 (Constant Multiple Rule)
- 합/차 규칙 (Sum/Difference Rule)
- 곱셈 규칙 (Product Rule)
- 나눗셈 규칙 (Quotient Rule)
- 연쇄 법칙 (Chain Rule)
- 삼각함수 미분 (sin, cos, tan)
- 지수 함수 미분 (e^x)
- 로그 함수 미분 (ln x)

### 3. 가상 스마트폰 UI
- 우측 하단에 고정 배치
- 드래그로 위치 이동 가능
- 더블클릭으로 최대화/최소화
- 반응형 디자인 지원

### 4. 학습 진행 추적
- 단계별 진행 상황 저장
- 학습 소요 시간 측정
- 완료율 표시
- 분석 데이터 수집

## 디렉토리 구조

```
step-derivative/
├── backend/              # PHP 백엔드
│   ├── api/             # API 엔드포인트
│   │   └── problem_handler.php
│   ├── lib/             # 라이브러리
│   │   └── derivative_engine.php
│   └── config/          # 설정 파일
│       ├── database.php
│       └── moodle.php
├── frontend/            # 프론트엔드
│   ├── index.html
│   ├── css/
│   │   ├── smartphone.css
│   │   └── app.css
│   └── js/
│       ├── api.js
│       ├── ui.js
│       ├── app.js
│       └── drag.js
├── database/            # 데이터베이스
│   └── schema.sql
├── docs/               # 문서
└── .env.example        # 환경 설정 예제
```

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 설정 입력
nano .env
```

필수 설정 항목:
- `DB_HOST`, `DB_USER`, `DB_PASS`: MySQL 접속 정보
- `MOODLE_URL`: Moodle 설치 URL
- `MOODLE_TOKEN`: Moodle 웹 서비스 토큰

### 3. Moodle 웹 서비스 설정

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스** 이동
3. 새 서비스 생성: `step_derivative_service`
4. 다음 함수 추가:
   - `core_question_get_question_data`
   - `core_user_get_users_by_field`
   - `core_course_get_courses`
   - `core_grades_update_grades`
   - `core_webservice_get_site_info`
5. **토큰 관리**에서 토큰 생성 및 `.env`에 추가

### 4. 웹 서버 설정

#### Apache 설정 예제

```apache
<VirtualHost *:80>
    ServerName step-derivative.local
    DocumentRoot /path/to/step-derivative

    <Directory /path/to/step-derivative>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/var/run/php/php7.1-fpm.sock|fcgi://localhost"
    </FilesMatch>
</VirtualHost>
```

#### Nginx 설정 예제

```nginx
server {
    listen 80;
    server_name step-derivative.local;
    root /path/to/step-derivative/frontend;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        alias /path/to/step-derivative/backend/api/;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

### 5. 파일 권한 설정

```bash
# 웹 서버 사용자에게 권한 부여
sudo chown -R www-data:www-data step-derivative/
sudo chmod -R 755 step-derivative/
```

## 사용 방법

### Moodle 퀴즈에 통합

1. Moodle 퀴즈 질문 생성 시 다음 형식 사용:

```html
다음 식을 미분하시오:
[DERIVATIVE]3*x^2 + 2*x + 5[/DERIVATIVE]

<iframe src="http://your-domain/step-derivative/frontend/index.html?problem_id=1&user_id={$USER->id}"
        width="100%"
        height="800px"
        frameborder="0">
</iframe>
```

2. 또는 별도 페이지로 열기:

```html
<a href="http://your-domain/step-derivative/frontend/index.html?problem_id=1"
   target="_blank">
   Step Derivative로 학습하기
</a>
```

### 독립 실행 (개발/테스트)

```bash
# 웹 브라우저에서 열기
http://localhost/step-derivative/frontend/index.html

# 특정 문제 ID로 열기
http://localhost/step-derivative/frontend/index.html?problem_id=1&user_id=1
```

## API 엔드포인트

### 문제 관리

#### 문제 생성
```http
POST /backend/api/problem_handler.php/create_problem
Content-Type: application/json

{
  "expression": "3*x^2 + 2*x",
  "moodle_course_id": 1,
  "moodle_quiz_id": 1,
  "moodle_question_id": 1,
  "difficulty_level": "basic"
}
```

#### 문제 조회
```http
GET /backend/api/problem_handler.php/get_problem?problem_id=1
```

#### 솔루션 조회
```http
GET /backend/api/problem_handler.php/get_solution?problem_id=1
```

### 학습 진행

#### 학습 시작
```http
POST /backend/api/problem_handler.php/start_attempt
Content-Type: application/json

{
  "moodle_user_id": 1,
  "problem_id": 1
}
```

#### 진행 상황 업데이트
```http
POST /backend/api/problem_handler.php/update_attempt
Content-Type: application/json

{
  "attempt_id": 1,
  "current_step": 3,
  "time_spent": 120,
  "completed": false
}
```

### Moodle 동기화

#### Moodle에서 문제 가져오기
```http
POST /backend/api/problem_handler.php/sync_from_moodle
Content-Type: application/json

{
  "question_id": 1,
  "course_id": 1,
  "quiz_id": 1,
  "difficulty_level": "basic"
}
```

## 커스터마이징

### 테마 변경

`frontend/css/app.css` 파일에서 색상 변경:

```css
.app {
    /* 그라데이션 배경 색상 */
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.icon-btn {
    color: #your-primary-color;
}
```

### 새로운 미분 규칙 추가

`backend/lib/derivative_engine.php`에 새 메서드 추가:

```php
private function applyYourCustomRule($expr) {
    // 규칙 구현
    $this->addStep(
        'your_rule_type',
        $expr,
        $result,
        "설명",
        'your_rule'
    );
    return $result;
}
```

### UI 위치 변경

`frontend/css/smartphone.css`에서 위치 조정:

```css
.smartphone {
    /* 좌측 하단으로 변경 */
    bottom: 20px;
    left: 20px;  /* right 대신 left 사용 */
}
```

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u root -p -e "SELECT 1"

# .env 파일 확인
cat .env | grep DB_
```

### Moodle API 연결 오류

1. Moodle 웹 서비스가 활성화되었는지 확인
2. 토큰이 올바른지 확인
3. 방화벽/CORS 설정 확인

```php
// backend/config/moodle.php에서 디버그 활성화
error_log("Moodle API Response: " . print_r($response, true));
```

### 가상 스마트폰이 표시되지 않음

1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일이 올바르게 로드되었는지 확인
3. z-index 충돌 확인

```javascript
// 브라우저 콘솔에서 확인
console.log(document.getElementById('smartphone-container'));
```

## 성능 최적화

### 데이터베이스 인덱스

이미 schema.sql에 포함되어 있지만, 추가 최적화:

```sql
-- 자주 조회되는 컬럼에 인덱스 추가
ALTER TABLE student_attempts ADD INDEX idx_user_problem (moodle_user_id, problem_id);
ALTER TABLE analytics ADD INDEX idx_user_timestamp (moodle_user_id, timestamp);
```

### 캐싱

PHP에서 APCu 또는 Redis 사용:

```php
// 예제: APCu 캐싱
if (apcu_exists('problem_' . $problemId)) {
    $problem = apcu_fetch('problem_' . $problemId);
} else {
    $problem = fetchFromDatabase($problemId);
    apcu_store('problem_' . $problemId, $problem, 3600);
}
```

## 보안 고려사항

1. **SQL Injection 방지**: 모든 쿼리에 PDO prepared statements 사용
2. **XSS 방지**: 사용자 입력 출력 시 `htmlspecialchars()` 사용
3. **CSRF 방지**: 세션 토큰 검증
4. **입력 검증**: 모든 API 입력 검증 및 정제

## 라이선스

이 프로젝트는 교육용으로 제작되었습니다.

## 지원 및 기여

문제 보고나 기능 제안은 이슈 트래커를 사용해주세요.

## 버전 히스토리

- **v1.0.0** (2024) - 초기 릴리스
  - 기본 미분 규칙 지원
  - Moodle 3.7 연동
  - 가상 스마트폰 UI
  - 단계별 학습 추적

## 참고 자료

- [Moodle Web Services Documentation](https://docs.moodle.org/dev/Web_services)
- [PHP PDO Documentation](https://www.php.net/manual/en/book.pdo.php)
- [MySQL 5.7 Reference Manual](https://dev.mysql.com/doc/refman/5.7/en/)
