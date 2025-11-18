# 수업 알리미 웹앱 📚

LMS에서 시간표 정보를 가져와 **수업 1시간 전에 재미있고 기괴한 방식으로 알림을 보내는** 웹앱입니다!

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8)

## ✨ 주요 기능

### 🎭 7가지 재미있는 알림 모드

1. **👻 공포 모드**: 섬뜩하고 오싹한 메시지
   - "후후후... 컴퓨터과학개론 수업이 1시간 뒤에 너를 기다리고 있다..."

2. **😱 놀람 모드**: 깜짝 놀랄 만한 강렬한 알림
   - "띠링!!! 수업이야!!! 1시간 남았어!!!"

3. **🌱 신선 모드**: 상큼하고 긍정적인 메시지
   - "상큼한 아침! 수업이 1시간 뒤에 시작돼요 🌅"

4. **🎨 기분환기 모드**: 창의적이고 재미있는 컨셉
   - "우주에서 온 메시지: 컴퓨터과학 행성 도착까지 1시간 🚀"

5. **🐱 귀여움 모드**: 사랑스럽고 귀여운 메시지
   - "냥냥! 수업이 1시간 뒤옹~ 😺"

6. **📚 진지 모드**: 정확하고 명확한 정보 전달
   - "컴퓨터과학개론 수업이 1시간 후 시작됩니다."

7. **💪 동기부여 모드**: 열정적이고 격려하는 메시지
   - "할 수 있다! 컴퓨터과학으로 미래를 개척하자! 🔥"

### 🎨 10가지 테마/스킨

앱 디자인을 자신의 취향에 맞게 커스터마이징하세요!

- 🦇 **다크 호러** - 어두운 분위기의 레드/블랙 테마
- ⚡ **네온 사이버** - 형광 핑크/시안 사이버펑크 테마
- 🌸 **파스텔 드림** - 부드러운 파스텔 컬러 테마
- 🌊 **오션 블루** - 시원한 블루 테마 (기본)
- 🌲 **포레스트 그린** - 자연의 그린 테마
- 🌅 **선셋 오렌지** - 따뜻한 오렌지 테마
- 🌌 **갤럭시 퍼플** - 신비로운 보라색 테마
- 🎮 **레트로 게임** - 8비트 게임 스타일
- 🍭 **캔디 팝** - 귀여운 핑크 테마
- ⚪ **미니멀리스트** - 깔끔한 흑백 테마

### 📱 PWA 지원

- 홈 화면에 설치 가능
- 오프라인 동작 지원
- 모바일 네이티브 앱처럼 사용

### 🔔 스마트 알림 시스템

- Web Notification API 사용
- 수업 시작 1시간 전 자동 알림
- 진동, 소리 커스터마이징
- 주간 반복 스케줄링

## 🚀 시작하기

### 요구사항

- Node.js 16.0 이상
- 최신 브라우저 (Chrome, Firefox, Edge, Safari 등)
- 브라우저 알림 권한

### 설치 및 실행

```bash
# 프로젝트 클론
git clone <repository-url>
cd ClassReminderWeb

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 첫 사용 가이드

1. **앱 실행**
   - 개발 서버 실행 후 브라우저에서 `http://localhost:5173` 접속

2. **샘플 데이터 로드**
   - "📚 샘플 데이터 로드" 버튼 클릭
   - 5개의 샘플 수업이 자동으로 추가됩니다

3. **알림 권한 허용**
   - 브라우저에서 알림 권한 요청 시 "허용" 클릭

4. **알림 모드 선택**
   - 상단의 "🎭 알림 모드" 드롭다운에서 원하는 모드 선택

5. **테마 변경**
   - "🎨 앱 테마" 드롭다운에서 원하는 테마 선택

6. **알림 테스트**
   - "🔔 알림 테스트" 버튼으로 알림 미리보기

7. **설정 조정**
   - 우측 상단 ⚙️ 버튼으로 알림, 진동, 소리 설정

## 📂 프로젝트 구조

