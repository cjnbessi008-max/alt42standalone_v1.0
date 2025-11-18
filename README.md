# Set Dance - Interactive Math Learning App

조건에 따라 춤추는 수학 집합 학습 애플리케이션

## 🎯 프로젝트 소개

Set Dance는 Moodle LMS와 연동하여 수학 집합 개념을 시각적으로 학습할 수 있는 인터랙티브 웹 애플리케이션입니다. 우측 하단의 가상 스마트폰 화면에서 조건이 바뀔 때마다 원소들이 애니메이션과 함께 재배열되는 "Set Dance" 효과를 경험할 수 있습니다.

## ✨ 주요 기능

- 🎭 **Set Dance 애니메이션**: 조건 변경 시 원소들이 부드럽게 춤추며 재배열
- 📱 **가상 스마트폰 UI**: 우측 하단에 실제 스마트폰처럼 표시되는 인터페이스
- 🔗 **Moodle LMS 연동**: MySQL 5.7, PHP 7.1.9, Moodle 3.7 환경과 연동 가능
- 🎨 **다양한 조건 지원**: 짝수/홀수, 크기 비교, 범위 등 다양한 조건 제공
- 📊 **실시간 통계**: 원소 개수 및 조건 정보를 실시간으로 표시

## 🛠 기술 스택

- **Frontend**: React 19.2 + TypeScript 5.9
- **Build Tool**: Vite 7.2
- **Animation**: Framer Motion 12.23
- **HTTP Client**: Axios 1.13
- **Backend Integration**: Moodle Web Services API

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 Moodle 연동 정보를 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```
VITE_MOODLE_URL=http://your-moodle-server/moodle
VITE_MOODLE_TOKEN=your_webservice_token
VITE_PORT=3000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 4. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 🎮 사용 방법

### 데모 모드 (Moodle 없이 실행)

애플리케이션은 기본적으로 데모 데이터로 실행됩니다:

1. 좌측 패널에서 문제를 선택
2. 우측 하단 가상 스마트폰 화면에서 Set Dance 애니메이션 확인
3. 조건 변경 버튼으로 다양한 조건 테스트

### Moodle 연동 모드

Moodle Web Services를 설정하고 API 토큰을 발급받은 후:

1. `.env` 파일에 Moodle 서버 URL과 토큰 입력
2. Moodle에서 문제 ID를 전달받아 실행
3. 학생 답안을 Moodle로 자동 제출

## 📂 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── MobileSimulator.tsx    # 가상 스마트폰 UI
│   │   ├── SetDance.tsx           # Set Dance 애니메이션
│   │   └── ProblemSelector.tsx    # 문제 선택기
│   ├── services/           # API 서비스
│   │   └── moodleApi.ts    # Moodle API 연동
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts
│   ├── styles/             # 전역 스타일
│   │   └── index.css
│   ├── App.tsx             # 메인 앱 컴포넌트
│   └── main.tsx            # 엔트리 포인트
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 🔧 Moodle Web Service 설정

### 1. Moodle에서 Web Service 활성화

1. 사이트 관리 → 고급 기능 → "웹 서비스 활성화" 체크
2. 사이트 관리 → 플러그인 → 웹 서비스 → 관리 → REST 프로토콜 활성화

### 2. 커스텀 Web Service 함수 생성 (PHP)

Moodle의 `local` 플러그인에 다음 함수들을 추가:

- `local_setdance_get_problem`: 문제 정보 조회
- `local_setdance_submit_answer`: 답안 제출

### 3. 토큰 생성

1. 사이트 관리 → 웹 서비스 → 토큰 관리
2. 새 토큰 생성 및 `.env` 파일에 추가

## 🎨 커스터마이징

### 새로운 조건 추가

`src/types/index.ts`에 새로운 조건 타입 추가:

```typescript
export interface SetCondition {
  type: 'even' | 'odd' | 'greater' | 'less' | 'range' | 'custom' | 'your-new-type';
  // ... 추가 속성
}
```

`src/components/SetDance.tsx`의 `matchesCondition` 함수에 로직 추가:

```typescript
case 'your-new-type':
  return /* 조건 로직 */;
```

### 색상 및 스타일 변경

각 컴포넌트의 CSS 파일에서 색상과 스타일 커스터마이징 가능:

- `src/components/SetDance.css`: 애니메이션 및 원소 스타일
- `src/components/MobileSimulator.css`: 스마트폰 UI 스타일
- `src/App.css`: 메인 레이아웃 스타일

## 📱 반응형 디자인

- **데스크톱**: 좌측 메인 컨텐츠 + 우측 하단 스마트폰 시뮬레이터
- **태블릿**: 세로 레이아웃으로 자동 전환
- **모바일**: 전체 화면 모드

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

ISC License

## 🙋 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for KAIST Touch Math Academy**
