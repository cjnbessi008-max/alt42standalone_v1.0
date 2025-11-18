# Derivative Flip Cards - 미분 규칙 학습 앱

Moodle LMS와 연동되는 미분 규칙 학습용 플립 카드 웹 애플리케이션입니다.

## 🎯 주요 기능

- **플립 카드 인터페이스**: 카드를 뒤집어서 미분 규칙과 예제를 학습
- **스마트폰 화면 시뮬레이션**: 우측 하단에 가상 스마트폰 화면으로 표시
- **Moodle LMS 연동**: 학생 정보 및 학습 진도 추적
- **🤖 AI 추천 시스템**: 학습 패턴 분석 기반 개인화 추천
  - 학습하지 않은 카드 우선 추천
  - 난이도 순차 학습 지원
  - 간격 반복 학습 (Spaced Repetition)
  - 개인 맞춤형 학습 경로 생성
- **12가지 미분 규칙**: 기본부터 고급 미분 규칙까지 포함
- **인터랙티브 학습**: 키보드, 마우스, 터치 제스처 지원
- **수학 공식 렌더링**: MathJax를 사용한 LaTeX 수식 표시

## 📋 시스템 요구사항

- **웹 서버**: Apache 2.4+ 또는 Nginx
- **PHP**: 7.1.9+
- **MySQL**: 5.7+
- **Moodle**: 3.7+
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 버전)

## 🚀 설치 방법

### 1. 파일 배포

Moodle이 설치된 서버의 웹 접근 가능한 디렉토리에 파일들을 복사합니다:

```bash
# Moodle 디렉토리로 이동
cd /var/www/html/moodle

# derivative-flip-cards 디렉토리 생성
mkdir derivative-flip-cards
cd derivative-flip-cards

# 파일 복사 (프로젝트 파일 위치에서)
cp -r /path/to/derivative-flip-cards/* .
```

### 2. 데이터베이스 설정

`config/database.php` 파일을 편집하여 Moodle 데이터베이스 정보를 입력합니다:

```php
define('DB_HOST', 'localhost');           // 데이터베이스 호스트
define('DB_NAME', 'moodle');              // Moodle 데이터베이스 이름
define('DB_USER', 'moodle_user');         // 데이터베이스 사용자
define('DB_PASS', 'your_password');       // 데이터베이스 비밀번호
define('DB_PREFIX', 'mdl_');              // Moodle 테이블 접두사
```

### 3. 데이터베이스 초기화

터미널에서 다음 명령을 실행하여 필요한 테이블을 생성합니다:

```bash
php php/setup-database.php
```

성공적으로 실행되면 다음과 같은 테이블이 생성됩니다:
- `mdl_derivative_cards` - 미분 규칙 카드 데이터
- `mdl_derivative_student_progress` - 학생 진도 추적
- `mdl_derivative_card_events` - 카드 상호작용 이벤트 로그

### 4. 웹 서버 권한 설정

```bash
# 적절한 권한 설정
chown -R www-data:www-data derivative-flip-cards
chmod -R 755 derivative-flip-cards
```

## 📱 사용 방법

### 독립 실행 모드

브라우저에서 직접 접근:
```
http://your-moodle-site.com/derivative-flip-cards/index.html
```

### Moodle 연동 모드

학생 ID와 코스 ID를 URL 파라미터로 전달:
```
http://your-moodle-site.com/derivative-flip-cards/index.html?student_id=123&course_id=456
```

### Moodle 활동으로 추가

1. Moodle 코스에 "URL" 활동 추가
2. 외부 URL 설정:
   ```
   https://your-moodle-site.com/derivative-flip-cards/index.html?student_id={$USER->id}&course_id={$COURSE->id}
   ```

## 🎮 조작 방법

### 키보드
- **왼쪽 화살표**: 이전 카드
- **오른쪽 화살표**: 다음 카드
- **스페이스 / Enter**: 카드 뒤집기

### 마우스
- **카드 클릭**: 카드 뒤집기
- **이전/다음 버튼**: 카드 이동
- **뒤집기 버튼**: 카드 뒤집기

### 🤖 AI 추천 기능 버튼
- **추천 카드**: AI가 분석한 학습 패턴 기반 최적의 다음 카드 표시
- **학습 경로**: 개인화된 5단계 학습 순서 제안
- **스마트 다음**: 추천 알고리즘을 활용한 지능형 다음 카드 이동

### 터치 (모바일)
- **탭**: 카드 뒤집기
- **좌우 스와이프**: 카드 이동

## 📊 데이터베이스 구조

### mdl_derivative_cards
미분 규칙 카드 정보를 저장합니다.

```sql
- id: INT (Primary Key)
- course_id: INT (NULL = 모든 코스)
- rule_name: VARCHAR(255) - 규칙 이름
- formula: TEXT - LaTeX 수식
- example: TEXT - 예제
- description: TEXT - 설명
- display_order: INT - 표시 순서
- active: TINYINT(1) - 활성 상태
```

### mdl_derivative_student_progress
학생별 학습 진도를 추적합니다.

```sql
- id: INT (Primary Key)
- student_id: INT - Moodle 사용자 ID
- course_id: INT - 코스 ID
- progress: DECIMAL(5,2) - 진행률 (%)
- cards_viewed: INT - 본 카드 수
- cards_flipped: INT - 뒤집은 카드 수
- last_card_id: INT - 마지막으로 본 카드
```

