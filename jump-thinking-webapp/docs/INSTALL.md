# 설치 가이드 (Installation Guide)

## 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ (mod_rewrite 활성화)
- **Moodle**: 3.7 이상

## 설치 단계

### 1. 파일 배포

```bash
# 웹 서버 문서 루트에 파일 복사
cd /var/www/html
git clone <repository-url> jump-thinking
cd jump-thinking
```

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env
```

**.env 설정 예시:**
```env
APP_URL=https://your-domain.com
APP_DEBUG=false

DB_HOST=localhost
DB_PORT=3306
DB_NAME=jump_thinking_db
DB_USER=your_db_user
DB_PASS=your_db_password

LTI_CONSUMER_KEY=your_moodle_key
LTI_CONSUMER_SECRET=your_secret_key_12345
```

### 3. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE jump_thinking_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 (선택사항)
CREATE USER 'jump_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON jump_thinking_db.* TO 'jump_user'@'localhost';
FLUSH PRIVILEGES;

# 스키마 생성
mysql -u root -p jump_thinking_db < database/schema.sql

# 샘플 데이터 삽입 (선택사항)
mysql -u root -p jump_thinking_db < database/seed.sql
```

### 4. 권한 설정

```bash
# 로그 디렉토리 생성
mkdir -p logs
chmod 755 logs

# 세션 디렉토리 권한
chmod 755 public

# 소유권 설정 (Apache 사용자)
chown -R www-data:www-data /var/www/html/jump-thinking
```

### 5. Apache 설정

#### VirtualHost 설정 예시:

```apache
<VirtualHost *:80>
    ServerName jump-thinking.your-domain.com
    DocumentRoot /var/www/html/jump-thinking/public

    <Directory /var/www/html/jump-thinking/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/jump-thinking-error.log
    CustomLog ${APACHE_LOG_DIR}/jump-thinking-access.log combined

    # LTI embedding support
    Header always set X-Frame-Options "ALLOWALL"
</VirtualHost>
```

#### 모듈 활성화:

```bash
sudo a2enmod rewrite
sudo a2enmod headers
sudo systemctl restart apache2
```

### 6. PHP 설정 확인

`php.ini` 확인:
```ini
upload_max_filesize = 10M
post_max_size = 10M
max_execution_time = 300
session.gc_maxlifetime = 3600
date.timezone = Asia/Seoul
```

### 7. 설치 확인

브라우저에서 접속:
```
http://your-domain.com
```

정상적으로 메인 페이지가 표시되어야 합니다.

---

## Moodle 연동 설정

### 1. Moodle 관리자 접속

1. Moodle 사이트 관리자로 로그인
2. **사이트 관리** > **플러그인** > **활동 모듈** > **외부 도구 관리** 이동

### 2. 외부 도구 추가

**도구 설정:**
- **도구 이름**: Jump Thinking Detection
- **도구 URL**: `https://your-domain.com/lti_launch.php`
- **Consumer Key**: `.env`에 설정한 `LTI_CONSUMER_KEY`
- **Shared Secret**: `.env`에 설정한 `LTI_CONSUMER_SECRET`
- **기본 Launch Container**: Embed (iframe)
- **프라이버시 설정**:
  - ✓ 론처의 이름을 도구와 공유
  - ✓ 론처의 이메일을 도구와 공유
  - ✓ 이름을 수락

### 3. 코스에 추가

1. 코스로 이동
2. **추가** > **활동 또는 리소스 추가**
3. **외부 도구** 선택
4. 위에서 설정한 **Jump Thinking Detection** 선택
5. 저장

### 4. 테스트

1. 학생 계정으로 로그인
2. 코스에서 Jump Thinking 활동 클릭
3. 정상적으로 문제 풀이 화면이 표시되어야 함

---

## 문제 해결

### 데이터베이스 연결 오류

```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -h localhost -u your_user -p jump_thinking_db
```

### LTI 서명 오류

- Consumer Key와 Secret이 Moodle과 `.env`에서 일치하는지 확인
- URL이 정확한지 확인 (https vs http)
- 로그 확인: `tail -f logs/error.log`

### 권한 오류

```bash
# 파일 권한 재설정
sudo chown -R www-data:www-data /var/www/html/jump-thinking
sudo chmod -R 755 /var/www/html/jump-thinking
```

### Apache 재작성 모듈

```bash
# mod_rewrite 활성화 확인
apache2ctl -M | grep rewrite

# 활성화되지 않았다면
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

## 보안 권장사항

### 프로덕션 환경

1. **디버그 모드 비활성화**
   ```env
   APP_DEBUG=false
   ```

2. **HTTPS 사용**
   - SSL 인증서 설치
   - HTTP를 HTTPS로 리디렉션

3. **데이터베이스 사용자 권한 최소화**
   ```sql
   REVOKE ALL ON jump_thinking_db.* FROM 'jump_user'@'localhost';
   GRANT SELECT, INSERT, UPDATE, DELETE ON jump_thinking_db.* TO 'jump_user'@'localhost';
   ```

4. **방화벽 설정**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

5. **정기 백업**
   ```bash
   # 데이터베이스 백업
   mysqldump -u root -p jump_thinking_db > backup_$(date +%Y%m%d).sql
   ```

---

## 업데이트

```bash
# Git pull (개발 환경)
git pull origin main

# 데이터베이스 마이그레이션 (있는 경우)
mysql -u root -p jump_thinking_db < database/migrations/update_xxx.sql

# 캐시 클리어
rm -rf cache/*

# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/jump-thinking
```

---

## 지원

문제가 발생하면:
- GitHub Issues: [프로젝트 저장소]/issues
- 이메일: support@your-domain.com
- 문서: https://your-domain.com/docs
