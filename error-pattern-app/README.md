# 실수 패턴 분석 시스템 (Error Pattern Analysis System)

Moodle LMS와 연동하여 학생의 오답 실수 이유를 수집하고 AI 기반 패턴 분석을 제공하는 독립형 웹 애플리케이션

## 주요 기능

### 학생용
- 퀴즈 오답 후 실수 이유 선택
- 8가지 실수 유형 카테고리
- 확신도 선택 (확실함/아마도/잘 모르겠음)
- 개인 학습 패턴 분석 대시보드
- AI 생성 맞춤형 학습 조언

### 교사용
- 학생별 상세 패턴 분석
- 학급 전체 패턴 통계
- 실수 유형별 분포 시각화
- 시간대별 추이 분석
- AI 기반 인사이트 및 개선 방안 제시

### 관리자용
- Moodle 데이터 동기화
- 실수 유형 카테고리 관리
- 시스템 통계 및 모니터링

## 기술 스택

### Frontend
- React 18 + TypeScript
- Material-UI (MUI) v5
- Recharts (데이터 시각화)
- React Query (서버 상태 관리)
- Vite (빌드 도구)

### Backend
- Node.js 18 + TypeScript
- Express 4.18
- TypeORM (MySQL 5.7)
- JWT 인증
- Claude API (AI 분석)

### Database
- MySQL 5.7
- UTF-8 (한글 지원)

### Moodle 연동
- Moodle Web Services REST API
- 퀴즈 시도 기록 동기화
- 사용자 정보 동기화

### DevOps
- Docker & Docker Compose
- Nginx (리버스 프록시)
- PM2 (프로세스 관리)

## 설치 및 실행

### 사전 요구사항
- Docker 및 Docker Compose
- Node.js 18+ (로컬 개발 시)
- MySQL 5.7 (또는 Docker)
- Moodle 3.7+ (Web Services 활성화 필요)
- Anthropic API 키

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 설정:
- `DB_PASSWORD`: MySQL 비밀번호
- `JWT_SECRET`: JWT 시크릿 키 (긴 랜덤 문자열)
- `MOODLE_URL`: Moodle 인스턴스 URL
- `MOODLE_WS_TOKEN`: Moodle Web Service 토큰
- `ANTHROPIC_API_KEY`: Claude API 키

### 2. Docker로 실행

```bash
# 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 종료
docker-compose down
```

서비스가 다음 포트에서 실행됩니다:
- Frontend: http://localhost (포트 80)
- Backend API: http://localhost/api (포트 5000)
- MySQL: localhost:3306

### 3. 로컬 개발 환경

#### Backend 개발

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 설정

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 실행
npm start
```

#### Frontend 개발

```bash
cd frontend
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 빌드
npm run build
```

### 4. 데이터베이스 초기화

MySQL이 실행 중일 때:

```bash
# Docker 환경
docker exec -i error-pattern-mysql mysql -u root -p${DB_PASSWORD} < database/init.sql

# 로컬 환경
mysql -u root -p < database/init.sql
```

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**
   - "웹 서비스 활성화" 체크
3. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**
   - REST 프로토콜 활성화

### 2. Custom Service 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**
2. "사용자 정의 서비스 추가" 클릭
3. 서비스 이름: `error_pattern_service`
4. 다음 함수 추가:
   - `core_user_get_users`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_get_attempt_review`

### 3. 토큰 생성

1. **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
2. "토큰 추가" 클릭
3. 사용자: 관리자 또는 전용 계정
4. 서비스: `error_pattern_service`
5. 생성된 토큰을 `.env` 파일의 `MOODLE_WS_TOKEN`에 입력

### 4. 데이터 동기화

관리자 계정으로 다음 API 호출:

```bash
# 사용자 동기화
POST /api/moodle/sync/users
{
  "userIds": [1, 2, 3] // 선택적
}

# 퀴즈 시도 동기화
POST /api/moodle/sync/quiz-attempts
{
  "quizId": 123
}
```

