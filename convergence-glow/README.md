# 🌟 Convergence Glow

**수열의 수렴과 발산을 색감으로 시각화하는 교육용 웹 애플리케이션**

Moodle LMS와 연동하여 학생들이 수열의 수렴/발산 개념을 시각적으로 이해할 수 있도록 돕는 인터랙티브 교육 도구입니다.

## ✨ 주요 기능

- **실시간 수열 시각화**: Canvas 기반의 부드러운 애니메이션으로 수열의 변화를 표현
- **색감 기반 학습**: 수렴은 차가운 색(청록색), 발산은 따뜻한 색(빨간색)으로 직관적 표현
- **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 앱 형태 제공
- **Moodle LMS 연동**: Moodle 3.7의 퀴즈 시스템과 완벽 통합
- **다양한 수열 지원**: 등차수열, 등비수열, 조화수열, 사용자 정의 수열

## 🛠 기술 스택

### 백엔드
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 프론트엔드
- **HTML5**: Canvas API를 활용한 시각화
- **CSS3**: 그라디언트 및 애니메이션
- **JavaScript**: 순수 JavaScript (라이브러리 없음)

## 📁 프로젝트 구조

```
convergence-glow/
├── api/                      # PHP 백엔드
│   ├── config.php           # 설정 파일
│   ├── db.php               # 데이터베이스 연결
│   ├── moodle_api.php       # Moodle 연동 API
│   └── sequence_api.php     # 수열 계산 API
├── database/
│   └── schema.sql           # MySQL 데이터베이스 스키마
├── public/                  # 프론트엔드
│   ├── index.html          # 메인 HTML
│   ├── css/
│   │   └── style.css       # 스타일시트
│   └── js/
│       ├── app.js          # 메인 앱 로직
│       ├── sequence.js     # 수열 계산
│       └── visualizer.js   # Canvas 시각화
└── README.md
```

## 🚀 설치 및 실행

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
source database/schema.sql
```

### 2. 환경 변수 설정

`api/config.php` 파일에서 다음 설정을 수정하세요:

```php
// MySQL 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'convergence_glow');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle 설정
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_webservice_token');
```

### 3. 웹 서버 설정

#### Apache 설정 예제

```apache
<VirtualHost *:80>
    ServerName convergence-glow.local
    DocumentRoot /path/to/convergence-glow/public

    <Directory /path/to/convergence-glow/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 라우팅
    Alias /api /path/to/convergence-glow/api
    <Directory /path/to/convergence-glow/api>
        Options None
        AllowOverride None
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx 설정 예제

```nginx
server {
    listen 80;
    server_name convergence-glow.local;
    root /path/to/convergence-glow/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        alias /path/to/convergence-glow/api;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }
}
```

### 4. Moodle 웹 서비스 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리** 이동
3. 웹 서비스 활성화
4. 새 서비스 생성 및 필요한 함수 추가:
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_process_attempt`
5. 토큰 생성 및 `config.php`에 설정

## 📖 사용 방법

### 기본 사용

1. 브라우저에서 앱 열기:
   ```
   http://convergence-glow.local/?quiz_id=1&user_id=1
   ```

2. 문제가 자동으로 로드됨
3. "시각화 시작" 버튼 클릭
4. 수열이 애니메이션으로 표시되며 색감이 변화
5. 시각화 완료 후 수렴/발산 여부 선택
6. 정답 확인 및 피드백 받기

### URL 파라미터

- `quiz_id`: Moodle 퀴즈 ID (필수)
- `question_id`: 특정 문제 ID (선택, 없으면 랜덤)
- `user_id`: Moodle 사용자 ID (필수)

예제:
```
http://convergence-glow.local/?quiz_id=5&question_id=23&user_id=42
```

## 🎨 색상 의미

- **청록색 → 파란색**: 수렴하는 수열 (값이 특정 값으로 수렴)
- **노란색 → 빨간색**: 발산하는 수열 (값이 무한대로 증가)
- **분홍색 → 보라색**: 진동하며 수렴하는 수열

## 🔧 API 엔드포인트

### 문제 조회
```http
GET /api/sequence_api.php/problem?quiz_id=1
GET /api/sequence_api.php/problem?question_id=5
```

### 수열 계산
```http
POST /api/sequence_api.php/calculate
Content-Type: application/json

{
  "problem_id": 1,
  "num_terms": 50
}
```

### 답안 제출
```http
POST /api/sequence_api.php/submit
Content-Type: application/json

{
  "session_token": "abc123...",
  "problem_id": 1,
  "answer": "convergent",
  "time_spent": 45,
  "interaction_data": {...}
}
```

### 세션 생성
```http
POST /api/sequence_api.php/session
Content-Type: application/json

{
  "user_id": 1,
  "quiz_id": 1
}
```

## 📊 데이터베이스 스키마

### `sequence_problems`
수열 문제 정보 저장

### `student_attempts`
학생 응답 및 진행 상황 저장

### `moodle_sessions`
Moodle 세션 연동 정보

자세한 스키마는 `database/schema.sql` 참조

## 🧪 데모 모드

API 서버 없이도 테스트 가능합니다:

1. `public/index.html`을 직접 브라우저에서 열기
2. 앱이 자동으로 데모 모드로 전환
3. 샘플 등비수열 문제로 테스트 가능

## 🔐 보안 고려사항

- **입력 검증**: 모든 사용자 입력 검증 및 정제
- **SQL 인젝션 방지**: PDO Prepared Statements 사용
- **XSS 방지**: 출력 데이터 이스케이프
- **CSRF 방지**: 세션 토큰 사용
- **수식 평가 보안**: 제한된 수식만 허용

## 🎓 교육적 활용

### 학습 목표
- 수열의 수렴과 발산 개념 이해
- 극한의 시각적 이해
- 다양한 수열 패턴 인식

### 권장 활용 방법
1. **도입**: 간단한 등비수열로 수렴 개념 소개
2. **전개**: 다양한 유형의 수열 탐색
3. **심화**: 학생들이 직접 수렴/발산 예측
4. **평가**: 정답률과 소요 시간 분석

## 🐛 문제 해결

### 데이터베이스 연결 오류
```
Error: 데이터베이스 연결 실패
```
→ `api/config.php`의 DB 설정 확인

### Moodle API 오류
```
Error: Moodle API 호출 실패
```
→ Moodle 웹 서비스 활성화 및 토큰 확인

### 시각화가 표시되지 않음
→ 브라우저 콘솔에서 JavaScript 에러 확인
→ Canvas API 지원 브라우저 사용 (Chrome, Firefox, Safari, Edge)

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 통해 연락주세요.

---

**Convergence Glow** - 수학을 색감으로 경험하다 🌈
