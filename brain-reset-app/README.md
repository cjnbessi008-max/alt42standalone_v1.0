# Brain Clear - 뇌 클리어 웹앱

학습 중 집중력 회복을 위한 짧은 명상 웹 애플리케이션입니다.

## 특징

- **호흡 가이드**: 시각적 애니메이션을 통한 호흡 가이드 (4초 들이마시기, 2초 멈추기, 6초 내쉬기)
- **90초 세션**: 학습 중 짧은 휴식으로 집중력 회복
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원
- **독립형 웹앱**: LMS와 통합 가능한 독립형 애플리케이션

## 기술 스택

- **React 18** + TypeScript
- **Vite** - 빠른 개발 환경
- **CSS3** - 순수 CSS 애니메이션 (라이브러리 의존성 없음)

## 시작하기

### 설치

```bash
cd brain-reset-app
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 프리뷰

```bash
npm run preview
```

프로덕션 빌드를 로컬에서 미리 볼 수 있습니다.

## 사용 방법

1. "시작하기" 버튼을 클릭
2. 화면의 호흡 가이드를 따라 호흡
   - **파란색 원**: 숨을 들이마시세요 (4초)
   - **보라색 원**: 잠시 멈춰요 (2초)
   - **녹색 원**: 숨을 내쉬세요 (6초)
3. 90초 세션이 완료되면 학습으로 돌아가세요

## 프로젝트 구조

```
brain-reset-app/
├── public/
│   └── brain-icon.svg          # 앱 아이콘
├── src/
│   ├── components/
│   │   ├── BrainResetFlash.tsx # 메인 컴포넌트
│   │   ├── BrainResetFlash.css
│   │   ├── BreathingGuide.tsx  # 호흡 가이드 애니메이션
│   │   ├── BreathingGuide.css
│   │   ├── Timer.tsx           # 타이머 컴포넌트
│   │   └── Timer.css
│   ├── styles/
│   │   └── global.css          # 전역 스타일
│   ├── types.ts                # TypeScript 타입 정의
│   ├── App.tsx                 # 앱 엔트리포인트
│   └── main.tsx                # React 엔트리포인트
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## LMS 통합

이 웹앱은 다음과 같은 방법으로 LMS와 통합할 수 있습니다:

### 1. iframe 임베딩

```html
<iframe
  src="https://your-domain.com/brain-reset"
  width="100%"
  height="800px"
  frameborder="0"
  title="Brain Clear">
</iframe>
```

### 2. 팝업 윈도우

```javascript
function openBrainClear() {
  window.open(
    'https://your-domain.com/brain-reset',
    'BrainClear',
    'width=800,height=600,resizable=yes,scrollbars=yes'
  );
}
```

### 3. 페이지 내 링크

```html
<a href="https://your-domain.com/brain-reset" target="_blank">
  뇌 클리어 시작하기
</a>
```

## 교육적 효과

- **푸모도로 테크닉**: 25분 학습 후 5분 휴식 권장
- **인지 과부하 감소**: 짧은 휴식으로 정보 처리 능력 향상
- **집중력 회복**: 호흡 명상을 통한 스트레스 감소 및 집중력 향상

## 브라우저 지원

- Chrome (최신 2버전)
- Firefox (최신 2버전)
- Safari (최신 2버전)
- Edge (최신 2버전)

## 라이선스

MIT License

## 기여

KAIST Touch Math Academy의 AI Education System Pipeline 프로젝트의 일부입니다.

## 문의

문제가 발생하거나 제안사항이 있으시면 이슈를 등록해주세요.