## API 엔드포인트

### 학생 API

```
POST   /api/student/errors/:id/reason         # 실수 이유 등록
GET    /api/student/errors/reasons            # 내 실수 이유 목록
PUT    /api/student/errors/reasons/:id        # 실수 이유 수정
DELETE /api/student/errors/reasons/:id        # 실수 이유 삭제
GET    /api/student/errors/stats              # 통계
GET    /api/student/my-patterns               # 내 패턴 분석
GET    /api/student/categories                # 카테고리 목록
```

### 교사 API

```
GET    /api/teacher/students/:id/patterns     # 학생 패턴 분석
POST   /api/teacher/students/compare          # 학생 비교
```

### 관리자 API

```
GET    /api/admin/categories                  # 카테고리 관리
POST   /api/admin/categories                  # 카테고리 추가
PUT    /api/admin/categories/:id              # 카테고리 수정
```

### Moodle 연동 API

```
GET    /api/moodle/pending-errors             # 미분류 오답
POST   /api/moodle/sync/users                 # 사용자 동기화
POST   /api/moodle/sync/quiz-attempts         # 퀴즈 동기화
```

## 실수 유형 카테고리

1. 개념 이해 부족 (Conceptual Misunderstanding)
2. 계산 실수 (Calculation Error)
3. 문제 해석 오류 (Problem Interpretation Error)
4. 공식 적용 오류 (Formula Application Error)
5. 부주의/실수 (Careless Mistake)
6. 시간 부족 (Time Pressure)
7. 풀이 과정 오류 (Solution Process Error)
8. 기타 (Other)

## 데이터베이스 스키마

주요 테이블:
- `users`: 사용자 정보
- `error_categories`: 실수 유형 카테고리
- `quiz_attempts`: 퀴즈 시도 기록
- `question_errors`: 오답 기록
- `error_reasons`: 실수 이유 선택 기록
- `pattern_analysis_cache`: 패턴 분석 캐시

상세 스키마는 `database/init.sql` 참조

## 프로젝트 구조

```
error-pattern-app/
├── backend/                # Node.js + Express + TypeORM
│   ├── src/
│   │   ├── controllers/   # API 컨트롤러
│   │   ├── models/        # TypeORM 엔티티
│   │   ├── routes/        # 라우터
│   │   ├── services/      # 비즈니스 로직
│   │   ├── middleware/    # 미들웨어
│   │   ├── config/        # 설정
│   │   └── index.ts       # 진입점
│   ├── Dockerfile
│   └── package.json
├── frontend/              # React + TypeScript + MUI
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지
│   │   ├── services/      # API 서비스
│   │   ├── types/         # TypeScript 타입
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── init.sql           # DB 초기화 스크립트
├── docker/
│   └── nginx/
│       └── nginx.conf     # Nginx 설정
├── docker-compose.yml
└── README.md
```

## 보안 고려사항

1. **인증/인가**
   - JWT 토큰 기반 인증
   - Role-based Access Control (학생/교사/관리자)
   - Moodle 세션 검증

2. **데이터 보호**
   - 환경 변수로 민감 정보 관리
   - SQL Injection 방지 (TypeORM)
   - XSS 방지 (React 기본 escaping)

3. **API 보안**
   - Rate Limiting (기본 100req/15min)
   - CORS 설정
   - Helmet.js (보안 헤더)

## 문제 해결

### MySQL 연결 오류
```bash
# MySQL 상태 확인
docker-compose logs mysql

# 컨테이너 재시작
docker-compose restart mysql
```

### Moodle 동기화 실패
- Moodle Web Services가 활성화되어 있는지 확인
- 토큰이 올바른지 확인
- Moodle 로그 확인: `사이트 관리 > 보고서 > 로그`

### Claude AI 오류
- ANTHROPIC_API_KEY가 올바른지 확인
- API 사용량 제한 확인

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 Issues에 등록해주세요.
