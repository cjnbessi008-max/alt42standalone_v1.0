# Invariant Finder - Standalone Web Application

독립형 웹앱으로 제작된 **Invariant Finder**는 학생들이 기하학적 도형을 탐구하고 도형을 확대/축소할 때 변하지 않는 불변값(invariants)을 발견할 수 있도록 돕는 교육용 웹 애플리케이션입니다.

## 📱 주요 특징

### 🎯 핵심 기능
- **스마트폰 뷰포트 UI**: 우측에 실제 스마트폰처럼 생긴 화면에서 인터랙티브 학습
- **4가지 도형 지원**: 삼각형, 사각형, 원, 평행사변형
- **실시간 불변값 감지**: 각도의 합, 비율, π(파이) 등 자동 인식
- **자동 채점 시스템**: 발견한 불변값과 효율성에 따른 점수 부여
- **진행도 추적**: 모든 학습 활동과 점수 기록
- **리더보드**: 학생들 간 경쟁 요소

### 🔐 사용자 관리
- 회원가입/로그인 시스템
- 개인 대시보드
- 학습 통계 및 분석
- 프로필 관리

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9+
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Canvas API**: HTML5 Canvas for shape rendering
- **Session Management**: PHP Sessions
- **Security**: CSRF protection, password hashing, SQL injection prevention

## 📋 시스템 요구사항

### 서버 요구사항
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- PHP Extensions:
  - PDO
  - PDO_MySQL
  - mbstring
  - JSON

### 브라우저 요구사항
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- HTML5 Canvas 지원 필수

## 🚀 설치 방법

### 1단계: 파일 설치

```bash
# 웹 서버 디렉토리로 파일 복사
cp -r webapp /var/www/html/invariant-finder
cd /var/www/html/invariant-finder

# 권한 설정
chmod -R 755 .
chown -R www-data:www-data .
```

### 2단계: 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 임포트
mysql -u root -p < database/schema.sql
```

또는 MySQL 클라이언트에서:

```sql
SOURCE /path/to/webapp/database/schema.sql;
```

### 3단계: 설정 파일 수정

`config.php` 파일을 열어서 데이터베이스 설정을 수정하세요:

```php
// Database Configuration
define('DB_HOST', 'localhost');          // DB 호스트
define('DB_NAME', 'invariant_finder');   // DB 이름
define('DB_USER', 'your_db_user');       // DB 사용자명
define('DB_PASS', 'your_db_password');   // DB 비밀번호

// Application Settings
define('APP_URL', 'http://yourdomain.com/invariant-finder');  // 실제 URL로 변경
```

### 4단계: 웹 서버 설정

#### Apache (.htaccess)

루트 디렉토리에 `.htaccess` 파일 생성:

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /invariant-finder/

    # Redirect to HTTPS (선택사항)
    # RewriteCond %{HTTPS} off
    # RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Remove index.php from URLs
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php/$1 [L]
</IfModule>

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Prevent access to sensitive files
<FilesMatch "(config\.php|\.sql|\.md)$">
    Order allow,deny
    Deny from all
</FilesMatch>
```

#### Nginx

`/etc/nginx/sites-available/invariant-finder` 설정:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html/invariant-finder;
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

    location ~ /\.(ht|git|sql) {
        deny all;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
}
```

### 5단계: 설치 확인

브라우저에서 다음 URL에 접속:

```
http://yourdomain.com/invariant-finder
```

기본 관리자 계정으로 로그인:
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **중요**: 첫 로그인 후 반드시 비밀번호를 변경하세요!

## 📖 사용 방법

### 학생용 가이드

#### 1. 회원가입 및 로그인
1. 웹사이트 방문
2. "Register" 클릭
3. 정보 입력 후 계정 생성
4. 로그인

#### 2. 활동 시작
1. 대시보드에서 활동 선택
2. 도형 유형 확인 (삼각형, 사각형, 원, 평행사변형)
3. "Start" 버튼 클릭

#### 3. 도형 탐구
1. **슬라이더 조작**: 도형을 50%~200%로 확대/축소
2. **측정값 관찰**: 변하는 값과 변하지 않는 값 확인
3. **불변값 발견**:
   - 삼각형: 각도의 합 = 180°, 변의 비율
   - 직사각형: 모든 각 = 90°, 가로세로 비율
   - 원: π (원주 ÷ 지름) ≈ 3.14159
   - 평행사변형: 대각의 크기, 변의 비율

#### 4. 확인 및 제출
1. "Check Invariant" 버튼 클릭 - 발견한 불변값 자동 인식
2. 모든 불변값을 찾았다면 "Submit Answer" 클릭
3. 자동 채점 및 점수 확인

### 교사/관리자 가이드

#### 새로운 활동 추가 (MySQL)

```sql
INSERT INTO activities (title, description, shape_type, difficulty, show_hints, created_by)
VALUES (
    '고급 삼각형 탐구',
    '삼각형의 심화 불변 속성을 발견하세요.',
    'triangle',
    4,
    0,
    1  -- admin user ID
);
```

#### 학생 진행도 확인

```sql
-- 특정 학생의 통계
SELECT
    u.username,
    COUNT(*) as total_attempts,
    AVG(at.score) as avg_score,
    MAX(at.score) as best_score
FROM attempts at
JOIN users u ON at.user_id = u.id
WHERE u.id = 123
GROUP BY u.id;

