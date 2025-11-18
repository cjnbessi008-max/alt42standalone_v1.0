# Transform Scene 설치 가이드

이 문서는 Transform Scene 애플리케이션을 처음부터 설치하고 구성하는 방법을 단계별로 설명합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [시스템 준비](#시스템-준비)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [애플리케이션 설치](#애플리케이션-설치)
5. [Moodle 연동 설정](#moodle-연동-설정)
6. [웹 서버 설정](#웹-서버-설정)
7. [설치 확인](#설치-확인)
8. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 하드웨어

- **CPU**: 2 cores 이상
- **RAM**: 4GB 이상 (8GB 권장)
- **디스크**: 10GB 이상 여유 공간

### 소프트웨어

- **OS**: Ubuntu 18.04 LTS 이상 (또는 CentOS 7+)
- **Node.js**: 14.x 이상
- **npm**: 6.x 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Apache/Nginx**: 최신 안정 버전
- **Moodle**: 3.7 이상

---

## 시스템 준비

### 1. 시스템 업데이트

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. 필수 패키지 설치

```bash
# Ubuntu/Debian
sudo apt install -y \
  apache2 \
  mysql-server \
  php7.4 \
  php7.4-mysql \
  php7.4-json \
  php7.4-mbstring \
  php7.4-curl \
  php7.4-xml \
  nodejs \
  npm \
  git

# CentOS/RHEL
sudo yum install -y \
  httpd \
  mysql-server \
  php \
  php-mysql \
  php-json \
  php-mbstring \
  php-curl \
  php-xml \
  nodejs \
  npm \
  git
```

### 3. Node.js 버전 확인

```bash
node --version  # v14.x 이상이어야 함
npm --version   # v6.x 이상이어야 함
```

Node.js 버전이 낮은 경우:

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Node.js 14 설치
nvm install 14
nvm use 14
```

---

## 데이터베이스 설정

### 1. MySQL 시작 및 보안 설정

```bash
# MySQL 서비스 시작
sudo systemctl start mysql
sudo systemctl enable mysql

# 보안 설정 실행
sudo mysql_secure_installation
```

### 2. 데이터베이스 및 사용자 생성

```bash
# MySQL 접속
sudo mysql -u root -p
```

MySQL 콘솔에서:

```sql
-- 데이터베이스 생성
CREATE DATABASE moodle_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'moodle_user'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';

-- 권한 부여
GRANT ALL PRIVILEGES ON moodle_db.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

### 3. 스키마 적용

```bash
# 프로젝트 디렉토리에서
mysql -u moodle_user -p moodle_db < src/database/schema.sql
```

### 4. 데이터 확인

```bash
mysql -u moodle_user -p moodle_db
```

```sql
-- 테이블 목록 확인
SHOW TABLES;

-- 샘플 데이터 확인
SELECT * FROM transform_problems LIMIT 5;
SELECT * FROM transform_types;

EXIT;
```

---

## 애플리케이션 설치

### 1. 저장소 클론

```bash
# 적절한 디렉토리로 이동
cd /var/www/

# 저장소 클론
sudo git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 권한 설정
sudo chown -R $USER:$USER .
```

### 2. 의존성 설치

```bash
# npm 패키지 설치
npm install

# 설치 확인
npm list --depth=0
```

### 3. 환경 변수 설정

```bash
# .env 파일 생성
cp .env.example .env

# 편집
nano .env
```

`.env` 파일 내용:

```env
REACT_APP_MOODLE_API_URL=http://your-domain.com/moodle/api
REACT_APP_DEBUG_MODE=true
REACT_APP_LANGUAGE=ko
```

### 4. Moodle 설정 파일 수정

```bash
nano config/moodle_config.php
```

다음 값들을 수정:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle_db');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'YourStrongPassword123!');
define('MOODLE_API_URL', 'http://your-domain.com/moodle');
define('MOODLE_WS_TOKEN', 'your_actual_token_here');
```

### 5. 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 확인
ls -la build/
```

---

## Moodle 연동 설정

### 1. Moodle 웹 서비스 활성화

Moodle 관리자로 로그인 후:

1. **사이트 관리 → 고급 기능**
   - "웹 서비스 활성화" 체크
   - 저장

2. **사이트 관리 → 서버 → 웹 서비스 → 외부 서비스**
   - "서비스 추가" 클릭
   - 이름: "Transform Scene API"
   - 짧은 이름: "transform_scene"
   - 활성화: 체크

3. **함수 추가**
   - `core_course_get_courses`
   - `core_user_get_users`
   - `mod_quiz_get_quizzes_by_courses`

### 2. 토큰 생성

1. **사이트 관리 → 서버 → 웹 서비스 → 토큰 관리**
   - "토큰 추가" 클릭
   - 사용자 선택 (관리자 또는 교사)
   - 서비스: "Transform Scene API"
   - 저장

2. **생성된 토큰 복사**하여 `config/moodle_config.php`에 입력

### 3. CORS 설정

Moodle `config.php`에 추가:

```php
// CORS 허용
$CFG->webserviceprotocols = 'rest';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

---

## 웹 서버 설정

### Apache 설정

#### 1. Virtual Host 생성

```bash
sudo nano /etc/apache2/sites-available/transform-scene.conf
```

내용:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    DocumentRoot /var/www/alt42standalone_v1.0/build

    <Directory /var/www/alt42standalone_v1.0/build>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # React Router 지원
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # API 프록시
    Alias /api /var/www/alt42standalone_v1.0/src/api
    <Directory /var/www/alt42standalone_v1.0/src/api>
        Options +ExecCGI
        AllowOverride All
        Require all granted
        AddHandler php7-script .php
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/transform-scene-error.log
    CustomLog ${APACHE_LOG_DIR}/transform-scene-access.log combined
</VirtualHost>
```

#### 2. 사이트 활성화

```bash
# 모듈 활성화
sudo a2enmod rewrite
sudo a2enmod proxy
sudo a2enmod proxy_http

# 사이트 활성화
sudo a2ensite transform-scene.conf

# Apache 재시작
sudo systemctl restart apache2
```

### Nginx 설정 (선택사항)

```bash
sudo nano /etc/nginx/sites-available/transform-scene
```

내용:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/alt42standalone_v1.0/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        alias /var/www/alt42standalone_v1.0/src/api;
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_index index.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    error_log /var/log/nginx/transform-scene-error.log;
    access_log /var/log/nginx/transform-scene-access.log;
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/transform-scene /etc/nginx/sites-enabled/

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 설치 확인

### 1. 웹 브라우저 테스트

```
http://your-domain.com/?problem_id=1
```

다음을 확인:
- ✅ 페이지가 정상적으로 로드됨
- ✅ 그래프가 표시됨
- ✅ 애니메이션이 작동함

### 2. API 테스트

```bash
# 문제 데이터 가져오기
curl "http://your-domain.com/api/moodle_integration.php?action=get_problem&id=1"

# 예상 출력:
# {"success":true,"data":{...}}
```

### 3. 데이터베이스 연결 확인

```bash
php -r "
\$mysqli = new mysqli('localhost', 'moodle_user', 'YourPassword', 'moodle_db');
if (\$mysqli->connect_error) {
    die('Connection failed: ' . \$mysqli->connect_error);
}
echo 'Database connection successful!';
\$mysqli->close();
"
```

### 4. 로그 확인

```bash
# Apache 로그
tail -f /var/log/apache2/transform-scene-error.log

# PHP 오류가 없어야 함
```

---

## 문제 해결

### 문제 1: "Cannot connect to database"

**해결책**:
```bash
# MySQL 실행 확인
sudo systemctl status mysql

# 방화벽 확인
sudo ufw allow 3306/tcp

# 연결 테스트
mysql -u moodle_user -p -h localhost moodle_db
```

### 문제 2: "Permission denied"

**해결책**:
```bash
# 파일 권한 수정
sudo chown -R www-data:www-data /var/www/alt42standalone_v1.0
sudo chmod -R 755 /var/www/alt42standalone_v1.0
```

### 문제 3: "Module not found"

**해결책**:
```bash
# npm 캐시 정리
npm cache clean --force

# 재설치
rm -rf node_modules package-lock.json
npm install
```

### 문제 4: 빌드 실패

**해결책**:
```bash
# Node.js 버전 확인
node --version

# 메모리 증가
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

---

## 다음 단계

설치가 완료되었습니다! 이제:

1. **문제 추가**: Moodle에서 새 Transform Scene 문제 생성
2. **사용자 교육**: 교사와 학생에게 사용법 안내
3. **모니터링 설정**: 로그 및 성능 모니터링 구성
4. **백업 설정**: 정기적인 데이터베이스 백업 구성

자세한 사용 방법은 [README.md](README.md)를 참조하세요.

---

## 추가 지원

문제가 계속되면:

- **이메일**: support@kaist-touch-math.ac.kr
- **GitHub Issues**: https://github.com/your-org/alt42standalone_v1.0/issues
- **문서**: https://docs.transform-scene.com
