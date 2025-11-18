# 🎓 학습 집중도 모니터 (Focus Break App)

LMS 통합 가능한 독립형 웹앱으로, 학습 중 집중도를 추적하고 휴식이 필요할 때 자동으로 음악을 재생합니다.

## ✨ 주요 기능

### 1. 실시간 집중도 추적
- **탭 전환 감지**: Page Visibility API를 사용하여 사용자가 다른 탭으로 전환할 때 자동 감지
- **활동 모니터링**: 마우스, 키보드, 스크롤 등의 사용자 활동 추적
- **자동 휴식 감지**: 30초 동안 활동이 없으면 자동으로 대기 상태로 전환

### 2. 자동 휴식 음악 재생
- 집중이 깨지면 자동으로 편안한 휴식 음악 재생
- 여러 트랙으로 구성된 플레이리스트
- 부드러운 페이드 인/아웃 효과

### 3. 학습 통계
- **총 집중 시간**: 전체 세션 동안의 집중 시간 추적
- **현재 세션 시간**: 현재 진행 중인 집중 세션 시간
- **휴식 횟수**: 집중이 깨진 횟수 카운트

### 4. 직관적인 UI
- 실시간 상태 표시 (집중 중 🎯 / 휴식 중 ☕ / 대기 중 😴)
- 컬러 코딩된 상태 표시
- 반응형 디자인 (모바일/태블릿/데스크톱)

## 🚀 시작하기

### 필수 요구사항
- Node.js 16.x 이상
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **개발 서버 실행**
```bash
npm run dev
```

3. **브라우저에서 열기**
```
http://localhost:5173
```

### 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 🎯 사용 방법

1. **추적 시작**: "🚀 추적 시작" 버튼을 클릭하여 집중도 추적을 시작합니다
2. **학습 진행**: 평소처럼 학습을 진행합니다
3. **자동 감지**:
   - 다른 탭으로 전환하거나
   - 30초 이상 활동이 없으면
   - 자동으로 휴식 모드로 전환되고 음악이 재생됩니다
4. **수동 휴식**: 필요시 "☕ 수동 휴식" 버튼으로 직접 휴식을 취할 수 있습니다
5. **집중 재개**: "🎯 집중 재개" 버튼으로 다시 집중 모드로 전환합니다

## 🏗️ 프로젝트 구조

```
focus-break-app/
├── src/
│   ├── components/
│   │   ├── BreakMusicPlayer.tsx      # 음악 재생 컴포넌트
│   │   └── BreakMusicPlayer.css      # 음악 플레이어 스타일
│   ├── services/
│   │   └── ConcentrationTracker.ts   # 집중도 추적 서비스
│   ├── App.tsx                        # 메인 애플리케이션
│   ├── App.css                        # 메인 스타일
│   └── main.tsx                       # 앱 진입점
├── package.json
└── README.md
```

## 🔧 기술 스택

- **프론트엔드**: React 18 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: CSS3 (Custom Properties, Animations)
- **오디오**: HTML5 Audio API
- **감지**: Page Visibility API, Event Listeners

## 📊 작동 원리

### 집중도 추적 알고리즘

```typescript
// ConcentrationTracker Service
1. 페이지 가시성 변경 감지 (visibilitychange 이벤트)
2. 사용자 활동 추적 (mousemove, keydown, scroll 등)
3. 유휴 시간 체크 (1초마다 확인)
4. 상태 변경 시 리스너에게 알림
```

## 🎨 커스터마이징

### 유휴 시간 임계값 변경

`src/App.tsx`에서 다음 값을 수정:

```typescript
// 30초 → 60초로 변경
trackerRef.current = new ConcentrationTracker(60000);
```

### 음악 플레이리스트 변경

`src/components/BreakMusicPlayer.tsx`에서 `BREAK_MUSIC_PLAYLIST` 배열 수정:

```typescript
const BREAK_MUSIC_PLAYLIST = [
  {
    title: "나만의 음악",
    url: "/path/to/your/music.mp3"
  },
  // 더 많은 트랙 추가...
];
```

## 🔌 LMS 연동 가이드

### iframe 임베딩

```html
<iframe
  src="https://your-domain.com/focus-break-app"
  width="100%"
  height="800px"
  frameborder="0"
></iframe>
```

### LTI 통합 (향후 지원 예정)

LTI (Learning Tools Interoperability) 표준을 통한 Canvas, Moodle, Blackboard 연동이 계획되어 있습니다.

## 📄 라이선스

MIT License

## 👨‍💻 개발자

KAIST Touch Math Academy - AI Education System

---

**개발 완료 ✅**
- 집중도 추적 서비스
- 자동 음악 재생
- 실시간 통계 대시보드
- 반응형 UI
