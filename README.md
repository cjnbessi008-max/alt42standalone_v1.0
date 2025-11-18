# 🔢 Base Switch - 진법 변환 학습 시스템

독립형 웹앱으로 진법 변환(Base Conversion) 과정을 단계별 애니메이션으로 시각화하여 학습할 수 있는 교육용 시스템입니다.

## 📱 주요 기능

- **가상 스마트폰 시뮬레이터**: 우측 하단에 실제 스마트폰과 유사한 UI 제공
- **Base Switch 애니메이션**: 진법 변환 과정을 단계별로 애니메이션 표시
  - 2진수 (Binary)
  - 10진수 (Decimal)
  - 16진수 (Hexadecimal)
- **Moodle LMS 연동**: 문제 데이터를 Moodle에서 가져오기
- **단계별 설명**: 각 변환 단계마다 수식과 계산 과정 표시
- **인터랙티브 컨트롤**: 재생, 일시정지, 단계 이동 등

## 🛠️ 기술 스택

### Frontend
- **React 18+** with TypeScript
- **Vite** - 빠른 개발 환경
- **Framer Motion** - 부드러운 애니메이션

### Backend 연동 (Moodle)
- **MySQL 5.7**
- **PHP 7.1.9**
- **Moodle 3.7**

## 🚀 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 의존성 설치
cd frontend
npm install
```

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 Moodle API URL을 설정합니다:

```env
VITE_MOODLE_API_URL=http://your-moodle-server.com/api
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

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── SmartphoneSimulator.tsx      # 스마트폰 시뮬레이터
│   │   ├── BaseSwitchAnimation.tsx      # 진법 변환 애니메이션
│   │   └── ProblemSelector.tsx          # 문제 선택 UI
│   ├── services/            # API 서비스
│   │   └── moodleApi.ts                 # Moodle 연동
│   ├── types/               # TypeScript 타입 정의
│   │   └── index.ts
│   ├── utils/               # 유틸리티 함수
│   │   └── baseConversion.ts            # 진법 변환 로직
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🎯 사용 방법

1. **문제 선택**: 좌측 패널에서 진법 변환 문제를 선택합니다
2. **애니메이션 시작**: "애니메이션 시작" 버튼을 클릭합니다
3. **학습**: 우측 하단 스마트폰 화면에서 단계별 변환 과정을 확인합니다
4. **컨트롤**:
   - ▶️ 재생/일시정지
   - ◀️/▶️ 이전/다음 단계
   - ⏮️ 처음으로
   - 하단 점 클릭으로 특정 단계로 이동

## 🔌 Moodle API 연동

### API 엔드포인트

```typescript
// 문제 목록 가져오기
GET /api/problems
Response: { success: boolean, data: ProblemData[] }

// 특정 문제 가져오기
GET /api/problems/:id
Response: { success: boolean, data: ProblemData }

// 답안 제출
POST /api/submit
Body: { problemId, studentId, answer, timestamp }
Response: { success: boolean }
```

### 데이터 구조

```typescript
interface ProblemData {
  id: string;
  question: string;
  sourceValue: string;
  sourceBase: 2 | 10 | 16;
  targetBase: 2 | 10 | 16;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

## 🧪 샘플 데이터

Moodle 서버가 없는 경우, 앱은 자동으로 샘플 데이터를 사용합니다:

- 2진수 → 10진수 변환
- 10진수 → 16진수 변환
- 16진수 → 2진수 변환
- 등 5개의 샘플 문제

## 🎨 커스터마이징

### 애니메이션 속도 조정

`App.tsx`에서 `speed` 속성을 변경합니다:

```tsx
<BaseSwitchAnimation
  speed={2000}  // 밀리초 (기본값: 2000ms = 2초)
  ...
/>
```

### 스마트폰 위치 변경

```tsx
<SmartphoneSimulator position="bottom-right">  // 또는 "bottom-left", "center"
```

## 📄 라이선스

This project is part of KAIST Touch Math Academy.

## 👥 기여

이 프로젝트는 AI Education System Pipeline의 일부입니다.

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.
