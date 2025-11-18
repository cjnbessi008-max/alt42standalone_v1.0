# 📊 Boxplot Snap

LMS 연동 상자그림(Boxplot) 시각화 웹앱 - 부드러운 애니메이션과 함께

## 🎯 주요 기능

- **부드러운 애니메이션**: Framer Motion을 사용한 상자그림 열림/닫힘 애니메이션
- **스마트폰 시뮬레이터**: 우측 하단에 실제 모바일 앱처럼 보이는 가상 스마트폰 화면
- **LMS 연동**: Moodle과 연동 가능한 Mock API (추후 실제 연동 가능)
- **통계 시각화**: 최솟값, 1사분위수, 중앙값, 3사분위수, 최댓값 표시
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 모두 지원

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **Animation**: Framer Motion
- **LMS 연동**: Mock API (Moodle 3.7, PHP 7.1.9, MySQL 5.7 호환)

## 📦 설치 및 실행

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
# 개발 모드로 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 프로덕션 빌드

```bash
# 빌드 생성
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📁 프로젝트 구조

```
boxplot-snap-app/
├── src/
│   ├── components/
│   │   ├── BoxplotSnap.tsx      # 상자그림 애니메이션 컴포넌트
│   │   └── PhoneSimulator.tsx   # 스마트폰 시뮬레이터 컴포넌트
│   ├── services/
│   │   └── mockLMS.ts           # Mock LMS API 서비스
│   ├── App.tsx                  # 메인 앱 컴포넌트
│   ├── index.css                # 전역 스타일
│   └── main.tsx                 # 앱 진입점
├── public/                      # 정적 파일
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎨 주요 컴포넌트

### BoxplotSnap

상자그림을 부드럽게 열고 닫는 애니메이션 컴포넌트

```tsx
<BoxplotSnap
  data={{
    min: 45,
    q1: 68,
    median: 78,
    q3: 88,
    max: 98,
    label: '수학 점수'
  }}
  color="#3b82f6"
/>
```

**기능:**
- 클릭하면 접힌 상태 ↔ 펼쳐진 상태 전환
- 부드러운 스냅 애니메이션 효과
- 통계 값 자동 표시

### PhoneSimulator

실제 스마트폰처럼 보이는 시뮬레이터 컴포넌트

```tsx
<PhoneSimulator position="bottom-right">
  <YourAppContent />
</PhoneSimulator>
```

**위치 옵션:**
- `bottom-right`: 우측 하단 (기본값)
- `bottom-left`: 좌측 하단
- `top-right`: 우측 상단
- `top-left`: 좌측 상단

## 🔗 LMS 연동 가이드

### Mock API 사용 (현재)

현재는 Mock API를 사용하여 LMS 데이터를 시뮬레이션합니다.

```typescript
import { MockLMSService } from './services/mockLMS';

// 모든 문제 가져오기
const problems = await MockLMSService.getAllProblems();

// 특정 문제 가져오기
const problem = await MockLMSService.getProblem('1');
```

### Moodle 실제 연동

Moodle과 실제 연동하려면 `MoodleAPIHelper`를 사용하세요:

```typescript
import { MoodleAPIHelper } from './services/mockLMS';

// Moodle API 설정
const moodleUrl = 'https://your-moodle-site.com';
const token = 'your-moodle-webservice-token';

// 퀴즈 데이터 가져오기
const quizData = await MoodleAPIHelper.getQuizData(quizId);

// 학생 성적 가져오기
const grades = await MoodleAPIHelper.getGrades(courseId);
```

### Moodle 웹서비스 토큰 생성

1. Moodle 관리자로 로그인
2. `사이트 관리 > 플러그인 > 웹 서비스 > 관리`
3. 웹 서비스 활성화
4. 외부 서비스 추가
5. 토큰 생성

## 📊 데이터 형식

### ProblemData 인터페이스

```typescript
interface ProblemData {
  id: string;
  title: string;
  description: string;
  boxplotData: {
    min: number;        // 최솟값
    q1: number;         // 1사분위수
    median: number;     // 중앙값
    q3: number;         // 3사분위수
    max: number;        // 최댓값
    label: string;      // 레이블
  };
  studentScores?: number[];  // 학생 점수 배열 (선택사항)
}
```

## 🎬 애니메이션 커스터마이징

BoxplotSnap 컴포넌트의 애니메이션을 커스터마이징하려면:

```tsx
// src/components/BoxplotSnap.tsx
<motion.rect
  // ... 기존 props
  transition={{
    duration: 0.5,              // 애니메이션 지속 시간
    ease: [0.34, 1.56, 0.64, 1] // 이징 함수 (스냅 효과)
  }}
/>
```

**추천 이징 함수:**
- `ease: "easeInOut"` - 부드러운 전환
- `ease: [0.34, 1.56, 0.64, 1]` - 스냅 효과 (현재)
- `ease: "spring"` - 스프링 효과

## 🌈 스타일 커스터마이징

### 색상 변경

Tailwind 설정에서 색상을 변경할 수 있습니다:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      }
    }
  }
}
```

### Boxplot 색상 변경

```tsx
<BoxplotSnap
  data={data}
  color="#8b5cf6"  // 보라색으로 변경
/>
```

## 📱 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### Netlify 배포

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 배포
netlify deploy --prod
```

## 🔧 트러블슈팅

### Tailwind CSS가 작동하지 않음

```bash
# Tailwind v3 재설치
npm install -D tailwindcss@^3 postcss autoprefixer
```

### 애니메이션이 부드럽지 않음

브라우저의 하드웨어 가속을 활성화하세요:

```css
.animated-element {
  will-change: transform;
  transform: translateZ(0);
}
```

## 📄 라이선스

MIT License

## 👥 기여

Pull Request를 환영합니다!

## 📞 지원

이슈가 있으시면 GitHub Issues에 등록해주세요.

---

Made with ❤️ for KAIST Touch Math Academy
