# Wave Rate - 함수 변화율 파동 시각화 웹앱

LMS(Moodle)와 연동하여 함수의 변화율(도함수)을 파동으로 시각화하는 교육용 웹 애플리케이션입니다.

## 📱 주요 기능

- **LMS 연동**: Moodle 3.7과 연동하여 문제 정보를 자동으로 가져옴
- **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 보이는 가상 디바이스 화면
- **Wave Rate 시각화**: 함수의 변화율을 파동으로 실시간 애니메이션 표현
- **인터랙티브 학습**: 속도와 진폭을 조절하며 수학적 개념 학습
- **자동 평가**: 학생 응답을 자동으로 평가하고 Moodle에 성적 제출

## 🛠 기술 스택

- **Database**: MySQL 5.7
- **Backend**: PHP 7.1.9 (PDO)
- **LMS**: Moodle 3.7 Web Service API
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization**: HTML5 Canvas API

## 📁 프로젝트 구조

```
wave-rate-app/
├── config/
│   ├── database.php         # MySQL 데이터베이스 설정
│   └── moodle.php           # Moodle API 연동 설정
├── api/
│   ├── get_problems.php     # 문제 정보 조회 API
│   └── submit_answer.php    # 학생 응답 제출 API
├── public/
│   ├── index.php            # 메인 페이지
│   ├── css/
│   │   └── style.css        # 스타일시트 (스마트폰 UI 포함)
│   └── js/
│       ├── wave-rate.js     # Wave Rate 시각화 엔진
│       └── smartphone-ui.js # UI 컨트롤러
├── database/
│   └── schema.sql           # 데이터베이스 스키마
└── README.md
```

## 🚀 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL 데이터베이스 생성
mysql -u root -p

CREATE DATABASE wave_rate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wave_rate_db;
SOURCE database/schema.sql;
EXIT;
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wave_rate_db
DB_USER=root
DB_PASS=your_password

# Moodle Configuration
MOODLE_URL=http://your-moodle-site.com/moodle
MOODLE_TOKEN=your_webservice_token
```

### 3. 웹 서버 설정

**Apache 설정 예시** (httpd.conf 또는 VirtualHost):

```apache
<VirtualHost *:80>
    ServerName wave-rate.local
    DocumentRoot /path/to/wave-rate-app/public

    <Directory /path/to/wave-rate-app/public>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/wave-rate-error.log
    CustomLog ${APACHE_LOG_DIR}/wave-rate-access.log combined
</VirtualHost>
```

**PHP Built-in Server** (개발용):

```bash
cd wave-rate-app/public
php -S localhost:8000
```

### 4. Moodle Web Service 설정

1. Moodle 관리자 페이지 접속
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요** 이동
3. Web Service 활성화
4. 토큰 생성:
   - **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
   - 새 토큰 생성하여 `.env` 파일에 입력

## 💡 사용 방법

### 학생 사용 시나리오

1. **문제 선택**: 드롭다운에서 학습할 함수 선택
2. **시작**: '시작' 버튼을 눌러 Wave Rate 애니메이션 실행
3. **관찰**: 우측 하단 스마트폰 화면에서 파동 패턴 관찰
   - 파란색: 원함수 f(x)
   - 빨간색: 도함수 f'(x)
   - 초록색: 변화율을 나타내는 파동
4. **조절**: 속도와 진폭을 조절하며 패턴 이해
5. **제출**: 이해가 완료되면 '제출' 버튼으로 응답 제출

### 교사/관리자

- Moodle에서 새 문제를 생성하면 자동으로 앱에 반영
- 데이터베이스에서 학생 응답 및 정확도 확인 가능

## 🎨 Wave Rate 시각화 알고리즘

### 핵심 개념

함수 f(x)의 변화율 f'(x)를 파동으로 표현:

```javascript
// 1. 수치 미분 계산 (중앙 차분법)
f'(x) ≈ [f(x + h) - f(x - h)] / (2h)

