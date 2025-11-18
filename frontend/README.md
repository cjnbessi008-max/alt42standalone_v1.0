# Alt42 Standalone - Dot Expansion Feature

**경우의 수 시각화 시스템** - Moodle LMS 연동 웹앱

## 📱 프로젝트 개요

Moodle LMS(3.7)와 연동하여 수학 문제의 경우의 수를 시각적으로 표현하는 교육용 웹 애플리케이션입니다.
우측 하단 가상 스마트폰 화면에 앱이 표시되며, "Dot Expansion" 기능을 통해 경우의 수가 증가할 때마다 빛점이 늘어나는 인터랙티브한 시각화를 제공합니다.

## 🎯 주요 기능

### 1. **Dot Expansion 시각화**
- 경우의 수에 따라 동적으로 증가하는 빛점 표시
- 5가지 패턴 지원:
  - 그리드 (Grid): 행렬 형태 배치
  - 원형 (Circle): 동심원 형태 배치
  - 피라미드 (Pyramid): 삼각형 형태 배치
  - 트리 (Tree): 이진 트리 구조 배치
  - 분산 (Scatter): 무작위 분산 배치
- 부드러운 애니메이션 효과 (Framer Motion)
- 빛 효과 (Glow Effect) 옵션
- 인터랙티브 클릭 이벤트

### 2. **가상 스마트폰 화면**
- 우측 하단에 고정된 가상 스마트폰 디스플레이
- iPhone/Android 스타일 선택 가능
- 반응형 디자인으로 실제 모바일 환경 시뮬레이션
- 크기 조절 가능 (scale)

### 3. **Moodle LMS 연동**
- Moodle 3.7 호환
- PHP 7.1.9 / MySQL 5.7 기반 백엔드 연동 준비
- RESTful API를 통한 문제 데이터 fetch
- 학생 응답 제출 및 피드백 기능

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **Framer Motion** - 애니메이션
- **Axios** - HTTP 클라이언트

### Backend (Moodle Integration)
- **Moodle 3.7**
- **PHP 7.1.9**
- **MySQL 5.7**

## 📦 설치 및 실행

### 사전 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 📂 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── DotExpansion/        # Dot Expansion 시각화 컴포넌트
│   │   │   ├── DotExpansion.tsx
│   │   │   └── index.ts
│   │   └── VirtualPhone/        # 가상 스마트폰 디스플레이
│   │       ├── VirtualPhone.tsx
│   │       └── index.ts
│   ├── pages/
│   │   └── DemoPage.tsx         # 메인 데모 페이지
│   ├── services/
│   │   └── moodleApi.ts         # Moodle API 연동 서비스
│   ├── types/
│   │   └── index.ts             # TypeScript 타입 정의
│   ├── App.tsx                  # 루트 컴포넌트
│   └── main.tsx                 # 엔트리 포인트
├── package.json
└── vite.config.ts
```

## 🎮 사용 방법

### 1. 문제 불러오기
- "다른 문제 불러오기" 버튼을 클릭하여 Moodle에서 문제 데이터를 가져옵니다
- Mock 데이터로 5개의 샘플 문제를 제공합니다

### 2. 시각화 설정
- **점 개수**: 슬라이더로 1~100 사이 조절
- **패턴**: 드롭다운에서 5가지 패턴 선택
- **색상**: Primary, Secondary, Success, Warning, Error 중 선택
- **애니메이션**: ON/OFF 토글
- **빛 효과**: ON/OFF 토글

### 3. 문제와 동기화
- "문제와 동기화" 버튼을 클릭하면 현재 문제의 경우의 수만큼 점이 자동으로 설정됩니다

### 4. 모바일 미리보기
- 우측 하단의 가상 스마트폰 화면에서 모바일 버전을 실시간으로 확인할 수 있습니다

## 🔌 Moodle API 연동

### API 엔드포인트

```typescript
// 문제 조회
GET /api/problems/{problemId}

// 문제 목록 조회
GET /api/problems?category=combination&difficulty=2&limit=10

// 답안 제출
POST /api/problems/{problemId}/submit
Body: { answer: 36 }
```

### 설정

`src/services/moodleApi.ts` 파일에서 Moodle 서버 설정:

```typescript
const moodleApi = new MoodleApiService(
  'https://your-moodle-server.com/webservice',
  'YOUR_MOODLE_TOKEN'
);
```

현재는 `useMockData: true`로 설정되어 Mock 데이터를 사용합니다.

## 🎨 커스터마이징

### 테마 변경

`src/App.tsx`에서 Material-UI 테마 수정:

```typescript
const theme = createTheme({
  palette: {
    mode: 'light', // 'dark'로 변경 가능
    primary: {
      main: '#1976d2', // 원하는 색상으로 변경
    },
  },
});
```

### Dot 설정

`src/components/DotExpansion/DotExpansion.tsx`의 `DEFAULT_CONFIG`:

```typescript
const DEFAULT_CONFIG = {
  size: 20,        // 점 크기 (px)
  spacing: 8,      // 점 간격 (px)
  color: 'primary',
  glowEffect: true,
  animationDuration: 300  // 애니메이션 시간 (ms)
};
```

## 📊 Mock 데이터 예시

시스템은 다음과 같은 샘플 문제를 제공합니다:

1. 주사위 2개를 던질 때 나올 수 있는 경우의 수 (36)
2. 동전 3개를 던질 때 나올 수 있는 경우의 수 (8)
3. 4명 중 2명을 선발하는 경우의 수 (6)
4. 1부터 5까지 숫자 중 3개를 뽑아 만들 수 있는 세 자리 수 (60)
5. A, B, C, D 4명이 일렬로 서는 경우의 수 (24)

## 🚀 배포

### Vercel 배포

```bash
npm install -g vercel
vercel
```

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

## 📝 라이선스

KAIST Touch Math Academy - AI Education System Pipeline

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 파이프라인의 일부입니다.

## 📞 문의

문제가 있거나 제안 사항이 있으시면 이슈를 등록해주세요.
