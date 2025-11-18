# Unit Compass - 단위벡터 학습 나침반

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.2.2-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Moodle-3.7-orange" alt="Moodle">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

Moodle LMS와 연동되는 인터랙티브 단위벡터 학습 웹 애플리케이션입니다. 학생들이 나침반을 조작하듯이 단위벡터의 방향을 배우고 연습할 수 있습니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [Moodle 연동 설정](#moodle-연동-설정)
- [개발 가이드](#개발-가이드)
- [프로젝트 구조](#프로젝트-구조)
- [API 문서](#api-문서)
- [문제 해결](#문제-해결)
- [라이센스](#라이센스)

## 🎯 주요 기능

### 1. 인터랙티브 단위벡터 나침반
- Canvas 기반의 실시간 벡터 시각화
- 마우스/터치로 직관적인 벡터 조작
- 각도와 좌표 실시간 표시
- 목표 각도/벡터 가이드 제공

### 2. Moodle LMS 연동
- Moodle 3.7 Web Services API 통합
- 문제 데이터 자동 로드
- 답안 자동 제출 및 채점
- 학습 진행 상황 추적

### 3. 문제 관리 시스템
- 다양한 난이도 (쉬움/보통/어려움)
- 문제 유형별 분류
- 단계별 힌트 제공
- 시도 횟수 제한

### 4. 진행 상황 추적
- 해결한 문제 수 표시
- 정확도 통계
- 시각적 진행률 바
- 마지막 활동 시간 기록

### 5. 반응형 디자인
- 모바일 프레임 시뮬레이션
- 우측 하단 가상 스마트폰 화면
- 태블릿/데스크톱 최적화
- 접근성 지원 (WCAG 2.1 AA)

## 🛠 기술 스택

### Frontend
- **React 18.2** - UI 프레임워크
- **TypeScript 5.2** - 타입 안전성
- **Vite 5.0** - 빌드 도구
- **Canvas API** - 벡터 시각화
- **Axios** - HTTP 클라이언트

### Backend Integration
- **Moodle 3.7 Web Services API**
- **PHP 7.1.9** (Moodle 서버)
- **MySQL 5.7** (Moodle 데이터베이스)

### Development Tools
- **ESLint** - 코드 품질
- **TypeScript ESLint** - TS 린팅

## 💻 시스템 요구사항

### 개발 환경
- Node.js 18.0 이상
- npm 9.0 이상 또는 yarn 1.22 이상
- 모던 브라우저 (Chrome, Firefox, Safari, Edge 최신 2개 버전)

### 서버 환경
- Moodle 3.7 이상
- PHP 7.1.9 이상
- MySQL 5.7 이상
- Apache 2.4 또는 Nginx 1.18 이상

## 📦 설치 방법

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 의존성 설치

```bash
npm install
# 또는
yarn install
```

### 3. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성:

```env
MOODLE_URL=http://your-moodle-site.com/moodle
VITE_APP_TITLE=Unit Compass
```

### 4. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 `http://localhost:3000` 접속

### 5. 프로덕션 빌드

```bash
npm run build
# 또는
yarn build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 🔗 Moodle 연동 설정

### 1. Moodle Web Services 활성화

1. Moodle 관리자로 로그인
2. **사이트 관리 > 고급 기능**으로 이동
3. **웹 서비스 사용** 체크박스 활성화

### 2. 커스텀 웹 서비스 함수 생성

Moodle에 다음 함수들을 추가해야 합니다:

```php
// mod/unitcompass/externallib.php

class mod_unitcompass_external extends external_api {

    /**
     * Get problem for student
     */
    public static function get_problem($courseid, $activityid, $problemid = '') {
        // Implementation
    }

    /**
     * Submit student answer
     */
    public static function submit_answer($problemid, $userid, $answerx, $answery, $attempt) {
        // Implementation
    }

    /**
     * Get student progress
     */
    public static function get_progress($userid, $courseid) {
        // Implementation
    }
}
```

### 3. 외부 서비스 등록

1. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스**
2. **서비스 추가** 클릭
3. 서비스 이름: `Unit Compass Service`
4. 다음 함수들을 추가:
   - `mod_unitcompass_get_problem`
   - `mod_unitcompass_submit_answer`
   - `mod_unitcompass_get_progress`

### 4. 토큰 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. 사용자 선택
3. 서비스 선택: `Unit Compass Service`
4. 토큰 생성

### 5. 앱에서 접속

URL 형식:
```
http://localhost:3000/?token=YOUR_TOKEN&userid=USER_ID&courseid=COURSE_ID&activityid=ACTIVITY_ID
```

## 🔧 개발 가이드

### 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── UnitCompass.tsx    # 나침반 시각화
│   │   ├── ProblemDisplay.tsx # 문제 표시
│   │   └── ProgressTracker.tsx # 진행 상황
│   ├── services/            # 외부 서비스
│   │   └── moodleService.ts   # Moodle API
│   ├── types/               # TypeScript 타입
│   │   └── index.ts
│   ├── utils/               # 유틸리티 함수
│   │   └── vectorMath.ts      # 벡터 계산
│   ├── App.tsx              # 메인 앱
│   ├── App.css              # 스타일
│   ├── main.tsx             # 엔트리 포인트
│   └── index.css            # 글로벌 스타일
├── public/                  # 정적 파일
├── index.html               # HTML 템플릿
├── package.json             # 의존성
├── tsconfig.json            # TypeScript 설정
├── vite.config.ts           # Vite 설정
└── README.md                # 문서
```

### 주요 컴포넌트

#### UnitCompass
단위벡터 나침반 시각화 컴포넌트

```tsx
<UnitCompass
  targetAngle={Math.PI / 4}  // 목표 각도 (라디안)
  onVectorChange={handleChange}  // 벡터 변경 콜백
  interactive={true}  // 인터랙티브 모드
  size={300}  // 캔버스 크기
  showGrid={true}  // 그리드 표시
  showAngles={true}  // 각도 마커 표시
/>
```

#### ProblemDisplay
문제 표시 및 제출 컴포넌트

```tsx
<ProblemDisplay
  problem={currentProblem}  // 문제 데이터
  onSubmit={handleSubmit}  // 제출 콜백
  currentAnswer={answer}  // 현재 답변
  attemptNumber={1}  // 시도 횟수
  maxAttempts={3}  // 최대 시도
/>
```

#### ProgressTracker
학습 진행 상황 표시

```tsx
<ProgressTracker progress={progressData} />
```

### 벡터 계산 유틸리티

```typescript
import {
  createUnitVector,
  unitVectorFromAngle,
  anglesEqual,
  vectorsEqual,
  formatAngle
} from './utils/vectorMath';

// 단위벡터 생성
const unitVec = createUnitVector(0.707, 0.707);

// 각도로 단위벡터 생성
const vec = unitVectorFromAngle(Math.PI / 4); // 45도

// 각도 비교 (tolerance: 0.05 라디안)
const isEqual = anglesEqual(angle1, angle2, 0.05);

// 벡터 비교 (tolerance: 0.01)
const isSame = vectorsEqual(vec1, vec2, 0.01);

// 각도 포맷팅
const formatted = formatAngle(Math.PI / 4); // "45.0°"
```

### Moodle 서비스 사용

```typescript
import moodleService from './services/moodleService';

// 인증 확인
const isAuth = moodleService.isAuthenticated();

// 문제 가져오기
const response = await moodleService.fetchProblem();
if (response.success) {
  const problem = response.data;
}

// 답안 제출
const submission = {
  problemId: '123',
  studentId: 'user1',
  answer: unitVector,
  timestamp: new Date(),
  isCorrect: true,
  attemptNumber: 1
};
await moodleService.submitAnswer(submission);

// 진행 상황 조회
const progress = await moodleService.getProgress();
```

## 📚 API 문서

### Moodle Web Service Functions

#### mod_unitcompass_get_problem

문제 정보 조회

**Parameters:**
- `wstoken` (string): 인증 토큰
- `courseid` (int): 코스 ID
- `activityid` (int): 활동 ID
- `problemid` (string, optional): 특정 문제 ID

**Response:**
```json
{
  "id": "problem-123",
  "title": "단위벡터 방향 찾기",
  "description": "45도 방향의 단위벡터를 가리켜주세요.",
  "type": "direction",
  "targetangle": 0.785398,
  "difficulty": "easy",
  "hints": ["힌트 1", "힌트 2"],
  "maxattempts": 3
}
```

#### mod_unitcompass_submit_answer

답안 제출

**Parameters:**
- `wstoken` (string): 인증 토큰
- `problemid` (string): 문제 ID
- `userid` (string): 사용자 ID
- `answerx` (float): X 좌표
- `answery` (float): Y 좌표
- `attempt` (int): 시도 번호

**Response:**
```json
{
  "iscorrect": true,
  "feedback": "정답입니다!"
}
```

#### mod_unitcompass_get_progress

학습 진행 상황 조회

**Parameters:**
- `wstoken` (string): 인증 토큰
- `userid` (string): 사용자 ID
- `courseid` (int): 코스 ID

**Response:**
```json
{
  "userid": "user123",
  "problemssolved": 5,
  "totalproblems": 10,
  "accuracy": 0.75,
  "lastactivity": 1700000000
}
```

## 🐛 문제 해결

### 일반적인 문제

#### 1. Moodle 연결 실패

**증상:** "Moodle LMS 연결이 필요합니다" 오류

**해결:**
- URL에 올바른 토큰이 포함되어 있는지 확인
- Moodle Web Services가 활성화되어 있는지 확인
- 브라우저 콘솔에서 CORS 오류 확인
- Moodle 서버의 `config.php`에 다음 추가:
  ```php
  $CFG->webserviceprotocols = 'rest';
  ```

#### 2. 캔버스가 표시되지 않음

**증상:** 나침반이 보이지 않음

**해결:**
- 브라우저가 Canvas API를 지원하는지 확인
- 브라우저 콘솔에서 JavaScript 오류 확인
- 캐시 삭제 후 새로고침

#### 3. 터치 이벤트가 작동하지 않음

**증상:** 모바일에서 나침반 조작 불가

**해결:**
- `touch-action: none` CSS가 적용되어 있는지 확인
- 브라우저 개발자 도구에서 터치 이벤트 확인

### 개발 환경 문제

#### npm install 실패

```bash
# 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

#### TypeScript 오류

```bash
# 타입 정의 재설치
npm install --save-dev @types/react @types/react-dom
```

## 📄 라이센스

MIT License - KAIST Touch Math Academy © 2025

## 👥 개발팀

- **KAIST Touch Math Academy**
- 프로젝트: AI Education System Pipeline
- 문의: [GitHub Issues](https://github.com/yourusername/unit-compass/issues)

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템 파이프라인의 일부입니다.

---

**Made with ❤️ for better mathematics education**
