# Vector Learning Module - 벡터 연산 학습 모듈

KAIST Touch Math Academy를 위한 벡터 연산 학습 모듈입니다. 정답을 맞추면 화면이 밝아지는 **Correct Glow** 효과가 있습니다.

## 주요 기능

### ✨ Correct Glow Effect
- 벡터 연산이 정답일 때 가상 스마트폰 화면이 밝아지는 시각적 피드백
- 부드러운 애니메이션으로 학생들에게 즉각적인 성취감 제공

### 📱 가상 스마트폰 UI
- 우측 하단에 표시되는 모던한 스마트폰 인터페이스
- 실제 스마트폰과 유사한 디자인 (노치, 홈 인디케이터 포함)
- 반응형 디자인

### 🔢 벡터 연산 문제
- **벡터 덧셈**: A + B
- **벡터 뺄셈**: A - B
- 랜덤 문제 생성
- 시각적 벡터 표현 (화살표)
- 즉각적인 정답/오답 피드백

## 기술 스택

- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안정성
- **Vite** - 빠른 개발 서버 및 빌드
- **CSS3** - 애니메이션 및 스타일링

## 설치 및 실행

### 필수 요구사항
- Node.js 16 이상
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

개발 서버가 http://localhost:3000 에서 실행됩니다.

### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist` 디렉토리에 생성됩니다.

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/
│   │   ├── VirtualSmartphone.tsx      # 가상 스마트폰 컴포넌트
│   │   ├── VirtualSmartphone.css
│   │   ├── VectorProblem.tsx          # 벡터 문제 UI
│   │   └── VectorProblem.css
│   ├── App.tsx                         # 메인 앱
│   ├── App.css
│   ├── main.tsx                        # 엔트리 포인트
│   └── index.css                       # 글로벌 스타일
├── public/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Correct Glow 효과 작동 방식

1. 사용자가 벡터 연산 문제를 풉니다
2. "확인" 버튼을 클릭하여 답을 제출합니다
3. **정답인 경우**:
   - 스마트폰 화면에 `correct-glow` 클래스가 추가됩니다
   - CSS 애니메이션이 실행됩니다:
     - 배경색이 황금빛으로 변합니다
     - 화면 밝기가 증가합니다 (1.4배)
     - 황금빛 내부 그림자 효과
   - 1.5초 동안 애니메이션이 재생됩니다
4. 성공 메시지가 표시됩니다

## LMS 연동 가이드

### Moodle 3.7 연동 (향후 구현)
```php
// Moodle 블록으로 임베드하기
<iframe src="http://your-domain:3000"
        width="100%"
        height="800px"
        frameborder="0">
</iframe>
```

### API 엔드포인트 (향후 구현 예정)
```
POST /api/submit-answer
GET  /api/get-problem
GET  /api/student-progress
```

## 사용자 정의

### 벡터 범위 변경
`VectorProblem.tsx` 파일에서 벡터 값의 범위를 수정할 수 있습니다:

```typescript
// 현재: -5 ~ 5
x: Math.floor(Math.random() * 10) - 5

// 변경 예시: -10 ~ 10
x: Math.floor(Math.random() * 20) - 10
```

### Glow 효과 색상 변경
`VirtualSmartphone.css` 파일에서 애니메이션 색상을 변경할 수 있습니다:

```css
.smartphone-screen.correct-glow {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe9a0 100%);
  /* 원하는 색상으로 변경 */
}
```

## 브라우저 지원

- Chrome/Edge (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- 모바일 브라우저 지원

## 라이선스

KAIST Touch Math Academy 전용

## 개발자

AI Education System Pipeline Project

---

## 스크린샷

### 메인 화면
- 중앙: 제목 및 설명
- 우측 하단: 가상 스마트폰

### 벡터 문제
- 벡터 A, B의 시각적 표현
- 입력 필드 (x, y 좌표)
- 확인/새 문제 버튼

### Correct Glow 효과
- 정답 시 화면이 황금빛으로 밝아짐
- 부드러운 애니메이션 전환
