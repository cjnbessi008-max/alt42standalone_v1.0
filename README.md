# Light Interval - 부등식 실수해 시각화 웹앱

부등식의 실수 해를 '빛의 세기'로 표현하는 교육용 독립형 웹앱입니다.

## 🎯 주요 기능

- **부등식 시각화**: 실수 해를 빛의 세기로 직관적으로 표현
- **스마트폰 시뮬레이터**: 우측 하단에 가상 스마트폰 화면 표시
- **Moodle LMS 연동**: 문제 정보를 자동으로 받아서 동작
- **실시간 인터랙션**: 부등식 변경 시 즉시 시각화 업데이트

## 🛠 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- MathJax (수식 렌더링)
- Zustand (상태 관리)

### Backend
- Node.js + Express + TypeScript
- MySQL 5.7
- Moodle API 연동

## 📁 프로젝트 구조

```
light-interval-app/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── PhoneSimulator/    # 스마트폰 UI
│   │   │   ├── LightInterval/     # 빛 시각화
│   │   │   └── InequalityInput/   # 부등식 입력
│   │   ├── services/              # API 통신
│   │   ├── utils/                 # 유틸리티
│   │   └── App.tsx
│   └── package.json
├── backend/               # Node.js API 서버
│   ├── src/
│   │   ├── routes/               # API 라우트
│   │   ├── services/             # 비즈니스 로직
│   │   ├── models/               # 데이터 모델
│   │   └── index.ts
│   └── package.json
├── database/              # MySQL 스키마
│   └── schema.sql
└── docs/                  # 문서
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- MySQL 5.7+
- npm or yarn

### 설치

1. **의존성 설치**
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

2. **데이터베이스 설정**
```bash
mysql -u root -p < database/schema.sql
```

3. **환경 변수 설정**
```bash
# backend/.env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=light_interval
PORT=3001
```

4. **실행**
```bash
# Backend (터미널 1)
cd backend
npm run dev

# Frontend (터미널 2)
cd frontend
npm run dev
```

## 📖 사용 방법

1. 웹 브라우저에서 `http://localhost:5173` 접속
2. 부등식 입력 (예: `x > 2`, `-3 ≤ x < 5`)
3. 우측 하단 스마트폰 화면에서 빛의 세기로 시각화 확인

## 🔗 Moodle 연동

Moodle 3.7 LMS와 연동하여 문제 정보를 자동으로 받아옵니다:

- **API 엔드포인트**: `/api/moodle/problems`
- **인증**: Moodle 토큰 기반 인증
- **지원 문제 유형**: 부등식 문제

## 📝 개발 로드맵

- [x] 프로젝트 구조 설계
- [ ] React 프론트엔드 초기 설정
- [ ] 스마트폰 시뮬레이터 UI
- [ ] 부등식 파싱 및 해석 로직
- [ ] Light Interval 시각화 구현
- [ ] Backend API 서버 구현
- [ ] MySQL 데이터베이스 연동
- [ ] Moodle API 연동
- [ ] 통합 테스트

## 📄 라이선스

MIT License

## 👥 기여

KAIST Touch Math Academy
