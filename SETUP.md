# 3D Area Space - 설치 가이드

## 시스템 요구사항

### 필수 소프트웨어
- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **MySQL**: 5.7 (Moodle 데이터베이스)
- **Moodle**: 3.7

### 브라우저 지원
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 상세 설치 가이드

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. Node.js 의존성 설치

```bash
npm install
```

설치되는 주요 패키지:
- `react`, `react-dom`: UI 프레임워크
- `three`, `@react-three/fiber`, `@react-three/drei`: 3D 시각화
- `axios`: HTTP 클라이언트
- `express`: 백엔드 서버
- `mysql2`: MySQL 드라이버
- `tailwindcss`: CSS 프레임워크
- `vite`: 빌드 도구

### 3. MySQL 데이터베이스 설정

#### 3-1. MySQL 서버 확인

```bash
sudo systemctl status mysql
```

MySQL이 실행되지 않는 경우:
```bash
sudo systemctl start mysql
```

#### 3-2. Moodle 데이터베이스 확인

```bash
mysql -u root -p
```

```sql
-- 데이터베이스 목록 확인
SHOW DATABASES;

-- moodle 데이터베이스 선택
USE moodle;

-- 문제 테이블 확인
SHOW TABLES LIKE 'mdl_question%';
```

#### 3-3. 테스트 사용자 생성 (선택사항)

```sql
CREATE USER 'area3d'@'localhost' IDENTIFIED BY 'secure_password';
GRANT SELECT ON moodle.* TO 'area3d'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 환경변수 설정

#### 4-1. .env 파일 생성

```bash
cd server
cp .env.example .env
nano .env  # 또는 선호하는 에디터
```

#### 4-2. .env 파일 내용 설정

```env
# MySQL 연결 정보
DB_HOST=localhost
DB_PORT=3306
DB_USER=area3d
DB_PASSWORD=your_actual_password
DB_NAME=moodle

# 서버 포트
PORT=3001

# 환경 모드
NODE_ENV=development
```

⚠️ **보안 주의사항**: `.env` 파일은 절대 git에 커밋하지 마세요!

### 5. Moodle 데이터 준비 (선택사항)

실제 Moodle 문제를 사용하려면:

#### 5-1. 문제 카테고리 생성

Moodle 관리자 페이지에서:
1. `사이트 관리` → `문제` → `문제 카테고리`
2. 새 카테고리 생성: "넓이 계산" 또는 "Area Calculation"

#### 5-2. 문제 추가

```sql
-- 샘플 문제 추가 (SQL로 직접 삽입)
INSERT INTO mdl_question (
  category,
  name,
  questiontext,
  qtype,
  timecreated,
  timemodified
) VALUES (
  1, -- category ID (넓이 카테고리)
  '직사각형의 넓이',
  '가로 5cm, 세로 3cm인 직사각형의 넓이를 구하세요',
  'numerical',
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP()
);
```

또는 Moodle UI에서 수동으로 추가:
1. `문제 은행` → `새 문제 추가`
2. 문제 유형: `수치형`
3. 문제 내용 입력

### 6. 서버 실행

#### 6-1. 개발 모드 (두 터미널 필요)

**터미널 1 - 백엔드 서버:**
```bash
npm run server
```

출력 예시:
```
🚀 3D Area Space API Server running on http://localhost:3001
📊 Moodle MySQL connection pool created
📡 API endpoints:
   GET  /api/health
   GET  /api/problems
   GET  /api/problems/:id
   POST /api/submit
```

**터미널 2 - 프론트엔드 서버:**
```bash
npm run dev
```

출력 예시:
```
  VITE v5.2.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

#### 6-2. 프로덕션 모드

```bash
# 빌드
npm run build

# 프리뷰
npm run preview

# 백엔드는 PM2로 실행
npm install -g pm2
pm2 start server/index.js --name area3d-api
pm2 save
pm2 startup
```

### 7. 접속 확인

#### 7-1. API 서버 테스트

```bash
curl http://localhost:3001/api/health
```

응답:
```json
{
  "status": "ok",
  "message": "3D Area Space API Server",
  "timestamp": "2025-11-18T..."
}
```

#### 7-2. 문제 목록 테스트

```bash
curl http://localhost:3001/api/problems
```

#### 7-3. 웹 앱 접속

브라우저에서: `http://localhost:3000`

## 문제 해결

### MySQL 연결 오류

**오류**: `Error: connect ECONNREFUSED`

**해결**:
```bash
# MySQL 서비스 시작
sudo systemctl start mysql

# 연결 정보 확인
mysql -u area3d -p
```

### 포트 이미 사용 중

**오류**: `Error: listen EADDRINUSE: address already in use :::3000`

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### npm 의존성 오류

**오류**: `Cannot find module ...`

**해결**:
```bash
# 캐시 정리 및 재설치
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 3D 렌더링 안 됨

**원인**: WebGL 미지원 브라우저

**해결**:
1. Chrome/Firefox 최신 버전으로 업데이트
2. GPU 가속 활성화 확인
3. 크롬: `chrome://gpu` 접속하여 WebGL 상태 확인

### Moodle DB 접근 권한

**오류**: `Access denied for user ...`

**해결**:
```sql
GRANT SELECT ON moodle.* TO 'area3d'@'localhost';
FLUSH PRIVILEGES;
```

## 목업 데이터 모드

Moodle DB 없이 테스트하려면:

`server/index.js`에서 DB 연결 부분 주석 처리되면 자동으로 목업 데이터 사용:
- 직사각형 (5×3 = 15cm²)
- 정사각형 (4×4 = 16cm²)
- 원 (r=3, ≈28.27cm²)

## 성능 최적화

### 개발 환경
- Vite HMR로 빠른 리로드
- React Fast Refresh
- 소스맵 활성화

### 프로덕션 환경
```bash
npm run build
```

최적화 사항:
- Tree shaking
- 코드 분할
- 압축 및 난독화
- CSS 최소화

## 보안 체크리스트

- [ ] `.env` 파일 git 제외 확인
- [ ] MySQL 사용자 최소 권한 (SELECT만)
- [ ] CORS 설정 확인
- [ ] API 입력 검증
- [ ] HTTPS 사용 (프로덕션)

## 다음 단계

1. ✅ 설치 완료
2. 📱 스마트폰에서 반응형 테스트
3. 🎨 문제 추가 및 커스터마이징
4. 🚀 프로덕션 배포

---

문제가 있으면 이슈를 등록해주세요!
