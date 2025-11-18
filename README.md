# Root Wave - 근 변화 알림 시스템

Moodle LMS와 연동하여 방정식의 근 개수 변화를 실시간으로 감지하고 시각적 파동 효과로 알려주는 웹 애플리케이션입니다.

## 주요 기능

- **실시간 근 감지**: 방정식 분석 및 근의 개수 자동 계산
- **Root Wave 애니메이션**: 근의 개수가 변할 때 화면 파동 효과
- **가상 스마트폰 UI**: 우측 하단에 표시되는 인터랙티브 스마트폰 화면
- **Moodle 연동**: Moodle LMS에서 문제 정보 자동 수신
- **실시간 로그**: 모든 변화 기록 추적

## 기술 스택

### 프론트엔드
- HTML5 / CSS3
- Vanilla JavaScript (ES6+)
- Canvas API (파동 애니메이션)

### 백엔드
- PHP 7.1.9+
- MySQL 5.7+

### 연동
- Moodle 3.7+

## 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
source database/schema.sql
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 데이터베이스 정보를 입력합니다:

```env
# Root Wave Database
DB_HOST=localhost
DB_NAME=root_wave
DB_USER=root
DB_PASS=your_password

# Moodle Database
MOODLE_DB_HOST=localhost
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=root
MOODLE_DB_PASS=your_password
```

### 4. 웹 서버 설정

#### Apache 설정 예시

```apache
<VirtualHost *:80>
    ServerName rootwave.local
    DocumentRoot /path/to/alt42standalone_v1.0/public

    <Directory /path/to/alt42standalone_v1.0/public>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/rootwave_error.log
    CustomLog ${APACHE_LOG_DIR}/rootwave_access.log combined
</VirtualHost>
```

#### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name rootwave.local;
    root /path/to/alt42standalone_v1.0/public;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 5. PHP 확장 모듈 확인

```bash
# 필요한 PHP 확장 모듈
php -m | grep -E "pdo|pdo_mysql|json|mbstring"
```

## 사용 방법

### 기본 실행

1. 웹 브라우저에서 `http://localhost/alt42standalone_v1.0/public/` 접속
2. 우측 하단에 가상 스마트폰이 표시됩니다
3. 자동으로 Moodle과 연결을 시도합니다

### 데모 모드

Moodle 없이 테스트하려면 자동으로 **데모 모드**가 활성화됩니다:
- 10초마다 새로운 샘플 방정식이 제공됩니다
- 근의 개수 변화 시 Wave 애니메이션이 표시됩니다

### 콘솔에서 직접 테스트

브라우저 개발자 도구 콘솔에서:

```javascript
// 특정 방정식 테스트
app.testEquation("x^2 - 4 = 0");

// 다른 방정식으로 변경 (근의 개수 변화)
app.testEquation("x^2 + 1 = 0");

// 현재 상태 확인
rootDetector.getState();
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/
│   └── index.html              # 메인 HTML
├── src/
│   ├── css/
│   │   ├── smartphone.css      # 스마트폰 UI 스타일
│   │   └── wave-animation.css  # 파동 애니메이션 스타일
│   ├── js/
│   │   ├── app.js              # 메인 애플리케이션
│   │   ├── wave-animation.js   # 파동 애니메이션 컨트롤러
│   │   ├── root-detector.js    # 근 감지 로직
│   │   └── moodle-connector.js # Moodle 연동
│   └── php/
│       ├── moodle-api.php      # API 엔드포인트
│       └── moodle-integration.php # Moodle DB 연동
├── config/
│   └── database.php            # 데이터베이스 설정
├── database/
│   └── schema.sql              # DB 스키마
└── README.md
```

## API 엔드포인트

### POST `/src/php/moodle-api.php`

#### 1. 연결 테스트
```json
{
  "action": "ping"
}
```

#### 2. 문제 가져오기
```json
{
  "action": "get_problem",
  "sessionId": "session_123",
  "userId": 1,
  "courseId": 1
}
```

#### 3. 응답 제출
```json
{
  "action": "submit_answer",
  "sessionId": "session_123",
  "userId": 1,
  "answer": "x = 2, 3"
}
```

#### 4. 근 변화 기록
```json
{
  "action": "save_root_change",
  "equation": "x^2 - 4 = 0",
  "oldCount": 0,
  "newCount": 2,
  "roots": [2, -2],
  "userId": 1
}
```

## 방정식 형식

지원되는 방정식 타입:

### 1차 방정식
```
2x - 4 = 0
```

### 2차 방정식
```
x^2 - 4 = 0
x^2 + 2x + 1 = 0
2x^2 - 8x + 6 = 0
```

### 3차 방정식
```
x^3 - 6x^2 + 11x - 6 = 0
```

## Wave 애니메이션

근의 개수가 변할 때:

- **증가**: 파란색 파동 효과
- **감소**: 빨간색 파동 효과
- **스마트폰 흔들림**: 변화 강조
- **캔버스 파동 강화**: 진폭 일시적 증가

## 데이터베이스 스키마

### 주요 테이블

1. **sessions**: 사용자 세션 관리
2. **problems**: 문제 정보
3. **root_changes**: 근 변화 기록 (핵심)
4. **problem_answers**: 학생 응답
5. **wave_animations**: 애니메이션 로그
6. **system_logs**: 시스템 로그

### 통계 뷰

```sql
SELECT * FROM v_root_change_statistics;
```

## Moodle 연동

### Moodle 데이터베이스 구조

Moodle의 다음 테이블과 연동:
- `mdl_quiz_attempts`: 퀴즈 시도
- `mdl_question_attempts`: 문제 시도
- `mdl_question`: 문제 정보

### 문제 형식

Moodle 퀴즈에서 **계산형(calculated)** 또는 **수치형(numerical)** 문제 타입을 사용합니다.

## 개발 모드

### 디버그 활성화

JavaScript 콘솔에서:

```javascript
// Wave 디버그 모드
document.getElementById('waveOverlay').classList.add('debug');

// 로그 레벨 설정
localStorage.setItem('logLevel', 'debug');
```

## 트러블슈팅

### 1. Moodle 연결 실패

- `config/database.php`에서 Moodle DB 정보 확인
- Moodle DB 접근 권한 확인
- 데모 모드로 우선 테스트

### 2. Wave 애니메이션 작동 안 함

- 브라우저 콘솔에서 JavaScript 오류 확인
- Canvas API 지원 브라우저 사용 (Chrome, Firefox 권장)

### 3. 근 계산 오류

- 방정식 형식 확인 (`x^2 - 4 = 0` 형태)
- 계수가 너무 크거나 작지 않은지 확인

## 성능 최적화

- 데이터베이스 인덱스 활용
- 폴링 주기 조정 (기본 5초)
- 오래된 로그 정리:

```sql
CALL sp_cleanup_old_logs(90); -- 90일 이상 로그 삭제
```

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

이 프로젝트는 교육용으로 제작되었습니다.

## 기여

버그 리포트 및 기능 제안은 이슈로 등록해 주세요.

## 연락처

KAIST Touch Math Academy

---

**Root Wave** - 수학 학습을 위한 실시간 근 변화 감지 시스템