```
ClassReminderWeb/
├── public/              # 정적 파일
├── src/
│   ├── components/      # React 컴포넌트
│   │   ├── Header.jsx
│   │   ├── ModeSelector.jsx
│   │   ├── ThemeSelector.jsx
│   │   ├── CourseList.jsx
│   │   ├── CourseItem.jsx
│   │   └── Settings.jsx
│   ├── models/          # 데이터 모델
│   │   ├── Course.js
│   │   ├── NotificationMode.js
│   │   └── AppTheme.js
│   ├── utils/           # 유틸리티
│   │   ├── storage.js
│   │   └── notifications.js
│   ├── styles/          # 스타일
│   │   ├── global.css
│   │   └── App.css
│   ├── App.jsx          # 메인 앱 컴포넌트
│   └── main.jsx         # 진입점
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 기술 스택

- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 5.0
- **PWA**: vite-plugin-pwa
- **Storage**: LocalStorage
- **Notification**: Web Notification API
- **Styling**: CSS (BEM)

## 📱 주요 기능 상세

### 알림 시스템

```javascript
// 알림 스케줄링
scheduleNotification(course) → 수업 1시간 전 알림 예약
showNotification(course) → 즉시 알림 표시
cancelNotification(courseId) → 알림 취소
```

### 데이터 저장

- LocalStorage를 사용한 클라이언트 사이드 저장
- JSON 직렬화/역직렬화
- 자동 데이터 복원

### 테마 시스템

- 동적 CSS 변수 적용
- 실시간 테마 전환
- 테마별 색상 팔레트

## 🌐 브라우저 지원

| 브라우저 | 지원 버전 |
|---------|----------|
| Chrome  | 88+      |
| Firefox | 78+      |
| Safari  | 14+      |
| Edge    | 88+      |

## 📝 사용 예시

### 수업 데이터 구조

```javascript
{
  id: 'CS101',
  name: '컴퓨터과학개론',
  instructor: '김교수',
  room: '공학관 101',
  dayOfWeek: 1, // 0=일요일, 1=월요일, ...
  startHour: 9,
  startMinute: 0,
  endHour: 10,
  endMinute: 30,
  color: '#FF6B6B'
}
```

### 알림 권한 요청

```javascript
import { requestNotificationPermission } from './utils/notifications';

// 권한 요청
const granted = await requestNotificationPermission();
if (granted) {
  console.log('알림 권한 허용됨');
}
```

## 🔒 개인정보 보호

- 모든 데이터는 브라우저 LocalStorage에 저장
- 서버로 데이터 전송 없음
- 완전한 클라이언트 사이드 앱

## 🐛 알려진 이슈

1. **iOS Safari 제약사항**
   - PWA 설치 후에만 백그라운드 알림 동작
   - 브라우저 탭이 활성화되어 있어야 알림 스케줄링 유지

2. **브라우저 제한**
   - 탭이 닫히면 setTimeout 스케줄이 초기화됨
   - Service Worker로 보완 가능 (추후 업데이트)

3. **시간대**
   - 현재 로컬 시간대 기준으로 동작
   - 다른 시간대 이동 시 재설정 필요

## 🚀 향후 개발 계획

- [ ] Service Worker 기반 백그라운드 동기화
- [ ] 실제 LMS API 연동
- [ ] 수업 추가/수정 UI
- [ ] 달력 뷰
- [ ] 과제 마감일 알림
- [ ] 다크모드 자동 전환
- [ ] 알림 히스토리
- [ ] 커스텀 알림 메시지 작성
- [ ] 알림 사운드 커스터마이징
- [ ] 데이터 내보내기/가져오기

## 📄 라이선스

이 프로젝트는 교육 목적으로 만들어졌습니다.

## 🤝 기여하기

버그 리포트, 기능 제안, Pull Request를 환영합니다!

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**즐거운 학교생활 되세요!** 🎓✨

## 💡 팁

### PWA 설치 방법

**데스크톱 (Chrome/Edge)**
1. 주소창 우측의 설치 아이콘 클릭
2. "설치" 버튼 클릭

**모바일 (Safari iOS)**
1. 공유 버튼 탭
2. "홈 화면에 추가" 선택

**모바일 (Chrome Android)**
1. 메뉴 버튼 (⋮) 탭
2. "홈 화면에 추가" 선택

### 알림이 오지 않을 때

1. 브라우저 알림 권한 확인
2. 시스템 알림 설정 확인
3. 브라우저 탭이 열려있는지 확인
4. 설정에서 알림 활성화 확인

### 데이터 초기화

브라우저 개발자 도구 → Application → Local Storage에서 데이터 삭제 가능
