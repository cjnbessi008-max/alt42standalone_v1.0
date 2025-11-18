# Volume Fill - LMS 연동 학습 앱

**Moodle LMS와 연동되는 학습 진도 시각화 웹 애플리케이션**

부피가 물처럼 차오르는 애니메이션으로 학습 진도를 직관적으로 표시하는 가상 스마트폰 앱입니다.

## 🎯 주요 기능

- **Volume Fill 애니메이션**: 학습 진도에 따라 비커에 물이 차오르는 부드러운 애니메이션
- **Moodle 연동**: Moodle LMS의 퀴즈 데이터와 실시간 동기화
- **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 친화적 인터페이스
- **실시간 진도 추적**: 문제 풀이 상황을 즉시 반영
- **격려 메시지**: 진도율에 따른 동기부여 메시지 표시

## 🖥️ 시스템 요구사항

### 서버 환경
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx

### 클라이언트
- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── public/                 # 웹 루트 디렉토리
│   ├── index.html         # 메인 페이지
│   ├── css/
│   │   └── style.css      # 스타일시트
│   ├── js/
│   │   ├── volume-fill.js # Volume Fill 애니메이션 클래스
│   │   └── app.js         # 메인 애플리케이션 로직
│   └── assets/            # 이미지 및 리소스
├── api/                   # REST API 엔드포인트
│   ├── get-progress.php   # 진도 조회 API
│   └── update-progress.php # 진도 업데이트 API
├── config/                # 설정 파일
│   └── database.php       # 데이터베이스 설정
├── tasks/                 # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
└── README.md              # 이 파일
```

## 🚀 설치 방법

### 1. 파일 배포

```bash
# 프로젝트를 웹 서버 디렉토리에 복사
cp -r alt42standalone_v1.0 /var/www/html/volume-fill
cd /var/www/html/volume-fill
```

### 2. 데이터베이스 설정

`config/database.php` 파일을 수정하여 Moodle 데이터베이스 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');          // 데이터베이스 호스트
define('DB_NAME', 'moodle');             // 데이터베이스 이름
define('DB_USER', 'moodle_user');        // 데이터베이스 사용자
define('DB_PASS', 'your_password');      // 데이터베이스 비밀번호
define('DB_PREFIX', 'mdl_');             // Moodle 테이블 프리픽스
```

### 3. 권한 설정

```bash
# 디렉토리 권한 설정
chmod -R 755 public/
chmod -R 755 api/
chmod 644 config/database.php

# 웹 서버 사용자에게 소유권 부여
chown -R www-data:www-data /var/www/html/volume-fill
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

`public/.htaccess` 파일 생성:

```apache
RewriteEngine On
RewriteBase /volume-fill/public/

# API 요청 처리
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^api/(.*)$ ../api/$1 [L]

# CORS 헤더
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type"
```

#### Nginx

`/etc/nginx/sites-available/volume-fill` 설정:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/volume-fill/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        rewrite ^/api/(.*)$ /api/$1 break;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/html/volume-fill/api/$1;
    }

    # CORS 헤더
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
}
```

### 5. PHP 확장 모듈 확인

```bash
# 필수 PHP 확장 모듈 확인
php -m | grep -E 'pdo|pdo_mysql|json'

# 없는 경우 설치
sudo apt-get install php7.1-mysql php7.1-json
```

## 📝 사용 방법

### 기본 사용

1. 브라우저에서 `http://your-domain.com/volume-fill/public/` 접속
2. 컨트롤 패널에서 진도율을 조정하거나 "정답 제출" 버튼 클릭
3. 우측 하단 스마트폰 화면에서 Volume Fill 애니메이션 확인

### Moodle 연동 사용

#### URL 파라미터 방식

```
http://your-domain.com/volume-fill/public/?student_id=123&quiz_id=456&auto_load=true
```

- `student_id`: Moodle 학생 ID
- `quiz_id`: Moodle 퀴즈 ID
- `auto_load`: 페이지 로드 시 자동으로 데이터 불러오기 (true/false)

#### API 직접 호출

```javascript
// 진도 조회
fetch('/api/get-progress.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        student_id: 123,
        quiz_id: 456
    })
})
.then(response => response.json())
.then(data => console.log(data));
```

### Moodle에 임베드

Moodle 페이지에 iframe으로 삽입:

