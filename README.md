# LMS Problem Viewer - Compressed Display

LMS와 연동하여 문제를 한 줄로 초압축해서 표시하는 웹 애플리케이션입니다.

## Features

- **한 줄 압축 표시**: 문제를 `[TYPE] Subject • Lv.X • Title` 형식으로 한 줄에 압축 표시
- **클릭으로 상세보기**: 문제를 클릭하면 전체 상세 정보 확장
- **실시간 새로고침**: 문제 목록 실시간 업데이트
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **타입 아이콘**: 문제 유형별 아이콘 표시 (MC, SA, FR, CA, VI, ES, CO)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Axios (API 통신)
- CSS3 (스타일링)

### Backend
- Node.js + Express
- RESTful API
- Mock 데이터 생성기

## Project Structure

```
alt42standalone_v1.0/
├── frontend/                    # React 웹앱
│   ├── src/
│   │   ├── components/
│   │   │   └── ProblemDisplay/
│   │   │       ├── CompressedProblemList.tsx    # 압축 문제 목록 컴포넌트
│   │   │       └── CompressedProblemList.css    # 스타일
│   │   ├── services/
│   │   │   └── problemService.ts                # API 서비스
│   │   ├── utils/
│   │   │   └── problemCompressor.ts             # 문제 압축 유틸리티
│   │   ├── App.tsx                              # 메인 앱
│   │   ├── App.css
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
└── backend/                     # Node.js API
    ├── api/
    │   ├── routes/
    │   │   └── problems.js      # 문제 API 라우트
    │   ├── utils/
    │   │   └── mockData.js      # Mock 데이터 생성
    │   └── server.js            # Express 서버
    └── package.json
```

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install backend dependencies**
```bash
cd backend
npm install
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

## Running the Application

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

Backend server will run on: `http://localhost:3000`

### 2. Start Frontend Dev Server

```bash
cd frontend
npm run dev
```

Frontend will run on: `http://localhost:5173`

## API Endpoints

### Get Problems
```
GET /api/modules/:moduleId/problems?limit=50
```

Response:
```json
{
  "success": true,
  "moduleId": "demo-module-001",
  "count": 50,
  "problems": [
    {
      "id": "demo-module-001-problem-0001",
      "type": "fraction",
      "subject": "Mathematics",
      "difficulty": 1,
      "title": "Add two fractions with different denominators",
      "description": "Given two fractions, find their sum and simplify the result.",
      "data": {
        "numerator1": 3,
        "denominator1": 4,
        "numerator2": 1,
        "denominator2": 2,
        "operation": "add"
      }
    }
  ]
}
```

### Get Single Problem
```
GET /api/modules/:moduleId/problems/:problemId
```

### Submit Answer
```
POST /api/modules/:moduleId/submit
Content-Type: application/json

{
  "problemId": "demo-module-001-problem-0001",
  "answer": { "numerator": 5, "denominator": 4 }
}
```

### Module Status
```
GET /api/modules/:moduleId/status
```

## Problem Compression Format

문제는 다음 형식으로 압축됩니다:

```
[TYPE] Subject • Lv.X • Title (최대 50자)
```

**예시:**
- `[FR] Mathematics • Lv.1 • Add two fractions with different denominators`
- `[MC] Physics • Lv.3 • Identify the correct formula`
- `[CA] Computer Science • Lv.5 • Solve the quadratic equation`

### Problem Type Icons

| Type | Icon | Description |
|------|------|-------------|
| Multiple Choice | [MC] | 객관식 |
| Short Answer | [SA] | 단답형 |
| Fraction | [FR] | 분수 |
| Calculation | [CA] | 계산 |
| Visualization | [VI] | 시각화 |
| Essay | [ES] | 서술형 |
| Coding | [CO] | 코딩 |

## Usage Example

```typescript
import { compressProblem } from './utils/problemCompressor';

const problem = {
  id: 'prob-001',
  type: 'fraction',
  subject: 'Mathematics',
  difficulty: 3,
  title: 'Add two fractions with different denominators',
  description: 'Given 1/3 and 1/4, find the sum.',
  data: { numerator1: 1, denominator1: 3, numerator2: 1, denominator2: 4 }
};

const compressed = compressProblem(problem);
console.log(compressed.compressed);
// Output: "[FR] Mathematics • Lv.3 • Add two fractions with different denominators"
```

## Features in Detail

### 1. Compressed Display
- 문제를 한 줄로 표시하여 화면 공간 절약
- 최대 100개 문제를 스크롤 없이 확인 가능
- 타입, 과목, 난이도, 제목을 한눈에 파악

### 2. Interactive Details
- 문제 클릭 시 상세 정보 토글
- ID, 설명, 데이터 구조 확인
- 부드러운 애니메이션 효과

### 3. Responsive Design
- 모바일: 세로 레이아웃, 작은 폰트
- 태블릿: 중간 크기 레이아웃
- 데스크톱: 전체 기능 활용

### 4. Performance
- 가상 스크롤링 지원 (향후)
- 문제 데이터 캐싱
- 빠른 렌더링

## Development

### Build for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Environment Variables

Create `.env` file in frontend:
```env
VITE_API_URL=http://localhost:3000/api
```

## Related Documentation

이 프로젝트는 다음 PRD를 기반으로 합니다:
- `tasks/0001-prd-ai-education-pipeline.md`

## License

MIT

## Author

AI Education System Team
