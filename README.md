# Function Tree - 함수 구조 시각화 교육 도구

수학 함수식의 복잡한 구조를 나무(트리) 형태로 시각화하여 학습자의 이해를 돕는 교육용 웹 애플리케이션입니다.

## 주요 기능

- **함수 구조 시각화**: 복잡한 함수식을 트리 구조로 분해하여 표시
- **인터랙티브 UI**: 각 노드를 클릭하여 상세 정보 확인
- **모바일 반응형**: 스마트폰 화면에 최적화된 UI
- **실시간 파싱**: 수식 입력 시 즉시 트리 구조로 변환

## 기술 스택

### Frontend
- React 18+ with TypeScript
- D3.js (트리 시각화)
- Material-UI (UI 컴포넌트)
- Axios (API 통신)

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL 15+
- Math.js (수식 파싱)

### DevOps
- Docker & Docker Compose
- PostgreSQL (데이터베이스)

## 프로젝트 구조

```
.
├── backend/          # Node.js API 서버
├── frontend/         # React 웹 애플리케이션
├── database/         # DB 스키마 및 마이그레이션
├── docker-compose.yml
└── README.md
```

## 시작하기

### 사전 요구사항
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+

### 설치 및 실행

1. **데이터베이스 시작**
```bash
docker-compose up -d postgres
```

2. **백엔드 서버 실행**
```bash
cd backend
npm install
npm run dev
```

3. **프론트엔드 실행**
```bash
cd frontend
npm install
npm run dev
```

## API 엔드포인트

- `POST /api/functions/parse` - 함수식을 파싱하여 트리 구조 반환
- `GET /api/functions/:id` - 저장된 함수 트리 조회
- `POST /api/functions` - 함수 트리 저장
- `GET /api/problems` - 문제 목록 조회
- `GET /api/problems/:id` - 특정 문제 조회

## Function Tree 예시

입력: `f(x) = sin(2x + 3) * sqrt(x^2 + 1)`

트리 구조:
```
        multiply (*)
       /            \
    sin()          sqrt()
      |               |
    add (+)        add (+)
    /    \         /     \
multiply  3     power    1
  /   \          /  \
 2     x        x    2
```

## 개발 로드맵

- [x] 프로젝트 구조 설정
- [ ] 백엔드 API 개발
- [ ] 데이터베이스 스키마 설계
- [ ] 함수 파싱 엔진 구현
- [ ] React 프론트엔드 구현
- [ ] Function Tree 시각화 컴포넌트
- [ ] 모바일 반응형 UI
- [ ] LMS 연동 (향후)

## 라이선스

KAIST Touch Math Academy
