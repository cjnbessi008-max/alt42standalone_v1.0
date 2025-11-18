# Correct Warm Feedback - 구현 문서

## 📐 아키텍처 개요

### 시스템 구성도

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ VirtualPhone│  │CorrectWarm   │  │ProblemDisplay  │ │
│  │ Component   │──│Feedback      │──│Component       │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ Axios HTTP
┌──────────────────────▼──────────────────────────────────┐
│              Moodle Service Layer                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  • Connection Management                           │ │
│  │  • Problem Fetching                                │ │
│  │  • Answer Validation (Partial Scoring)             │ │
│  │  • Demo Mode Fallback                              │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│             Moodle LMS 3.7 (PHP 7.1.9)                  │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────┐ │
│  │  Web Services  │  │  Quiz Module   │  │  MySQL    │ │
│  │  (REST API)    │──│                │──│  5.7      │ │
│  └────────────────┘  └────────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🎨 컴포넌트 상세 설명

### 1. VirtualPhone.jsx

**역할**: 가상 스마트폰 UI 컨테이너

**주요 기능**:
- 우측 하단 고정 위치
- Warmth Level에 따른 배경색 변경
- 문제 및 피드백 컴포넌트 호스팅

**Props**:
```javascript
{
  problem: Object,        // 현재 문제 객체
  warmthLevel: Number,    // 0-100 피드백 레벨
  onAnswerSubmit: Function // 답안 제출 핸들러
}
```

**상태 관리**:
```javascript
const [currentAnswer, setCurrentAnswer] = useState('');
const [warmthColor, setWarmthColor] = useState('');
```

**색온도 계산 로직**:
```javascript
calculateWarmthColor(level):
  0-30%   → Cold Blue (#e3f2fd - #bbdefb)
  30-50%  → Yellow (#fff9c4 - #fff59d)
  50-70%  → Light Orange (#ffe0b2 - #ffcc80)
  70-90%  → Orange (#ffccbc - #ffab91)
  90-100% → Warm Red (#ffcdd2 - #ef9a9a)
```

### 2. CorrectWarmFeedback.jsx

**역할**: 시각적 피드백 효과 렌더링

**주요 기능**:
- 색온도 오버레이
- 파티클 애니메이션 (warmth > 50%)
- 펄스 효과 (warmth > 70%)
- 이모지 피드백

**파티클 생성 알고리즘**:
```javascript
particleCount = floor(warmthLevel / 10)
각 파티클:
  - 크기: random(10-30px)
  - 위치: random(0-100%)
  - 색상: getParticleColor(warmthLevel)
  - 애니메이션: 2초 펄스, 랜덤 딜레이
```

**색상 매핑**:
```javascript
warmthLevel < 50  → Yellow particles
warmthLevel < 70  → Orange particles
warmthLevel < 90  → Deep Orange particles
warmthLevel ≥ 90  → Red particles
```

### 3. ProblemDisplay.jsx

**역할**: 문제 표시 및 답안 입력

**주요 기능**:
- 문제 제목 및 질문 표시
- 답안 입력 필드
- 제출 버튼
- 실시간 힌트
- 통계 (시도 횟수, 정확도)

**힌트 시스템**:
```javascript
warmthLevel = 0     → "문제를 풀어보세요!"
warmthLevel < 30    → "다시 생각해보세요"
warmthLevel < 50    → "방향은 맞아요"
warmthLevel < 70    → "거의 다 왔어요"
warmthLevel < 90    → "아주 좋아요"
warmthLevel ≥ 90    → "완벽해요!"
```

## 🔧 서비스 레이어

### MoodleService (moodleAPI.js)

**역할**: Moodle LMS와의 모든 통신 관리

#### 주요 메서드

##### 1. checkConnection()
```javascript
Purpose: Moodle LMS 연결 확인
Returns: Promise<boolean>
API Call: core_webservice_get_site_info
```

##### 2. getProblem()
```javascript
Purpose: 문제 가져오기 (Moodle 또는 Demo)
Returns: Promise<Object>
Fallback: Demo 문제 사용
```

##### 3. checkAnswer(problem, answer)
```javascript
Purpose: 답안 검증 및 부분 점수 계산
Returns: Number (0-100)
Algorithm: 문제 유형별 분기 처리
```

#### 답안 검증 알고리즘

##### 분수 답안 (checkFractionAnswer)

**파싱**:
```javascript
"3/4" → { numerator: 3, denominator: 4, value: 0.75 }
```

**채점 로직**:
1. **완전 일치**: 동치 분수 인식 (예: 3/4 = 6/8) → 100%
2. **분모 일치**:
   - 분자 차이 0 → 100%
   - 분자 차이 1 → 70%
   - 분자 차이 2 → 50%
   - 분자 차이 > 2 → 30%
3. **분자 일치**: 40%
4. **값 근접도**:
   - 차이 < 0.1 → 60%
   - 차이 < 0.25 → 40%
   - 차이 < 0.5 → 20%
5. **시도**: 10%

##### 숫자 답안 (checkNumericAnswer)

**채점 로직**:
```javascript
정확도 = |사용자답 - 정답| / 정답 × 100

정확도 < 1%   → 95점
정확도 < 5%   → 80점
정확도 < 10%  → 60점
정확도 < 20%  → 40점
정확도 < 50%  → 20점
그 외         → 10점
```

##### 문자열 답안 (checkGenericAnswer)

**Levenshtein Distance 기반 유사도**:
```javascript
similarity = (longer.length - editDistance) / longer.length

similarity > 0.9  → 90점
similarity > 0.8  → 70점
similarity > 0.6  → 50점
similarity > 0.4  → 30점
similarity > 0.2  → 15점
그 외             → 5점
```

