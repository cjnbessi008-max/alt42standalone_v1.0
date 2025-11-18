# Moodle LMS 학습 분석 시스템 - 설치 가이드

## 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 단계](#설치-단계)
3. [Moodle 연동 설정](#moodle-연동-설정)
4. [환경 설정](#환경-설정)
5. [실행 및 테스트](#실행-및-테스트)
6. [문제 해결](#문제-해결)

## 시스템 요구사항

### 소프트웨어 요구사항
- **Python**: 3.11 이상
- **Node.js**: 18 이상
- **Docker**: 20.10 이상 (선택사항)
- **Redis**: 7 이상
- **PostgreSQL**: 15 이상

### Moodle 환경
- **Moodle 버전**: 3.7
- **PHP 버전**: 7.1.9
- **MySQL 버전**: 5.7
- **Moodle DB 읽기 권한** 필요

### 하드웨어 권장사항
- **CPU**: 4코어 이상
- **RAM**: 8GB 이상
- **디스크**: 20GB 이상 여유 공간

## 설치 단계

### 1. 저장소 클론 및 이동

```bash
cd moodle-integration
```

### 2. Python 가상환경 설정

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# 의존성 설치
cd backend
pip install -r requirements.txt
```

### 3. Node.js 의존성 설치

```bash
cd ../frontend
npm install
```

### 4. 데이터베이스 설정

#### PostgreSQL 설치 및 설정

```bash
# PostgreSQL 설치 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# PostgreSQL 서비스 시작
sudo systemctl start postgresql

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE moodle_analysis;
CREATE USER moodle_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE moodle_analysis TO moodle_user;
\q
```

#### Redis 설치

```bash
# Redis 설치 (Ubuntu/Debian)
sudo apt-get install redis-server

# Redis 서비스 시작
sudo systemctl start redis-server

# Redis 연결 테스트
redis-cli ping
# 응답: PONG
```

## Moodle 연동 설정

### 1. Moodle 데이터베이스 읽기 전용 계정 생성

Moodle MySQL 데이터베이스에 연결하여 읽기 전용 사용자를 생성합니다:

```sql
-- Moodle MySQL 서버에 연결
mysql -u root -p

-- 읽기 전용 사용자 생성
CREATE USER 'moodle_readonly'@'%' IDENTIFIED BY 'secure_password_here';

-- 읽기 권한 부여
GRANT SELECT ON moodle.* TO 'moodle_readonly'@'%';

-- 권한 적용
FLUSH PRIVILEGES;

-- 연결 테스트
EXIT;
mysql -u moodle_readonly -p -h your_moodle_host moodle
```

### 2. Moodle REST API 토큰 생성 (선택사항)

Moodle 관리자 계정으로 로그인:

1. **사이트 관리** → **플러그인** → **웹 서비스** → **외부 서비스**
2. **새 서비스 추가**
   - 이름: "LMS Analysis Service"
   - 약칭: "lms_analysis"
   - 활성화: ✓
3. **함수 추가**: 필요한 웹서비스 함수 추가
4. **토큰 관리** → **토큰 생성**
   - 사용자 선택
   - 서비스: "LMS Analysis Service"
   - 토큰 복사

## 환경 설정

### 1. 설정 파일 생성

```bash
cd config
cp moodle.config.example.json moodle.config.json
```

### 2. `moodle.config.json` 편집

```json
{
  "moodle": {
    "db_host": "your-moodle-db-host.com",
    "db_port": 3306,
    "db_name": "moodle",
    "db_user": "moodle_readonly",
    "db_password": "your_secure_password",
    "api_url": "https://your-moodle-site.com/webservice/rest/server.php",
    "api_token": "your_moodle_api_token"
  },
  "analysis_db": {
    "host": "localhost",
    "port": 5432,
    "database": "moodle_analysis",
    "user": "moodle_user",
    "password": "your_secure_password"
  },
  "redis": {
    "host": "localhost",
    "port": 6379,
    "db": 0,
    "password": null
  },
  "anthropic": {
    "api_key": "sk-ant-api03-...",
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 1024
  }
}
```

### 3. 환경 변수 설정 (.env 파일)

```bash
# .env 파일 생성
cat > .env << EOF
# Moodle DB 연결
MOODLE_DB_HOST=your-moodle-db-host.com
MOODLE_DB_PORT=3306
MOODLE_DB_NAME=moodle
MOODLE_DB_USER=moodle_readonly
MOODLE_DB_PASSWORD=your_secure_password

# 분석 DB 연결
DATABASE_URL=postgresql://moodle_user:your_secure_password@localhost:5432/moodle_analysis

# Redis
REDIS_URL=redis://localhost:6379/0

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# 애플리케이션 설정
LOG_LEVEL=INFO
ENVIRONMENT=development
EOF
```

## 실행 및 테스트

### 방법 1: Docker Compose 사용 (권장)

```bash
# .env 파일에 Moodle 연결 정보 설정 필요
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 서비스 확인
curl http://localhost:8000/api/health
```

### 방법 2: 로컬 실행

#### 백엔드 실행

```bash
cd backend
source ../venv/bin/activate  # 가상환경 활성화
python main.py

# 또는 uvicorn 직접 실행
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### 프론트엔드 실행

```bash
cd frontend
npm start
```

### 3. 연결 테스트

#### API 헬스 체크

```bash
curl http://localhost:8000/api/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "moodle_db": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Moodle 데이터 동기화 테스트

```bash
curl -X POST http://localhost:8000/api/sync \
  -H "Content-Type: application/json" \
  -d '{
    "course_ids": [1],
    "sync_students": true,
    "sync_questions": true,
    "sync_attempts": true
  }'
```

#### 문제 분류 테스트

```bash
curl -X POST http://localhost:8000/api/classify/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question_ids": [1, 2, 3],
    "force_reclassify": false
  }'
```

## 데이터베이스 마이그레이션

### 초기 마이그레이션 실행

```bash
cd backend
alembic init alembic
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

## 문제 해결

### Moodle DB 연결 실패

**증상**: "Moodle DB 연결 테스트 실패"

**해결 방법**:
1. Moodle DB 호스트/포트 확인
2. 방화벽 규칙 확인 (MySQL 포트 3306 개방)
3. 사용자 권한 확인:
   ```sql
   SHOW GRANTS FOR 'moodle_readonly'@'%';
   ```

### Anthropic API 오류

**증상**: "AI 분류 실패"

**해결 방법**:
1. API 키 유효성 확인
2. API 할당량 확인
3. 네트워크 연결 확인

### Redis 연결 오류

**증상**: "Redis connection refused"

**해결 방법**:
```bash
# Redis 서비스 상태 확인
sudo systemctl status redis-server

# Redis 재시작
sudo systemctl restart redis-server

# Redis 로그 확인
sudo journalctl -u redis-server -f
```

### 포트 충돌

**증상**: "Address already in use"

**해결 방법**:
```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :8000
sudo lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

## 다음 단계

설치가 완료되었다면:
1. [사용 가이드](USAGE_GUIDE.md) 참조
2. [API 문서](http://localhost:8000/docs) 확인
3. 샘플 데이터로 테스트 실행

## 지원

문제가 발생하면:
- GitHub Issues: [프로젝트 이슈 트래커]
- 이메일: support@example.com
- 문서: [전체 문서 보기](../README.md)
