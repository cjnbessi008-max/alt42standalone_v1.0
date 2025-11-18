# Function Mood - 함수의 감정을 보다

수학 함수의 성격(완만함·급변)을 감정 컬러로 시각화하는 웹 애플리케이션입니다.

## 📱 주요 기능

- **함수 분석 엔진**: 수학 함수의 완만함(smoothness), 급변도(steepness), 변화율(variation)을 자동 분석
- **감정 컬러 매핑**: 6가지 감정 상태로 함수 특성 표현
  - 😌 **평온함 (Calm)** - #87CEEB: 완만하고 부드러운 변화
  - 😊 **안정적 (Steady)** - #90EE90: 일정한 기울기 유지
  - 😄 **활발함 (Energetic)** - #FFD700: 중간 정도의 변화율
  - 🤩 **역동적 (Dynamic)** - #FFA500: 빠른 변화
  - 🤯 **폭발적 (Explosive)** - #FF6347: 급격한 변화
  - 😵 **혼돈적 (Chaotic)** - #FF1493: 불규칙하고 예측 불가능한 변화
- **가상 스마트폰 UI**: 우측 하단에 표시되는 모바일 앱 시뮬레이터
- **Moodle LMS 연동**: Moodle 3.7 퀴즈 문제 자동 동기화

## 🛠 기술 스택

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **API**: RESTful JSON API

## 📋 요구사항

- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache/Nginx 웹 서버
- Moodle 3.7 (선택사항 - LMS 연동 시)

## 🚀 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 접속
mysql -u root -p

# 데이터베이스 생성 및 스키마 적용
mysql -u root -p < database/schema.sql
```

### 2. 설정 파일 수정

`config/config.php` 파일을 열고 데이터베이스 및 Moodle 설정을 수정합니다:

```php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'function_mood');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Moodle LMS Configuration
define('MOODLE_URL', 'http://your-moodle-site.com');
define('MOODLE_TOKEN', 'your_webservice_token');

// Moodle Database Configuration
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password');
```

### 3. 웹 서버 설정

#### Apache

```apache
<VirtualHost *:80>
    ServerName function-mood.local
    DocumentRoot /path/to/function-mood

    <Directory /path/to/function-mood>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/function-mood-error.log
    CustomLog ${APACHE_LOG_DIR}/function-mood-access.log combined
