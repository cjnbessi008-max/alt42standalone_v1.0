# Condition Doors 🚪

**필요조건과 충분조건을 문의 개폐로 배우는 교육용 웹 애플리케이션**

## 📱 프로젝트 개요

Condition Doors는 논리학의 필요조건(necessary condition)과 충분조건(sufficient condition)을 시각적으로 학습할 수 있는 인터랙티브 웹 애플리케이션입니다. 우측 하단에 표시되는 가상 스마트폰 화면에서 두 개의 문을 선택하여 학습하는 방식으로 구성되어 있습니다.

### ✨ 주요 기능

- 🚪 **인터랙티브 문 애니메이션**: 필요조건과 충분조건을 표현하는 두 개의 문
- 📱 **스마트폰 뷰포트**: 실제 스마트폰처럼 보이는 우측 하단 디스플레이
- 🎯 **즉시 피드백**: 문을 열면 정답 여부와 설명 제공
- 📊 **학습 통계**: 정답률 및 진행 상황 추적
- 🔄 **LMS 연동 준비**: REST API를 통한 문제 데이터 관리

## 🏗️ 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** - 빠른 개발 환경
- **Framer Motion** - 부드러운 애니메이션
- **Axios** - API 통신

### Backend
- **Node.js** + Express
- **TypeScript**
- **PostgreSQL 15** - 데이터베이스
- **RESTful API**

### DevOps
- **Docker** + Docker Compose
- **Nginx** - 프로덕션 웹서버

## 🚀 시작하기

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose (선택사항)
- PostgreSQL 15+ (Docker 미사용 시)

### 1. Docker로 실행 (추천)

```bash
# 리포지토리 클론
git clone <repository-url>
cd alt42standalone_v1.0

# Docker Compose로 모든 서비스 실행
docker-compose up -d

# 앱 접속
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database: localhost:5432
```

### 2. 로컬 개발 환경 설정

#### 데이터베이스 설정

```bash
# PostgreSQL 설치 및 실행 후
createdb condition_doors

# 스키마 및 초기 데이터 로드
psql -U postgres -d condition_doors -f database/migrations/001_init.sql
psql -U postgres -d condition_doors -f database/migrations/002_seed_data.sql
```

#### 백엔드 실행

```bash
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

#### 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# 프로덕션 빌드
npm run build
npm run preview
```

## 📖 사용 방법

### 학습자 관점

1. 앱을 실행하면 우측 하단에 스마트폰 화면이 표시됩니다
2. 주어진 전제(P)와 결론(Q)을 확인합니다
3. P와 Q의 관계를 생각하여 올바른 조건의 문을 선택합니다
   - **필요조건**: Q → P (결론이 참이면 전제가 참)
   - **충분조건**: P → Q (전제가 참이면 결론이 참)
4. 문이 열리면서 정답 여부와 설명이 표시됩니다
5. "다음 문제" 버튼으로 새로운 문제를 풀 수 있습니다

### 교육자 관점 (LMS 연동)

Condition Doors는 REST API를 제공하여 외부 LMS와 쉽게 연동할 수 있습니다.

#### API 엔드포인트

```
GET  /api/problems           - 모든 문제 조회
GET  /api/problems/random    - 랜덤 문제 조회
GET  /api/problems/:id       - 특정 문제 조회
POST /api/problems/:id/answer - 답안 제출
GET  /api/problems/stats     - 학습 통계 조회
GET  /health                 - 헬스 체크
```

#### API 사용 예시

```javascript
// 랜덤 문제 가져오기
const response = await fetch('http://localhost:5000/api/problems/random');
const { success, data } = await response.json();

// 문제 구조
{
  "id": "prob_001",
  "title": "비와 구름의 관계",
  "description": "...",
  "premise": "비가 온다",
  "conclusion": "하늘에 구름이 있다",
  "necessaryCondition": {
    "type": "necessary",
    "statement": "Q → P",
    "isCorrect": true
  },
  "sufficientCondition": {
    "type": "sufficient",
    "statement": "P → Q",
    "isCorrect": false
  },
  "explanation": "..."
}

// 답안 제출
await fetch('http://localhost:5000/api/problems/prob_001/answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conditionType: 'necessary',
    isCorrect: true
  })
});
```

## 🗄️ 데이터베이스 스키마

