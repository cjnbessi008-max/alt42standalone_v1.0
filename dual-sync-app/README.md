# Dual Sync 방정식 그래프 웹앱

## 📱 프로젝트 개요

스마트폰 화면에서 방정식의 그래프와 식이 실시간으로 동기화되는 교육용 웹 애플리케이션

## 🛠 기술 스택

### Frontend
- **React 18** + **TypeScript** - 타입 안전성과 컴포넌트 기반 개발
- **Vite** - 빠른 개발 서버 및 빌드
- **Tailwind CSS** - 유틸리티 기반 스타일링

### 핵심 라이브러리
- **Recharts** - React 친화적인 그래프 라이브러리
- **KaTeX** - 빠른 수학 수식 렌더링
- **mathjs** - 수식 파싱 및 계산
- **Zustand** - 간단한 상태 관리

## ✨ 주요 기능

### 1. Dual Sync 기능
- 방정식 입력 시 실시간으로 그래프 업데이트
- 그래프 상호작용 시 방정식 매개변수 업데이트
- 양방향 동기화

### 2. 스마트폰 UI 시뮬레이션
- 우측 하단 고정 위치
- 실제 스마트폰 화면 비율 (9:16)
- 터치 인터랙션 지원

### 3. 문제 관리
- JSON 기반 문제 데이터
- 로컬 스토리지 지원
- 나중에 LMS 연동 확장 가능

## 📁 프로젝트 구조

```
dual-sync-app/
├── src/
│   ├── components/
│   │   ├── SmartphoneFrame.tsx      # 스마트폰 화면 프레임
│   │   ├── EquationInput.tsx        # 방정식 입력 컴포넌트
│   │   ├── GraphCanvas.tsx          # 그래프 렌더링
│   │   ├── EquationDisplay.tsx      # 수식 표시 (KaTeX)
│   │   └── ProblemSelector.tsx      # 문제 선택 UI
│   ├── hooks/
│   │   ├── useEquationParser.ts     # 방정식 파싱 로직
│   │   └── useDualSync.ts           # Dual Sync 로직
│   ├── store/
│   │   └── equationStore.ts         # 전역 상태 관리
│   ├── types/
│   │   └── equation.types.ts        # TypeScript 타입 정의
│   ├── data/
│   │   └── problems.json            # 샘플 문제 데이터
│   ├── utils/
│   │   ├── equationSolver.ts        # 방정식 계산
│   │   └── graphGenerator.ts        # 그래프 데이터 생성
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🚀 시작하기

```bash
cd dual-sync-app
npm install
npm run dev
```

## 📊 지원하는 방정식 타입

1. **1차 함수**: y = ax + b
2. **2차 함수**: y = ax² + bx + c
3. **원**: (x-h)² + (y-k)² = r²
4. **삼각함수**: y = a·sin(bx + c) + d
5. **지수함수**: y = a·e^(bx) + c
6. **로그함수**: y = a·log(bx) + c

## 🎨 UI/UX 특징

- 반응형 디자인
- 다크모드 지원
- 애니메이션 트랜지션
- 터치/마우스 드래그 지원
- 확대/축소/팬 기능

## 🔮 향후 확장 계획

- Moodle LMS 연동 API
- 다중 그래프 오버레이
- 학습 진도 추적
- 서버 연동 (PHP/MySQL)
