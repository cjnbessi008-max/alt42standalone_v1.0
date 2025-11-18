# 설치 가이드

## 빠른 시작 (5분)

### Docker를 사용하는 경우

```bash
# 1. 환경 변수 복사
cp .env.example .env

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 접속
# - Frontend: http://localhost:3000
# - Backend: http://localhost:3001
# - pgAdmin: http://localhost:5050
```

### Docker 없이 설치

```bash
# 1. PostgreSQL 설치 및 실행
sudo apt install postgresql
sudo systemctl start postgresql

# 2. 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE wrongmove_db;
\q

# 3. 스키마 로드
psql -U postgres -d wrongmove_db -f database/schema.sql
psql -U postgres -d wrongmove_db -f database/seed.sql

# 4. 환경 변수 설정
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 5. 의존성 설치
npm run install:all

# 6. 개발 서버 실행
npm run dev
```

## Moodle 연동 설정

### 1. Moodle에서 Web Services 활성화

1. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
2. 다음 항목 활성화:
   - ✅ 웹 서비스 활성화
   - ✅ REST 프로토콜 활성화

### 2. 외부 서비스 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. "서비스 추가" 클릭
3. 설정:
   - 이름: "Wrong Move Alert"
   - 짧은 이름: "wrongmove"
   - ✅ 사용 가능

### 3. 함수 추가

외부 서비스에 다음 함수 추가:
- `core_course_get_contents`
- `core_user_get_users_by_field`
- `mod_quiz_get_quiz_by_courses`
- `core_grades_update_grades`

### 4. API 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. "토큰 생성" 클릭
3. 사용자 및 서비스 선택
4. 토큰 복사

### 5. .env 파일 수정

```bash
MOODLE_BASE_URL=https://your-moodle-site.com
MOODLE_API_TOKEN=your_copied_token_here
```

## 테스트

### 1. 데모 문제로 테스트

브라우저에서 `http://localhost:3000` 접속 후:
1. 우측 하단 스마트폰 화면 확인
2. 문제에 **틀린 답** 입력
3. 붉은 크랙 효과 확인 ✅

### 2. Moodle 연동 테스트

```bash
# API 테스트
curl -X POST http://localhost:3001/api/moodle/sync \
  -H "Content-Type: application/json" \
  -d '{"courseId": "your_course_id"}'
```

## 문제 해결

### "Cannot connect to database"

```bash
# PostgreSQL 실행 확인
sudo systemctl status postgresql

# 데이터베이스 존재 확인
psql -U postgres -l | grep wrongmove
```

### "Port 3000 already in use"

```bash
# 포트 사용 프로세스 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

### Docker 컨테이너 재시작

```bash
docker-compose down
docker-compose up -d --build
```

## 다음 단계

1. ✅ 시스템 실행 확인
2. 📝 커스텀 문제 추가
3. 🔗 Moodle 연동 설정
4. 👥 학생 계정 생성
5. 📊 대시보드에서 통계 확인

도움이 필요하면 README.md를 참조하세요.