### problems 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | VARCHAR(50) | 문제 고유 ID |
| title | VARCHAR(200) | 문제 제목 |
| description | TEXT | 문제 설명 |
| premise | TEXT | 전제 (P) |
| conclusion | TEXT | 결론 (Q) |
| necessary_statement | TEXT | 필요조건 설명 |
| necessary_is_correct | BOOLEAN | 필요조건 정답 여부 |
| sufficient_statement | TEXT | 충분조건 설명 |
| sufficient_is_correct | BOOLEAN | 충분조건 정답 여부 |
| explanation | TEXT | 해설 |

### answers 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | SERIAL | 답안 고유 ID |
| problem_id | VARCHAR(50) | 문제 ID (FK) |
| condition_type | VARCHAR(20) | 선택한 조건 타입 |
| is_correct | BOOLEAN | 정답 여부 |
| timestamp | TIMESTAMP | 제출 시간 |

## 📚 문제 추가하기

새로운 문제를 추가하려면 데이터베이스에 직접 INSERT하거나, 새 마이그레이션 파일을 작성하세요:

```sql
INSERT INTO problems (
    id, title, description, premise, conclusion,
    necessary_statement, necessary_is_correct,
    sufficient_statement, sufficient_is_correct,
    explanation
) VALUES (
    'prob_009',
    '새 문제 제목',
    '문제 설명',
    '전제 P',
    '결론 Q',
    'Q → P 설명',
    true,  -- 또는 false
    'P → Q 설명',
    false, -- 또는 true
    '정답 해설'
);
```

## 🎨 UI 커스터마이징

### 스마트폰 뷰포트 위치 변경

`frontend/src/App.tsx`:
```tsx
<SmartphoneViewport position="bottom-right"> // 또는 "center"
  <ConditionDoors ... />
</SmartphoneViewport>
```

### 테마 색상 변경

- 메인 그라디언트: `frontend/src/App.css` - `.app` 클래스
- 문 색상: `frontend/src/components/ConditionDoors/ConditionDoors.css` - `.door` 클래스

## 🔌 LMS 연동 가이드

### Moodle 연동 예시

1. **LTI 설정** (향후 구현)
2. **REST API 호출**:
   ```php
   // Moodle 플러그인에서
   $api_url = 'http://condition-doors-server/api/problems/random';
   $response = file_get_contents($api_url);
   $problem = json_decode($response, true);
   ```

### Canvas, Blackboard 등 다른 LMS

REST API는 표준 HTTP/JSON을 사용하므로 모든 LMS에서 통합 가능합니다.

## 🧪 개발 팁

### 핫 리로딩 개발

```bash
# 터미널 1: 백엔드
cd backend && npm run dev

# 터미널 2: 프론트엔드
cd frontend && npm run dev
```

### 데이터베이스 초기화

```bash
# Docker 사용 시
docker-compose down -v
docker-compose up -d

# 로컬 PostgreSQL 사용 시
dropdb condition_doors
createdb condition_doors
psql -U postgres -d condition_doors -f database/migrations/001_init.sql
psql -U postgres -d condition_doors -f database/migrations/002_seed_data.sql
```

## 📦 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConditionDoors/   # 문 애니메이션 컴포넌트
│   │   │   └── SmartphoneViewport/ # 스마트폰 뷰포트
│   │   ├── services/         # API 통신
│   │   ├── types/            # TypeScript 타입 정의
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── backend/                  # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/      # 비즈니스 로직
│   │   ├── routes/           # API 라우트
│   │   ├── models/           # 데이터 모델
│   │   └── server.ts         # Express 서버
│   ├── Dockerfile
│   └── package.json
├── database/                 # 데이터베이스
│   └── migrations/           # SQL 마이그레이션
├── docker-compose.yml        # Docker 오케스트레이션
└── README.md
```

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is part of the KAIST Touch Math Academy educational initiative.

## 💡 개념 정리

### 필요조건 (Necessary Condition)
- **정의**: Q → P (Q이면 P)
- **설명**: 결론 Q가 참이려면 전제 P가 반드시 참이어야 함
- **예시**: "비가 온다" → "구름이 있다"

### 충분조건 (Sufficient Condition)
- **정의**: P → Q (P이면 Q)
- **설명**: 전제 P가 참이면 결론 Q가 반드시 참
- **예시**: "정사각형이다" → "직사각형이다"

### 필요충분조건
- 두 조건이 모두 성립: P ↔ Q
- **예시**: "80점 이상" ↔ "합격" (합격 기준이 80점일 때)

## 🐛 문제 해결

### 포트 충돌
```bash
# 다른 포트 사용
docker-compose down
# docker-compose.yml에서 포트 변경
docker-compose up -d
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker-compose logs postgres

# 백엔드 환경 변수 확인
cat backend/.env
```

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