```html
<iframe
    src="http://your-domain.com/volume-fill/public/?student_id={$USER->id}&quiz_id=456&auto_load=true"
    width="400"
    height="700"
    style="border:none; position:fixed; bottom:20px; right:20px; z-index:9999;">
</iframe>
```

## 🔧 커스터마이징

### 색상 변경

`public/css/style.css`의 CSS 변수 수정:

```css
:root {
    --primary-color: #0288D1;      /* 기본 색상 */
    --secondary-color: #4FC3F7;    /* 보조 색상 */
    --success-color: #4CAF50;      /* 성공 색상 */
    --danger-color: #F44336;       /* 위험 색상 */
}
```

### 애니메이션 속도 조정

`public/js/volume-fill.js`의 애니메이션 파라미터 수정:

```javascript
// 속도 조절 (0.1 = 느림, 0.3 = 빠름)
this.currentPercentage += diff * 0.1;
```

### 메시지 커스터마이징

`public/js/volume-fill.js`의 messages 객체 수정:

```javascript
this.messages = {
    0: "학습을 시작해보세요! 🎓",
    25: "좋은 시작입니다! 💪",
    50: "절반을 달성했어요! 🎉",
    75: "거의 다 왔어요! 🌟",
    100: "완벽합니다! 축하합니다! 🎊"
};
```

## 🔌 API 명세

### GET/POST /api/get-progress.php

학생의 학습 진도를 조회합니다.

**요청 파라미터:**
```json
{
    "student_id": 123,
    "quiz_id": 456
}
```

**응답:**
```json
{
    "success": true,
    "message": "진도 정보를 성공적으로 조회했습니다.",
    "data": {
        "student_id": 123,
        "student_name": "홍길동",
        "quiz_id": 456,
        "quiz_name": "분수 학습 퀴즈",
        "total_questions": 15,
        "correct_answers": 8,
        "percentage": 53.33,
        "state": "inprogress"
    }
}
```

### POST /api/update-progress.php

학생의 학습 진도를 업데이트합니다.

**요청 파라미터:**
```json
{
    "student_id": 123,
    "quiz_id": 456,
    "correct_answers": 10,
    "total_questions": 15
}
```

**응답:**
```json
{
    "success": true,
    "message": "진도가 성공적으로 업데이트되었습니다.",
    "data": {
        "percentage": 66.67,
        "timestamp": 1700000000
    }
}
```

## 🐛 트러블슈팅

### 데이터베이스 연결 실패

**증상:** "데이터베이스 연결에 실패했습니다" 오류

**해결:**
1. `config/database.php`의 데이터베이스 정보 확인
2. MySQL 서비스 상태 확인: `sudo systemctl status mysql`
3. 방화벽 설정 확인
4. PHP 로그 확인: `/var/log/php-error.log`

### CORS 오류

**증상:** 브라우저 콘솔에 CORS 관련 오류

**해결:**
1. `.htaccess` 또는 Nginx 설정에 CORS 헤더 추가
2. API 파일에 헤더가 올바르게 설정되었는지 확인

### 애니메이션이 작동하지 않음

**증상:** Volume Fill 애니메이션이 표시되지 않음

**해결:**
1. 브라우저 개발자 도구(F12)에서 JavaScript 오류 확인
2. `volume-fill.js`와 `app.js` 파일이 올바르게 로드되었는지 확인
3. SVG 요소가 페이지에 정상적으로 렌더링되었는지 확인

## 📊 성능 최적화

- **캐싱**: API 응답에 적절한 캐시 헤더 설정
- **압축**: Gzip 압축 활성화
- **CDN**: 정적 파일을 CDN으로 서빙
- **데이터베이스**: 인덱스 최적화 및 쿼리 캐싱

## 🔒 보안 고려사항

- SQL Injection 방지: PDO Prepared Statements 사용
- XSS 방지: 사용자 입력 검증 및 이스케이프
- CSRF 방지: 토큰 기반 인증 구현 권장
- 민감한 정보 보호: `config/database.php` 파일 권한 제한

## 📚 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: PHP 7.1+
- **Database**: MySQL 5.7+
- **LMS**: Moodle 3.7+
- **Animation**: SVG + CSS Transitions

## 🤝 기여

버그 리포트나 기능 제안은 이슈 트래커를 통해 제출해주세요.

## 📄 라이선스

이 프로젝트는 KAIST Touch Math Academy의 소유입니다.

## 📞 문의

- 프로젝트 관리자: [이메일 주소]
- 기술 지원: [지원 채널]

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Author**: AI Agent (Claude)
