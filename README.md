# ALT42 - Smooth Log Zoom Web App

독립형 웹앱으로 Moodle 3.7 LMS와 연동하여 학습 활동 로그를 부드럽게 확대/축소할 수 있는 그래프를 제공합니다.

## 🎯 주요 기능

- **부드러운 줌 애니메이션**: Chart.js + chartjs-plugin-zoom을 사용한 300ms easing 애니메이션
- **다양한 조작 방법**:
  - 마우스 휠로 부드러운 줌 인/아웃
  - Shift + 드래그로 그래프 이동 (Pan)
  - 키보드 단축키 (+/- 줌, 0 초기화)
  - 모바일 핀치 줌 지원
- **스마트폰 시뮬레이터**: 우측 하단에 표시되는 가상 스마트폰 화면
- **Moodle 3.7 연동 준비**: Web Service API 통합 구조

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Charting**: Chart.js 4.x + chartjs-plugin-zoom
- **Styling**: Tailwind CSS 3
- **HTTP Client**: Axios
- **Target Environment**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9)

## 📦 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 확인하세요.

### 3. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

### 4. 프리뷰

```bash
npm run preview
```

## 🎮 사용 방법

### Desktop View (데스크톱 뷰)
1. 메인 화면에서 큰 그래프를 확인
2. 마우스 휠로 줌 인/아웃
3. Shift + 드래그로 그래프 이동
4. 버튼 또는 키보드 단축키 사용

### Mobile View (모바일 뷰)
1. "📱 Mobile View" 버튼 클릭
2. 우측 하단 스마트폰 프레임에서 그래프 확인
3. 실제 학생이 보는 화면과 동일한 경험

## 🔧 Moodle 연동 설정

### Moodle Web Service 활성화

1. Moodle 관리자 로그인
2. **사이트 관리 > 플러그인 > 웹 서비스 > 개요**
3. 다음 항목 활성화:
   - ✅ 웹 서비스 사용
   - ✅ REST 프로토콜 사용

### Web Service Token 생성

1. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리**
2. 새 토큰 생성 및 복사

### 설정 파일 구성

`src/services/moodleApi.ts` 파일에서 설정:

```typescript
const moodleService = new MoodleApiService({
  baseUrl: 'https://your-moodle-site.com',
  wsToken: 'your-web-service-token',
  wsFunction: 'core_user_get_course_user_profiles'
});
```

## 📱 스마트폰 프레임 특징

- **실제 디바이스 시뮬레이션**: iPhone 스타일 노치, 홈 인디케이터
- **반응형 디자인**: 375x667px (iPhone SE 크기)
- **위치 조정 가능**: bottom-right, bottom-left, center 등
- **Glass morphism 효과**: 모던한 UI/UX

## 🎨 커스터마이징

### 그래프 색상 변경

`tailwind.config.js`:

```javascript
colors: {
  'moodle-primary': '#f98012',  // Moodle 오렌지
  'moodle-secondary': '#1177d1', // Moodle 블루
}
```

### 줌 애니메이션 속도 조정

`src/components/LogGraph.tsx`:

```typescript
zoom: {
  animation: {
    duration: 300, // 밀리초 (기본값)
    easing: 'easeInOutQuad', // easing 함수
  },
}
```

## 📊 데이터 구조

### MoodleActivityLog

```typescript
interface MoodleActivityLog {
  id: number;
  userid: number;
  courseid: number;
  activityname: string;
  timestamp: number;
  score?: number;
  duration?: number;
}
```

## 🧪 개발 모드

현재는 Mock 데이터를 사용합니다. 실제 Moodle API 연동을 위해서는:

1. `src/components/App.tsx`의 `loadActivityData()` 함수 수정
2. Mock 데이터 대신 실제 API 호출:

```typescript
const moodleService = new MoodleApiService(config);
const logs = await moodleService.fetchActivityLogs(userid, courseid);
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── public/               # 정적 파일
├── src/
│   ├── components/       # React 컴포넌트
│   │   ├── App.tsx      # 메인 앱
│   │   ├── LogGraph.tsx # 로그 그래프 (줌 기능)
│   │   └── SmartphoneFrame.tsx # 스마트폰 프레임
│   ├── services/        # API 서비스
│   │   └── moodleApi.ts # Moodle 연동
│   ├── types/           # TypeScript 타입
│   │   └── index.ts
│   ├── styles/          # 스타일시트
│   │   └── index.css
│   └── main.tsx         # 엔트리 포인트
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 🚀 배포

### 정적 호스팅 (Netlify, Vercel)

```bash
npm run build
# dist/ 폴더를 배포
```

### Apache/Nginx

빌드 후 `dist/` 폴더를 웹 서버 문서 루트에 복사

### Moodle 플러그인으로 통합

Moodle 플러그인 디렉토리에 통합하려면:
1. 빌드된 파일을 Moodle 플러그인 폴더로 이동
2. Moodle 플러그인 manifest 추가

## 📝 라이선스

MIT License

## 👥 지원

- GitHub Issues: [프로젝트 이슈 페이지]
- 문서: 이 README 파일

## 🔮 향후 계획

- [ ] 실시간 데이터 업데이트 (WebSocket)
- [ ] 다양한 그래프 타입 (막대, 파이 차트)
- [ ] 데이터 내보내기 (CSV, Excel)
- [ ] 다크 모드 지원
- [ ] 다국어 지원 (i18n)
