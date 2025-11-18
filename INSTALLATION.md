# Boundary Slider 설치 가이드

Moodle 3.7, PHP 7.1.9, MySQL 5.7 환경을 위한 상세 설치 가이드입니다.

## 📋 사전 준비사항

### 필수 소프트웨어

```bash
# PHP 7.1.9 설치 확인
php -v

# MySQL 5.7 설치 확인
mysql --version

# Apache 설치 확인
apache2 -v
```

### PHP 필수 확장 모듈

```bash
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-xml php7.1-json
```

## 🔧 단계별 설치

### 1단계: 프로젝트 다운로드

```bash
# 웹 루트 디렉토리로 이동
cd /var/www/html

# 프로젝트 클론
git clone <repository-url> boundary-slider

# 디렉토리 이동
cd boundary-slider
```

### 2단계: MySQL 데이터베이스 설정

#### 2-1. 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p
```

```sql
-- Moodle 데이터베이스 생성 (이미 있다면 생략)
CREATE DATABASE IF NOT EXISTS moodle
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON moodle.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 접속 테스트
EXIT;
```

#### 2-2. 스키마 적용

```bash
# 스키마 파일 적용
mysql -u moodle_user -p moodle < db/schema.sql

# 적용 확인
mysql -u moodle_user -p moodle -e "SHOW TABLES LIKE 'mdl_boundary%';"
```

**예상 출력**:
```
+-----------------------------------+
| Tables_in_moodle (mdl_boundary%)  |
+-----------------------------------+
| mdl_boundary_answers              |
| mdl_boundary_interactions         |
| mdl_boundary_problems             |
+-----------------------------------+
```

### 3단계: 설정 파일 구성

#### 3-1. config.php 수정

```bash
# config.php 파일 수정
nano config.php
```

다음 정보를 실제 환경에 맞게 수정:

```php
define('DB_HOST', 'localhost');          // DB 호스트
define('DB_NAME', 'moodle');             // DB 이름
define('DB_USER', 'moodle_user');        // DB 사용자
define('DB_PASS', 'strong_password_here'); // DB 비밀번호
define('MOODLE_DIR', '/var/www/html/moodle'); // Moodle 설치 경로
```

#### 3-2. 연결 테스트

테스트용 PHP 파일 생성:

```bash
cat > test_connection.php << 'EOF'
<?php
require_once 'config.php';
$pdo = getDBConnection();
if ($pdo) {
    echo "✅ 데이터베이스 연결 성공!\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM mdl_boundary_problems");
    $result = $stmt->fetch();
    echo "샘플 문제 수: " . $result['count'] . "\n";
} else {
    echo "❌ 데이터베이스 연결 실패\n";
}
EOF

php test_connection.php
```

**성공 시 출력**:
```
✅ 데이터베이스 연결 성공!
샘플 문제 수: 4
```

### 4단계: 웹 서버 설정

#### Apache 설정

```bash
# 필수 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod deflate
sudo a2enmod expires

# Apache 재시작
sudo service apache2 restart
```

**가상 호스트 설정 (선택적)**:

```bash
sudo nano /etc/apache2/sites-available/boundary-slider.conf
```

```apache
<VirtualHost *:80>
    ServerName boundary-slider.local
    DocumentRoot /var/www/html/boundary-slider

    <Directory /var/www/html/boundary-slider>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/boundary-slider-error.log
    CustomLog ${APACHE_LOG_DIR}/boundary-slider-access.log combined
