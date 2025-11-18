# Divisor Molecules - Quick Start Guide

분자의 움직임으로 약수를 학습하는 인터랙티브 교육 앱 🧪

## 🚀 가장 빠른 시작 방법 (Docker)

### 1. 환경 설정 파일 생성

```bash
cp .env.example .env
```

`.env` 파일을 열어서 기본 설정을 확인하세요. (기본값으로도 실행 가능합니다)

### 2. Docker로 전체 앱 실행

```bash
docker-compose up -d
```

### 3. 브라우저에서 확인

- **앱 실행**: http://localhost:5173
- **API 문서**: http://localhost:3000/api

그게 다입니다! 🎉

---

## 📱 앱 사용 방법

### 게임 방법

1. **중앙의 큰 숫자**가 타겟 숫자입니다
2. **주변의 작은 분자들**을 드래그하여 중앙 숫자로 가져가세요
3. **올바른 약수**를 가져가면 초록색으로 변하며 연결됩니다
4. **모든 약수를 찾으면** 게임 완료!

### 예시

- 타겟: **12**
- 약수: 1, 2, 3, 4, 6, 12
- 각 분자를 드래그하여 중앙의 12와 결합시키세요

---

## 🛠️ 수동 설치 (Docker 없이)

### 1. 데이터베이스 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE divisor_molecules CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;

# 스키마 임포트
mysql -u root -p divisor_molecules < database/schema.sql
```

### 2. 백엔드 실행

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정 (DB 정보 입력)
npm run dev
```

백엔드가 http://localhost:3000 에서 실행됩니다.

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

---

## 🔧 주요 명령어

### Docker 사용 시

```bash
# 앱 시작
docker-compose up -d

# 앱 중지
docker-compose down

# 로그 확인
docker-compose logs -f

# 특정 서비스 재시작
docker-compose restart backend
docker-compose restart frontend
```

### 수동 설치 시

```bash
# 백엔드 개발 모드 (자동 재시작)
cd backend && npm run dev

# 프론트엔드 개발 모드 (자동 리로드)
cd frontend && npm run dev

# 백엔드 프로덕션 빌드
cd backend && npm run build && npm start

# 프론트엔드 프로덕션 빌드
cd frontend && npm run build
```

---

## 🔗 Moodle 연동 (선택사항)

### 1. Moodle 설정

1. Moodle 관리자 페이지에서 **웹 서비스** 활성화
2. **REST 프로토콜** 활성화
3. 새로운 **외부 서비스** 생성
4. 필요한 함수들 추가
5. **토큰** 생성

### 2. 환경 변수 설정

`.env` 파일에 추가:

```env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_token_here
```

### 3. 연동 테스트

```bash
curl http://localhost:3000/api/moodle/course/1
```

자세한 내용은 [docs/SETUP.md](docs/SETUP.md)를 참고하세요.

---

## 📊 API 테스트

### 문제 가져오기

```bash
curl http://localhost:3000/api/problems/random
```

### 학습 진행도 제출

```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "student_001",
    "problemId": "prob_001",
    "score": 95,
    "timeSpent": 85,
    "attempts": 1
  }'
```

---

## ❓ 문제 해결

### 포트가 이미 사용 중입니다

```bash
# 3000 포트 사용 프로세스 확인
lsof -i :3000

# 또는 .env에서 다른 포트 사용
PORT=3001
```

### 데이터베이스 연결 실패

1. MySQL이 실행 중인지 확인
2. `.env` 파일의 DB 정보 확인
3. 데이터베이스가 생성되었는지 확인

### 프론트엔드가 백엔드에 연결 안됨

1. 백엔드가 실행 중인지 확인: `curl http://localhost:3000/api/health`
2. CORS 설정 확인
3. 브라우저 콘솔에서 에러 확인

---

## 📚 더 알아보기

- [상세 설치 가이드](docs/SETUP.md)
- [API 문서](docs/API.md)
- [프로젝트 구조](README.md)

---

## 🎮 즐거운 학습 되세요!

질문이나 문제가 있으면 이슈를 등록해주세요.
