# Next Term Vision - 설치 및 설정 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [데이터베이스 설정](#데이터베이스-설정)
3. [PHP 설정](#php-설정)
4. [웹 서버 설정](#웹-서버-설정)
5. [Moodle 플러그인 설치](#moodle-플러그인-설치)
6. [프론트엔드 배포](#프론트엔드-배포)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상 (Moodle 연동 시)
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP 확장**:
  - PDO
  - PDO_MySQL
  - JSON
  - mbstring

### 권장 사항

- **메모리**: 최소 512MB (권장 1GB)
- **디스크 공간**: 100MB
- **브라우저**: Chrome/Firefox/Safari 최신 버전

---

## 데이터베이스 설정

### 1. MySQL 데이터베이스 생성

기존 Moodle 데이터베이스를 사용하거나 새로운 데이터베이스를 생성합니다.

```bash
# MySQL 접속
mysql -u root -p

# 새 데이터베이스 생성 (선택사항)
CREATE DATABASE nextterm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'nextterm_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON nextterm_db.* TO 'nextterm_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. 스키마 설치

```bash
# 스키마 파일 실행
mysql -u nextterm_user -p nextterm_db < backend/database/schema.sql

# 또는 Moodle 데이터베이스에 설치
mysql -u moodle_user -p moodle < backend/database/schema.sql
```

### 3. 데이터 확인

```sql
-- 설치 확인
USE nextterm_db;
SHOW TABLES;

-- 샘플 데이터 확인
SELECT COUNT(*) FROM nextterm_problems;
```

**예상 결과**: 13개의 샘플 문제가 생성되어야 합니다.

---

## PHP 설정

### 1. PHP 확장 확인

```bash
# 필수 확장 확인
php -m | grep -E 'PDO|mysql|json|mbstring'
```

### 2. API 설정 파일 수정

`backend/php/api/config.php` 파일을 편집:

```php
<?php
// 데이터베이스 설정
define('DB_HOST', 'localhost');        // DB 호스트
define('DB_NAME', 'nextterm_db');      // DB 이름
define('DB_USER', 'nextterm_user');    // DB 사용자
define('DB_PASS', 'your_password');    // DB 비밀번호
define('DB_CHARSET', 'utf8mb4');
```

### 3. API 테스트

```bash
# PHP 내장 서버로 테스트
cd backend/php/api
php -S localhost:8080

# 다른 터미널에서 테스트
curl "http://localhost:8080/get_problem.php?student_id=1"
```

**예상 응답**:
```json
{
  "success": true,
  "data": {
    "problem": {
      "id": 1,
      "problem_type": "arithmetic",
      "sequence_data": [2, 4, 6, 8, 10],
      ...
    }
  }
}
```

---

## 웹 서버 설정

### Apache 설정

#### 1. VirtualHost 설정

`/etc/apache2/sites-available/nextterm.conf`:

```apache
<VirtualHost *:80>
    ServerName nextterm.example.com
    DocumentRoot /var/www/html/nextterm

    <Directory /var/www/html/nextterm>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 경로 설정
    Alias /api /var/www/html/nextterm/backend/php/api

    <Directory /var/www/html/nextterm/backend/php/api>
        Options -Indexes
        AllowOverride None
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/nextterm-error.log
    CustomLog ${APACHE_LOG_DIR}/nextterm-access.log combined
</VirtualHost>
```

#### 2. 사이트 활성화

```bash
# 사이트 활성화
sudo a2ensite nextterm.conf

# mod_rewrite 활성화
sudo a2enmod rewrite

# Apache 재시작
sudo systemctl restart apache2
```

### Nginx 설정

`/etc/nginx/sites-available/nextterm`:

```nginx
server {
    listen 80;
    server_name nextterm.example.com;
    root /var/www/html/nextterm/frontend;
    index index.html;

    # 프론트엔드
    location / {
        try_files $uri $uri/ =404;
    }

    # API 경로
    location /api {
        alias /var/www/html/nextterm/backend/php/api;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $request_filename;
    }

    # 보안 설정
    location ~ /\.ht {
        deny all;
    }
}
```

```bash
# 사이트 활성화
sudo ln -s /etc/nginx/sites-available/nextterm /etc/nginx/sites-enabled/

# Nginx 재시작
sudo systemctl restart nginx
```

---

## Moodle 플러그인 설치

### 1. 플러그인 파일 복사

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/alt42standalone_v1.0/backend/php/moodle_plugin/mod/nextterm mod/

# 권한 설정
chown -R www-data:www-data mod/nextterm
```

### 2. Moodle에서 플러그인 설치

1. 관리자로 Moodle에 로그인
2. **사이트 관리 > 알림** (Site administration > Notifications)
3. "Upgrade Moodle database now" 버튼 클릭
4. Next Term Vision 플러그인이 설치 목록에 표시되면 설치 진행

### 3. 플러그인 설정

1. **사이트 관리 > 플러그인 > 활동 모듈 > Next Term Vision**
2. 필요한 설정 조정:
   - API 엔드포인트 URL
   - 기본 난이도 설정
   - 허용되는 시도 횟수 등

### 4. 코스에 활동 추가

1. 코스 페이지로 이동
2. "Turn editing on" 클릭
3. "Add an activity or resource" 선택
4. "Next Term Vision" 선택
5. 활동 이름 및 설명 입력
6. 저장

---

## 프론트엔드 배포

### 1. 파일 복사

```bash
# 프론트엔드 파일 복사
cp -r frontend/* /var/www/html/nextterm/

# 권한 설정
chown -R www-data:www-data /var/www/html/nextterm/
chmod -R 755 /var/www/html/nextterm/
```

### 2. API 경로 설정

`frontend/js/app.js` 파일 편집:

```javascript
constructor() {
    // 프로덕션 환경
    this.API_BASE = 'https://your-domain.com/api';

    // 또는 상대 경로
    // this.API_BASE = '/api';
}
```

### 3. CORS 설정 (필요 시)

프론트엔드와 API가 다른 도메인에 있는 경우, `backend/php/api/config.php`에서 CORS 설정:

```php
// 특정 도메인만 허용
header('Access-Control-Allow-Origin: https://frontend-domain.com');

// 또는 모든 도메인 허용 (개발 환경)
// header('Access-Control-Allow-Origin: *');
```

---

## 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed" 오류

**해결**:
1. MySQL 서비스 상태 확인:
   ```bash
   sudo systemctl status mysql
   ```
2. 연결 정보 확인: `config.php`의 DB 정보가 정확한지 확인
3. 권한 확인:
   ```sql
   SHOW GRANTS FOR 'nextterm_user'@'localhost';
   ```

### API 호출 실패

**증상**: 프론트엔드에서 "문제를 불러오는데 실패했습니다" 오류

**해결**:
1. 브라우저 개발자 도구 (F12) > Network 탭에서 API 요청 확인
2. API 경로가 올바른지 확인:
   ```bash
   curl -v http://localhost/api/get_problem.php?student_id=1
   ```
3. PHP 오류 로그 확인:
   ```bash
   tail -f /var/log/apache2/error.log
   # 또는
   tail -f /var/log/nginx/error.log
   ```

### 애니메이션이 작동하지 않음

**증상**: 수열이 표시되지만 애니메이션 효과가 없음

**해결**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. CSS 파일이 올바르게 로드되었는지 확인
3. 브라우저 호환성 확인 (Chrome, Firefox, Safari 권장)

### Moodle 플러그인 설치 오류

**증상**: "Plugin validation failed" 오류

**해결**:
1. 파일 권한 확인:
   ```bash
   ls -la /path/to/moodle/mod/nextterm
   ```
2. 플러그인 디렉토리 구조 확인:
   ```
   mod/nextterm/
   ├── version.php  (필수)
   ├── lib.php      (필수)
   ├── view.php     (필수)
   └── lang/
       └── en/
           └── nextterm.php  (필수)
   ```
3. Moodle 버전 호환성 확인: `version.php`의 `requires` 값

### 데모 모드로 전환

API 서버 없이 프론트엔드만 테스트하려면:

1. `frontend/index.html`을 브라우저에서 직접 열기
2. 자동으로 데모 모드로 전환됨
3. 샘플 문제로 모든 기능 테스트 가능

---

## 성능 최적화

### 데이터베이스 인덱스

```sql
-- 주요 인덱스 확인
SHOW INDEX FROM nextterm_problems;
SHOW INDEX FROM nextterm_responses;
SHOW INDEX FROM nextterm_progress;

-- 추가 인덱스 생성 (필요 시)
CREATE INDEX idx_active_difficulty ON nextterm_problems(is_active, difficulty_level);
```

### PHP OpCache 활성화

`php.ini` 설정:

```ini
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
```

### MySQL 쿼리 캐시

`my.cnf` 설정:

```ini
[mysqld]
query_cache_type=1
query_cache_size=64M
query_cache_limit=2M
```

---

## 백업 및 복원

### 데이터베이스 백업

```bash
# 전체 백업
mysqldump -u root -p nextterm_db > nextterm_backup_$(date +%Y%m%d).sql

# 특정 테이블만 백업
mysqldump -u root -p nextterm_db nextterm_problems nextterm_responses > problems_backup.sql
```

### 데이터베이스 복원

```bash
mysql -u root -p nextterm_db < nextterm_backup_20250118.sql
```

---

## 모니터링

### 접근 로그 분석

```bash
# 가장 많이 호출되는 API
cat /var/log/apache2/access.log | grep "/api/" | awk '{print $7}' | sort | uniq -c | sort -nr | head -10

# 에러 발생 횟수
grep "error" /var/log/apache2/error.log | wc -l
```

### 데이터베이스 통계

```sql
-- 총 문제 수
SELECT COUNT(*) FROM nextterm_problems;

-- 총 학생 수
SELECT COUNT(DISTINCT student_id) FROM nextterm_progress;

-- 평균 정답률
SELECT AVG(correct_answers / total_problems * 100) as avg_accuracy
FROM nextterm_progress
WHERE total_problems > 0;

-- 가장 인기 있는 문제 유형
SELECT problem_type, COUNT(*) as attempts
FROM nextterm_responses r
JOIN nextterm_problems p ON r.problem_id = p.id
GROUP BY problem_type
ORDER BY attempts DESC;
```

---

## 보안 체크리스트

- [ ] 데이터베이스 비밀번호 강력하게 설정
- [ ] PHP 오류 표시 비활성화 (`display_errors = Off`)
- [ ] SQL Injection 방어 (Prepared Statements 사용)
- [ ] XSS 방어 (입력값 sanitize)
- [ ] CSRF 토큰 구현 (Moodle 자동 처리)
- [ ] HTTPS 사용 (프로덕션 환경)
- [ ] 파일 업로드 제한 (해당 없음)
- [ ] 정기적인 백업 수행

---

## 지원 및 문의

설치 과정에서 문제가 발생하면:

1. 이 문서의 "문제 해결" 섹션 확인
2. GitHub 이슈 등록
3. 로그 파일 첨부 (개인정보 제거 후)

---

**설치 완료!** 🎉

브라우저에서 `http://your-domain.com/nextterm/` 접속하여 테스트하세요.
