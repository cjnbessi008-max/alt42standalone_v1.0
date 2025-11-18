# Truth Light - 빠른 시작 가이드 🚀

## 5분 안에 시작하기

### 1단계: 자동 설치 (추천)

```bash
cd truth-light-app
chmod +x install.sh
sudo ./install.sh
```

설치 스크립트가 자동으로:
- 필수 소프트웨어 확인
- 데이터베이스 생성 및 스키마 적용
- 설정 파일 생성
- 권한 설정

### 2단계: 웹 서버 설정

#### Apache 사용시

```bash
# Apache 재시작
sudo systemctl restart apache2

# 또는
sudo service apache2 restart
```

#### Nginx 사용시

`/etc/nginx/sites-available/default`에 추가:

```nginx
location /truth-light-app {
    root /var/www/html;
    index index.html;
}

location ~ /truth-light-app/api/(.*)$ {
    fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    fastcgi_param SCRIPT_FILENAME /var/www/html/truth-light-app/api/api.php;
    include fastcgi_params;
}
```

```bash
sudo systemctl restart nginx
```

### 3단계: 접속 확인

브라우저에서 접속:
```
http://localhost/truth-light-app/public/
```

### 4단계: API 테스트

```bash
cd truth-light-app/api
php test-api.php
```

모든 테스트가 통과하면 성공! ✓

---

## 수동 설치 (고급 사용자용)

### 1. 데이터베이스 설정

```bash
mysql -u root -p
```

```sql
CREATE DATABASE truth_light_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'truth_light_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON truth_light_db.* TO 'truth_light_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
mysql -u root -p truth_light_db < database/schema.sql
```

### 2. 환경 설정

```bash
cp config/config.php config/config.local.php
nano config/config.local.php
```

다음 항목 수정:
```php
define('DB_USER', 'truth_light_user');
define('DB_PASS', 'your_password');
```

### 3. 권한 설정

```bash
mkdir -p logs
chmod 755 logs
chown -R www-data:www-data .
```

---

## Moodle 연동 (선택사항)

### 1. Moodle 웹 서비스 활성화

1. Moodle 관리자 로그인
2. `사이트 관리` → `고급 기능` → `웹 서비스 활성화`
3. `사이트 관리` → `플러그인` → `웹 서비스` → `프로토콜`
   - REST 프로토콜 활성화

### 2. 토큰 생성

1. `사이트 관리` → `플러그인` → `웹 서비스` → `외부 서비스`
2. "Truth Light Service" 생성
3. 필요한 함수 추가:
   - `core_user_get_users_by_field`
   - `mod_quiz_get_quizzes_by_courses`

4. `토큰 관리`에서 새 토큰 생성
5. 생성된 토큰 복사

### 3. Truth Light 설정

`config/config.local.php`에 추가:

```php
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_token_here');
```

### 4. 연결 테스트

브라우저에서:
```
http://localhost/truth-light-app/public/api/api.php/moodle-test
```

응답 확인:
```json
{
  "success": true,
  "message": "Moodle 연결 성공"
}
```

---

## 문제 해결

### 데이터베이스 연결 실패

```bash
# MySQL 서비스 확인
sudo systemctl status mysql

# 재시작
sudo systemctl restart mysql

# 연결 테스트
mysql -u truth_light_user -p truth_light_db
```

### API 호출 실패

```bash
# PHP 에러 로그 확인
tail -f /var/log/apache2/error.log

# Truth Light 로그 확인
tail -f logs/app.log

# 권한 확인
ls -la logs/
```

### 빈 화면 / 404 오류

1. `.htaccess` 파일 확인
2. Apache mod_rewrite 활성화:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

3. AllowOverride 설정 확인 (`/etc/apache2/sites-available/000-default.conf`):
```apache
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

---

## 다음 단계

- 📖 [전체 문서 보기](README.md)
- 🎨 [UI 커스터마이징](README.md#커스터마이징)
- 🔧 [API 문서](README.md#api-문서)
- 🐛 [이슈 리포트](https://github.com/your-repo/issues)

---

**Happy Learning! 🎓✨**
