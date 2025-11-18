# ALT42 Standalone - 수직선 학습 앱

LMS(Moodle)와 연동 가능한 독립형 수직선 학습 웹 애플리케이션

## 프로젝트 개요

이 프로젝트는 학생들이 수직선에서 범위를 선택하며 수학 개념을 학습할 수 있는 인터랙티브 웹 애플리케이션입니다. 우측 하단에 스마트폰 화면을 시뮬레이션하여 모바일 환경을 재현하며, 부드러운 'Range Glow' 효과로 선택한 범위를 시각적으로 강조합니다.

## 주요 기능

### ✨ Range Glow 효과
- SVG Gaussian Blur 필터를 사용한 부드러운 발광 효과
- CSS 애니메이션을 통한 펄스 효과
- 드래그 중 실시간 프리뷰
- 범위 경계 포인트 애니메이션

### 📱 스마트폰 디스플레이
- 우측 하단에 고정된 스마트폰 프레임
- 실제 기기처럼 보이는 노치, 스피커, 홈 인디케이터
- 반응형 디자인으로 모바일/태블릿 지원
- Floating 애니메이션

### 🎓 LMS 연동
- Moodle 3.7 연동을 위한 Mock API
- PHP 7.1.9, MySQL 5.7 환경 지원
- 문제 데이터 동적 로딩
- 학생 응답 제출 및 채점
- 학습 통계 추적

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build**: Vite 7
- **Styling**: CSS3 + SVG
- **Backend (예정)**: Node.js + Express
- **LMS**: Moodle 3.7
- **Database (예정)**: MySQL 5.7

## 빠른 시작

```bash
# 1. 프로젝트 클론
cd alt42standalone_v1.0

# 2. 의존성 설치
cd frontend
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 열기
# http://localhost:5173
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 웹앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── NumberLine/     # 수직선 + Range Glow
│   │   │   └── SmartphoneDisplay/  # 스마트폰 프레임
│   │   ├── App.tsx
│   │   └── App.css
│   ├── dist/                   # 프로덕션 빌드
│   └── package.json
├── docs/                       # PRD 문서
└── README.md
```

## 컴포넌트 상세

### VerticalNumberLine
수직 수직선 컴포넌트 - 드래그로 범위 선택

**Props:**
- `min`, `max`: 수직선 범위
- `selectedRange`: 선택된 범위
- `onRangeSelect`: 선택 콜백
- `showGlow`: Glow 효과 활성화
- `glowIntensity`: 발광 강도

### RangeGlow
범위 강조 효과 컴포넌트

**특징:**
- SVG 필터 기반 Glow
- 부드러운 그라디언트
- 애니메이션 펄스
- 커스터마이징 가능한 색상

### SmartphoneFrame
스마트폰 화면 프레임

**Props:**
- `position`: 화면 위치
- `scale`: 크기 조정

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 배포 (정적 호스팅)
# dist/ 폴더를 Netlify, Vercel, GitHub Pages 등에 배포
```

## LMS 연동 가이드

### 현재 상태 (Mock)
콘솔에서 LMS API 호출 시뮬레이션을 확인할 수 있습니다:
- 문제 데이터 로딩
- 답안 제출
- 결과 피드백

### 실제 연동 시 필요사항
1. Moodle LTI 플러그인 설치
2. 백엔드 API 서버 구축
3. OAuth 인증 구현
4. Grade Passback 설정

## 개발 가이드

### 새로운 문제 추가
`App.tsx`의 `mockLMSProblems` 배열에 추가:

```typescript
{
  id: 5,
  title: '새로운 문제',
  description: '문제 설명',
  min: -10,
  max: 10,
  correctRange: { start: 1, end: 5 },
  difficulty: 'easy',
}
```

### Glow 색상 변경
`RangeGlow.tsx`에서 `color` prop 수정

### 스마트폰 프레임 위치 조정
`App.tsx`에서 `SmartphoneFrame`의 `position` prop 변경

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 로드맵

- [ ] 백엔드 API 구현
- [ ] 실제 Moodle LTI 연동
- [ ] 다양한 문제 유형 추가
- [ ] 터치 제스처 지원 개선
- [ ] 다국어 지원
- [ ] 접근성 개선 (WCAG 2.1)

## 기여

이슈나 PR을 환영합니다!

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 생성해주세요.