// 2. 변화율에 따른 파동 진폭 계산
amplitude = tanh(|f'(x)| / 5) × 30 × amplitudeScale

// 3. 파동 y 좌표 계산
waveY = centerY + amplitude × sin(phase + x × frequency)
```

### 특징

- **변화율이 클수록** → 파동 진폭이 커짐
- **변화율이 양수** → 파동이 위쪽으로
- **변화율이 음수** → 파동이 아래쪽으로
- **실시간 애니메이션**으로 변화 추이 직관적 이해

## 📊 데이터베이스 스키마

### problems 테이블
문제 정보 저장 (Moodle과 연동)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| moodle_question_id | INT | Moodle 문제 ID |
| question_text | TEXT | 문제 설명 |
| function_expression | VARCHAR(255) | 함수 표현식 (JavaScript) |
| x_min, x_max | DECIMAL | X축 범위 |
| difficulty_level | ENUM | 난이도 (easy/medium/hard) |

### student_responses 테이블
학생 응답 저장

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INT | 기본 키 |
| student_id | INT | 학생 ID |
| problem_id | INT | 문제 ID |
| response_data | JSON | 응답 데이터 (패턴 매칭 정확도 포함) |
| is_correct | BOOLEAN | 정답 여부 |
| submitted_at | TIMESTAMP | 제출 시각 |

## 🔌 API 엔드포인트

### GET /api/get_problems.php

문제 목록 또는 특정 문제 조회

**파라미터:**
- `id` (optional): 문제 ID
- `moodle_id` (optional): Moodle 문제 ID

**응답:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "question_text": "함수 f(x) = x²의 변화율...",
    "function_expression": "x*x",
    "x_min": -5,
    "x_max": 5,
    "difficulty_level": "easy"
  }
}
```

### POST /api/submit_answer.php

학생 응답 제출

**요청 본문:**
```json
{
  "student_id": 1,
  "problem_id": 1,
  "response_data": {
    "wave_pattern_match": 0.85,
    "speed": 1.5,
    "amplitude_scale": 1.2
  },
  "moodle_attempt_id": 12345
}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "response_id": 42,
    "is_correct": true,
    "accuracy": 0.85,
    "message": "정답입니다!"
  }
}
```

## 🎯 주요 클래스

### WaveRateEngine

Canvas 기반 파동 시각화 엔진

```javascript
const engine = new WaveRateEngine('wave-canvas');
engine.setFunction('x*x', -5, 5);
engine.start();
```

**주요 메서드:**
- `setFunction(expr, xMin, xMax)`: 함수 설정
- `start()`: 애니메이션 시작
- `pause()`: 일시정지
- `reset()`: 초기화
- `setSpeed(speed)`: 속도 조절
- `setAmplitudeScale(scale)`: 진폭 배율 조절

### SmartphoneUI

UI 컨트롤러 및 API 통신 관리

```javascript
const ui = new SmartphoneUI();
```

## 🧪 테스트

### 샘플 문제

데이터베이스 초기화 시 다음 샘플 문제가 자동 생성됩니다:

1. **f(x) = x²** (easy) - 2차 함수의 선형 변화율
2. **f(x) = sin(x)** (medium) - 주기 함수의 변화율
3. **f(x) = e^x** (hard) - 지수 함수의 급격한 변화

### 브라우저 테스트

1. `http://localhost:8000` 접속
2. 문제 선택 후 '시작' 버튼 클릭
3. 우측 하단 스마트폰 화면에서 파동 애니메이션 확인
4. 속도/진폭 슬라이더로 조절
5. '제출' 버튼으로 응답 전송 확인

## 🔧 문제 해결

### API 연결 오류

- `.env` 파일의 데이터베이스 설정 확인
- MySQL 서비스 실행 여부 확인: `sudo service mysql status`
- PHP PDO 확장 설치 확인: `php -m | grep pdo_mysql`

### Moodle 연동 오류

- Moodle Web Service가 활성화되었는지 확인
- 토큰이 올바른지 확인
- CORS 설정 확인 (필요시 Moodle에서 허용)

### Canvas 렌더링 문제

- 브라우저 콘솔에서 JavaScript 오류 확인
- 브라우저 호환성: Chrome, Firefox, Safari, Edge 최신 버전 권장

## 📝 라이선스

MIT License

## 👥 기여

이슈 제보 및 Pull Request 환영합니다!

## 📧 문의

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.
