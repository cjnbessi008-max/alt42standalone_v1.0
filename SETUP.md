# 설치 및 설정 가이드

## 1. 개발 환경 설정

### Node.js 설치 확인
```bash
node --version  # v18.0.0 이상
npm --version   # v9.0.0 이상
```

### 프로젝트 클론
```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

## 2. Anthropic API Key 발급

1. [Anthropic Console](https://console.anthropic.com/) 접속
2. 계정 생성 또는 로그인
3. API Keys 메뉴에서 새 키 생성
4. 생성된 키를 안전하게 복사

## 3. 백엔드 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 파일 생성
cp .env.example .env

# .env 파일 편집
nano .env  # 또는 선호하는 편집기 사용
```

### .env 파일 설정
```env
# 필수: Anthropic API Key
ANTHROPIC_API_KEY=sk-ant-api03-...

# 선택: 서버 설정
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# 선택: LMS 연동 (API가 있는 경우)
LMS_API_URL=https://your-lms-api.com
LMS_API_KEY=your_lms_api_key
```

### 백엔드 실행
```bash
# 개발 모드 (자동 재시작)
npm run dev

# 또는 프로덕션 모드
npm start
```

서버가 정상 작동하면 다음 메시지가 표시됩니다:
```
🚀 LMS Problem Summarizer API running on port 3001
📝 Environment: development
🔑 Anthropic API Key: ✓ Configured
```

## 4. 프론트엔드 설정

새 터미널을 열고:

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 정상 실행되면:
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 5. 동작 확인

### 백엔드 API 테스트
```bash
# 헬스 체크
curl http://localhost:3001/api/health

# 예상 응답:
# {"status":"ok","service":"LMS Problem Summarizer","timestamp":"..."}
```

### 프론트엔드 접속
브라우저에서 http://localhost:5173 접속

## 6. Docker로 실행 (선택사항)

### Docker 설치 확인
```bash
docker --version
docker-compose --version
```

### Docker Compose로 실행
```bash
# 프로젝트 루트에서
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 중지
docker-compose down
```

## 7. 문제 해결

### 포트 충돌
다른 애플리케이션이 3001 또는 5173 포트를 사용 중인 경우:

**백엔드:**
```env
# .env 파일에서
PORT=3002  # 다른 포트로 변경
```

**프론트엔드:**
```typescript
// vite.config.ts에서
server: {
  port: 5174,  // 다른 포트로 변경
}
```

### CORS 오류
백엔드 `.env` 파일의 `CORS_ORIGIN`을 프론트엔드 주소로 정확히 설정:
```env
CORS_ORIGIN=http://localhost:5173
```

### Anthropic API 오류
- API Key가 올바른지 확인
- 계정에 크레딧이 있는지 확인
- API 요청 한도를 초과하지 않았는지 확인

### 모듈 설치 오류
```bash
# 캐시 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

## 8. LMS 연동 설정 (선택사항)

실제 LMS와 연동하려면:

1. LMS API 문서 확인
2. API 엔드포인트 및 인증 정보 획득
3. `.env` 파일에 설정:
   ```env
   LMS_API_URL=https://your-lms.com/api
   LMS_API_KEY=your_api_key
   ```
4. 필요시 `backend/src/services/lmsService.js` 수정

## 9. 프로덕션 배포

### 환경 변수 설정
```env
NODE_ENV=production
```

### 프론트엔드 빌드
```bash
cd frontend
npm run build
# dist/ 폴더가 생성됨
```

### 프로덕션 서버
- Nginx 또는 Apache로 프론트엔드 정적 파일 서빙
- PM2로 백엔드 프로세스 관리
- HTTPS 설정 권장

## 10. 개발 팁

### 자동 재시작
- 백엔드: `nodemon` 사용 (npm run dev)
- 프론트엔드: Vite HMR 자동 활성화

### 코드 포맷팅
```bash
# Prettier 설치 (선택사항)
npm install --save-dev prettier
```

### 디버깅
- Chrome DevTools 사용
- VS Code 디버거 설정
- 백엔드 로그 확인: `console.log` 출력

## 지원

문제가 발생하면 GitHub Issues에 등록하거나 README.md를 참조하세요.
