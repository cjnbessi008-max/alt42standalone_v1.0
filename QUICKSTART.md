# 🚀 빠른 시작 가이드

## 1단계: 환경 설정

### 필수 요구사항
- Docker & Docker Compose
- Git

### 선택 (로컬 개발시)
- Node.js 18+
- Python 3.11+
- MySQL 5.7+

## 2단계: 프로젝트 복제 및 설정

```bash
# 프로젝트 디렉토리로 이동
cd alt42standalone_v1.0

# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 편집 (Moodle 정보 입력)
nano .env
```

### 필수 환경 변수 설정

```bash
# Moodle Integration (있는 경우)
MOODLE_URL=https://your-moodle-instance.com
MOODLE_API_TOKEN=your_moodle_api_token

# Database
DB_PASSWORD=your_secure_password

# JWT (인증용)
JWT_SECRET=your_random_secret_key
```

## 3단계: Docker로 시스템 시작

```bash
# 모든 서비스 시작
docker-compose up -d

# 로그 확인 (선택사항)
docker-compose logs -f

# 특정 서비스 로그만 보기
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f analytics-engine
```

## 4단계: 시스템 접속

브라우저에서 다음 URL로 접속:

### 🎓 학생용 인터페이스
**URL**: http://localhost:5173

**기능**:
- 학습 현황 대시보드
- 사고 전성기 구간 확인
- 학습 활동 페이지

### 👨‍🏫 교사용 대시보드
**URL**: http://localhost:5173/teacher

**기능**:
- 전체 학생 통계
- 우수 학생 분석
- 사고 전성기 시각화

### 📝 학습 활동 페이지
**URL**: http://localhost:5173/activity

**기능**:
- 실시간 이벤트 추적 데모
- 문제 풀이 인터페이스
- 실시간 세션 모니터링

## 5단계: Moodle 연동 (선택사항)

Moodle을 사용중이라면 데이터를 동기화할 수 있습니다:

```bash
# 학생 데이터 동기화
curl -X POST http://localhost:3000/api/moodle/sync/students

# 강좌 데이터 동기화
curl -X POST http://localhost:3000/api/moodle/sync/courses
```

## 6단계: 샘플 데이터 확인

시스템에는 이미 샘플 데이터가 포함되어 있습니다:
- 5명의 학생
- 3개의 강좌
- 6개의 문제
- 샘플 학습 세션

## 📊 테스트 시나리오

### 시나리오 1: 학습 활동 추적

1. http://localhost:5173/activity 접속
2. 문제 풀이 시작 (자동으로 세션 생성됨)
3. 답안 입력 (모든 클릭/입력이 자동 추적됨)
4. 제출 버튼 클릭
5. 우측 하단에 세션 ID 표시 확인

### 시나리오 2: 사고 전성기 분석

학습 세션이 있는 경우, 분석을 실행할 수 있습니다:

```bash
# 세션 분석 실행 (session_id는 실제 값으로 대체)
curl -X POST http://localhost:3000/api/analytics/analyze-session/[SESSION_ID]

# 결과 확인
curl http://localhost:3000/api/analytics/peak-periods/session/[SESSION_ID]
```

### 시나리오 3: 대시보드 확인

1. **학생 대시보드**: http://localhost:5173
   - 학습 통계 확인
   - 최근 사고 전성기 구간 확인

2. **교사 대시보드**: http://localhost:5173/teacher
   - 전체 학생 통계
   - 우수 학생 차트
   - 상위 성과자 목록

## 🛠️ 문제 해결

### 포트 충돌
다른 애플리케이션이 사용중인 포트가 있다면 docker-compose.yml에서 변경:

```yaml
ports:
  - "5174:5173"  # Frontend
  - "3001:3000"  # Backend
  - "8002:8001"  # Analytics
```

### 데이터베이스 연결 실패
MySQL 컨테이너가 완전히 시작될 때까지 기다립니다:

```bash
# MySQL 로그 확인
docker-compose logs mysql

# MySQL이 준비되면 다른 서비스 재시작
docker-compose restart backend analytics-engine
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs

# 특정 서비스만
docker-compose logs backend
docker-compose logs analytics-engine
docker-compose logs frontend
```

## 🔄 시스템 재시작

```bash
# 중지
docker-compose down

# 재시작
docker-compose up -d

# 데이터까지 완전 삭제 후 재시작
docker-compose down -v
docker-compose up -d
```

## 📝 다음 단계

1. **Moodle 연동** - 실제 Moodle 인스턴스 연결
2. **사용자 인증** - JWT 기반 로그인 구현
3. **데이터 분석** - 실제 학생 데이터로 테스트
4. **커스터마이징** - UI/UX 조정 및 기능 추가

## 💡 유용한 명령어

```bash
# 시스템 상태 확인
docker-compose ps

# 데이터베이스 접속
docker-compose exec mysql mysql -u peak_user -p peak_thinking_db

# Backend 컨테이너 접속
docker-compose exec backend sh

# 로그 실시간 보기
docker-compose logs -f --tail=100
```

## 📚 추가 문서

- **상세 구현 문서**: `IMPLEMENTATION.md`
- **API 문서**: http://localhost:3000/api-docs (구현 예정)
- **분석 엔진 문서**: http://localhost:8001/docs

## 🆘 도움말

문제가 발생하면:
1. 로그 확인 (`docker-compose logs`)
2. 이슈 트래커에 문의
3. IMPLEMENTATION.md 참고

---

**즐거운 학습 분석 되세요!** 🎓📊
