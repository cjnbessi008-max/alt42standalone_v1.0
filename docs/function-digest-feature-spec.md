# Function Digest 기능 명세서

## 1. 개요

### 1.1 기능 설명
Function Digest는 Moodle LMS와 연동하여 문제(Question) 속에 포함된 함수 정보를 자동으로 추출하고, 학습자가 이해하기 쉽도록 **3줄로 요약**하여 제공하는 기능입니다.

### 1.2 목적
- 복잡한 함수 코드를 빠르게 이해할 수 있도록 지원
- 학습자의 문제 해결 시간 단축
- 함수의 핵심 개념을 명확하게 전달

### 1.3 사용자 시나리오
```
1. 학습자가 Moodle에서 코딩 문제를 풀고 있음
2. 문제에 복잡한 함수가 포함되어 있음
3. 우측 하단 스마트폰 UI에 Function Digest가 자동으로 표시됨
4. 학습자는 3줄의 요약을 통해 함수의 핵심을 빠르게 파악
```

---

## 2. 기능 요구사항 (Functional Requirements)

### FR-1: 함수 자동 추출
- **FR-1.1**: Moodle Question 텍스트에서 함수 정의를 자동으로 감지
- **FR-1.2**: Python, JavaScript, Java 등 다양한 언어 지원
- **FR-1.3**: 여러 개의 함수가 있을 경우 모두 추출

### FR-2: 3줄 요약 생성
- **FR-2.1**: **Line 1 - 함수의 목적**: 함수가 무엇을 하는지 설명
  - 예: "📐 Calculates the area of a rectangle"
- **FR-2.2**: **Line 2 - 파라미터와 리턴 타입**: 입력값과 출력값 설명
  - 예: "📥 Parameters: width (float), height (float) → Returns: float"
- **FR-2.3**: **Line 3 - 핵심 동작 또는 예제**: 사용 예시 또는 주요 특징
  - 예: "💡 Example: calculate_area(5, 10) returns 50"

### FR-3: Moodle LMS 연동
- **FR-3.1**: Moodle Web Services API를 통해 문제 데이터 가져오기
- **FR-3.2**: `core_question_get_questions` 함수 활용
- **FR-3.3**: 실시간 동기화 지원

### FR-4: 가상 스마트폰 UI
- **FR-4.1**: 웹 페이지 우측 하단에 스마트폰 형태로 표시
- **FR-4.2**: 최소화/최대화 기능
- **FR-4.3**: 반응형 디자인 (모바일 대응)

### FR-5: 사용자 추적
- **FR-5.1**: 학습자의 Digest 조회 이력 저장
- **FR-5.2**: 학습 분석을 위한 데이터 수집

---

## 3. 비기능 요구사항 (Non-Functional Requirements)

### NFR-1: 성능
- 함수 추출 및 요약 생성: 2초 이내
- API 응답 시간: 500ms 이내
- 동시 사용자: 100명 지원

### NFR-2: 보안
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (HTML Escaping)
- Moodle 토큰 암호화 저장

### NFR-3: 호환성
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Moodle 3.7 이상
- 브라우저: Chrome, Firefox, Safari, Edge (최신 2버전)

### NFR-4: 확장성
- 새로운 프로그래밍 언어 추가 가능
- AI 모델 연동 가능 (향후)
- 다국어 지원 가능

---

## 4. 시스템 아키텍처

### 4.1 전체 구조
```
┌─────────────────────────────────────────┐
│          웹 브라우저 (Frontend)          │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  메인 페이지  │  │ 가상 스마트폰 UI │ │
│  │  (HTML/CSS)  │  │  (우측 하단)     │ │
│  └──────┬───────┘  └────────┬────────┘ │
└─────────┼──────────────────┼───────────┘
          │                  │
          └──────┬───────────┘
                 │ REST API (JSON)
                 ↓
┌────────────────────────────────────────┐
│       PHP Backend (Apache/Nginx)       │
│  ┌──────────────────────────────────┐  │
│  │  api.php (REST API Endpoint)     │  │
│  ├──────────────────────────────────┤  │
│  │  FunctionDigestGenerator.php     │  │
│  │  (3줄 요약 생성 로직)             │  │
│  ├──────────────────────────────────┤  │
│  │  MoodleAPI.php                   │  │
│  │  (Moodle Web Services 연동)      │  │
│  ├──────────────────────────────────┤  │
│  │  Database.php                    │  │
│  │  (MySQL PDO 연결)                │  │
│  └────────┬──────────────────┬───────┘  │
└───────────┼──────────────────┼──────────┘
            │                  │
            ↓                  ↓
┌─────────────────┐  ┌─────────────────┐
│  MySQL 5.7 DB   │  │  Moodle 3.7 LMS │
│  ┌───────────┐  │  │  ┌───────────┐  │
│  │ problems  │  │  │  │ questions │  │
│  ├───────────┤  │  │  ├───────────┤  │
│  │ function_ │  │  │  │ courses   │  │
│  │ digests   │  │  │  ├───────────┤  │
│  ├───────────┤  │  │  │ users     │  │
│  │ user_     │  │  │  └───────────┘  │
│  │ digest_   │  │  │                 │
│  │ views     │  │  │                 │
│  └───────────┘  │  │                 │
└─────────────────┘  └─────────────────┘
```

