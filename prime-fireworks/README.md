# 🎆 Prime Fireworks - 소수 분해 학습 앱

소수 분해를 폭죽처럼 터지는 시각적 효과로 학습하는 인터랙티브 웹 애플리케이션입니다.

## 📋 프로젝트 개요

**Prime Fireworks**는 Moodle LMS와 연동하여 학생들이 소수 분해를 재미있고 직관적으로 학습할 수 있도록 설계된 교육용 앱입니다. 우측 하단의 가상 스마트폰 화면에서 실행되며, 정답을 맞추면 폭죽 애니메이션이 터지는 보상 시스템을 제공합니다.

### 주요 기능

- ✨ **인터랙티브한 소수 분해 학습**
- 🎆 **폭죽 애니메이션 효과**
- 📱 **가상 스마트폰 UI** (우측 하단 배치)
- 🔗 **Moodle 3.7 LMS 연동**
- 📊 **학습 진도 추적**
- 🎯 **난이도별 문제 제공** (쉬움/중간/어려움)
- ⏱️ **실시간 타이머 및 점수 시스템**

## 🛠️ 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5/CSS3**
- **JavaScript (ES6)**
- **Canvas API** (폭죽 애니메이션)

## 📁 프로젝트 구조

```
prime-fireworks/
├── backend/
│   ├── api/
│   │   ├── config.php           # 설정 파일
│   │   ├── PrimeFactorizer.php  # 소수 분해 엔진
│   │   ├── problem.php          # 문제 조회 API
│   │   ├── submit.php           # 답안 제출 API
│   │   └── progress.php         # 진도 조회 API
│   ├── moodle-integration/
│   │   └── MoodleClient.php     # Moodle 연동 클라이언트
│   └── database/
│       └── schema.sql           # 데이터베이스 스키마
├── frontend/
│   ├── index.html               # 메인 HTML
│   ├── styles/
│   │   ├── smartphone.css       # 스마트폰 UI 스타일
│   │   └── fireworks.css        # 폭죽 애니메이션 스타일
│   └── components/
│       ├── api.js               # API 클라이언트
│       ├── fireworks.js         # 폭죽 애니메이션 엔진
│       └── app.js               # 메인 애플리케이션 로직
└── docs/
    └── DESIGN.md                # 설계 문서
```

## 🚀 설치 및 실행

### 사전 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (LMS 연동 시)

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 및 테이블 생성
source prime-fireworks/backend/database/schema.sql
```

### 2. 백엔드 설정

`backend/api/config.php` 파일을 수정하여 데이터베이스 및 Moodle 설정을 입력합니다:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');
define('DB_NAME', 'prime_fireworks');
define('DB_USER', 'your_db_user');
define('DB_PASS', 'your_db_password');

// Moodle 설정
define('MOODLE_URL', 'http://your-moodle-server/moodle');
define('MOODLE_TOKEN', 'your_moodle_web_services_token');
```

### 3. Moodle Web Services 설정

Moodle 관리자 페이지에서 다음을 설정합니다:

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
   - "웹 서비스 활성화" 체크

2. **외부 서비스 생성**
   - 이름: `prime_fireworks_service`
   - 활성화됨: 체크

3. **토큰 생성**
   - 사용자 선택
   - 서비스 선택: `prime_fireworks_service`
   - 토큰 생성 후 `config.php`에 입력

4. **허용된 함수 추가**
   - `core_user_get_users_by_field`
   - `core_webservice_get_site_info`

### 4. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName prime-fireworks.local
    DocumentRoot /path/to/prime-fireworks/frontend

    <Directory /path/to/prime-fireworks/frontend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    Alias /prime-fireworks/backend /path/to/prime-fireworks/backend
    <Directory /path/to/prime-fireworks/backend>
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
    server_name prime-fireworks.local;
    root /path/to/prime-fireworks/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /prime-fireworks/backend {
        alias /path/to/prime-fireworks/backend;
        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        }
    }
}
```

### 5. 애플리케이션 실행

브라우저에서 다음 URL로 접속:

```
http://prime-fireworks.local
```

또는 로컬 개발 환경:

```
http://localhost/prime-fireworks/frontend/index.html
```

## 📖 사용 방법

### 학생용

1. **학습 시작**
   - 앱을 실행하고 "학습 시작" 버튼 클릭
   - 난이도별 문제가 자동으로 제공됨

2. **문제 풀기**
   - 주어진 숫자를 소수로 분해
   - "+" 버튼으로 인수 추가
   - "×" 버튼으로 인수 제거

3. **답안 제출**
   - 모든 소수 인수를 입력 후 "제출하기" 클릭
   - 정답이면 폭죽 애니메이션 실행

4. **진도 확인**
   - 하단 "진도" 탭에서 학습 현황 확인
   - 전체 문제 수, 완료 수, 정답률, 폭죽 수 표시

### 교사용

Moodle LMS에서 학생들의 학습 데이터를 확인할 수 있습니다:

- 문제별 정답률
- 학생별 진도
- 평균 소요 시간
- 난이도별 통계

## 🎨 폭죽 애니메이션

정답을 맞추면 다음과 같은 단계로 폭죽 애니메이션이 실행됩니다:

1. **초기 숫자 표시**: 분해할 숫자가 크게 표시됨
2. **분해 과정**: 각 단계마다 폭죽이 터지며 인수들이 나타남
3. **소수 강조**: 소수는 빛나는 원형 배지로 표시
4. **최종 축하**: 모든 소수가 정렬되고 화려한 폭죽 효과

## 🔧 API 엔드포인트

### GET /api/problem.php
문제 조회

```
요청: ?user_id=123&level=medium
응답: {
  "status": "success",
  "data": {
    "problem_id": 5,
    "number": 60,
    "difficulty": "medium",
    "instruction": "60을 소수의 곱으로 나타내세요",
    "hint": "작은 소수부터 차례대로 나누어보세요"
  }
}
```

### POST /api/submit.php
답안 제출

```
요청: {
  "user_id": 123,
  "problem_id": 5,
  "answer": [2, 2, 3, 5],
  "time_spent": 120
}
응답: {
  "status": "success",
  "data": {
    "is_correct": true,
    "score": 100,
    "fireworks_data": { ... }
  }
}
```

### GET /api/progress.php
진도 조회

```
요청: ?user_id=123
응답: {
  "status": "success",
  "data": {
    "total_problems": 20,
    "completed_problems": 12,
    "correct_rate": 75.0,
    "fireworks_count": 9
  }
}
```

## 🐛 문제 해결

### 데이터베이스 연결 오류
```
Database connection failed
```
→ `backend/api/config.php`에서 데이터베이스 설정 확인

### Moodle API 오류
```
Moodle API Error
```
→ Moodle 토큰 및 Web Services 설정 확인

### CORS 오류
```
Access to fetch has been blocked by CORS policy
```
→ `backend/api/config.php`에서 `CORS_ALLOWED_ORIGINS` 설정 확인

## 🧪 테스트

개발자 모드에서 임시 사용자 ID로 테스트할 수 있습니다:

```javascript
// 브라우저 콘솔에서 실행
sessionStorage.setItem('user_id', '123');
location.reload();
```

## 📝 라이선스

이 프로젝트는 교육용으로 개발되었습니다.

## 👥 개발팀

- **Prime Fireworks Team**
- KAIST Touch Math Academy

## 📧 문의

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해주세요.

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
