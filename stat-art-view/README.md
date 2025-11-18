# Stat Art View - 통계 아트워크 시각화 시스템

Moodle LMS와 연동하여 학습 통계를 아트워크처럼 시각화하는 웹 애플리케이션

## 시스템 구성

```
┌─────────────────────────────────────┐
│  Moodle 3.7 (PHP 7.1.9 + MySQL 5.7) │
│  - 퀴즈/문제 데이터                  │
│  - 학생 응답/성적 데이터             │
└──────────────┬──────────────────────┘
               │ REST API
               ↓
┌─────────────────────────────────────┐
│  Backend (Node.js + Express)        │
│  - Moodle API 연동                  │
│  - 통계 데이터 처리                 │
│  - MySQL 연결                       │
└──────────────┬──────────────────────┘
               │ JSON API
               ↓
┌─────────────────────────────────────┐
│  Frontend (React + D3.js)           │
│  ┌───────────────────────────────┐  │
│  │  우측 하단: 모바일 뷰포트    │  │
│  │  ┌─────────────────────────┐ │  │
│  │  │  Stat Art View          │ │  │
│  │  │  - 원형/방사형 차트     │ │  │
│  │  │  - 데이터 아트 시각화   │ │  │
│  │  │  - 애니메이션 효과      │ │  │
│  │  └─────────────────────────┘ │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## 기술 스택

### Backend
- Node.js 16+
- Express 4.x
- MySQL 5.7 (Moodle DB 연결)
- axios (Moodle API 호출)

### Frontend
- React 18+
- D3.js (데이터 시각화)
- Chart.js (기본 차트)
- Framer Motion (애니메이션)
- TailwindCSS (스타일링)

### DevOps
- Docker & Docker Compose
- Nginx (프록시)

## 주요 기능

### 1. Moodle 데이터 연동
- 퀴즈 문제 정보 조회
- 학생별 응답 데이터 수집
- 정답률, 소요시간 통계

### 2. Stat Art View 시각화
- **방사형 차트**: 과목별/주제별 정답률을 꽃잎 모양으로 표시
- **파티클 애니메이션**: 학습 진도를 움직이는 점들로 표현
- **히트맵 캘린더**: 학습 활동을 예술적 색상으로 표시
- **네트워크 그래프**: 개념 간 연결 관계를 유기적으로 시각화

### 3. 모바일 뷰포트
- 우측 하단 고정 위치
- 스마트폰 화면 비율 (9:19.5)
- 반응형 디자인
- 터치 인터랙션 지원

## 설치 및 실행

### 1. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# Moodle 연결 정보 입력
MOODLE_URL=https://your-moodle.com
MOODLE_TOKEN=your_api_token
DB_HOST=localhost
DB_USER=moodle
DB_PASSWORD=your_password
DB_NAME=moodle
```

### 2. Docker로 실행

```bash
docker-compose up -d
```

### 3. 개발 모드 실행

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## API 엔드포인트

### 통계 데이터 조회
```
GET /api/stats/quiz/:quizId
GET /api/stats/student/:studentId
GET /api/stats/course/:courseId
```

### 응답 예시
```json
{
  "quizId": 123,
  "totalQuestions": 20,
  "averageScore": 85.5,
  "completionRate": 92,
  "timeDistribution": [...],
  "questionStats": [
    {
      "questionId": 1,
      "correctRate": 0.85,
      "avgTime": 45,
      "difficulty": "medium"
    }
  ]
}
```

## 시각화 스타일

### Art Style 1: Radial Bloom (방사형 꽃)
- 중앙: 평균 점수
- 꽃잎: 각 문제의 정답률
- 색상: 난이도 (초록→노랑→빨강)

### Art Style 2: Particle Flow (파티클 흐름)
- 움직이는 점들로 학습 진도 표현
- 크기: 소요 시간
- 속도: 정답률

### Art Style 3: Organic Network (유기적 네트워크)
- 노드: 학습 주제
- 엣지: 연관성
- 두께: 상호작용 빈도

## 라이선스

MIT License

## 기여자

KAIST Touch Math Academy - AI Education System Team
