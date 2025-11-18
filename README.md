# LMS 문제 우선순위 체커

독립형 웹 애플리케이션으로 학습 문제에 우선순위를 표시하고 관리할 수 있는 시스템입니다.

## 주요 기능

### 🎯 우선순위 표시 시스템
- **⭐ 중요**: 반드시 확인해야 할 문제
- **🚩 먼저 풀기**: 우선적으로 풀어야 할 문제
- **📌 복습 필요**: 다시 확인이 필요한 문제

### 👥 이중 모드 지원
- **학생 모드**: 우선순위가 표시된 문제를 확인하고 필터링
- **교수자 모드**: 문제에 우선순위 설정 및 관리

### 🔍 강력한 필터링 기능
- 우선순위별 필터링
- 난이도별 필터링 (쉬움/보통/어려움)
- 과목별 필터링 (수학/영어/과학/역사/프로그래밍)
- 정렬 옵션 (최신순/우선순위순/난이도순)

### 📊 통계 대시보드
- 전체 문제 수
- 우선순위별 문제 수
- 실시간 통계 업데이트

## 기술 스택

### Backend
- **Node.js** + **Express**: REST API 서버
- **TypeScript**: 타입 안정성
- **SQLite** (better-sqlite3): 경량 데이터베이스
- **CORS**: 크로스 오리진 지원

### Frontend
- **React 18** + **TypeScript**: UI 프레임워크
- **Material-UI (MUI)**: 디자인 시스템
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **Axios**: HTTP 클라이언트

## 설치 및 실행

### 1. 의존성 설치

```bash
# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install
```

### 2. 개발 서버 실행

#### 백엔드 서버 (터미널 1)
```bash
cd backend
npm run dev
```
- 서버가 http://localhost:3001 에서 실행됩니다
- API 엔드포인트: http://localhost:3001/api

#### 프론트엔드 서버 (터미널 2)
```bash
cd frontend
npm run dev
```
- 앱이 http://localhost:3000 에서 실행됩니다
- 자동으로 백엔드 API에 프록시됩니다

### 3. 브라우저 접속

http://localhost:3000 을 열어서 애플리케이션을 사용하세요!

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Express 서버 진입점
│   │   ├── database.ts        # SQLite 데이터베이스 초기화
│   │   └── routes/
│   │       └── problems.ts    # 문제 관련 API 라우트
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx            # 메인 앱 컴포넌트
│   │   ├── index.tsx          # React 진입점
│   │   ├── components/
│   │   │   ├── ProblemList.tsx      # 문제 리스트 컨테이너
│   │   │   ├── ProblemItem.tsx      # 개별 문제 카드
│   │   │   └── PriorityFilter.tsx   # 필터링 UI
│   │   └── services/
│   │       └── api.ts         # API 클라이언트
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## API 엔드포인트

### 문제 관리
- `GET /api/problems` - 모든 문제 조회 (필터링 지원)
- `GET /api/problems/:id` - 특정 문제 조회
- `POST /api/problems` - 새 문제 생성
- `PATCH /api/problems/:id/priority` - 우선순위 업데이트
- `DELETE /api/problems/:id` - 문제 삭제

### 통계
- `GET /api/problems/stats/summary` - 통계 정보 조회

### 쿼리 파라미터 (GET /api/problems)
- `priority`: important | solve_first | review
- `difficulty`: easy | medium | hard
- `subject`: mathematics | english | science | history | programming
- `sort`: priority | difficulty | recent

## 데이터 모델

### Problem
```typescript
{
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  priority_flag: 'important' | 'solve_first' | 'review' | null;
  created_at: string;
  updated_at: string;
}
```

## 사용 방법

### 학생 모드
1. 상단 스위치를 "학생 모드"로 설정
2. 우선순위가 표시된 문제 확인
3. 필터를 사용하여 원하는 문제 검색
4. 문제 카드의 우선순위 아이콘 확인:
   - ⭐ 중요
   - 🚩 먼저 풀기
   - 📌 복습 필요

### 교수자 모드
1. 상단 스위치를 "교수자 모드"로 전환
2. 각 문제 카드의 우측 상단 메뉴(⋮) 클릭
3. 원하는 우선순위 선택:
   - 중요 표시
   - 먼저 풀기
   - 복습 필요
   - 우선순위 제거
4. 변경사항이 즉시 반영됨

## 샘플 데이터

앱 최초 실행 시 10개의 샘플 문제가 자동으로 생성됩니다:
- 수학 문제 (분수, 방정식, 미분)
- 영어 문법
- 과학 문제 (물리, 화학)
- 한국사
- 프로그래밍 문제 (반복문, 자료구조, 알고리즘)

## 프로덕션 빌드

### 백엔드
```bash
cd backend
npm run build
npm start
```

### 프론트엔드
```bash
cd frontend
npm run build
npm run preview
```

## 향후 개선 사항

- [ ] 사용자 인증 및 권한 관리
- [ ] 실제 LMS (Canvas, Moodle) 연동
- [ ] 학생별 문제 풀이 기록 추적
- [ ] 문제 추천 알고리즘
- [ ] 실시간 협업 기능
- [ ] 모바일 앱 지원

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다!
