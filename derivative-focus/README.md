# Derivative Focus

미분 문제의 핵심 규칙 3개를 자동으로 강조하는 LMS 연동 웹앱

## 🎯 주요 기능

- **Moodle LMS 연동**: Moodle 3.7과 통합하여 문제 정보 자동 수신
- **자동 규칙 검출**: 미분 문제에서 Power Rule, Chain Rule, Product Rule 자동 인식
- **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 형태의 인터페이스
- **실시간 강조**: 검출된 규칙을 시각적으로 강조 표시

## 📋 시스템 요구사항

- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **Moodle**: 3.7
- **웹서버**: Apache 또는 Nginx

## 🚀 설치 방법

### 1. 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 데이터베이스 및 Moodle 연결 정보를 입력합니다:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=derivative_focus
DB_USER=your_username
DB_PASS=your_password

MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

### 3. Moodle 웹서비스 설정

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리** 로 이동
3. 웹 서비스 활성화
4. **외부 서비스** 생성:
   - 이름: `derivative_focus_service`
   - 단축 이름: `derivative_focus`
   - 활성화됨: 예
5. 다음 함수들을 서비스에 추가:
   - `mod_quiz_get_quiz_questions`
   - `core_question_get_question_data`
   - `mod_quiz_get_user_attempts`
   - `core_course_get_contents`
6. **토큰 관리**에서 사용자에게 토큰 생성

### 4. 웹서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName derivative-focus.local
    DocumentRoot /path/to/derivative-focus/public

    <Directory /path/to/derivative-focus/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/derivative-focus-error.log
    CustomLog ${APACHE_LOG_DIR}/derivative-focus-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name derivative-focus.local;
    root /path/to/derivative-focus/public;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
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

## 📖 사용 방법

### 1. Moodle 문제 불러오기

1. 웹 브라우저에서 `http://derivative-focus.local` 접속
2. "Moodle 문제 ID" 입력란에 문제 ID 입력
3. "불러오기" 버튼 클릭
4. 우측 하단 가상 스마트폰 화면에 문제와 검출된 규칙이 표시됩니다

### 2. 직접 입력

1. "또는 직접 입력" 영역의 텍스트 박스에 미분 문제 입력
2. LaTeX 형식도 지원 (예: `$$f(x) = x^3 + \sin(2x)$$`)
3. "분석하기" 버튼 클릭

## 🎨 검출되는 핵심 규칙 3가지

### 1. Power Rule (거듭제곱 법칙)
- **공식**: `d/dx[x^n] = n·x^(n-1)`
- **검출 패턴**: `x^2`, `x^3`, `x^n` 등
- **강조 색상**: 빨강 (#FF6B6B)

### 2. Chain Rule (연쇄 법칙)
- **공식**: `d/dx[f(g(x))] = f'(g(x))·g'(x)`
- **검출 패턴**: `sin(2x)`, `(x^2 + 1)^3`, `e^(2x)` 등
- **강조 색상**: 청록 (#4ECDC4)

### 3. Product Rule (곱셈 법칙)
- **공식**: `d/dx[f·g] = f'·g + f·g'`
- **검출 패턴**: `x·ln(x)`, `(x^2)·(sin(x))` 등
- **강조 색상**: 연두 (#95E1D3)

## 🔧 API 엔드포인트

### Moodle에서 문제 가져오기
```http
POST /api/problem_handler.php/fetch-from-moodle
Content-Type: application/json

{
  "question_id": 12345
}
```

**응답:**
```json
{
  "success": true,
  "problem_id": 1,
  "problem_text": "Find the derivative of f(x) = x^3",
  "problem_latex": "$$f(x) = x^3$$",
  "detected_rules": [
    {
      "rule_id": 1,
      "rule_name": "Power Rule",
      "rule_type": "power_rule",
      "rule_formula": "d/dx[x^n] = n·x^(n-1)",
      "matched_expression": "x^3",
      "highlight_start": 28,
      "highlight_end": 31,
      "description": "The power rule..."
    }
  ]
}
```

### 문제 조회
```http
GET /api/problem_handler.php/problem/{problem_id}
```

## 📁 프로젝트 구조

```
derivative-focus/
├── config/
│   ├── database.php          # 데이터베이스 연결 설정
│   └── moodle.php             # Moodle API 클라이언트
├── database/
│   └── schema.sql             # MySQL 스키마
├── api/
│   └── problem_handler.php    # REST API 핸들러
├── lib/
│   └── DerivativeAnalyzer.php # 규칙 검출 엔진
├── public/
│   ├── index.html             # 메인 페이지
│   ├── css/
│   │   └── styles.css         # 스타일시트
│   └── js/
│       └── app.js             # 프론트엔드 로직
├── .env.example               # 환경 변수 템플릿
└── README.md                  # 문서
```

## 🔍 기술 스택

- **Backend**: PHP 7.1.9, MySQL 5.7
- **Frontend**: HTML5, CSS3, JavaScript (ES6)
- **LMS**: Moodle 3.7
- **Math Rendering**: MathJax 3.x
- **API**: RESTful JSON API

## 🐛 문제 해결

### Moodle 연결 실패
- `.env` 파일의 `MOODLE_URL`과 `MOODLE_TOKEN`이 올바른지 확인
- Moodle 웹서비스가 활성화되어 있는지 확인
- 토큰이 만료되지 않았는지 확인

### 데이터베이스 연결 오류
- MySQL 서비스가 실행 중인지 확인
- `.env` 파일의 데이터베이스 자격 증명 확인
- 데이터베이스가 생성되어 있는지 확인

### 규칙이 검출되지 않음
- 문제가 미분 관련 내용을 포함하는지 확인
- LaTeX 형식이 올바른지 확인
- 데이터베이스에 규칙이 올바르게 삽입되었는지 확인

## 📄 라이선스

MIT License

## 👥 기여

기여를 환영합니다! Pull Request를 제출하거나 Issue를 생성해주세요.

## 📞 지원

문제가 발생하면 Issue를 생성하거나 이메일로 문의해주세요.
