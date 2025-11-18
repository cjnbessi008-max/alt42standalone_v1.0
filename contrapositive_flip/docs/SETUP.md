# Contrapositive Flip - 상세 설치 가이드

## 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 (2017051500)
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **PHP Extensions**:
  - mysqli
  - json
  - mbstring
  - xml

### 클라이언트 환경
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **화면 해상도**: 375x812 이상 (모바일 최적화)
- **JavaScript**: ES6+ 지원 필수

## 설치 단계

### 1. 사전 준비

#### 1.1 Moodle 설치 확인

```bash
# Moodle 버전 확인
php /path/to/moodle/version.php

# 출력 예시:
# $version  = 2019052000;    // Moodle 3.7
```

#### 1.2 데이터베이스 접근 권한 확인

```bash
mysql -u moodle_user -p -e "SHOW GRANTS;"
```

필요 권한:
- SELECT, INSERT, UPDATE, DELETE
- CREATE, ALTER, DROP
- INDEX, REFERENCES

### 2. 플러그인 설치

#### 2.1 파일 복사

```bash
# Moodle 루트로 이동
cd /var/www/html/moodle

# local 플러그인 디렉토리 생성 (없는 경우)
mkdir -p local

# Contrapositive 플러그인 복사
cp -r /path/to/contrapositive_flip/moodle_plugin ./local/contrapositive

# 소유권 설정 (웹 서버 사용자에 맞게 조정)
chown -R www-data:www-data ./local/contrapositive
```

#### 2.2 Moodle 플러그인 활성화

1. Moodle 관리자로 로그인
2. **Site administration** > **Notifications** 이동
3. "Upgrade Moodle database now" 클릭
4. `local_contrapositive` 플러그인이 목록에 표시되는지 확인
5. "Upgrade Moodle database now" 버튼 클릭

#### 2.3 설치 확인

```bash
# Moodle CLI로 확인
php admin/cli/check_database_schema.php

# 플러그인 목록 확인
ls -la local/contrapositive
```

### 3. 데이터베이스 설정

#### 3.1 스키마 실행

```bash
# Moodle 데이터베이스 접속
mysql -u moodle_user -p moodle

# 스키마 파일 실행
mysql> SOURCE /path/to/contrapositive_flip/database/schema.sql;

# 테이블 생성 확인
mysql> SHOW TABLES LIKE 'mdl_contrapositive%';

# 예상 출력:
# mdl_contrapositive_questions
# mdl_contrapositive_attempts
# mdl_contrapositive_templates
# mdl_contrapositive_analytics
```

#### 3.2 테이블 구조 확인

```sql
-- 각 테이블 구조 확인
DESCRIBE mdl_contrapositive_questions;
DESCRIBE mdl_contrapositive_attempts;
DESCRIBE mdl_contrapositive_templates;
DESCRIBE mdl_contrapositive_analytics;

-- 샘플 데이터 확인
SELECT * FROM mdl_contrapositive_templates;
```

### 4. API 설정

#### 4.1 API 파일 배포

```bash
cd /var/www/html/moodle/local/contrapositive

# API 디렉토리 생성
mkdir -p api

# API 파일 복사
cp /path/to/contrapositive_flip/api/contrapositive_api.php ./api/

# 권한 설정
chmod 755 api
chmod 644 api/contrapositive_api.php
```

#### 4.2 API 경로 설정

`contrapositive_api.php` 파일 수정:

```php
// Moodle config 경로 확인
require_once('../../../config.php');  // 3단계 상위 디렉토리

// 플러그인 파일 경로 확인
require_once('../moodle_plugin/lib.php');
require_once('../moodle_plugin/contrapositive_generator.php');
```

#### 4.3 API 테스트

```bash
# cURL로 API 테스트 (Moodle 쿠키 필요)
curl -X GET "https://your-moodle-site.com/local/contrapositive/api/contrapositive_api.php?action=get_examples&language=ko" \
  -H "Cookie: MoodleSession=YOUR_SESSION_ID"
```

