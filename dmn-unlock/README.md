# DMN 해제 시각효과 웹앱

LMS와 연동 가능한 10초 DMN(Default Mode Network) 해제용 호흡 유도 시각효과 웹앱입니다.

## 기능

### 🎯 주요 기능
- **10초 호흡 운동**: 과학적으로 검증된 호흡 패턴으로 집중력 향상
- **시각적 가이드**: 실시간 호흡 유도 애니메이션
- **LMS 연동**: postMessage API를 통한 완료 이벤트 전송
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원

### 🌬️ 호흡 패턴
1. **들이쉬기** (4초): 원이 천천히 확대
2. **참기** (2초): 원이 최대 크기로 유지
3. **내쉬기** (4초): 원이 천천히 축소

총 10초의 호흡 운동으로 DMN을 해제하고 집중력을 향상시킵니다.

## 설치 및 실행

### 필수 요구사항
- Node.js 14 이상
- npm 또는 yarn

### 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (localhost:3000)
npm start

# 프로덕션 빌드
npm run build
```

## LMS 연동 방법

### 1. iframe으로 임베딩

```html
<iframe
  src="https://your-domain.com/dmn-unlock"
  width="100%"
  height="100vh"
  frameborder="0"
  id="dmn-unlock-iframe"
></iframe>

<script>
  // 완료 이벤트 수신
  window.addEventListener('message', function(event) {
    if (event.data.type === 'DMN_UNLOCK_COMPLETE') {
      console.log('DMN 해제 완료:', event.data);
      // LMS 로직 계속 진행
      proceedToNextStep();
    }
  });
</script>
```

### 2. 새 창으로 열기

```javascript
const dmnWindow = window.open(
  'https://your-domain.com/dmn-unlock',
  'DMN Unlock',
  'width=800,height=600'
);

window.addEventListener('message', function(event) {
  if (event.data.type === 'DMN_UNLOCK_COMPLETE') {
    console.log('DMN 해제 완료:', event.data);
    dmnWindow.close();
    proceedToNextStep();
  }
});
```

### 3. 완료 이벤트 데이터 구조

```javascript
{
  type: 'DMN_UNLOCK_COMPLETE',
  duration: 10000,  // 밀리초
  timestamp: '2025-11-18T10:30:00.000Z'  // ISO 8601 형식
}
```

## 프로젝트 구조

```
dmn-unlock/
├── public/
│   └── index.html              # HTML 템플릿
├── src/
│   ├── components/
│   │   ├── DMNUnlock.jsx       # 메인 컴포넌트
│   │   └── DMNUnlock.css       # 스타일 및 애니메이션
│   ├── App.jsx                 # 앱 루트 컴포넌트
│   ├── App.css                 # 앱 스타일
│   ├── index.js                # 진입점
│   └── index.css               # 전역 스타일
├── package.json
└── README.md
```

## 기술 스택

- **React 18**: UI 프레임워크
- **CSS3**: 애니메이션 및 스타일링
- **postMessage API**: LMS 연동

## 커스터마이징

### 호흡 패턴 수정

`src/components/DMNUnlock.jsx` 파일에서 다음 상수를 수정:

```javascript
const TOTAL_DURATION = 10000;   // 전체 시간
const INHALE_DURATION = 4000;   // 들이쉬기 시간
const HOLD_DURATION = 2000;     // 참기 시간
const EXHALE_DURATION = 4000;   // 내쉬기 시간
```

### 색상 테마 변경

`src/components/DMNUnlock.css` 파일의 `.background-gradient` 섹션 수정:

```css
.background-gradient {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### 텍스트 변경

`src/components/DMNUnlock.jsx`의 `getInstructionText()` 함수 및 화면별 텍스트 수정

## 배포

### Vercel

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# build 폴더를 Netlify에 드래그 앤 드롭
```

### GitHub Pages

```bash
npm install --save-dev gh-pages

# package.json에 추가:
# "homepage": "https://username.github.io/dmn-unlock",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build"

npm run deploy
```

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

MIT License

## 기여

이슈 및 풀 리퀘스트를 환영합니다!

## 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.
