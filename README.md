# Alt42 - Value Bounce App

LMS(Moodle)와 연동하여 함수 값 변화를 공의 튀김으로 시각화하는 웹 애플리케이션입니다. 우측 하단 가상 스마트폰 화면에 Value Bounce 애니메이션이 표시됩니다.

## 🎯 주요 기능

- **Value Bounce 애니메이션**: 함수 값 변화를 물리 법칙 기반의 공 튀김으로 표현
- **가상 스마트폰 화면**: 우측 하단에 고정된 모바일 화면 UI
- **Moodle 3.7 연동**: LMS에서 문제 정보를 가져와 표시
- **다양한 함수 지원**: x², x, 2x, √|x|, |x| 등
- **실시간 시각화**: 값 변화에 따른 즉각적인 애니메이션 반응

## 🛠️ 기술 스택

### Frontend
- React 18.2
- Vite (빌드 도구)
- Framer Motion (애니메이션)

### Backend
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7

## 📋 시스템 요구사항

- Node.js 16 이상
- PHP 7.1.9
- MySQL 5.7
- Moodle 3.7 설치 환경

## 🚀 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치

```bash
cd alt42standalone_v1.0
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 Moodle 데이터베이스 정보를 입력하세요:

```env
VITE_API_URL=http://localhost:8000/backend/api
MOODLE_DB_HOST=localhost
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_user
MOODLE_DB_PASS=your_password
```

### 3. 데이터베이스 스키마 생성

Moodle MySQL 데이터베이스에 커스텀 테이블을 생성합니다:

```bash
mysql -u moodle_user -p moodle < backend/schema.sql
```

### 4. 백엔드 설정

`backend/config.php` 파일에서 데이터베이스 정보를 확인하고 수정하세요:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'moodle');
define('DB_USER', 'moodle_user');
define('DB_PASS', 'your_password');
```

### 5. PHP 개발 서버 실행 (백엔드)

```bash
cd backend
php -S localhost:8000
```

### 6. Vite 개발 서버 실행 (프론트엔드)

