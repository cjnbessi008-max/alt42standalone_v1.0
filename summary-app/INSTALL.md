# 설치 가이드 - 1문장 핵심 요약 시스템

## 빠른 설치 (5분)

### 1단계: 파일 배포

```bash
# 웹 서버 디렉토리로 이동
cd /var/www/html

# 프로젝트 복사 (또는 Git clone)
cp -r /path/to/summary-app ./

# 권한 설정
chmod -R 755 summary-app
chown -R www-data:www-data summary-app
```

### 2단계: 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE summary_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'summary_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON summary_system.* TO 'summary_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 임포트
mysql -u summary_user -p summary_system < summary-app/sql/schema.sql
```

### 3단계: 설정 파일 수정

```bash
cd summary-app

# .env 파일 생성 (선택사항)
cp .env.example .env
nano .env
```

또는 `config/database.php` 직접 수정:

```php
return [
    'host' => 'localhost',
    'database' => 'summary_system',
    'username' => 'summary_user',
    'password' => 'your_secure_password',
    // ...
];
```

### 4단계: Moodle 설정

#### Moodle에서 Web Services 활성화

1. **관리 > 사이트 관리 > 고급 기능**
   - ✅ "웹 서비스 활성화" 체크
   - 저장

2. **관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
   - ✅ REST 프로토콜 활성화

3. **관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭
   - 이름: `Summary System`
   - 약식 이름: `summary_system`
   - 활성화: ✅
   - 저장

4. **함수 추가** (방금 만든 서비스에)
   - `core_user_get_users_by_field`
   - `core_course_get_courses`
   - `core_enrol_get_users_courses`
   - `core_completion_get_activities_completion_status`
   - `core_webservice_get_site_info`
   - `mod_quiz_get_quizzes_by_courses`

5. **관리 > 플러그인 > 웹 서비스 > 관리 토큰**
   - "토큰 만들기" 클릭
   - 사용자: 관리자 또는 권한 있는 사용자
   - 서비스: `Summary System`
   - 토큰 생성
   - **토큰 복사** (나중에 사용)

#### 데이터베이스에 Moodle 정보 입력

```sql
mysql -u summary_user -p summary_system

UPDATE settings SET setting_value = 'https://your-moodle-site.com'
WHERE setting_key = 'moodle_url';

UPDATE settings SET setting_value = 'your_moodle_token_here'
WHERE setting_key = 'moodle_token';

EXIT;
```

### 5단계: Claude API 설정 (선택사항)

AI 피드백 기능을 사용하려면:

1. [Anthropic 웹사이트](https://console.anthropic.com/)에서 API 키 발급

2. 데이터베이스에 API 키 입력:

```sql
mysql -u summary_user -p summary_system

UPDATE settings SET setting_value = 'your_claude_api_key'
WHERE setting_key = 'claude_api_key';

UPDATE settings SET setting_value = '1'
WHERE setting_key = 'ai_enabled';

EXIT;
```

### 6단계: 접속 테스트

#### 학습자 페이지

```
http://your-domain/summary-app/public/index.php?user_id=1&course_id=101&activity_id=1001&activity_name=테스트활동
```

#### 교사 대시보드

```
http://your-domain/summary-app/public/teacher.php
```

#### API 테스트

```bash
# 연결 테스트
curl http://your-domain/summary-app/api/get_summaries.php?course_id=101

# 요약 저장 테스트
curl -X POST http://your-domain/summary-app/api/save_summary.php \
  -H "Content-Type: application/json" \
  -d '{
    "moodle_user_id": 1,
    "moodle_course_id": 101,
    "moodle_activity_id": 1001,
    "activity_type": "quiz",
    "activity_name": "테스트 퀴즈",
    "summary_text": "이것은 테스트 요약입니다.",
    "generate_feedback": false
  }'
```

## 고급 설정

### Nginx 설정

`/etc/nginx/sites-available/summary-app`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/html/summary-app/public;
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

    location ~ /\.ht {
        deny all;
    }
}
```

활성화:
```bash
ln -s /etc/nginx/sites-available/summary-app /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL 설정 (Let's Encrypt)

```bash
apt-get install certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

### 로그 설정

`/var/log/summary-app/` 디렉토리 생성:

```bash
mkdir -p /var/log/summary-app
chown www-data:www-data /var/log/summary-app
chmod 755 /var/log/summary-app
```

PHP 로그 설정 (`php.ini`):

```ini
error_log = /var/log/summary-app/php_errors.log
log_errors = On
display_errors = Off
```

### 크론잡 설정 (정기 작업)

```bash
crontab -e

# 매일 자정에 오래된 로그 정리 (30일 이상)
0 0 * * * find /var/log/summary-app -name "*.log" -mtime +30 -delete

# 매주 일요일 데이터베이스 백업
0 2 * * 0 mysqldump -u summary_user -p'password' summary_system > /backup/summary_$(date +\%Y\%m\%d).sql
```

## 문제 해결

### PHP 확장 모듈 확인

```bash
php -m | grep -E 'pdo|mysqli|json|curl'
```

필요한 확장이 없으면:

```bash
# Ubuntu/Debian
apt-get install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring

# CentOS/RHEL
yum install php71-mysql php71-curl php71-json php71-mbstring
```

### 파일 권한 문제

```bash
# 웹 서버 사용자 확인
ps aux | grep apache
ps aux | grep nginx

# 권한 재설정
chown -R www-data:www-data /var/www/html/summary-app
chmod -R 755 /var/www/html/summary-app
```

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 상태 확인
systemctl status mysql

# 연결 테스트
mysql -u summary_user -p -h localhost summary_system
```

### API CORS 오류

`public/.htaccess` 또는 Nginx 설정에서 CORS 헤더 추가 확인

## 보안 체크리스트

- [ ] 데이터베이스 비밀번호를 강력하게 설정
- [ ] PHP `display_errors` 비활성화 (운영 환경)
- [ ] HTTPS 설정 (SSL/TLS)
- [ ] 파일 업로드 제한 설정
- [ ] 정기적인 보안 업데이트
- [ ] 백업 자동화 설정
- [ ] Moodle 토큰 보안 관리
- [ ] Claude API 키 암호화 저장
- [ ] SQL Injection 테스트
- [ ] XSS 공격 테스트

## 완료!

설치가 완료되었습니다. 문제가 발생하면 README.md의 트러블슈팅 섹션을 참고하세요.

---

**설치 지원**: 이슈를 등록해주세요.
