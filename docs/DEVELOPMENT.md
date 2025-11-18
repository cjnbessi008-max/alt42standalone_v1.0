# 개발자 가이드

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/                      # Frontend 소스 코드
│   ├── components/           # React 컴포넌트
│   │   ├── LightInterval.tsx      # 빛 시각화 컴포넌트
│   │   ├── PhoneSimulator.tsx     # 스마트폰 UI 시뮬레이터
│   │   └── InequalityInput.tsx    # 부등식 입력 폼
│   ├── store/                # Zustand 상태 관리
│   │   └── useStore.ts
│   ├── types/                # TypeScript 타입 정의
│   │   └── index.ts
│   ├── utils/                # 유틸리티 함수
│   │   └── inequalityParser.ts    # 부등식 파서
│   ├── App.tsx               # 메인 앱 컴포넌트
│   └── main.tsx              # 진입점
├── backend/                  # Backend API 서버
│   └── src/
│       ├── config/           # 설정 파일
│       │   └── database.ts
│       ├── models/           # 데이터 모델
│       │   └── Problem.ts
│       ├── routes/           # API 라우트
│       │   ├── problems.ts
│       │   └── moodle.ts
│       ├── services/         # 비즈니스 로직
│       │   └── moodleService.ts
│       └── index.ts          # 서버 진입점
├── database/                 # 데이터베이스
│   ├── schema.sql            # MySQL 스키마
│   └── README.md
├── docs/                     # 문서
│   ├── API.md
│   └── DEVELOPMENT.md
└── README.md
```

## 개발 환경 설정

### 1. 필수 요구사항

- Node.js 18 이상
- MySQL 5.7 이상
- npm 또는 yarn

### 2. 프로젝트 클론 및 설치

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# Frontend 의존성 설치
npm install

# Backend 의존성 설치
cd backend
npm install
cd ..
```

### 3. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 스키마 생성
source database/schema.sql
```

### 4. 환경 변수 설정

`backend/.env` 파일 생성:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=light_interval

MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_moodle_token

CORS_ORIGIN=http://localhost:5173
```

### 5. 개발 서버 실행

터미널 1 (Backend):
```bash
cd backend
npm run dev
```

터미널 2 (Frontend):
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 주요 기능 구현 가이드

### 부등식 파서 확장

`src/utils/inequalityParser.ts`에서 새로운 부등식 형식을 지원하려면:

```typescript
// 새로운 패턴 추가
const newPattern = /your-regex-here/;
const match = cleaned.match(newPattern);

if (match) {
  // 파싱 로직 구현
  return {
    id: crypto.randomUUID(),
    expression,
    type: 'your_type',
    // ... 나머지 필드
  };
}
```

### 시각화 커스터마이징

`src/components/LightInterval.tsx`에서 시각화를 수정할 수 있습니다:

```typescript
// 빛의 색상 변경
const color = hexToRgb(lightColor);

// 글로우 효과 조절
ctx.shadowBlur = 20 * intensity; // 값 조절

// 경계점 스타일 변경
function drawBoundaryPoint(ctx, x, y, included, color) {
  // 커스텀 그리기 로직
}
```

### 새로운 API 엔드포인트 추가

1. 라우트 파일 생성 또는 수정:

```typescript
// backend/src/routes/your-route.ts
import { Router } from 'express';

const router = Router();

router.get('/your-endpoint', async (req, res) => {
  // 로직 구현
  res.json({ success: true, data: ... });
});

export default router;
```

2. `backend/src/index.ts`에 라우트 등록:

```typescript
import yourRouter from './routes/your-route';
app.use('/api/your-path', yourRouter);
```

### Moodle 연동 커스터마이징

`backend/src/services/moodleService.ts`에서 Moodle API 호출을 수정할 수 있습니다:

```typescript
// 커스텀 API 호출
async customMoodleCall(params: any) {
  return await this.callApi('your_ws_function', params);
}

// 부등식 파싱 로직 수정
parseInequality(question: MoodleQuestion): string | null {
  // 프로젝트 요구사항에 맞게 수정
}
```

## 테스트

### Frontend 테스트

```bash
npm run test
```

### Backend 테스트

```bash
cd backend
npm run test
```

### API 테스트 (수동)

```bash
# 헬스 체크
curl http://localhost:3001/health

# 문제 목록 조회
curl http://localhost:3001/api/problems

# 새 문제 생성
curl -X POST http://localhost:3001/api/problems \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트","description":"설명","inequality":"x > 5","difficulty_level":2}'
```

## 빌드 및 배포

### Frontend 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### Backend 빌드

```bash
cd backend
npm run build
```

빌드된 파일은 `backend/dist/` 디렉토리에 생성됩니다.

### 프로덕션 실행

```bash
# Backend
cd backend
npm start

# Frontend (정적 파일 서빙)
npx serve -s dist -l 5173
```

## 코딩 스타일 가이드

### TypeScript

- 항상 명시적 타입 사용
- `any` 타입 최소화
- interface 또는 type alias 사용

### React 컴포넌트

- 함수형 컴포넌트 사용
- Props는 interface로 정의
- 상태 관리는 Zustand 사용

```typescript
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return <div>{title}</div>;
};
```

### API 라우트

- RESTful 원칙 준수
- 에러 핸들링 필수
- 입력 유효성 검사 (express-validator 사용)

```typescript
router.post(
  '/endpoint',
  [
    body('field').notEmpty().withMessage('Field is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 로직
  }
);
```

## 디버깅

### Frontend 디버깅

- React DevTools 사용
- Zustand DevTools 활성화
- Console.log 활용

### Backend 디버깅

```bash
# 디버그 모드로 실행
DEBUG=* npm run dev
```

### 데이터베이스 디버깅

```sql
-- 쿼리 로그 확인
SHOW PROCESSLIST;

-- 느린 쿼리 분석
EXPLAIN SELECT ...;
```

## 성능 최적화

### Frontend

- React.memo로 불필요한 리렌더링 방지
- useMemo, useCallback 활용
- 이미지 최적화
- 코드 스플리팅

### Backend

- 데이터베이스 인덱스 최적화
- 쿼리 최적화
- 캐싱 (Redis)
- 연결 풀 설정

## 문제 해결

### 포트 충돌

```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3001
lsof -i :5173

# 프로세스 종료
kill -9 <PID>
```

### 데이터베이스 연결 실패

1. MySQL 서비스 확인
2. `.env` 파일의 DB 정보 확인
3. 방화벽 설정 확인

### Moodle 연동 문제

1. Moodle 토큰 유효성 확인
2. Web Service 활성화 확인
3. API 엔드포인트 URL 확인

## 기여 가이드

1. 이슈 생성
2. 브랜치 생성 (`feature/your-feature`)
3. 커밋 (`git commit -m "Add: your feature"`)
4. 푸시 (`git push origin feature/your-feature`)
5. Pull Request 생성

## 라이선스

MIT License

## 연락처

KAIST Touch Math Academy
