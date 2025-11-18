# LMS Roleplay Conversion System

AI 기반으로 교육 문제를 인터랙티브한 상황극 스토리로 변환하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 선생님 기능
- 📝 문제 생성 및 관리 (객관식, O/X, 주관식, 수학)
- ✨ AI 기반 자동 스토리 변환 (Claude API 사용)
- 📊 대시보드 및 통계
- 🎨 다양한 테마 설정 가능

### 학생 기능
- 🎮 인터랙티브 스토리 플레이
- ✅ 실시간 피드백
- 📈 학습 진행도 추적
- 🏆 성취도 분석

## 기술 스택

### Backend
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Anthropic Claude API (Sonnet 4)
- JWT 인증
- Zod 검증

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS
- Zustand (상태 관리)
- React Router v6
- React Hook Form + Zod

### DevOps
- Docker + Docker Compose
- Nginx
- PostgreSQL 15

## 시작하기

### 사전 요구사항

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (선택사항)
- Anthropic API Key

### 환경 변수 설정

1. 백엔드 환경 변수 설정:

```bash
cd backend
cp .env.example .env
```

`.env` 파일을 열고 필수 값들을 설정하세요:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: 32자 이상의 랜덤 문자열
- `ANTHROPIC_API_KEY`: Anthropic API 키 (필수!)

### Docker로 실행 (권장)

```bash
# 환경 변수 설정
export ANTHROPIC_API_KEY=your-api-key-here
export JWT_SECRET=your-jwt-secret-at-least-32-characters-long

# Docker Compose로 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

애플리케이션 접속:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 로컬 개발 환경

#### 1. 데이터베이스 설정

PostgreSQL 설치 후:

```bash
createdb lms_roleplay
```

#### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# Prisma 설정
npx prisma generate
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

백엔드가 http://localhost:5000 에서 실행됩니다.

#### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

## 사용 방법

### 1. 회원가입

http://localhost:3000/register 에 접속하여:
- 이름, 이메일, 비밀번호 입력
- 역할 선택 (선생님 또는 학생)

### 2. 선생님 워크플로우

1. **문제 생성**
   - 대시보드 → "문제 관리" → "새 문제"
   - 과목, 주제, 난이도, 문제 유형 선택
   - 문제 내용 및 정답 입력

2. **스토리 생성**
   - 문제 상세 페이지에서 "스토리 생성" 클릭
   - AI가 자동으로 인터랙티브 스토리 생성 (약 5-10초 소요)
   - 생성된 스토리 미리보기 및 재생성 가능

3. **학생 배정**
   - 학생들이 자동으로 모든 스토리에 접근 가능
   - (향후 기능: 특정 학생/그룹에게만 배정)

### 3. 학생 워크플로우

1. **스토리 선택**
   - "스토리 목록"에서 원하는 스토리 선택
   - 과목, 주제, 난이도 확인

2. **스토리 플레이**
   - 캐릭터의 대화와 상황 읽기
   - 선택지 중 하나 선택
   - 즉각적인 피드백 확인
   - 다음 장면으로 진행 또는 스토리 완료

3. **학습 현황 확인**
   - "학습 현황"에서 진행도 및 성취도 확인
   - 완료한 스토리 다시 플레이 가능

## API 문서

### 인증 API

```
POST   /api/auth/register  - 회원가입
POST   /api/auth/login     - 로그인
POST   /api/auth/logout    - 로그아웃
GET    /api/auth/me        - 현재 사용자 정보
```

### 문제 API (선생님)

```
POST   /api/problems         - 문제 생성
GET    /api/problems         - 문제 목록
GET    /api/problems/:id     - 문제 상세
PUT    /api/problems/:id     - 문제 수정
DELETE /api/problems/:id     - 문제 삭제
GET    /api/problems/stats   - 통계
```

### 스토리 API

```
POST   /api/stories/generate           - 스토리 생성
GET    /api/stories                    - 스토리 목록
GET    /api/stories/:id                - 스토리 상세
PUT    /api/stories/:id/regenerate     - 스토리 재생성
DELETE /api/stories/:id                - 스토리 삭제
GET    /api/stories/problem/:problemId - 문제의 스토리 목록
```

### 학생 API

```
GET    /api/student/stories              - 사용 가능한 스토리 목록
POST   /api/student/stories/start        - 스토리 시작
POST   /api/student/stories/:id/complete - 스토리 완료
GET    /api/student/progress             - 학습 진행도
GET    /api/student/analytics            - 학습 분석
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # 데이터베이스 스키마
│   ├── src/
│   │   ├── config/            # 설정 파일
│   │   ├── controllers/       # API 컨트롤러
│   │   ├── middleware/        # 미들웨어
│   │   ├── routes/            # API 라우트
│   │   ├── services/          # 비즈니스 로직
│   │   ├── types/             # TypeScript 타입
│   │   ├── utils/             # 유틸리티 함수
│   │   └── index.ts           # 진입점
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   ├── lib/               # API 클라이언트, 유틸
│   │   ├── pages/             # 페이지 컴포넌트
│   │   ├── store/             # 상태 관리
│   │   ├── types/             # TypeScript 타입
│   │   ├── App.tsx            # 앱 라우터
│   │   ├── main.tsx           # 진입점
│   │   └── index.css          # 스타일
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── ARCHITECTURE.md        # 아키텍처 문서
├── docker-compose.yml
└── README.md
```

## 스토리 생성 예시

### 입력 (문제)
```
과목: 수학
주제: 분수
난이도: 쉬움
문제: 1/4 + 1/4 = ?
선택지: A) 1/8, B) 2/4, C) 1/2, D) 2/8
정답: B
```

### 출력 (AI 생성 스토리)
```
제목: "민수의 피자 파티"

