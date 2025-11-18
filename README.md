# Parabola Glow - 2차 부등식 시각화 앱

**Moodle LMS와 연동하여 2차 부등식의 해를 아름다운 빛 효과로 표시하는 교육용 웹앱**

## 📱 프로젝트 개요

Parabola Glow는 수학 교육을 위한 인터랙티브 웹 애플리케이션입니다. Moodle LMS로부터 2차 부등식 문제를 받아와서 우측 하단의 가상 스마트폰 화면에 포물선과 해 영역을 시각화합니다.

### 주요 기능

- ✅ **Moodle 3.7 LMS 연동** - MySQL 데이터베이스에서 문제 정보 로드
- ✅ **2차 부등식 자동 해석** - ax² + bx + c {<, >, ≤, ≥} 0 형태 파싱
- ✅ **실시간 계산** - 판별식, 근, 꼭짓점, 해 구간 자동 계산
- ✅ **아름다운 시각화** - Canvas를 이용한 포물선 그래프
- ✅ **Glow 효과** - 해 영역을 그라디언트 빛으로 강조
- ✅ **반응형 스마트폰 UI** - 우측 하단 고정 위치 가상 스마트폰

## 🛠 기술 스택

### Backend
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### Frontend
- **HTML5 / CSS3**
- **JavaScript (ES6+)**
- **Canvas API**

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── config/
│   └── database.php           # MySQL 데이터베이스 연결 설정
├── src/
│   ├── api/
│   │   ├── moodle_integration.php   # Moodle LMS 연동 API
│   │   └── parabola_solver.php      # 2차 부등식 솔버
│   ├── js/
│   │   └── parabola_glow.js         # 시각화 및 앱 로직
│   └── css/
│       └── smartphone.css           # 스마트폰 UI 스타일
├── public/
│   └── index.html             # 메인 HTML 페이지
└── README.md
```

## 🚀 설치 및 실행

### 1. 요구사항

- PHP 7.1.9 이상
- MySQL 5.7
- Apache 또는 Nginx 웹 서버
- Moodle 3.7 (선택사항)

### 2. 데이터베이스 설정

`config/database.php` 파일을 수정하여 데이터베이스 정보를 입력하세요:

```php
private $host = 'localhost';
private $db_name = 'moodle';
private $username = 'your_username';
private $password = 'your_password';
```

### 3. 웹 서버 설정

#### Apache (.htaccess 예시)
```apache
RewriteEngine On
RewriteBase /

# API endpoints
RewriteRule ^api/moodle$ src/api/moodle_integration.php [L]
RewriteRule ^api/solver$ src/api/parabola_solver.php [L]
```

#### Nginx (nginx.conf 예시)
```nginx
location /api/moodle {
    try_files $uri /src/api/moodle_integration.php;
}

location /api/solver {
    try_files $uri /src/api/parabola_solver.php;
}
```

### 4. 실행

웹 브라우저에서 `http://localhost/public/index.html`로 접속하세요.

## 🎯 사용 방법

### 기본 사용

1. 페이지가 로드되면 자동으로 Moodle에서 문제를 가져옵니다
2. 문제가 없으면 기본 예제 문제가 표시됩니다
3. 포물선과 해 영역이 Glow 효과와 함께 표시됩니다
4. 하단 버튼을 클릭하여 다른 예제를 확인할 수 있습니다

### Moodle 연동

Moodle 데이터베이스에 다음 형식의 문제를 생성하세요:

```sql
INSERT INTO mdl_question (name, questiontext, qtype)
VALUES (
    '2차 부등식 예제',
    'x² - 4x + 3 < 0의 해를 구하시오.',
    'calculated'
);
```

특정 문제를 로드하려면:

```javascript
app.loadProblem(questionId);
```

## 📊 API 엔드포인트

### 1. Moodle Integration API

**GET** `/src/api/moodle_integration.php?id={question_id}`

문제 정보를 가져옵니다.

