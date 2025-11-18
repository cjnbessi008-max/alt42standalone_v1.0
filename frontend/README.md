# 안정 호흡 애니메이션 - LMS 연동 웹앱

LMS(Learning Management System)와 연동되는 안정 호흡 가이드 웹 애플리케이션입니다.

## 주요 기능

### 1. 호흡 애니메이션
- 시각적 원형 애니메이션으로 호흡 템포 안내
- 실시간 호흡 단계 표시 (들이마시기, 멈추기, 내쉬기)
- 사이클 카운터로 진행 상황 추적

### 2. 다양한 호흡 패턴
- **안정 호흡** (4-4-4-4): 긴장 완화와 스트레스 해소
- **활력 호흡** (4-7-8): 에너지 충전과 집중력 향상
- **빠른 안정** (3-3-3-3): 짧은 시간에 빠르게 안정
- **깊은 호흡** (6-6-6-6): 깊은 이완과 명상에 적합

### 3. LMS 연동
- 사용자 인증 지원
- 호흡 세션 활동 로그 자동 전송
- 진행 상황 추적 및 기록

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: CSS3 with animations
- **Type Safety**: TypeScript

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env` 파일을 생성하세요:

```bash
cp .env.example .env
```

환경 변수 설정:
```env
# LMS API 설정
VITE_LMS_API_URL=http://localhost:4000/api
VITE_LMS_API_KEY=your-api-key-here

# LMS 기능 활성화/비활성화
VITE_LMS_ENABLE_TRACKING=true
VITE_LMS_ENABLE_AUTH=false
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하세요.

### 4. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

### 5. 프로덕션 미리보기

```bash
npm run preview
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/          # React 컴포넌트
│   │   └── BreathingAnimation.tsx
│   ├── hooks/              # Custom hooks
│   │   └── useBreathingStore.ts
│   ├── services/           # 서비스 레이어
│   │   └── lmsService.ts
│   ├── types/              # TypeScript 타입 정의
│   │   ├── breathing.ts
│   │   └── lms.ts
│   ├── styles/             # CSS 스타일
│   │   ├── App.css
│   │   ├── BreathingAnimation.css
│   │   └── index.css
│   ├── App.tsx             # 메인 앱 컴포넌트
│   └── main.tsx            # 앱 엔트리 포인트
├── public/                 # 정적 파일
├── index.html              # HTML 템플릿
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 사용 방법

### 1. 호흡 패턴 선택
드롭다운 메뉴에서 원하는 호흡 패턴을 선택하세요.

### 2. 세션 시작
"시작하기" 버튼을 클릭하여 호흡 세션을 시작하세요.

### 3. 애니메이션 따라하기
화면의 원형 애니메이션과 텍스트 안내를 따라 호흡하세요:
- **파란색** (들이마시기): 원이 커지면 천천히 숨을 들이마시세요
- **초록색** (멈추기): 숨을 잠시 멈추세요
- **주황색** (내쉬기): 원이 작아지면 천천히 숨을 내쉬세요
- **보라색** (멈추기): 다시 숨을 잠시 멈추세요

### 4. 세션 종료
"중지하기" 버튼을 클릭하여 세션을 종료하세요. LMS 연동이 활성화되어 있으면 자동으로 활동 로그가 전송됩니다.

## LMS 연동 API

### 인증
```typescript
POST /api/auth/validate
{
  "userId": "string",
  "sessionToken": "string"
}
```

### 활동 로그 전송
```typescript
POST /api/activities/log
{
  "userId": "string",
  "courseId": "string",
  "activityType": "breathing_session",
  "data": {
    "pattern": "string",
    "duration": number,
    "cycles": number,
    "completed": boolean
  },
  "timestamp": "ISO 8601 date"
}
```

### 사용자 정보 조회
```typescript
GET /api/users/:userId
```

## 개발 모드

개발 모드에서는 LMS 인증과 트래킹 기능이 비활성화되어 있습니다.
실제 LMS와 연동하려면 `.env` 파일에서 다음 설정을 변경하세요:

```env
VITE_LMS_ENABLE_TRACKING=true
VITE_LMS_ENABLE_AUTH=true
```

## 브라우저 지원

- Chrome (최신)
- Firefox (최신)
- Safari (최신)
- Edge (최신)

## 라이선스

MIT License

## 기여

이슈와 풀 리퀘스트를 환영합니다!
