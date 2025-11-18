# 3초 도형 요약 (Shape Summary)

도형 문제의 핵심을 3초 애니메이션으로 요약하는 독립형 웹 애플리케이션

## 주요 기능

- **3초 애니메이션**: Canvas API를 활용한 실시간 도형 애니메이션
- **가상 스마트폰 화면**: 우측 하단에 표시되는 모바일 시뮬레이터
- **다양한 도형 지원**: 원, 삼각형, 사각형, 복합 도형
- **난이도별 문제**: 쉬움, 보통, 어려움
- **REST API**: 확장 가능한 백엔드 API
- **Moodle 통합 준비**: LMS 연동을 위한 확장 가능한 아키텍처

## 기술 스택

### Frontend
- **React 18** - UI 프레임워크
- **Vite** - 빠른 개발 빌드 도구
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Framer Motion** - 부드러운 애니메이션
- **Canvas API** - 실시간 도형 렌더링

### Backend
- **Node.js 18+** - 런타임
- **Express** - 웹 프레임워크
- **PostgreSQL 15** - 데이터베이스
- **Docker** - 컨테이너화

## 시작하기

### 필수 요구사항

- Node.js 18+
- PostgreSQL 15+ (또는 Docker)
- npm 또는 yarn

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Docker로 실행 (권장)

```bash
# 모든 서비스 시작 (DB + Backend + Frontend)
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

서비스 접근:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **PostgreSQL**: localhost:5432

### 3. 로컬 개발 모드

#### Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 DB 연결 정보 입력

# PostgreSQL이 실행 중인지 확인하고 데이터베이스 생성
createdb shape_summary

# 스키마 초기화
psql -d shape_summary -f src/db/schema.sql

# 개발 서버 시작
npm run dev
```

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

Frontend는 http://localhost:3000 에서 접근 가능합니다.

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── SmartphoneFrame.jsx    # 스마트폰 UI 프레임
│   │   │   └── ShapeAnimation.jsx     # 3초 도형 애니메이션
│   │   ├── services/        # API 클라이언트
│   │   ├── App.jsx          # 메인 앱
│   │   └── main.jsx         # 엔트리 포인트
│   ├── Dockerfile
│   └── package.json
│
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── routes/          # API 라우트
│   │   │   └── problems.js  # 문제 API
│   │   ├── db/              # 데이터베이스
│   │   │   ├── database.js  # DB 연결
│   │   │   └── schema.sql   # DB 스키마
│   │   └── index.js         # 서버 엔트리
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml        # Docker 구성
├── README.md
└── tasks/                    # 프로젝트 문서
```

## API 엔드포인트

### 문제 관리

```
GET    /api/problems              # 모든 문제 조회
GET    /api/problems/:id          # 특정 문제 조회
GET    /api/problems/random       # 랜덤 문제 조회
POST   /api/problems              # 새 문제 생성
PUT    /api/problems/:id          # 문제 수정
DELETE /api/problems/:id          # 문제 삭제
GET    /api/problems/stats/summary # 통계 조회
```

### 예제 요청

#### 새 문제 생성

```bash
curl -X POST http://localhost:5000/api/problems \
  -H "Content-Type: application/json" \
  -d '{
    "title": "원의 둘레 구하기",
    "description": "반지름이 7cm인 원의 둘레를 구하세요",
    "shapeType": "circle",
    "summary": "반지름 7cm 원의 둘레",
    "difficulty": "easy",
    "radius": 7,
    "unit": "cm",
    "formula": "2πr",
    "answer": 43.98
  }'
```

#### 문제 조회 (필터링)

```bash
# 원 도형만 조회
curl http://localhost:5000/api/problems?shape_type=circle

# 어려운 문제만 조회
curl http://localhost:5000/api/problems?difficulty=hard

