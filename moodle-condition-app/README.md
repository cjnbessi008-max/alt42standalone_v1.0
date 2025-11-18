# Moodle Condition Color Bar App

Moodle LMS와 연동하여 문제 정보를 받아 **Condition Color Bar**로 시각화하는 독립형 웹앱입니다.

## 📱 주요 기능

### ✨ Condition Color Bar
문제의 조건(난이도, 상태, 유형)을 색상으로 한눈에 파악할 수 있습니다:

- **난이도 (Difficulty)**
  - 🟢 초록색: 쉬움 (Easy)
  - 🟠 주황색: 보통 (Medium)
  - 🔴 빨강색: 어려움 (Hard)

- **상태 (Status)**
  - ⚪ 회색: 미완료 (Not Started)
  - 🔵 파란색: 진행중 (In Progress)
  - 🟢 초록색: 완료 (Completed)

- **유형 (Type)**
  - 🟣 보라색: 객관식 (Multiple Choice)
  - 🔷 청록색: 단답형 (Short Answer)
  - 🟠 주황색: 계산 (Numerical)
  - 🟤 갈색: 서술형 (Essay)
  - ⚫ 회청색: 참/거짓 (True/False)

### 📲 스마트폰 프레임 UI
- 우측 하단에 가상 스마트폰 화면 형태로 표시
- 반응형 디자인으로 모바일에서도 최적화
- 실제 앱과 같은 네이티브 느낌의 UI/UX

### 📊 문제 관리
- 문제 목록 필터링 (전체, 완료, 진행중, 미완료)
- 각 문제의 점수, 시도 횟수, 소요 시간 표시
- 문제 카드 클릭 시 상세 정보 팝업

## 🛠 기술 스택

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: CSS3 (Custom)
- **State Management**: React Hooks (useState, useEffect)
- **LMS**: Moodle 3.7 (PHP 7.1.9, MySQL 5.7)

## 📂 프로젝트 구조

```
moodle-condition-app/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── ConditionColorBar.tsx      # 색상 바 컴포넌트
│   │   ├── SmartphoneFrame.tsx        # 스마트폰 프레임
│   │   ├── QuestionCard.tsx           # 문제 카드
│   │   └── QuestionList.tsx           # 문제 리스트
│   ├── types/                # TypeScript 타입 정의
│   │   └── moodle.ts                  # Moodle 관련 타입
│   ├── data/                 # Mock 데이터
│   │   └── mockQuestions.ts           # 샘플 문제 데이터
│   ├── services/             # API 서비스
│   │   └── moodleService.ts           # Moodle API 연동
│   ├── App.tsx               # 메인 앱 컴포넌트
│   ├── App.css               # 메인 스타일
│   ├── index.css             # 글로벌 스타일
│   └── main.tsx              # 앱 엔트리 포인트
├── public/                   # 정적 파일
├── dist/                     # 빌드 결과물
└── package.json              # 프로젝트 설정
```

## 🚀 설치 및 실행

### 1. 패키지 설치
```bash
cd moodle-condition-app
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 접속

### 3. 프로덕션 빌드
```bash
npm run build
```
빌드 결과물은 `dist/` 디렉토리에 생성됩니다.

### 4. 빌드 미리보기
```bash
npm run preview
```

## 🔗 Moodle LMS 연동

### Mock 데이터 사용 (현재)
현재는 개발 편의를 위해 Mock 데이터를 사용합니다:
- `src/data/mockQuestions.ts`: 샘플 문제 데이터
- `src/services/moodleService.ts`: Mock API 함수

### 실제 Moodle API 연동

실제 Moodle LMS와 연동하려면:

1. **환경 변수 설정** (`.env` 파일 생성):
```env
VITE_MOODLE_BASE_URL=https://your-moodle-server.com
VITE_MOODLE_API_TOKEN=your_api_token_here
```

2. **`moodleService.ts` 수정**:
```typescript
// Mock 구현 부분을 주석 처리하고
// 실제 API 호출 코드의 주석을 해제하세요

export const getMoodleQuestions = async (): Promise<MoodleQuestion[]> => {
  const response = await fetch(
    `${MOODLE_CONFIG.baseUrl}${MOODLE_CONFIG.endpoints.questions}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        wstoken: MOODLE_CONFIG.apiToken,
        wsfunction: 'mod_quiz_get_quizzes_by_courses',
        moodlewsrestformat: 'json',
      }),
    }
  );

  const data = await response.json();
  return transformMoodleResponse(data);
};
```

3. **Moodle 서버 설정**:
- Moodle에서 Web Services 활성화
- API 토큰 생성
- CORS 설정 (필요시)

## 📱 화면 구성

### 메인 화면
- 배경: 그라데이션 + 패턴
- 중앙: 정보 카드 (Condition Color Bar 설명)
- 우측 하단: 스마트폰 프레임 (문제 리스트)

### 스마트폰 화면
- 상단: 상태바 (시간, 신호, 배터리)
- 헤더: 문제 목록 타이틀 + 카운트
- 필터: 전체/완료/진행중/미완료 탭
- 본문: 스크롤 가능한 문제 카드 리스트
- 하단: 홈 버튼 인디케이터

### 문제 카드
- 제목 + ID
- 카테고리 배지
- 문제 내용
- **Condition Color Bar** (3개 색상 바)
- 통계 정보 (점수, 시도, 소요시간)
- 태그 목록

## 🎨 커스터마이징

### 색상 변경
`src/types/moodle.ts`의 `DEFAULT_COLOR_CONFIG`를 수정:
```typescript
export const DEFAULT_COLOR_CONFIG: ColorConfig = {
  difficulty: {
    easy: '#4CAF50',      // 원하는 색상으로 변경
    medium: '#FF9800',
    hard: '#F44336',
  },
  // ...
};
```

### 스마트폰 프레임 위치 변경
`src/App.tsx`에서 position 속성 변경:
```tsx
<SmartphoneFrame position="bottom-left">  {/* bottom-right, center */}
```

## 🧪 개발 가이드

### 새로운 문제 유형 추가
1. `src/types/moodle.ts`에 타입 추가:
```typescript
export type QuestionType = 'multichoice' | 'shortanswer' | 'new_type';
```

2. `DEFAULT_COLOR_CONFIG`에 색상 추가:
```typescript
type: {
  new_type: '#YOUR_COLOR',
}
```

### 컴포넌트 Props
모든 컴포넌트는 TypeScript interface로 props를 정의합니다:
- `ConditionColorBarProps`: 색상 바 설정
- `SmartphoneFrameProps`: 프레임 위치
- `QuestionCardProps`: 문제 데이터
- `QuestionListProps`: 리스트 설정

## 📄 라이센스

이 프로젝트는 교육용으로 제작되었습니다.

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 📞 지원

문의사항이 있으시면 프로젝트 관리자에게 연락주세요.

---

**Made with ❤️ for Moodle LMS**
