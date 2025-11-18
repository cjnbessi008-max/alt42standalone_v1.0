# Focus Detection Web App

실시간 웹캠 기반 학습 집중도 감지 시스템

## 주요 기능

- 📹 **실시간 웹캠 모니터링**: MediaPipe를 활용한 얼굴 추적
- 👀 **미세한 집중 흔들림 감지**: 시선, 고개 방향, 얼굴 존재 분석
- 📊 **실시간 집중도 스코어**: 0-100점 실시간 점수화
- 📈 **학습 세션 리포트**: 시간대별 집중도 추이 분석
- 👨‍🏫 **교사 대시보드**: 학생별 집중도 모니터링 및 통계
- 💾 **세션 기록**: 학습 세션 자동 저장 및 분석

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 툴)
- MediaPipe Face Mesh & Face Detection
- Tailwind CSS (스타일링)
- Recharts (데이터 시각화)
- Zustand (상태 관리)

### Backend
- FastAPI (Python)
- SQLite (데이터 저장)
- WebSocket (실시간 통신)
- Pydantic (데이터 검증)

## 집중도 감지 알고리즘

1. **얼굴 존재 감지** (30점)
   - 웹캠에 얼굴이 감지되는지 확인
   - 미감지 시 집중도 급락

2. **시선 추적** (40점)
   - 눈동자 위치 분석
   - 화면 중앙 응시 여부 판단

3. **고개 방향** (20점)
   - Pitch, Yaw, Roll 분석
   - 정면 응시 여부 확인

4. **움직임 패턴** (10점)
   - 과도한 움직임 감지
   - 안정적 자세 유지 평가

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Python 3.9+
- 웹캠

### Frontend 실행
```bash
cd frontend
npm install
npm run dev
```

### Backend 실행
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker로 실행
```bash
docker-compose up
```

## 사용법

### 학생 모드
1. 웹앱 접속
2. 이름 입력 및 세션 시작
3. 웹캠 권한 허용
4. 학습 시작 - 실시간 집중도 확인

### 교사 모드
1. `/teacher` 경로 접속
2. 전체 학생 집중도 모니터링
3. 세션 리포트 확인
4. 통계 분석

## 프로젝트 구조

```
focus-detection-app/
├── frontend/              # React 앱
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── services/      # API 서비스
│   │   ├── utils/         # 유틸리티 함수
│   │   └── types/         # TypeScript 타입
│   └── public/
├── backend/               # FastAPI 서버
│   ├── app/
│   │   ├── models/        # 데이터 모델
│   │   ├── routes/        # API 라우트
│   │   ├── services/      # 비즈니스 로직
│   │   └── utils/         # 헬퍼 함수
│   └── tests/
└── README.md
```

## API 엔드포인트

### REST API
- `POST /api/sessions` - 새 학습 세션 시작
- `GET /api/sessions/{id}` - 세션 정보 조회
- `POST /api/focus-data` - 집중도 데이터 저장
- `GET /api/students/{id}/sessions` - 학생별 세션 목록
- `GET /api/reports/{session_id}` - 세션 리포트

### WebSocket
- `ws://localhost:8000/ws/{session_id}` - 실시간 집중도 스트림

## 라이선스

MIT

## 개발자

KAIST Touch Math Academy - AI Education System