# 랜덤 원 문제
curl http://localhost:5000/api/problems/random?shape_type=circle
```

## 데이터베이스 스키마

### problems 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 기본 키 |
| title | VARCHAR(255) | 문제 제목 |
| description | TEXT | 문제 설명 |
| shape_type | VARCHAR(50) | 도형 타입 (circle, triangle, rectangle, polygon) |
| summary | TEXT | 3초 요약 텍스트 |
| difficulty | VARCHAR(20) | 난이도 (easy, medium, hard) |
| properties | JSONB | 도형별 속성 (반지름, 가로, 세로 등) |
| created_at | TIMESTAMP | 생성 시간 |
| updated_at | TIMESTAMP | 수정 시간 |
| is_active | BOOLEAN | 활성화 상태 |

### 샘플 properties 구조

```json
{
  "circle": {
    "radius": 5,
    "unit": "cm",
    "formula": "πr²",
    "answer": 78.54
  },
  "triangle": {
    "base": 8,
    "height": 6,
    "unit": "cm",
    "formula": "(밑변 × 높이) ÷ 2",
    "answer": 24
  },
  "rectangle": {
    "width": 10,
    "height": 6,
    "unit": "cm",
    "formula": "가로 × 세로",
    "answer": 60
  }
}
```

## 애니메이션 시스템

### 지원 도형 타입

1. **Circle (원)**
   - Elastic easing으로 부드럽게 확대
   - 반지름 라인 애니메이션
   - 중심점 표시

2. **Triangle (삼각형)**
   - 선 그리기 애니메이션 (점진적)
   - 밑변과 높이 표시
   - 색상 강조

3. **Rectangle (사각형)**
   - Back easing으로 튕기는 효과
   - 가로/세로 치수 표시
   - 둘레 하이라이트

4. **Polygon (복합 도형)**
   - 여러 도형 조합
   - 순차적 렌더링

### 커스터마이징

`frontend/src/components/ShapeAnimation.jsx` 파일에서 애니메이션 로직을 수정할 수 있습니다:

```javascript
// 애니메이션 지속 시간 변경 (기본: 3000ms)
const duration = 3000

// 새 도형 타입 추가
case 'hexagon':
  drawHexagonAnimation(ctx, width, height, progress, problem)
  break

// Easing 함수 커스터마이징
const customEasing = (t) => {
  return t * t * (3 - 2 * t) // Smoothstep
}
```

## Moodle LMS 연동 (예정)

현재는 독립형으로 동작하지만, 향후 Moodle 3.7 연동을 지원할 예정입니다:

### 계획된 기능

- **LTI 1.3 Deep Link**: Moodle 문제 데이터 자동 가져오기
- **REST API Bridge**: Moodle Quiz 모듈 연동
- **SSO 인증**: Moodle 사용자 인증 통합
- **성적 동기화**: 학습 결과 자동 업데이트

### 연동 준비

```javascript
// backend/src/services/moodle.js (예정)
export const moodleService = {
  fetchProblems: async (courseId) => {
    // Moodle REST API 호출
  },
  syncGrades: async (userId, scores) => {
    // 성적 동기화
  }
}
```

## 개발 가이드

### 새 도형 타입 추가

1. **데이터베이스 스키마 확장**
```sql
-- shape_type에 새 값 추가
ALTER TABLE problems DROP CONSTRAINT problems_shape_type_check;
ALTER TABLE problems ADD CONSTRAINT problems_shape_type_check
  CHECK (shape_type IN ('circle', 'triangle', 'rectangle', 'polygon', 'hexagon'));
```

2. **애니메이션 함수 구현**
```javascript
// frontend/src/components/ShapeAnimation.jsx
const drawHexagonAnimation = (ctx, width, height, progress, problem) => {
  // 육각형 그리기 로직
  const sides = 6
  const radius = 80 * progress
  // ... 구현
}
```

3. **샘플 데이터 추가**
```sql
INSERT INTO problems (title, shape_type, summary, properties) VALUES
('육각형 넓이', 'hexagon', '정육각형 넓이 구하기',
 '{"side": 5, "unit": "cm", "answer": 64.95}');
