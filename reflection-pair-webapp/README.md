# Reflection Pair - 독립형 웹앱

지수 함수와 로그 함수의 역함수 관계를 시각적으로 탐구하는 현대적인 독립형 웹 애플리케이션입니다.

## 🚀 주요 기능

### 🎨 대화형 시각화
- **지수 함수** (빨강): y = b^x
- **로그 함수** (청록): y = log_b(x)
- **반사선** (노랑): y = x
- 실시간 드래그 & 줌
- 부드러운 60 FPS 애니메이션

### 📱 가상 스마트폰 디스플레이
- 화면 우측 하단에 고정 배치
- 모던한 노치 디자인
- 메인 화면과 독립적인 인터랙션

### ⚙️ 유연한 설정
- 다양한 밑(base) 지원: e, 2, 10, 사용자 정의
- 격자/좌표축/반사선 토글
- 실시간 설정 변경

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **State Management**: Zustand
- **Styling**: Tailwind CSS 3
- **Canvas**: HTML5 Canvas API
- **Math**: 순수 JavaScript 구현

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 18+ (LTS 권장)
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 또는
yarn install
```

### 개발 서버 실행

```bash
# 개발 모드 (HMR 지원)
npm run dev

# 브라우저가 자동으로 http://localhost:3000 열림
```

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 결과물 미리보기
npm run preview
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 📁 프로젝트 구조

```
reflection-pair-webapp/
├── src/
│   ├── components/
│   │   ├── ReflectionCanvas.tsx      # 메인 Canvas 컴포넌트
│   │   ├── SmartphoneFrame.tsx       # 가상 스마트폰 UI
│   │   ├── ControlPanel.tsx          # 컨트롤 버튼들
│   │   ├── Legend.tsx                # 범례
│   │   └── SettingsPanel.tsx         # 설정 패널
│   ├── hooks/
│   │   └── useReflectionPair.ts      # Zustand 스토어
│   ├── utils/
│   │   └── math.ts                   # 수학 유틸리티
│   ├── types/
│   │   └── index.ts                  # TypeScript 타입 정의
│   ├── App.tsx                       # 메인 App
│   ├── main.tsx                      # 진입점
│   └── index.css                     # Tailwind CSS
├── public/                           # 정적 파일
├── index.html                        # HTML 템플릿
├── vite.config.ts                    # Vite 설정
├── tailwind.config.js                # Tailwind 설정
├── tsconfig.json                     # TypeScript 설정
└── package.json                      # 프로젝트 정보
```

## 🎮 사용 방법

### 기본 조작

1. **드래그**: 마우스로 그래프를 클릭하고 드래그하여 이동
2. **스크롤**: 마우스 휠을 사용하여 확대/축소
3. **버튼**: 우측 하단 스마트폰의 컨트롤 버튼 사용
   - `+`: 확대
   - `−`: 축소
   - `⟲`: 뷰 리셋
   - `y = x`: 반사선 토글

### 설정 변경

좌측 상단의 "⚙️ 설정" 버튼을 클릭하여:
- **밑(Base) 변경**: e, 2, 10 또는 사용자 정의 값
- **표시 옵션**: 격자, 좌표축, 반사선 토글

## 🎯 교육적 활용

### 학습 목표

1. **역함수 개념 이해**
   - f(f⁻¹(x)) = x
   - 그래프의 y=x 대칭성

2. **정의역과 치역**
   - 지수: ℝ → ℝ⁺ (모든 실수 → 양수)
   - 로그: ℝ⁺ → ℝ (양수 → 모든 실수)

3. **점 대응 관계**
   - (a, b) ∈ 지수 함수 ⟺ (b, a) ∈ 로그 함수

4. **다양한 밑 비교**
   - 밑이 클수록 지수 함수는 더 가파르게 증가
   - 로그 함수는 더 느리게 증가

### 실험 아이디어

1. **밑 변경 실험**: e, 2, 10을 비교하며 기울기 변화 관찰
2. **대칭성 확인**: 특정 점을 찾아 반사 관계 검증
3. **극한 탐구**: x → ∞, x → 0⁺ 에서의 함수 행동

## 🔧 커스터마이징

### 색상 변경

`tailwind.config.js`에서 색상 정의:

```javascript
theme: {
  extend: {
    colors: {
      'exponential': '#ff6b6b',    // 지수 함수
      'logarithmic': '#4ecdc4',    // 로그 함수
      'reflection': '#ffd93d',     // 반사선
    }
  }
}
```

### 기본 설정 변경

`src/hooks/useReflectionPair.ts`에서:

```typescript
const DEFAULT_CONFIG: ProblemConfig = {
  baseNumber: Math.E,    // 기본 밑
  xMin: -3,              // X 범위
  xMax: 3,
  showReflectionLine: true,
  showGrid: true,
  showAxes: true,
};
```

### 스마트폰 크기 조정

`src/components/SmartphoneFrame.tsx`에서 `w-[225px] h-[400px]` 수정

## 🚀 배포

### Vercel (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### Netlify

```bash
# 빌드
npm run build

# Netlify에 dist/ 폴더 업로드
```

### GitHub Pages

```bash
# vite.config.ts에 base 추가
export default defineConfig({
  base: '/repository-name/',
  // ...
})

# 빌드 및 배포
npm run build
git add dist -f
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

### 정적 호스팅

`dist/` 폴더의 내용을 다음 플랫폼에 업로드:
- AWS S3 + CloudFront
- Azure Static Web Apps
- Firebase Hosting
- Cloudflare Pages

## 📊 성능

- **초기 로드**: < 100KB (gzip)
- **렌더링**: 60 FPS
- **반응성**: < 16ms (Vite HMR)
- **빌드 시간**: < 10초

## 🔒 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 기여

이슈 및 PR 환영합니다!

## 📄 라이선스

MIT License - 교육 목적으로 자유롭게 사용 가능

## 🙏 감사

- React Team
- Vite Team
- Tailwind CSS
- Zustand

---

**Made with ❤️ for Mathematics Education**

문의: [이메일] | [GitHub]
