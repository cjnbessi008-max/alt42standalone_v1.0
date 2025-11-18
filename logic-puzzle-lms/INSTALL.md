# Logic Puzzle LMS - 설치 가이드

## 시스템 요구사항

### 서버 환경
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 (8.0 권장)
- **메모리**: 최소 512MB RAM

### PHP 확장 모듈
```bash
php -m | grep -E 'pdo|pdo_mysql|json|mbstring|openssl|curl'
```

필수 확장:
- PDO
- pdo_mysql
- JSON
- mbstring
- OpenSSL
- cURL

### 브라우저 지원
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 설치 단계

### 1. 파일 다운로드 및 압축 해제

```bash
# Git을 사용하는 경우
git clone https://github.com/your-repo/logic-puzzle-lms.git
cd logic-puzzle-lms

# 또는 압축 파일 다운로드 후
unzip logic-puzzle-lms.zip
cd logic-puzzle-lms
```

### 2. 데이터베이스 설정

#### MySQL 데이터베이스 생성

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 생성
CREATE DATABASE logic_puzzle_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 (옵션)
CREATE USER 'logic_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON logic_puzzle_lms.* TO 'logic_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 스키마 import

```bash
mysql -u root -p logic_puzzle_lms < database/schema.sql
```

성공 메시지 확인:
```
Database schema created successfully!
Default Blocks Loaded: 7
Sample Problems Loaded: 3
```

### 3. 설정 파일 구성

```bash
# 설정 파일 복사
cp config/config.example.php api/config.php
```

`api/config.php` 파일 편집:

```php
<?php
return [
    'database' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'logic_puzzle_lms',
        'username' => 'logic_user',        // 변경 필요
        'password' => 'your_secure_password', // 변경 필요
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ],

    'moodle' => [
        'site_url' => 'https://your-moodle-site.com', // 변경 필요
        'ws_token' => 'your_moodle_token',             // 변경 필요
        'ws_format' => 'json',
        'timeout' => 30,
        'question_category_id' => 1,
        'course_id' => 1,
    ],

    // 나머지 설정은 기본값 사용 가능
];
```

### 4. 디렉토리 권한 설정

```bash
# Linux/Unix
chmod 755 public
chmod 755 api
chmod 777 logs
chmod 777 cache

# 또는
chown -R www-data:www-data logic-puzzle-lms
chmod -R 755 logic-puzzle-lms
chmod -R 777 logic-puzzle-lms/logs
chmod -R 777 logic-puzzle-lms/cache
```

### 5. 웹 서버 설정

#### Apache 설정

`/etc/apache2/sites-available/logic-puzzle.conf`:

```apache
<VirtualHost *:80>
    ServerName logicpuzzle.example.com
    DocumentRoot /var/www/logic-puzzle-lms/public

    <Directory /var/www/logic-puzzle-lms/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/logic-puzzle-error.log
    CustomLog ${APACHE_LOG_DIR}/logic-puzzle-access.log combined
</VirtualHost>
```

활성화:
```bash
sudo a2ensite logic-puzzle
sudo a2enmod rewrite
sudo systemctl restart apache2
```

#### Nginx 설정

`/etc/nginx/sites-available/logic-puzzle`:

```nginx
server {
    listen 80;
    server_name logicpuzzle.example.com;
    root /var/www/logic-puzzle-lms/public;

    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
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
sudo ln -s /etc/nginx/sites-available/logic-puzzle /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. PHP 내장 서버 (개발용)

빠른 테스트를 위해:

```bash
cd logic-puzzle-lms/public
php -S localhost:8000
```

브라우저에서 접속: `http://localhost:8000`

---

## Moodle 연동 설정

### 1. Moodle 웹 서비스 활성화

Moodle 관리자 페이지:

1. **사이트 관리** → **플러그인** → **웹 서비스** → **개요**
2. "웹 서비스 활성화" 체크
3. 프로토콜 활성화: **REST 프로토콜** 활성화

### 2. 사용자 정의 서비스 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
2. "추가" 클릭
3. 서비스 정보 입력:
   - **이름**: Logic Puzzle Service
   - **약식 이름**: logic_puzzle
   - **활성화됨**: 체크

### 3. 함수 추가

Logic Puzzle에 필요한 Moodle 함수:
- `core_user_get_users_by_field`
- `core_enrol_get_enrolled_users`
- `core_webservice_get_site_info`
- `core_grades_update_grades`

### 4. 토큰 생성

1. **사이트 관리** → **플러그인** → **웹 서비스** → **토큰 관리**
2. "토큰 생성" 클릭
3. 사용자 선택 (충분한 권한 보유)
4. 서비스 선택: Logic Puzzle Service
5. 생성된 토큰을 `api/config.php`에 입력