**응답 예시:**
```json
{
  "id": 123,
  "title": "2차 부등식 예제",
  "problem_text": "x² - 4x + 3 < 0의 해를 구하시오.",
  "inequality": {
    "a": 1,
    "b": -4,
    "c": 3,
    "operator": "<"
  }
}
```

### 2. Parabola Solver API

**POST** `/src/api/parabola_solver.php`

2차 부등식을 해결합니다.

**요청 본문:**
```json
{
  "a": 1,
  "b": -4,
  "c": 3,
  "operator": "<"
}
```

**응답 예시:**
```json
{
  "coefficients": { "a": 1, "b": -4, "c": 3 },
  "vertex": { "x": 2, "y": -1 },
  "discriminant": 4,
  "roots": [1, 3],
  "operator": "<",
  "solution": {
    "type": "interval",
    "intervals": [{ "start": 1, "end": 3 }],
    "description": "(1.00, 3.00)"
  },
  "opens_upward": true
}
```

## 🎨 시각화 설명

### Glow 효과

- **파란색 그라디언트**: 포물선 아래 영역 (< 또는 ≤)
- **노란색 그라디언트**: 포물선 위 영역 (> 또는 ≥)
- **빨간색 점**: 근 (roots)
- **초록색 점**: 꼭짓점 (vertex)

### 해 영역 표시

1. **두 개의 실근**: 근 사이 또는 외부 영역에 Glow 표시
2. **중근**: 점으로 표시 (≤, ≥인 경우만)
3. **실근 없음**: 전체 영역 또는 공집합

## 🔧 개발자 가이드

### 새로운 예제 추가

```javascript
app.loadExample(a, b, c, operator);

// 예시
app.loadExample(2, -8, 6, '<=');  // 2x² - 8x + 6 ≤ 0
```

### 시각화 커스터마이징

`src/js/parabola_glow.js`의 `ParabolaGlow` 클래스에서 다음을 수정할 수 있습니다:

- `fillGlowRegion()`: Glow 색상 및 투명도
- `drawParabola()`: 포물선 선 색상 및 두께
- `calculateBounds()`: 그래프 표시 범위

### 스타일 커스터마이징

`src/css/smartphone.css`에서 스마트폰 UI 스타일을 수정할 수 있습니다:

- `.smartphone-container`: 위치 및 크기
- `.glow-area`: Glow 효과 강도
- `.top-bar`: 상단 바 색상

## 📝 예제 문제

### 예제 1: x² - 4x + 3 < 0
- **해**: (1, 3)
- **근**: x = 1, x = 3
- **효과**: 두 근 사이 파란색 Glow

### 예제 2: x² - 4 > 0
- **해**: (-∞, -2) ∪ (2, ∞)
- **근**: x = -2, x = 2
- **효과**: 두 근 외부 노란색 Glow

### 예제 3: -x² + 2x + 3 ≤ 0
- **해**: (-∞, -1] ∪ [3, ∞)
- **근**: x = -1, x = 3
- **효과**: 아래로 볼록, 외부 파란색 Glow

### 예제 4: 2x² - 4x + 2 ≥ 0
- **해**: x = 1 (중근)
- **효과**: 점으로 표시

## 🔒 보안 고려사항

- ✅ PDO Prepared Statements 사용 (SQL Injection 방지)
- ✅ 입력 값 검증 (a ≠ 0, 유효한 연산자)
- ✅ CORS 헤더 설정
- ✅ 에러 로깅 (production에서는 상세 에러 숨김)

## 🐛 트러블슈팅

### 문제: "Connection Error"
- 데이터베이스 설정 확인 (`config/database.php`)
- MySQL 서버 실행 확인

### 문제: API 호출 실패
- PHP 에러 로그 확인
- 웹 서버 재시작
- CORS 설정 확인

### 문제: 포물선이 표시되지 않음
- 브라우저 콘솔 확인
- Canvas 지원 브라우저인지 확인
- JavaScript 파일 경로 확인

## 📄 라이선스

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 👨‍💻 개발자

AI Agent (Claude) - Initial implementation

## 🙏 감사의 말

KAIST Touch Math Academy 팀에게 감사드립니다.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
