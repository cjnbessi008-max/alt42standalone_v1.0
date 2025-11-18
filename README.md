# KAIST Touch Math Academy - AI Education System Pipeline

도수분포표 부드러운 차오름 애니메이션을 포함한 AI 기반 교육 시스템 파이프라인입니다.

## 프로젝트 개요

이 프로젝트는 KAIST Touch Math Academy를 위한 인터랙티브 교육 콘텐츠 시스템입니다. 교사가 자연어로 요청하면 완전한 교육 모듈을 자동으로 생성하는 AI 파이프라인을 목표로 하고 있습니다.

## 현재 구현 상태

### ✅ 완료된 기능

1. **Frequency Fill Animation** (도수분포표 차오름 애니메이션)
   - React 18 + TypeScript 기반 구현
   - 부드러운 easing 애니메이션
   - 우측 하단 모바일 미리보기
   - LMS (Moodle) 연동 인터페이스

2. **프론트엔드 구조**
   - Vite 기반 빌드 시스템
   - TypeScript 타입 시스템
   - 모듈화된 컴포넌트 구조
   - CSS3 애니메이션

3. **LMS 연동**
   - Moodle 3.7 Web Service API
   - Mock 데이터 모드
   - 문제 데이터 조회/제출

### 🚧 계획 중인 기능

- AI 파이프라인 (Claude API 연동)
- 백엔드 API (Node.js + Express)
- PostgreSQL 데이터베이스
- 자동 UI 생성 시스템

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React 웹 애플리케이션
│   ├── src/
│   │   ├── components/   # 재사용 가능한 컴포넌트
│   │   ├── pages/        # 페이지 컴포넌트
│   │   ├── hooks/        # 커스텀 React 훅
│   │   ├── services/     # API 서비스
│   │   ├── utils/        # 유틸리티 함수
│   │   └── types/        # TypeScript 타입
│   └── README.md
├── tasks/                 # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 시작하기

### 필수 요구사항

- Node.js 18+
- npm 9+

### 설치 및 실행

```bash
# 프론트엔드 실행
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 기술 스택

### 현재 구현
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS3
- **LMS**: Moodle 3.7 (Web Services)
- **Database**: MySQL 5.7 (Moodle)
- **Backend**: PHP 7.1.9 (Moodle)

### 계획
- **AI**: Anthropic Claude API
- **Backend**: Node.js, Express, FastAPI
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **DevOps**: Docker, GitHub Actions

## 주요 기능

### 1. Frequency Fill Animation
- 도수분포표 막대가 부드럽게 차오르는 애니메이션
- 실시간 커스터마이징 (속도, 지연, 색상)
- 모바일 미리보기 화면

### 2. LMS 연동
- Moodle에서 문제 데이터 가져오기
- 학생 답안 제출
- Mock 데이터 모드 (개발용)

### 3. 반응형 디자인
- 데스크탑, 태블릿, 모바일 지원
- 실제 스마트폰 프레임 미리보기

## 환경 변수 설정

`frontend/.env` 파일 생성:

```env
REACT_APP_MOODLE_URL=http://your-moodle-url
REACT_APP_MOODLE_TOKEN=your_token
REACT_APP_USE_MOCK_LMS=true
```

## 개발 가이드

### 컴포넌트 추가

```tsx
// src/components/YourComponent/YourComponent.tsx
import './YourComponent.css';

interface YourComponentProps {
  // props 정의
}

const YourComponent: React.FC<YourComponentProps> = (props) => {
  return <div>Your Component</div>;
};

export default YourComponent;
```

### LMS 데이터 연동

```tsx
import { getLMSService } from './services/lmsService';

const lmsService = getLMSService(true); // Mock 모드
const data = await lmsService.fetchProblemData('problem-001');
```

## 문서

- [프론트엔드 README](frontend/README.md)
- [PRD 문서](tasks/0001-prd-ai-education-pipeline.md)

## 브랜치 전략

- `main`: 프로덕션 브랜치
- `claude/*`: Claude AI 개발 브랜치
- `feature/*`: 기능 개발 브랜치

## 라이선스

KAIST Touch Math Academy

## 기여

프로젝트 관련 문의사항이나 개선 제안은 이슈를 등록해주세요.

---

**개발 상태**: 초기 개발 단계
**현재 브랜치**: `claude/frequency-fill-animation-011Lv9VkaCFaf2e1ygeNkpcz`
**마지막 업데이트**: 2025-11-18