-- 리더보드 조회
SELECT
    u.username,
    l.shape_type,
    l.avg_score,
    l.total_attempts
FROM leaderboard l
JOIN users u ON l.user_id = u.id
ORDER BY l.avg_score DESC
LIMIT 10;
```

## 📁 디렉토리 구조

```
webapp/
├── api/
│   └── ajax.php                 # AJAX 요청 처리 API
├── assets/
│   ├── css/
│   │   ├── style.css           # 메인 스타일시트
│   │   └── app-styles.css      # 앱 전용 스타일
│   ├── js/
│   │   └── invariantfinder.js  # 메인 JavaScript
│   └── img/                     # 이미지 파일
├── database/
│   └── schema.sql               # 데이터베이스 스키마
├── includes/
│   ├── auth.php                 # 인증 함수
│   ├── db.php                   # 데이터베이스 클래스
│   ├── functions.php            # 공통 함수
│   ├── header.php               # 공통 헤더
│   └── footer.php               # 공통 푸터
├── admin/                       # 관리자 페이지 (선택)
├── config.php                   # 메인 설정 파일
├── index.php                    # 랜딩 페이지
├── login.php                    # 로그인 페이지
├── register.php                 # 회원가입 페이지
├── logout.php                   # 로그아웃
├── dashboard.php                # 사용자 대시보드
├── app.php                      # 메인 앱 (스마트폰 뷰포트)
├── progress.php                 # 진행도 페이지
├── leaderboard.php              # 리더보드
├── profile.php                  # 프로필
└── README.md                    # 이 문서
```

## 🎨 커스터마이징

### 색상 변경

`assets/css/style.css`의 CSS 변수 수정:

```css
:root {
    --primary-color: #0066cc;
    --primary-hover: #0052a3;
    --success-color: #28a745;
    --danger-color: #dc3545;
    /* ... */
}
```

### 새로운 도형 추가

1. **database/schema.sql** - `shape_type` ENUM에 추가
2. **config.php** - `SHAPE_TYPES` 배열에 정의 추가
3. **assets/js/invariantfinder.js** - `shapeDefinitions` 객체에 추가

## 🔒 보안

### 구현된 보안 기능
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ CSRF 토큰 보호
- ✅ SQL Injection 방지 (PDO prepared statements)
- ✅ XSS 방지 (htmlspecialchars)
- ✅ Session hijacking 방지 (session regeneration)
- ✅ 입력 데이터 검증 및 정제

### 추가 권장 사항
1. **HTTPS 사용**: SSL 인증서 설치
2. **정기 백업**: 데이터베이스 자동 백업 설정
3. **업데이트**: PHP, MySQL 정기 업데이트
4. **방화벽**: 불필요한 포트 차단
5. **파일 권한**: 적절한 파일 권한 설정

## 🐛 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결방법**:
1. `config.php`의 DB 설정 확인
2. MySQL 서비스 상태 확인:
   ```bash
   sudo systemctl status mysql
   ```
3. DB 사용자 권한 확인:
   ```sql
   GRANT ALL PRIVILEGES ON invariant_finder.* TO 'user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 캔버스가 표시되지 않음

**증상**: 도형이 스마트폰 화면에 나타나지 않음

**해결방법**:
1. 브라우저 콘솔(F12) 확인
2. JavaScript 파일 경로 확인
3. 브라우저가 HTML5 Canvas를 지원하는지 확인

### 세션 문제

**증상**: 로그인이 유지되지 않음

**해결방법**:
1. PHP 세션 디렉토리 권한 확인:
   ```bash
   sudo chmod 777 /var/lib/php/sessions
   ```
2. `php.ini` 세션 설정 확인

### 파일 업로드 오류

PHP 설정 확인 (`php.ini`):
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
```

## 📊 데이터베이스 백업

### 자동 백업 스크립트

`backup.sh` 생성:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/invariant_finder"
DB_NAME="invariant_finder"
DB_USER="root"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

Cron job 추가:
```bash
crontab -e
# 매일 새벽 2시에 백업
0 2 * * * /path/to/backup.sh
```

## 🔄 업데이트

### 데이터베이스 마이그레이션

새로운 기능 추가 시:

```sql
-- 예: 새로운 컬럼 추가
ALTER TABLE attempts
ADD COLUMN hints_used INT(5) DEFAULT 0
AFTER time_spent;

-- 예: 새로운 테이블 추가
CREATE TABLE IF NOT EXISTS achievements (
    id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) UNSIGNED NOT NULL,
    achievement_type VARCHAR(50) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 📈 성능 최적화

### MySQL 최적화

```sql
-- 인덱스 확인
SHOW INDEX FROM attempts;

-- 느린 쿼리 확인
SHOW FULL PROCESSLIST;

-- 캐시 최적화
SET GLOBAL query_cache_size = 268435456;  -- 256MB
```

### PHP 캐싱

OPcache 활성화 (`php.ini`):
```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

## 📝 라이선스

GNU General Public License v3.0 or later

## 👥 크레딧

**개발**: KAIST Touch Math Academy
**버전**: 1.0.0
**제작일**: 2025-01-18

## 📞 지원

문제가 발생하거나 질문이 있으시면:

1. README를 먼저 확인하세요
2. PHP/MySQL 로그 확인
3. 브라우저 개발자 도구 콘솔 확인
4. GitHub Issues에 문의

## 🎉 기여

기여를 환영합니다! Pull Request를 보내주세요.

---

**Happy Learning! 📐✨**
