# 📐 Equation Fold

복잡한 수식을 층층이 접어 단순화하는 인터랙티브 학습 도구입니다.

## ✨ 주요 기능

- **단계별 수식 단순화**: 복잡한 대수식을 단계별로 분해하여 학습
- **인터랙티브 UI**: 각 단계를 클릭하여 접고 펼칠 수 있는 직관적인 인터페이스
- **모바일 최적화**: 반응형 디자인으로 스마트폰에서도 완벽하게 작동
- **Moodle LMS 연동**: URL 파라미터를 통한 LMS 통합 지원
- **실시간 수식 파싱**: Math.js를 활용한 정확한 수식 분석

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 16.0 이상
- npm 또는 yarn

### 설치

```bash
cd equation-fold-app
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 앱을 확인하세요.

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 📱 사용 방법

### 1. 예제 선택
5가지 난이도별 예제 중 하나를 선택합니다:
- 기본 분배 법칙
- 양수와 음수 괄호 전개
- 여러 항의 괄호 전개
- 이차식 전개 (FOIL)
- 복잡한 다항식 정리

### 2. 직접 입력
자신만의 수식을 입력하여 단계별 단순화 과정을 확인할 수 있습니다.

지원하는 연산:
- 덧셈, 뺄셈: `+`, `-`
- 곱셈, 나눗셈: `*`, `/`
- 괄호: `(`, `)`
- 변수: `x`, `y`, `z` 등

예제:
- `3(x + 2) + 2(x + 3)`
- `2(3x + 4) - 3(x - 2)`
- `(x + 2)(x + 3)`

### 3. 단계별 탐색
- **클릭하여 펼치기/접기**: 각 단계를 클릭하여 상세 내용 확인
- **화살표 버튼**: 순서대로 단계 진행
- **처음부터 버튼**: 모든 단계를 초기화

## 🔗 Moodle LMS 연동

### URL 파라미터

Moodle에서 앱을 호출할 때 다음 파라미터를 사용할 수 있습니다:

```
https://your-domain.com/?problemid=123&studentid=456&token=your_token
```

**파라미터:**
- `problemid`: 문제 ID
- `studentid`: 학생 ID
- `token`: 인증 토큰

### Moodle 플러그인 설정

1. Moodle 웹서비스 활성화
2. 커스텀 웹서비스 함수 추가:
   - `local_equationfold_get_problem`
   - `local_equationfold_submit_answer`
   - `local_equationfold_save_progress`

3. 환경 변수 설정 (`.env` 파일):

```env
VITE_MOODLE_URL=https://your-moodle-site.com
VITE_MOODLE_TOKEN=your_webservice_token
```

## 🛠 기술 스택

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Math Engine**: Math.js
- **HTTP Client**: Axios
- **Math Rendering**: KaTeX (준비됨)

## 📂 프로젝트 구조

```
equation-fold-app/
├── public/              # 정적 파일
├── src/
│   ├── components/      # React 컴포넌트
│   │   ├── EquationFold/   # 메인 수식 접기 컴포넌트
│   │   └── MobileView/     # 모바일 미리보기
│   ├── services/        # 비즈니스 로직
│   │   ├── equationParser.ts  # 수식 파싱 엔진
│   │   └── moodleAPI.ts       # Moodle API 연동
│   ├── types/           # TypeScript 타입 정의
│   ├── App.tsx          # 메인 앱 컴포넌트
│   └── main.tsx         # 앱 진입점
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎨 커스터마이징

### 색상 테마 변경

`src/index.css`에서 CSS 변수를 수정하여 테마를 변경할 수 있습니다:

```css
:root {
  --primary-color: #646cff;
  --success-color: #4ade80;
  --warning-color: #f59e0b;
}
```

### 수식 단순화 규칙 추가

`src/services/equationParser.ts`에서 단순화 규칙을 커스터마이즈할 수 있습니다.

## 🧪 테스트

```bash
# 테스트 실행 (추후 구현 예정)
npm test
```

## 📝 라이선스

MIT License

## 🤝 기여

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

Made with ❤️ for Math Education
