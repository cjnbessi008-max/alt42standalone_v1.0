# Slope Sound 설치 가이드

## 시스템 요구사항

### 서버 환경
- **운영체제**: Linux (Ubuntu 18.04+, CentOS 7+ 권장)
- **웹서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 (Moodle 3.7 호환)
- **MySQL**: 5.7+
- **Moodle**: 3.7

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|mysqli|json|mbstring|curl|xml|zip|gd|intl'
```

필수 확장:
- pdo_mysql
- mysqli
- json
- mbstring
- curl
- xml
- zip
- gd
- intl

### 클라이언트 요구사항
- 모던 웹 브라우저 (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- JavaScript 활성화
- Web Audio API 지원
- HTML5 Canvas 지원

## 단계별 설치

### Step 1: 파일 다운로드 및 압축 해제

```bash
# 프로젝트 다운로드
cd /tmp
git clone https://github.com/your-repo/slope-sound.git

# 또는 압축 파일 다운로드
wget https://example.com/slope-sound.zip
unzip slope-sound.zip
```

### Step 2: Moodle 플러그인 설치

```bash
# Moodle 루트 디렉토리 확인
MOODLE_DIR="/var/www/html/moodle"

# 플러그인 디렉토리 생성 (없을 경우)
sudo mkdir -p $MOODLE_DIR/local

# 플러그인 복사
sudo cp -r slope_sound/moodle_plugin $MOODLE_DIR/local/slopesound

# 권한 설정 (웹서버 사용자에 맞게 변경)
sudo chown -R www-data:www-data $MOODLE_DIR/local/slopesound
sudo chmod -R 755 $MOODLE_DIR/local/slopesound
```

### Step 3: Moodle에서 플러그인 인식

1. 웹 브라우저에서 Moodle 관리자로 로그인
2. **Site administration** → **Notifications** 메뉴 접속
3. 새로운 플러그인 감지 메시지 확인
4. **Upgrade Moodle database now** 클릭
5. 설치 완료 확인

또는 CLI로 설치:

```bash
cd $MOODLE_DIR
sudo -u www-data php admin/cli/upgrade.php
```

### Step 4: 데이터베이스 설정

#### 방법 A: MySQL 커맨드라인

```bash
# MySQL 접속
mysql -u root -p

# Moodle 데이터베이스 선택
USE moodle;

# 스키마 임포트
source /tmp/slope_sound/database/schema.sql;

# 테이블 확인
SHOW TABLES LIKE 'mdl_slopesound%';

# 샘플 데이터 확인
SELECT * FROM mdl_slopesound_problems;

# 종료
exit;
```

#### 방법 B: phpMyAdmin

1. phpMyAdmin 접속
2. Moodle 데이터베이스 선택
3. **Import** 탭 클릭
4. `database/schema.sql` 파일 선택
5. **Go** 클릭

### Step 5: 웹앱 배포

#### 옵션 A: Moodle 내부 배포 (권장)

```bash
# 웹앱을 플러그인 내부에 배포
sudo cp -r slope_sound/webapp $MOODLE_DIR/local/slopesound/

# 권한 설정
sudo chown -R www-data:www-data $MOODLE_DIR/local/slopesound/webapp
sudo chmod -R 755 $MOODLE_DIR/local/slopesound/webapp

# 접속 URL
# https://your-moodle-site.com/local/slopesound/webapp/
```

Moodle API 경로 확인 (`webapp/js/moodle-api.js`):
```javascript
constructor(baseUrl = '/local/slopesound/api.php') {
    // 자동으로 올바른 경로 사용
}
```

#### 옵션 B: 독립 웹서버 배포

```bash
# 웹 서버 루트에 배포
WEB_ROOT="/var/www/html"
sudo cp -r slope_sound/webapp $WEB_ROOT/slope-sound

# 권한 설정
sudo chown -R www-data:www-data $WEB_ROOT/slope-sound
sudo chmod -R 755 $WEB_ROOT/slope-sound

