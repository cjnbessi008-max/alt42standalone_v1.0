# 🎉 LMS 기분 리셋 애니메이션 웹앱

문제를 풀 때마다 기분이 좋아지는 독립형 LMS 웹 애플리케이션입니다.

## ✨ 주요 기능

- **문제 풀이 인터페이스**: 깔끔하고 직관적인 UI
- **기분 리셋 애니메이션**: 문제 완료 시 축하 애니메이션
  - 🎊 Confetti 파티클 효과
  - 😊 기분 이모지 애니메이션
  - 🌈 부드러운 색상 전환
  - ✨ Framer Motion 기반의 부드러운 애니메이션
- **진행률 추적**: 실시간 학습 진행 상황 표시
- **반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Animation**: Framer Motion
- **Styling**: CSS-in-JS (Inline Styles)

## 🚀 시작하기

### 필수 요구사항

- Node.js 16.x 이상
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
   ```bash
   cd mood-reset-webapp
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 자동으로 `http://localhost:3000` 이 열립니다.

3. **프로덕션 빌드**
   ```bash
   npm run build
   ```

4. **빌드 결과 미리보기**
   ```bash
   npm run preview
   ```

## 📁 프로젝트 구조

```
mood-reset-webapp/
├── src/
│   ├── components/
│   │   ├── MoodResetAnimation.tsx    # 기분 리셋 애니메이션 컴포넌트
│   │   ├── ProblemSolver.tsx         # 문제 풀이 컴포넌트
│   │   └── ProgressBar.tsx           # 진행률 표시 컴포넌트
│   ├── data/
│   │   └── problems.ts               # 샘플 문제 데이터
│   ├── types/
│   │   └── index.ts                  # TypeScript 타입 정의
│   ├── styles/
│   │   └── global.css                # 전역 스타일
│   ├── App.tsx                       # 메인 앱 컴포넌트
│   └── main.tsx                      # 앱 엔트리 포인트
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 🎨 애니메이션 상세

### 기분 리셋 애니메이션 구성

1. **Confetti 효과**
   - 30개의 파티클이 중앙에서 방사형으로 퍼짐
   - 랜덤한 색상과 위치
   - 회전 애니메이션과 페이드 아웃

2. **이모지 애니메이션**
   - 축하 이모지(🎉)가 회전하며 등장
   - 스케일 애니메이션으로 강조 효과

3. **메시지 표시**
   - "정답입니다! 🌟" 메시지
   - "기분이 좋아졌어요! 😊" 리셋 인디케이터

4. **타이밍**
   - 전체 애니메이션 지속 시간: 2.5초
   - 자동으로 다음 문제로 전환

## 🔧 커스터마이징

### 문제 추가하기

`src/data/problems.ts` 파일에서 문제를 추가하거나 수정할 수 있습니다:

```typescript
{
  id: 6,
  question: '새로운 문제?',
  options: ['선택지 1', '선택지 2', '선택지 3', '선택지 4'],
  correctAnswer: 0, // 정답 인덱스 (0부터 시작)
  explanation: '설명 (선택사항)'
}
```

### 애니메이션 수정하기

`src/components/MoodResetAnimation.tsx` 파일에서:
- 파티클 개수 조정: `Array.from({ length: 30 }, ...)`
- 지속 시간 변경: `setTimeout(..., 2500)`
- 색상 변경: `color` 배열 수정

## 🌐 LMS 연동 가이드

이 앱을 실제 LMS와 연동하려면:

1. **API 엔드포인트 추가**
   - 문제 가져오기: `GET /api/problems`
   - 답안 제출: `POST /api/submit`
   - 진행률 저장: `PUT /api/progress`

2. **상태 관리 추가**
   - Redux Toolkit 또는 Zustand 도입 권장
   - 사용자 세션 관리
   - 진행률 동기화

3. **인증 구현**
   - JWT 토큰 기반 인증
   - 사용자 식별 및 권한 관리

## 📱 반응형 디자인

- 모바일: 전체 화면 활용
- 태블릿: 최대 너비 800px
- 데스크톱: 중앙 정렬 레이아웃

## 🎯 향후 개선 사항

- [ ] 오답 노트 기능
- [ ] 난이도별 문제 분류
- [ ] 타이머 기능
- [ ] 성취 뱃지 시스템
- [ ] 다크 모드 지원
- [ ] 다국어 지원

## 📄 라이선스

MIT License

## 🤝 기여

이슈 및 PR을 환영합니다!

---

Made with ❤️ for better learning experience
