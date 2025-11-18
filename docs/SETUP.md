# LMS Wrong Answer Analysis System - 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- Docker Engine 20.10+
- Docker Compose 2.0+
- Moodle 3.7 인스턴스 (PHP 7.1.9, MySQL 5.7)
- Moodle Web Services API 활성화 및 토큰

### 권장 요구사항
- 4GB RAM 이상
- 10GB 디스크 공간
- Ubuntu 20.04+ 또는 macOS 10.15+

## Moodle 설정

### 1. Moodle Web Services 활성화

Moodle 관리자로 로그인 후:

1. **사이트 관리** → **고급 기능** 이동
2. **웹 서비스 활성화** 체크
3. 저장

### 2. Web Service 프로토콜 활성화

1. **사이트 관리** → **플러그인** → **웹 서비스** → **프로토콜 관리**
2. **REST 프로토콜** 활성화

### 3. 서비스 생성 및 기능 추가

1. **사이트 관리** → **서버** → **웹 서비스** → **외부 서비스**
2. **서비스 추가** 클릭
   - 이름: `LMS Analysis Service`
   - 짧은 이름: `lms_analysis`
   - 활성화됨: 체크

3. **기능 추가** 클릭 후 다음 기능 추가:
   ```
   core_course_get_courses
   core_enrol_get_enrolled_users
   mod_quiz_get_quizzes_by_courses
   mod_quiz_get_user_attempts
   mod_quiz_get_attempt_data
   core_user_get_users
   core_user_get_users_by_field
   ```

### 4. 사용자 생성 및 토큰 발급

1. **사이트 관리** → **사용자** → **계정** → **사용자 추가**
   - 사용자명: `lms_analysis_api`
   - 이메일: `api@your-domain.com`
   - 역할: 관리자 또는 적절한 권한 부여

2. **사이트 관리** → **서버** → **웹 서비스** → **토큰 관리**
3. **토큰 추가** 클릭
   - 사용자: `lms_analysis_api` 선택
   - 서비스: `LMS Analysis Service` 선택
4. **저장** 후 생성된 토큰 복사 (환경 변수에 사용)

## 시스템 설치

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 편집하여 다음 값 설정:

```env
# Moodle Configuration
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_webservice_token_from_step_4

# Database Configuration (기본값 사용 가능)
DATABASE_URL=postgresql://postgres:password@database:5432/lms_analysis
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_this_in_production
POSTGRES_DB=lms_analysis

# JWT Secret (프로덕션에서는 강력한 시크릿 사용)
JWT_SECRET=your_strong_jwt_secret_here

# Claude API (선택 사항 - AI 분석용)
CLAUDE_API_KEY=your_anthropic_api_key_here
```

### 3. Docker Compose로 시스템 실행

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 특정 서비스 로그만 확인
docker-compose logs -f backend
```

### 4. 데이터베이스 초기화

데이터베이스 스키마는 PostgreSQL 컨테이너 시작 시 자동으로 생성됩니다.

수동으로 초기화하려면:

```bash
docker-compose exec database psql -U postgres -d lms_analysis -f /docker-entrypoint-initdb.d/01_core_schema.sql
```

### 5. 시스템 접속

- **Frontend (웹 대시보드)**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API 문서**: http://localhost:3001/api

## Moodle 데이터 동기화

### 최초 동기화

시스템 설치 후 Moodle 데이터를 동기화해야 합니다.

#### 1. 코스 동기화

```bash
curl -X POST http://localhost:3001/api/sync/courses
```

응답 예시:
```json
{
  "success": true,
  "message": "Synced 10 courses",
  "details": {
    "recordsSynced": 10,
    "recordsFailed": 0,
    "errors": []
  }
}
```

#### 2. 퀴즈 동기화 (코스 ID 필요)

먼저 코스 ID를 확인:
```bash
curl http://localhost:3001/api/sync/status
```

코스 ID를 사용하여 퀴즈 동기화:
```bash
curl -X POST http://localhost:3001/api/sync/quizzes/123
# 123을 실제 Moodle 코스 ID로 변경
```

#### 3. 퀴즈 시도 동기화

```bash
curl -X POST http://localhost:3001/api/sync/attempts/456
# 456을 실제 Moodle 퀴즈 ID로 변경
```

### 자동 동기화 설정

환경 변수 `SYNC_INTERVAL_HOURS`로 자동 동기화 간격 설정 (기본: 6시간)

## 확신도 수집

### 방법 1: Moodle 플러그인 (권장)

`moodle-plugin/` 디렉토리의 플러그인을 Moodle에 설치:

1. `moodle-plugin/mod_quiz_confidence` 폴더를 Moodle의 `mod/quiz/` 디렉토리에 복사
2. Moodle 관리 페이지에서 플러그인 설치
3. 퀴즈 설정에서 "확신도 수집" 활성화

### 방법 2: API를 통한 수집

퀴즈 완료 후 별도로 확신도 수집:

```bash
curl -X POST http://localhost:3001/api/confidence/rate \
  -H "Content-Type: application/json" \
  -d '{
    "questionAttemptId": "uuid-here",
    "confidenceLevel": 4
  }'
