# AI Education System - Substitution Glow

KAIST Touch Math Academy를 위한 AI 기반 교육 시스템으로, 수학 치환 문제를 시각화하고 학습하는 기능을 제공합니다.

## ✨ Substitution Glow 기능

**Substitution Glow**는 수학 방정식에서 변수를 치환하는 과정을 단계별로 시각화하고, 학생의 답변에 따라 실시간 시각적 피드백(글로우 효과)을 제공하는 기능입니다.

### 주요 특징

- 🎯 **단계별 치환 학습**: 복잡한 방정식을 단계별로 나누어 학습
- 🌈 **실시간 글로우 효과**:
  - ✅ 정답: 초록색 글로우
  - ❌ 오답: 빨간색 글로우
  - ⚠️ 부분 정답: 오렌지색 글로우
  - 💡 힌트: 파란색 글로우
- 📱 **반응형 디자인**: 데스크탑, 태블릿, 모바일 모두 지원
- ♿ **접근성**: WCAG 2.1 AA 준수 (고대비 모드, 키보드 네비게이션 지원)
- 🎮 **인터랙티브**: 즉각적인 피드백과 힌트 제공

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/                      # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   └── student/
│   │   │       └── substitution/
│   │   │           └── SubstitutionVisualizer.tsx
│   │   ├── styles/
│   │   │   └── substitution-glow.css
│   │   ├── types/
│   │   │   └── substitution.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── api/                       # Node.js API Gateway
│   │   ├── routes/
│   │   │   └── substitution.js
│   │   ├── server.js
│   │   └── package.json
│   │
│   └── pipeline/                  # Python AI Pipeline (미래 확장)
│       └── requirements.txt
│
├── docker/                        # Docker 설정
├── database/                      # 데이터베이스 스키마
├── docs/                          # 문서
├── tasks/                         # PRD 및 작업 문서
│   └── 0001-prd-ai-education-pipeline.md
├── docker-compose.yml
└── README.md
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn
- (선택) Docker & Docker Compose

### 설치 및 실행

#### 방법 1: 로컬 개발 환경

**1. Frontend 실행**

```bash
cd frontend
npm install
npm run dev
```

Frontend는 http://localhost:3000 에서 실행됩니다.

**2. Backend API 실행**

```bash
cd backend/api
npm install
npm start
```

Backend API는 http://localhost:4000 에서 실행됩니다.

#### 방법 2: Docker Compose (권장)

```bash
docker-compose up
```

모든 서비스가 자동으로 시작됩니다:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## 📖 사용 방법

1. 브라우저에서 http://localhost:3000 접속
2. 문제 목록에서 원하는 치환 문제 선택
3. 단계별로 치환 과정을 진행:
   - 각 단계에서 치환된 식을 입력
   - 정답이면 **초록색 글로우** 효과와 함께 다음 단계로 진행
   - 오답이면 **빨간색 글로우** 효과와 함께 피드백 제공
   - 힌트 버튼으로 도움말 확인 가능
4. 모든 단계를 완료하면 점수 확인

## 🎨 Substitution Glow CSS 애니메이션

### 글로우 효과 종류

```css
/* 성공 - 초록색 */
.glow-success {
  animation: glowGreen 1.5s ease-in-out;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.6);
}

/* 오류 - 빨간색 */
.glow-error {
  animation: glowRed 1.5s ease-in-out;
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.6);
}

/* 부분 정답 - 오렌지색 */
.glow-partial {
  animation: glowOrange 1.5s ease-in-out;
  box-shadow: 0 0 20px rgba(255, 152, 0, 0.6);
}

/* 힌트 - 파란색 */
.glow-hint {
  animation: glowBlue 2s ease-in-out infinite;
  box-shadow: 0 0 15px rgba(33, 150, 243, 0.5);
}
```

## 🔌 API 엔드포인트

### 문제 관리

**GET `/api/substitution/problems`**
- 모든 치환 문제 목록 조회

**GET `/api/substitution/problems/:id`**
- 특정 치환 문제 상세 조회

**POST `/api/substitution/validate`**
- 치환 답안 검증
- Request Body:
  ```json
  {
    "problemId": "basic-substitution-1",
    "stepId": "step-1",
    "userAnswer": "2y = 14"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "validation": {
      "isCorrect": true,
      "status": "correct",
      "glowColor": "green",
      "feedback": "정답입니다! 올바른 치환이에요. 🎉"
    }
  }
  ```

**POST `/api/substitution/submit`**
- 전체 문제 제출 및 점수 계산

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 개발 서버
- **CSS3 Animations** - 글로우 효과

### Backend
- **Node.js** - JavaScript 런타임
- **Express** - API 프레임워크
- **CORS** - Cross-Origin 리소스 공유

### 미래 확장 (PRD 기반)
- **Python + FastAPI** - AI 파이프라인 오케스트레이터
- **Claude API** - AI 추론 엔진
- **PostgreSQL** - 데이터베이스
- **Redis** - 캐싱

## 📚 예제 문제

### 기본 치환 문제
```
초기 방정식: 2(x + 3) = 14

단계 1: (x + 3)을 y로 치환
  2(x + 3) = 14  →  2y = 14

단계 2: 양변을 2로 나눔
  2y = 14  →  y = 7

단계 3: y를 원래 식으로 되돌림
  y = 7  →  x + 3 = 7

단계 4: x의 값 구하기
  x + 3 = 7  →  x = 4
```

## 🧪 테스트

```bash
# Frontend 테스트
cd frontend
npm run lint

# Backend 테스트
cd backend/api
npm test
```

## 📋 TODO

- [ ] Python AI Pipeline 구현
- [ ] Claude API 통합
- [ ] PostgreSQL 데이터베이스 연동
- [ ] 사용자 인증 시스템
- [ ] 문제 자동 생성 기능
- [ ] 학습 진도 추적
- [ ] 다국어 지원 (한국어/영어)

## 🤝 기여

이 프로젝트는 KAIST Touch Math Academy를 위한 AI 교육 시스템의 일부입니다.

## 📄 라이선스

KAIST Touch Math Academy - All Rights Reserved

## 📞 문의

KAIST Touch Math Academy
- Website: [KAIST 웹사이트]
- Email: [연락처 이메일]

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
**Developed by**: AI Agent (Claude) + Development Team
