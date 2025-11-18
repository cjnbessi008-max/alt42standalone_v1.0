# AI Education System Pipeline - Case Roadmap Visualization

KAIST Touch Math Academy의 AI 교육 시스템 파이프라인 프로젝트입니다. 교사의 자연어 요청을 받아 완전한 교육 모듈을 자동으로 생성하는 시스템입니다.

## 주요 기능

### 1. Case Roadmap 시각화
- **파이프라인 흐름도**: D3.js를 사용한 인터랙티브 시각화
- **실시간 진행 상황 추적**: Socket.IO를 통한 실시간 업데이트
- **단계별 상세 정보**: 6단계 파이프라인 각 단계의 상태 및 소요 시간 표시
- **모바일 반응형**: 우측 하단 가상 스마트폰 화면에 미리보기 제공

### 2. 파이프라인 단계
1. **World Model** (세계관 재구성) - 교육 도메인 모델 생성
2. **Rule Engine** (룰 생성 엔진) - 비즈니스 룰 자동 생성
3. **Data Manager** (데이터 관리) - 데이터베이스 스키마 생성
4. **Input Strategy** (입력 전략 설계) - 학생 입력 방법 결정
5. **UI Generator** (UI 자동 생성) - React 컴포넌트 자동 생성
6. **Deployer** (배포 및 통합) - 시스템 배포

### 3. Moodle LMS 연동
- **LTI 1.3** 프로토콜 지원
- **모듈 동기화**: 로컬 모듈을 Moodle 과제로 동기화
- **성적 전송**: Moodle로 학생 성적 자동 전송
- **수강생 관리**: Moodle 강좌의 수강생 정보 가져오기

## 기술 스택

### Backend
- **Node.js** 18+ with Express
- **PostgreSQL** 15+ (with JSONB support)
- **Redis** 7+ (caching & sessions)
- **Socket.IO** (real-time updates)

### Frontend
- **React** 18+ with TypeScript
- **Material-UI** (MUI) for UI components
- **D3.js** for data visualization
- **Zustand** for state management
- **Axios** for API calls

### Integrations
- **Moodle** 3.7+ (PHP 7.1.9, MySQL 5.7)
- **LTI 1.3** for LMS integration

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # Node.js API Gateway
│   ├── src/
│   │   ├── config/            # 데이터베이스 설정
│   │   ├── routes/            # API 라우터
│   │   ├── controllers/       # 컨트롤러
│   │   ├── integrations/      # Moodle 연동
│   │   └── server.js          # 메인 서버
│   └── package.json
│
├── frontend/                   # React 웹 UI
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── CaseRoadmapVisualization.jsx
│   │   │   ├── MobilePhoneView.jsx
│   │   │   └── MobileRoadmapPreview.jsx
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CaseRoadmapPage.jsx
│   │   │   └── ModuleDetailPage.jsx
│   │   ├── services/          # API 서비스
│   │   ├── hooks/             # React Hooks
│   │   └── styles/            # 스타일
│   └── package.json
│
├── database/                   # 데이터베이스 마이그레이션
│   └── migrations/
│       └── 001_init_schema.sql
│
└── tasks/                      # 프로젝트 문서
    └── 0001-prd-ai-education-pipeline.md
```

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm 9+

### 1. 의존성 설치

```bash
# 루트에서 모든 워크스페이스 설치
npm install

# 또는 개별 설치
cd backend && npm install
cd frontend && npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=education_pipeline
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1h

# Server
PORT=3000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:5173

# Moodle Integration (선택사항)
MOODLE_CONSUMER_KEY=your_consumer_key
MOODLE_CONSUMER_SECRET=your_consumer_secret
MOODLE_WS_TOKEN=your_webservice_token
```

### 3. 데이터베이스 마이그레이션

```bash
# PostgreSQL에 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE education_pipeline;

# 마이그레이션 실행
\c education_pipeline
\i database/migrations/001_init_schema.sql
```

### 4. 개발 서버 실행

```bash
# 모든 서비스 동시 실행
npm run dev

