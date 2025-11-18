# 삼각형 닮음 확대/축소 (Triangle Similarity Scaling)

KAIST Touch Math Academy를 위한 인터랙티브 삼각형 닮음 학습 시스템입니다.

## 📱 주요 기능

- **인터랙티브 삼각형 조작**: 드래그 앤 드롭으로 삼각형 이동
- **실시간 확대/축소**: 슬라이더로 삼각형 크기 조절
- **즉각적인 피드백**: 유사도와 위치 일치도를 실시간으로 표시
- **Moodle LMS 연동**: Moodle에서 문제를 가져오고 성적을 전송
- **모바일 반응형**: 스마트폰, 태블릿, 데스크톱 모두 지원
- **다국어 지원**: 한국어 UI

## 🏗️ 시스템 아키텍처

```
┌─────────────────┐
│   React App     │  ← 프론트엔드 (Vite + TypeScript)
│   (Port 3000)   │
└────────┬────────┘
         │
         │ REST API
         ▼
┌─────────────────┐
│  Node.js API    │  ← 백엔드 (Express + TypeScript)
│   (Port 5000)   │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
         ▼             ▼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Moodle    │
│  (Port 5432) │  │   WebService │
└──────────────┘  └──────────────┘
```

## 🚀 빠른 시작

### 1. Docker Compose로 실행 (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# Docker Compose로 전체 스택 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

서비스 접속:
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:5000
- **API 상태 확인**: http://localhost:5000/health

### 2. 로컬 개발 환경

#### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+ (또는 MySQL 5.7+)
- npm 또는 yarn

#### 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 및 Moodle 설정 입력

# 개발 서버 실행
npm run dev
```

#### 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경 변수 설정 (선택사항)
echo "VITE_API_URL=http://localhost:5000/api" > .env

# 개발 서버 실행
npm run dev
```

#### 데이터베이스 설정

```bash
# PostgreSQL에 데이터베이스 생성
createdb triangle_similarity

# 스키마 적용
psql -d triangle_similarity -f database/schema.sql

# 데모 데이터 삽입 (선택사항)
psql -d triangle_similarity -f database/seeds/demo_data.sql
```

## 📖 사용 방법

### 학생용

1. **문제 불러오기**: URL 파라미터로 문제 ID 전달
   ```
   http://localhost:3000?problemId=demo-problem-1
   ```

2. **삼각형 조작**:
   - 파란색 삼각형을 드래그하여 이동
   - 하단 슬라이더로 크기 조절
   - 보라색 점선 삼각형과 완전히 겹치도록 맞추기

3. **정답 제출**: "정답 확인" 버튼 클릭

4. **피드백 확인**: 실시간으로 유사도와 위치 일치도 확인

### 교사용 (Moodle 연동)

1. **Moodle에서 활동 생성**:
   - 새로운 퀴즈 활동 생성
   - 외부 도구(LTI)로 이 앱 추가

2. **문제 데이터 준비**:
   - 삼각형 좌표와 닮음비를 JSON 형태로 저장
   - API를 통해 문제 생성

3. **학생 성적 자동 전송**:
   - 학생이 문제를 풀면 자동으로 Moodle 성적부에 기록

## 🔌 API 엔드포인트

### 문제 관리

- `GET /api/problems` - 모든 문제 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성
- `PUT /api/problems/:id` - 문제 수정
- `DELETE /api/problems/:id` - 문제 삭제

### 학생 시도 기록

- `POST /api/attempts` - 시도 제출
- `GET /api/attempts/student/:studentId` - 학생별 시도 조회
- `GET /api/attempts/problem/:problemId` - 문제별 시도 조회

### Moodle 연동

- `GET /api/moodle/problems` - Moodle에서 문제 가져오기
- `POST /api/moodle/grade` - Moodle에 성적 전송
- `GET /api/moodle/courses` - 사용자 코스 목록

## 🎨 프론트엔드 구조

