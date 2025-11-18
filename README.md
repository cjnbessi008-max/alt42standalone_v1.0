# Alt42 Standalone - Learning Activity Monitor

Moodle LMS와 연동하여 학습 활동을 실시간으로 모니터링하는 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에 로그가 천천히 증가하는 'Slow Climb' 애니메이션 효과를 제공합니다.

## 주요 기능

- ✅ **실시간 학습 활동 모니터링**: Moodle LMS에서 발생하는 학생 활동을 실시간으로 추적
- 📱 **가상 스마트폰 UI**: 우측 하단에 고정된 스마트폰 화면으로 로그 표시
- 🎬 **Slow Climb 애니메이션**: 로그가 하단에서 상단으로 천천히 올라가는 부드러운 애니메이션
- 🔄 **Moodle 3.7 연동**: Moodle Web Services API를 통한 완벽한 통합
- 📊 **실시간 통계**: 활동 중인 학생 수, 로그 개수 등 실시간 집계

## 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **LMS**: Moodle 3.7
- **API**: RESTful API, Moodle Web Services

## 시스템 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 (Web Services 활성화 필요)
- Apache/Nginx 웹 서버
- PDO MySQL 확장 모듈

## 설치 방법

### 1. 프로젝트 클론

```bash
git clone https://github.com/your-repo/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 및 테이블 생성
source database/schema.sql

# 사용자 생성 및 권한 부여 (선택사항)
CREATE USER 'alt42_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_monitor.* TO 'alt42_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 설정 파일 수정

`src/config/database.php` 파일을 열고 데이터베이스 접속 정보를 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'alt42_monitor');
define('DB_USER', 'alt42_user');
define('DB_PASS', 'your_secure_password');
```

### 4. Moodle 설정

#### 4.1 Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 웹 서비스 관리**로 이동
3. "웹 서비스 활성화" 체크
4. "REST 프로토콜 활성화" 체크

#### 4.2 Moodle 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**로 이동
2. "토큰 추가" 클릭
3. 사용자 선택 및 서비스 선택 (moodle_mobile_app 권장)
4. 생성된 토큰 복사

#### 4.3 데이터베이스에 Moodle 설정 저장

```sql
USE alt42_monitor;

UPDATE moodle_config
SET config_value = 'http://your-moodle-url.com'
WHERE config_key = 'moodle_url';

UPDATE moodle_config
SET config_value = 'your_moodle_token_here'
WHERE config_key = 'moodle_token';
```

### 5. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName alt42.yourdomain.com
    DocumentRoot /path/to/alt42standalone_v1.0/src

    <Directory /path/to/alt42standalone_v1.0/src>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/alt42_error.log
    CustomLog ${APACHE_LOG_DIR}/alt42_access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name alt42.yourdomain.com;
    root /path/to/alt42standalone_v1.0/src;
    index index.html index.php;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

## 사용 방법

### 기본 사용

1. 웹 브라우저에서 `http://your-server/index.html` 접속
2. 우측 하단 스마트폰 화면에서 실시간 로그 확인
3. 테스트 컨트롤 패널에서 로그 추가 및 애니메이션 속도 조절 가능

### API 엔드포인트

#### 1. 활동 로그 조회

```bash
GET /api/moodle-connector.php?action=get_activity_logs&limit=50&type=answer
```

**응답:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "student_name": "김민수",
      "activity_type": "answer",
      "content": "✏️ 분수 덧셈 문제를 풀었습니다",
      "created_at": "2025-11-18 10:30:45"
    }
  ],
  "count": 1
}
```

#### 2. Moodle 동기화

```bash
POST /api/moodle-connector.php
Content-Type: application/json

{
  "action": "sync_moodle",
  "course_id": 123
}
```

#### 3. 수동 로그 추가

```bash
POST /api/moodle-connector.php
Content-Type: application/json

{
  "action": "add_log",
  "student_name": "이지은",
  "activity_type": "correct",
  "content": "✅ 정답입니다!",
  "score": 10.0
}
```

#### 4. 연결 테스트

```bash
GET /api/moodle-connector.php?action=test_connection
```

### JavaScript API

```javascript
// 로그 추가
window.slowClimbLogger.addRandomLog();

// 연속 로그 추가
window.slowClimbLogger.addMultipleLogs(5);

// 로그 지우기
window.slowClimbLogger.clearLogs();

// 애니메이션 속도 변경
window.slowClimbLogger.animationSpeed = 1000; // ms
```

## Slow Climb 애니메이션 설명

'Slow Climb'은 로그가 천천히 증가하며 올라가는 애니메이션 효과입니다:

1. **새 로그 생성**: 하단에서 페이드인 효과와 함께 나타남
2. **기존 로그 이동**: 새 로그가 추가되면 기존 로그들이 순차적으로 위로 이동
3. **부드러운 전환**: cubic-bezier 곡선을 사용한 자연스러운 애니메이션
4. **속도 조절**: 사용자가 슬라이더로 애니메이션 속도 조절 가능

### 애니메이션 커스터마이징

`src/css/styles.css`에서 애니메이션을 수정할 수 있습니다:

```css
/* 로그 나타나기 애니메이션 */
@keyframes slideUp {
    0% {
        opacity: 0;
        transform: translateY(20px);
    }
    100% {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Slow Climb 애니메이션 */
@keyframes climb {
    0% {
        transform: translateY(0);
    }
    100% {
        transform: translateY(-100%);
    }
}
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── index.html              # 메인 페이지
│   ├── css/
│   │   └── styles.css          # 스타일시트 (스마트폰 UI + 애니메이션)
│   ├── js/
│   │   └── slow-climb.js       # Slow Climb 애니메이션 로직
│   ├── api/
│   │   └── moodle-connector.php # Moodle API 연동
│   └── config/
│       └── database.php        # 데이터베이스 설정
├── database/
│   └── schema.sql              # 데이터베이스 스키마
├── docs/
│   └── (문서 파일)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 트러블슈팅

### 데이터베이스 연결 오류

```bash
# PHP PDO MySQL 확장 확인
php -m | grep pdo_mysql

# 확장이 없다면 설치
sudo apt-get install php7.1-mysql
sudo systemctl restart apache2
```

### Moodle API 연결 실패

1. Moodle Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. Moodle URL이 올바른지 확인 (http/https)
4. 방화벽 설정 확인

### 애니메이션이 작동하지 않음

1. 브라우저 콘솔에서 JavaScript 오류 확인
2. 브라우저가 CSS3 애니메이션을 지원하는지 확인
3. 캐시 삭제 후 새로고침

## 개발 로드맵

- [x] 기본 프로젝트 구조
- [x] 가상 스마트폰 UI
- [x] Slow Climb 애니메이션
- [x] MySQL 데이터베이스 스키마
- [x] Moodle API 연동
- [ ] 실시간 WebSocket 업데이트
- [ ] 사용자 인증 및 권한 관리
- [ ] 다국어 지원 (한국어/영어)
- [ ] 모바일 반응형 개선
- [ ] 통계 대시보드 확장

## 라이선스

MIT License

## 기여

버그 리포트 및 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 지원

- 이메일: support@alt42.com
- GitHub Issues: https://github.com/your-repo/alt42standalone_v1.0/issues

## 스크린샷

(스크린샷 추가 예정)

---

**Alt42 Standalone v1.0** - KAIST Touch Math Academy
