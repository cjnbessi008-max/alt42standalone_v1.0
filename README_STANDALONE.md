# 부분합 흐름 시각화 - 독립형 웹앱 (Standalone)

**Moodle 불필요!** 간편한 설치, 오프라인 지원, PWA 기능을 갖춘 독립형 부분합 시각화 시스템

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-blue" />
  <img src="https://img.shields.io/badge/Node.js-18+-green" />
  <img src="https://img.shields.io/badge/SQLite-3-lightgrey" />
  <img src="https://img.shields.io/badge/PWA-Enabled-orange" />
  <img src="https://img.shields.io/badge/TypeScript-5+-blue" />
</p>

## 🌟 주요 특징

### ✅ 완전 독립형
- ❌ Moodle, MySQL, PHP 불필요
- ✅ Node.js + SQLite만으로 실행
- ✅ 한 번의 `npm install`로 설치 완료
- ✅ 로컬 파일 기반 데이터베이스

### 📱 PWA (Progressive Web App)
- 📲 모바일 홈 화면에 설치 가능
- 🔄 오프라인 작동 지원
- ⚡ 빠른 로딩 (Service Worker 캐싱)
- 📱 네이티브 앱처럼 사용

### 🎨 부드러운 곡선 시각화
- 📊 D3.js + Bézier 곡선
- 🎬 실시간 애니메이션
- 🎨 그라디언트 효과
- 📱 반응형 디자인

### 🔐 간단한 인증
- 🔑 JWT 기반 인증
- 👤 학생/교사/관리자 역할
- 🎯 데모 계정 제공
- 💾 로컬 세션 관리

## 🚀 빠른 시작 (5분 설치!)