새 터미널을 열어 실행:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # PHP 백엔드
│   ├── api/
│   │   └── problems.php       # 문제 API 엔드포인트
│   ├── config.php             # 데이터베이스 설정
│   ├── database.php           # DB 연결 핸들러
│   ├── moodle_connector.php   # Moodle 연동 로직
│   └── schema.sql             # DB 스키마
│
├── src/                       # React 프론트엔드
│   ├── components/
│   │   ├── VirtualSmartphone/ # 가상 스마트폰 화면
│   │   │   ├── VirtualSmartphone.jsx
│   │   │   └── VirtualSmartphone.css
│   │   ├── ValueBounce/       # 공 튀김 애니메이션
│   │   │   ├── ValueBounce.jsx
│   │   │   └── ValueBounce.css
│   │   └── ControlPanel/      # 제어 패널
│   │       ├── ControlPanel.jsx
│   │       └── ControlPanel.css
│   ├── services/
│   │   └── moodleService.js   # Moodle API 클라이언트
│   ├── App.jsx                # 메인 앱
│   └── main.jsx               # 엔트리 포인트
│
├── index.html                 # HTML 템플릿
├── vite.config.js            # Vite 설정
├── package.json              # 의존성 관리
└── README.md                 # 문서
```

## 🎮 사용 방법

### 1. 함수 선택
제공된 함수 중 하나를 선택합니다:
- f(x) = x² (제곱 함수)
- f(x) = x (항등 함수)
- f(x) = 2x (일차 함수)
- f(x) = √|x| (제곱근 함수)
- f(x) = |x| (절댓값 함수)

### 2. 값 입력
- 직접 x 값을 입력하거나
- 미리 설정된 값(1, 2, 5, 10, 15, 20, 25, 30)을 클릭하거나
- 랜덤 값 생성 버튼을 클릭합니다

### 3. 애니메이션 관찰
- 우측 하단 가상 스마트폰 화면에서 공이 튀는 애니메이션을 관찰합니다
- 값이 클수록 공이 더 높이 튑니다
- 값 변화량에 따라 바운스 횟수가 달라집니다
- 공의 색상이 값에 따라 변합니다

## 🔧 Value Bounce 애니메이션 특징

### 물리 기반 바운스
- **높이**: 값 변화량에 비례 (최소 10%, 최대 60%)
- **바운스 횟수**: 값 변화량에 따라 1-4회
- **감쇠**: 각 바운스마다 60%씩 높이 감소

### 시각적 피드백
- **공 크기**: 값의 크기에 비례 (30px ~ 80px)
- **색상**: 값에 따라 HSL 색상 스펙트럼으로 변화
- **그림자**: 공의 위치에 따라 동기화
- **파동 효과**: 값 변경 시 ripple 효과

## 📊 Moodle 데이터베이스 스키마

### mdl_custom_function_problems
문제/퀴즈 정보를 저장하는 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 문제 ID (PK) |
| course_id | INT | 코스 ID |
| title | VARCHAR(255) | 문제 제목 |
| description | TEXT | 문제 설명 |
| function_type | VARCHAR(50) | 함수 유형 |
| function_expression | VARCHAR(255) | 함수 표현식 |
| min_value | DECIMAL | 최소값 |
| max_value | DECIMAL | 최대값 |
| difficulty | ENUM | 난이도 |

### mdl_custom_function_answers
사용자 응답을 저장하는 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | INT | 응답 ID (PK) |
| user_id | INT | 사용자 ID |
| problem_id | INT | 문제 ID (FK) |
| answer | TEXT | 사용자 답변 (JSON) |
| time_taken | DECIMAL | 소요 시간 |
| is_correct | TINYINT | 정답 여부 |
| submitted_at | TIMESTAMP | 제출 시각 |

## 🔌 API 엔드포인트

### GET /backend/api/problems.php

#### 문제 목록 조회
```
GET /backend/api/problems.php?action=list&course_id=1
```

#### 특정 문제 조회
```
GET /backend/api/problems.php?action=get&id=1
```

#### 사용자 진행도 조회
```
GET /backend/api/problems.php?action=progress&user_id=1&course_id=1
```

### POST /backend/api/problems.php

#### 답변 제출
```json
{
  "action": "submit_answer",
  "user_id": 1,
  "problem_id": 1,
  "answer": {"value": 25, "function": "x^2"},
  "time_taken": 12.5
}
```

## 🎨 커스터마이징

### 애니메이션 파라미터 조정

`src/components/ValueBounce/ValueBounce.jsx` 파일에서 다음 값들을 조정할 수 있습니다:

```javascript
// 바운스 높이 (5를 변경)
const bounceHeight = Math.min(60, Math.max(10, valueDiff * 5))

// 바운스 횟수 (5를 변경)
const bounceCount = Math.min(4, Math.max(1, Math.floor(valueDiff / 5) + 1))

// 감쇠율 (0.6을 변경)
const heightRatio = Math.pow(0.6, i)

// 공 크기 범위 (30, 80, 40, 2를 변경)
const ballSize = Math.min(80, Math.max(30, 40 + Math.abs(value) * 2))
```

### 스마트폰 위치 변경

`src/components/VirtualSmartphone/VirtualSmartphone.css`:

```css
.smartphone-container {
  position: fixed;
  bottom: 20px;  /* 하단 여백 */
  right: 20px;   /* 우측 여백 */
}
```

## 🐛 트러블슈팅

### CORS 에러
백엔드 `config.php`에서 CORS 설정 확인:
```php
define('CORS_ALLOWED_ORIGINS', '*'); // 개발 시
// define('CORS_ALLOWED_ORIGINS', 'https://yourdomain.com'); // 프로덕션
```

### 데이터베이스 연결 실패
- MySQL 서비스가 실행 중인지 확인
- `backend/config.php`의 DB 정보가 올바른지 확인
- Moodle 데이터베이스 사용자 권한 확인

### 애니메이션이 작동하지 않음
- 브라우저 콘솔에서 JavaScript 에러 확인
- Framer Motion 라이브러리 설치 확인: `npm install framer-motion`

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 🤝 기여

이슈 리포트 및 풀 리퀘스트를 환영합니다!

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

**Made with ❤️ for Mathematics Education**
