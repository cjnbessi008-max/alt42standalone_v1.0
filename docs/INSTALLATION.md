# DMN Drift Tracker - 설치 가이드

## 📋 시스템 요구사항

### 필수 요구사항
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상
- **Node.js**: 18.x 이상
- **npm**: 8.x 이상
- **웹 서버**: Apache 2.4 또는 Nginx 1.18 이상

### 권장 환경
- **OS**: Ubuntu 20.04 LTS, CentOS 8, macOS 12+
- **RAM**: 최소 2GB (4GB 권장)
- **Storage**: 최소 5GB 여유 공간

## 🚀 빠른 시작 (5분 설치)

### 1단계: 저장소 클론
```bash
git clone https://github.com/your-org/dmn-drift-tracker.git
cd dmn-drift-tracker
```

### 2단계: 데이터베이스 설정
```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE dmn_drift_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'dmn_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON dmn_drift_tracker.* TO 'dmn_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 스키마 적용
mysql -u root -p dmn_drift_tracker < database/schema.sql
```

### 3단계: 백엔드 설정
```bash
cd backend

# 환경 설정 파일 생성
cp config/.env.example config/.env

# .env 파일 편집
nano config/.env
```

**.env 설정 예시:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dmn_drift_tracker
DB_USER=dmn_user
DB_PASS=secure_password

# Application Settings
APP_ENV=production
APP_DEBUG=false
APP_URL=http://your-domain.com

# Moodle Integration
MOODLE_URL=http://your-moodle.com
MOODLE_TOKEN=your_webservice_token
MOODLE_LTI_KEY=your_consumer_key
MOODLE_LTI_SECRET=your_shared_secret
```

### 4단계: 프론트엔드 설정
```bash
cd ../frontend

# 의존성 설치
npm install

# 환경 변수 설정
cat > .env << EOF
VITE_API_URL=http://your-domain.com/api
EOF

# 프로덕션 빌드
npm run build
```

### 5단계: 웹 서버 설정

#### Apache 설정
```apache
<VirtualHost *:80>
    ServerName dmn-tracker.yourdomain.com
    DocumentRoot /var/www/dmn-drift-tracker/frontend/dist

    # Frontend - React App
    <Directory /var/www/dmn-drift-tracker/frontend/dist>
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

    # Backend - PHP API
    Alias /api /var/www/dmn-drift-tracker/backend/api
    <Directory /var/www/dmn-drift-tracker/backend/api>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # PHP 처리
        <FilesMatch \.php$>
            SetHandler "proxy:fcgi://127.0.0.1:9000"
        </FilesMatch>
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/dmn-tracker-error.log
    CustomLog ${APACHE_LOG_DIR}/dmn-tracker-access.log combined
</VirtualHost>
```

#### Nginx 설정
```nginx
server {
    listen 80;
    server_name dmn-tracker.yourdomain.com;

    root /var/www/dmn-drift-tracker/frontend/dist;
    index index.html;

    # Frontend - React App
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend - PHP API
    location /api {
        alias /var/www/dmn-drift-tracker/backend/api;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
        }
    }

    # 정적 파일 캐싱
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    error_log /var/log/nginx/dmn-tracker-error.log;
    access_log /var/log/nginx/dmn-tracker-access.log;
}
```

### 6단계: 권한 설정
```bash
# 파일 소유권 설정
sudo chown -R www-data:www-data /var/www/dmn-drift-tracker

# 디렉토리 권한
sudo chmod -R 755 /var/www/dmn-drift-tracker

# 로그 디렉토리 생성
sudo mkdir -p /var/www/dmn-drift-tracker/logs
sudo chmod 777 /var/www/dmn-drift-tracker/logs
```

### 7단계: 서비스 재시작
```bash
# Apache
sudo systemctl restart apache2

# 또는 Nginx + PHP-FPM
sudo systemctl restart nginx
sudo systemctl restart php7.4-fpm
```

## 🧪 설치 확인

### 1. 데이터베이스 연결 테스트
```bash
cd backend
php -r "
require_once 'config/database.php';
\$db = new Database();
\$db->loadConfig();
\$conn = \$db->getConnection();
echo 'Database connected successfully!';
"
```

### 2. API 테스트
```bash
# 세션 생성 테스트
curl -X POST http://your-domain.com/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"student_id": 1, "module_name": "Test Module"}'

