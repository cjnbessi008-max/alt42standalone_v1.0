# 닮음 인사이트 (Similarity Insight)

독립형 웹 애플리케이션으로 기하학적 도형의 닮음 관계를 자동으로 분석하고 시각적으로 표시하는 교육용 도구입니다.

## 주요 기능

- **자동 닮음 분석**: 두 도형의 닮음 여부를 자동으로 판별
- **닮음 유형 식별**: SSS, SAS, AA 등 닮음 조건 자동 판별
- **비율 시각화**: 변의 길이와 닮음비를 시각적으로 표시
- **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 표시
- **실시간 애니메이션**: 닮음 도형의 비율 변화를 애니메이션으로 강조

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- HTML5 Canvas (기하학 시각화)

### Backend
- Node.js + Express + TypeScript
- SQLite (데이터베이스)
- Better-SQLite3 (DB 드라이버)

## 시스템 요구사항

- Node.js >= 18.0.0
- npm >= 9.0.0

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 의존성 설치

```bash
# 루트에서 모든 워크스페이스 설치
npm install

# 또는 개별 설치
cd backend && npm install
cd ../frontend && npm install
```

### 3. 환경 변수 설정

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 4. 개발 서버 실행

```bash
# 루트 디렉토리에서 (백엔드 + 프론트엔드 동시 실행)
npm run dev
```

또는 개별 실행:

```bash
# Backend (터미널 1)
cd backend
npm run dev

# Frontend (터미널 2)
cd frontend
npm run dev
```

### 5. 접속

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/api/health

## API 엔드포인트

### Shapes (도형)

- `GET /api/shapes` - 모든 도형 조회
- `GET /api/shapes/:id` - 특정 도형 조회
- `POST /api/shapes` - 새 도형 생성
- `DELETE /api/shapes/:id` - 도형 삭제

### Problems (문제)

- `GET /api/problems` - 모든 문제 조회
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성
- `POST /api/problems/analyze` - 닮음 분석 실행

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # Node.js + Express 백엔드
│   ├── src/
│   │   ├── controllers/       # API 컨트롤러
│   │   ├── database/          # 데이터베이스 설정
│   │   ├── models/            # 타입 정의
│   │   ├── routes/            # API 라우트
│   │   ├── utils/             # 유틸리티 (기하학 계산)
│   │   └── server.ts          # 서버 엔트리포인트
│   └── package.json
├── frontend/                   # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/        # React 컴포넌트
│   │   │   ├── GeometricCanvas.tsx       # Canvas 시각화
│   │   │   ├── SimilarityVisualizer.tsx  # 닮음 분석 UI
│   │   │   └── SmartphoneFrame.tsx       # 스마트폰 프레임
│   │   ├── api/               # API 클라이언트
│   │   ├── types/             # TypeScript 타입
│   │   ├── App.tsx            # 메인 앱
│   │   └── main.tsx
│   └── package.json
├── database/                   # 데이터베이스 스키마
│   └── schema.sql
└── package.json               # 루트 워크스페이스 설정
```

## 주요 알고리즘

### 닮음 판별 알고리즘

1. **SSS (Side-Side-Side)**: 세 변의 비율이 모두 같은 경우
2. **AA (Angle-Angle)**: 두 각의 크기가 같은 경우
3. **SAS (Side-Angle-Side)**: 두 변의 비율과 그 사이각이 같은 경우

### 기하학 계산

- 두 점 간 거리 계산
- 삼각형의 각도 계산 (코사인 법칙 사용)
- 변의 비율 계산 및 비교
- 정규화 및 스케일링

## 데이터베이스 스키마

### geometric_shapes
- 도형의 정보 저장 (이름, 유형, 꼭짓점 좌표)

### similarity_problems
- 닮음 문제 정보 (두 도형 ID, 닮음 여부, 닮음비, 닮음 유형)

### student_solutions
- 학생 답안 저장 (문제 ID, 답안, 정답 여부)

## 샘플 데이터

초기 데이터베이스에는 다음 샘플 데이터가 포함됩니다:

- 2개의 닮은 삼각형
- 2개의 닮음 문제

## 빌드 및 배포

### 프로덕션 빌드

```bash
# 루트에서
npm run build

# 프로덕션 실행
npm start
```

### Docker (선택사항)

```bash
# Docker Compose 사용
docker-compose up -d
```

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy - AI Education System Pipeline

---

**참고**: 이 프로젝트는 교육용 목적으로 개발되었으며, MySQL/PHP/Moodle 대신 최신 기술 스택(PostgreSQL/Python 권장 but SQLite/Node.js로 구현)을 사용하여 독립형 웹앱으로 제작되었습니다.