## 🎯 상태 관리 흐름

### App.js (루트 컴포넌트)

**상태**:
```javascript
const [currentProblem, setCurrentProblem] = useState(null);
const [warmthLevel, setWarmthLevel] = useState(0);
const [moodleConnected, setMoodleConnected] = useState(false);
```

**이벤트 흐름**:

```
1. 앱 초기화
   └─> initializeMoodle()
       └─> MoodleService.checkConnection()
           └─> setMoodleConnected(true/false)

2. 문제 로드
   └─> loadProblem()
       └─> MoodleService.getProblem()
           └─> setCurrentProblem(problem)
           └─> setWarmthLevel(0)

3. 답안 제출
   └─> handleAnswerSubmit(answer)
       └─> MoodleService.checkAnswer(problem, answer)
           └─> setWarmthLevel(correctness)
               └─> VirtualPhone 색상 변경
               └─> CorrectWarmFeedback 애니메이션
```

## 🌈 스타일링 시스템

### Styled Components 사용

**장점**:
- CSS-in-JS: 컴포넌트 범위 스타일
- 동적 스타일링: Props 기반 조건부 스타일
- 테마 지원
- 자동 vendor prefixing

**예시**:
```javascript
const PhoneScreen = styled.div`
  background: ${props => props.warmthColor || 'default-gradient'};
  transition: background 1.5s ease;
`;
```

### 애니메이션

**Keyframes**:
```javascript
const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(..., 0.3); }
  50% { box-shadow: 0 0 40px rgba(..., 0.6); }
`;
```

## 🔌 Moodle API 통신

### REST API 엔드포인트

**베이스 URL**:
```
http://your-moodle-instance.com/webservice/rest/server.php
```

**공통 파라미터**:
```javascript
{
  wstoken: 'your_token',
  wsfunction: 'function_name',
  moodlewsrestformat: 'json'
}
```

### 사용 함수

#### 1. core_webservice_get_site_info
```javascript
Purpose: Moodle 사이트 정보 및 연결 확인
Response: {
  sitename, siteurl, username, userid, ...
}
```

#### 2. mod_quiz_get_quiz_by_courses
```javascript
Purpose: 코스별 퀴즈 목록 가져오기
Response: {
  quizzes: [{ id, name, intro, ... }]
}
```

#### 3. mod_quiz_process_attempt
```javascript
Purpose: 학생 답안 제출 및 채점
Request: {
  attemptid, data: { answer }
}
```

## 🧪 데모 모드

**목적**: Moodle 없이 앱 테스트 및 개발

**데모 문제 세트**:
```javascript
[
  {
    id: 'demo-1',
    title: '분수 덧셈',
    question: '1/2 + 1/4 = ?',
    correctAnswer: '3/4',
    type: 'fraction'
  },
  {
    id: 'demo-2',
    title: '간단한 곱셈',
    question: '7 × 8 = ?',
    correctAnswer: '56',
    type: 'multiplication'
  },
  {
    id: 'demo-3',
    title: '분수 나눗셈',
    question: '2/3 ÷ 1/6 = ?',
    correctAnswer: '4',
    type: 'fraction'
  }
]
```

## 📊 성능 최적화

### 최적화 전략

1. **컴포넌트 메모이제이션**
   ```javascript
   React.memo(CorrectWarmFeedback)
   ```

2. **상태 업데이트 배칭**
   ```javascript
   // React 18 자동 배칭
   setCurrentProblem(problem);
   setWarmthLevel(0);
   ```

3. **CSS 트랜지션**
   ```css
   transition: background 1.5s ease;
   /* GPU 가속 사용 */
   ```

4. **이미지 최적화**
   - SVG 사용 (확장성, 작은 파일 크기)
   - LazyLoad 적용

## 🔐 보안 고려사항

### 1. 환경 변수 관리
```javascript
// .env 파일에 민감 정보 저장
REACT_APP_MOODLE_TOKEN=xxx
// .gitignore에 .env 추가
```

### 2. API 토큰 보호
- 프론트엔드에서 토큰 직접 노출 (주의 필요)
- 프로덕션에서는 백엔드 프록시 권장

### 3. XSS 방어
- React의 자동 이스케이핑 활용
- `dangerouslySetInnerHTML` 사용 금지

### 4. CORS 설정
```php
// Moodle config.php
$CFG->wwwroot = 'http://your-domain.com';
// 필요시 CORS 헤더 추가
```

## 🐛 디버깅 팁

### 1. 콘솔 로깅
```javascript
console.log('Moodle connection:', isConnected);
console.log('Current problem:', currentProblem);
console.log('Warmth level:', warmthLevel);
```

### 2. React DevTools
- 컴포넌트 트리 검사
- Props 및 State 실시간 확인

### 3. Network 탭
- Moodle API 호출 확인
- 응답 데이터 검증

## 📈 향후 개선 사항

### 1. 백엔드 프록시 추가
- Express.js 서버로 API 토큰 보호
- Rate limiting 구현

### 2. 오프라인 지원
- Service Worker 추가
- IndexedDB로 로컬 캐싱

### 3. 다국어 지원
- i18next 통합
- 한국어/영어 전환

### 4. 접근성 개선
- ARIA 레이블 추가
- 키보드 내비게이션 강화
- 스크린 리더 지원

### 5. 분석 및 모니터링
- Google Analytics 통합
- 사용자 행동 추적
- 오류 리포팅 (Sentry)

---

**작성일**: 2024-11-18
**버전**: 1.0.0
**작성자**: AI Education System Team
