# Quick Start Guide

## 빠른 시작 (5분 안에!)

### 사전 요구사항
- Node.js 20+
- PostgreSQL 15+
- npm 또는 yarn

### 1단계: 프로젝트 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2단계: 환경 변수 설정

**Backend**
```bash
cd backend
cp .env.example .env
# .env 파일을 열고 데이터베이스 정보 입력
```

**Frontend**
```bash
cd frontend
cp .env.example .env
```

### 3단계: 데이터베이스 설정
```bash
# PostgreSQL 데이터베이스 생성
createdb math_error_detection

# 스키마 적용
psql math_error_detection < database/migrations/001_initial_schema.sql
```

### 4단계: 백엔드 실행
```bash
cd backend
npm install
npm run dev
```

서버가 http://localhost:3001 에서 실행됩니다.

### 5단계: 프론트엔드 실행 (새 터미널)
```bash
cd frontend
npm install
npm run dev
```

앱이 http://localhost:3000 에서 실행됩니다.

### 6단계: 브라우저에서 확인
http://localhost:3000 을 열어 앱을 사용해보세요!

## Docker를 사용한 빠른 시작

```bash
# 환경 변수 설정
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Docker Compose 실행
docker-compose up
```

그게 전부입니다! http://localhost:3000 에서 앱을 확인하세요.

## 테스트 계정

데모 데이터가 자동으로 생성됩니다:
- **학생**: Student One (student1@kaist.ac.kr)
- **교사**: Demo Teacher (teacher@kaist.ac.kr)

## 주요 기능 테스트

### 1. 문제 풀기
1. "연습" 탭으로 이동
2. 문제 유형과 난이도 선택
3. 분수 답안 입력
4. "제출" 클릭
5. 즉각적인 피드백 확인

### 2. 진도 확인
1. "진도" 탭으로 이동
2. 문제 유형별 정답률 확인
3. 오류 패턴 확인

### 3. 분석 대시보드
1. "대시보드" 탭으로 이동
2. 오류 통계 차트 확인
3. 개선 권장사항 확인

## AI 기능 활성화 (선택사항)

Claude AI를 사용한 고급 피드백을 원하신다면:

1. Anthropic API 키 발급: https://console.anthropic.com
2. `backend/.env`에 추가:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```
3. 백엔드 재시작

AI 없이도 기본 피드백이 제공됩니다!

## 문제 해결

### 포트가 이미 사용 중인 경우
```bash
# 백엔드 포트 변경
# backend/.env 에서 PORT=3002 로 변경

# 프론트엔드 포트 변경
# frontend/vite.config.ts 에서 port: 3001 로 변경
```

### 데이터베이스 연결 오류
```bash
# PostgreSQL이 실행 중인지 확인
pg_ctl status

# PostgreSQL 시작
pg_ctl start
```

### npm install 오류
```bash
# 캐시 정리 후 재시도
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 다음 단계

- [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) - 상세 구현 가이드
- [README.md](./README.md) - 전체 프로젝트 문서

## 지원

문제가 발생하면 이슈를 등록하거나 팀에 문의하세요.

Happy coding! 🚀
