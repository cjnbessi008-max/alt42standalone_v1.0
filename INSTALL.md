# 설치 가이드

Moodle Self-Grading Math System 설치 및 설정 가이드입니다.

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [서버 설정](#서버-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [애플리케이션 설정](#애플리케이션-설정)
5. [Moodle LTI 설정](#moodle-lti-설정)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 요구사항

- **PHP**: 7.1.9 이상
  - Extensions: PDO, PDO_MySQL, cURL, JSON, mbstring
- **MySQL**: 5.7 이상
- **웹서버**: Apache 2.4+ 또는 Nginx 1.10+
- **Moodle**: 3.7 이상

### 선택 사항

- **Claude API Key**: AI 검증 기능 사용시 필요 (https://console.anthropic.com)

## 서버 설정

### 1. Apache 설정

**가상 호스트 설정 (`/etc/apache2/sites-available/selfgrading.conf`)**

```apache
<VirtualHost *:80>
    ServerName selfgrading.example.com
    DocumentRoot /var/www/alt42standalone_v1.0/public

    <Directory /var/www/alt42standalone_v1.0/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # 로그 설정
    ErrorLog ${APACHE_LOG_DIR}/selfgrading_error.log
    CustomLog ${APACHE_LOG_DIR}/selfgrading_access.log combined
</VirtualHost>
```

**활성화**
```bash
sudo a2ensite selfgrading
sudo a2enmod rewrite
sudo systemctl reload apache2
```

### 2. Nginx 설정

**사이트 설정 (`/etc/nginx/sites-available/selfgrading`)**

```nginx
server {
    listen 80;
    server_name selfgrading.example.com;
    root /var/www/alt42standalone_v1.0/public;

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

    location ~ /\.ht {
        deny all;
    }

    access_log /var/log/nginx/selfgrading_access.log;
    error_log /var/log/nginx/selfgrading_error.log;
}
```

**활성화**
```bash
sudo ln -s /etc/nginx/sites-available/selfgrading /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. PHP 설정

**필수 확장 확인**
```bash
php -m | grep -E "pdo|curl|json|mbstring"
```

**php.ini 설정 (`/etc/php/7.1/apache2/php.ini` 또는 `/etc/php/7.1/fpm/php.ini`)**

```ini
; 파일 업로드 크기
upload_max_filesize = 10M
post_max_size = 10M

; 실행 시간
max_execution_time = 300
max_input_time = 300

; 메모리
memory_limit = 256M

; 타임존
date.timezone = Asia/Seoul

; 에러 리포팅 (프로덕션)
display_errors = Off
log_errors = On
error_log = /var/log/php_errors.log
```

## 데이터베이스 설정

### 1. MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE moodle_selfgrading CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'selfgrading_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON moodle_selfgrading.* TO 'selfgrading_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 스키마 임포트

```bash
cd /var/www/alt42standalone_v1.0
mysql -u selfgrading_user -p moodle_selfgrading < database/migrations/001_initial_schema.sql
```

### 3. 데이터베이스 확인

```bash
mysql -u selfgrading_user -p moodle_selfgrading -e "SHOW TABLES;"
```

예상 출력:
```
+--------------------------------+
| Tables_in_moodle_selfgrading   |
+--------------------------------+
| lti_consumers                   |
| lti_sessions                    |
| problem_verifications           |
| problems                        |
| student_submissions             |
| users                           |
+--------------------------------+
```

## 애플리케이션 설정

### 1. 파일 권한 설정

```bash
cd /var/www/alt42standalone_v1.0

# 소유권 설정 (Apache의 경우)
sudo chown -R www-data:www-data .

# 또는 Nginx의 경우
sudo chown -R nginx:nginx .

# 로그 및 업로드 디렉토리 쓰기 권한
sudo chmod -R 755 logs uploads
```

### 2. 설정 파일 생성

```bash
cd src/config
cp config.php config.php
nano config.php
```

**주요 설정 항목:**

```php
// 데이터베이스
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'moodle_selfgrading');
define('DB_USER', 'selfgrading_user');
define('DB_PASS', 'your_database_password');

// 애플리케이션
define('APP_URL', 'http://selfgrading.example.com'); // 실제 URL로 변경
define('APP_ENV', 'production'); // production 또는 development

// AI 설정 (Claude API)
define('AI_ENABLED', true); // AI 사용 여부
define('CLAUDE_API_KEY', 'sk-ant-your-api-key-here'); // Claude API 키
```

### 3. 로그 디렉토리 생성

```bash
mkdir -p logs uploads
chmod 755 logs uploads
```

## Moodle LTI 설정

### 1. LTI Consumer 키 생성

**데이터베이스에서 기본 키 확인:**
```bash
mysql -u selfgrading_user -p moodle_selfgrading -e "SELECT consumer_key, consumer_secret FROM lti_consumers;"
```

출력 예시:
```
+------------------+--------------------+
| consumer_key     | consumer_secret    |
+------------------+--------------------+
| moodle_key_dev   | moodle_secret_dev  |
+------------------+--------------------+
```

**프로덕션용 새 키 생성:**
```sql
INSERT INTO lti_consumers (consumer_key, consumer_secret, consumer_name, institution, enabled)
VALUES
('moodle_prod_key', 'super_secret_key_change_this', 'Moodle Production', 'KAIST', 1);
```

### 2. Moodle에서 외부 도구 추가

#### 관리자 설정

1. **Moodle 관리자로 로그인**

2. **외부 도구 설정**
   - `사이트 관리` → `플러그인` → `활동 모듈` → `외부 도구` → `도구 관리`

3. **새 도구 추가**
   - `외부 도구 설정` 클릭

4. **설정 입력**

   ```
   도구 이름: Math Self-Grading
   도구 URL: http://selfgrading.example.com/lti/launch
   Consumer Key: moodle_prod_key
   Shared Secret: super_secret_key_change_this
   ```

5. **고급 설정**
   ```
   ✓ 성적을 도구에서 받아옴
   ✓ 사용자 이름을 전송
   ✓ 사용자 이메일을 전송
   ```

6. **저장**

#### 코스에 추가

1. **코스로 이동**

2. **활동 추가**
   - `활동 또는 자원 추가` → `외부 도구` 선택

3. **도구 선택**
   - `미리 구성된 도구` → `Math Self-Grading` 선택

4. **설정**
   ```
   활동 이름: 수학 자기평가 문제
   점수: 100점 (또는 원하는 점수)
   ```

5. **저장 후 활동으로 돌아가기**

## 테스트

### 1. 기본 접속 테스트

```bash
# 홈 페이지 접속
curl -I http://selfgrading.example.com/
```

예상 응답: `HTTP/1.1 200 OK`

### 2. 데이터베이스 연결 테스트

```bash
php -r "
require 'src/config/config.php';
require 'src/lib/Database.php';
try {
    \$db = Database::getInstance();
    echo 'Database connection: OK\n';
} catch (Exception \$e) {
    echo 'Database connection failed: ' . \$e->getMessage() . '\n';
}
"
```

### 3. LTI 테스트

1. **Moodle 코스에서 외부 도구 클릭**

2. **예상 동작:**
   - LTI 인증 후 시스템으로 리디렉션
   - 역할에 따라 대시보드로 이동
   - 세션 생성 확인

3. **로그 확인:**
```bash
tail -f logs/$(date +%Y-%m-%d).log
```

### 4. AI 검증 테스트 (선택사항)

**테스트 스크립트:**
```bash
php -r "
require 'src/config/config.php';
require 'src/autoload.php';

\$verifier = new AIVerifier();
\$problem = [
    'problem_statement' => '2 + 2 = ?',
    'correct_answer' => '4'
];
\$result = \$verifier->verifyStudentWork(
    \$problem,
    '4',
    'I checked by counting on my fingers'
);
print_r(\$result);
"
```

## 문제 해결

### 문제: 데이터베이스 연결 실패

**증상:**
```
Database connection failed
```

**해결:**
1. MySQL 서비스 확인: `sudo systemctl status mysql`
2. 사용자 권한 확인: `mysql -u selfgrading_user -p`
3. `config.php`의 DB 설정 확인

### 문제: LTI 인증 실패

**증상:**
```
Invalid LTI launch request
OAuth signature validation failed
```

**해결:**
1. Consumer Key와 Secret 일치 확인
2. 시스템 시간 동기화 확인: `sudo ntpdate pool.ntp.org`
3. HTTPS 사용 여부 확인 (HTTP/HTTPS 불일치 시 서명 오류)
4. 로그 확인: `tail -f logs/*.log`

### 문제: 페이지가 로드되지 않음

**증상:**
```
404 Not Found 또는 500 Internal Server Error
```

**해결:**
1. 웹서버 에러 로그 확인
   - Apache: `/var/log/apache2/selfgrading_error.log`
   - Nginx: `/var/log/nginx/selfgrading_error.log`
2. PHP 에러 로그 확인: `/var/log/php_errors.log`
3. 파일 권한 확인: `ls -la public/`
4. `.htaccess` 또는 nginx rewrite 규칙 확인

### 문제: AI 검증이 작동하지 않음

**증상:**
```
AI verification failed
```

**해결:**
1. Claude API 키 확인: `config.php`의 `CLAUDE_API_KEY`
2. cURL 확장 확인: `php -m | grep curl`
3. 방화벽 설정 확인 (api.anthropic.com 접속 허용)
4. API 키 유효성 확인:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
```

### 문제: 성적이 Moodle로 전송되지 않음

**증상:**
- 학생이 제출했지만 Moodle 성적부에 반영되지 않음

**해결:**
1. Moodle 외부 도구 설정에서 "성적을 도구에서 받아옴" 체크 확인
2. LTI Outcome Service URL 확인:
```bash
mysql -u selfgrading_user -p moodle_selfgrading -e "SELECT lis_outcome_service_url FROM lti_sessions WHERE session_id='...';"
```
3. 로그에서 성적 전송 확인:
```bash
grep "Grade sent to Moodle" logs/*.log
```

## 보안 체크리스트

프로덕션 배포 전 확인사항:

- [ ] `config.php`의 `APP_ENV`를 `production`으로 설정
- [ ] 강력한 데이터베이스 비밀번호 사용
- [ ] LTI Consumer Secret 변경 (기본값 사용 금지)
- [ ] HTTPS 사용 (Let's Encrypt 권장)
- [ ] 파일 권한 적절히 설정 (755/644)
- [ ] PHP `display_errors = Off` 설정
- [ ] 방화벽 설정 (필요한 포트만 개방)
- [ ] 정기적인 로그 모니터링 설정

## 업데이트

새 버전으로 업데이트시:

```bash
cd /var/www/alt42standalone_v1.0

# 백업
sudo tar -czf backup-$(date +%Y%m%d).tar.gz .

# Git pull 또는 파일 교체
git pull origin main

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u selfgrading_user -p moodle_selfgrading < database/migrations/002_*.sql

# 캐시 클리어 (있는 경우)
# ...

# 권한 재설정
sudo chown -R www-data:www-data .
```

## 추가 지원

- **문서**: 프로젝트 `docs/` 폴더 참조
- **로그**: `logs/` 폴더에서 에러 추적
- **이슈**: GitHub Issues 또는 프로젝트 관리자에게 문의

---

설치 완료! 🎉

문제가 발생하면 로그를 확인하고 위의 문제 해결 섹션을 참조하세요.
