# 설치 가이드 (Installation Guide)

## 📋 사전 준비사항

### 필수 소프트웨어

1. **웹 서버**
   - Apache 2.4+ 또는 Nginx 1.18+
   - PHP 7.1.9 이상 설치됨

2. **데이터베이스**
   - MySQL 5.7 이상
   - 또는 MariaDB 10.2 이상

3. **Moodle LMS**
   - Moodle 3.7 설치 및 운영 중
   - 데이터베이스 읽기 권한 필요

### PHP 확장 모듈

다음 PHP 확장이 활성화되어 있어야 합니다:

```bash
# 확인 명령
php -m | grep -E 'pdo|mysqli|json|mbstring'

# 필요한 확장
- PDO
- pdo_mysql
- mysqli
- json
- mbstring
```

Ubuntu/Debian에서 설치:
```bash
sudo apt-get install php7.1-mysql php7.1-mbstring php7.1-json
```

CentOS/RHEL에서 설치:
```bash
sudo yum install php71-pdo php71-mysqlnd php71-mbstring php71-json
```

## 🚀 단계별 설치

### 1단계: 파일 다운로드 및 배포

#### 옵션 A: Git 클론
```bash
cd /var/www/html
git clone https://github.com/your-repo/concentration-analyzer.git
```

#### 옵션 B: 수동 복사
```bash
cd /var/www/html
cp -r /path/to/concentration-analyzer .
```

### 2단계: 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE concentration_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ca_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON concentration_analyzer.* TO 'ca_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
mysql -u ca_user -p concentration_analyzer < /var/www/html/concentration-analyzer/database/schema.sql
```

### 3단계: 설정 파일 수정

```bash
cd /var/www/html/concentration-analyzer
nano includes/config.php
```

다음 정보를 수정하세요:

```php
// ========== 메인 데이터베이스 설정 ==========
define('DB_HOST', 'localhost');           // MySQL 호스트
define('DB_NAME', 'concentration_analyzer'); // 데이터베이스 이름
define('DB_USER', 'ca_user');             // 사용자 이름
define('DB_PASS', 'strong_password_here'); // 비밀번호

// ========== Moodle 데이터베이스 설정 ==========
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');       // Moodle DB 이름
define('MOODLE_DB_USER', 'moodle_user');  // Moodle DB 사용자
define('MOODLE_DB_PASS', 'moodle_pass');  // Moodle DB 비밀번호
define('MOODLE_DB_PREFIX', 'mdl_');       // Moodle 테이블 접두사

// ========== 분석 설정 (선택) ==========
define('CONCENTRATION_WINDOW_MINUTES', 5);  // 집중도 계산 윈도우 (분)
define('FLUCTUATION_THRESHOLD', 1.5);       // 변동 탐지 임계값
```

### 4단계: 파일 권한 설정

```bash
# 소유자 설정
sudo chown -R www-data:www-data /var/www/html/concentration-analyzer

# 권한 설정
sudo chmod -R 755 /var/www/html/concentration-analyzer

# 로그 디렉토리 생성 (선택)
mkdir /var/www/html/concentration-analyzer/logs
sudo chmod 777 /var/www/html/concentration-analyzer/logs
```

### 5단계: 웹 서버 설정

#### Apache 설정

`/etc/apache2/sites-available/concentration-analyzer.conf` 파일 생성:

```apache
<VirtualHost *:80>
    ServerName concentration.yourdomain.com
    DocumentRoot /var/www/html/concentration-analyzer

    <Directory /var/www/html/concentration-analyzer>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/concentration_error.log
    CustomLog ${APACHE_LOG_DIR}/concentration_access.log combined