# 또는 개별 실행
npm run dev:backend   # Backend on :3000
npm run dev:frontend  # Frontend on :5173
```

## API 엔드포인트

### Modules
- `GET /api/modules` - 모든 모듈 조회
- `GET /api/modules/:id` - 특정 모듈 조회
- `POST /api/modules` - 새 모듈 생성
- `PUT /api/modules/:id` - 모듈 수정
- `DELETE /api/modules/:id` - 모듈 삭제
- `POST /api/modules/:id/generate` - 모듈 생성 시작

### Case Roadmap
- `GET /api/case-roadmap/:moduleId` - Case Roadmap 조회
- `GET /api/case-roadmap/:moduleId/pipeline` - 파이프라인 진행 상황
- `POST /api/case-roadmap/:moduleId/pipeline/:stage/complete` - 단계 완료
- `GET /api/case-roadmap/active` - 활성 Case 목록

### Moodle Integration
- `POST /api/moodle/lti/launch` - LTI 런치 요청 처리
- `POST /api/moodle/sync/:moduleId` - Moodle과 모듈 동기화
- `GET /api/moodle/sync/:moduleId/status` - 동기화 상태 조회
- `POST /api/moodle/grades/send` - Moodle로 성적 전송
- `GET /api/moodle/courses/:courseId` - Moodle 강좌 정보
- `GET /api/moodle/courses/:courseId/students` - 수강생 목록

## Case Roadmap 사용법

### 1. 대시보드에서 모듈 선택
메인 대시보드(`/`)에서 생성된 교육 모듈을 확인하고 "Roadmap 보기" 버튼을 클릭합니다.

### 2. Case Roadmap 확인
- **전체 진행률**: 파이프라인 전체 진행 상황을 백분율로 표시
- **파이프라인 흐름도**: D3.js로 시각화된 6단계 흐름
- **단계별 상세**: 각 단계의 상태, 시작/완료 시간, 소요 시간
- **실시간 업데이트**: 단계 완료 시 자동으로 화면 갱신

### 3. 모바일 미리보기
우측 하단의 가상 스마트폰 화면에서 모바일 버전을 실시간으로 확인할 수 있습니다.

## Moodle 연동 설정

### 1. Moodle에서 LTI 설정
1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 활동 모듈 > 외부 도구** 이동
3. **도구 구성** 추가
4. Consumer Key와 Shared Secret 생성
5. 설정에서 `.env` 파일에 입력

### 2. Moodle Web Services 활성화
1. **사이트 관리 > 고급 기능**에서 "웹 서비스 활성화" 체크
2. **사이트 관리 > 서버 > 웹 서비스 > 외부 서비스**에서 새 서비스 생성
3. 필요한 함수 추가:
   - `core_course_get_courses`
   - `mod_assign_create_assignment`
   - `mod_assign_save_grade`
   - `core_enrol_get_enrolled_users`
4. 토큰 생성 후 `.env` 파일에 입력

### 3. 모듈 동기화
```bash
POST /api/moodle/sync/:moduleId
{
  "instanceUrl": "https://your-moodle.com",
  "courseId": 123
}
```

## 데이터베이스 스키마

주요 테이블:
- **modules**: 교육 모듈 정보
- **generation_jobs**: 파이프라인 작업 추적
- **teachers**: 교사 정보
- **students**: 학생 정보
- **rules**: 생성된 비즈니스 룰
- **moodle_integration**: Moodle 연동 정보
- **student_progress**: 학생 진행 상황

## 개발 로드맵

- [x] Phase 1: 프로젝트 기본 구조
- [x] Phase 2: 백엔드 API 구조
- [x] Phase 3: 데이터베이스 스키마
- [x] Phase 4: Case Roadmap 시각화
- [x] Phase 5: 모바일 반응형 UI
- [x] Phase 6: Moodle LMS 연동 준비
- [ ] Phase 7: AI 파이프라인 구현 (Claude API)
- [ ] Phase 8: UI 자동 생성 시스템
- [ ] Phase 9: 테스트 및 배포

## 라이선스

MIT License - KAIST Touch Math Academy

## 기여

프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요.

## 문의

- 기술 문의: development@kaist.ac.kr
- 교육 관련 문의: education@kaist.ac.kr
