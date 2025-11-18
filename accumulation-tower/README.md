# Accumulation Tower - 적분 타워 학습 앱

Moodle LMS와 연동하여 학습 진도를 시각적으로 표현하는 웹 애플리케이션입니다.

## 📱 주요 기능

- **실시간 타워 시각화**: 학습 점수가 쌓이는 것을 타워 형태로 표현
- **Moodle LMS 연동**: 문제 풀이 정보를 자동으로 수신
- **스마트폰 UI**: 우측 하단에 가상 스마트폰 화면으로 표시
- **실시간 업데이트**: WebSocket을 통한 즉시 반영

## 🛠️ 기술 스택

### Backend
- Node.js 18+
- Express.js
- Socket.io (실시간 통신)
- Axios (Moodle API 연동)

### Frontend
- React 18+
- Canvas API (타워 애니메이션)
- Socket.io-client
- CSS3 (스마트폰 프레임)

### 환경 요구사항
- Moodle 3.7+
- MySQL 5.7+
- Node.js 18+

## 📂 프로젝트 구조

```
accumulation-tower/
├── backend/              # Node.js API 서버
│   ├── src/
│   │   ├── api/         # API 라우트
│   │   ├── services/    # Moodle 연동 서비스
│   │   ├── config/      # 설정 파일
│   │   └── middleware/  # 미들웨어
│   └── package.json
├── frontend/            # React 앱
│   ├── src/
│   │   ├── components/  # React 컴포넌트
│   │   ├── services/    # API 서비스
│   │   ├── hooks/       # Custom hooks
│   │   └── styles/      # CSS 파일
│   └── package.json
└── docs/                # 문서
```

## 🚀 빠른 시작

### 1. Backend 설정

```bash
cd backend
npm install
cp .env.example .env
# .env 파일에서 Moodle 설정 입력
npm run dev
```

### 2. Frontend 설정

```bash
cd frontend
npm install
npm start
```

### 3. 환경 변수 설정

Backend `.env` 파일:
```env
PORT=3001
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_webservice_token
```

## 📖 Moodle 설정

1. Moodle 관리자 페널에서 Web Services 활성화
2. Web Service 토큰 생성
3. 필요한 함수 권한 부여:
   - `core_user_get_users`
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_user_attempts`
   - `gradereport_user_get_grade_items`

## 🎨 사용 방법

1. 학생이 Moodle에서 문제를 풀면
2. Backend가 Moodle API를 통해 점수 정보를 받아옴
3. Socket.io로 Frontend에 실시간 전송
4. Canvas에서 타워가 층층이 쌓이는 애니메이션 표시

## 📝 라이센스

MIT License
