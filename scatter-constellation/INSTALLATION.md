# Scatter Constellation - 설치 가이드

이 문서는 Scatter Constellation 앱의 상세한 설치 가이드입니다.

## 📋 시스템 요구사항

### 서버 요구사항
- **OS**: Linux (Ubuntu 18.04+, CentOS 7+) 또는 Windows Server
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **디스크 공간**: 최소 500MB

### PHP 확장 모듈
- php-mysql (PDO 지원)
- php-curl
- php-json
- php-mbstring
- php-xml

### Moodle 요구사항
- **Moodle 버전**: 3.7 이상
- **Web Services**: 활성화 필요
- **API Token**: 생성 필요

## 🔧 단계별 설치

### 1단계: 환경 확인

#### PHP 버전 확인
```bash
php -v
# PHP 7.1.9 이상이어야 함
```

#### MySQL 버전 확인
```bash
mysql --version
# MySQL 5.7 이상이어야 함
```

#### 필요한 PHP 모듈 확인
```bash
php -m | grep -E "pdo|mysql|curl|json|mbstring"
```

모듈이 없다면 설치:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install php7.1-mysql php7.1-curl php7.1-json php7.1-mbstring php7.1-xml
```

**CentOS/RHEL:**
```bash
sudo yum install php71-php-mysqlnd php71-php-curl php71-php-json php71-php-mbstring php71-php-xml
```

### 2단계: 파일 배포

#### 웹 서버 디렉토리에 복사
```bash
# Apache 기본 경로
sudo cp -r scatter-constellation /var/www/html/

# 또는 Nginx 기본 경로
sudo cp -r scatter-constellation /usr/share/nginx/html/

# 디렉토리 이동
cd /var/www/html/scatter-constellation
```

#### 권한 설정
```bash
# 소유자 설정 (Apache 사용자)
sudo chown -R www-data:www-data /var/www/html/scatter-constellation

# 또는 Nginx 사용자
sudo chown -R nginx:nginx /usr/share/nginx/html/scatter-constellation

# 파일 권한 설정
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# config.php는 더 제한적으로
chmod 600 config.example.php
```

### 3단계: 데이터베이스 설정

#### MySQL 접속
```bash
mysql -u root -p
```

#### 데이터베이스 생성
```sql
-- 데이터베이스 생성
CREATE DATABASE scatter_constellation
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 사용자 생성
CREATE USER 'scatter_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';

-- 권한 부여
GRANT ALL PRIVILEGES ON scatter_constellation.* TO 'scatter_user'@'localhost';

-- 권한 적용
FLUSH PRIVILEGES;

-- 종료
EXIT;
```

#### 스키마 임포트
```bash
mysql -u scatter_user -p scatter_constellation < database/schema.sql
```

#### 검증
```bash
mysql -u scatter_user -p scatter_constellation -e "SHOW TABLES;"
```

다음 테이블들이 보여야 합니다:
- problems
- constellation_points
- student_progress
- constellation_connections
- courses
- app_sessions
- app_settings

### 4단계: 애플리케이션 설정

#### config.php 생성
```bash
cp config.example.php config.php
chmod 600 config.php
```

#### config.php 편집
```bash
nano config.php
# 또는
vi config.php
```

다음 항목들을 수정:

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');           // MySQL 호스트
define('DB_NAME', 'scatter_constellation'); // 데이터베이스 이름
define('DB_USER', 'scatter_user');         // 데이터베이스 사용자
define('DB_PASS', 'StrongPassword123!');   // 데이터베이스 비밀번호

// Moodle 통합 설정
define('MOODLE_URL', 'http://your-moodle.com'); // Moodle URL
define('MOODLE_TOKEN', 'your_token_here');      // Web Service 토큰

// 디버그 설정 (운영 환경에서는 false)
define('APP_DEBUG', true);
```

### 5단계: Moodle Web Services 설정

#### 5.1 Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**으로 이동
3. "Enable web services" 체크박스 활성화
4. 저장

#### 5.2 Web Service 프로토콜 활성화

1. **사이트 관리 > 서버 > Web services > 프로토콜 관리**
2. "REST protocol" 활성화

#### 5.3 Web Service 사용자 생성

1. **사이트 관리 > 사용자 > 계정 > 새 사용자 추가**
2. 다음 정보로 사용자 생성:
   - 사용자명: `webservice_user`
   - 이메일: `webservice@yourdomain.com`
   - 비밀번호: 강력한 비밀번호 설정

#### 5.4 역할 생성

1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. "새 역할 추가" 클릭
3. 다음 권한 부여:
   - `webservice/rest:use`
   - `moodle/course:view`
   - `moodle/course:viewhiddencourses`
   - `mod/quiz:view`
   - `gradereport/user:view`

