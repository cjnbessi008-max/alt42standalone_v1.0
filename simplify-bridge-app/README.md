# Simplify Bridge

**복잡한 부등식을 단순한 비교로 단계적으로 압축하는 교육용 웹앱**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📖 소개

Simplify Bridge는 KAIST Touch Math Academy를 위해 개발된 독립형 웹 애플리케이션입니다. 복잡한 부등식을 학생들이 이해하기 쉽게 단계별로 분해하여 보여줍니다.

### 주요 기능

- 📐 **단계별 부등식 단순화**: 복잡한 부등식을 여러 단계로 나누어 설명
- 📱 **모바일 최적화 UI**: 우측 하단 가상 스마트폰 화면에 표시
- 🎓 **Moodle LMS 연동 준비**: MySQL 5.7, PHP 7.1.9, Moodle 3.7 환경과 통합 가능
- ✨ **수학 표현식 렌더링**: KaTeX를 사용한 아름다운 수식 표시
- 🎮 **인터랙티브 컨트롤**: 단계별 이동, 자동 재생, 리셋 기능

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 앱 미리보기
npm run preview
```

## 🛠️ 기술 스택

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Math Rendering**: KaTeX
- **언어**: TypeScript

## 📂 프로젝트 구조

```
simplify-bridge-app/
├── src/
│   ├── components/
│   │   ├── MobileFrame.tsx        # 가상 스마트폰 프레임
│   │   ├── SimplifyBridge.tsx     # 메인 앱 컴포넌트
│   │   ├── StepDisplay.tsx        # 단계 표시 컴포넌트
│   │   └── MathExpression.tsx     # 수학 표현식 렌더링
│   ├── utils/
│   │   └── inequalitySimplifier.ts # 부등식 단순화 알고리즘
│   ├── types/
│   │   └── index.ts               # TypeScript 타입 정의
│   ├── App.tsx                    # 메인 앱
│   └── index.css                  # 전역 스타일
├── package.json
└── README.md
```

## 💡 사용 방법

### 기본 사용

1. 웹 브라우저에서 앱 열기
2. 상단 메뉴에서 뷰 모드 선택:
   - **모바일 뷰**: 우측 하단에 가상 스마트폰 화면 표시
   - **데스크톱 뷰**: 전체 화면으로 표시
   - **Moodle 연동**: LMS 통합 데모 모드
3. 부등식 입력 (예: `2x + 5 < 3x - 1`)
4. "계산" 버튼 클릭
5. 단계별 풀이 과정 확인

### 지원되는 부등식 형식

- `2x + 5 < 3x - 1`
- `5x - 3 >= 2x + 9`
- `-2x + 4 <= x - 5`
- `3x + 7 > 2x - 4`

## 🎓 Moodle 연동

### Moodle API 통합 예시

```javascript
// Moodle에서 문제 데이터 가져오기
const fetchProblemFromMoodle = async (problemId: string) => {
  const response = await fetch(`/moodle/api/problem/${problemId}`);
  const data = await response.json();

  return {
    problemId: data.id,
    inequality: data.question,
    timeLimit: data.time_limit,
  };
};
```

### 필요한 Moodle 설정

- MySQL 5.7+
- PHP 7.1.9+
- Moodle 3.7+

## 🧮 알고리즘 설명

부등식 단순화는 다음 단계로 진행됩니다:

1. **파싱**: 부등식을 좌변, 연산자, 우변으로 분리
2. **상수항 이동**: 좌변의 상수를 우변으로 이동
3. **변수항 이동**: 우변의 변수를 좌변으로 이동
4. **동류항 정리**: 같은 변수끼리 합치기
5. **계수로 나누기**: 최종 답안 도출 (음수로 나누면 부등호 방향 변경)

## 🎨 커스터마이징

### 색상 테마 변경

`tailwind.config.js`에서 KAIST 브랜드 색상 수정:

```javascript
theme: {
  extend: {
    colors: {
      'kaist-blue': '#004098',
      'kaist-light': '#E8F4F8',
    },
  },
}
```

### 단계 지연 시간 조정

```tsx
<SimplifyBridge
  autoPlay={true}
  stepDelay={2000}  // 밀리초 단위
/>
```

## 📱 반응형 디자인

- 모바일: 375px × 667px 가상 스마트폰
- 태블릿: 자동 조정
- 데스크톱: 최대 너비 제한

## 🔧 개발

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 열기

### 타입 체크

```bash
npm run type-check
```

### 린트

```bash
npm run lint
```

## 📄 라이선스

MIT License - KAIST Touch Math Academy

## 👥 기여

이 프로젝트는 AI Education System Pipeline의 일부입니다.

## 📞 지원

문제가 있거나 제안사항이 있으시면 이슈를 생성해주세요.

---

**Built with ❤️ for KAIST Touch Math Academy**
