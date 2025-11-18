# Area Paint - 그래프 넓이 학습 애플리케이션

그래프 아래 넓이를 색감 애니메이션으로 시각화하여 학습하는 웹 애플리케이션입니다.

## 기능

- **그래프 시각화**: 다양한 수학 함수의 그래프를 실시간으로 표시
- **Area Paint 애니메이션**: 그래프 아래 영역을 색감 애니메이션으로 채우기
- **Moodle LMS 연동**: Moodle 3.7과 연동하여 문제 정보 및 학습 진행률 관리
- **가상 스마트폰 UI**: 모바일 앱 인터페이스 시뮬레이션
- **학습 진행률 추적**: 답안 제출 및 점수 관리

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **LMS**: Moodle 3.7
- **Database**: MySQL 5.7 (Moodle 연동)
- **Server**: PHP 7.1.9 (Moodle 서버)

## 프로젝트 구조

```
alt42standalone_v1.0/
├── public/
│   └── index.html              # 메인 HTML 페이지
├── src/
│   ├── components/
│   │   └── areaPaint.js        # Area Paint 애니메이션 컴포넌트
│   ├── services/
│   │   └── moodleAPI.js        # Moodle API 연동 서비스
│   ├── utils/
│   │   └── graph.js            # 그래프 유틸리티 함수
│   ├── styles/
│   │   └── main.css            # 메인 스타일시트
│   └── app.js                  # 메인 애플리케이션 로직
├── config/
│   └── moodle.config.js        # Moodle 설정 파일
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md  # 프로젝트 요구사항 문서
└── README.md
```

## 설치 및 실행

### 1. 로컬 모드 (Moodle 서버 없이 테스트)

```bash
# 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 웹 서버 실행 (Python 3)
python3 -m http.server 8000

# 또는 Node.js http-server 사용
npx http-server -p 8000
```

브라우저에서 `http://localhost:8000/public/index.html` 접속

### 2. Moodle 연동 모드

#### Moodle 서버 설정

1. **웹 서비스 활성화**
   - Moodle 관리자 페이지 → 사이트 관리 → 고급 기능
   - "웹 서비스 활성화" 체크

2. **웹 서비스 토큰 생성**
   - 사이트 관리 → 서버 → 웹 서비스 → 토큰 관리
   - 새 토큰 생성 (사용자 및 서비스 선택)

3. **설정 파일 업데이트**
   ```javascript
   // config/moodle.config.js
   const MoodleConfig = {
       baseUrl: 'http://your-moodle-server.com',
       token: 'YOUR_ACTUAL_TOKEN',
       localMode: false,  // false로 변경
       // ...
   };
   ```

#### Moodle 커스텀 필드 설정

문제(Quiz Question)에 다음 커스텀 필드 추가:

- `function`: 수학 함수 문자열 (예: "x**2")
- `xMin`: X축 최소값
- `xMax`: X축 최대값
- `difficulty`: 난이도 (쉬움/보통/어려움)
- `correctArea`: 정답 넓이

## 사용법

### 기본 사용

1. **문제 선택**: 앱이 시작되면 자동으로 첫 번째 문제가 로드됩니다.

2. **애니메이션 시작**: "애니메이션 시작" 버튼을 클릭하여 그래프 아래 영역이 색으로 채워지는 것을 확인합니다.

3. **답안 입력**: 계산된 넓이를 입력하고 "제출" 버튼을 클릭합니다.

4. **피드백 확인**: 정답 여부와 정확도를 확인합니다.

5. **다음 문제**: "다음 문제" 버튼을 클릭하여 다음 문제로 이동합니다.

### 지원되는 함수

- 다항 함수: `x**2`, `x**3 - 2*x`
- 삼각 함수: `sin(x)`, `cos(x)`, `tan(x)`
- 지수/로그 함수: `exp(x)`, `log(x)`
- 절댓값: `abs(x - 2)`
- 제곱근: `sqrt(x)`
- 복합 함수: `x**2 - 4*x + 5`

## API 문서

### AreaPaint 클래스

```javascript
// 인스턴스 생성
const areaPaint = new AreaPaint('canvas-id');

// 그래프 데이터 설정
areaPaint.setGraphData({
    points: [{x: 0, y: 0}, {x: 1, y: 1}, ...],
    xMin: -5,
    xMax: 5,
    yMin: -2,
    yMax: 10
});

// 애니메이션 시작
areaPaint.start();

// 애니메이션 리셋
areaPaint.reset();

// 계산된 넓이 가져오기
const area = areaPaint.getCalculatedArea();
```

### MoodleAPI 클래스

```javascript
// 인스턴스 생성
const moodleAPI = new MoodleAPI({
    baseUrl: 'http://localhost/moodle',
    token: 'YOUR_TOKEN',
    localMode: true
});

// 문제 목록 가져오기
const problems = await moodleAPI.getProblems(courseId, quizId);

// 답안 제출
await moodleAPI.submitAnswer(problemId, userId, answer, timeSpent);

// 진행률 저장
await moodleAPI.saveProgress(userId, progressData);
```

### GraphUtils

```javascript
// 함수로부터 점 생성
const graphData = GraphUtils.generatePoints('x**2', -5, 5, 100);

// 샘플 문제 가져오기
const samples = GraphUtils.getSampleGraphs();

// 정답 확인
const result = GraphUtils.checkAnswer(userAnswer, correctAnswer, tolerance);
```

## 커스터마이징

### 색상 변경

`src/components/areaPaint.js`에서 애니메이션 색상 변경:

```javascript
this.colors = [
    { r: 102, g: 126, b: 234, a: 0.3 },  // 색상 1
    { r: 118, g: 75, b: 162, a: 0.3 },   // 색상 2
    // 추가 색상...
];
```

### 애니메이션 속도 조정

```javascript
this.animationSpeed = 0.5; // 값을 크게 하면 빨라집니다
```

### 새로운 문제 추가

`src/utils/graph.js`의 `getSampleGraphs()` 함수에 문제 추가:

```javascript
{
    id: 9,
    name: '새로운 함수',
    function: '2*x**2 + 3',
    xMin: -4,
    xMax: 4,
    difficulty: '보통',
    correctArea: 85.33
}
```

## 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 개발 로드맵

- [ ] 실제 적분 계산 알고리즘 추가
- [ ] 다중 영역 넓이 계산 지원
- [ ] 음수 영역 처리
- [ ] 3D 그래프 지원
- [ ] 모바일 반응형 개선
- [ ] 오프라인 모드 지원

## 라이선스

MIT License

## 기여

기여를 환영합니다! Pull Request를 보내주세요.

## 문의

문제가 발생하거나 질문이 있으시면 Issues에 등록해주세요.

## 버전

**v1.0.0** (2025-11-18)
- 초기 릴리스
- Area Paint 애니메이션 기능
- Moodle LMS 연동 (로컬 모드)
- 가상 스마트폰 UI
- 8가지 샘플 문제

---

**KAIST Touch Math Academy** - AI Education System Pipeline
