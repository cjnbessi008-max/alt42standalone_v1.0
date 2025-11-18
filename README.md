# Wavy Integral - 물결치는 적분 시각화 앱

구간이 확장되면 넓이가 물결처럼 흔들리는 적분 시각화 웹 애플리케이션입니다.

## 주요 기능

- 🌊 **물결치는 적분 애니메이션**: 구간이 확장될 때 넓이가 물결처럼 흔들리는 시각적 효과
- 📱 **가상 스마트폰 화면**: 우측 하단에 표시되는 가상 스마트폰 UI
- 🔗 **LMS 연동**: Moodle 3.7과 연동하여 문제 정보 수신 및 답안 제출
- 📊 **실시간 적분 계산**: 리만 합을 이용한 정적분 값 계산
- 🎨 **인터랙티브 컨트롤**: 구간 설정, 파동 강도 조절, 실시간 애니메이션

## 기술 스택

### 프론트엔드
- HTML5 Canvas
- CSS3 (Flexbox, Animations)
- Vanilla JavaScript (ES6+)

### 백엔드
- PHP 7.1.9
- MySQL 5.7

### LMS 연동
- Moodle 3.7
- RESTful API

## 설치 방법

### 1. 데이터베이스 설정

```bash
# MySQL에 로그인
mysql -u root -p

# 스키마 실행
source database/schema.sql
```

### 2. 데이터베이스 설정 파일 수정

`api/db_config.php` 파일에서 데이터베이스 접속 정보를 수정합니다:

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
define('DB_NAME', 'moodle_wavy');
```

### 3. 웹 서버 실행

#### Apache/Nginx 사용 시
프로젝트 루트를 document root로 설정

#### PHP 내장 서버 사용 시
```bash
php -S localhost:8000
```

### 4. 브라우저에서 접속

```
http://localhost:8000
```

## 사용 방법

### 기본 조작

1. **구간 설정**: 시작점(a)과 끝점(b) 입력 필드로 적분 구간 설정
2. **파동 강도**: 슬라이더로 물결 효과의 강도 조절 (0-100)
3. **구간 확장**: 버튼 클릭 시 현재 구간을 양쪽으로 확장하며 물결 애니메이션 실행
4. **초기화**: 모든 설정을 초기 상태로 되돌림

### 키보드 단축키

- `E`: 구간 확장
- `R`: 초기화
- `Space`: 애니메이션 토글 (시작/정지)

### 스마트폰 화면

우측 하단의 가상 스마트폰 화면에서:
- 적분 그래프 실시간 표시
- 적분 값 계산 결과 표시
- LMS 연결 상태 확인

## LMS 연동

### URL 파라미터

Moodle에서 앱을 호출할 때 다음 파라미터를 전달할 수 있습니다:

```
http://localhost:8000?problem_id=PROB_001&student_id=STU_001
```

- `problem_id` (또는 `pid`): 문제 ID
- `student_id` (또는 `sid`): 학생 ID
- `course_id` (또는 `cid`): 과정 ID

### API 엔드포인트

#### 문제 정보 가져오기
```
GET /api/moodle_connector.php?action=getProblem&id=PROB_001
```

#### 학생 정보 가져오기
```
GET /api/moodle_connector.php?action=getStudent&id=STU_001
```

#### 답안 제출
```
POST /api/moodle_connector.php
Content-Type: application/json

{
  "action": "submitAnswer",
  "problemId": "PROB_001",
  "studentId": "STU_001",
  "answer": {
    "value": 3.416,
    "lowerBound": 0,
    "upperBound": 2
  }
}
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html              # 메인 HTML 파일
├── css/
│   └── styles.css         # 스타일시트
├── js/
│   ├── wavyIntegral.js    # 적분 시각화 클래스
│   ├── lmsConnector.js    # LMS 연동 클래스
│   └── app.js             # 메인 애플리케이션
├── api/
│   ├── moodle_connector.php  # Moodle API 연동
│   └── db_config.php         # 데이터베이스 설정
├── database/
│   └── schema.sql         # 데이터베이스 스키마
└── README.md              # 프로젝트 문서
```

## 개발자 모드

브라우저 콘솔에서 다음 명령어를 사용할 수 있습니다:

```javascript
// 애니메이션 시작
wavyIntegral.startAnimation();

// 애니메이션 정지
wavyIntegral.stopAnimation();

// 구간 확장
wavyIntegral.expandInterval(0, 4);

// 초기화
wavyIntegral.reset();

// LMS에 답안 제출
submitIntegralAnswer();
```

## 데이터베이스 스키마

### 주요 테이블

- `wavy_problems`: 문제 정보
- `wavy_students`: 학생 정보
- `wavy_submissions`: 답안 제출 기록
- `wavy_progress`: 학습 진행 상황

### 샘플 문제

데이터베이스에는 3개의 샘플 문제가 포함되어 있습니다:

1. **PROB_001**: 기본 적분 [0, 2]
2. **PROB_002**: 확장 구간 [0, 4]
3. **PROB_003**: 넓은 구간 [-1, 5]

## 수학 함수

현재 구현된 함수: `f(x) = sin(x) + 2`

함수를 변경하려면 `js/wavyIntegral.js`의 `func` 속성을 수정하세요:

```javascript
// 예: 이차 함수
this.func = (x) => x * x;

// 예: 삼각 함수 조합
this.func = (x) => Math.sin(x) + Math.cos(x) + 2;
```

## 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

MIT License

## 기여

이슈 제보 및 풀 리퀘스트를 환영합니다!

## 문의

프로젝트 관련 문의사항은 이슈로 등록해 주세요.
