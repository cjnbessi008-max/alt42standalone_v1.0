# 개발자 가이드

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── FunctionBlock.tsx
│   │   │   ├── ComposedBlock.tsx
│   │   │   ├── CompositionArea.tsx
│   │   │   ├── Calculator.tsx
│   │   │   ├── SmartphoneSimulator.tsx
│   │   │   └── PuzzleGame.tsx
│   │   ├── store/           # Zustand 상태 관리
│   │   │   └── useStore.ts
│   │   ├── types/           # TypeScript 타입 정의
│   │   │   └── index.ts
│   │   ├── styles/          # CSS 스타일
│   │   │   └── index.css
│   │   ├── App.tsx          # 메인 앱
│   │   └── main.tsx         # 진입점
│   ├── public/              # 정적 파일
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                  # Node.js Express 백엔드
│   ├── src/
│   │   ├── config/          # 설정
│   │   │   └── database.ts
│   │   ├── routes/          # API 라우트
│   │   │   └── index.ts
│   │   ├── controllers/     # 컨트롤러
│   │   │   ├── problemController.ts
│   │   │   ├── attemptController.ts
│   │   │   └── ltiController.ts
│   │   ├── models/          # 데이터 모델
│   │   │   ├── Problem.ts
│   │   │   └── Attempt.ts
│   │   ├── middleware/      # 미들웨어
│   │   │   └── lti.ts
│   │   ├── types/           # TypeScript 타입
│   │   │   └── index.ts
│   │   └── index.ts         # 서버 진입점
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
├── database/                 # 데이터베이스
│   └── schema.sql
│
├── docker-compose.yml
├── .gitignore
├── README.md
├── SETUP.md
├── MOODLE_SETUP.md
└── DEVELOPMENT.md (이 파일)
```

---

## 🔧 기술 스택

### Frontend

- **React 18**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Vite**: 빠른 빌드 도구
- **Zustand**: 경량 상태 관리
- **React DnD**: 드래그 앤 드롭
- **TailwindCSS**: 유틸리티 기반 CSS
- **Axios**: HTTP 클라이언트

### Backend

- **Node.js 18+**: 런타임
- **Express**: 웹 프레임워크
- **TypeScript**: 타입 안전성
- **MySQL2**: 데이터베이스 드라이버
- **ims-lti**: LTI 1.1 라이브러리
- **jsonwebtoken**: JWT 인증
- **express-session**: 세션 관리

### Database

- **MySQL 5.7+**: 관계형 데이터베이스
- **JSON 필드**: 유연한 데이터 저장

### DevOps

- **Docker**: 컨테이너화
- **Docker Compose**: 멀티 컨테이너 관리
- **PM2**: 프로세스 관리 (선택)

---

## 🚀 개발 워크플로우

### 1. 로컬 개발 시작

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 백엔드 개발
cd backend
npm install
cp .env.example .env
# .env 수정
npm run dev

# 새 터미널에서 프론트엔드 개발
cd frontend
npm install
npm run dev
```

### 2. 핫 리로딩

- **Frontend**: Vite가 자동으로 핫 리로딩 제공
- **Backend**: tsx watch가 파일 변경 시 자동 재시작

### 3. 코드 스타일

- **Prettier** 사용 권장
- **ESLint** 설정 포함

---

## 📝 API 개발

### REST API 엔드포인트

#### 문제 (Problems)

```typescript
// 모든 문제 조회
GET /api/problems
Response: Problem[]

// 특정 문제 조회
GET /api/problems/:id
Response: Problem

// 문제 생성
POST /api/problems
Body: Omit<Problem, 'id'>
Response: Problem

// 문제 업데이트
PUT /api/problems/:id
Body: Partial<Problem>
Response: Problem

// 문제 삭제
DELETE /api/problems/:id
Response: 204 No Content
```

#### 시도 (Attempts)

```typescript
// 시도 조회
GET /api/attempts?studentId=xxx&problemId=1
Response: Attempt[]

// 답안 제출
POST /api/attempts
Body: {
  problemId: number;
  studentId: string;
  composition: CompositionBlock[];
  result: AttemptResult;
}
Response: Attempt

// 통계
GET /api/statistics?studentId=xxx&problemId=1
Response: {
  total_attempts: number;
  successful_attempts: number;
  average_score: number;
}
```

#### LTI

```typescript
// LTI 론치
POST /lti/launch
Body: LTI OAuth parameters
Response: Redirect to frontend

// LTI 설정 XML
GET /lti/config.xml
Response: XML configuration
```

### 새 API 추가하기

1. **타입 정의** (`backend/src/types/index.ts`):

```typescript
export interface NewFeature {
  id: number;
  name: string;
  // ...
}
```

2. **모델 생성** (`backend/src/models/NewFeature.ts`):

```typescript
export class NewFeatureModel {
  static async findAll(): Promise<NewFeature[]> {
    // ...
  }
  // ...
}
```