```
frontend/src/
├── components/          # React 컴포넌트
│   ├── TriangleCanvas.tsx    # 삼각형 시각화
│   ├── ControlPanel.tsx      # 조작 패널
│   └── FeedbackPanel.tsx     # 피드백 표시
├── hooks/              # 커스텀 훅
│   └── useAppStore.ts       # 상태 관리 (Zustand)
├── services/           # API 서비스
│   └── api.ts               # API 호출
├── types/              # TypeScript 타입 정의
│   └── index.ts
├── utils/              # 유틸리티 함수
│   └── geometry.ts          # 기하학 계산
└── styles/             # CSS 스타일
```

## 🔧 백엔드 구조

```
backend/src/
├── controllers/        # 요청 핸들러
│   ├── ProblemController.ts
│   ├── AttemptController.ts
│   └── MoodleController.ts
├── services/           # 비즈니스 로직
│   ├── ProblemService.ts
│   ├── AttemptService.ts
│   └── MoodleService.ts
├── routes/             # API 라우트
├── middleware/         # 미들웨어
│   ├── errorHandler.ts
│   ├── requestLogger.ts
│   └── validateMoodleToken.ts
└── types/              # TypeScript 타입 정의
```

## 🗄️ 데이터베이스 스키마

### problems 테이블
- 문제 정보 및 삼각형 데이터 저장

### student_attempts 테이블
- 학생의 시도 기록 저장

### student_progress 테이블
- 학생별 진도 추적

### moodle_sessions 테이블
- Moodle 세션 관리

## 🔐 보안

- **CORS 설정**: 허용된 출처만 접근 가능
- **Rate Limiting**: API 요청 속도 제한
- **Helmet.js**: 보안 헤더 자동 설정
- **입력 검증**: 모든 입력 데이터 검증
- **SQL Injection 방지**: 파라미터화된 쿼리 사용

## 📱 모바일 지원

- **반응형 디자인**: 모든 화면 크기에 최적화
- **터치 제스처**: 드래그, 핀치 줌 지원
- **성능 최적화**: 모바일 네트워크 환경 고려

## 🧪 테스트

```bash
# 프론트엔드 테스트
cd frontend
npm run test

# 백엔드 테스트
cd backend
npm run test
```

## 📦 배포

### Docker로 프로덕션 배포

```bash
# 프로덕션 빌드
docker-compose -f docker-compose.prod.yml up -d

# 빌드 확인
docker-compose ps
```

### 수동 배포

```bash
# 프론트엔드 빌드
cd frontend
npm run build
# dist/ 폴더를 웹 서버에 배포

# 백엔드 빌드
cd backend
npm run build
# dist/ 폴더로 Node.js 서버 실행
```

## 🔧 환경 변수

### 백엔드 (.env)

```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=triangle_similarity
DB_USER=postgres
DB_PASSWORD=your_password
MOODLE_URL=https://your-moodle.com
MOODLE_WS_TOKEN=your_token
CORS_ORIGIN=https://your-frontend.com
JWT_SECRET=your_secret_key
```

### 프론트엔드 (.env)

```env
VITE_API_URL=https://api.your-domain.com/api
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일 참조

## 👥 개발팀

- **KAIST Touch Math Academy**
- 문의: support@kaist-touchmath.edu

## 🆘 문제 해결

### Docker 컨테이너가 시작되지 않는 경우

```bash
# 로그 확인
docker-compose logs

# 컨테이너 재시작
docker-compose restart

# 완전히 재구축
docker-compose down
docker-compose up --build
```

### 데이터베이스 연결 오류

1. PostgreSQL이 실행 중인지 확인
2. .env 파일의 데이터베이스 설정 확인
3. 방화벽 설정 확인

### Moodle 연동 문제

1. Moodle Web Service가 활성화되어 있는지 확인
2. 토큰이 유효한지 확인
3. CORS 설정 확인

## 📚 추가 문서

- [API 문서](docs/API.md)
- [Moodle 연동 가이드](docs/MOODLE_INTEGRATION.md)
- [개발 가이드](docs/DEVELOPMENT.md)

## 🎯 로드맵

- [ ] 더 많은 기하학 도형 지원 (사각형, 원)
- [ ] 실시간 협업 모드
- [ ] AI 기반 힌트 시스템
- [ ] 게임화 요소 추가
- [ ] 접근성 개선 (WCAG 2.1 AA 준수)
- [ ] 다국어 지원 확대

---

**Made with ❤️ by KAIST Touch Math Academy**
