# Transform Vector 설치 및 설정 가이드

이 문서는 ALT42 Transform Vector 모듈을 처음부터 설치하고 실행하는 방법을 단계별로 안내합니다.

## 📋 사전 준비

### 필수 소프트웨어

1. **Docker Desktop** (추천 방법)
   - Windows: https://www.docker.com/products/docker-desktop/
   - macOS: https://www.docker.com/products/docker-desktop/
   - Linux: https://docs.docker.com/engine/install/

   또는

2. **개별 설치**
   - Node.js 18+: https://nodejs.org/
   - Python 3.11+: https://www.python.org/
   - PostgreSQL 15+: https://www.postgresql.org/

## 🚀 방법 1: Docker로 실행 (가장 쉬움, 추천)

### 1단계: 저장소 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: Docker Compose 실행
```bash
docker-compose up -d
```

이 명령어 하나로 다음이 자동으로 실행됩니다:
- PostgreSQL 데이터베이스 설치 및 초기화
- Python FastAPI 백엔드 서버 시작
- React 프론트엔드 개발 서버 시작

### 3단계: 서비스 확인
```bash
# 모든 컨테이너가 실행 중인지 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

### 4단계: 브라우저에서 접속
- **프론트엔드**: http://localhost:3000
- **백엔드 API 문서**: http://localhost:8000/docs
- **백엔드 API**: http://localhost:8000

### 서비스 중지
```bash
docker-compose down
```

### 완전 삭제 (데이터베이스 포함)
```bash
docker-compose down -v
```

---

## 🔧 방법 2: 수동 설치 (개발자용)

### 1단계: PostgreSQL 설치 및 설정

#### Ubuntu/Debian
```bash
# PostgreSQL 설치
sudo apt update
sudo apt install postgresql postgresql-contrib

# PostgreSQL 시작
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 데이터베이스 생성
sudo -u postgres psql
```

#### macOS
```bash
# Homebrew로 설치
brew install postgresql@15
brew services start postgresql@15

# 데이터베이스 생성
psql postgres
```

#### Windows
1. PostgreSQL 공식 사이트에서 인스톨러 다운로드
2. 설치 후 pgAdmin 또는 psql 사용

#### 데이터베이스 설정 (모든 OS 공통)
```sql
CREATE DATABASE alt42_education;
CREATE USER alt42user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE alt42_education TO alt42user;
\q
```

#### 스키마 초기화
```bash
cd alt42standalone_v1.0
psql -U alt42user -d alt42_education -f database/init.sql
```

### 2단계: 백엔드 설정

```bash
cd backend

# Python 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
# Linux/macOS:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 수정 (텍스트 에디터로)
# DATABASE_URL을 실제 데이터베이스 정보로 변경:
# DATABASE_URL=postgresql+asyncpg://alt42user:your_secure_password@localhost:5432/alt42_education
```

#### 백엔드 서버 실행
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API: http://localhost:8000
- API 문서: http://localhost:8000/docs

### 3단계: 프론트엔드 설정

새 터미널 창을 열고:

```bash
cd frontend

# Node.js 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env

# (선택사항) .env 파일 수정
# VITE_API_URL=http://localhost:8000
```

#### 프론트엔드 서버 실행
```bash
npm run dev
```

서버가 실행되면:
- 프론트엔드: http://localhost:3000

---

## 🧪 설치 확인

### 1. 백엔드 API 테스트
브라우저에서 http://localhost:8000/health 접속
```json
{"status": "healthy"}
```

### 2. 데이터베이스 확인
http://localhost:8000/api/vector-problems/ 접속
샘플 문제 3개가 표시되어야 합니다.

### 3. 프론트엔드 확인
http://localhost:3000 접속
- "벡터 변환 학습 시스템" 페이지가 표시됨
- "새 문제 불러오기" 버튼 클릭 시 문제 로드
- 애니메이션 동작 확인

---

## 🐛 문제 해결

### PostgreSQL 연결 오류
```
sqlalchemy.exc.OperationalError: could not connect to server
```

**해결 방법:**
1. PostgreSQL이 실행 중인지 확인:
   ```bash
   # Linux/macOS
   sudo systemctl status postgresql

   # macOS (Homebrew)
   brew services list
   ```

2. 연결 정보 확인 (backend/.env):
   - 호스트: localhost
   - 포트: 5432 (기본값)
   - 사용자명/비밀번호 확인

### 포트 충돌
```
Error: Port 3000 is already in use
```

**해결 방법:**
다른 포트 사용:
```bash
# 프론트엔드
npm run dev -- --port 3001

# 백엔드
uvicorn app.main:app --reload --port 8001
```

### Docker 컨테이너 오류
```bash
# 모든 컨테이너 중지 및 제거
docker-compose down

# 이미지 재빌드
docker-compose build --no-cache

# 다시 시작
docker-compose up -d
```

### npm install 오류
```bash
# 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 기능 테스트

### 데스크톱 모드
1. http://localhost:3000 접속
2. 난이도 선택 (1-5)
3. "새 문제 불러오기" 클릭
4. "애니메이션 시작" 클릭하여 벡터 변환 확인
5. 변환 결과 예측하여 입력
6. "답안 제출" 클릭

### 스마트폰 모드
1. 상단 툴바에서 "스마트폰" 버튼 클릭
2. 우측 하단에 가상 스마트폰 화면 표시
3. 동일한 기능 테스트

---

## 🔐 프로덕션 배포

### 환경 변수 설정
```bash
# Backend .env
DATABASE_URL=postgresql+asyncpg://user:password@prod-db-host:5432/alt42_education
SECRET_KEY=your-very-secure-secret-key
DEBUG=False
CORS_ORIGINS=https://yourdomain.com

# Frontend .env
VITE_API_URL=https://api.yourdomain.com
```

### 빌드
```bash
# Frontend
cd frontend
npm run build
# dist/ 폴더에 빌드 결과 생성

# Backend
# requirements.txt의 모든 패키지 설치
pip install -r requirements.txt
```

### 배포 옵션
- **Vercel/Netlify**: 프론트엔드 정적 파일
- **Railway/Render**: 백엔드 FastAPI
- **AWS/GCP/Azure**: 전체 스택
- **Docker**: docker-compose를 프로덕션 환경에서 실행

---

## 📞 지원

문제가 해결되지 않으면:
1. GitHub Issues에 문제 등록
2. 로그 파일 첨부 (`docker-compose logs` 또는 터미널 출력)
3. 환경 정보 제공 (OS, 버전 등)

---

**설치가 완료되었습니다! 🎉**