3. **컨트롤러 생성** (`backend/src/controllers/newFeatureController.ts`):

```typescript
export const newFeatureController = {
  async getAll(req: Request, res: Response) {
    // ...
  },
  // ...
};
```

4. **라우트 추가** (`backend/src/routes/index.ts`):

```typescript
router.get('/api/new-features', newFeatureController.getAll);
```

---

## 🎨 UI 컴포넌트 개발

### 새 컴포넌트 추가

1. **컴포넌트 파일 생성** (`frontend/src/components/NewComponent.tsx`):

```typescript
import { useState } from 'react';

interface NewComponentProps {
  title: string;
}

export const NewComponent = ({ title }: NewComponentProps) => {
  const [value, setValue] = useState('');

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2>{title}</h2>
      {/* ... */}
    </div>
  );
};
```

2. **스토어에 상태 추가** (`frontend/src/store/useStore.ts`):

```typescript
interface AppState {
  // 기존 상태
  newFeature: string | null;
}

interface StoreActions {
  setNewFeature: (value: string) => void;
}

// 스토어 구현
export const useStore = create<Store>((set) => ({
  newFeature: null,
  setNewFeature: (value) => set({ newFeature: value }),
}));
```

3. **컴포넌트 사용**:

```typescript
import { NewComponent } from './components/NewComponent';

function App() {
  return <NewComponent title="My Component" />;
}
```

---

## 🧪 테스팅

### Frontend 테스트 (예정)

```bash
cd frontend
npm test
```

### Backend 테스트 (예정)

```bash
cd backend
npm test
```

### API 테스트 (수동)

```bash
# Health check
curl http://localhost:3000/health

# 문제 조회
curl http://localhost:3000/api/problems

# 문제 생성
curl -X POST http://localhost:3000/api/problems \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test problem",...}'
```

---

## 🗄️ 데이터베이스

### 스키마 수정

1. `database/schema.sql` 수정

2. 마이그레이션 적용:

```bash
mysql -u root -p composition_puzzle < database/schema.sql
```

### 새 테이블 추가

```sql
CREATE TABLE IF NOT EXISTS new_table (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 데이터 조회

```sql
-- 모든 문제
SELECT * FROM problems;

-- 학생 시도 기록
SELECT * FROM student_attempts WHERE student_id = 'student123';

-- 통계
SELECT * FROM problem_statistics;
SELECT * FROM student_statistics;
```

---

## 🔍 디버깅

### Frontend 디버깅

1. **React DevTools** 사용

2. **Console 로그**:

```typescript
console.log('State:', useStore.getState());
```

3. **네트워크 탭** (F12):
   - API 요청/응답 확인

### Backend 디버깅

1. **로그 출력**:

```typescript
console.log('Request body:', req.body);
console.error('Error:', error);
```

2. **VS Code 디버거**:

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/backend",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### 데이터베이스 디버깅

```bash
# MySQL 로그 확인
tail -f /var/log/mysql/error.log

# 쿼리 로그 활성화
mysql -u root -p
SET GLOBAL general_log = 'ON';
```

---

## 🚢 배포

### 개발 환경

```bash
docker-compose up -d mysql backend frontend-dev
```

### 프로덕션 환경

```bash
# 빌드
docker-compose build

# 실행
docker-compose --profile production up -d

# 확인
docker-compose ps
docker-compose logs -f
```

---

## 📦 의존성 관리

### 새 의존성 추가

```bash
# Frontend
cd frontend
npm install <package-name>

# Backend
cd backend
npm install <package-name>
```

### 의존성 업데이트

```bash
# 모든 의존성 확인
npm outdated

# 업데이트
npm update

# 주요 버전 업그레이드
npm install <package-name>@latest
```

---

## 🔐 환경 변수

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

### Backend (.env)

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=composition_puzzle
LTI_KEY=composition_puzzle_key
LTI_SECRET=secret
SESSION_SECRET=session_secret
ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

---

## 🤝 기여 가이드

### Git 워크플로우

```bash
# 새 기능 브랜치
git checkout -b feature/new-feature

# 변경사항 커밋
git add .
git commit -m "feat: add new feature"

# 푸시
git push origin feature/new-feature

# Pull Request 생성
```

### 커밋 메시지 규칙

- `feat:` 새 기능
- `fix:` 버그 수정
- `docs:` 문서 변경
- `style:` 코드 포맷팅
- `refactor:` 리팩토링
- `test:` 테스트 추가
- `chore:` 빌드/설정 변경

---

## 📚 추가 리소스

- [React 문서](https://react.dev/)
- [TypeScript 문서](https://www.typescriptlang.org/)
- [Express 문서](https://expressjs.com/)
- [Zustand 문서](https://github.com/pmndrs/zustand)
- [React DnD 문서](https://react-dnd.github.io/react-dnd/)
- [TailwindCSS 문서](https://tailwindcss.com/)