### mdl_derivative_card_events
카드 상호작용 이벤트를 기록합니다.

```sql
- id: INT (Primary Key)
- student_id: INT - Moodle 사용자 ID
- card_id: INT - 카드 ID
- event_type: VARCHAR(50) - 'view' 또는 'flip'
- event_timestamp: TIMESTAMP
```

## 🔧 커스터마이징

### 새로운 카드 추가

데이터베이스에 직접 추가:

```sql
INSERT INTO mdl_derivative_cards
(rule_name, formula, example, description, display_order)
VALUES (
    'tan 함수의 미분',
    '$$\\frac{d}{dx}(\\tan x) = \\sec^2 x$$',
    '예: $$\\frac{d}{dx}(\\tan 2x) = 2\\sec^2 2x$$',
    'tan(x)를 미분하면 sec²(x)입니다.',
    13
);
```

### 스타일 변경

`css/styles.css` 파일을 수정하여 색상, 크기, 폰트 등을 변경할 수 있습니다:

```css
/* 카드 앞면 색상 변경 */
.flip-card-front {
    background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

/* 카드 뒷면 색상 변경 */
.flip-card-back {
    background: linear-gradient(135deg, #your-color3 0%, #your-color4 100%);
}
```

### 스마트폰 위치 변경

CSS에서 `.smartphone-container` 위치 수정:

```css
.smartphone-container {
    position: fixed;
    bottom: 20px;   /* 하단 여백 */
    right: 20px;    /* 우측 여백 */
    /* left: 20px;  좌측으로 변경하려면 right 대신 left 사용 */
}
```

## 🔍 API 엔드포인트

### GET /php/api.php?action=getStudent
학생 정보를 조회합니다.

**파라미터:**
- `student_id`: Moodle 사용자 ID
- `course_id`: 코스 ID (선택)

**응답:**
```json
{
  "success": true,
  "student": {
    "id": 123,
    "name": "홍길동",
    "username": "hong123",
    "email": "hong@example.com",
    "progress": 75.5
  }
}
```

### GET /php/api.php?action=getCards
미분 규칙 카드 목록을 조회합니다.

**파라미터:**
- `course_id`: 코스 ID (선택)

**응답:**
```json
{
  "success": true,
  "cards": [
    {
      "id": 1,
      "rule_name": "상수 함수의 미분",
      "formula": "$$\\frac{d}{dx}(c) = 0$$",
      "example": "예: $$\\frac{d}{dx}(5) = 0$$",
      "description": "상수의 미분은 항상 0입니다."
    }
  ]
}
```

### POST /php/api.php
이벤트를 추적합니다.

**요청 본문:**
```json
{
  "action": "trackEvent",
  "student_id": 123,
  "card_id": 1,
  "event_type": "flip",
  "timestamp": "2025-11-18T10:30:00Z"
}
```

### 🤖 GET /php/api.php?action=getRecommendation
AI 기반 개인화 카드 추천을 제공합니다.

**파라미터:**
- `student_id`: Moodle 사용자 ID (필수)
- `course_id`: 코스 ID (선택)

**응답:**
```json
{
  "success": true,
  "recommendation": {
    "id": 3,
    "rule_name": "상수배 법칙",
    "formula": "$$\\frac{d}{dx}[cf(x)] = c\\frac{d}{dx}f(x)$$",
    "recommendation_score": 85,
    "recommendation_reasons": [
      "아직 학습하지 않은 새로운 카드입니다",
      "현재 학습 수준에 적합한 난이도입니다"
    ]
  }
}
```

**추천 알고리즘:**
- 미학습 카드 우선 추천 (+100점)
- 난이도 적합성 평가 (+50점)
- 간격 반복 학습 적용 (+40점)
- 학습 참여도 분석 (+25점)
- 순차 학습 권장 (+30점)

### 🤖 GET /php/api.php?action=getLearningPath
개인화된 학습 경로를 생성합니다.

**파라미터:**
- `student_id`: Moodle 사용자 ID (필수)
- `course_id`: 코스 ID (선택)
- `count`: 추천할 카드 수 (기본값: 5)

**응답:**
```json
{
  "success": true,
  "path": [
    {
      "id": 1,
      "rule_name": "상수 함수의 미분",
      "recommendation_score": 100
    },
    {
      "id": 2,
      "rule_name": "거듭제곱 법칙",
      "recommendation_score": 95
    }
  ],
  "total_cards": 12
}
```

## 🐛 트러블슈팅

### 데이터베이스 연결 오류
- `config/database.php`의 연결 정보가 정확한지 확인
- MySQL 서비스가 실행 중인지 확인
- 데이터베이스 사용자 권한 확인

### MathJax 수식이 표시되지 않음
- 인터넷 연결 확인 (MathJax CDN 사용)
- 브라우저 콘솔에서 JavaScript 오류 확인

### 카드가 로드되지 않음
- 브라우저 개발자 도구에서 네트워크 탭 확인
- `php/api.php` 파일 권한 확인 (실행 가능해야 함)
- PHP 오류 로그 확인

## 📄 라이센스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 👥 개발자

KAIST Touch Math Academy - AI Education System Pipeline

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