### 필수 요구사항
- **Node.js** 18+ ([다운로드](https://nodejs.org/))
- **npm** 9+

### 1️⃣ 설치

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. 의존성 설치
npm install

# 3. 환경 변수 복사
cp .env.example .env
```

### 2️⃣ 실행

```bash
# 개발 모드 (Frontend + Backend 동시 실행)
npm run dev
```

Frontend: **http://localhost:3000**
Backend API: **http://localhost:3001**

### 3️⃣ 로그인

#### 데모 계정

**학생 계정:**
- Username: `student`
- Password: `student123`

**관리자 계정:**
- Username: `admin`
- Password: `admin123`

또는 새 계정 회원가입!

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── server/                    # Node.js/Express 백엔드
│   ├── index.js              # 메인 서버
│   ├── models/
│   │   └── Database.js       # SQLite 데이터베이스
│   ├── routes/
│   │   ├── auth.js           # 인증 라우트
│   │   ├── problems.js       # 문제 관리
│   │   ├── attempts.js       # 답안 제출
│   │   └── progress.js       # 진도 추적
│   └── middleware/
├── src/frontend/              # React 프론트엔드
│   ├── StandaloneApp.tsx     # 메인 앱 (로그인 포함)
│   ├── components/
│   │   ├── PartialSumFlowCurve.tsx   # 시각화
│   │   └── VirtualSmartphone.tsx     # 스마트폰 UI
│   ├── services/
│   │   └── StandaloneService.ts      # API 서비스
│   └── styles/
├── data/
│   └── standalone.db         # SQLite 데이터베이스 (자동 생성)
├── public/
│   ├── icons/                # PWA 아이콘
│   └── manifest.json         # PWA 매니페스트
├── package.json
├── vite.config.ts            # Vite + PWA 설정
└── README_STANDALONE.md      # 이 파일
```

## 🎮 사용 방법

### 학생용

1. **로그인** - 데모 계정 또는 새 계정 생성
2. **문제 선택** - 드롭다운에서 원하는 문제 선택
3. **애니메이션 시청** - 부분합이 부드러운 곡선으로 흐르는 것 확인
4. **답안 입력** - 최종 부분합 값 계산하여 입력
5. **제출** - 즉시 정답 여부와 소요 시간 확인
6. **스마트폰 뷰** - 우측 하단에 가상 스마트폰 화면으로 표시

### 교사/관리자용

API를 통해 문제 생성:

```typescript
// 예제: 새 문제 추가
const problem = await standaloneService.createProblem({
  title: '새 문제',
  description: '배열 [1, 2, 3]의 부분합을 계산하세요',
  dataArray: [1, 2, 3],
  expectedAnswer: 6,
  difficulty: 'easy'
});
```

## 📊 API 엔드포인트

### 인증

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 문제

```http
GET    /api/problems            # 모든 문제
GET    /api/problems/:id        # 특정 문제
POST   /api/problems            # 문제 생성 (교사/관리자)
PUT    /api/problems/:id        # 문제 수정
DELETE /api/problems/:id        # 문제 삭제 (관리자)
```

### 답안 제출

```http
POST /api/attempts               # 답안 제출
GET  /api/attempts/problem/:id   # 문제별 시도 기록
GET  /api/attempts/stats         # 통계
```

### 진도

```http
GET /api/progress                # 내 진도
GET /api/progress/leaderboard    # 리더보드
GET /api/progress/student/:id    # 학생 진도 (교사/관리자)
```

## 💾 데이터베이스 스키마

### SQLite 테이블

**users** - 사용자 정보
```sql
- id, username, password (bcrypt)
- firstname, lastname, email
- role (student/teacher/admin)
```

**problems** - 문제 데이터
```sql
- id, title, description
- data_array (JSON), expected_answer
- difficulty (easy/medium/hard)
```

**attempts** - 답안 제출 기록
```sql
- id, student_id, problem_id
- answer, is_correct, time_spent
```

**progress** - 학생 진도
```sql
- student_id, total_problems_attempted
- total_problems_correct, success_rate
```

## 📱 PWA 기능

### 설치 방법

**Chrome (Desktop):**
1. 주소창 우측의 "설치" 아이콘 클릭
2. "설치" 버튼 클릭
3. 데스크톱 앱처럼 실행

**Chrome (Mobile):**
1. 메뉴 → "홈 화면에 추가"
2. 확인
3. 홈 화면의 앱 아이콘으로 실행

### 오프라인 지원

- Service Worker가 자동으로 리소스 캐싱
- 오프라인 상태에서도 UI 작동
- API 요청은 온라인 시 자동 재시도

## 🛠 개발 모드

### Frontend만 실행

```bash
npm run dev:frontend
```

### Backend만 실행

```bash
npm run dev:backend
```

### 동시 실행

```bash
npm run dev
```

## 📦 Production 빌드

```bash
# 1. Frontend 빌드
npm run build

# 2. Production 서버 실행
npm start
```

Production 서버는 포트 3001에서 실행되며, `/dist` 폴더의 정적 파일을 서빙합니다.

## 🔧 환경 변수

`.env` 파일:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_PATH=./data/standalone.db

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRES_IN=24h

# Frontend
VITE_API_URL=http://localhost:3001/api
FRONTEND_URL=http://localhost:3000
```

## 🎨 곡선 타입

3가지 곡선 스타일 지원:

### 1. Smooth (부드러운) - 기본값
Catmull-Rom Spline - 자연스러운 흐름

### 2. Linear (직선)
점들을 직선으로 연결

### 3. Step (계단)
계단 형태로 표시

```tsx
<PartialSumFlowCurve
  data={[1, 2, 3, 4, 5]}
  curveType="smooth"  // 'smooth' | 'linear' | 'step'
/>
```

## 🚀 배포

### Docker로 배포

```bash
docker build -t partial-sum-flow .
docker run -p 3001:3001 partial-sum-flow
```

### Linux 서버 (PM2)

```bash
# PM2 설치
npm install -g pm2

# 빌드
npm run build

# PM2로 실행
pm2 start server/index.js --name partial-sum

# 부팅 시 자동 시작
pm2 startup
pm2 save
```

### Nginx 리버스 프록시

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🐛 트러블슈팅

### Port 충돌

```bash
# 다른 포트 사용
PORT=4000 npm start
```

### SQLite 권한 오류

```bash
# data 디렉토리 권한 확인
chmod 755 data/
chmod 664 data/standalone.db
```

### Service Worker 캐시 문제

```bash
# 브라우저 개발자 도구 → Application → Service Workers
# "Unregister" 클릭 후 페이지 새로고침
```

## 📈 성능 최적화

- ✅ Gzip 압축 (compression middleware)
- ✅ 정적 파일 캐싱 (Service Worker)
- ✅ API 응답 캐싱 (5분)
- ✅ SQLite WAL 모드
- ✅ 코드 스플리팅 (Vite)
- ✅ Tree shaking
- ✅ Lazy loading

## 🔐 보안

- ✅ bcrypt 비밀번호 해싱 (10 rounds)
- ✅ JWT 토큰 인증 (24시간 만료)
- ✅ Helmet.js 보안 헤더
- ✅ Rate limiting (100 req/15min)
- ✅ CORS 설정
- ✅ SQL Injection 방지 (Prepared statements)
- ✅ XSS 방지 (CSP headers)

## 🆚 비교: Moodle vs Standalone

| 기능 | Moodle 버전 | Standalone 버전 |
|------|-------------|-----------------|
| 설치 난이도 | ⭐⭐⭐⭐ | ⭐ |
| 필수 요구사항 | MySQL + PHP + Moodle | Node.js만 |
| 데이터베이스 | MySQL 5.7 | SQLite (파일 기반) |
| 인증 | Moodle 통합 | JWT 자체 인증 |
| 오프라인 | ❌ | ✅ |
| PWA | ❌ | ✅ |
| 모바일 설치 | ❌ | ✅ |
| 백엔드 | PHP 7.1.9 | Node.js/Express |
| 배포 | 복잡 | 간단 |

## 🎯 향후 계획

- [ ] 관리자 대시보드 UI
- [ ] 실시간 리더보드 (WebSocket)
- [ ] 문제 난이도 자동 조정 (AI)
- [ ] 다국어 지원 (i18n)
- [ ] 통계 차트 (Chart.js)
- [ ] 배지 시스템
- [ ] 소셜 로그인 (Google, GitHub)
- [ ] 데이터 내보내기/가져오기 (CSV, JSON)

## 📄 라이센스

MIT License

## 👥 기여자

KAIST Touch Math Academy

## 🙏 감사의 말

- **D3.js** - 데이터 시각화
- **Material-UI** - React UI 컴포넌트
- **better-sqlite3** - SQLite 드라이버
- **Vite** - 빠른 빌드 도구
- **Workbox** - PWA/Service Worker

---

## 📞 문의

문제가 있거나 제안사항이 있으시면 GitHub Issues를 이용해주세요.

---

**Made with ❤️ by KAIST Touch Math Academy**

**완전 독립형 • 설치 간편 • PWA 지원 • 오프라인 작동**