### 5. 웹 앱 배포

#### 5.1 파일 복사

```bash
cd /var/www/html/moodle/local/contrapositive

# 웹 앱 디렉토리 생성
mkdir -p app

# 웹 앱 파일 복사
cp -r /path/to/contrapositive_flip/web_app/* ./app/

# 디렉토리 구조 확인
tree app/
# app/
# ├── index.html
# ├── css/
# │   └── style.css
# └── js/
#     └── app.js
```

#### 5.2 API 경로 설정

`app/js/app.js` 파일 수정:

```javascript
// API 기본 URL 설정
const CONFIG = {
    apiBaseUrl: '../api/contrapositive_api.php',  // 상대 경로
    // 또는 절대 경로:
    // apiBaseUrl: 'https://your-moodle-site.com/local/contrapositive/api/contrapositive_api.php',
    language: 'ko',
    // ...
};
```

#### 5.3 권한 설정

```bash
# 디렉토리 권한
chmod 755 app app/css app/js

# 파일 권한
chmod 644 app/index.html
chmod 644 app/css/style.css
chmod 644 app/js/app.js
```

### 6. Apache/Nginx 설정

#### 6.1 Apache 설정

`.htaccess` 파일 추가 (필요한 경우):

```apache
# /var/www/html/moodle/local/contrapositive/app/.htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /local/contrapositive/app/
</IfModule>

# CORS 설정 (필요한 경우)
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, PUT, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

#### 6.2 Nginx 설정

```nginx
# /etc/nginx/sites-available/moodle
location /local/contrapositive/app/ {
    try_files $uri $uri/ /local/contrapositive/app/index.html;
}

# CORS 설정 (필요한 경우)
location /local/contrapositive/api/ {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

    if ($request_method = 'OPTIONS') {
        return 204;
    }
}
```

### 7. 설치 확인

#### 7.1 브라우저 테스트

1. 브라우저에서 접속:
   ```
   https://your-moodle-site.com/local/contrapositive/app/index.html
   ```

2. 확인 사항:
   - [ ] 페이지가 정상적으로 로드됨
   - [ ] 모바일 화면이 표시됨
   - [ ] 언어 토글이 작동함
   - [ ] "학습 시작하기" 버튼 클릭 시 문제가 로드됨
   - [ ] 카드 플립 애니메이션이 작동함

#### 7.2 개발자 도구 확인

브라우저 개발자 도구(F12)에서:

1. **Console 탭**:
   - JavaScript 오류 없음
   - "Initializing Contrapositive Flip App..." 메시지 확인
   - "Loaded X questions" 메시지 확인

2. **Network 탭**:
   - API 요청이 200 OK 응답
   - JSON 데이터가 올바르게 반환됨

3. **Elements 탭**:
   - CSS가 정상적으로 적용됨
   - 플립 애니메이션 클래스 확인

#### 7.3 데이터베이스 확인

```sql
-- 문제 생성 확인
SELECT COUNT(*) FROM mdl_contrapositive_questions;

-- 최근 생성된 문제 확인
SELECT * FROM mdl_contrapositive_questions
ORDER BY timecreated DESC
LIMIT 5;

-- 학생 시도 기록 확인
SELECT COUNT(*) FROM mdl_contrapositive_attempts;
```

## 문제 해결

### 문제 1: 플러그인이 Moodle에 인식되지 않음

**원인**: 파일 경로 또는 권한 문제

**해결**:
```bash
# 파일 경로 확인
ls -la /var/www/html/moodle/local/contrapositive/version.php

# 권한 확인
ls -la /var/www/html/moodle/local/

# 소유권 수정
chown -R www-data:www-data /var/www/html/moodle/local/contrapositive

