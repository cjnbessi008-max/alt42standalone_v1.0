# 📐 Slope Drag - 기울기 학습 웹앱

그래프의 점을 드래그하여 기울기를 실시간으로 학습할 수 있는 인터랙티브 교육용 웹 애플리케이션입니다.

## ✨ 주요 기능

- **인터랙티브 그래프**: Canvas 기반 좌표계에서 점을 자유롭게 드래그
- **실시간 기울기 계산**: 두 점 사이의 기울기를 즉시 계산 및 표시
- **수식 표시**: `m = (y₂ - y₁) / (x₂ - x₁)` 공식과 실제 계산 과정 표시
- **모바일 지원**: 터치 이벤트 완벽 지원 (Pointer API)
- **스마트폰 프레임 UI**: 우측 하단에 가상 스마트폰 화면으로 모바일 뷰 미리보기
- **반응형 디자인**: 데스크톱과 모바일 환경 모두 최적화

## 🚀 시작하기

### 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

개발 서버가 시작되면 브라우저에서 `http://localhost:3000`으로 접속하세요.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🎮 사용 방법

1. **점 드래그**: 🔴 빨간 점 또는 🔵 파란 점을 마우스나 터치로 드래그하세요
2. **기울기 확인**: 하단의 보라색 패널에서 실시간으로 기울기 값 확인
3. **수식 학습**: 기울기 공식과 실제 계산 과정을 함께 표시
4. **수직선 처리**: x 좌표가 같을 때는 "∞ (수직)" 표시

## 🛠 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **그래프 렌더링**: HTML5 Canvas API
- **스타일링**: CSS3 (Grid, Flexbox)
- **이벤트 처리**: Pointer Events API (통합 마우스/터치)

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── SlopeDragGraph.tsx      # 메인 그래프 컴포넌트
│   │   ├── SlopeDragGraph.css
│   │   ├── MobileFrame.tsx          # 스마트폰 프레임 UI
│   │   └── MobileFrame.css
│   ├── App.tsx                      # 메인 앱 컴포넌트
│   ├── App.css
│   ├── main.tsx                     # 엔트리 포인트
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 주요 컴포넌트

### SlopeDragGraph

좌표계 그래프와 드래그 인터랙션을 담당하는 핵심 컴포넌트:

- 좌표계 및 그리드 렌더링
- 두 개의 드래그 가능한 점 (P1, P2)
- 점 사이의 선 그리기
- 실시간 기울기 계산
- 마우스/터치 이벤트 처리

### MobileFrame

스마트폰 화면을 시뮬레이션하는 UI 컴포넌트:

- 아이폰 스타일 프레임
- 상태바 (시간, 배터리 등)
- 홈 인디케이터

## 🔧 커스터마이징

### 그리드 범위 변경

`SlopeDragGraph.tsx`에서 `gridRange` 값을 수정:

```typescript
const gridRange = 10; // -10 ~ +10 범위
```

### 캔버스 크기 조정

```typescript
const canvasWidth = isMobile ? 320 : 600;
const canvasHeight = isMobile ? 320 : 600;
```

## 🌐 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 라이선스

MIT

## 👨‍💻 개발자

KAIST Touch Math Academy - AI Education System Pipeline

---

**Moodle LMS 연동** 및 **추가 교육 모듈**은 향후 업데이트 예정입니다.
