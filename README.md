# Alt42 Standalone v1.0

웹앱 기반 Moodle LMS 연동 학습 플랫폼 - **Overlay Substitute** 기능

## 주요 기능

### 🎯 Overlay Substitute
- **치환 전/후 코드 비교 기능** - 겹침 없는 명확한 UI
- **토글 모드**: 버튼 클릭으로 치환 전/후 전환
- **슬라이더 모드**: 슬라이더로 비율 조절하며 비교
- **자동 전환**: 자동으로 치환 전/후 반복 표시
- **키보드 단축키**: 방향키(←→)로 전환, 스페이스로 자동 재생

### 📱 가상 스마트폰 화면
- 우측 하단에 고정된 스마트폰 프레임
- 실제 모바일 앱처럼 동작하는 인터페이스
- 반응형 디자인 (데스크톱/모바일 대응)

### 🔗 Moodle LMS 연동
- Moodle 3.7 Web Service API 연동
- 문제 정보 자동 동기화
- 답안 제출 및 채점 연동

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹서버**: Apache 또는 Nginx

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 스키마 실행
source db/schema.sql
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alt42_db
DB_USER=root
DB_PASS=your_password

# Moodle
MOODLE_URL=http://your-moodle-site.com/moodle
MOODLE_TOKEN=your_moodle_webservice_token
```

### 3. 웹서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ public/index.php [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name localhost;
    root /path/to/alt42standalone_v1.0/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 4. PHP 확장 모듈 확인

```bash
php -m | grep -E "pdo|mysql|curl|json"
```

필요한 모듈:
- pdo_mysql
- curl
- json

## 사용 방법

### 기본 사용

1. **웹브라우저로 접속**
   ```
   http://localhost/public/
   ```

2. **문제 불러오기**
   - "문제 1 불러오기" 또는 "문제 2 불러오기" 버튼 클릭
   - 우측 하단 스마트폰 화면에 문제 표시

3. **Overlay Substitute 사용**
   - **토글 모드** (기본): "치환 전" / "치환 후" 버튼 클릭
   - **슬라이더 모드**: "오버레이 모드 전환" 버튼 클릭 후 슬라이더 조절

4. **답안 작성 및 제출**
   - 스마트폰 화면 하단 텍스트 영역에 답 입력
   - "제출" 버튼 클릭

### 키보드 단축키

| 키 | 기능 |
|---|---|
| `Ctrl/Cmd + Enter` | 답안 제출 |
| `Ctrl/Cmd + 1` | 치환 전 보기 |
| `Ctrl/Cmd + 2` | 치환 후 보기 |
| `←` (왼쪽 화살표) | 치환 전 보기 |
| `→` (오른쪽 화살표) | 치환 후 보기 |
| `Space` | 자동 전환 시작/중지 |

## 프로젝트 구조

```
alt42standalone_v1.0/
├── config/              # 설정 파일
│   ├── database.php     # 데이터베이스 연결
│   └── moodle.php       # Moodle API 연동
├── api/                 # REST API 엔드포인트
│   ├── get_problem.php  # 문제 조회
│   └── submit_answer.php # 답안 제출
├── public/              # 웹 루트
│   ├── index.php        # 메인 페이지
│   ├── css/
│   │   ├── smartphone.css  # 스마트폰 UI 스타일
│   │   └── overlay.css     # 오버레이 기능 스타일
│   └── js/
│       ├── app.js              # 메인 앱 로직
│       └── overlay-substitute.js # 오버레이 기능
├── db/
│   └── schema.sql       # 데이터베이스 스키마
└── README.md
```

## Overlay Substitute 작동 원리

### 겹침 방지 메커니즘

**문제**: 기존 오버레이 방식은 치환 전/후 코드가 같은 공간에 겹쳐 표시되어 혼란

**해결책**:

1. **토글 모드**
   ```css
   .code-panel {
       position: absolute;
       opacity: 0;
       visibility: hidden;
   }

   .code-panel.active {
       opacity: 1;
       visibility: visible;
       z-index: 10;
   }
   ```
   - 절대 위치 (absolute) 사용
   - 한 번에 하나의 패널만 활성화
   - `opacity`와 `visibility`로 부드러운 전환

2. **슬라이더 모드**
   ```css
   .slider-before {
       clip-path: inset(0 50% 0 0);
   }

   .slider-after {
       clip-path: inset(0 0 0 50%);
   }
   ```
   - `clip-path`로 영역 분할
   - 슬라이더 값에 따라 동적으로 비율 조정

## API 문서

### GET /api/get_problem.php

문제 정보 조회

**Parameters:**
- `id` (optional): 로컬 DB 문제 ID
- `moodle_id` (optional): Moodle 문제 ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "moodle_problem_id": 1,
    "title": "함수 치환 문제 1",
    "description": "다음 함수의 변수를 치환하세요",
    "type": "substitute",
    "original_code": "function calculateSum(a, b) {...}",
    "substituted_code": "function calculateSum(x, y) {...}"
  }
}
```