# 접속 URL
# https://your-site.com/slope-sound/
```

**중요**: 독립 배포 시 설정 수정 필요

`webapp/api/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');          // Moodle DB 이름
define('DB_USER', 'moodle_user');     // DB 사용자
define('DB_PASS', 'your_password');   // DB 비밀번호
define('DB_PREFIX', 'mdl_');          // Moodle 테이블 접두사
```

`webapp/js/moodle-api.js`:
```javascript
// Moodle API 대신 독립 API 사용
constructor(baseUrl = '/slope-sound/api/standalone_api.php') {
    this.baseUrl = baseUrl;
}
```

### Step 6: Apache 설정 (독립 배포 시)

```bash
# Apache 설정 파일 생성
sudo nano /etc/apache2/sites-available/slope-sound.conf
```

설정 내용:
```apache
<VirtualHost *:80>
    ServerName slope-sound.example.com
    DocumentRoot /var/www/html/slope-sound

    <Directory /var/www/html/slope-sound>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # PHP 설정
    <FilesMatch \.php$>
        SetHandler "proxy:unix:/run/php/php7.1-fpm.sock|fcgi://localhost"
    </FilesMatch>

    ErrorLog ${APACHE_LOG_DIR}/slope-sound-error.log
    CustomLog ${APACHE_LOG_DIR}/slope-sound-access.log combined
</VirtualHost>
```

활성화:
```bash
sudo a2ensite slope-sound
sudo a2enmod rewrite
sudo a2enmod proxy_fcgi
sudo systemctl restart apache2
```

### Step 7: 권한 확인

```bash
# Moodle 플러그인 테이블 접근 권한
mysql -u moodle_user -p moodle -e "SHOW GRANTS;"

# 필요 권한: SELECT, INSERT, UPDATE, DELETE
# 다음 테이블에 대해:
# - mdl_slopesound_problems
# - mdl_slopesound_attempts
# - mdl_slopesound_audio_events
```

### Step 8: 테스트

#### 플러그인 API 테스트
```bash
# 문제 목록 가져오기
curl -b cookies.txt "https://your-moodle-site.com/local/slopesound/api.php?action=get_problems"
```

#### 웹앱 접속 테스트
1. 브라우저에서 웹앱 URL 접속
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭에서 에러 확인
4. Network 탭에서 API 요청 확인

#### 기능 테스트
- [ ] 문제 목록 로딩
- [ ] 문제 선택 시 그래프 표시
- [ ] 마우스/터치로 그래프 탐색
- [ ] 사운드 재생
- [ ] 진행도 업데이트

## 문제 해결

### 1. 플러그인이 Moodle에서 인식되지 않음

**증상**: Notifications 페이지에 새 플러그인이 표시되지 않음

**해결**:
```bash
# 파일 권한 확인
ls -la $MOODLE_DIR/local/slopesound

# 소유자가 www-data가 아니면 변경
sudo chown -R www-data:www-data $MOODLE_DIR/local/slopesound

# version.php 확인
cat $MOODLE_DIR/local/slopesound/version.php

# 캐시 정리
cd $MOODLE_DIR
sudo -u www-data php admin/cli/purge_caches.php
```

### 2. 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결**:
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# Moodle 설정 확인
cat $MOODLE_DIR/config.php | grep -A5 'dbtype'

# 독립 배포 시
cat /var/www/html/slope-sound/api/config.php

# 연결 테스트
mysql -h localhost -u moodle_user -p moodle -e "SELECT 1;"
```

### 3. API 요청 실패 (404 Not Found)

**증상**: 브라우저 Console에 "Failed to load resource: 404"

**해결**:
```bash
# Apache 재작성 모듈 활성화
sudo a2enmod rewrite
sudo systemctl restart apache2

# .htaccess 파일 생성 (필요시)
cat > $MOODLE_DIR/local/slopesound/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /local/slopesound/
</IfModule>
EOF

# API 파일 존재 확인
ls -la $MOODLE_DIR/local/slopesound/api.php
```

### 4. CORS 오류

**증상**: "Access to fetch at ... has been blocked by CORS policy"

**해결** (독립 배포 시):

