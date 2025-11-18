# KAIST Frequency Fill Animation

도수분포표가 부드럽게 차오르는 애니메이션을 제공하는 인터랙티브 웹 애플리케이션입니다.

## 주요 기능

### 1. 부드러운 차오름 애니메이션
- 도수분포 막대가 아래에서 위로 부드럽게 차오르는 효과
- 커스터마이징 가능한 easing 함수 (cubic, elastic, bounce)
- 개별 막대의 순차적 애니메이션

### 2. LMS (Moodle) 연동
- Moodle 3.7 Web Service API 연동
- MySQL 5.7 데이터베이스 지원
- PHP 7.1.9 백엔드와 통신
- Mock 데이터 모드 (개발/테스트용)

### 3. 모바일 미리보기
- 우측 하단 가상 스마트폰 화면
- 반응형 디자인
- 실제 모바일 환경 시뮬레이션

### 4. 실시간 커스터마이징
- 애니메이션 지속 시간 조절
- 막대 간 지연 시간 조절
- 색상 및 스타일 커스터마이징

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: CSS3 (Animations, Gradients, Transitions)
- **LMS Integration**: Moodle 3.7 Web Services
- **Database**: MySQL 5.7
- **Backend**: PHP 7.1.9

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 수정:

```env
# LMS (Moodle) Configuration
REACT_APP_MOODLE_URL=http://your-moodle-url.com
REACT_APP_MOODLE_TOKEN=your_webservice_token

# Development Mode (Mock 데이터 사용)
REACT_APP_USE_MOCK_LMS=true
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── Charts/
│   │   │   ├── FrequencyBar.tsx          # 개별 막대 컴포넌트
│   │   │   └── FrequencyChart.tsx        # 차트 컨테이너
│   │   └── MobilePreview/
│   │       ├── MobileFrame.tsx           # 스마트폰 프레임
│   │       └── MobileApp.tsx             # 앱 화면
│   ├── hooks/
│   │   └── useFrequencyAnimation.ts      # 애니메이션 훅
│   ├── services/
│   │   └── lmsService.ts                 # LMS 연동 서비스
│   ├── utils/
│   │   └── chartDataProcessing.ts        # 데이터 처리 유틸
│   ├── types/
│   │   └── frequency.ts                  # 타입 정의
│   ├── styles/
│   │   └── animations/
│   │       └── frequency-fill.css        # 애니메이션 스타일
│   └── pages/
│       └── FrequencyFillDemo.tsx         # 데모 페이지
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 사용 방법

### 기본 사용법

```tsx
import FrequencyChart from './components/Charts/FrequencyChart';

const data = [
  { label: '0-10', value: 5 },
  { label: '10-20', value: 12 },
  { label: '20-30', value: 18 },
];

function App() {
  return (
    <FrequencyChart
      data={data}
      animationDuration={1500}
      animationDelay={200}
      height={300}
      barWidth={60}
    />
  );
}
```

### LMS 연동

```tsx
import { getLMSService } from './services/lmsService';

// Mock 모드
const lmsService = getLMSService(true);

// 실제 Moodle 연동
const lmsService = getLMSService(false);

// 문제 데이터 가져오기
const problemData = await lmsService.fetchProblemData('problem-001');

// 답안 제출
await lmsService.submitAnswer('problem-001', { answer: 'data' });
```

### 커스텀 애니메이션

```tsx
import { useFrequencyAnimation, easeOutElastic } from './hooks/useFrequencyAnimation';

const { currentValue, percentage } = useFrequencyAnimation({
  targetValue: 100,
  maxValue: 100,
  duration: 2000,
  delay: 500,
  easing: easeOutElastic,
});
```

## Moodle 연동 설정

### 1. Moodle Web Service 활성화

1. 관리자 계정으로 로그인
2. `사이트 관리` > `플러그인` > `웹 서비스` > `개요`
3. 웹 서비스 활성화

### 2. 커스텀 Web Service 함수 생성

`local/kaist/` 플러그인에 다음 함수 구현:

- `local_kaist_get_problem_data`: 문제 데이터 조회
- `local_kaist_submit_answer`: 답안 제출

### 3. 토큰 생성

1. `사이트 관리` > `플러그인` > `웹 서비스` > `토큰 관리`
2. 새 토큰 생성
3. `.env` 파일에 토큰 설정

## API 명세

### LMS 데이터 형식

```typescript
interface LMSProblemData {
  problemId: string;
  problemType: string;
  frequencyData: FrequencyData[];
  metadata?: {
    title: string;
    description: string;
    createdAt?: number;
    updatedAt?: number;
  };
}

interface FrequencyData {
  label: string;        // 계급 (예: "0-10")
  value: number;        // 도수
  color?: string;       // 막대 색상
}
```

## 애니메이션 커스터마이징

### Easing 함수

- `easeOutCubic`: 부드러운 감속 (기본값, 추천)
- `easeInOutCubic`: 가속 후 감속
- `easeOutElastic`: 탄성 효과
- `easeOutBounce`: 바운스 효과

### CSS 변수

```css
:root {
  --bar-color-1: #4CAF50;
  --bar-color-2: #2196F3;
  --bar-color-3: #FF9800;
  /* ... */
}
```

## 브라우저 호환성

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 라이선스

KAIST Touch Math Academy

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