### POST /api/submit_answer.php

답안 제출

**Request Body:**
```json
{
  "session_id": 1,
  "problem_id": 1,
  "answer": "function calculateSum(x, y) { return x + y; }"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "answer_id": 123
  }
}
```

## Moodle 연동 설정

### 1. Moodle Web Service 활성화

1. 관리자로 Moodle 로그인
2. **사이트 관리** → **플러그인** → **Web services** → **개요**
3. 다음 항목 활성화:
   - Enable web services
   - Enable protocols (REST protocol)

### 2. 외부 서비스 생성

1. **사이트 관리** → **서버** → **Web services** → **외부 서비스**
2. "서비스 추가" 클릭
3. 이름: `alt42_service`
4. 필요한 함수 추가:
   - `mod_quiz_get_quiz_question`
   - `mod_quiz_save_attempt`
   - `core_user_get_users_by_field`

### 3. 토큰 생성

1. **사이트 관리** → **서버** → **Web services** → **토큰 관리**
2. 사용자 선택 및 서비스(`alt42_service`) 선택
3. 생성된 토큰을 `.env` 파일의 `MOODLE_TOKEN`에 입력

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo service mysql status

# 권한 확인
mysql -u root -p
GRANT ALL PRIVILEGES ON alt42_db.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### PHP 오류

```bash
# PHP 오류 로그 확인
tail -f /var/log/apache2/error.log

# 또는
tail -f /var/log/nginx/error.log
```

### Moodle 연동 오류

- Moodle URL이 올바른지 확인
- Web Service 토큰이 유효한지 확인
- Moodle에서 해당 서비스가 활성화되어 있는지 확인

## 개발 팁

### 로컬 테스트 (Moodle 없이)

환경 변수에서 `MOODLE_TOKEN`을 비워두면 로컬 DB의 샘플 데이터로 테스트 가능:

```bash
MOODLE_TOKEN=
```

### 커스텀 문제 추가

```sql
INSERT INTO problems (
    moodle_problem_id,
    title,
    description,
    problem_type,
    original_code,
    substituted_code
) VALUES (
    999,
    '커스텀 문제',
    '설명',
    'substitute',
    '원본 코드',
    '치환된 코드'
);
```

## 라이선스

MIT License

## 지원

이슈나 문의사항은 프로젝트 저장소의 Issues 섹션에 등록해주세요.

## 버전 히스토리

### v1.0 (2025-11-18)
- ✅ Overlay Substitute 기능 구현 (겹침 방지)
- ✅ 우측 하단 가상 스마트폰 UI
- ✅ Moodle LMS 연동
- ✅ MySQL 5.7 데이터베이스
- ✅ PHP 7.1.9 API
- ✅ 토글/슬라이더 모드
- ✅ 키보드 단축키 지원
