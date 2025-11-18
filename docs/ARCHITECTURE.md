# Counterexample Shadow - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Proposition  │  │ Counterex.   │  │   Virtual    │  │
│  │   Editor     │  │   Shadow     │  │   Phone      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────┬────────────────────────────────────────────┘
             │ REST API / WebSocket
┌────────────▼────────────────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Proposition  │  │     LMS      │  │     Auth     │  │
│  │   Service    │  │  Integration │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────┬────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────┐
│                 PostgreSQL Database                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ propositions │  │counterexamples│  │    users     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Counterexample Shadow Visualization

**Purpose**: 명제의 반례를 어두운 그림자로 시각화

**Implementation**:
- Canvas API를 사용한 렌더링
- 집합론적 표현 (벤 다이어그램)
- 애니메이션 효과 (그림자 확산)

**Example**:
```
명제: "모든 소수는 홀수다"
시각화:
  - 밝은 영역: 명제를 만족하는 원소 (3, 5, 7, 11, ...)
  - 어두운 그림자: 반례 원소 (2)
```

### 2. Virtual Smartphone Display

**Purpose**: 우측 하단에 모바일 화면 시뮬레이션

**Specifications**:
- 위치: 화면 우측 하단 (position: fixed)
- 크기: 375px × 667px (iPhone SE 기준)
- 비율: 9:16
- 인터랙티브: 터치/클릭 이벤트 지원

**Features**:
- 실시간 프리뷰
- 반응형 스케일링
- 디바이스 프레임 UI

### 3. Proposition Data Model

```typescript
interface Proposition {
  id: string;
  title: string;
  statement: string;           // 명제 내용
  domain: string;              // 정의역
  type: PropositionType;       // universal/existential/conditional
  truthValue: boolean;         // 참/거짓
  counterexamples: Counterexample[];
  visualConfig: VisualizationConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface Counterexample {
  id: string;
  propositionId: string;
  value: any;                  // 반례 값
  explanation: string;         // 설명
  visualPosition: {x: number, y: number}; // 시각화 위치
  shadowIntensity: number;     // 그림자 강도 (0-1)
}

type PropositionType =
  | 'universal'                // ∀x P(x)
  | 'existential'              // ∃x P(x)
  | 'conditional'              // P → Q
  | 'biconditional';           // P ↔ Q

interface VisualizationConfig {
  mode: 'venn' | 'number-line' | 'graph' | 'custom';
  colors: {
    positive: string;          // 명제를 만족하는 영역
    negative: string;          // 반례 영역 (어두운 그림자)
    neutral: string;           // 정의역 배경
  };
  animation: {
    duration: number;          // ms
    easing: string;
  };
}
```

## Database Schema

### Tables

#### `propositions`
```sql
CREATE TABLE propositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  statement TEXT NOT NULL,
  domain VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  truth_value BOOLEAN,
  visual_config JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `counterexamples`
```sql
CREATE TABLE counterexamples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposition_id UUID REFERENCES propositions(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  explanation TEXT,
  visual_position JSONB,
  shadow_intensity DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'student',
  lms_id VARCHAR(255),          -- LMS 연동 ID
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### `student_interactions`
```sql
CREATE TABLE student_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  proposition_id UUID REFERENCES propositions(id),
  interaction_type VARCHAR(50), -- view/attempt/correct/incorrect
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Design

### RESTful Endpoints

```
# Propositions
GET    /api/propositions              # List all
GET    /api/propositions/:id          # Get one
POST   /api/propositions              # Create
PUT    /api/propositions/:id          # Update
DELETE /api/propositions/:id          # Delete

# Counterexamples
GET    /api/propositions/:id/counterexamples     # List
POST   /api/propositions/:id/counterexamples     # Add
DELETE /api/counterexamples/:id                  # Remove

# LMS Integration
POST   /api/lms/import                # Import from Moodle
POST   /api/lms/export-result         # Export student results

# Authentication
POST   /api/auth/login                # Login
POST   /api/auth/register             # Register
POST   /api/auth/lti                  # LTI launch (Moodle)

# Analytics
GET    /api/analytics/propositions/:id/stats
GET    /api/analytics/users/:id/progress
```

## Frontend Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── VirtualPhone (fixed position)
│       └── PropositionDisplay
│           └── CounterexampleShadow
├── Pages
│   ├── PropositionList
│   ├── PropositionEditor
│   │   ├── StatementInput
│   │   ├── DomainSelector
│   │   └── CounterexampleManager
│   └── StudentView
│       ├── PropositionChallenge
│       └── FeedbackDisplay
└── Providers
    ├── AuthContext
    └── ThemeContext
```

### State Management

**Approach**: React Context API + Custom Hooks

```typescript
// Example: useProposition hook
const useProposition = (id: string) => {
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch, update, delete operations
  return { proposition, loading, error, update, remove };
};
```

## Visualization Algorithm

### Shadow Rendering

```typescript
function renderCounterexampleShadow(
  ctx: CanvasRenderingContext2D,
  counterexamples: Counterexample[],
  config: VisualizationConfig
) {
  counterexamples.forEach(ce => {
    const gradient = ctx.createRadialGradient(
      ce.visualPosition.x, ce.visualPosition.y, 0,
      ce.visualPosition.x, ce.visualPosition.y, 50
    );

    // Dark shadow effect
    gradient.addColorStop(0, `rgba(0, 0, 0, ${ce.shadowIntensity})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });
}
```

## LMS Integration (Moodle)

### LTI 1.3 Support

**Flow**:
1. Moodle에서 LTI launch 요청
2. JWT 검증
3. 사용자 자동 로그인/생성
4. 문제 컨텍스트 로드
5. 학습 결과 Moodle로 전송 (grades)

**Configuration**:
```json
{
  "lti": {
    "version": "1.3",
    "clientId": "counterexample-shadow",
    "deploymentId": "1",
    "platformUrl": "https://moodle.example.com",
    "authUrl": "https://moodle.example.com/mod/lti/auth.php",
    "tokenUrl": "https://moodle.example.com/mod/lti/token.php"
  }
}
```

## Security

### Authentication
- JWT tokens (access + refresh)
- HTTPOnly cookies
- CSRF protection

### Authorization
- Role-based access control (teacher/student)
- Resource ownership validation

### Data Protection
- Input validation (Joi/Zod)
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitization)

## Performance Optimization

### Frontend
- Code splitting (React.lazy)
- Canvas optimization (requestAnimationFrame)
- Memoization (React.memo, useMemo)

### Backend
- Database indexing (propositions.created_by, counterexamples.proposition_id)
- Response caching (Redis - future)
- Connection pooling (pg-pool)

## Deployment

### Docker

```yaml
services:
  db:
    image: postgres:15-alpine
  backend:
    build: ./backend
    depends_on:
      - db
  frontend:
    build: ./frontend
    depends_on:
      - backend
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
```

### Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:pass@db:5432/counterexample
JWT_SECRET=***
NODE_ENV=production

# Frontend
VITE_API_URL=http://localhost:3000/api
```

## Future Enhancements

1. **AI-Generated Counterexamples**: Claude API로 자동 반례 생성
2. **Collaborative Mode**: 실시간 다중 사용자 편집
3. **Mobile Native App**: React Native 포팅
4. **Advanced Visualizations**: 3D 그래프, AR 지원
5. **Gamification**: 점수, 배지, 리더보드
