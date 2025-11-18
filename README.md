# Vector Motion - LMS Integration

벡터가 화살표로 부드럽게 움직이는 'Vector Motion' 애니메이션을 제공하는 웹앱입니다. Moodle LMS와 연동하여 문제 정보를 받아서 동작하며, 우측 하단 가상 스마트폰 화면에 앱이 표시됩니다.

## 기술 스택

### Frontend
- **React**: 18.2.0
- **TypeScript**: 5.2.2
- **Vite**: 5.0.0
- **Axios**: 1.6.0

### Backend (예정)
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7

## 주요 기능

### 1. 벡터 애니메이션
- SVG 기반의 부드러운 화살표 애니메이션
- 커스터마이징 가능한 색상, 두께, 속도
- 여러 easing 함수 지원 (linear, cubic, elastic 등)
- 벡터 덧셈, 분해, 궤적 시각화

### 2. LMS 연동
- Moodle 3.7 Web Service API 통합
- 문제 정보 자동 수신
- 답안 제출 및 자동 채점
- 학습 진도 추적

### 3. 가상 스마트폰 UI
- 실제 스마트폰과 유사한 UI/UX
- 반응형 디자인
- 터치 이벤트 지원
- 애니메이션 효과

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── animations/
│   │   │   │   ├── VectorArrow.tsx       # 화살표 애니메이션 컴포넌트
│   │   │   │   └── VectorField.tsx       # 벡터 필드 컴포넌트
│   │   │   ├── VirtualPhone.tsx          # 가상 스마트폰 컴포넌트
│   │   │   └── VirtualPhone.css
│   │   ├── hooks/
│   │   │   └── useVectorAnimation.ts     # 벡터 애니메이션 훅
│   │   ├── utils/
│   │   │   └── vectorMath.ts             # 벡터 수학 유틸리티
│   │   ├── services/
│   │   │   └── lmsService.ts             # LMS API 서비스
│   │   ├── types/
│   │   │   └── vector.ts                 # 타입 정의
│   │   ├── styles/
│   │   │   └── animations.css            # 애니메이션 스타일
│   │   ├── pages/
│   │   │   ├── VectorMotionApp.tsx       # 메인 앱 페이지
│   │   │   └── VectorMotionApp.css
│   │   ├── App.tsx
│   │   ├── App.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
└── README.md
```

## 설치 및 실행

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Frontend 설치 및 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속하면 앱을 확인할 수 있습니다.

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 값을 입력합니다:

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_API_KEY=your_api_key_here
VITE_MOODLE_BASE_URL=http://your-moodle-instance.com
VITE_MOODLE_WS_TOKEN=your_moodle_token
```

## 사용 방법

### 1. 데모 모드

환경 변수 설정 없이 앱을 실행하면 자동으로 데모 문제가 표시됩니다.

### 2. LMS 연동 모드

URL 파라미터를 통해 특정 문제를 로드할 수 있습니다:

```
http://localhost:3000?problemId=123
http://localhost:3000?courseId=456
```

### 3. 커스텀 벡터 생성

```typescript
import { VectorField } from './components/animations/VectorField';

const vectors = [
  {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 150 },
    color: '#2563eb',
    label: 'Vector A',
    animated: true,
    duration: 1000,
  },
];

<VectorField vectors={vectors} width={400} height={400} />
```

## 컴포넌트 API

### VectorArrow

```typescript
interface VectorArrowProps {
  start: Vector2D;              // 시작 위치
  end: Vector2D;                // 끝 위치
  color?: string;               // 색상 (기본: '#2563eb')
  strokeWidth?: number;         // 두께 (기본: 2)
  duration?: number;            // 애니메이션 시간 (기본: 1000ms)
  delay?: number;               // 딜레이 (기본: 0ms)
  animated?: boolean;           // 애니메이션 활성화 (기본: true)
  arrowHeadSize?: number;       // 화살표 머리 크기 (기본: 10)
  label?: string;               // 라벨 텍스트
  onAnimationComplete?: () => void;  // 완료 콜백
}
```

### VectorField

```typescript
interface VectorFieldProps {
  vectors: VectorArrowProps[];  // 벡터 배열
  width: number;                // 캔버스 너비
  height: number;               // 캔버스 높이
  backgroundColor?: string;     // 배경색
  showGrid?: boolean;           // 격자 표시 (기본: true)
  gridSize?: number;            // 격자 간격 (기본: 50)
}
```

### VirtualPhone

```typescript
interface VirtualPhoneProps {
  children: React.ReactNode;    // 표시할 콘텐츠
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  width?: number;               // 너비 (기본: 375px)
  height?: number;              // 높이 (기본: 667px)
}
```

## 벡터 수학 함수

```typescript
import * as vectorMath from './utils/vectorMath';

// 벡터 크기
const mag = vectorMath.magnitude({ x: 3, y: 4 }); // 5

// 벡터 덧셈
const sum = vectorMath.add({ x: 1, y: 2 }, { x: 3, y: 4 }); // { x: 4, y: 6 }

// 벡터 정규화
const normalized = vectorMath.normalize({ x: 3, y: 4 }); // { x: 0.6, y: 0.8 }

// 선형 보간
const interpolated = vectorMath.lerp(
  { x: 0, y: 0 },
  { x: 100, y: 100 },
  0.5
); // { x: 50, y: 50 }

// Easing 함수
const eased = vectorMath.easing.easeOutCubic(0.5); // 0.875
```

## 애니메이션 커스텀 훅

```typescript
import { useVectorAnimation } from './hooks/useVectorAnimation';

const { animationState, play, pause, reset, restart } = useVectorAnimation({
  start: { x: 0, y: 0 },
  end: { x: 100, y: 100 },
  duration: 1000,
  easingFunction: easing.easeOutCubic,
  autoPlay: true,
  onComplete: () => console.log('Animation complete!'),
});

// animationState: { progress, isPlaying, currentPosition, currentRotation }
```

## LMS API 서비스

```typescript
import lmsService from './services/lmsService';

// 로그인
await lmsService.login('username', 'password');

// 문제 가져오기
const problems = await lmsService.getProblems('courseId');
const problem = await lmsService.getProblem('problemId');

// 새 문제 생성
const newProblem = await lmsService.requestNewProblem('courseId', 'vector-addition');

// 답안 제출
const result = await lmsService.submitAnswer('problemId', answer);

// 진도 확인
const progress = await lmsService.getProgress('studentId', 'courseId');
```

## 개발 계획

### Phase 1: Frontend (완료)
- ✅ React 앱 구조 설정
- ✅ 벡터 애니메이션 컴포넌트
- ✅ 가상 스마트폰 UI
- ✅ LMS API 서비스 인터페이스

### Phase 2: Backend (예정)
- ⬜ Node.js API Gateway 구현
- ⬜ Moodle Web Service 연동
- ⬜ MySQL 데이터베이스 스키마
- ⬜ 인증/인가 시스템

### Phase 3: Integration (예정)
- ⬜ 실제 Moodle 인스턴스와 연동
- ⬜ 문제 생성 자동화
- ⬜ 학습 분석 대시보드
- ⬜ 모바일 반응형 최적화

## 브라우저 지원

- Chrome/Edge (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- 모바일 브라우저 (iOS Safari, Chrome Mobile)

## 라이선스

MIT License

## 기여

프로젝트에 기여하고 싶으신 분은 Pull Request를 보내주세요.

## 문의

문제가 있거나 질문이 있으시면 Issue를 생성해주세요.
