# Correspondence Lines - Interactive Learning Module

Moodle LMS와 연동되는 대응점 연결 학습 모듈입니다. 학생들이 좌측과 우측의 항목을 선으로 연결하며 학습할 수 있는 인터랙티브 웹 애플리케이션입니다.

## 주요 기능

### ✨ 핵심 기능
- **부드러운 선 그리기**: SVG 기반 Bezier 곡선으로 자연스러운 연결선
- **실시간 인터랙션**: 드래그 앤 드롭으로 직관적인 연결
- **모바일 지원**: 터치 이벤트 완벽 지원 + 우측 하단 스마트폰 시뮬레이터
- **즉각적인 피드백**: 제출 시 정답 여부와 점수 표시
- **행동 추적**: 학생의 모든 상호작용 기록 및 분석

### 📊 관리 기능
- **문제 관리**: 교사용 문제 생성 API
- **통계 분석**: 문제별/학생별 성과 통계
- **Moodle 연동**: 사용자 및 성적 동기화 API
- **재시도 제한**: 시도 횟수 제한 및 타이머

## 기술 스택

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express + TypeScript
- **Database**: MySQL 5.7
- **ORM**: mysql2 (connection pool)

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Drawing**: SVG (네이티브)

### DevOps
- **Container**: Docker + Docker Compose
- **Environment**: MySQL 5.7, Node.js 18

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                  # Node.js API 서버
│   ├── src/
│   │   ├── config/          # 데이터베이스 설정
│   │   ├── controllers/     # 비즈니스 로직
│   │   ├── routes/          # API 라우트
│   │   ├── types/           # TypeScript 타입 정의
│   │   └── index.ts         # 서버 진입점
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # React 웹 앱
│   ├── src/
│   │   ├── components/
│   │   │   ├── CorrespondenceLines/   # 핵심 컴포넌트
│   │   │   │   ├── CorrespondenceLines.tsx
│   │   │   │   ├── LineDrawing.tsx
│   │   │   │   └── CorrespondenceItem.tsx
│   │   │   ├── MobileSimulator/       # 모바일 시뮬레이터
│   │   │   └── FeedbackModal/         # 결과 피드백
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── api/             # API 클라이언트
│   │   ├── types/           # TypeScript 타입
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── database/                 # MySQL 스키마
│   ├── schema.sql           # 테이블 정의
│   └── seed.sql             # 샘플 데이터
│
├── docker-compose.yml       # Docker 설정
└── README.md
```

## 빠른 시작

### 1. Docker로 실행 (권장)

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# Docker Compose로 모든 서비스 시작
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

서비스 URL:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **MySQL**: localhost:3306

### 2. 로컬 개발 환경

#### 사전 요구사항
- Node.js 18+
- MySQL 5.7
- npm or yarn

#### Backend 설정

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 정보 입력

# 개발 서버 시작
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

#### Database 설정

```bash
# MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE correspondence_lines;

# 스키마 적용
mysql -u root -p correspondence_lines < database/schema.sql

# 샘플 데이터 삽입
mysql -u root -p correspondence_lines < database/seed.sql
```

## API 문서

### Problems API

#### GET /api/problems
모든 문제 목록 조회

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Basic English-Korean Vocabulary",
      "description": "Match English words with Korean translations",
      "difficulty_level": 1,
      "time_limit_seconds": 180,
      "max_attempts": 3
    }
  ]
}
```

#### GET /api/problems/:id
특정 문제 상세 조회 (연결 항목 포함)

