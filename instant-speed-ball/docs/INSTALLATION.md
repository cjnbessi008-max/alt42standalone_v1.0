# Instant Speed Ball - 설치 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [독립 웹앱 설치](#독립-웹앱-설치)
4. [Moodle 모듈 설치](#moodle-모듈-설치)
5. [설정 및 테스트](#설정-및-테스트)
6. [문제 해결](#문제-해결)

## 시스템 요구사항

### 서버 환경
- **운영체제**: Linux (Ubuntu 18.04+ 권장) 또는 Windows Server
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 이상 (Moodle 3.7 호환)
- **MySQL**: 5.7 이상 또는 MariaDB 10.2+
- **디스크 공간**: 최소 50MB

### PHP 확장 모듈
```bash
# 필수 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|mysqli|mbstring|json'
```

필요한 확장:
- `pdo`
- `pdo_mysql`
- `mysqli`
- `mbstring`
- `json`

### 클라이언트 (학생 브라우저)
- Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- JavaScript 활성화
- Canvas API 지원

## 데이터베이스 설정

### 1. MySQL 데이터베이스 생성

```bash
# MySQL에 root로 접속
mysql -u root -p
```

```sql
-- Moodle 데이터베이스가 없다면 생성
CREATE DATABASE moodle DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'secure_password_here';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 연결 테스트
EXIT;
```

### 2. 스키마 적용

```bash
# 프로젝트 루트 디렉토리로 이동
cd instant-speed-ball

# 스키마 SQL 실행
mysql -u moodle_user -p moodle < database/schema.sql
```

### 3. 테이블 생성 확인

```bash
mysql -u moodle_user -p moodle
```

```sql
-- 테이블 확인
SHOW TABLES LIKE 'isb_%';

-- 샘플 데이터 확인
SELECT COUNT(*) FROM isb_problems;
-- 5개의 샘플 문제가 있어야 함

-- 테이블 구조 확인
DESCRIBE isb_problems;
DESCRIBE isb_student_attempts;
```

## 독립 웹앱 설치

### Apache 서버

#### 1. 파일 복사

```bash
# 웹앱 디렉토리를 Apache 문서 루트로 복사
sudo cp -r webapp /var/www/html/instant-speed-ball

# 소유권 설정
sudo chown -R www-data:www-data /var/www/html/instant-speed-ball

# 권한 설정
sudo chmod -R 755 /var/www/html/instant-speed-ball
```

#### 2. API 설정 파일 수정

```bash
sudo nano /var/www/html/instant-speed-ball/api/config.php
```

다음 내용을 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_actual_password');
```

**프로덕션 환경에서는 다음도 수정:**

```php
// 에러 출력 비활성화
ini_set('display_errors', 0);
error_reporting(0);

// CORS 제한
header('Access-Control-Allow-Origin: https://yourdomain.com');
```

#### 3. Apache 설정 (선택사항)

```bash
sudo nano /etc/apache2/sites-available/instant-speed-ball.conf
```

```apache
<VirtualHost *:80>
    ServerName speedball.yourdomain.com
    DocumentRoot /var/www/html/instant-speed-ball

    <Directory /var/www/html/instant-speed-ball>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/speedball_error.log
    CustomLog ${APACHE_LOG_DIR}/speedball_access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite instant-speed-ball.conf
sudo systemctl reload apache2
```

### Nginx 서버

#### 1. 파일 복사

```bash
sudo cp -r webapp /var/www/instant-speed-ball
sudo chown -R www-data:www-data /var/www/instant-speed-ball
sudo chmod -R 755 /var/www/instant-speed-ball
```

#### 2. Nginx 설정

```bash
sudo nano /etc/nginx/sites-available/instant-speed-ball
```

```nginx
server {
    listen 80;
    server_name speedball.yourdomain.com;
    root /var/www/instant-speed-ball;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

```bash
# 심볼릭 링크 생성 및 Nginx 재시작
sudo ln -s /etc/nginx/sites-available/instant-speed-ball /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. 웹앱 테스트

브라우저에서 접속:
- Apache: `http://your-server/instant-speed-ball/`
- Nginx: `http://speedball.yourdomain.com/`

## Moodle 모듈 설치

### 방법 1: 수동 설치 (권장)

#### 1. 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 모듈 디렉토리에 복사
sudo cp -r /path/to/instant-speed-ball/moodle-module/mod_instantspeedball mod/

# 소유권 설정 (Moodle과 동일하게)
sudo chown -R www-data:www-data mod/instantspeedball
```

#### 2. 웹앱 통합

```bash
# 웹앱을 모듈 내부로 복사
sudo cp -r webapp mod/instantspeedball/

# 또는 심볼릭 링크 생성 (권장)
sudo ln -s /var/www/html/instant-speed-ball mod/instantspeedball/webapp
```

#### 3. Moodle 업그레이드

1. Moodle 관리자로 로그인
2. Site administration → Notifications
3. "Upgrade Moodle database now" 클릭
4. 업그레이드 진행

### 방법 2: ZIP을 통한 설치

#### 1. ZIP 파일 생성

```bash
cd instant-speed-ball/moodle-module
zip -r instantspeedball.zip mod_instantspeedball/
```

#### 2. Moodle UI를 통한 설치

1. Moodle 관리자로 로그인
2. Site administration → Plugins → Install plugins
3. "Choose a file..." 클릭하여 ZIP 파일 선택
4. "Install plugin from the ZIP file" 클릭
5. 플러그인 검증 후 "Install plugin!" 클릭
6. 업그레이드 계속 진행

#### 3. 웹앱 복사 (수동)

```bash
sudo cp -r webapp /path/to/moodle/mod/instantspeedball/
```

### 설치 확인

1. Site administration → Plugins → Activity modules
2. "Instant Speed Ball" 확인
3. 버전 정보 확인: `v1.0.0`

## 설정 및 테스트

### 1. 코스에 활동 추가

1. 코스 페이지로 이동
2. "Turn editing on" 클릭
3. 섹션에서 "Add an activity or resource" 클릭
4. "Instant Speed Ball" 선택
5. 활동 설정:
   - **Name**: "순간변화율 학습"
   - **Description**: 활동 설명 입력
6. "Save and display" 클릭

### 2. 기능 테스트

#### 테스트 체크리스트

- [ ] 스마트폰 프레임이 우측 하단에 표시됨
- [ ] 문제 정보가 올바르게 로드됨
- [ ] "시작" 버튼 클릭 시 공이 움직임
- [ ] 실시간 그래프가 업데이트됨
- [ ] 위치, 속도 메트릭이 정확함
- [ ] 일시정지/재개 버튼 작동
- [ ] 초기화 버튼 작동
- [ ] 답안 제출 시 정답 판정
- [ ] 데이터베이스에 시도 기록됨

### 3. 데이터베이스 기록 확인

```sql
-- 학생 시도 기록 확인
SELECT * FROM isb_student_attempts ORDER BY attempted_at DESC LIMIT 10;

-- 문제별 통계
SELECT
    p.title,
    COUNT(a.id) as attempts,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct,
    ROUND(SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id), 2) as success_rate
FROM isb_problems p
LEFT JOIN isb_student_attempts a ON p.id = a.problem_id
GROUP BY p.id, p.title;
```

## 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결:**
```bash
# 1. MySQL 서버 상태 확인
sudo systemctl status mysql

# 2. 연결 테스트
mysql -u moodle_user -p moodle

# 3. PHP PDO 확장 확인
php -m | grep pdo

# 4. config.php 설정 확인
cat /var/www/html/instant-speed-ball/api/config.php
```

### 빈 화면 또는 JavaScript 오류

**증상**: 공이 표시되지 않음

**해결:**
```bash
# 1. 브라우저 콘솔 확인 (F12)
# 2. 파일 권한 확인
ls -la /var/www/html/instant-speed-ball/js/

# 3. 웹 서버 에러 로그 확인
sudo tail -f /var/log/apache2/error.log
# 또는
sudo tail -f /var/log/nginx/error.log
```

### CORS 오류

**증상**: API 요청 실패

**해결:**
```php
// config.php에서 CORS 설정 확인
header('Access-Control-Allow-Origin: *'); // 개발 환경
// 또는
header('Access-Control-Allow-Origin: https://yourdomain.com'); // 프로덕션
```

### Moodle 모듘 활성화 안됨

**증상**: 활동 목록에 "Instant Speed Ball"이 없음

**해결:**
```bash
# 1. 파일 위치 확인
ls -la /path/to/moodle/mod/instantspeedball/

# 2. version.php 확인
cat /path/to/moodle/mod/instantspeedball/version.php

# 3. Moodle 캐시 비우기
sudo -u www-data php /path/to/moodle/admin/cli/purge_caches.php

# 4. 수동으로 업그레이드 실행
sudo -u www-data php /path/to/moodle/admin/cli/upgrade.php
```

### 웹앱 경로 오류 (Moodle 내)

**증상**: iframe에 404 오류

**해결:**
```bash
# 1. 웹앱 경로 확인
ls -la /path/to/moodle/mod/instantspeedball/webapp/

# 2. view.php에서 경로 수정
nano /path/to/moodle/mod/instantspeedball/view.php

# $webappurl 변수 확인
```

## 성능 최적화

### 1. PHP OpCache 활성화

```bash
sudo nano /etc/php/7.1/apache2/php.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### 2. MySQL 쿼리 캐시

```sql
SET GLOBAL query_cache_size = 67108864;
SET GLOBAL query_cache_type = 1;
```

### 3. 정적 파일 압축 (Nginx)

```nginx
gzip on;
gzip_types text/css application/javascript;
```

## 보안 체크리스트

- [ ] 프로덕션에서 PHP 에러 출력 비활성화
- [ ] 데이터베이스 비밀번호 강력하게 설정
- [ ] HTTPS 사용 (Let's Encrypt 권장)
- [ ] CORS 제한적으로 설정
- [ ] 파일 업로드 비활성화 (필요없음)
- [ ] SQL Injection 방지 (Prepared Statements 사용됨)

## 다음 단계

설치가 완료되었다면:

1. [사용자 가이드](USER_GUIDE.md) 확인
2. 추가 문제 생성
3. 스타일 커스터마이징
4. 학생 피드백 수집

## 지원

문제가 계속되면:
- GitHub Issues: [링크]
- 이메일: support@example.com
