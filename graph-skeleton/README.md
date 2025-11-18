# Graph Skeleton Visualizer

함수의 그래프 뼈대(증가/감소, 극값, 변곡점)를 자동으로 분석하고 시각화하는 웹 애플리케이션입니다.

## 주요 기능

- 📊 **함수 그래프 시각화**: 입력한 함수를 실시간으로 그래프로 표시
- 📈 **증가/감소 구간 분석**: 1차 미분을 통한 증가/감소 구간 자동 탐지
- 🎯 **극값 찾기**: 극대값과 극소값 자동 계산 및 표시
- 🔄 **변곡점 탐지**: 2차 미분을 통한 변곡점 자동 계산
- 📱 **모바일 시뮬레이터**: 우측 하단에 가상 스마트폰 화면으로 결과 표시
- 🎨 **색상 코딩**: 각 요소별 직관적인 색상 구분

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **그래프 시각화**: Recharts
- **수학 엔진**: Math.js (함수 파싱, 미분 계산)
- **스타일링**: Tailwind CSS
- **빌드 도구**: Vite

## 설치 및 실행

### 1. 의존성 설치

```bash
cd graph-skeleton
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 3. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 사용 방법

### 함수 입력

1. **함수 입력란**에 분석하고자 하는 함수를 입력합니다.
   - 예: `x^2 - 4*x + 3`
   - 지원 연산자: `+`, `-`, `*`, `/`, `^` (거듭제곱)
   - 지원 함수: `sin()`, `cos()`, `tan()`, `sqrt()`, `exp()`, `ln()`
   - 상수: `e`, `pi`

2. **정의역 설정**: x의 최소값과 최대값을 설정합니다.

3. **그래프 분석 시작** 버튼을 클릭합니다.

### 예제 함수

애플리케이션에서 제공하는 예제 함수들:

- 이차함수: `x^2 - 4*x + 3`
- 삼차함수: `x^3 - 6*x^2 + 9*x + 1`
- 사차함수: `x^4 - 4*x^3 + 4*x^2`
- 삼각함수: `sin(x) + cos(x)`
- 지수함수: `e^(-x^2/4)`

## 프로젝트 구조

```
graph-skeleton/
├── src/
│   ├── components/
│   │   ├── FunctionInput.tsx      # 함수 입력 컴포넌트
│   │   ├── GraphCanvas.tsx        # 그래프 시각화 컴포넌트
│   │   ├── AnalysisResults.tsx    # 분석 결과 표시 컴포넌트
│   │   └── MobileSimulator.tsx    # 모바일 시뮬레이터 컴포넌트
│   ├── utils/
│   │   ├── types.ts               # TypeScript 타입 정의
│   │   ├── mathEngine.ts          # 수학 함수 파싱 및 계산 엔진
│   │   └── graphAnalyzer.ts       # 그래프 분석 로직
│   ├── styles/
│   │   └── index.css              # 전역 스타일
│   ├── App.tsx                    # 메인 앱 컴포넌트
│   └── main.tsx                   # 엔트리 포인트
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## 알고리즘 설명

### 1. 미분 계산
- Math.js의 심볼릭 미분 기능을 사용하여 1차 및 2차 도함수를 자동 계산

### 2. 극값 찾기
- 1차 도함수 f'(x) = 0인 점을 Newton-Raphson 방법으로 탐색
- 2차 도함수 f''(x)의 부호로 극대/극소 판별:
  - f''(x) > 0: 극소
  - f''(x) < 0: 극대

### 3. 변곡점 찾기
- 2차 도함수 f''(x) = 0인 점을 Newton-Raphson 방법으로 탐색

### 4. 증가/감소 구간
- 1차 도함수의 부호 변화를 추적하여 구간 결정:
  - f'(x) > 0: 증가 구간
  - f'(x) < 0: 감소 구간

## Moodle/LMS 연동 (향후 계획)

이 웹앱은 독립형으로 설계되었으나, 다음과 같은 방식으로 LMS와 연동 가능합니다:

1. **iframe 임베딩**: Moodle 페이지에 iframe으로 삽입
2. **API 연동**: REST API를 통한 문제 정보 교환
3. **LTI 통합**: LTI(Learning Tools Interoperability) 표준 구현

## 라이선스

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

## 기여

이슈나 개선 사항이 있으시면 GitHub Issues를 통해 제안해 주세요.
