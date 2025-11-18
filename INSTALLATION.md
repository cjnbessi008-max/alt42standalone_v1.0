# Property Shake 설치 가이드

## 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+

### 클라이언트 환경
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)
- JavaScript 활성화 필수
- Vibration API 지원 권장 (모바일 기기)

## 설치 단계

### 1. 백엔드 설정

#### 1.1 데이터베이스 테이블 생성
```bash
mysql -u moodle_user -p moodle < backend/sql/create_tables.sql
```

#### 1.2 PHP 설정 파일 구성
```bash
cd backend/api
cp config.example.php config.php
```

`config.php` 파일을 편집하여 실제 데이터베이스 정보 입력:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
define('MOODLE_PATH', '/path/to/moodle');
```

#### 1.3 권한 설정
```bash
chmod 755 backend/api/moodle-connector.php
chmod 600 backend/api/config.php
```

### 2. 프론트엔드 설정

#### 2.1 Node.js 및 패키지 설치
```bash
cd frontend
npm install
```

#### 2.2 환경 변수 설정
`.env` 파일 생성:
```bash
REACT_APP_API_URL=http://your-server.com/api
```

#### 2.3 개발 서버 실행
```bash
npm start
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

#### 2.4 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

### 3. 웹 서버 설정

#### Apache 설정 예제
```apache
<VirtualHost *:80>
    ServerName property-shake.example.com
    DocumentRoot /var/www/html/property-shake

    # React 앱
    <Directory /var/www/html/property-shake>
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

    # PHP API
    Alias /api /var/www/html/property-shake/backend/api
    <Directory /var/www/html/property-shake/backend/api>
        Options -Indexes
        AllowOverride None
        Require all granted

        <FilesMatch "\.php$">
            SetHandler application/x-httpd-php
        </FilesMatch>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/property-shake-error.log
    CustomLog ${APACHE_LOG_DIR}/property-shake-access.log combined
</VirtualHost>
```

#### Nginx 설정 예제
```nginx
server {
    listen 80;
    server_name property-shake.example.com;
    root /var/www/html/property-shake;
    index index.html;

    # React 앱
    location / {
        try_files $uri $uri/ /index.html;
    }

    # PHP API
    location /api {
        alias /var/www/html/property-shake/backend/api;
        index moodle-connector.php;

        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
            fastcgi_index moodle-connector.php;
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # 로그 설정
    access_log /var/log/nginx/property-shake-access.log;
    error_log /var/log/nginx/property-shake-error.log;
}
```

### 4. Moodle 연동 설정

#### 4.1 Moodle 데이터베이스 접근 권한
Property Shake가 Moodle 데이터베이스에 접근할 수 있도록 권한 부여:
```sql
GRANT SELECT, INSERT ON moodle.* TO 'property_shake_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 4.2 Moodle 문제 카테고리 생성
Moodle 관리자 페이지에서:
1. 사이트 관리 → 플러그인 → 활동 모듈 → 퀴즈
2. 문제 은행 → 카테고리
3. 새 카테고리 생성: "graph", "function"

#### 4.3 샘플 문제 추가
SQL로 직접 삽입하거나 Moodle UI를 통해 추가:
```sql
-- backend/sql/create_tables.sql의 샘플 데이터 참조
```

### 5. 테스트

#### 5.1 API 테스트
```bash
curl http://your-server.com/api/moodle-connector.php?action=getProblems
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "problems": [...],
    "count": 3
  }
}
```

#### 5.2 프론트엔드 테스트
1. 브라우저에서 `http://your-server.com` 접속
2. 좌측 패널에서 문제 선택
3. 우측 가상 스마트폰 화면에 그래프 표시 확인
4. 그래프를 터치/클릭하여 Property Shake 동작 확인

## 문제 해결

### CORS 오류
PHP API 파일에서 CORS 헤더가 제대로 설정되어 있는지 확인:
```php
header('Access-Control-Allow-Origin: *');
```

### 데이터베이스 연결 실패
- MySQL 서버 실행 상태 확인
- 데이터베이스 사용자 권한 확인
- `config.php` 설정 정보 확인

### Vibration API 동작하지 않음
- HTTPS 환경에서만 동작 (보안 제약)
- 모바일 브라우저에서 테스트
- 사용자 인터랙션 후에만 진동 가능

### Moodle 데이터 없음
- Moodle 테이블 구조 확인
- 샘플 데이터 삽입 확인
- API 로그 확인

## 추가 설정

### HTTPS 설정
Let's Encrypt를 사용한 무료 SSL 인증서:
```bash
sudo certbot --apache -d property-shake.example.com
```

### 성능 최적화
- PHP OPcache 활성화
- MySQL 쿼리 캐싱
- React 프로덕션 빌드 사용
- CDN 사용 (정적 파일)

## 지원

문제가 발생하면 다음을 확인하세요:
- 서버 오류 로그: `/var/log/apache2/error.log` 또는 `/var/log/nginx/error.log`
- PHP 오류 로그: `/var/log/php7.1-fpm.log`
- 브라우저 개발자 도구 콘솔