`api/standalone_api.php` 상단에 추가:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');
```

**또는** Apache 설정:
```apache
<Directory /var/www/html/slope-sound>
    Header set Access-Control-Allow-Origin "*"
</Directory>
```

```bash
sudo a2enmod headers
sudo systemctl restart apache2
```

### 5. 사운드 재생 안됨

**증상**: 그래프는 동작하지만 소리가 나지 않음

**해결**:
- 브라우저의 자동재생 정책: 사용자가 한 번 클릭한 후 초기화됨
- 브라우저 호환성 확인:
  ```javascript
  // Console에서 테스트
  window.AudioContext || window.webkitAudioContext
  ```
- HTTPS 사용 권장 (일부 브라우저는 HTTP에서 Web Audio API 제한)

### 6. 그래프가 표시되지 않음

**증상**: 캔버스가 비어있음

**해결**:
```javascript
// Console에서 디버그
console.log(window.app.currentPoints);
console.log(window.app.mathEngine.evaluate('x^2', 2)); // 4여야 함
```

### 7. PHP 오류

**증상**: "Call to undefined function ..."

**해결**:
```bash
# PHP 확장 설치
sudo apt-get update
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json

# Apache 재시작
sudo systemctl restart apache2

# PHP 오류 로그 확인
sudo tail -f /var/log/apache2/error.log
```

## 성능 최적화

### 1. JavaScript 압축

```bash
# UglifyJS 설치
npm install -g uglify-js

# 파일 압축
cd /var/www/html/slope-sound/js
for file in *.js; do
    uglifyjs "$file" -c -m -o "${file%.js}.min.js"
done

# HTML에서 .min.js 사용
```

### 2. MySQL 인덱스 최적화

```sql
-- 자주 사용하는 쿼리에 대한 인덱스 추가됨 (schema.sql에 포함)
SHOW INDEX FROM mdl_slopesound_problems;
SHOW INDEX FROM mdl_slopesound_attempts;
```

### 3. Apache 캐싱

```apache
<Directory /var/www/html/slope-sound>
    # 브라우저 캐싱 활성화
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType image/png "access plus 1 year"
    </IfModule>
</Directory>
```

```bash
sudo a2enmod expires
sudo systemctl restart apache2
```

## 보안 강화

### 1. HTTPS 설정

```bash
# Let's Encrypt 인증서
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d slope-sound.example.com
```

### 2. PHP 보안 설정

`/etc/php/7.1/apache2/php.ini`:
```ini
expose_php = Off
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
```

### 3. 파일 업로드 제한

`.htaccess`:
```apache
<Files "*.php">
    php_value upload_max_filesize 2M
    php_value post_max_size 2M
</Files>
```

## 업그레이드

```bash
# 백업
sudo cp -r $MOODLE_DIR/local/slopesound /backup/slopesound_$(date +%Y%m%d)
mysqldump -u root -p moodle mdl_slopesound_problems mdl_slopesound_attempts mdl_slopesound_audio_events > /backup/slopesound_db_$(date +%Y%m%d).sql

# 새 버전 설치
sudo cp -r slope_sound_new/moodle_plugin/* $MOODLE_DIR/local/slopesound/

# Moodle 업그레이드 실행
cd $MOODLE_DIR
sudo -u www-data php admin/cli/upgrade.php
```

## 제거

```bash
# 1. Moodle에서 플러그인 제거
cd $MOODLE_DIR
sudo -u www-data php admin/cli/uninstall_plugins.php --plugins=local_slopesound

# 2. 파일 삭제
sudo rm -rf $MOODLE_DIR/local/slopesound

# 3. 데이터베이스 정리 (데이터 보존하려면 생략)
mysql -u root -p moodle << 'EOF'
DROP TABLE IF EXISTS mdl_slopesound_audio_events;
DROP TABLE IF EXISTS mdl_slopesound_attempts;
DROP TABLE IF EXISTS mdl_slopesound_problems;
EOF
```

## 지원

추가 지원이 필요하면:
- GitHub Issues: https://github.com/your-repo/slope-sound/issues
- 이메일: support@example.com