# Moodle 캐시 삭제
php /var/www/html/moodle/admin/cli/purge_caches.php
```

### 문제 2: 데이터베이스 테이블 생성 실패

**원인**: 테이블 접두사(prefix) 불일치

**해결**:
```bash
# Moodle config.php에서 테이블 접두사 확인
grep '$CFG->prefix' /var/www/html/moodle/config.php

# schema.sql 파일에서 접두사 일치시키기
# 예: mdl_ → m_ 로 변경
sed 's/mdl_/m_/g' schema.sql > schema_modified.sql
```

### 문제 3: API CORS 오류

**원인**: 교차 출처 리소스 공유(CORS) 정책

**해결**:
`contrapositive_api.php` 파일 상단에 추가:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

### 문제 4: 카드 애니메이션 작동 안 함

**원인**: 브라우저 CSS3 지원 부족

**해결**:
- 최신 브라우저 사용 (Chrome 90+, Firefox 88+)
- `style.css`에서 vendor prefix 추가:
```css
.flip-card {
    -webkit-transform-style: preserve-3d;
    -moz-transform-style: preserve-3d;
    transform-style: preserve-3d;
}
```

### 문제 5: 한글 깨짐

**원인**: 문자 인코딩 문제

**해결**:
```sql
-- 데이터베이스 문자셋 확인
SHOW VARIABLES LIKE 'character_set%';

-- 테이블 문자셋 변경
ALTER TABLE mdl_contrapositive_questions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 보안 고려사항

### 1. 인증 확인
- 모든 API 요청에서 Moodle 로그인 확인
- `require_login()` 함수 사용

### 2. 입력 검증
- SQL Injection 방지: Prepared Statements 사용
- XSS 방지: HTML 출력 시 이스케이프 처리

### 3. HTTPS 사용
```bash
# SSL 인증서 설정 확인
certbot certificates

# HTTP → HTTPS 리다이렉트 설정
```

### 4. 파일 권한
```bash
# 읽기 전용 파일
chmod 644 *.php *.html *.css *.js

# 실행 가능 디렉토리
chmod 755 api/ app/

# 쓰기 금지
chmod -R u-w,g-w,o-w *
```

## 성능 최적화

### 1. 캐싱 설정

```php
// config.php에 추가
$CFG->cachejs = true;
$CFG->yuicomboloading = true;
```

### 2. CDN 사용 (선택사항)

```html
<!-- index.html에서 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css">
```

### 3. 데이터베이스 인덱스 확인

```sql
-- 인덱스 확인
SHOW INDEX FROM mdl_contrapositive_questions;
SHOW INDEX FROM mdl_contrapositive_attempts;

-- 필요시 추가 인덱스 생성
CREATE INDEX idx_timecreated ON mdl_contrapositive_questions(timecreated);
```

## 백업 및 복구

### 백업

```bash
# 데이터베이스 백업
mysqldump -u moodle_user -p moodle \
  mdl_contrapositive_questions \
  mdl_contrapositive_attempts \
  mdl_contrapositive_templates \
  mdl_contrapositive_analytics \
  > contrapositive_backup_$(date +%Y%m%d).sql

# 파일 백업
tar -czf contrapositive_files_$(date +%Y%m%d).tar.gz \
  /var/www/html/moodle/local/contrapositive
```

### 복구

```bash
# 데이터베이스 복구
mysql -u moodle_user -p moodle < contrapositive_backup_20250118.sql

# 파일 복구
tar -xzf contrapositive_files_20250118.tar.gz -C /var/www/html/moodle/local/
```

## 다음 단계

1. **사용자 교육**: 교사 및 학생을 위한 사용 가이드 제공
2. **모니터링**: 로그 및 분석 데이터 확인
3. **피드백 수집**: 사용자 의견 수렴
4. **업데이트**: 버그 수정 및 기능 개선

## 지원

기술 지원이 필요한 경우:
- 이메일: support@kaist-touchmath.edu
- GitHub: https://github.com/your-repo/contrapositive-flip
- Moodle 포럼: https://moodle.org/mod/forum/view.php?id=XXX
