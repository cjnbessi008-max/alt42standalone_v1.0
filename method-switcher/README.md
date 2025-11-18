# Method Switcher - 적분법 비교 학습 시스템

다양한 수치 적분법을 시각적으로 비교하고 학습할 수 있는 대화형 웹 애플리케이션입니다.

![Method Switcher](https://img.shields.io/badge/React-18+-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![Vite](https://img.shields.io/badge/Vite-7+-purple)

## 주요 기능

### 🎯 핵심 기능
- **4가지 적분법 비교**: 사다리꼴, 심슨, 직사각형, 몬테카를로 방법
- **실시간 애니메이션**: 각 적분법의 동작 원리를 시각적으로 표현
- **가상 스마트폰 UI**: 우측 하단에 배치된 모바일 시뮬레이터
- **LMS 연동 준비**: PHP/Moodle 백엔드와 연동 가능한 REST API 구조

### 📱 지원 적분법

1. **사다리꼴 법 (Trapezoidal Rule)**
   - 구간을 사다리꼴로 근사
   - 정확도: 중간
   - 색상: 파란색

2. **심슨 법 (Simpson's Rule)**
   - 2차 함수(포물선)로 근사
   - 정확도: 높음
   - 색상: 초록색

3. **직사각형 법 (Midpoint Rectangle)**
   - 중점 높이의 직사각형 사용
   - 정확도: 낮음
   - 색상: 주황색

4. **몬테카를로 법 (Monte Carlo)**
   - 무작위 샘플링을 통한 확률적 추정
   - 정확도: 중간 (샘플 수에 따라 다름)
   - 색상: 빨간색

## 🚀 시작하기

### 필수 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

개발 서버가 실행되면 브라우저에서 `http://localhost:5173`으로 접속하세요.

## 📁 프로젝트 구조

```
method-switcher/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── PhoneSimulator.tsx        # 가상 스마트폰 화면
│   │   ├── MethodSwitcher.tsx        # 메인 UI 컴포넌트
│   │   └── IntegrationVisualizer.tsx # 적분 시각화
│   ├── types/               # TypeScript 타입 정의
│   │   └── integration.ts
│   ├── utils/               # 유틸리티 함수
│   │   └── integrationMethods.ts     # 적분 계산 로직
│   ├── services/            # 외부 서비스 연동
│   │   └── lmsConnector.ts           # LMS 연동 서비스
│   ├── constants/           # 상수 정의
│   │   └── methods.ts
│   ├── App.tsx             # 메인 앱 컴포넌트
│   └── main.tsx            # 진입점
├── public/                 # 정적 파일
└── package.json
```

## 🔌 LMS 연동 (PHP/Moodle)

### API 엔드포인트 설정

Method Switcher는 다음과 같은 REST API를 통해 LMS와 통신합니다:

#### 1. 문제 가져오기
```
GET /api/problems/:problemId
```

**응답 예시:**
```json
{
  "id": "1",
  "functionExpression": "x**2",
  "lowerBound": 0,
  "upperBound": 2,
  "exactValue": 2.6667,
  "difficulty": "easy"
}
```

#### 2. 답안 제출
```
POST /api/submissions
```

**요청 본문:**
```json
{
  "userId": "student-001",
  "problemId": "1",
  "answer": 2.6667,
  "method": "trapezoidal",
  "timestamp": "2025-11-18T12:00:00Z"
}
```

### PHP/Moodle 백엔드 예시

`/webservice/rest/server.php` 또는 별도 PHP 파일:

```php
<?php
// Moodle 연동 예시
require_once('../../config.php');
require_login();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$action = required_param('action', PARAM_TEXT);

if ($action === 'get_problem') {
    $problem_id = required_param('id', PARAM_INT);

    // DB에서 문제 정보 가져오기
    $problem = $DB->get_record('integration_problems', ['id' => $problem_id]);

    echo json_encode([
        'id' => $problem->id,
        'functionExpression' => $problem->function_expr,
        'lowerBound' => floatval($problem->lower_bound),
        'upperBound' => floatval($problem->upper_bound),
        'exactValue' => floatval($problem->exact_value),
        'difficulty' => $problem->difficulty
    ]);

} elseif ($action === 'submit_answer') {
    $user_id = required_param('userId', PARAM_TEXT);
    $problem_id = required_param('problemId', PARAM_INT);
    $answer = required_param('answer', PARAM_FLOAT);
    $method = required_param('method', PARAM_TEXT);

    // DB에 답안 저장
    $submission = new stdClass();
    $submission->user_id = $user_id;
    $submission->problem_id = $problem_id;
    $submission->answer = $answer;
    $submission->method = $method;
    $submission->timecreated = time();

    $DB->insert_record('integration_submissions', $submission);

    echo json_encode(['success' => true]);
}
?>
```

### 프론트엔드 설정

`src/services/lmsConnector.ts`에서 실제 LMS URL 설정:

```typescript
import { createMoodleLMSConnector } from './services/lmsConnector';

const lmsConnector = createMoodleLMSConnector(
  'https://your-moodle-url.com',
  'your-api-key',
  'student-id'
);
```

## 🎨 커스터마이징

### 문제 추가

URL 파라미터로 문제 ID 지정:
```
http://localhost:5173/?problemId=2
```

### 새로운 적분법 추가

1. `src/utils/integrationMethods.ts`에 계산 함수 추가
2. `src/constants/methods.ts`에 메서드 정보 추가
3. `src/types/integration.ts`에 타입 추가

## 🧪 기술 스택

- **프론트엔드**: React 18 + TypeScript
- **빌드 도구**: Vite 7
- **애니메이션**: Framer Motion
- **차트**: Recharts
- **스타일링**: Inline Styles (CSS-in-JS)
- **백엔드 연동**: REST API (PHP/Moodle 호환)

## 📊 지원 환경

### 개발 환경
- **MySQL**: 5.7+
- **PHP**: 7.1.9+
- **Moodle**: 3.7+

### 브라우저 지원
- Chrome/Edge (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)

## 🔧 개발 가이드

### Mock 데이터 사용

개발 중에는 `createMockLMSConnector()`를 사용하여 Mock 데이터로 테스트:

```typescript
// src/App.tsx
const lmsConnector = createMockLMSConnector();
```

### 프로덕션 배포

1. 환경 변수 설정 (`.env` 파일):
```env
VITE_LMS_API_URL=https://your-moodle-url.com/webservice/rest
VITE_LMS_API_KEY=your-api-key
```

2. 빌드:
```bash
npm run build
```

3. `dist/` 폴더를 웹 서버에 배포

## 📝 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 🤝 기여

개선 사항이나 버그 리포트는 언제든 환영합니다!

---

**개발**: AI Education System Pipeline
**버전**: 1.0.0
**최종 업데이트**: 2025-11-18
