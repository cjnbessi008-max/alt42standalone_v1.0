# ALT42 Standalone v1.0 설치 가이드

점근선 애니메이션 웹앱 설치 및 설정 매뉴얼

## 📋 시스템 요구사항

### 백엔드
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 웹 서버
- **Moodle**: 3.7 (연동 시)

### 프론트엔드
- **Node.js**: 16.x 이상
- **npm**: 8.x 이상
- **모던 브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 🚀 설치 단계

### 1. 저장소 클론

```bash
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 백엔드 설정

#### 2.1 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
CREATE DATABASE alt42_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'alt42_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON alt42_db.* TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 2.2 테이블 생성

```bash
mysql -u alt42_user -p alt42_db < backend/sql/create_tables.sql
```

#### 2.3 설정 파일 생성

```bash
cd backend/config
cp config.example.php config.php
```

`config.php` 편집:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'alt42_db');
define('DB_USER', 'alt42_user');
define('DB_PASS', 'your_password');

define('MOODLE_URL', 'http://your-moodle-site.com');
define('API_CORS_ORIGIN', 'http://localhost:3000');
```

#### 2.4 Apache 가상 호스트 설정 (선택사항)

`/etc/apache2/sites-available/alt42.conf`:

```apache
<VirtualHost *:80>
    ServerName alt42.local
    DocumentRoot /path/to/alt42standalone_v1.0/backend

    <Directory /path/to/alt42standalone_v1.0/backend>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/alt42_error.log
    CustomLog ${APACHE_LOG_DIR}/alt42_access.log combined
</VirtualHost>
```

```bash
sudo a2ensite alt42.conf
sudo systemctl reload apache2
```

### 3. 프론트엔드 설정

#### 3.1 의존성 설치

```bash
cd frontend
npm install
```

#### 3.2 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 편집:
```env
REACT_APP_API_URL=http://localhost/alt42standalone_v1.0/backend/api
REACT_APP_MOODLE_URL=http://your-moodle-site.com
REACT_APP_DEBUG=true
```

#### 3.3 개발 서버 실행

```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속

#### 3.4 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `frontend/build/` 디렉토리에 생성됩니다.

### 4. Moodle 연동 설정

#### 4.1 Moodle 데이터베이스 접근 권한

Moodle DB에 읽기 권한 부여:

```sql
GRANT SELECT ON moodle.mdl_question TO 'alt42_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_answers TO 'alt42_user'@'localhost';
GRANT SELECT ON moodle.mdl_quiz_slots TO 'alt42_user'@'localhost';
GRANT SELECT ON moodle.mdl_question_numerical_options TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 4.2 Moodle 퀴즈 임베드

Moodle 퀴즈 또는 페이지에 iframe으로 삽입:

```html
<iframe
  src="http://alt42.local?quiz_id=123"
  width="100%"
  height="800"
  frameborder="0"
  allowfullscreen>
</iframe>
```

## 🧪 테스트

### API 테스트

```bash
# 샘플 문제 가져오기
curl http://localhost/alt42standalone_v1.0/backend/api/get-problem.php

# 특정 퀴즈 문제 가져오기
curl "http://localhost/alt42standalone_v1.0/backend/api/get-problem.php?quiz_id=1"

# 커스텀 문제 가져오기
curl "http://localhost/alt42standalone_v1.0/backend/api/get-problem.php?custom_id=1"
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "id": 0,
    "function": "1/x",
    "asymptotes": {
      "vertical": [0],
      "horizontal": [0],
      "oblique": []
    },
    "domain": [-10, 10],
    "range": [-10, 10],
    "animation_duration": 2000
  },
  "timestamp": 1234567890
}
```

### 프론트엔드 테스트

브라우저에서:
1. `http://localhost:3000` 접속
2. 점근선 애니메이션 확인
3. 우측 하단 가상 스마트폰 화면 확인
4. 터치 제스처 테스트 (모바일 기기 또는 개발자 도구)

## 📱 모바일 테스트

### Chrome DevTools

1. F12 → 개발자 도구 열기
2. Ctrl+Shift+M → 모바일 뷰 토글
3. 기기 선택 (iPhone, Galaxy, etc.)
4. 터치 제스처 시뮬레이션

## 🔧 문제 해결

### CORS 오류

백엔드 `config.php`에서 CORS 설정 확인:
```php
define('API_CORS_ORIGIN', 'http://localhost:3000');
```

API 파일에 헤더 추가 확인:
```php
header('Access-Control-Allow-Origin: ' . API_CORS_ORIGIN);
```

### 데이터베이스 연결 오류

- MySQL 서비스 실행 확인: `sudo systemctl status mysql`
- 사용자 권한 확인
- `config.php`의 DB 정보 확인

### 애니메이션이 보이지 않음

- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas API 지원 확인
- `problemData.animation_duration` 값 확인

## 📚 추가 자료

- [Moodle API 문서](https://docs.moodle.org)
- [Canvas API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [React 공식 문서](https://react.dev)

## 🆘 지원

문제가 발생하면 GitHub Issues에 보고해주세요.
