# 시험 시뮬레이터 (Exam Simulator)

**"점수 올려주는 시간 운영 근육"을 키우는 수학 시험 시뮬레이터 + 멘탈 코치 앱**

## 개요

이 앱은 학생들이 실제 시험에서 **시간 관리**와 **문제 선택 전략**을 훈련할 수 있도록 설계된 웹 애플리케이션입니다. 단순히 문제를 푸는 것이 아니라, **언제 어떤 문제를 풀지 결정하는 능력**을 키우는 것이 핵심 목표입니다.

## 주요 기능

### 1. 3라운드 전략 훈련
- **1라운드**: 전 문제 훑기 + 쉬운 문제만 1분 안에 풀기
- **2라운드**: 보통 난이도 문제 정리 (2분 이내)
- **3라운드**: 어려운 문제 선택 공략 or 과감히 버리기

### 2. 실시간 멘탈 코칭
- 시험 전 호흡 가이드 (4-4-4 호흡법)
- 시간 기반 자동 알림 (남은 시간 50%, 30% 도달 시)
- 긴장도 추적 및 패턴 분석

### 3. 상세한 회고 시스템
- 문항별 타임라인 분석
- 쉬운 문제 놓침 패턴 감지
- 3분 이상 집착한 문제 경고
- 라운드별 시간 사용 통계

### 4. 데이터 기반 코칭
- 개인화된 피드백 메시지
- 패턴 분석 및 개선 제안
- 과거 세션 데이터 저장 (로컬 스토리지)

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS v4 + @tailwindcss/postcss
- **State Management**: Zustand (with persist middleware)
- **Storage**: Browser LocalStorage

## 설치 및 실행

### 개발 환경
```bash
cd exam-simulator
npm install
npm run dev
```

브라우저에서 http://localhost:5173 접속

### 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
exam-simulator/
├── src/
│   ├── types/           # TypeScript 타입 정의
│   │   └── index.ts     # QuestionStatus, Difficulty, RoundNumber 등
│   ├── store/           # Zustand 상태 관리
│   │   └── examStore.ts # 세션, 문항, 멘탈 이벤트 관리
│   ├── screens/         # 주요 화면 컴포넌트
│   │   ├── ExamSetupScreen.tsx    # 시험 세팅 화면
│   │   ├── ExamRoundScreen.tsx    # 라운드별 풀이 화면
│   │   └── ExamReviewScreen.tsx   # 회고 화면
│   ├── components/      # 재사용 가능한 컴포넌트
│   ├── hooks/           # 커스텀 훅
│   ├── utils/           # 유틸리티 함수
│   ├── App.tsx          # 메인 앱 컴포넌트
│   ├── main.tsx         # 엔트리 포인트
│   └── index.css        # Tailwind CSS 임포트
├── tasks/               # 프로젝트 문서
│   └── 0002-exam-simulator-service-design.md
└── README.md
```

## 사용 방법

### 1. 시험 세팅
- 시험 이름 입력 (예: "중2 1학기 중간고사", "모의고사 3회차")
- 총 시험 시간 설정 (10~120분, 슬라이더)
- 문항 수 설정 (5~50개, 슬라이더)
- 현재 긴장도 평가 (0~10, 슬라이더)

### 2. 호흡 가이드
- 시작 전 4-4-4 호흡법 안내
  - 4초 들이마시기
  - 4초 멈추기
  - 4초 내쉬기
- 2사이클 자동 진행

### 3. 시험 진행
각 문항에 대해 난이도 평가 및 액션 선택:
- **쉬움** → 바로 풀기 (1분 목표)
- **보통** → 2라운드로 미루기
- **어려움** → 3라운드로 미루기
- **전혀 모름** → 버리기 고려

액션 버튼:
- ✅ 완료 (정답)
- ❌ 완료 (오답 느낌)
- ⏭️ 일단 넘기기
- 🚫 과감히 버리기 (3라운드만)

### 4. 회고
- **요약 통계**: 정답/오답/버림/미처리 개수
- **코칭 메시지**: AI 기반 패턴 분석 및 피드백
- **쉬운 문제 분석**: 놓친 쉬운 문제 수
- **시간 분석**: 3분 이상 문제, 마지막 10분 문제
- **라운드별 시간**: 각 라운드별 시간 사용 비율
- **문항별 타임라인**: 모든 문항의 라운드별 처리 기록

## 데이터 모델

### 문항 상태 (QuestionStatus)
```typescript
UNSEEN          // 아직 건드리지 않음
SCANNED         // 난이도 평가만 완료
IN_PROGRESS     // 풀이 중
SOLVED_CORRECT  // 정답 처리
SOLVED_WRONG    // 오답 처리
SKIPPED         // 의도적 패스
GIVEN_UP        // 버리기로 결정
```

### 난이도 (Difficulty)
```typescript
EASY      // 쉬움
MEDIUM    // 보통
HARD      // 어려움
NO_IDEA   // 전혀 모르겠음
```

### 라운드 (RoundNumber)
```typescript
ROUND_1   // 전 문제 스캔 + 쉬운 문제
ROUND_2   // 보통 난이도 문제
ROUND_3   // 어려운 문제 / 선택과 집중
```

## 핵심 기능 설명

### 멘탈 이벤트 트리거
- **50% 남았을 때**: "지금은 쉬운 문제 수를 늘려야 하는 타이밍"
- **30% 미만**: "살릴 문제 / 버릴 문제를 나눌 시간"

### 패턴 분석
- 쉬운 문제 남김 패턴
- 어려운 문제 집착 패턴 (3분 이상)
- 막판 몰아서 푸는 패턴
- 초반 체력 소진 패턴

### 로컬 스토리지 지속성
- Zustand persist middleware 사용
- 브라우저를 닫아도 세션 데이터 유지
- 과거 세션 기록 저장

## 향후 개발 계획

- [ ] 실제 문제 이미지 업로드 및 OCR 연동
- [ ] 학생 수준별 맞춤 전략 추천
- [ ] 그룹 학습 및 순위표 기능
- [ ] 과거 세션 비교 및 성장 그래프
- [ ] 다크 모드 지원
- [ ] 모바일 반응형 최적화
- [ ] PWA (Progressive Web App) 변환
- [ ] 백엔드 API 및 클라우드 동기화
- [ ] 학부모/교사 대시보드

## 개발 정보

### 환경 변수
현재 환경 변수 없음 (모든 데이터 로컬 스토리지)

### 빌드 설정
- TypeScript strict mode 활성화
- ESLint + Prettier 설정
- Vite 최적화 번들링

### 브라우저 지원
- Chrome/Edge (최신)
- Firefox (최신)
- Safari (최신)

## 라이선스

This project is part of the Alt42 Education System.

## 문의

프로젝트 관련 문의나 버그 리포트는 이슈를 열어주세요.
