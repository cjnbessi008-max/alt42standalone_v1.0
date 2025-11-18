# Divisor Molecules - Interactive Math Learning App

약수 관계를 분자의 움직임으로 시각적으로 학습하는 교육용 웹 애플리케이션

## 프로젝트 개요

**Divisor Molecules**는 초등학생들이 약수의 개념을 직관적으로 이해할 수 있도록 돕는 인터랙티브 웹 앱입니다.
분자들의 움직임과 결합을 통해 약수 관계를 시각화하여 추상적인 수학 개념을 구체적으로 표현합니다.

### 주요 기능

- 🧪 **분자 시각화**: 숫자를 분자로 표현하여 약수 관계를 애니메이션으로 표현
- 📱 **스마트폰 UI**: 가상 스마트폰 화면에 최적화된 사용자 인터페이스
- 🔗 **LMS 연동**: Moodle LMS와 연동하여 문제 데이터 동기화
- 🎮 **인터랙티브 학습**: 드래그앤드롭, 터치 등 직관적인 상호작용

## 기술 스택

### Frontend
- **React 18** + TypeScript
- **Vite** (빌드 도구)
- **Canvas API** (분자 애니메이션)
- **Tailwind CSS** (스타일링)

### Backend
- **Node.js** + Express + TypeScript
- **MySQL 5.7** (데이터베이스)
- **REST API** (Moodle 연동)

### Development
- **Docker** & Docker Compose
- **ESLint** + Prettier

## 프로젝트 구조

```
divisor-molecules/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   ├── services/     # API 통신
│   │   └── utils/        # 유틸리티 함수
│   └── package.json
│
├── backend/              # Node.js 백엔드
│   ├── src/
│   │   ├── controllers/  # 라우트 핸들러
│   │   ├── models/       # 데이터 모델
│   │   ├── routes/       # API 라우트
│   │   └── services/     # 비즈니스 로직
│   └── package.json
│
├── database/             # 데이터베이스 스키마
│   └── schema.sql
│
└── docker-compose.yml    # Docker 설정
```

## 시작하기

### 사전 요구사항

- Node.js 18+
- MySQL 5.7+
- Docker (선택사항)

### 설치

```bash
# 프론트엔드 설치
cd frontend
npm install

# 백엔드 설치
cd ../backend
npm install
```

### 개발 서버 실행

```bash
# 백엔드 실행 (포트 3000)
cd backend
npm run dev

# 프론트엔드 실행 (포트 5173)
cd frontend
npm run dev
```

### Docker로 실행

```bash
docker-compose up -d
```

## 주요 개념

### 약수 분자 (Divisor Molecules)

- 각 숫자는 분자로 표현됩니다
- 약수 관계에 있는 숫자들은 분자가 결합합니다
- 애니메이션을 통해 약수의 개념을 시각적으로 학습합니다

예시:
- 12의 약수: 1, 2, 3, 4, 6, 12
- 화면에서 12 분자는 이러한 약수 분자들과 상호작용합니다

## API 연동

### Moodle LMS 연동

```typescript
// 문제 가져오기
GET /api/moodle/problems/:courseId

// 학습 진행도 업데이트
POST /api/moodle/progress
```

## 환경 변수

`.env` 파일 설정:

```env
# Backend
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=divisor_molecules

# Moodle
MOODLE_URL=https://your-moodle-instance.com
MOODLE_TOKEN=your_moodle_token
```

## 라이센스

MIT License

## 기여

KAIST Touch Math Academy 프로젝트의 일부입니다.

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