```

### 방법 3: 일괄 수집

```bash
curl -X POST http://localhost:3001/api/confidence/batch \
  -H "Content-Type: application/json" \
  -d '{
    "ratings": [
      {"questionAttemptId": "uuid-1", "confidenceLevel": 5},
      {"questionAttemptId": "uuid-2", "confidenceLevel": 3}
    ]
  }'
```

## 분석 실행

### 학생별 확신 오답 분석

```bash
curl http://localhost:3001/api/analysis/student/{userId}?threshold=4
```

응답 예시:
```json
{
  "userId": "student-uuid",
  "summary": {
    "totalConfidentWrongAnswers": 12,
    "weakConceptsCount": 5
  },
  "confidentWrongAnswers": [...],
  "conceptWeaknesses": [...],
  "confidenceAccuracy": [...]
}
```

### 학급 전체 분석

```bash
curl http://localhost:3001/api/analysis/class/{courseId}?threshold=4
```

### AI 기반 분석 실행

```bash
curl -X POST http://localhost:3001/api/analysis/generate/{userId}
```

## 트러블슈팅

### Moodle 연결 실패

**증상**: `Failed to fetch courses` 오류

**해결방법**:
1. Moodle URL이 올바른지 확인 (https:// 포함)
2. Moodle Web Services가 활성화되었는지 확인
3. 토큰이 유효한지 확인
4. 방화벽에서 Moodle 서버 접근 허용 확인

### 데이터베이스 연결 실패

**증상**: `ECONNREFUSED` 오류

**해결방법**:
```bash
# PostgreSQL 컨테이너 상태 확인
docker-compose ps database

# 데이터베이스 재시작
docker-compose restart database

# 데이터베이스 로그 확인
docker-compose logs database
```

### 프론트엔드 빌드 오류

**해결방법**:
```bash
# 프론트엔드 컨테이너 재빌드
docker-compose build frontend
docker-compose up -d frontend
```

## 성능 최적화

### 데이터베이스 인덱스 확인

```sql
SELECT * FROM pg_indexes WHERE tablename IN (
  'question_attempts',
  'confidence_wrong_answers',
  'questions'
);
```

### 캐시 설정 (선택사항)

Redis를 추가하여 분석 결과 캐싱:

```yaml
# docker-compose.yml에 추가
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

## 보안 권장사항

1. **프로덕션 환경 설정**:
   - `.env` 파일의 모든 비밀번호 변경
   - JWT_SECRET 강력한 랜덤 문자열로 변경
   - PostgreSQL 비밀번호 변경

2. **HTTPS 설정**:
   - Nginx 리버스 프록시 설정
   - Let's Encrypt SSL 인증서 사용

3. **방화벽 설정**:
   - 데이터베이스 포트(5432) 외부 접근 차단
   - API 포트(3001)는 필요한 경우만 개방

## 백업 및 복구

### 데이터베이스 백업

```bash
docker-compose exec database pg_dump -U postgres lms_analysis > backup_$(date +%Y%m%d).sql
```

### 데이터베이스 복구

```bash
docker-compose exec -T database psql -U postgres lms_analysis < backup_20250101.sql
```

## 지원

문제가 발생하면 GitHub Issues에 보고해주세요:
- 오류 메시지 전체
- `docker-compose logs` 출력
- 환경 정보 (OS, Docker 버전)
