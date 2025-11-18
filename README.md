# Alt42 Standalone v1.0

독립형 웹앱으로 LMS(Moodle)와 연동하여 문제 정보를 받아 우측 하단 가상 스마트폰 화면에 표시하는 AI 교육 시스템입니다.

## 핵심 기능

### 🎯 Interval Summary (범위 구조 자동 요약)

문제를 읽으면 자동으로 범위/구간 정보를 추출하여 요약합니다:

- **수치 범위**: [10, 20], 5~15 등
- **시간 범위**: 1시간~2시간, 09:00-10:00 등
- **점수 범위**: 80-100점 등
- **신뢰도 측정**: 추출 정확도를 0-100% 로 표시

### 📱 가상 스마트폰 UI

우측 하단에 고정된 가상 스마트폰 화면:
- 실시간 문제 표시
- 자동 Interval Summary 업데이트
- 모던한 iPhone 스타일 UI

### 🔌 LMS 연동 준비

Moodle 3.7 호환 API 구조 (향후 확장 가능)

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빠른 개발 환경)
- CSS3 (모던 디자인)

### Backend
- Node.js + Express + TypeScript
- RESTful API
- 정규표현식 기반 텍스트 파싱

### 호환성
- MySQL 5.7 (향후 DB 연동 시)
- PHP 7.1.9 (Moodle 연동 시)
- Moodle 3.7

## 프로젝트 구조

```
alt42standalone_v1.0/
├── frontend/              # React 프론트엔드
│   ├── src/
│   │   ├── components/   # UI 컴포넌트
│   │   │   ├── VirtualPhone.tsx    # 가상 스마트폰
│   │   │   └── QuestionSelector.tsx # 문제 선택
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/              # Node.js 백엔드
│   ├── src/
│   │   ├── routes/      # API 라우트
│   │   │   ├── questions.ts       # 문제 관리
│   │   │   └── intervals.ts       # Interval 추출
│   │   ├── services/
│   │   │   └── intervalExtractor.ts # 범위 추출 로직
│   │   └── index.ts
│   └── package.json
│
└── shared/              # 공통 타입 정의
    └── types.ts         # TypeScript 인터페이스
```

## 설치 및 실행

### 1. 의존성 설치

```bash
# 백엔드 설치
cd backend
npm install

# 프론트엔드 설치
cd ../frontend
npm install
```

### 2. 백엔드 실행

```bash
cd backend
npm run dev
```

백엔드가 `http://localhost:3001` 에서 실행됩니다.

### 3. 프론트엔드 실행

```bash
cd frontend
npm run dev
```

프론트엔드가 `http://localhost:3000` 에서 실행됩니다.

### 4. 브라우저 접속

`http://localhost:3000` 를 열면 앱이 실행됩니다.

## API 엔드포인트

### 문제 관리

```
GET  /api/questions      # 모든 문제 조회
GET  /api/questions/:id  # 특정 문제 조회
POST /api/questions      # 새 문제 생성
```

### Interval Summary

```
POST /api/intervals/extract  # 문제 텍스트에서 범위 추출
```

**요청 예시:**
```json
{
  "questionId": "q1",
  "content": "10부터 20까지의 정수 중에서..."
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "questionId": "q1",
    "intervals": [
      {
        "type": "numerical_range",
        "start": 10,
        "end": 20,
        "inclusive": { "start": true, "end": true },
        "rawText": "10부터 20까지",
        "context": "...10부터 20까지의 정수 중에서..."
      }
    ],
    "confidence": 0.85,
    "extractedAt": "2025-01-18T..."
  }
}
```

## 향후 확장 계획

### LMS 연동 (Moodle 3.7)

```typescript
// backend/src/services/moodleIntegration.ts
export async function fetchQuestionsFromMoodle(
  moodleUrl: string,
  token: string,
  courseId: number
): Promise<Question[]> {
  // Moodle REST API 호출
  // ...
}
```

### 데이터베이스 연동

PostgreSQL 또는 MySQL 5.7 연동:
- 문제 영구 저장
- 학생 응답 기록
- 학습 진도 추적

### AI 기반 분석

Claude API 통합으로 더 정교한 범위 분석:
- 자연어 이해
- 문맥 기반 범위 추론
- 다국어 지원

## 개발 가이드

### TypeScript 컴파일

```bash
# 백엔드
cd backend
npm run build

# 프론트엔드
cd frontend
npm run build
```

### 프로덕션 빌드

```bash
# 백엔드
cd backend
npm run build
npm start

# 프론트엔드
cd frontend
npm run build
npm run preview
```

## 라이선스

MIT License

## 기여

KAIST Touch Math Academy

---

**문의**: [support@kaist-touchmath.edu]
