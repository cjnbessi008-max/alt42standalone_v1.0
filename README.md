# 🌳 Counting Tree Map

**사고 흐름을 나무 형태로 재구성하는 학습 시각화 시스템**

Moodle 3.7 LMS와 연동하여 문제 정보를 받아 학생의 사고 과정을 트리 구조로 시각화합니다. 우측 하단 가상 스마트폰 화면에 모바일 앱을 표시합니다.

---

## 📋 목차

- [기능 개요](#-기능-개요)
- [기술 스택](#-기술-스택)
- [시스템 요구사항](#-시스템-요구사항)
- [설치 및 실행](#-설치-및-실행)
- [프로젝트 구조](#-프로젝트-구조)
- [API 문서](#-api-문서)
- [Moodle 연동](#-moodle-연동)
- [개발 가이드](#-개발-가이드)

---

## ✨ 기능 개요

### 핵심 기능

1. **Tree Map 시각화**
   - 문제를 루트 노드로, 다양한 접근법과 풀이 단계를 자식 노드로 표현
   - React Flow를 사용한 인터랙티브 트리 구조
   - 노드 타입별 색상 구분 (문제/접근법/단계/정답)
   - 실시간 경로 하이라이팅

2. **Moodle LMS 연동**
   - Moodle 3.7 REST API 통합
   - 문제 데이터 자동 수신
   - 성적 자동 제출 (Grade Passback)
   - LTI 1.3 표준 지원

3. **가상 모바일 화면**
   - 우측 하단에 iPhone 스타일 모바일 뷰포트 표시
   - 반응형 디자인
   - 터치 친화적 인터페이스

4. **실시간 동기화**
   - Socket.IO 기반 실시간 통신
   - 학생 진행 상황 실시간 추적
   - 다중 사용자 지원

---

## 🛠 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빠른 개발 환경
- **React Flow** - 트리 시각화
- **Socket.IO Client** - 실시간 통신
- **Axios** - HTTP 클라이언트

### Backend
- **Node.js 18** + **Express**
- **Socket.IO** - WebSocket 서버
- **MySQL 5.7** - 데이터베이스
- **mysql2** - MySQL 드라이버

### DevOps
- **Docker** + **Docker Compose**
- **Git** - 버전 관리

---

## 📦 시스템 요구사항

- **Node.js**: 18.x 이상
- **MySQL**: 5.7
- **Docker** (선택사항)
- **Moodle**: 3.7 (LMS 연동 시)

---

## 🚀 설치 및 실행

### 방법 1: Docker 사용 (권장)

```bash
# 1. 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 접속
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
```

### 방법 2: 수동 설치

#### Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# MySQL 데이터베이스 초기화
mysql -u root -p < models/schema.sql

# 서버 시작
npm run dev
```

#### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # Node.js Backend
│   ├── api/
│   │   └── routes.js          # API 엔드포인트
│   ├── config/
│   │   └── database.js        # DB 연결 설정
│   ├── moodle/
│   │   └── client.js          # Moodle API 클라이언트
│   ├── models/
│   │   └── schema.sql         # 데이터베이스 스키마
│   ├── server.js              # 메인 서버
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── TreeMap/
│   │   │   │   ├── CountingTreeMap.tsx
│   │   │   │   ├── CustomNode.tsx
│   │   │   │   └── TreeMap.css
│   │   │   └── MobileViewport/
│   │   │       ├── MobileViewport.tsx
│   │   │       └── MobileViewport.css
│   │   ├── services/
│   │   │   ├── api.ts         # API 서비스
│   │   │   └── socket.ts      # Socket.IO 서비스
│   │   ├── types/
│   │   │   └── index.ts       # TypeScript 타입 정의
│   │   ├── App.tsx            # 메인 앱
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml          # Docker Compose 설정
├── README.md
└── tasks/
    └── 0001-prd-ai-education-pipeline.md
```

---

## 🔌 API 문서

### REST API Endpoints

#### Health Check
```
GET /api/health
```

#### Moodle Integration
```
POST /api/moodle/launch
Body: {
  "moodle_problem_id": "string",
  "moodle_course_id": number,
  "moodle_user_id": number,
  "question_text": "string",
  "problem_type": "counting" | "arithmetic" | ...,
  "difficulty_level": 1-5
}
```

#### Problems
```
GET    /api/problems              # 모든 문제 조회
GET    /api/problems/:id          # 특정 문제 조회
POST   /api/problems              # 문제 생성
```

#### Tree Nodes
```
GET    /api/tree/:problemId       # 트리 구조 조회
POST   /api/tree/node             # 노드 추가
```

#### Student Sessions
```
POST   /api/session/path          # 경로 기록
GET    /api/session/:id/progress  # 진행 상황 조회
PUT    /api/session/:id/complete  # 세션 완료
```

### Socket.IO Events

#### Client → Server
- `join-session` - 세션 참여
- `navigate-node` - 노드 탐색
- `add-node` - 노드 추가
- `submit-answer` - 답안 제출

#### Server → Client
- `tree-state` - 트리 상태 전송
- `node-visited` - 노드 방문 알림
- `answer-feedback` - 답안 피드백

---

## 🎓 Moodle 연동

### 1. Moodle Web Service 활성화

Moodle 관리자 페이지에서:
1. **Site administration → Plugins → Web services → Manage protocols**
   - REST protocol 활성화

2. **Site administration → Plugins → Web services → Manage tokens**
   - 새 토큰 생성 (사용자별)

### 2. 환경 변수 설정

```env
MOODLE_URL=http://your-moodle-site.com
MOODLE_TOKEN=your_generated_token
MOODLE_SERVICE=moodle_mobile_app
```

### 3. 연동 테스트

```bash
# Backend에서
npm run dev

# 로그에서 확인:
# ✅ Moodle connection successful
```

---

## 👨‍💻 개발 가이드

### 새로운 노드 타입 추가

1. **타입 정의** (`frontend/src/types/index.ts`):
```typescript
export type NodeType = 'problem' | 'approach' | 'step' | 'answer' | 'YOUR_TYPE';
```

2. **색상 추가** (`CountingTreeMap.tsx`):
```typescript
const colors = {
  // ...
  YOUR_TYPE: '#YOUR_COLOR'
};
```

### 새로운 API 엔드포인트 추가

1. **라우터에 추가** (`backend/api/routes.js`):
```javascript
router.get('/your-endpoint', async (req, res) => {
  // 구현
});
```

2. **타입 안전한 서비스 메서드** (`frontend/src/services/api.ts`):
```typescript
async yourMethod(): Promise<YourType> {
  const response = await this.client.get('/your-endpoint');
  return response.data;
}
```

### 데이터베이스 스키마 변경

```sql
-- backend/models/schema.sql에 추가
ALTER TABLE your_table ADD COLUMN new_column VARCHAR(255);
```

---

## 🧪 테스트

### 샘플 데이터 사용

데이터베이스 스키마 파일(`schema.sql`)에 샘플 문제가 포함되어 있습니다:
- 문제 ID: `prob-001`
- 과일 세기 문제 (사과 3개 + 오렌지 5개)

### 로컬 테스트

```bash
# Backend 테스트
cd backend
npm run dev

# Frontend 테스트
cd frontend
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

---

## 📝 라이선스

MIT License

---

## 👥 기여

KAIST Touch Math Academy

---

## 📧 문의

문제 발생 시 GitHub Issues에 등록해주세요.

---

## 🎯 다음 단계

- [ ] LTI 1.3 완전 지원
- [ ] 다국어 지원 (i18n)
- [ ] 분석 대시보드
- [ ] AI 기반 힌트 생성
- [ ] 협업 모드 (다중 학생)
