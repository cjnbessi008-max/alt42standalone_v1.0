# Overlap Vision 🔮

**겹쳐보는 도형 투명 오버레이**

우측 하단 가상 스마트폰 화면에 표시되는 투명 도형 오버레이 웹앱입니다.

## 주요 기능

- ✨ **다양한 도형**: 원, 사각형, 삼각형, 직사각형, 오각형, 육각형
- 🎨 **투명도 조절**: 0-100% 자유롭게 조절 가능
- 🌈 **블렌드 모드**: normal, multiply, screen, overlay, darken, lighten 등
- 📱 **모바일 뷰포트**: 실제 스마트폰 화면처럼 표시
- 🎯 **인터랙티브**: 클릭으로 도형 선택 및 편집
- 🔄 **회전 & 크기 조절**: 각도와 크기를 자유롭게 변경

## 기술 스택

- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빠른 빌드 도구
- **CSS Modules** - 스타일 캡슐화
- **SVG** - 벡터 그래픽 렌더링

## 시작하기

### 설치

```bash
npm install
```

### 개발 모드 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프리뷰

```bash
npm run preview
```

## 사용 방법

1. **도형 추가**: 왼쪽 컨트롤 패널에서 원하는 도형 버튼 클릭
2. **도형 선택**: 스마트폰 화면의 도형을 클릭
3. **속성 편집**: 선택된 도형의 투명도, 색상, 블렌드 모드, 회전, 크기 조절
4. **도형 삭제**: 선택된 도형의 삭제 버튼 클릭
5. **전체 삭제**: 컨트롤 패널 하단의 "전체 삭제" 버튼

## 프로젝트 구조

```
overlap-vision/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── MobilePhoneFrame.tsx
│   │   ├── ShapeRenderer.tsx
│   │   └── ControlPanel.tsx
│   ├── types/                # TypeScript 타입
│   │   └── Shape.ts
│   ├── utils/                # 유틸리티 함수
│   │   ├── shapeFactory.ts
│   │   └── geometryUtils.ts
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── App.css               # 글로벌 스타일
│   └── main.tsx              # 진입점
├── index.html                # HTML 템플릿
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 임베딩 방법

### 1. iframe으로 임베딩

```html
<iframe
  src="path/to/overlap-vision/dist/index.html"
  width="100%"
  height="100%"
  frameborder="0"
></iframe>
```

### 2. Moodle 통합

Moodle 페이지나 과정에 HTML 블록으로 추가:

```html
<div style="position: relative; width: 100%; height: 600px;">
  <iframe
    src="https://your-domain.com/overlap-vision/"
    width="100%"
    height="100%"
    frameborder="0"
    allowfullscreen
  ></iframe>
</div>
```

### 3. PHP 페이지에 통합

```php
<?php
// index.php
?>
<!DOCTYPE html>
<html>
<head>
    <title>Overlap Vision</title>
</head>
<body>
    <?php include 'overlap-vision/dist/index.html'; ?>
</body>
</html>
```

## 커스터마이징

### 초기 도형 설정

`src/App.tsx`에서 `useState` 초기값을 변경:

```typescript
const [shapes, setShapes] = useState<Shape[]>([
  createShape('circle', 100, 100, '#ef4444'),
  createShape('square', 200, 200, '#3b82f6'),
]);
```

### 뷰포트 크기 변경

`src/App.tsx`에서 상수 수정:

```typescript
const VIEWPORT_WIDTH = 375;  // 원하는 너비
const VIEWPORT_HEIGHT = 667; // 원하는 높이
```

### 색상 팔레트 변경

`src/utils/shapeFactory.ts`의 `getRandomColor()` 수정

## 브라우저 지원

- Chrome/Edge (최신)
- Firefox (최신)
- Safari (최신)
- 모바일 브라우저 지원

## 라이선스

MIT License

## 제작

KAIST Touch Math Academy - AI Education System Pipeline
