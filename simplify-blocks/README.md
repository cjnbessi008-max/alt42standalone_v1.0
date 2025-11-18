# Simplify Blocks

로그식 단순화를 블록 시각화로 학습하는 교육용 웹 애플리케이션

## 주요 기능

- 📚 **로그식 단순화**: 다양한 로그 법칙을 적용하여 식을 단순화
- 🧱 **블록 시각화**: 각 단계를 블록 형태로 시각적 표현
- 📱 **스마트폰 시뮬레이터**: 우측 하단에 모바일 화면 미리보기
- 🎨 **애니메이션**: Framer Motion을 활용한 부드러운 블록 애니메이션
- 🎯 **샘플 문제**: 다양한 난이도의 예제 문제 제공

## 지원 로그 법칙

1. **곱셈 법칙**: `log(a*b) = log(a) + log(b)`
2. **나눗셈 법칙**: `log(a/b) = log(a) - log(b)`
3. **거듭제곱 법칙**: `log(a^n) = n*log(a)`
4. **계수 법칙**: `log(k*a) = log(k) + log(a)`

## 기술 스택

- **프론트엔드**: React 18 + TypeScript
- **빌드 도구**: Vite
- **애니메이션**: Framer Motion
- **수식 처리**: Math.js
- **스타일링**: CSS Modules

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속

### 빌드

```bash
npm run build
```

### 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
simplify-blocks/
├── src/
│   ├── components/        # React 컴포넌트
│   │   ├── Block.tsx      # 블록 컴포넌트
│   │   ├── PhoneSimulator.tsx  # 스마트폰 시뮬레이터
│   │   └── SimplifyBlocks.tsx  # 메인 컴포넌트
│   ├── types/             # TypeScript 타입 정의
│   ├── utils/             # 유틸리티 함수
│   │   └── logParser.ts   # 로그식 파싱 엔진
│   ├── App.tsx            # 앱 루트 컴포넌트
│   └── main.tsx           # 진입점
├── public/                # 정적 파일
└── index.html             # HTML 템플릿
```

## 사용 방법

1. **로그식 입력**: 입력란에 로그식 입력 (예: `log(a*b)`)
2. **단순화하기**: 버튼 클릭하여 단순화 시작
3. **단계 확인**: 각 단계를 블록으로 확인
4. **네비게이션**: 이전/다음 버튼으로 단계 이동

## LMS 연동 준비

현재는 독립형 웹앱이지만, 향후 Moodle LMS 연동을 위한 API 구조:

- RESTful API 엔드포인트 (예정)
- 문제 데이터 JSON 포맷 정의
- 학습자 진행 상황 추적

## 라이선스

MIT License