```

### 환경 변수

#### Backend (.env)

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=shape_summary
DB_USER=postgres
DB_PASSWORD=your_password

CORS_ORIGIN=http://localhost:3000
```

#### Frontend (vite.config.js)

프록시 설정이 자동으로 `/api` 요청을 백엔드로 전달합니다.

## 배포

### Production 빌드

```bash
# Frontend 빌드
cd frontend
npm run build
# dist/ 폴더에 정적 파일 생성

# Backend 빌드 (불필요, Node.js는 직접 실행)
cd backend
npm install --production
```

### Docker로 배포

```bash
# Production 모드로 실행
docker-compose up -d

# 환경 변수 오버라이드
docker-compose up -d \
  -e DB_PASSWORD=secure_password \
  -e NODE_ENV=production
```

### Nginx 설정 예제

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 트러블슈팅

### 데이터베이스 연결 실패

```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 수동 연결 테스트
psql -h localhost -U postgres -d shape_summary
```

### Frontend가 Backend에 연결되지 않음

1. Backend가 실행 중인지 확인: `curl http://localhost:5000/health`
2. CORS 설정 확인: `.env`의 `CORS_ORIGIN` 값
3. 프록시 설정 확인: `frontend/vite.config.js`

### 애니메이션이 표시되지 않음

1. 브라우저 콘솔에서 에러 확인
2. Canvas 지원 브라우저인지 확인
3. 문제 데이터에 필수 속성이 있는지 확인 (`shapeType`, `summary`)

## 성능 최적화

### Frontend

- **Code Splitting**: 라우트별 lazy loading
- **Image Optimization**: 도형 아이콘 최적화
- **Memoization**: React.memo로 불필요한 리렌더링 방지

### Backend

- **Connection Pooling**: PostgreSQL 연결 풀 (최대 20개)
- **Caching**: Redis 추가 (향후)
- **Query Optimization**: 인덱스 최적화

### Database

```sql
-- 인덱스 추가로 쿼리 속도 향상
CREATE INDEX idx_problems_shape_difficulty ON problems(shape_type, difficulty);
CREATE INDEX idx_problems_created ON problems(created_at DESC);
```

## 보안

### 구현된 보안 기능

- CORS 설정으로 허용된 도메인만 접근
- SQL Injection 방지 (parameterized queries)
- Input validation
- Soft delete (is_active 플래그)

### 추가 권장 사항

- HTTPS 사용 (Let's Encrypt)
- Rate limiting (express-rate-limit)
- 입력 sanitization (express-validator)
- 환경 변수 암호화 (dotenv-safe)

## 테스트

```bash
# Backend 테스트 (향후 추가)
cd backend
npm test

# Frontend 테스트 (향후 추가)
cd frontend
npm test
```

## 라이선스

MIT License

## 기여

이슈나 PR을 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 지원

- 이슈: GitHub Issues
- 문서: [프로젝트 문서](./tasks/)
- 이메일: support@example.com

## 로드맵

### Phase 1: MVP (완료)
- [x] 기본 프로젝트 구조
- [x] React 프론트엔드
- [x] Node.js 백엔드
- [x] PostgreSQL 데이터베이스
- [x] Canvas 애니메이션
- [x] Docker 설정

### Phase 2: 기능 확장 (예정)
- [ ] 사용자 인증
- [ ] 문제 편집 UI
- [ ] 더 많은 도형 타입
- [ ] 애니메이션 커스터마이징
- [ ] 통계 대시보드

### Phase 3: LMS 연동 (예정)
- [ ] Moodle 3.7 REST API 연동
- [ ] LTI 1.3 Deep Link
- [ ] SSO 인증
- [ ] 성적 동기화
- [ ] Canvas LMS 지원

### Phase 4: AI 기능 (예정)
- [ ] 자동 문제 생성
- [ ] 난이도 자동 조정
- [ ] 학습 패턴 분석
- [ ] 맞춤형 문제 추천

---

**Built with ❤️ for better geometry education**