#### 5.5 외부 서비스 생성

1. **사이트 관리 > 서버 > Web services > 외부 서비스**
2. "추가" 클릭
3. 설정:
   - 이름: `Scatter Constellation Service`
   - 짧은 이름: `scatter_service`
   - 활성화: 체크
4. "함수 추가" 클릭하여 다음 함수들 추가:
   - `core_course_get_courses`
   - `core_course_get_contents`
   - `mod_quiz_get_quizzes_by_courses`
   - `gradereport_user_get_grade_items`

#### 5.6 토큰 생성

1. **사이트 관리 > 서버 > Web services > 토큰 관리**
2. "추가" 클릭
3. 설정:
   - 사용자: 위에서 생성한 `webservice_user` 선택
   - 서비스: `Scatter Constellation Service` 선택
4. "저장" 클릭
5. **생성된 토큰을 복사**하여 `config.php`의 `MOODLE_TOKEN`에 입력

### 6단계: 웹 서버 설정

#### Apache 설정

**가상 호스트 생성** (`/etc/apache2/sites-available/scatter-constellation.conf`):

```apache
<VirtualHost *:80>
    ServerName scatter-constellation.yourdomain.com
    DocumentRoot /var/www/html/scatter-constellation

    <Directory /var/www/html/scatter-constellation>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/scatter-error.log
    CustomLog ${APACHE_LOG_DIR}/scatter-access.log combined
</VirtualHost>
```

**활성화**:
```bash
sudo a2ensite scatter-constellation
sudo a2enmod rewrite
sudo systemctl reload apache2
```

#### Nginx 설정

**서버 블록 생성** (`/etc/nginx/sites-available/scatter-constellation`):

```nginx
server {
    listen 80;
    server_name scatter-constellation.yourdomain.com;
    root /usr/share/nginx/html/scatter-constellation;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    location ~ /\.ht {
        deny all;
    }

    location ~ /config\.php$ {
        deny all;
    }
}
```

**활성화**:
```bash
sudo ln -s /etc/nginx/sites-available/scatter-constellation /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7단계: 테스트

#### 기본 접속 테스트
```bash
# 로컬에서
curl http://localhost/scatter-constellation/

# 또는 브라우저에서
http://your-server/scatter-constellation/
```

#### API 엔드포인트 테스트
```bash
# 코스 목록 가져오기
curl http://localhost/scatter-constellation/api/courses.php

# 특정 코스의 문제 가져오기 (course_id는 실제 ID로 변경)
curl http://localhost/scatter-constellation/api/problems.php?course_id=1
```

#### 데이터베이스 연결 테스트
```php
<?php
// test-db.php
require_once('config.php');
require_once('lib/db.php');

try {
    $db = Database::getInstance();
    echo "Database connection successful!\n";

    $settings = $db->fetchAll("SELECT * FROM app_settings");
    echo "Settings count: " . count($settings) . "\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

```bash
php test-db.php
```

## ✅ 설치 확인 체크리스트

- [ ] PHP 7.1.9+ 설치 확인
- [ ] MySQL 5.7+ 설치 확인
- [ ] 필요한 PHP 모듈 설치 확인
- [ ] 데이터베이스 생성 및 스키마 임포트
- [ ] config.php 설정 완료
- [ ] 파일 권한 설정 완료
- [ ] Moodle Web Services 활성화
- [ ] Web Service 토큰 생성 및 설정
- [ ] 웹 서버 설정 완료
- [ ] 브라우저에서 접속 확인
- [ ] API 엔드포인트 동작 확인

## 🐛 문제 해결

### 데이터베이스 연결 오류
```
Database connection failed: Access denied
```

**해결방법**:
1. MySQL 사용자 비밀번호 확인
2. `config.php`의 DB 설정 확인
3. MySQL 사용자 권한 확인:
```sql
SHOW GRANTS FOR 'scatter_user'@'localhost';
```

### Moodle API 연결 오류
```
Moodle API error: HTTP 403
```

**해결방법**:
1. Moodle Web Services 활성화 확인
2. 토큰이 올바른지 확인
3. 외부 서비스에 필요한 함수들이 추가되었는지 확인

### 500 Internal Server Error

**해결방법**:
1. Apache/Nginx 에러 로그 확인:
```bash
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log
```

2. PHP 에러 로그 확인:
```bash
tail -f /var/log/php7.1-fpm.log
```

3. `config.php`에서 `APP_DEBUG`를 `true`로 설정하여 자세한 오류 확인

## 📞 지원

설치 중 문제가 발생하면:
1. 에러 로그 확인
2. 체크리스트 재확인
3. 브라우저 개발자 도구 콘솔 확인

---

설치 완료 후 [README.md](README.md)의 사용법을 참고하세요.
