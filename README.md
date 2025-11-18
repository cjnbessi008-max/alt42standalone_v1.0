# Break Ripple Animation 🌊

불연속점에서 물결이 끊기는 애니메이션을 통한 수학 개념 시각화 도구

## 프로젝트 개요

KAIST Touch Math Academy의 AI 교육 시스템 파이프라인의 일부로, 수학 함수의 불연속점을 시각적으로 이해할 수 있도록 돕는 인터랙티브 교육 도구입니다.

### 주요 기능

- 📊 **불연속점 시각화**: 점프, 제거 가능, 무한 불연속을 시각적으로 표현
- 🌊 **Break Ripple 애니메이션**: 물결이 불연속점에서 끊기는 효과
- 📱 **스마트폰 미리보기**: 우측 하단에 가상 스마트폰 화면 표시
- 🔗 **LMS 연동**: Moodle 3.7과 연동하여 문제 정보 수신
- 🎓 **교육적 피드백**: 실시간 힌트 및 답변 제출 기능

## 기술 스택

### Frontend
- **React 18+** with TypeScript
- **HTML5 Canvas** for animations
- **Vite** for build tooling
- **CSS3** for styling

### Backend/LMS Integration
- **Moodle 3.7** (LMS)
- **MySQL 5.7** (Database)
- **PHP 7.1.9** (Moodle backend)

## 설치 및 실행

### 사전 요구사항

- Node.js 16+
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 열고 Moodle 설정을 입력하세요
```

### 개발 모드 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열면 애플리케이션이 실행됩니다.

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── SmartphoneFrame.tsx      # 스마트폰 프레임
│   │   ├── BreakRippleAnimation.tsx # 메인 애니메이션
│   │   └── ProblemDisplay.tsx       # 문제 표시
│   ├── types/                # TypeScript 타입 정의
│   │   └── index.ts
│   ├── utils/                # 유틸리티 함수
│   │   └── lmsService.ts     # LMS 연동 서비스
│   ├── styles/               # 스타일시트
│   │   └── global.css
│   ├── App.tsx               # 메인 앱 컴포넌트
│   └── main.tsx              # 진입점
├── public/                   # 정적 파일
├── tasks/                    # 프로젝트 문서
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 불연속점 타입

### 1. 점프 불연속 (Jump Discontinuity)
- 좌극한과 우극한이 존재하지만 서로 다름
- 애니메이션: 물결이 산산조각 남 (Break)

### 2. 제거 가능한 불연속 (Removable Discontinuity)
- 좌극한과 우극한이 같지만 함수값이 정의되지 않음
- 애니메이션: 물결의 진폭이 감소 (Dampen)

### 3. 무한 불연속 (Infinite Discontinuity)
- 함수값이 무한대로 발산
- 애니메이션: 물결이 반사됨 (Reflect)

### 4. 진동 불연속 (Oscillating Discontinuity)
- 함수가 진동하며 극한이 존재하지 않음
- 애니메이션: 물결이 점프 (Jump)

## LMS 연동

### Moodle 웹서비스 설정

1. Moodle 관리자 페이지에서 웹서비스 활성화
2. 외부 서비스 생성: `local_breakripple`
3. 다음 함수들을 추가:
   - `local_breakripple_get_problem`
   - `local_breakripple_submit_answer`
4. 웹서비스 토큰 생성
5. `.env` 파일에 토큰 설정

### API 엔드포인트

#### 문제 가져오기
```
POST /webservice/rest/server.php
Parameters:
  - wstoken: {your_token}
  - wsfunction: local_breakripple_get_problem
  - problemid: {problem_id}
  - moodlewsrestformat: json
```

#### 답안 제출
```
POST /webservice/rest/server.php
Parameters:
  - wstoken: {your_token}
  - wsfunction: local_breakripple_submit_answer
  - problemid: {problem_id}
  - studentid: {student_id}
  - answer: {student_answer}
  - moodlewsrestformat: json
```

## 사용 방법

### 교사용
1. 문제 선택 버튼으로 다양한 불연속점 유형 선택
2. 학생용 뷰를 스마트폰 미리보기로 확인
3. 문제 설명과 힌트를 검토

### 학생용
1. 애니메이션을 관찰
2. 물결이 불연속점에서 어떻게 동작하는지 확인
3. 불연속점의 타입을 답변으로 제출
4. 힌트가 필요하면 힌트 버튼 클릭

## 개발 가이드

### 새로운 불연속점 타입 추가

1. `src/types/index.ts`에 타입 추가:
```typescript
export enum DiscontinuityType {
  // ... 기존 타입
  NEW_TYPE = 'new_type'
}
```

2. `src/utils/lmsService.ts`에 예제 문제 추가

3. `src/components/BreakRippleAnimation.tsx`에 애니메이션 효과 구현

### 커스텀 애니메이션 효과

`BreakRippleAnimation.tsx`의 `handleDiscontinuityEffect` 함수를 수정하여 새로운 효과를 추가할 수 있습니다.

## 스크린샷

### 데스크톱 뷰
- 왼쪽: 문제 정보 및 애니메이션
- 오른쪽: 스마트폰 미리보기

### 스마트폰 뷰
- 최적화된 모바일 레이아웃
- 터치 인터랙션 지원

## 라이선스

MIT License - KAIST Touch Math Academy

## 기여

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요.

## 연락처

- 프로젝트: KAIST Touch Math Academy
- 시스템: AI Education System Pipeline
- 문의: [담당자 이메일]

## 참고 자료

- [Moodle 웹서비스 문서](https://docs.moodle.org/dev/Web_services)
- [Canvas API 문서](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [React TypeScript 가이드](https://react-typescript-cheatsheet.netlify.app/)

---

© 2025 KAIST Touch Math Academy - All Rights Reserved