# 예상 응답:
# {"success":true,"data":{"session_id":1,...}}
```

### 3. 프론트엔드 접속
브라우저에서 `http://your-domain.com` 접속 후 화면이 정상적으로 표시되는지 확인

## 🔧 개발 환경 설정

### PHP 개발 서버 (간단한 테스트용)
```bash
cd backend
php -S localhost:8000 -t api
```

### React 개발 서버
```bash
cd frontend
npm run dev
```

개발 서버는 `http://localhost:5173`에서 실행됩니다.

## 🎓 Moodle 통합 설정

### 1. Moodle 관리자 설정

1. **사이트 관리 → 플러그인 → 활동 모듈 → External Tool → Manage tools**
2. **"Configure a tool manually" 클릭**
3. 다음 정보 입력:

```
Tool Name: DMN Drift Tracker
Tool URL: http://your-domain.com/api/lti/launch
Consumer Key: [config/.env의 MOODLE_LTI_KEY]
Shared Secret: [config/.env의 MOODLE_LTI_SECRET]
```

4. **권한 설정**:
   - ✅ Accept grades from the tool
   - ✅ Force SSL (HTTPS 사용 시)
   - ✅ Share launcher's name with tool
   - ✅ Share launcher's email with tool

### 2. 코스에 활동 추가

1. 편집 모드 활성화
2. **활동 또는 리소스 추가 → External Tool**
3. **"DMN Drift Tracker" 선택**
4. 활동 이름 입력 후 저장

### 3. 성적 연동 확인

Moodle 성적표에서 자동으로 점수가 동기화되는지 확인

## 🐳 Docker로 설치 (선택사항)

### docker-compose.yml
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:5.7
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: dmn_drift_tracker
      MYSQL_USER: dmn_user
      MYSQL_PASSWORD: dmn_pass
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  php:
    image: php:7.4-fpm
    volumes:
      - ./backend:/var/www/html
    depends_on:
      - mysql

  nginx:
    image: nginx:alpine
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
    depends_on:
      - php

volumes:
  mysql_data:
```

### Docker로 실행
```bash
docker-compose up -d
```

## 🔒 보안 체크리스트

설치 후 다음 사항을 확인하세요:

- [ ] `.env` 파일이 웹에서 접근 불가능한지 확인
- [ ] 데이터베이스 비밀번호를 강력하게 설정
- [ ] HTTPS 설정 (Let's Encrypt 추천)
- [ ] PHP `display_errors = Off` (프로덕션)
- [ ] MySQL `bind-address = 127.0.0.1`
- [ ] 방화벽 설정 (필요한 포트만 오픈)
- [ ] 정기적인 백업 스케줄 설정

## 📊 성능 최적화

### MySQL 최적화
```sql
-- 인덱스 확인
SHOW INDEX FROM interaction_events;

-- 쿼리 성능 분석
EXPLAIN SELECT * FROM dmn_drift_metrics WHERE session_id = 1;
```

### PHP OPcache 활성화
```ini
; php.ini
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
```

### Nginx 캐싱
```nginx
# 브라우저 캐싱
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🆘 문제 해결

### 데이터베이스 연결 오류
```bash
# MySQL 서비스 상태 확인
sudo systemctl status mysql

# 연결 테스트
mysql -u dmn_user -p -h localhost dmn_drift_tracker
```

### PHP 오류
```bash
# PHP 에러 로그 확인
tail -f /var/log/php7.4-fpm.log

# Apache 에러 로그
tail -f /var/log/apache2/error.log
```

### API 응답 없음
```bash
# 웹 서버 재시작
sudo systemctl restart nginx
sudo systemctl restart php7.4-fpm
```

## 📞 지원

문제가 계속되면:
- GitHub Issues: https://github.com/your-org/dmn-drift-tracker/issues
- 문서: https://docs.dmn-tracker.com
- 이메일: support@dmn-tracker.com

---

**설치 완료!** 🎉
이제 `http://your-domain.com`에서 시스템을 사용할 수 있습니다.