</VirtualHost>
```

```bash
# 사이트 활성화
sudo a2ensite boundary-slider.conf
sudo service apache2 reload
```

#### Nginx 설정 (대안)

```bash
sudo nano /etc/nginx/sites-available/boundary-slider
```

```nginx
server {
    listen 80;
    server_name boundary-slider.local;
    root /var/www/html/boundary-slider;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.(git|env) {
        deny all;
    }
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/boundary-slider /etc/nginx/sites-enabled/
sudo nginx -t
sudo service nginx reload
```

### 5단계: 파일 권한 설정

```bash
# 소유자 설정 (www-data는 Apache/Nginx 사용자)
sudo chown -R www-data:www-data /var/www/html/boundary-slider

# 디렉토리 권한
find /var/www/html/boundary-slider -type d -exec chmod 755 {} \;

# 파일 권한
find /var/www/html/boundary-slider -type f -exec chmod 644 {} \;

# 실행 권한 (PHP 파일)
chmod 755 /var/www/html/boundary-slider/api/*.php
```

### 6단계: 설치 확인

#### 6-1. 브라우저 접속

```
http://localhost/boundary-slider/index.php
```

또는 가상 호스트 설정 시:
```
http://boundary-slider.local
```

#### 6-2. API 테스트

```bash
# 문제 가져오기 테스트
curl http://localhost/boundary-slider/api/get_problem.php?id=1

# 예상 출력: JSON 응답
```

#### 6-3. 기능 테스트 체크리스트

- [ ] 메인 페이지 로딩
- [ ] 하한 슬라이더 조작
- [ ] 상한 슬라이더 조작
- [ ] 우측 하단 스마트폰 화면 표시 (데스크톱)
- [ ] 실시간 적분 표시 업데이트
- [ ] 답안 제출 버튼 작동
- [ ] 키보드 단축키 (화살표 키)

## 🔗 Moodle 연동 (선택적)

### Moodle 세션 통합

`config.php`에 Moodle 경로가 설정되어 있다면:

```php
// Moodle 설정 로드
require_once(MOODLE_DIR . '/config.php');
require_once(MOODLE_DIR . '/lib/moodlelib.php');

// 세션 확인
require_login();

// 사용자 ID 가져오기
$userid = $USER->id;
```

### Moodle 퀴즈 모듈과 연결

```sql
-- Moodle 퀴즈와 연동
UPDATE mdl_boundary_problems
SET quiz_id = 123
WHERE id = 1;
```

### LTI 통합 (고급)

향후 LTI (Learning Tools Interoperability) 표준을 통한 통합 가능.

## 🐛 트러블슈팅

### 문제 1: "Database connection failed"

**증상**: 데이터베이스 연결 오류

**해결**:
```bash
# MySQL 서비스 확인
sudo service mysql status

# MySQL 재시작
sudo service mysql restart

# config.php 정보 재확인
grep "DB_" config.php
```

### 문제 2: "Permission denied"

**증상**: 파일 권한 오류

**해결**:
```bash
# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/boundary-slider
chmod -R 755 /var/www/html/boundary-slider
```

### 문제 3: 404 Not Found (API)

**증상**: API 호출 시 404 오류

**해결**:
```bash
# mod_rewrite 활성화 확인
sudo a2enmod rewrite
sudo service apache2 restart

# .htaccess 파일 확인
ls -la .htaccess
```

### 문제 4: 슬라이더가 보이지 않음

**증상**: 빈 화면 또는 슬라이더 없음

**해결**:
```bash
# 브라우저 콘솔 확인 (F12)
# JavaScript 오류 확인

# 파일 경로 확인
ls -la js/
ls -la css/
```

### 문제 5: 스마트폰 화면이 안 보임

**증상**: 우측 하단 스마트폰 시뮬레이터 미표시

**해결**:
- 화면 너비 1400px 이상 필요
- 브라우저 창 크기 확대
- 또는 `css/styles.css`에서 `@media (max-width: 1400px)` 수정

## 📊 설치 후 작업

### 샘플 데이터 확인

```sql
-- 샘플 문제 확인
SELECT id, title, function_expression, difficulty
FROM mdl_boundary_problems;
```

### 관리자 계정으로 문제 추가

```sql
INSERT INTO mdl_boundary_problems
(title, description, function_expression, min_bound, max_bound,
 correct_lower, correct_upper, difficulty)
VALUES
('새로운 문제', '설명', 'f(x)', -10, 10, 0, 5, '중급');
```

### 로그 모니터링

```bash
# Apache 오류 로그
tail -f /var/log/apache2/error.log

# PHP 오류 로그
tail -f /var/log/php7.1-fpm.log
```

## ✅ 설치 완료

모든 단계를 완료하면 Boundary Slider가 정상적으로 작동합니다!

다음 단계:
1. 문제 추가
2. Moodle 퀴즈와 연동
3. 학생에게 URL 공유

## 📞 지원

설치 중 문제가 발생하면:
- 이슈 트래커에 오류 로그와 함께 문의
- `test_connection.php` 실행 결과 첨부
- 환경 정보 (PHP 버전, MySQL 버전) 포함

---

**설치 시간**: 약 30분
**난이도**: 중급
**권장 환경**: Ubuntu 18.04+, PHP 7.1.9, MySQL 5.7
