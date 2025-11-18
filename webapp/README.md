# Alternative Solutions - Standalone Web Application

## 🎯 프로젝트 개요

Moodle과 독립적으로 작동하는 대안적 풀이 유도 교육 시스템입니다. 학생들이 문제 해결 시 각 단계에서 여러 대안을 탐색하도록 유도합니다.

## 🛠 기술 스택

- **Backend**: PHP 7.1.9 (MVC Pattern)
- **Frontend**: Bootstrap 5 + Vanilla JavaScript
- **Database**: MySQL 5.7
- **Session**: PHP Native Sessions
- **Architecture**: 독립형 웹 애플리케이션

## 📁 프로젝트 구조

```
webapp/
├── public/                 # 웹 루트 디렉토리
│   ├── index.php          # 진입점
│   ├── .htaccess          # Apache 설정
│   ├── css/               # 스타일시트
│   ├── js/                # JavaScript 파일
│   └── assets/            # 이미지, 아이콘 등
├── src/
│   ├── config/            # 설정 파일
│   │   ├── database.php   # DB 연결
│   │   └── config.php     # 앱 설정
│   ├── controllers/       # 컨트롤러
│   │   ├── AuthController.php
│   │   ├── ActivityController.php
│   │   ├── StepController.php
│   │   └── ReflectionController.php
│   ├── models/            # 모델
│   │   ├── User.php
│   │   ├── Activity.php
│   │   ├── Step.php
│   │   └── Attempt.php
│   ├── views/             # 뷰 템플릿
│   │   ├── layouts/
│   │   ├── auth/
│   │   ├── activities/
│   │   └── students/
│   ├── middleware/        # 미들웨어
│   │   └── AuthMiddleware.php
│   └── utils/             # 유틸리티
│       ├── Router.php
│       └── View.php
└── database/              # 데이터베이스
    └── schema.sql         # 스키마 정의
```

## 🚀 설치 방법

### 1. 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4+ 또는 Nginx
- mod_rewrite 활성화 (Apache)

### 2. 데이터베이스 설정

```bash
mysql -u root -p
```

```sql
CREATE DATABASE altsolutions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'altuser'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON altsolutions.* TO 'altuser'@'localhost';
FLUSH PRIVILEGES;
```

```bash
mysql -u altuser -p altsolutions < database/schema.sql
```

### 3. 설정 파일

`src/config/database.php` 파일 수정:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'altsolutions');
define('DB_USER', 'altuser');
define('DB_PASS', 'your_password');
```

### 4. 웹서버 설정

#### Apache

Document Root를 `webapp/public/`으로 설정

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/webapp/public;
    index index.php;

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

### 5. 권한 설정

```bash
chmod -R 755 webapp/
chown -R www-data:www-data webapp/
```

## 🎓 사용 방법

### 관리자 계정 생성

최초 실행 시 자동으로 관리자 계정 생성 화면이 나타납니다.

또는 SQL로 직접 생성:
```sql
INSERT INTO users (username, email, password, role, created_at)
VALUES ('admin', 'admin@example.com', '$2y$10$...', 'teacher', NOW());
```

### 교사

1. 로그인 → "새 활동 만들기"
2. 문제 설명 및 단계 설정
3. 학생 초대 또는 공개 링크 공유

### 학생

1. 로그인 또는 링크로 접속
2. 활동 시작
3. 각 단계마다 대안 탐색
4. 성찰 작성

## 🔒 보안

- 비밀번호 해싱: `password_hash()` (bcrypt)
- SQL Injection 방지: Prepared Statements
- XSS 방지: `htmlspecialchars()`
- CSRF 방지: Token 검증
- Session Hijacking 방지: Session regeneration

## 🌐 다국어 지원

`src/config/lang/` 폴더에서 언어 파일 관리:
- `ko.php` - 한국어
- `en.php` - 영어

## 📊 주요 기능

### 학생용
- ✅ 단계별 문제 해결
- ✅ 대안적 접근 방법 탐색 (최소 2개)
- ✅ 자신감 수준 표시
- ✅ 실시간 진행 상황 추적
- ✅ 성찰 활동
- ✅ 완료 요약 보기

### 교사용
- ✅ 활동 생성 및 관리
- ✅ 단계 추가/수정/삭제
- ✅ 학생 진행 상황 모니터링
- ✅ 대시보드 및 통계

## 🧪 개발 모드

```bash
# PHP 내장 서버로 테스트
cd webapp/public
php -S localhost:8000
```

브라우저에서 `http://localhost:8000` 접속

## 📝 라이선스

MIT License

## 👥 기여자

KAIST Touch Math Academy - 2025

## 📞 지원

문제 발생 시:
- 이슈 트래커: [GitHub Issues]
- 이메일: support@example.com
