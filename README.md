# Mental Stamina LMS - 사고 체력 측정 시스템

Moodle 3.7 LMS와 연동하여 학생들의 사고 체력(Mental Stamina)을 실시간으로 측정하는 독립형 웹 애플리케이션입니다.

## 주요 기능

### 🎯 학생용 기능
- **실시간 사고 체력 측정**: 문제 풀이 중 인지 피로도를 실시간으로 분석
- **행동 패턴 추적**: 반응 시간, 정답률, 클릭 패턴, 포커스 손실 등을 기록
- **지능형 휴식 권장**: 피로도가 높을 때 자동으로 휴식을 제안
- **학습 세션 요약**: 사고 체력 점수, 정답률, 피로도 수준 등의 상세 리포트

### 👨‍🏫 교사용 대시보드
- **학급 전체 통계**: 평균 사고 체력, 총 학습 세션, 문제 풀이 현황
- **학생별 분석**: 개별 학생의 사고 체력 추이 및 상세 통계
- **피로도 경고**: 높은 피로도를 보이는 학생 실시간 알림
- **시각화 차트**: 사고 체력 추이 그래프 (Recharts)

### 🔗 Moodle LMS 연동
- **LTI 1.3 표준 지원**: Moodle과 안전하게 통합
- **자동 사용자 동기화**: Moodle 사용자 정보 자동 생성
- **성적 전송**: LTI Grade Passback을 통한 성적 동기화

## 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **TailwindCSS** (스타일링)
- **Zustand** (상태 관리)
- **React Query** (데이터 페칭)
- **Recharts** (데이터 시각화)

### Backend
- **Node.js** + Express
- **PostgreSQL 15** (데이터베이스)
- **JWT** (인증)
- **LTI.js** (Moodle 연동)

### Mental Stamina 측정 알고리즘
```javascript
// 주요 측정 지표
- Response Time (반응 시간): 각 문제당 소요 시간
- Accuracy Rate (정답률): 정답 비율 추이
- Hesitation Count (망설임 횟수): 답변 변경 횟수
- Focus Loss (포커스 손실): 창 전환 빈도
- Fatigue Index (피로도 지수): 종합 피로도 점수

// 사고 체력 점수 계산
Mental Stamina Score = (Accuracy × 0.5) + (Speed × 0.3) + (Confidence × 0.2)
```

## 설치 및 실행

### 사전 요구사항
- Node.js 16.x 이상
- PostgreSQL 15 이상
- Docker & Docker Compose (선택사항)

### 1. Docker Compose로 실행 (권장)

```bash
# 저장소 클론
git clone https://github.com/your-repo/mental-stamina-lms.git
cd mental-stamina-lms

# Docker Compose로 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

서비스 접속:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### 2. 로컬 개발 환경 설정

#### Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 데이터베이스 스키마 생성
psql -U postgres -d mental_stamina -f ../database/schema.sql

# 서버 실행
npm run dev
```

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## Moodle 3.7 연동 가이드

자세한 Moodle 연동 방법은 [MOODLE_INTEGRATION.md](./MOODLE_INTEGRATION.md) 문서를 참고하세요.

### 빠른 시작

1. **Moodle에서 External Tool 추가**
   - 사이트 관리 > 플러그인 > 활동 모듈 > External tool > 도구 관리
   - "도구 수동 구성" 선택

2. **설정 정보 입력**
   ```
   Tool Name: Mental Stamina
   Tool URL: http://your-server:3001/lti/launch
   Consumer Key: mental-stamina-key
   Shared Secret: your_lti_secret_here
   ```

3. **코스에 도구 추가**
   - 코스로 이동 > 활동 또는 리소스 추가 > External tool
   - "Mental Stamina" 선택

## 데이터베이스 스키마

주요 테이블:
- **users**: 사용자 정보 (학생, 교사)
- **sessions**: 학습 세션
- **questions**: 문제 데이터
- **responses**: 학생 답변 및 행동 메트릭
- **stamina_metrics**: 사고 체력 측정 데이터
- **grade_passbacks**: Moodle 성적 전송 기록

## API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `GET /api/auth/verify` - 토큰 검증

### 학습 세션
- `POST /api/sessions/start` - 세션 시작
- `POST /api/sessions/:id/end` - 세션 종료
- `GET /api/sessions/:id` - 세션 조회

### 문제 및 답변
- `POST /api/questions` - 문제 생성
- `POST /api/questions/:id/answer` - 답변 제출

### 사고 체력
- `GET /api/stamina/session/:id` - 세션별 메트릭
- `GET /api/stamina/user/:id/history` - 사용자 히스토리
- `GET /api/stamina/user/:id/stats` - 사용자 통계

### 교사 대시보드
- `GET /api/dashboard/overview` - 전체 개요
- `GET /api/dashboard/student/:id` - 학생 상세 분석
- `GET /api/dashboard/class-stats` - 학급 통계
- `GET /api/dashboard/alerts` - 피로도 경고

## 환경 변수 설정

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mental_stamina
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
LTI_KEY=mental-stamina-key
LTI_SECRET=your_lti_secret
CORS_ORIGIN=http://your-frontend-url
```

### Frontend (.env)
```env
VITE_API_URL=http://your-backend-url:3001
```

## 보안 고려사항

- ✅ JWT 기반 인증
- ✅ Helmet.js로 HTTP 헤더 보안
- ✅ Rate limiting (API 요청 제한)
- ✅ SQL Injection 방지 (Parameterized queries)
- ✅ XSS 방지 (React의 자동 이스케이핑)
- ✅ CORS 설정

## 성능 최적화

- React Query로 데이터 캐싱
- PostgreSQL 인덱스 최적화
- Connection pooling
- 불필요한 리렌더링 방지

## 라이선스

MIT License

## 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

## 개발자

KAIST Touch Math Academy

---

**Note**: 이 시스템은 MySQL 5.7, PHP 7.1.9, Moodle 3.7 환경과 호환되도록 설계되었습니다.
