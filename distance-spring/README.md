# Distance Spring - 수 감각 학습 앱

숫자 간의 거리(차이)를 스프링의 길이로 시각화하여 수 감각을 기르는 교육용 웹 애플리케이션입니다.

## 🎯 교육 목표

- **수 감각 향상**: 숫자 간의 차이를 직관적으로 이해
- **시각적 학습**: 추상적인 수학 개념을 물리적 현상(스프링)으로 표현
- **상호작용 학습**: 실시간 입력과 애니메이션을 통한 탐구 학습

## ✨ 주요 기능

### 1. 실시간 스프링 시각화
- 두 숫자 입력 시 차이를 스프링 길이로 표현
- 부드러운 애니메이션 효과
- 거리에 따른 색상 변화 (파란색 → 빨간색)

### 2. 직관적인 UI
- 모바일 친화적 디자인 (가상 스마트폰 화면 최적화)
- 큰 글씨와 명확한 레이아웃
- 실시간 피드백

### 3. 접근성
- WCAG 2.1 AA 준수
- 키보드 네비게이션 지원
- 스크린 리더 지원
- 고대비 모드 지원

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Pure CSS (CSS Variables)
- **Graphics**: HTML5 Canvas API
- **Animation**: RequestAnimationFrame

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치
```bash
cd distance-spring
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드
```bash
npm run build
```

### 프리뷰
```bash
npm run preview
```

## 📱 사용 방법

1. **첫 번째 숫자 입력**: 왼쪽 입력 필드에 숫자 입력
2. **두 번째 숫자 입력**: 오른쪽 입력 필드에 숫자 입력
3. **스프링 관찰**: 두 숫자의 차이만큼 스프링이 늘어나거나 줄어듦
4. **실험**: 다양한 숫자로 거리 감각 탐구

## 🎨 디자인 특징

### 색상 시스템
- **Primary**: KAIST 블루 (#004098)
- **Accent**: 오렌지 (#ff6b35)
- **Gradient Background**: 보라색 그라데이션

### 반응형 디자인
- 데스크톱: 최대 480px 너비
- 모바일: 전체 화면 활용
- 태블릿: 자동 조정

### 애니메이션
- 스프링 늘어남/줄어듦: 부드러운 easing
- 페이드인 효과
- 펄스 애니메이션

## 🏗 프로젝트 구조

```
distance-spring/
├── src/
│   ├── components/
│   │   ├── SpringVisualizer.tsx      # 스프링 시각화 컴포넌트
│   │   └── SpringVisualizer.css
│   ├── styles/
│   │   ├── index.css                  # 글로벌 스타일
│   │   └── App.css                    # 앱 스타일
│   ├── App.tsx                        # 메인 앱 컴포넌트
│   └── main.tsx                       # 진입점
├── public/                            # 정적 파일
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🧮 알고리즘 설명

### 스프링 시각화 알고리즘

1. **거리 계산**: `distance = |number2 - number1|`
2. **스프링 길이 매핑**: `springLength = min(distance × 20, maxWidth × 0.6)`
3. **코일 수 계산**: `coils = max(5, floor(distance × 2))`
4. **색상 계산**: `hue = 200 - (tension × 80)` (파란색에서 빨간색)
5. **애니메이션**: Smooth easing으로 목표 길이까지 부드럽게 이동

### Canvas 렌더링

- **좌측 앵커**: 첫 번째 숫자 표시
- **스프링**: 사인파 형태의 코일
- **우측 앵커**: 두 번째 숫자 표시
- **화살표**: 거리와 방향 표시

## 🎓 교육적 활용

### 추천 학습 활동

1. **순서쌍 탐구**: (5, 8)과 (8, 5)의 차이 관찰
2. **거리의 불변성**: 여러 숫자 쌍에서 같은 거리 찾기
3. **정수와 소수**: 정수와 소수의 거리 비교
4. **음수 도입**: 음수를 포함한 거리 탐구 (향후 기능)

### 학년별 적용

- **초등 1-2학년**: 10 이하 자연수
- **초등 3-4학년**: 100 이하 자연수, 소수 한 자리
- **초등 5-6학년**: 큰 수, 소수 두 자리
- **중학교**: 음수, 분수

## 🔧 커스터마이징

### 스프링 매개변수 조정

`SpringVisualizer.tsx`에서 다음 변수 수정:

```typescript
const coils = Math.max(5, Math.floor(distance * 2))  // 코일 수
const coilHeight = 30                                 // 코일 높이
const targetStretch = Math.min(distance * 20, ...)    // 길이 배율
```

### 색상 테마 변경

`src/styles/index.css`에서 CSS 변수 수정:

```css
:root {
  --primary-color: #004098;
  --accent-color: #ff6b35;
  /* ... */
}
```

## 🚀 향후 계획

- [ ] 음수 지원
- [ ] 분수 입력 지원
- [ ] 여러 개의 숫자 동시 비교
- [ ] 수직 스프링 모드
- [ ] 소리 효과 추가
- [ ] 다국어 지원 (영어)
- [ ] Moodle LMS 연동
- [ ] 학습 데이터 저장 및 분석

## 📄 라이선스

MIT License - KAIST Touch Math Academy

## 👥 기여

KAIST Touch Math Academy 팀

## 📞 문의

기술적 질문이나 제안사항은 이슈를 등록해주세요.

---

**Made with ❤️ for better math education**
