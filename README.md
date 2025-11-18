# Dynamic Tree LMS Integration

KAIST Touch Math Academy - Dynamic Tree 웹앱 with Moodle Integration

## 개요

Moodle LMS와 연동하여 문제 정보를 받아 동작하는 Dynamic Tree 시각화 웹앱입니다.
트리 구조가 실시간으로 움직이며 경우의 수를 계산하고 표시합니다.

## 주요 기능

- **Moodle 연동**: Moodle 3.7 Web Services API를 통한 문제 데이터 수신
- **Dynamic Tree**: D3.js 기반 애니메이션 트리 시각화
- **경우의 수 계산**: 조합론, 확률 계산 엔진
- **모바일 뷰**: 가상 스마트폰 화면에 최적화된 반응형 UI
- **실시간 인터랙션**: 사용자 입력에 따라 트리가 동적으로 변화

## 기술 스택

### Frontend
- React 18 + TypeScript
- D3.js (트리 시각화)
- Tailwind CSS (스타일링)
- Vite (빌드 도구)

### Backend
- Node.js 18+ / Express
- TypeScript
- MySQL 5.7 (Moodle 호환)
- Moodle Web Services Client

### Environment
- MySQL 5.7
- PHP 7.1.9 (Moodle)
- Moodle 3.7

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React 웹앱
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   │   ├── DynamicTree/      # 트리 시각화
│   │   │   ├── MobileFrame/      # 모바일 프레임
│   │   │   └── ProblemView/      # 문제 표시
│   │   ├── services/      # API 클라이언트
│   │   ├── types/         # TypeScript 타입
│   │   ├── utils/         # 유틸리티 함수
│   │   └── App.tsx
│   └── package.json
├── backend/               # Node.js API 서버
│   ├── src/
│   │   ├── routes/        # API 라우트
│   │   ├── services/
│   │   │   ├── moodle.service.ts    # Moodle 연동
│   │   │   └── tree.service.ts      # 트리 계산 로직
│   │   ├── models/        # 데이터 모델
│   │   └── server.ts
│   └── package.json
├── database/              # MySQL 스키마
│   ├── schema.sql
│   └── seed.sql
├── docs/                  # 문서
└── docker-compose.yml     # 개발 환경
```

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- MySQL 5.7
- Moodle 3.7 설치 및 Web Services 활성화

### 1. 의존성 설치

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. 환경 변수 설정

```bash
# backend/.env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_web_service_token
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=dynamic_tree
PORT=3001
```

### 3. 데이터베이스 설정

```bash
mysql -u root -p < database/schema.sql
```

### 4. 실행

```bash
# Backend (개발 모드)
cd backend
npm run dev

# Frontend (개발 모드)
cd frontend
npm run dev
```

## Moodle 연동 설정

### Web Services 활성화
1. Moodle 관리자 페이지 접속
2. `사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스 관리`
3. 새 서비스 생성: "Dynamic Tree Service"
4. 필요한 함수 추가:
   - `core_course_get_contents`
   - `mod_quiz_get_quiz_by_courses`
   - `mod_quiz_get_user_attempts`

### 토큰 생성
1. `사이트 관리 > 웹 서비스 > 토큰 관리`
2. 사용자 선택 및 서비스 선택
3. 생성된 토큰을 `.env`에 설정

## Dynamic Tree 사용법

### 문제 형식 (Moodle 퀴즈 설명란)
```json
{
  "type": "probability_tree",
  "title": "동전 던지기 확률 트리",
  "levels": 3,
  "nodes": [
    {
      "label": "시작",
      "children": [
        {"label": "앞면", "probability": 0.5},
        {"label": "뒷면", "probability": 0.5}
      ]
    }
  ]
}
```

## 개발 가이드

### Dynamic Tree 커스터마이징
- `frontend/src/components/DynamicTree/TreeEngine.ts` - 트리 렌더링 로직
- `frontend/src/components/DynamicTree/TreeCalculator.ts` - 경우의 수 계산

### API 엔드포인트
- `GET /api/problems/:moodleQuizId` - Moodle에서 문제 가져오기
- `POST /api/tree/calculate` - 트리 계산 수행
- `POST /api/progress/save` - 학습 진행도 저장

## 라이선스
MIT

## 기여
KAIST Touch Math Academy
