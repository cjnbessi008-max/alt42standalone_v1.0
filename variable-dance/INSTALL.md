# Variable Dance 설치 가이드

## 빠른 설치 (Quick Start)

### 필수 요구사항 확인

```bash
# PHP 버전 확인
php -v
# PHP 7.1.9 이상이어야 함

# MySQL 버전 확인
mysql --version
# MySQL 5.7 이상이어야 함

# 필수 PHP 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|json|curl|mbstring'
```

---

## 1단계: 데이터베이스 설정

### MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE variable_dance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (선택사항, 보안 강화)
CREATE USER 'vdance_user'@'localhost' IDENTIFIED BY 'SecurePassword123!';
GRANT ALL PRIVILEGES ON variable_dance.* TO 'vdance_user'@'localhost';
FLUSH PRIVILEGES;

EXIT;
```

### 스키마 임포트

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/variable-dance

# 스키마 임포트
mysql -u root -p variable_dance < database/schema.sql

# 성공 확인
mysql -u root -p -e "USE variable_dance; SHOW TABLES;"
```

**예상 출력:**
```
+---------------------------+
| Tables_in_variable_dance  |
+---------------------------+
| learning_sessions         |
| moodle_config            |
| problems                 |
| variable_events          |
+---------------------------+
```

---

## 2단계: 설정 파일 수정

### config/config.php 편집

```bash
nano config/config.php
# 또는
vi config/config.php
```

**수정할 항목:**

```php
// 데이터베이스 설정
define('DB_HOST', 'localhost');        // MySQL 호스트
define('DB_NAME', 'variable_dance');   // 데이터베이스 이름
define('DB_USER', 'vdance_user');      // MySQL 사용자명
define('DB_PASS', 'SecurePassword123!'); // MySQL 비밀번호

// Moodle 설정 (Moodle 사용 시)
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_moodle_api_token');

// 디버그 모드 (개발 환경에서만 true)
define('DEBUG_MODE', true);  // 프로덕션에서는 false
```

---

## 3단계: 파일 권한 설정

### Linux/macOS

```bash
# 로그 디렉토리 생성
mkdir -p logs

# 권한 설정 (Apache 사용)
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod 640 config/config.php
sudo chmod 755 logs
sudo chmod 666 logs/app.log  # 로그 파일이 있다면

# 권한 설정 (Nginx 사용)
sudo chown -R nginx:nginx .
sudo chmod -R 755 .
sudo chmod 640 config/config.php
```

### Windows (XAMPP)

```batch
# 특별한 권한 설정 필요 없음
# logs 디렉토리만 생성
mkdir logs
```

---

## 4단계: 웹 서버 설정

### Apache

#### XAMPP (Windows/macOS)

1. XAMPP 컨트롤 패널에서 Apache와 MySQL 시작
2. `variable-dance` 폴더를 `C:\xampp\htdocs\` (Windows) 또는 `/Applications/XAMPP/htdocs/` (macOS)에 복사
3. 브라우저에서 접속: `http://localhost/variable-dance/public/`

#### Ubuntu/Debian

```bash
# Apache 설치 (미설치 시)
sudo apt update
sudo apt install apache2 php7.1 php7.1-mysql php7.1-curl php7.1-mbstring

# mod_rewrite 활성화
sudo a2enmod rewrite

# 가상 호스트 설정 (선택사항)
sudo nano /etc/apache2/sites-available/variable-dance.conf
```

**가상 호스트 설정 내용:**

```apache
<VirtualHost *:80>
    ServerName variable-dance.local
    DocumentRoot /var/www/html/variable-dance/public

    <Directory /var/www/html/variable-dance/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/variable-dance-error.log
    CustomLog ${APACHE_LOG_DIR}/variable-dance-access.log combined
</VirtualHost>
```

```bash
# 가상 호스트 활성화
sudo a2ensite variable-dance.conf

# Apache 재시작
sudo systemctl restart apache2

# hosts 파일 수정 (/etc/hosts)
echo "127.0.0.1 variable-dance.local" | sudo tee -a /etc/hosts
```

### Nginx

```bash
# Nginx 설치 (미설치 시)
sudo apt install nginx php7.1-fpm

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/variable-dance
```

**설정 내용:**

```nginx
server {
    listen 80;
    server_name variable-dance.local;

    root /var/www/html/variable-dance/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location /api/ {
        try_files $uri $uri/ =404;
    }

    location ~ /\.(ht|git|sql|log) {
        deny all;
    }
}
```

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/variable-dance /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl restart php7.1-fpm
```

---

## 5단계: 설치 확인

### 데이터베이스 연결 테스트

테스트 파일 생성: `test-db.php`

```php
<?php
require_once 'config/config.php';