</VirtualHost>
```

활성화:
```bash
sudo a2ensite concentration-analyzer
sudo systemctl reload apache2
```

#### Nginx 설정

`/etc/nginx/sites-available/concentration-analyzer` 파일 생성:

```nginx
server {
    listen 80;
    server_name concentration.yourdomain.com;
    root /var/www/html/concentration-analyzer;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

활성화:
```bash
sudo ln -s /etc/nginx/sites-available/concentration-analyzer /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### 6단계: 데이터베이스 연결 테스트

간단한 테스트 파일 생성 (`test_connection.php`):

```php
<?php
require_once 'includes/config.php';
require_once 'includes/db.php';

try {
    $db = new Database();
    $conn = $db->getConnection();
    echo "✅ 메인 데이터베이스 연결 성공!\n";

    $moodleConn = $db->getMoodleConnection();
    echo "✅ Moodle 데이터베이스 연결 성공!\n";

    echo "\n모든 연결이 정상적으로 작동합니다!";
} catch (Exception $e) {
    echo "❌ 오류: " . $e->getMessage();
}
?>
```

실행:
```bash
php /var/www/html/concentration-analyzer/test_connection.php
```

### 7단계: 웹 브라우저 접속

브라우저에서 다음 주소로 접속:

```
http://concentration.yourdomain.com
또는
http://localhost/concentration-analyzer
```

## ✅ 설치 검증

### 체크리스트

- [ ] 메인 페이지가 정상적으로 로드됨
- [ ] "Moodle 데이터 동기화" 버튼 클릭 시 오류 없음
- [ ] 사용자 드롭다운에 데이터가 표시됨
- [ ] 그래프가 정상적으로 렌더링됨

### 테스트 데이터 삽입 (개발용)

```sql
-- 테스트 활동 로그 삽입
INSERT INTO user_activity_logs (user_id, course_id, activity_type, time_created)
VALUES
(1, 10, 'view', UNIX_TIMESTAMP(NOW() - INTERVAL 1 HOUR)),
(1, 10, 'click', UNIX_TIMESTAMP(NOW() - INTERVAL 55 MINUTE)),
(1, 10, 'submit', UNIX_TIMESTAMP(NOW() - INTERVAL 50 MINUTE)),
(1, 10, 'view', UNIX_TIMESTAMP(NOW() - INTERVAL 45 MINUTE)),
(1, 10, 'click', UNIX_TIMESTAMP(NOW() - INTERVAL 40 MINUTE));
```

## 🔧 선택 사항 설정

### 자동 동기화 설정 (Cron Job)

5분마다 Moodle 데이터 자동 동기화:

```bash
crontab -e

# 다음 라인 추가
*/5 * * * * curl -X POST http://localhost/concentration-analyzer/api/moodle_sync.php -d '{"action":"sync"}' -H "Content-Type: application/json" >> /var/log/moodle_sync.log 2>&1
```

또는 PHP CLI 사용:

```bash
*/5 * * * * php /var/www/html/concentration-analyzer/cron/sync_moodle.php >> /var/log/moodle_sync.log 2>&1
```

### HTTPS 설정 (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-apache
sudo certbot --apache -d concentration.yourdomain.com
```

### 성능 최적화

#### MySQL 인덱스 최적화
```sql
USE concentration_analyzer;
ANALYZE TABLE user_activity_logs;
ANALYZE TABLE concentration_metrics;
ANALYZE TABLE fluctuation_analysis;
```

#### PHP OPcache 활성화
```bash
# /etc/php/7.1/apache2/php.ini 또는 /etc/php/7.1/fpm/php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
```

## 🐛 문제 해결

### 문제 1: 데이터베이스 연결 오류

**증상:**
```
Error: 데이터베이스 연결 실패
```

**해결:**
1. MySQL 서비스 확인
   ```bash
   sudo systemctl status mysql
   ```

2. 사용자 권한 확인
   ```sql
   SHOW GRANTS FOR 'ca_user'@'localhost';
   ```

3. 방화벽 확인
   ```bash
   sudo ufw allow 3306/tcp
   ```

### 문제 2: Moodle 테이블 접근 오류

**증상:**
```
Error: Table 'moodle.mdl_logstore_standard_log' doesn't exist
```

**해결:**
1. Moodle 테이블 접두사 확인
   ```bash
   mysql -u moodle_user -p moodle -e "SHOW TABLES LIKE 'mdl_%';" | head
   ```

2. `config.php`에서 `MOODLE_DB_PREFIX` 수정

### 문제 3: Chart.js 로드 실패

**증상:** 그래프가 표시되지 않음

**해결:**
```bash
cd /var/www/html/concentration-analyzer/assets/vendor
curl -sL https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js -o chart.min.js
```

### 문제 4: 권한 오류

**증상:**
```
Warning: file_put_contents(): Permission denied
```

**해결:**
```bash
sudo chown -R www-data:www-data /var/www/html/concentration-analyzer
sudo chmod -R 755 /var/www/html/concentration-analyzer
```

## 📊 로그 및 디버깅

### 에러 로그 확인

#### Apache
```bash
tail -f /var/log/apache2/concentration_error.log
```

#### Nginx
```bash
tail -f /var/log/nginx/error.log
```

#### PHP 에러 로그
```bash
tail -f /var/log/php7.1-fpm.log
```

### 디버그 모드 활성화

`includes/config.php`에서:

```php
// 개발 환경
error_reporting(E_ALL);
ini_set('display_errors', 1);

// 프로덕션 환경
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/concentration_analyzer.log');
```

## 🔒 보안 체크리스트

- [ ] 프로덕션 환경에서 `display_errors` 비활성화
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] HTTPS 사용
- [ ] 정기적인 보안 업데이트
- [ ] 백업 자동화 설정
- [ ] 방화벽 설정 확인

## 📦 백업 및 복구

### 데이터베이스 백업

```bash
# 전체 백업
mysqldump -u ca_user -p concentration_analyzer > ca_backup_$(date +%Y%m%d).sql

# 테이블별 백업
mysqldump -u ca_user -p concentration_analyzer concentration_metrics > metrics_backup.sql
```

### 복구

```bash
mysql -u ca_user -p concentration_analyzer < ca_backup_20250118.sql
```

## 🎓 다음 단계

설치가 완료되면:

1. [README.md](README.md) 파일의 사용 방법 참조
2. Moodle 데이터 동기화 실행
3. 테스트 사용자로 분석 실행
4. 결과 확인 및 검증

---

**지원:** 문제가 발생하면 GitHub Issues 또는 support@example.com으로 문의하세요.