**Query Parameters:**
- `randomize` (boolean): 항목 순서 무작위화

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Basic English-Korean Vocabulary",
    "left_items": [
      { "id": "left_1", "text": "Apple", "order": 1 }
    ],
    "right_items": [
      { "id": "right_1", "text": "사과", "order": 1 }
    ]
  }
}
```

#### POST /api/answers/submit
학생 답안 제출

**Request Body:**
```json
{
  "student_id": "uuid",
  "problem_id": "uuid",
  "connections": [
    { "leftId": "left_1", "rightId": "right_1" }
  ],
  "time_spent_seconds": 45,
  "interaction_sequence": [
    { "timestamp": 1000, "action": "draw", "leftId": "left_1", "rightId": "right_1" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_correct": true,
    "score": 100,
    "feedback": "🎉 Perfect! All connections are correct!",
    "attempt_number": 1,
    "can_retry": false
  }
}
```

### Moodle Integration API

#### POST /api/moodle/sync-user
Moodle에서 사용자 정보 동기화

#### POST /api/moodle/send-grade
Moodle 성적부에 점수 전송

## Moodle 연동 가이드

### 1. Moodle Web Service 설정

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 관리** 이동
3. 웹 서비스 활성화
4. 토큰 생성:
   - **사이트 관리 > 서버 > 웹 서비스 > 토큰 관리**
   - 새 토큰 생성 후 `.env`에 `MOODLE_API_TOKEN`으로 설정

### 2. 환경 변수 설정

```env
MOODLE_URL=http://your-moodle-instance.com
MOODLE_API_TOKEN=your_generated_token
```

### 3. LTI 통합 (선택사항)

Moodle 활동으로 임베딩하려면:
1. **외부 도구** 활동 추가
2. URL: `http://your-app-url:5173`
3. 소비자 키 및 비밀번호 설정

## 컴포넌트 사용법

### CorrespondenceLines 컴포넌트

```tsx
import CorrespondenceLines from './components/CorrespondenceLines/CorrespondenceLines';

<CorrespondenceLines
  problem={problemData}
  onSubmit={(connections, timeSpent, interactions) => {
    // 답안 제출 처리
    console.log('Connections:', connections);
    console.log('Time spent:', timeSpent, 'seconds');
  }}
  disabled={false}
/>
```

### MobileSimulator 컴포넌트

```tsx
import MobileSimulator from './components/MobileSimulator/MobileSimulator';

<MobileSimulator position="bottom-right">
  <YourAppContent />
</MobileSimulator>
```

## 데이터베이스 스키마

### 주요 테이블

#### `problems`
문제 정보 저장
- 제목, 설명, 난이도
- 시간 제한, 최대 시도 횟수
- Moodle 문제 ID 연동

#### `correspondence_pairs`
정답 쌍 저장
- 좌측/우측 항목 정보
- 텍스트 및 이미지 URL
- 표시 순서

#### `student_answers`
학생 답안 기록
- 연결 내역 (JSON)
- 정답 여부 및 점수
- 소요 시간, 상호작용 시퀀스
- 시도 번호

#### `students`
학생 정보
- Moodle 사용자 ID 연동
- 사용자명, 이메일

### 뷰 (Views)

#### `problem_statistics`
문제별 통계
- 총 학생 수, 시도 횟수
- 평균 점수, 평균 시간
- 정답률

#### `student_progress`
학생별 진척도
- 시도한 문제 수, 정답 문제 수
- 평균 점수, 총 소요 시간

## 개발 가이드

### 새로운 문제 유형 추가

1. **데이터베이스에 문제 삽입**:
```sql
INSERT INTO problems (id, title, description, difficulty_level, ...)
VALUES ('uuid', 'New Problem', 'Description', 2, ...);
```

2. **대응 쌍 추가**:
```sql
INSERT INTO correspondence_pairs (id, problem_id, left_item_id, left_item_text, right_item_id, right_item_text, ...)
VALUES ('uuid', 'problem-uuid', 'left_1', 'Apple', 'right_1', '사과', ...);
```

### 커스터마이징

#### 선 색상 변경
`frontend/src/components/CorrespondenceLines/LineDrawing.tsx`에서:

```tsx
let strokeColor = '#4A90E2'; // 기본 파란색
if (isCorrect === true) strokeColor = '#4CAF50'; // 정답 녹색
if (isCorrect === false) strokeColor = '#F44336'; // 오답 빨간색
```

#### 스마트폰 프레임 스타일
`frontend/src/components/MobileSimulator/MobileSimulator.tsx`에서 수정

## 배포

### Production 빌드

```bash
# Frontend 빌드
cd frontend
npm run build
# dist/ 폴더에 정적 파일 생성

# Backend 빌드
cd backend
npm run build
# dist/ 폴더에 컴파일된 JS 생성
```

### Docker Production

```bash
# Production 모드로 실행
NODE_ENV=production docker-compose up -d
```

## 문제 해결

### 데이터베이스 연결 오류
```bash
# MySQL 컨테이너 로그 확인
docker-compose logs mysql

# 연결 테스트
mysql -h localhost -P 3306 -u appuser -p
```

### CORS 오류
`backend/.env`에서 `CORS_ORIGIN` 확인:
```env
CORS_ORIGIN=http://localhost:5173
```

### 포트 충돌
`docker-compose.yml`에서 포트 변경:
```yaml
ports:
  - "5174:5173"  # Frontend
  - "3002:3001"  # Backend
```

## 라이선스

MIT License

## 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 지원

문의사항이나 버그 리포트는 GitHub Issues를 이용해주세요.

---

**KAIST Touch Math Academy**
Developed for interactive mathematics education
