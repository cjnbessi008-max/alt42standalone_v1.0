# Alt42 Standalone - Term Slide Animation

Moodle LMS와 연동하여 문제 정보를 받아 우측 하단 가상 스마트폰 화면에 부드러운 슬라이드 애니메이션으로 표시하는 웹 애플리케이션입니다.

## 주요 기능

- **부드러운 Term Slide 애니메이션**: Framer Motion을 활용한 자연스러운 슬라이드 전환
- **가상 스마트폰 화면**: 우측 하단에 위치한 사실적인 스마트폰 UI
- **Moodle 3.7 연동**: PHP 7.1.9, MySQL 5.7 기반 Moodle LMS와 연동
- **키보드 네비게이션**: 화살표 키, Space 키로 문제 간 이동
- **진행률 표시**: 현재 문제 위치와 전체 진행률 시각화

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **애니메이션**: Framer Motion
- **빌드 도구**: Vite
- **스타일링**: CSS3 (Custom Styles)
- **LMS 연동**: Moodle Web Services API
- **백엔드**: PHP 7.1.9 (Moodle)
- **데이터베이스**: MySQL 5.7

## 설치 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
npm run preview
```

## Moodle 연동 설정

### 1. Moodle Web Services 활성화

Moodle 관리자 패널에서:
1. `사이트 관리 > 플러그인 > 웹 서비스 > 웹 서비스 관리`로 이동
2. "웹 서비스 활성화" 옵션 체크
3. REST 프로토콜 활성화

### 2. 토큰 생성

1. `사이트 관리 > 서버 > 웹 서비스 > 토큰 관리`
2. 새 토큰 생성
3. 필요한 권한 부여:
   - `mod_quiz_get_quizzes_by_courses`
   - `mod_quiz_get_quiz_questions`
   - `core_webservice_get_site_info`

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
VITE_MOODLE_URL=https://your-moodle-site.com
VITE_MOODLE_TOKEN=your_web_service_token
```

## 사용 방법

### 키보드 단축키

- `→` 또는 `Space`: 다음 문제로 이동
- `←`: 이전 문제로 이동
- `↑`: 이전 문제로 이동
- `↓`: 다음 문제로 이동
- `Home`: 첫 번째 문제로 이동
- `End`: 마지막 문제로 이동

### 마우스/터치

- 스마트폰 화면 하단의 "이전"/"다음" 버튼 클릭

## 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/
│   │   ├── SmartphoneDisplay.tsx    # 가상 스마트폰 컨테이너
│   │   ├── SmartphoneDisplay.css
│   │   ├── TermSlide.tsx            # Term 슬라이드 컴포넌트
│   │   ├── TermSlide.css
│   │   ├── TermSlideViewer.tsx      # 슬라이드 뷰어 컨테이너
│   │   └── TermSlideViewer.css
│   ├── hooks/
│   │   └── useTermNavigation.ts     # 네비게이션 훅
│   ├── services/
│   │   └── moodleService.ts         # Moodle API 서비스
│   ├── types/
│   │   └── index.ts                 # TypeScript 타입 정의
│   ├── App.tsx                      # 메인 앱 컴포넌트
│   ├── App.css
│   ├── main.tsx                     # 앱 진입점
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## API 사용 예시

### Moodle에서 문제 가져오기

```typescript
import { createMoodleService } from '@/services/moodleService';

const moodleService = createMoodleService({
  baseUrl: 'https://your-moodle-site.com',
  token: 'your_token_here',
});

// 모듈 가져오기
const module = await moodleService.getModule(courseId);

// 퀴즈 문제 가져오기
const questions = await moodleService.getQuestions(quizId);

// 문제를 Term으로 변환
const terms = moodleService.questionsToTerms(questions);
```

## 커스터마이징

### 스마트폰 화면 설정

```tsx
<SmartphoneDisplay
  config={{
    width: 375,           // 화면 너비 (px)
    height: 667,          // 화면 높이 (px)
    position: 'bottom-right',  // 위치
    scale: 0.75,          // 크기 배율
  }}
>
  {/* 콘텐츠 */}
</SmartphoneDisplay>
```

### 애니메이션 방향 설정

```typescript
const directions = ['left', 'right', 'up', 'down'];
```

## Moodle 버전 호환성

- **Moodle**: 3.7+
- **PHP**: 7.1.9+
- **MySQL**: 5.7+

## 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 개발 팀

KAIST Touch Math Academy

## 라이선스

MIT License

## 문제 해결

### Moodle 연결 실패

1. Web Services가 활성화되어 있는지 확인
2. 토큰이 올바른지 확인
3. CORS 설정 확인 (필요시 Moodle 설정)

### 애니메이션이 부드럽지 않음

1. 브라우저의 하드웨어 가속 활성화 확인
2. GPU 성능 확인
3. `framer-motion` 버전 확인

## 향후 계획

- [ ] 터치 제스처 지원 (스와이프)
- [ ] 오프라인 모드
- [ ] 다국어 지원 (i18n)
- [ ] 접근성 개선 (ARIA)
- [ ] 답안 제출 기능
- [ ] 실시간 피드백
- [ ] 통계 및 분석 대시보드

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
