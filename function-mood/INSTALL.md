# Function Mood 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+
- **메모리**: 최소 512MB RAM
- **디스크**: 최소 100MB 여유 공간

### 선택적 요구사항
- **Moodle**: 3.7 (LMS 연동 시)
- **SSL 인증서**: HTTPS 사용 시

## 단계별 설치 가이드

### 1단계: 시스템 준비

#### Ubuntu/Debian

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# PHP 7.1 및 필수 확장 설치
sudo apt install -y php7.1 php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring php7.1-xml

# MySQL 설치
sudo apt install -y mysql-server-5.7

# Apache 설치
sudo apt install -y apache2 libapache2-mod-php7.1

# Apache 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

#### CentOS/RHEL

```bash
# PHP 7.1 설치
sudo yum install -y epel-release
sudo yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm
sudo yum-config-manager --enable remi-php71
sudo yum install -y php php-mysql php-curl php-json php-mbstring php-xml

# MySQL 5.7 설치
wget https://dev.mysql.com/get/mysql57-community-release-el7-11.noarch.rpm
sudo rpm -ivh mysql57-community-release-el7-11.noarch.rpm
sudo yum install -y mysql-server

# Apache 설치
sudo yum install -y httpd
sudo systemctl enable httpd
sudo systemctl start httpd
```

### 2단계: 프로젝트 설치

```bash
# 웹 루트로 이동
cd /var/www/html

# 프로젝트 복사
sudo cp -r /path/to/function-mood .

# 권한 설정
sudo chown -R www-data:www-data function-mood
sudo chmod -R 755 function-mood

# 또는 CentOS/RHEL의 경우
sudo chown -R apache:apache function-mood
sudo chmod -R 755 function-mood
```

### 3단계: 데이터베이스 설정

```bash
# MySQL 접속
sudo mysql -u root -p

# 데이터베이스 및 사용자 생성
CREATE DATABASE function_mood CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'function_mood_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON function_mood.* TO 'function_mood_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
cd /var/www/html/function-mood
mysql -u function_mood_user -p function_mood < database/schema.sql
```

### 4단계: 설정 파일 구성

```bash
# 설정 파일 열기
sudo nano config/config.php
```

다음 항목을 환경에 맞게 수정:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_mood');
define('DB_USER', 'function_mood_user');
define('DB_PASS', 'your_secure_password');

// Moodle Configuration (옵션)
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');

// Moodle Database (옵션)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
```

### 5단계: 웹 서버 설정

#### Apache 설정

```bash
# 가상 호스트 파일 생성
sudo nano /etc/apache2/sites-available/function-mood.conf
```

다음 내용 입력:

```apache
<VirtualHost *:80>
    ServerName function-mood.local
    ServerAlias www.function-mood.local
    DocumentRoot /var/www/html/function-mood

    <Directory /var/www/html/function-mood>
        Options Indexes FollowSymLinks MultiViews
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/function-mood-error.log
    CustomLog ${APACHE_LOG_DIR}/function-mood-access.log combined
</VirtualHost>
```

사이트 활성화:

```bash
sudo a2ensite function-mood.conf
sudo systemctl reload apache2
```

#### Nginx 설정

```bash
# Nginx 설정 파일 생성
sudo nano /etc/nginx/sites-available/function-mood
```

다음 내용 입력:

```nginx
server {
    listen 80;
    server_name function-mood.local;
    root /var/www/html/function-mood;
    index index.html index.php;

    # 로그
    access_log /var/log/nginx/function-mood-access.log;
    error_log /var/log/nginx/function-mood-error.log;

    # 메인 location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP 처리
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # API 라우팅
    location /api/ {
        try_files $uri $uri/ /api/index.php?$query_string;
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

사이트 활성화:

```bash
sudo ln -s /etc/nginx/sites-available/function-mood /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6단계: hosts 파일 설정 (로컬 테스트용)

```bash
# hosts 파일 편집
sudo nano /etc/hosts

# 다음 줄 추가
127.0.0.1    function-mood.local
```

### 7단계: 설치 확인

```bash
# PHP 버전 확인
php -v

# MySQL 연결 테스트
mysql -u function_mood_user -p function_mood -e "SHOW TABLES;"

# 웹 서버 상태 확인
sudo systemctl status apache2  # 또는 nginx
```

브라우저에서 접속:
```
http://function-mood.local
```

### 8단계: Moodle 연동 설정 (선택사항)

#### Moodle Web Service 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크
3. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
   - "REST 프로토콜" 활성화
4. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "추가" 클릭
   - 이름: "Function Mood API"
   - 활성화됨: 체크
5. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - "토큰 생성" 클릭
   - 사용자 및 서비스 선택
   - 생성된 토큰 복사하여 `config/config.php`에 설정

#### 연동 테스트

```bash
curl http://function-mood.local/api/index.php?path=test-connection
```

예상 결과:
```json
{
    "success": true,
    "site_name": "Your Moodle Site",
    "moodle_version": "Moodle 3.7"
}
```

## 문제 해결

### PHP 확장 누락 오류

```bash
# 필요한 PHP 확장 설치
sudo apt install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring php7.1-xml
sudo systemctl restart apache2
```

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# MySQL 재시작
sudo systemctl restart mysql

# 방화벽 확인 (필요 시)
sudo ufw allow 3306/tcp
```

### 권한 오류

```bash
# 올바른 권한 설정
sudo chown -R www-data:www-data /var/www/html/function-mood
sudo chmod -R 755 /var/www/html/function-mood
```

### Apache Rewrite 모듈 미활성화

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

## 프로덕션 배포 체크리스트

- [ ] PHP `display_errors` 비활성화
- [ ] 강력한 데이터베이스 비밀번호 설정
- [ ] HTTPS/SSL 인증서 설치
- [ ] 방화벽 규칙 설정
- [ ] 정기 백업 스케줄 설정
- [ ] 로그 로테이션 설정
- [ ] 보안 헤더 설정 확인
- [ ] Moodle 토큰 보안 관리
- [ ] API Rate Limiting 활성화
- [ ] 모니터링 도구 설정

## 다음 단계

설치가 완료되었습니다! 이제 다음을 수행할 수 있습니다:

1. **README.md** - 사용 방법 및 기능 설명
2. **API 문서** - API 엔드포인트 활용
3. **커스터마이징** - 감정 컬러 및 알고리즘 조정

즐거운 함수 분석 되세요! 📊