try {
    $db = getDBConnection();
    echo "✅ 데이터베이스 연결 성공!\n";

    $stmt = $db->query("SELECT COUNT(*) as count FROM problems");
    $result = $stmt->fetch();
    echo "✅ 문제 수: " . $result['count'] . "개\n";

} catch (Exception $e) {
    echo "❌ 오류: " . $e->getMessage() . "\n";
}
?>
```

```bash
php test-db.php
```

**예상 출력:**
```
✅ 데이터베이스 연결 성공!
✅ 문제 수: 3개
```

### 웹 접속 테스트

브라우저에서 접속:

- **XAMPP**: `http://localhost/variable-dance/public/`
- **가상 호스트**: `http://variable-dance.local/`
- **IP 주소**: `http://192.168.x.x/variable-dance/public/`

**정상 동작 확인:**
1. ✅ 페이지가 로드됨
2. ✅ 3개의 샘플 문제가 표시됨
3. ✅ 문제 클릭 시 우측 하단에 스마트폰 화면 표시
4. ✅ 슬라이더 조작 시 해집합 변화

### API 테스트

브라우저 콘솔(F12)에서:

```javascript
// 문제 목록 가져오기
API.getAllProblems().then(console.log);

// 해집합 계산
API.calculateSolution(1, {a: 2, b: 4}).then(console.log);
```

---

## 6단계: Moodle 연동 (선택사항)

### Moodle Web Services 활성화

1. **Moodle 관리자 로그인**

2. **사이트 관리 > 고급 기능**
   - ✅ "웹 서비스 활성화" 체크
   - 저장

3. **사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리**
   - ✅ "REST 프로토콜" 활성화

4. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
   - "서비스 추가" 클릭
   - 이름: `Variable Dance API`
   - ✅ "활성화" 체크
   - 저장

5. **함수 추가**
   - 생성한 서비스 편집
   - 필요한 함수 추가:
     - `core_webservice_get_site_info`
     - `mod_quiz_get_quizzes_by_courses`
     - `mod_quiz_get_quiz_questions`

6. **토큰 생성**
   - **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
   - "토큰 생성" 클릭
   - 사용자 선택
   - 서비스: `Variable Dance API`
   - 토큰 복사

7. **Variable Dance 설정**

```bash
nano config/config.php
```

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'paste_your_token_here');
```

### Moodle 연결 테스트

브라우저 콘솔에서:

```javascript
// 단축키 사용
// Ctrl + Shift + M

// 또는 직접 호출
testMoodle();
```

**성공 시 출력:**
```
Moodle 연결 성공!
Site: My Moodle Site
Version: 3.7
```

---

## 문제 해결

### 문제: "데이터베이스 연결 실패"

**해결책:**
1. MySQL 서비스 실행 확인:
   ```bash
   sudo systemctl status mysql
   # 또는
   sudo service mysql status
   ```

2. 데이터베이스 존재 확인:
   ```bash
   mysql -u root -p -e "SHOW DATABASES LIKE 'variable_dance';"
   ```

3. 사용자 권한 확인:
   ```bash
   mysql -u root -p -e "SHOW GRANTS FOR 'vdance_user'@'localhost';"
   ```

### 문제: "API call failed"

**해결책:**
1. PHP 오류 로그 확인:
   ```bash
   tail -f /var/log/apache2/error.log
   # 또는
   tail -f logs/app.log
   ```

2. 파일 권한 확인:
   ```bash
   ls -la api/
   # 모든 .php 파일이 읽기 가능해야 함
   ```

3. CORS 설정 확인 (브라우저 콘솔 오류 시)

### 문제: "Moodle 연결 실패"

**해결책:**
1. Moodle URL 확인 (슬래시 없이):
   ```php
   define('MOODLE_URL', 'http://moodle.example.com');  // ✅
   define('MOODLE_URL', 'http://moodle.example.com/'); // ❌
   ```

2. 토큰 유효성 확인:
   ```bash
   curl "http://your-moodle-site.com/webservice/rest/server.php?wstoken=YOUR_TOKEN&wsfunction=core_webservice_get_site_info&moodlewsrestformat=json"
   ```

3. Moodle 방화벽 확인

### 문제: "슬라이더 동작하지 않음"

**해결책:**
1. 브라우저 콘솔(F12) 오류 확인
2. JavaScript 파일 로드 확인:
   ```html
   <script src="js/api.js"></script>
   <script src="js/visualization.js"></script>
   <script src="js/variable-dance.js"></script>
   <script src="js/app.js"></script>
   ```

3. 순서가 중요함 (api.js → visualization.js → variable-dance.js → app.js)

---

## 다음 단계

설치가 완료되었습니다! 🎉

- 📖 [README.md](README.md) 읽기
- 🎯 샘플 문제로 테스트
- 🔧 커스텀 문제 추가
- 📊 학습 데이터 분석

---

## 지원

문제가 해결되지 않으면:
1. GitHub Issues 확인
2. 새 이슈 등록
3. 상세한 오류 로그 첨부

**Happy Variable Dancing! 🎭**