</VirtualHost>
```

#### Nginx

```nginx
server {
    listen 80;
    server_name function-mood.local;
    root /path/to/function-mood;
    index index.html index.php;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### 4. 애플리케이션 실행

브라우저에서 `http://function-mood.local` 또는 설정한 도메인으로 접속합니다.

## 📖 사용 방법

### 기본 사용

1. 메인 페이지에서 함수 입력란에 수식 입력 (예: `x^2`, `sin(x)`, `exp(x)`)
2. "분석하기" 버튼 클릭
3. 우측 하단 가상 스마트폰 화면에서 결과 확인

### 지원하는 수식

- **기본 연산**: `+`, `-`, `*`, `/`, `^` (제곱)
- **삼각 함수**: `sin(x)`, `cos(x)`, `tan(x)`
- **기타 함수**: `sqrt(x)`, `abs(x)`, `exp(x)`, `log(x)`
- **예제**:
  - `x**2` - 이차 함수
  - `sin(x)` - 사인 함수
  - `exp(x)` - 지수 함수
  - `1/x` - 쌍곡선
  - `x**3 - 2*x` - 삼차 함수

### Moodle 연동

#### Moodle Web Service 설정

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
3. 다음 단계 수행:
   - 웹 서비스 활성화
   - 프로토콜 활성화 (REST)
   - 웹 서비스 사용자 생성
   - 토큰 생성
4. 생성된 토큰을 `config/config.php`의 `MOODLE_TOKEN`에 설정

#### 문제 동기화

```javascript
// JavaScript에서 호출
syncMoodleCourse(123); // 코스 ID = 123
```

또는 API 직접 호출:

```bash
curl -X POST http://function-mood.local/api/index.php?path=sync \
  -H "Content-Type: application/json" \
  -d '{"course_id": 123}'
```

## 🔌 API 문서

### 1. 함수 분석

**Endpoint**: `POST /api/index.php?path=analyze`

**Request Body**:
```json
{
  "function": "x^2",
  "domain_min": -10,
  "domain_max": 10
}
```

**Response**:
```json
{
  "success": true,
  "problem_id": 1,
  "analysis": {
    "id": 1,
    "mood_type": "calm",
    "smoothness": 85.5,
    "steepness": 25.3,
    "variation": 15.2,
    "color": "#87CEEB",
    "emotion": "평온함 (Calm)",
    "description": "완만하고 부드러운 변화를 보이는 함수"
  }
}
```

### 2. 문제 조회

**Endpoint**: `GET /api/index.php?path=problem&id={id}`

**Response**:
```json
{
  "success": true,
  "problem": {
    "id": 1,
    "function_expression": "x^2",
    "domain_min": -10,
    "domain_max": 10
  },
  "analysis": { ... }
}
```

### 3. Moodle 동기화

**Endpoint**: `POST /api/index.php?path=sync`

**Request Body**:
```json
{
  "course_id": 123
}
```

### 4. 감정 설정 조회

**Endpoint**: `GET /api/index.php?path=moods`

**Response**:
```json
{
  "success": true,
  "moods": [
    {
      "mood_type": "calm",
      "color_code": "#87CEEB",
      "emotion_label": "평온함 (Calm)",
      "smoothness_min": 70.0,
      "smoothness_max": 100.0
    }
  ]
}
```

## 📊 데이터베이스 스키마

### 주요 테이블

- **problems**: 문제 정보 저장
- **function_analysis**: 함수 분석 결과
- **student_interactions**: 학생 상호작용 로그
- **mood_configurations**: 감정 컬러 매핑 설정
- **lms_sync_log**: LMS 동기화 로그

자세한 스키마는 `database/schema.sql` 참조

## 🎨 커스터마이징

### 감정 컬러 변경

데이터베이스에서 직접 수정:

```sql
UPDATE mood_configurations
SET color_code = '#NEW_COLOR'
WHERE mood_type = 'calm';
```

### 분석 알고리즘 조정

`includes/FunctionAnalyzer.php`에서:
- `calculateSmoothness()`: 완만함 계산 로직
- `calculateSteepness()`: 급변도 계산 로직
- `determineMood()`: 감정 판정 로직

### UI 디자인 수정

- `assets/css/smartphone.css`: 스마트폰 UI 스타일
- `assets/js/function-mood.js`: UI 로직 및 상호작용

## 🧪 테스트

### Moodle 연결 테스트

```bash
curl http://function-mood.local/api/index.php?path=test-connection
```

### 함수 분석 테스트

브라우저 콘솔에서:

```javascript
fetch('api/index.php?path=analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    function: 'x**2',
    domain_min: -10,
    domain_max: 10
  })
}).then(r => r.json()).then(console.log);
```

## 📁 프로젝트 구조

```
function-mood/
├── api/
│   └── index.php              # API 엔드포인트
├── assets/
│   ├── css/
│   │   └── smartphone.css     # 스마트폰 UI 스타일
│   ├── js/
│   │   └── function-mood.js   # 프론트엔드 로직
│   └── images/                # 이미지 리소스
├── config/
│   └── config.php             # 설정 파일
├── database/
│   └── schema.sql             # 데이터베이스 스키마
├── includes/
│   ├── Database.php           # 데이터베이스 클래스
│   └── FunctionAnalyzer.php   # 분석 엔진
├── moodle-integration/
│   └── MoodleConnector.php    # Moodle 연동
├── index.html                 # 메인 페이지
└── README.md                  # 문서
```

## 🔒 보안 고려사항

1. **입력 검증**: 모든 사용자 입력은 서버에서 검증 및 살균처리
2. **SQL Injection 방지**: PDO Prepared Statements 사용
3. **XSS 방지**: 출력 시 적절한 이스케이프 처리
4. **API Rate Limiting**: 분당 100 요청 제한
5. **CORS 설정**: 필요에 따라 `config/config.php`에서 조정

## 🐛 문제 해결

### 데이터베이스 연결 실패

```
Database connection failed: SQLSTATE[HY000] [1045] Access denied
```

**해결**: `config/config.php`에서 데이터베이스 인증 정보 확인

### Moodle API 오류

```
Moodle API error: Invalid token
```

**해결**: Moodle 웹 서비스 토큰이 올바른지 확인

### 함수 평가 오류

```
Expression evaluation error
```

**해결**: 지원하는 수식 형식인지 확인 (문서의 "지원하는 수식" 참조)

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 기여

버그 리포트 및 기능 제안은 이슈로 등록해주세요.

## 📞 문의

프로젝트 관련 문의: KAIST Touch Math Academy
