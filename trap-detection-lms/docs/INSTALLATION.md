# Trap Detection LMS - 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4 또는 Nginx
- **Moodle**: 3.7 (LTI 연동 시)

### PHP 확장 모듈
- PDO
- PDO_MySQL
- mbstring
- json
- session

## 설치 단계

### 1. 프로젝트 다운로드

```bash
cd /var/www/html
git clone <repository-url> trap-detection-lms
cd trap-detection-lms
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

또는 MySQL 프롬프트에서:

```sql
SOURCE /path/to/trap-detection-lms/database/schema.sql;
```

### 3. 환경 변수 설정

`.env` 파일 생성 (선택사항):

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=trap_detection_lms
DB_USER=root
DB_PASS=your_password

# LTI Configuration
LTI_CONSUMER_KEY=trap_detection_key
LTI_CONSUMER_SECRET=your_secure_secret_here

# Moodle Integration
MOODLE_URL=http://your-moodle-site.com
MOODLE_API_TOKEN=your_moodle_webservice_token
```

또는 `config/database.php` 및 `config/app.php` 파일을 직접 수정하세요.

### 4. 디렉토리 권한 설정

```bash
# storage 디렉토리 생성
mkdir -p storage/logs

# 권한 설정
chmod -R 755 public
chmod -R 777 storage
```

### 5. 웹 서버 설정

#### Apache 설정

`.htaccess` 파일이 이미 포함되어 있습니다. Apache에서 `mod_rewrite`가 활성화되어 있는지 확인하세요:

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

VirtualHost 설정 예시:

```apache
<VirtualHost *:80>
    ServerName trap-detection.yourdomain.com
    DocumentRoot /var/www/html/trap-detection-lms/public

    <Directory /var/www/html/trap-detection-lms/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/trap-detection-error.log
    CustomLog ${APACHE_LOG_DIR}/trap-detection-access.log combined
</VirtualHost>
```

#### Nginx 설정

Nginx 설정 예시:

```nginx
server {
    listen 80;
    server_name trap-detection.yourdomain.com;
    root /var/www/html/trap-detection-lms/public;
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

### 6. 설치 확인

웹 브라우저로 접속하여 확인:

```
http://your-domain.com/
```

정상적으로 메인 페이지가 표시되어야 합니다.

## Moodle LTI 연동 설정

### 1. Moodle에서 External Tool 추가

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 활동 모듈 > External tool > Manage tools** 이동
3. **Configure a tool manually** 클릭

### 2. LTI 도구 설정

다음 정보를 입력하세요:

| 필드 | 값 |
|------|-----|
| Tool name | Trap Detection LMS |
| Tool URL | `http://your-domain.com/moodle-integration/lti/launch.php` |
| Consumer key | `trap_detection_key` (또는 설정한 키) |
| Shared secret | `your_secure_secret_here` (설정한 비밀키) |
| Default launch container | New window |
| Privacy | Share launcher's name, email |

### 3. 과정에 External Tool 추가

1. 원하는 과정으로 이동
2. **활동 또는 리소스 추가**
3. **External tool** 선택
4. 위에서 설정한 **Trap Detection LMS** 선택
5. 저장

### 4. 테스트

External tool 링크를 클릭하면 Trap Detection LMS로 자동 로그인됩니다.

## 샘플 데이터 삽입 (테스트용)

```sql
-- 샘플 문제 추가
INSERT INTO questions (question_text, question_type, difficulty_level, subject, topic) VALUES
('2/3 + 1/3 = ?', 'multichoice', 1, 'mathematics', 'fractions'),
('5 × 7 = ?', 'multichoice', 1, 'mathematics', 'multiplication');

-- 문제 1의 선택지
INSERT INTO question_options (question_id, option_text, is_correct, option_order) VALUES
(1, '3/6', 0, 1),
(1, '3/3 = 1', 1, 2),
(1, '2/6', 0, 3),
(1, '1/3', 0, 4);

-- 문제 2의 선택지
INSERT INTO question_options (question_id, option_text, is_correct, option_order) VALUES
(2, '12', 0, 1),
(2, '35', 1, 2),
(2, '57', 0, 3),
(2, '42', 0, 4);

-- 샘플 함정 추가
INSERT INTO traps (question_id, option_id, trap_type, trap_description, explanation, severity) VALUES
(1, 1, 'conceptual', '분자와 분모를 구분하지 못함', '분수의 덧셈은 분모가 같을 때 분자만 더합니다. 3/6은 분자를 더하고 분모도 더한 잘못된 답입니다.', 'high'),
(1, 3, 'procedural', '분모를 더함', '분수의 덧셈에서 분모는 그대로 두고 분자만 더해야 합니다.', 'medium');
```

## 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결 방법:**
1. MySQL 서비스가 실행 중인지 확인: `sudo systemctl status mysql`
2. `config/database.php`에서 데이터베이스 설정 확인
3. MySQL 사용자 권한 확인

### LTI 연동 실패

```
Invalid LTI request
```

**해결 방법:**
1. Consumer key와 shared secret이 일치하는지 확인
2. 서버 시간이 정확한지 확인 (OAuth timestamp 검증)
3. HTTPS 사용 권장 (보안)
4. Apache/Nginx 로그 확인

### 권한 오류

```
Permission denied
```

**해결 방법:**
```bash
sudo chown -R www-data:www-data /var/www/html/trap-detection-lms
chmod -R 755 public
chmod -R 777 storage
```

## 보안 설정

### 1. 비밀키 변경

`config/app.php`에서 다음 값들을 반드시 변경하세요:
- `lti.consumer_secret`
- 데이터베이스 비밀번호

### 2. HTTPS 설정 (권장)

Let's Encrypt를 사용한 무료 SSL 인증서:

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d trap-detection.yourdomain.com
```

### 3. 방화벽 설정

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 업데이트

```bash
cd /var/www/html/trap-detection-lms
git pull origin main

# 데이터베이스 마이그레이션 (필요시)
mysql -u root -p trap_detection_lms < database/migrations/xxx.sql
```

## 지원

문제가 발생하면 다음을 확인하세요:
1. Apache/Nginx error log: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`
2. PHP error log: `/var/log/php/error.log`
3. Application log: `storage/logs/`

이슈 리포트: [GitHub Issues]

---

**설치 완료!** 🎉

이제 Trap Detection LMS를 사용할 준비가 되었습니다.
