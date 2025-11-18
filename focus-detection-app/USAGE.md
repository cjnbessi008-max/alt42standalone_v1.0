# 사용 가이드

## 🚀 빠른 시작

### 방법 1: Docker로 실행 (권장)

```bash
cd focus-detection-app
./scripts/start-docker.sh
```

또는

```bash
docker-compose up --build
```

### 방법 2: 로컬에서 실행

#### 1. 백엔드 실행

```bash
cd backend

# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 프론트엔드 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📱 접속

- **학생 인터페이스**: http://localhost:3000
- **API 문서**: http://localhost:8000/docs
- **API 헬스체크**: http://localhost:8000/api/health

## 💡 사용 방법

### 학생 사용자

1. 웹 브라우저에서 http://localhost:3000 접속
2. 이름 입력
3. "세션 시작" 버튼 클릭
4. 웹캠 권한 허용
5. 화면을 집중해서 바라보기
6. 실시간으로 집중도 점수 확인
7. 학습 완료 후 "세션 종료" 버튼 클릭

### 집중도 점수 이해하기

- **70-100점 (높은 집중)**: 매우 좋은 집중 상태 👍
- **40-69점 (중간 집중)**: 조금 더 집중 필요
- **0-39점 (낮은 집중)**: 집중력 향상 필요 ⚠️

## 🎯 집중도 측정 원리

시스템은 다음 4가지 요소를 종합하여 집중도를 측정합니다:

1. **얼굴 존재 (30점)**
   - 웹캠에 얼굴이 감지되는지 확인
   - 얼굴이 없으면 0점

2. **시선 방향 (40점)**
   - 눈동자 위치 분석
   - 화면 중앙을 응시할수록 높은 점수

3. **고개 방향 (20점)**
   - 고개의 상하좌우 방향 분석
   - 정면을 향할수록 높은 점수

4. **움직임 안정성 (10점)**
   - 과도한 움직임 감지
   - 안정적인 자세 유지 시 높은 점수

## 🔧 문제 해결

### 웹캠이 작동하지 않아요
- 브라우저에서 카메라 권한을 허용했는지 확인
- 다른 프로그램에서 웹캠을 사용 중인지 확인
- HTTPS 환경에서 실행 (또는 localhost)

### 얼굴이 감지되지 않아요
- 조명이 충분한지 확인
- 카메라를 정면으로 바라보기
- 카메라와의 거리 조절 (50cm~1m 권장)

### 집중도 점수가 너무 낮아요
- 카메라를 눈높이에 맞추기
- 화면 정면을 바라보기
- 고개를 움직이지 않고 안정적인 자세 유지

### 백엔드 연결 오류
- 백엔드 서버가 실행 중인지 확인 (http://localhost:8000/api/health)
- 포트 8000이 이미 사용 중인지 확인
- CORS 설정 확인

## 📊 데이터 저장

- 모든 세션 데이터는 SQLite 데이터베이스에 저장됩니다
- 위치: `backend/focus_detection.db`
- 집중도 데이터는 10초마다 일괄 저장됩니다

## 🔒 개인정보 보호

- 웹캠 영상은 서버에 저장되지 않습니다
- 브라우저에서만 처리됩니다
- 집중도 점수와 통계만 저장됩니다

## 🛠️ 개발자 정보

### API 엔드포인트

#### 세션 관리
- `POST /api/sessions` - 세션 생성
- `GET /api/sessions/{id}` - 세션 조회
- `POST /api/sessions/{id}/end` - 세션 종료
- `POST /api/sessions/{id}/pause` - 세션 일시정지
- `POST /api/sessions/{id}/resume` - 세션 재개

#### 집중도 데이터
- `POST /api/focus-data` - 집중도 데이터 저장
- `POST /api/focus-data/batch` - 일괄 저장
- `GET /api/focus-data/{session_id}` - 세션별 데이터 조회

#### 리포트
- `GET /api/reports/{session_id}` - 세션 리포트 생성

#### WebSocket
- `WS /ws/{session_id}` - 실시간 집중도 스트림

### 기술 스택

**Frontend**
- React 18 + TypeScript
- MediaPipe Face Mesh
- Tailwind CSS
- Recharts

**Backend**
- FastAPI (Python)
- SQLAlchemy (ORM)
- SQLite
- WebSocket

## 📝 라이선스

MIT License

## 👥 기여

이슈와 풀 리퀘스트를 환영합니다!
