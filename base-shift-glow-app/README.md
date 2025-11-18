# Base Shift Glow - LMS 연동 웹앱

밑(Base)이 바뀌면 색조가 달라지며 형태가 변하는 Glow 효과를 가진 교육용 웹앱

## 📱 기능 소개

### 핵심 기능
- **동적 Glow 효과**: 진법(2, 8, 10, 16진법)에 따라 색상과 형태가 실시간으로 변화
- **LMS 연동 시뮬레이션**: Moodle 3.7과 연동하여 문제 데이터를 받아오는 기능 시뮬레이션
- **가상 스마트폰 디스플레이**: 우측 하단에 고정된 모바일 화면 시뮬레이터
- **파티클 애니메이션**: 진법 변경 시 시각적 피드백 제공

### 진법별 시각 효과

| 진법 | 색상 | 형태 | 설명 |
|-----|------|------|------|
| **2진법** | 🔴 빨강 | 둥근 사각형 | Binary - 디지털의 기본 |
| **8진법** | 🟠 주황 | 유동적 팔각형 | Octal - Unix 권한 체계 |
| **10진법** | 🟢 녹색 | 원형 | Decimal - 일상적인 숫자 |
| **16진법** | 🔵 파랑 | 육각형 | Hexadecimal - 프로그래밍 |

## 🚀 실행 방법

### 방법 1: 직접 브라우저로 열기
```bash
cd base-shift-glow-app
# index.html 파일을 더블클릭하거나 브라우저로 드래그
```

### 방법 2: 로컬 서버 실행 (권장)
```bash
cd base-shift-glow-app

# Python 3가 설치된 경우
python3 -m http.server 8000

# Node.js가 설치된 경우
npx http-server -p 8000
```

그 후 브라우저에서 `http://localhost:8000` 접속

## 🎮 사용 방법

### 기본 사용법
1. **진법 선택**: 왼쪽 패널에서 원하는 진법(2, 8, 10, 16)을 선택
2. **문제 유형 선택**: 기본 연산, 진법 변환, 고급 문제 중 선택
3. **난이도 조절**: 슬라이더로 1~5 단계 난이도 설정
4. **문제 불러오기**: 버튼 클릭 시 LMS에서 문제 가져오기 시뮬레이션

### 키보드 단축키
- `Ctrl/Cmd + 1`: 2진법으로 전환
- `Ctrl/Cmd + 2`: 8진법으로 전환
- `Ctrl/Cmd + 3`: 10진법으로 전환
- `Ctrl/Cmd + 4`: 16진법으로 전환
- `Space`: 문제 불러오기

### 개발자 콘솔 API
브라우저 개발자 도구(F12)에서 사용 가능:

```javascript
// 진법 빠르게 전환
BaseShiftGlow.shiftTo(16);  // 16진법으로 전환

// 문제 불러오기
BaseShiftGlow.loadProblem();

// 현재 상태 확인
BaseShiftGlow.getInfo();

// 진법 변환 유틸리티
BaseShiftGlow.utils.convert('FF', 16, 10);  // 255
```

## 🏗️ 프로젝트 구조

```
base-shift-glow-app/
├── index.html          # 메인 HTML 파일
├── css/
│   └── styles.css      # 모든 스타일과 애니메이션
├── js/
│   └── script.js       # 로직 및 LMS 시뮬레이터
└── assets/             # (향후 이미지, 아이콘 등)
```

## 🔧 기술 스택

- **Frontend**: 순수 HTML5, CSS3, JavaScript (ES6+)
- **애니메이션**: CSS Animations, Transitions, Transforms
- **디자인**: Responsive Design, Mobile-first approach
- **LMS 연동**: Moodle 3.7 API 시뮬레이션 (향후 실제 연동 가능)

## 🎨 디자인 특징

### 색상 시스템
- **2진법**: `#FF3B30` (빨강) - 0과 1의 세계
- **8진법**: `#FF9500` (주황) - Unix 권한의 색
- **10진법**: `#4CAF50` (녹색) - 안정적인 일상
- **16진법**: `#007AFF` (파랑) - 코드의 언어

### 애니메이션 효과
- **Pulse Rings**: 3겹의 링이 독립적으로 펄스
- **Particle System**: 진법 변경 시 20개의 파티클 방출
- **Morph Animation**: 8진법 시 유동적인 형태 변화
- **Smooth Transitions**: 1.2초의 부드러운 전환

### 접근성
- `prefers-reduced-motion` 지원
- WCAG 2.1 AA 준수
- 키보드 네비게이션 완벽 지원
- 색상 외에도 형태로 정보 전달

## 📊 LMS 연동 명세

### 현재 구현 (시뮬레이션)
- Moodle 3.7 API 호출 시뮬레이션
- 문제 데이터 로딩 (500ms 지연)
- 연결 상태 확인 및 표시

### 실제 Moodle 연동 시 필요사항

```javascript
// 실제 Moodle API 엔드포인트 예시
const MOODLE_CONFIG = {
    baseURL: 'https://moodle.example.com',
    token: 'YOUR_WEBSERVICE_TOKEN',
    endpoints: {
        getQuestion: '/webservice/rest/server.php',
        submitAnswer: '/webservice/rest/server.php'
    }
};

// API 호출 예시
async function fetchMoodleQuestion(base, categoryId) {
    const response = await fetch(`${MOODLE_CONFIG.baseURL}${MOODLE_CONFIG.endpoints.getQuestion}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            wstoken: MOODLE_CONFIG.token,
            wsfunction: 'mod_quiz_get_attempt_data',
            moodlewsrestformat: 'json',
            attemptid: attemptId
        })
    });
    return await response.json();
}
```

### 필요한 Moodle 설정
1. **Web Services 활성화**
   - 사이트 관리 > 플러그인 > Web services > 개요
   - Web services 활성화

2. **사용자 권한 설정**
   - 문제 읽기 권한
   - 퀴즈 시도 권한

3. **토큰 생성**
   - 사이트 관리 > 서버 > Web services > 토큰 관리

## 🔮 향후 계획

### Phase 1: 기능 확장
- [ ] 실제 Moodle API 연동
- [ ] 답안 제출 기능
- [ ] 정답/오답 피드백 애니메이션
- [ ] 학습 진도 추적

### Phase 2: UI/UX 개선
- [ ] 다크 모드 지원
- [ ] 더 많은 진법 지원 (3, 5, 12, 60진법 등)
- [ ] 커스텀 색상 테마
- [ ] 소리 효과 추가

### Phase 3: 교육 기능
- [ ] 진법 변환 튜토리얼
- [ ] 단계별 풀이 과정 표시
- [ ] 학습 통계 및 성취도 분석
- [ ] 게임화 요소 (배지, 리더보드)

## 🐛 알려진 이슈

- 구형 브라우저(IE11 이하)에서는 일부 CSS 효과가 동작하지 않을 수 있음
- 모바일에서는 화면 크기에 따라 레이아웃이 조정됨

## 📝 라이선스

이 프로젝트는 KAIST Touch Math Academy를 위한 교육용 프로토타입입니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 📞 연락처

- **프로젝트**: alt42standalone_v1.0
- **버전**: 1.0.0
- **최종 업데이트**: 2025-11-18

---

Made with ❤️ for KAIST Touch Math Academy