### 5. Moodle 문제 카테고리 설정

1. Question Bank에서 "Logic Puzzle" 카테고리 생성
2. 카테고리 ID를 `api/config.php`의 `question_category_id`에 입력

---

## 초기 데이터 설정

### 테스트 학생 생성

```sql
INSERT INTO students (moodle_user_id, username, full_name, email, grade_level)
VALUES (1, 'testuser', '테스트 학생', 'test@example.com', '중학교 1학년');
```

### 추가 문제 입력

```sql
INSERT INTO problems (
    moodle_question_id,
    title,
    description,
    difficulty_level,
    problem_type,
    correct_formula,
    available_blocks,
    max_attempts
) VALUES (
    2001,
    '드 모르간 법칙',
    '¬(P ∧ Q) = (¬P ∨ ¬Q) 임을 보이는 논리식을 만드세요.',
    'medium',
    'compound',
    '{"type":"or","inputs":[{"type":"not","inputs":[{"type":"variable","value":"P"}]},{"type":"not","inputs":[{"type":"variable","value":"Q"}]}]}',
    '["variable_P", "variable_Q", "not", "or"]',
    5
);
```

---

## 동작 확인

### 1. 데이터베이스 연결 테스트

`test-db.php` 파일 생성:

```php
<?php
require_once __DIR__ . '/api/db.php';

try {
    $db = Database::getInstance();
    $result = $db->query("SELECT COUNT(*) as count FROM problems");
    echo "데이터베이스 연결 성공!\n";
    echo "문제 개수: " . $result[0]['count'] . "\n";
} catch (Exception $e) {
    echo "오류: " . $e->getMessage() . "\n";
}
```

실행:
```bash
php test-db.php
```

### 2. API 테스트

```bash
# 문제 목록 조회
curl http://localhost:8000/api/get-problems.php

# 특정 문제 조회
curl http://localhost:8000/api/get-problems.php?id=1
```

### 3. 웹 인터페이스 접속

브라우저에서 `http://localhost:8000` 접속

예상 화면:
- 좌측: 논리 블록 팔레트
- 중앙: 작업 영역
- 우측: 모바일 뷰포트 (문제 표시)

---

## 문제 해결

### 데이터베이스 연결 오류

**증상**: "Database connection failed"

**해결**:
1. MySQL 서비스 실행 확인: `systemctl status mysql`
2. 사용자 권한 확인
3. `api/config.php`의 접속 정보 확인

### 권한 오류

**증상**: "Permission denied" 또는 "Cannot write to log file"

**해결**:
```bash
sudo chown -R www-data:www-data /var/www/logic-puzzle-lms
sudo chmod -R 755 /var/www/logic-puzzle-lms
sudo chmod -R 777 /var/www/logic-puzzle-lms/logs
sudo chmod -R 777 /var/www/logic-puzzle-lms/cache
```

### Moodle 연동 오류

**증상**: "Moodle API Error" 또는 "Invalid token"

**해결**:
1. Moodle 웹 서비스가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. Moodle 사이트 URL이 정확한지 확인 (http/https)
4. 방화벽 설정 확인

### JavaScript 로드 오류

**증상**: 콘솔에 "Failed to load module"

**해결**:
1. 브라우저가 ES6 모듈을 지원하는지 확인
2. 파일 경로가 올바른지 확인
3. 웹 서버 MIME 타입 설정 확인

---

## 보안 권장사항

### 운영 환경 배포 시

1. **HTTPS 사용**: SSL/TLS 인증서 설치
2. **디버그 모드 비활성화**: `config.php`에서 `debug => false`
3. **강력한 비밀번호**: 데이터베이스 및 Moodle 토큰
4. **방화벽 설정**: 불필요한 포트 차단
5. **정기 업데이트**: PHP, MySQL, 웹 서버 최신 버전 유지

### 추가 보안 설정

```php
// api/config.php
'security' => [
    'csrf_protection' => true,
    'rate_limit' => 60, // 분당 60 요청
    'allowed_origins' => [
        'https://yourdomain.com'
    ],
    'session_cookie_secure' => true,  // HTTPS only
    'session_cookie_httponly' => true,
    'session_cookie_samesite' => 'Strict',
],
```

---

## 다음 단계

설치가 완료되었습니다! 이제 다음을 진행하세요:

1. [사용자 가이드](USER_GUIDE.md) 참조
2. 문제 추가 및 학생 등록
3. 테스트 문제로 동작 확인
4. Moodle 코스와 연동

---

## 지원

문제가 발생하면:
- GitHub Issues: https://github.com/your-repo/logic-puzzle-lms/issues
- 이메일: support@example.com
- 문서: https://docs.example.com/logic-puzzle-lms

---

**설치 완료!** 🎉