### 4.2 데이터 흐름
```
1. 학습자가 문제 조회
   → Frontend: app.js → loadDigest()

2. API 요청
   → GET /api.php?endpoint=digest&question_id=1001

3. 백엔드 처리
   → Database.php: getDigestByMoodleQuestionId()
   → 데이터가 없으면 MoodleAPI.php로 문제 가져오기
   → FunctionDigestGenerator.php로 요약 생성

4. 응답 반환
   → JSON 형식으로 3줄 요약 반환

5. UI 표시
   → app.js: displayDigest()
   → 가상 스마트폰 화면에 렌더링

6. 사용자 추적
   → Database.php: logDigestView()
```

---

## 5. 데이터베이스 설계

### 5.1 ERD (Entity Relationship Diagram)
```
┌─────────────────┐
│    problems     │
├─────────────────┤
│ id (PK)         │
│ moodle_question_id │
│ course_id       │
│ question_text   │
│ question_type   │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │ 1
         │
         │ N
         ↓
┌─────────────────┐
│function_digests │
├─────────────────┤
│ id (PK)         │
│ problem_id (FK) │
│ function_name   │
│ function_code   │
│ summary_line1   │ ← "📐 목적"
│ summary_line2   │ ← "📥 파라미터"
│ summary_line3   │ ← "💡 예제"
│ language        │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │ 1
         │
         │ N
         ↓
┌─────────────────┐
│user_digest_views│
├─────────────────┤
│ id (PK)         │
│ moodle_user_id  │
│ digest_id (FK)  │
│ viewed_at       │
└─────────────────┘
```

### 5.2 테이블 설명

#### problems 테이블
- Moodle의 문제 정보를 저장
- `moodle_question_id`로 Moodle과 연동

#### function_digests 테이블
- 함수별 3줄 요약 저장
- `summary_line1`, `summary_line2`, `summary_line3`에 각각 요약 저장
- 이모지 포함 가능 (utf8mb4)

#### user_digest_views 테이블
- 학습자의 Digest 조회 이력
- 학습 분석에 활용

---

## 6. API 명세서

### 6.1 Digest 조회
```
GET /api.php?endpoint=digest&question_id={id}

Response:
{
  "success": true,
  "question_id": 1001,
  "digests": [
    {
      "id": 1,
      "function_name": "calculate_area",
      "summary_line1": "📐 Calculates the area of a rectangle",
      "summary_line2": "📥 Parameters: width (float), height (float) → Returns: float",
      "summary_line3": "💡 Example: calculate_area(5, 10) returns 50",
      "function_code": "def calculate_area(width, height):\n    return width * height"
    }
  ]
}
```

### 6.2 Digest 생성
```
POST /api.php?endpoint=generate
Content-Type: application/json

{
  "problem_id": 1,
  "function_name": "my_function",
  "function_code": "def my_function(x): return x * 2",
  "language": "python"
}

Response:
{
  "success": true,
  "message": "Digest generated successfully",
  "digest": {
    "line1": "📋 My function",
    "line2": "📥 Parameters: x → Returns: Any",
    "line3": "↩️ Returns: x * 2"
  }
}
```

### 6.3 Moodle 동기화
```
GET /api.php?endpoint=moodle_sync&question_id={id}

Response:
{
  "success": true,
  "question_id": 1001,
  "functions_found": 2,
  "functions": [
    {
      "name": "calculate_area",
      "code": "def calculate_area(width, height):\n    return width * height"
    }
  ]
}
```

---

## 7. UI/UX 설계

### 7.1 가상 스마트폰 UI

#### 위치
- 웹 페이지 우측 하단 고정
- `position: fixed; bottom: 20px; right: 20px;`

#### 크기
- 너비: 320px
- 높이: 640px
- 스마트폰 비율 (9:18)

