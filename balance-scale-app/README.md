# Balance Scale App - 방정식 균형 학습 앱

방정식의 균형을 저울로 시각화하여 학습하는 독립형 웹 애플리케이션입니다.

## 📱 주요 기능

- **저울 시각화**: 방정식의 양변을 저울로 표현하여 직관적인 학습
- **대화형 조작**: 양쪽에 동일한 연산을 수행하여 방정식 풀이 체험
- **Moodle 연동**: Moodle LMS에서 문제 정보를 받아 동작
- **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 표시
- **학습 진행 추적**: 학생별 풀이 과정 및 결과 저장

## 🛠️ 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Integration**: Moodle 3.7 Web Service API

## 📂 프로젝트 구조

```
balance-scale-app/
├── api/                    # PHP API 엔드포인트
│   ├── problems.php       # 문제 관리 API
│   └── progress.php       # 학습 진행 API
├── config/                 # 설정 파일
│   ├── database.php       # DB 연결 설정
│   └── moodle.php         # Moodle API 설정
├── database/               # 데이터베이스 스키마
│   └── schema.sql         # DB 스키마 및 샘플 데이터
├── public/                 # 공개 웹 파일
│   ├── index.html         # 메인 HTML
│   ├── css/
│   │   ├── styles.css     # 메인 스타일 (스마트폰 프레임)
│   │   └── balance-scale.css  # 저울 시각화 스타일
│   ├── js/
│   │   ├── balance-scale.js   # 방정식 로직
│   │   └── app.js         # 애플리케이션 로직
│   └── images/            # 이미지 리소스
├── docs/                   # 문서
└── README.md              # 이 파일
```

## 🚀 설치 및 설정

### 1. 환경 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p -e "CREATE DATABASE balance_scale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 스키마 임포트
mysql -u root -p balance_scale < database/schema.sql
```

### 3. 환경 변수 설정

`.env` 파일을 생성하거나 웹 서버 설정에 다음 환경 변수를 추가하세요:

```bash
# 데이터베이스
DB_HOST=localhost
DB_NAME=balance_scale
DB_USER=root
DB_PASS=your_password

# Moodle 연동 (선택사항)
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_webservice_token
```

### 4. 웹 서버 설정

#### Apache (.htaccess)

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /balance-scale-app/

    # API 요청 처리
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^api/(.*)$ api/$1 [L]
</IfModule>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/balance-scale-app/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        try_files $uri $uri/ =404;
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 5. 파일 권한 설정

```bash
chmod -R 755 balance-scale-app
chmod -R 775 balance-scale-app/api
```

## 📖 사용 방법

### 독립 실행 모드

브라우저에서 직접 접속:

```
http://your-domain.com/balance-scale-app/public/index.html
```

### Moodle 연동 모드

URL 파라미터로 문제 정보 전달:

```
http://your-domain.com/balance-scale-app/public/index.html?moodle_question_id=123&student_id=456
```

**파라미터:**
- `moodle_question_id`: Moodle 문제 ID
- `student_id`: 학생 ID
- `problem_id`: 로컬 문제 ID (선택사항)

### Moodle에서 임베드

Moodle 코스에 "외부 도구(External Tool)" 활동으로 추가하거나, iframe으로 임베드:

```html
<iframe
    src="http://your-domain.com/balance-scale-app/public/index.html?moodle_question_id={QUESTION_ID}&student_id={USER_ID}"
    width="100%"
    height="800px"
    frameborder="0">
</iframe>
```

## 🎮 앱 사용법

1. **문제 확인**: 화면 상단에 표시된 방정식 확인
2. **저울 관찰**: 양변의 값을 저울로 시각화하여 표시
3. **연산 수행**: 양쪽에 동일한 연산(+, -, ×, ÷) 수행
4. **균형 유지**: 저울이 균형을 유지하도록 조작
5. **정답 확인**: x = 숫자 형태로 풀이되면 "정답 확인" 버튼 클릭
6. **힌트**: 막힐 때 "힌트" 버튼으로 도움받기

## 🔌 API 문서

### Problems API

**문제 조회**
```
GET /api/problems.php?id=1
GET /api/problems.php?moodle_question_id=123
GET /api/problems.php (모든 문제)
```

**문제 생성**
```
POST /api/problems.php
Content-Type: application/json

{
  "title": "문제 제목",
  "equation": "2x + 3 = 11",
  "difficulty": "medium",
  "moodle_question_id": 123
}
```

### Progress API

**진행 상황 조회**
```
GET /api/progress.php?student_id=1&problem_id=1
```

**진행 시작**
```
POST /api/progress.php
Content-Type: application/json

{
  "student_id": 1,
  "problem_id": 1
}
```

**진행 업데이트**
```
PUT /api/progress.php
Content-Type: application/json

{
  "id": 1,
  "is_solved": true,
  "solution_steps": [...],
  "time_spent": 120
}
```

## 🎨 커스터마이징

### 색상 테마 변경

`public/css/styles.css`에서 그라디언트 색상 수정:

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 스마트폰 프레임 위치 변경

`public/css/styles.css`의 `#phone-frame` 수정:

```css
#phone-frame {
    bottom: 20px;    /* 하단 여백 */
    right: 20px;     /* 우측 여백 */
}
```

## 🐛 문제 해결

### 데이터베이스 연결 오류

```
Database connection failed
```

**해결책**: `config/database.php`의 DB 설정 확인

### CORS 오류

**해결책**: API 파일에 CORS 헤더가 포함되어 있으나, 추가 설정이 필요한 경우 `.htaccess` 또는 서버 설정에서:

```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
```

### Moodle 연동 오류

**해결책**:
1. Moodle 웹 서비스가 활성화되어 있는지 확인
2. 올바른 토큰이 설정되어 있는지 확인
3. Moodle 사이트에서 외부 접속이 허용되는지 확인

## 📝 라이선스

MIT License - KAIST Touch Math Academy

## 👥 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 📧 연락처

기술 지원: [support@example.com](mailto:support@example.com)