배경: 민수는 친구들과 함께 피자를 나눠 먹고 있습니다. 피자는 4조각으로 나누어져 있어요.

캐릭터: 민수 (초등학생, 친절하고 수학을 좋아함)

장면 1:
민수: "나는 피자 1조각을 먹었어. 그럼 1/4을 먹은 거지?"
[상황: 민수의 친구 지영이도 피자 1조각을 먹었습니다.]
민수: "그럼 우리 둘이 먹은 피자는 전체의 얼마일까?"

선택지:
A) 1/8 - "두 조각을 더 작게 나눈 거니까 1/8이야!"
   피드백: "아쉽네요. 1/4 + 1/4는 조각을 더 작게 나누는 게 아니라 더하는 거예요."

B) 2/4 - "1/4 + 1/4 = 2/4야!"
   피드백: "정답입니다! 👏 분모가 같으면 분자만 더하면 돼요."

C) 1/2 - "반을 먹었으니까 1/2야!"
   피드백: "결과는 맞지만, 분수로 표현하면 2/4가 더 정확해요."

D) 2/8 - "조각이 두 개니까 2/8이야!"
   피드백: "조각 개수는 맞지만 전체 조각 수를 생각해보세요."
```

## 데이터베이스 스키마

### User (사용자)
- id, email, password, name, role, timestamps

### Problem (문제)
- id, teacherId, subject, topic, difficulty, question, type, options, answer, explanation, timestamps

### Story (스토리)
- id, problemId, title, storyData (JSON), theme, generationTime, timestamps

### StudentProgress (학생 진행도)
- id, studentId, storyId, completed, isCorrect, choicesMade (JSON), timeSpent, attempts, timestamps

## 보안 고려사항

- JWT 기반 인증
- bcrypt를 사용한 비밀번호 해싱
- Zod를 사용한 입력 검증
- CORS 설정
- Rate limiting
- Helmet.js를 통한 보안 헤더
- SQL Injection 방지 (Prisma ORM)

## 성능 최적화

- React 코드 스플리팅
- 이미지 최적화
- Gzip 압축
- 정적 파일 캐싱
- 데이터베이스 인덱싱
- API 응답 캐싱 (향후)

## 트러블슈팅

### 데이터베이스 연결 오류

```bash
# PostgreSQL 실행 확인
docker-compose ps

# 데이터베이스 마이그레이션
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Claude API 오류

- API 키 확인: `.env`의 `ANTHROPIC_API_KEY` 값 확인
- API 한도 확인: Anthropic 콘솔에서 사용량 확인
- 네트워크 연결 확인

### 포트 충돌

```bash
# 다른 포트로 변경
# docker-compose.yml 수정:
ports:
  - "8000:5000"  # 백엔드
  - "8080:80"    # 프론트엔드
```

## 향후 개발 계획

- [ ] 문제 CSV/JSON 대량 업로드
- [ ] 스토리 테마 커스터마이징
- [ ] 이미지 생성 (DALL-E 통합)
- [ ] 음성 나레이션
- [ ] 다국어 지원
- [ ] 실시간 협업 기능
- [ ] 모바일 앱 (React Native)
- [ ] LTI 표준 지원 (LMS 연동)
- [ ] 고급 분석 대시보드
- [ ] 게임화 요소 (배지, 리더보드)

## 라이선스

MIT License

## 문의

이슈가 있으시면 GitHub Issues를 통해 제보해주세요.

## 기여

Pull Request를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
