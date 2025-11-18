# Alt42 Standalone v1.0 - Dot Expansion Feature

**경우의 수 시각화 시스템** - Moodle LMS 연동 교육용 웹 애플리케이션

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Moodle](https://img.shields.io/badge/Moodle-3.7-orange)](https://moodle.org/)
[![License](https://img.shields.io/badge/License-KAIST-green)](LICENSE)

## 🎯 프로젝트 소개

KAIST Touch Math Academy의 AI Education System Pipeline의 일환으로 개발된 Dot Expansion 시각화 시스템입니다. Moodle LMS(3.7)와 연동하여 수학 문제의 경우의 수를 직관적으로 시각화하고, 학생들의 이해를 돕는 인터랙티브한 학습 경험을 제공합니다.

### 핵심 기능

- **🔵 Dot Expansion**: 경우의 수에 따라 동적으로 증가하는 빛점 시각화
- **📱 가상 스마트폰**: 우측 하단에 실시간 모바일 미리보기
- **🔗 Moodle 연동**: LMS와 완벽하게 통합된 문제 관리
- **🎨 다양한 패턴**: 5가지 시각화 패턴 (Grid, Circle, Pyramid, Tree, Scatter)
- **✨ 애니메이션**: Framer Motion 기반 부드러운 전환 효과

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                    # React 프론트엔드 애플리케이션
│   ├── src/
│   │   ├── components/
│   │   │   ├── DotExpansion/   # Dot Expansion 시각화 컴포넌트
│   │   │   └── VirtualPhone/   # 가상 스마트폰 디스플레이
│   │   ├── pages/
│   │   │   └── DemoPage.tsx    # 메인 데모 페이지
│   │   ├── services/
│   │   │   └── moodleApi.ts    # Moodle API 통합
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript 타입 정의
│   │   └── App.tsx             # 루트 컴포넌트
│   ├── package.json
│   └── README.md               # 프론트엔드 상세 문서
│
├── tasks/                       # 프로젝트 태스크 및 문서
│   └── 0001-prd-ai-education-pipeline.md
│
└── README.md                    # 이 파일
```

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Git

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 프론트엔드 설치
cd frontend
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 프로덕션 빌드

```bash
cd frontend
npm run build

# 빌드 파일은 frontend/dist 디렉토리에 생성됩니다
```

## 🎮 사용 방법

### 1. Demo 페이지 접속

개발 서버 실행 후 브라우저에서 데모 페이지가 자동으로 표시됩니다.

### 2. 문제 불러오기

- "다른 문제 불러오기" 버튼을 클릭하여 샘플 문제를 로드합니다
- Mock 데이터로 5가지 조합/확률 문제를 제공합니다

### 3. 시각화 조정

좌측 패널에서 다음 설정을 조정할 수 있습니다:

- **점 개수**: 1~100 사이 슬라이더로 조절
- **패턴**: Grid, Circle, Pyramid, Tree, Scatter 중 선택
- **색상**: Primary, Secondary, Success, Warning, Error
- **애니메이션**: 켜기/끄기
- **빛 효과**: 켜기/끄기

### 4. 문제와 동기화

"문제와 동기화" 버튼을 클릭하면 현재 문제의 경우의 수만큼 점이 자동으로 설정됩니다.

### 5. 모바일 미리보기

우측 하단의 가상 스마트폰 화면에서 모바일 버전을 실시간으로 확인할 수 있습니다.

## 🛠️ 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18 | UI 프레임워크 |
| TypeScript | 5 | 타입 안전성 |
| Vite | 7 | 빌드 도구 |
| Material-UI | 7 | UI 컴포넌트 라이브러리 |
| Framer Motion | 12 | 애니메이션 |
| Axios | 1.8 | HTTP 클라이언트 |

### Backend (Moodle Integration)

| 기술 | 버전 | 용도 |
|------|------|------|
| Moodle | 3.7 | LMS 플랫폼 |
| PHP | 7.1.9 | 백엔드 언어 |
| MySQL | 5.7 | 데이터베이스 |

## 📊 샘플 데이터

시스템은 다음과 같은 샘플 문제를 제공합니다:

1. **주사위 문제**: 주사위 2개를 던질 때 나올 수 있는 경우의 수 (36)
2. **동전 문제**: 동전 3개를 던질 때 나올 수 있는 경우의 수 (8)
3. **조합 문제**: 4명 중 2명을 선발하는 경우의 수 (6)
4. **순열 문제**: 1부터 5까지 숫자 중 3개를 뽑아 만들 수 있는 세 자리 수 (60)
5. **배열 문제**: A, B, C, D 4명이 일렬로 서는 경우의 수 (24)

## 🔌 Moodle API 연동

### API 엔드포인트

```
GET  /api/problems/{problemId}              - 문제 조회
GET  /api/problems                          - 문제 목록 조회
POST /api/problems/{problemId}/submit       - 답안 제출
```

### 연동 설정

`frontend/src/services/moodleApi.ts` 파일에서 Moodle 서버 정보를 설정합니다:

```typescript
const moodleApi = new MoodleApiService(
  'https://your-moodle-server.com/webservice',
  'YOUR_MOODLE_TOKEN'
);
```

현재는 개발 편의를 위해 Mock 데이터를 사용합니다.

## 🎨 커스터마이징

### 테마 변경

`frontend/src/App.tsx`:

```typescript
const theme = createTheme({
  palette: {
    mode: 'light', // 'dark'로 변경 가능
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  }
});
```

### Dot 설정

`frontend/src/components/DotExpansion/DotExpansion.tsx`:

```typescript
const DEFAULT_CONFIG = {
  size: 20,              // 점 크기 (px)
  spacing: 8,            // 점 간격 (px)
  color: 'primary',
  glowEffect: true,
  animationDuration: 300 // ms
};
```

## 🚢 배포

### Vercel 배포

```bash
cd frontend
npm install -g vercel
vercel
```

### Docker 배포

```bash
cd frontend
docker build -t alt42-dot-expansion .
docker run -p 5173:5173 alt42-dot-expansion
```

## 📖 문서

- [Frontend 상세 문서](frontend/README.md)
- [PRD - AI Education Pipeline](tasks/0001-prd-ai-education-pipeline.md)

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy의 AI Education System Pipeline의 일부입니다.

### 개발 브랜치

- **메인 브랜치**: `main`
- **기능 브랜치**: `claude/dot-expansion-feature-01NDRSDJ6b6SXrVKgCgw6Y7g`

## 📝 라이선스

KAIST Touch Math Academy - AI Education System Pipeline

## 📞 문의

문제가 있거나 제안 사항이 있으시면 이슈를 등록해주세요.

---

Built with ❤️ by KAIST Touch Math Academy
