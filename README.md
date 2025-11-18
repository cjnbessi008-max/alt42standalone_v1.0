# Log Heat - LMS Activity Visualization System

독립형 웹앱으로 LMS(Moodle) 로그 데이터를 실시간으로 시각화하는 시스템입니다.
로그 변화율을 색 온도(Color Temperature)로 표현하여 학습 활동의 강도를 직관적으로 파악할 수 있습니다.

## 주요 기능

- **Log Heat 시각화**: 로그 변화율을 색 온도로 표현 (파란색 → 초록색 → 노란색 → 빨간색)
- **Moodle 연동**: Moodle LMS에서 실시간 로그 데이터 수집
- **가상 스마트폰 UI**: 우측 하단에 모바일 화면 형태로 시각화
- **실시간 업데이트**: 주기적으로 로그 데이터를 갱신하여 최신 상태 유지

## 기술 스택

### Frontend
- React 18+ with TypeScript
- Material-UI
- Chart.js / D3.js (시각화)
- Axios (API 통신)

### Backend
- Node.js with Express
- PostgreSQL 15+ (로그 데이터 저장)
- Moodle REST API 연동

### DevOps
- Docker & Docker Compose
- Nginx (리버스 프록시)

## 색 온도 매핑

| 변화율 | 색상 | 의미 |
|--------|------|------|
| 0-25% | 파란색 (#0066FF) | 낮은 활동 |
| 25-50% | 초록색 (#00FF66) | 보통 활동 |
| 50-75% | 노란색 (#FFCC00) | 높은 활동 |
| 75-100% | 빨간색 (#FF3300) | 매우 높은 활동 |

## 시작하기

### 사전 요구사항

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose (선택사항)
- Moodle 3.7+ (연동 대상)

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 백엔드 설정
cd backend
npm install
cp .env.example .env
# .env 파일에서 Moodle 연동 정보 설정
npm run dev

# 프론트엔드 설정 (새 터미널)
cd frontend
npm install
cp .env.example .env
npm start
```

### Docker로 실행

```bash
docker-compose up -d
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/              # Node.js/Express 백엔드
│   ├── src/
│   │   ├── config/      # 설정 파일
│   │   ├── controllers/ # API 컨트롤러
│   │   ├── services/    # 비즈니스 로직
│   │   ├── models/      # 데이터 모델
│   │   └── routes/      # API 라우트
│   └── package.json
├── frontend/             # React 프론트엔드
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── services/    # API 서비스
│   │   └── utils/       # 유틸리티 함수
│   └── package.json
└── docker-compose.yml   # Docker 구성
```

## API 엔드포인트

- `GET /api/logs` - 로그 데이터 조회
- `GET /api/logs/heatmap` - 로그 히트맵 데이터
- `GET /api/logs/stats` - 로그 통계 정보
- `POST /api/sync` - Moodle 로그 동기화

## 라이선스

MIT License