#### 구성 요소
```
┌──────────────────────┐
│  ⏰ 12:00    🔋 100% │ ← Status Bar
├──────────────────────┤
│  📱 Function Digest  │ ← Header
│           [−]        │ ← Minimize Button
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ calculate_area │  │ ← Function Name
│  ├────────────────┤  │
│  │ 📐 Calculates  │  │ ← Line 1
│  │ the area...    │  │
│  ├────────────────┤  │
│  │ 📥 Parameters  │  │ ← Line 2
│  │ width, height  │  │
│  ├────────────────┤  │
│  │ 💡 Example:    │  │ ← Line 3
│  │ area(5,10)=50  │  │
│  └────────────────┘  │
│                      │
├──────────────────────┤
│        ⚫            │ ← Home Button
└──────────────────────┘
```

### 7.2 색상 디자인
- 메인 컬러: `#667eea` (보라색)
- 강조 컬러: `#764ba2` (진한 보라)
- 배경: `#ffffff` (흰색)
- 텍스트: `#333333` (검정)

### 7.3 이모지 사용
- 📐: 계산/측정 관련
- 📥: 입력값 표시
- 💡: 예제/팁
- 🔄: 재귀
- 🔁: 반복문
- ⚠️: 주의사항
- ↩️: 반환값

---

## 8. 구현 알고리즘

### 8.1 함수 추출 알고리즘 (Python)
```regex
Pattern: /def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\):.*?(?=\n(?:def|class|\Z))/s

Steps:
1. 정규식으로 'def' 키워드 찾기
2. 함수 이름 추출
3. 파라미터 리스트 파싱
4. 함수 본문 추출 (다음 def/class 또는 파일 끝까지)
```

### 8.2 3줄 요약 생성 로직

#### Line 1: 목적 추출
```php
1. Docstring 있는 경우 → 첫 줄 사용
2. 없는 경우 → 함수 이름에서 추론
   예: calculate_area → "Calculate area"
```

#### Line 2: 파라미터 분석
```php
1. 함수 시그니처에서 파라미터 추출
2. 타입 힌트 있으면 사용
3. 없으면 'Any' 표시
4. 리턴 타입 추출 (-> 표기)
```

#### Line 3: 핵심 동작
```php
1. 재귀 함수 감지 → "🔄 Uses recursion"
2. 반복문 있음 → "🔁 Contains loops"
3. return 문 분석 → 반환 표현식 요약
```

### 8.3 향후 AI 통합 계획
```python
# Claude API를 활용한 고급 요약
def generate_with_ai(function_code):
    prompt = f"""
    Summarize this function in exactly 3 lines:
    1. Purpose (what it does)
    2. Parameters and return type
    3. Key behavior or example

    Function:
    {function_code}
    """

    response = claude.complete(prompt)
    return parse_three_lines(response)
```

---

## 9. 테스트 계획

### 9.1 단위 테스트
- `FunctionDigestGenerator::generateDigest()` 테스트
- `MoodleAPI::extractFunctions()` 테스트
- `Database::getDigestByProblemId()` 테스트

### 9.2 통합 테스트
- Moodle → API → Database 전체 흐름
- API 엔드포인트별 테스트

### 9.3 UI 테스트
- 브라우저 호환성 테스트
- 반응형 디자인 테스트
- 최소화/최대화 기능 테스트

---

## 10. 배포 가이드

### 10.1 요구사항 체크리스트
- [ ] PHP 7.1.9 이상
- [ ] MySQL 5.7 이상
- [ ] Moodle 3.7 Web Services 활성화
- [ ] Apache mod_rewrite 또는 Nginx 설정

### 10.2 배포 순서
1. MySQL 스키마 실행
2. `config.php` 설정
3. Moodle Web Service 토큰 생성
4. 웹 서버 설정
5. 접속 테스트

---

## 11. 유지보수 계획

### 11.1 로그 수집
- API 요청/응답 로그
- 에러 로그
- 성능 메트릭

### 11.2 모니터링
- 응답 시간 모니터링
- 에러율 추적
- 사용자 통계

### 11.3 업데이트 계획
- 월 1회 보안 패치
- 분기 1회 기능 업데이트
- 연 2회 대규모 개선

---

## 12. FAQ

**Q: 다른 LMS도 지원하나요?**
A: 현재는 Moodle 3.7만 지원합니다. Canvas, Blackboard 등은 향후 추가 예정입니다.

**Q: 어떤 프로그래밍 언어를 지원하나요?**
A: 현재 Python을 기본 지원하며, JavaScript, Java도 추가 가능합니다.

**Q: AI 요약은 어떻게 작동하나요?**
A: 현재는 규칙 기반 알고리즘을 사용하며, 향후 Claude API를 통한 AI 요약을 추가할 예정입니다.

**Q: 모바일에서도 작동하나요?**
A: 네, 반응형 디자인으로 모바일 브라우저에서도 사용 가능합니다.

---

**작성일**: 2025-11-18
**버전**: 1.0.0
**작성자**: Function Digest Development Team
