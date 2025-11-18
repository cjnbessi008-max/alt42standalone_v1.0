# 🎢 Slope Sense - 기울기 감각 학습 (독립형 웹앱)

**Slope Sense**는 수학 기울기(slope) 개념을 인터랙티브 애니메이션으로 학습하는 100% 클라이언트 사이드 웹 애플리케이션입니다. 서버가 필요없이 브라우저에서 바로 실행되며, 우측 하단의 가상 스마트폰 화면에서 애니메이션을 통해 기울기를 직관적으로 이해할 수 있습니다.

## ✨ 주요 특징

### 🚀 독립형 앱 (No Server Required!)
- **100% 클라이언트 사이드**: PHP, MySQL, Node.js 등 서버 불필요
- **즉시 실행**: 파일을 열기만 하면 바로 작동
- **오프라인 지원**: 인터넷 연결 없이도 사용 가능 (PWA)
- **설치 불필요**: 복잡한 설정 과정 없음

### 🎯 교육 기능
- **15개의 체계적인 문제**: 5단계 난이도 시스템
- **4가지 애니메이션 타입**:
  - 🎱 공 굴리기 (Ball Roll)
  - ⛷️ 스키어 (Skier)
  - 🚗 자동차 (Car Drive)
  - 💧 물 흐름 (Water Flow)
- **Rise/Run 시각화**: 기울기의 구성 요소를 명확하게 표시
- **힌트 시스템**: 각 문제마다 맞춤 힌트 제공
- **상세한 해설**: 정답과 함께 개념 설명

### 📱 스마트폰 UI
- **우측 하단 배치**: 방해받지 않는 학습 환경
- **노치 디자인**: 실제 스마트폰처럼 사실적인 UI
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 모두 지원

### 💾 데이터 관리
- **localStorage 자동 저장**: 진행상황 자동 저장
- **통계 추적**: 정답률, 시도 횟수, 학습 시간 기록
- **데이터 내보내기/가져오기**: JSON 파일로 백업 가능
- **진행도 표시**: 실시간 학습 진행 상황 확인

### 🎨 모던 UI/UX
- **다크모드 지원**: 시스템 설정 자동 감지
- **부드러운 애니메이션**: 60fps Canvas 렌더링
- **직관적인 컨트롤**: 속도 조절, 재생/일시정지
- **접근성**: 키보드 네비게이션 지원

## 📁 프로젝트 구조

```
slope-sense-standalone/
├── index.html              # 메인 HTML (단일 파일로도 작동 가능)
├── manifest.json           # PWA 매니페스트
├── README.md              # 이 파일
├── css/
│   └── (인라인 CSS - index.html에 포함)
├── js/
│   ├── app.js             # 메인 애플리케이션
│   ├── modules/
│   │   ├── DataManager.js      # 데이터 관리 (localStorage)
│   │   ├── AnimationEngine.js  # Canvas 애니메이션
│   │   └── UIManager.js        # UI 업데이트
│   └── data/
│       └── problems.json       # 문제 데이터
└── assets/
    └── images/
        ├── icon-192.png
        └── icon-512.png
```

## 🚀 빠른 시작

### 방법 1: 파일 직접 열기 (가장 간단!)

```bash
# 다운로드 또는 클론
git clone https://github.com/your-repo/slope-sense-standalone.git

# 브라우저에서 index.html 파일 열기
# 또는 파일을 더블클릭
```

끝! 바로 실행됩니다. 🎉

### 방법 2: 로컬 웹 서버 실행 (권장)

ES6 모듈을 사용하므로 로컬 서버를 통해 실행하는 것을 권장합니다.

#### Python 사용
```bash
# Python 3
cd slope-sense-standalone
python -m http.server 8000

# 브라우저에서 열기
# http://localhost:8000
```

#### Node.js 사용
```bash
# npx 사용 (Node.js 설치 필요)
cd slope-sense-standalone
npx serve

# 또는 http-server
npm install -g http-server
http-server
```

#### VS Code 사용
```bash
# Live Server 확장 설치
# index.html에서 우클릭 > Open with Live Server
```

### 방법 3: GitHub Pages에 배포

```bash
# GitHub에 푸시
git add .
git commit -m "Deploy Slope Sense"
git push origin main

# GitHub Settings > Pages
# Source: main branch
# 완료! https://username.github.io/slope-sense-standalone
```

### 방법 4: Netlify에 배포

1. [Netlify](https://www.netlify.com/)에 로그인
2. "New site from Git" 클릭
3. 저장소 연결
4. Deploy 클릭

또는 드래그 앤 드롭:
```bash
# slope-sense-standalone 폴더를 Netlify Drop에 드래그
```

## 🎮 사용 방법

### 기본 조작

1. **문제 읽기**: 화면에 표시된 문제를 확인
2. **애니메이션 관찰**: Canvas에서 기울기 시각화 확인
3. **답 입력**: 계산한 기울기를 입력
4. **제출**: "제출" 버튼 클릭 또는 Enter 키
5. **다음 문제**: 정답 시 "다음 문제" 버튼 표시

### 애니메이션 컨트롤

- **속도 조절**: 슬라이더로 0.5x ~ 3.0x 조절
- **재생/일시정지**: 애니메이션 제어
- **다시보기**: 애니메이션 처음부터 재생
- **애니메이션 타입 변경**: 4가지 타입 선택

### 학습 도구

- **힌트**: 막힐 때 힌트 버튼 클릭
- **통계**: 상단에서 실시간 정답률 확인
- **진행도**: 하단 진행 바로 학습 상황 확인

## 💾 데이터 관리

### 자동 저장

모든 진행상황은 브라우저의 localStorage에 자동 저장됩니다:
- 현재 문제 위치
- 완료한 문제 목록
- 모든 시도 기록
- 통계 (정답률, 시간 등)
- 설정 (애니메이션 속도 등)

### 데이터 내보내기

```javascript
// 학습 완료 화면에서
"💾 학습 데이터 내보내기" 버튼 클릭

// JSON 파일 다운로드
// slope-sense-data-2024-01-18.json
```

### 데이터 가져오기

```javascript
// 콘솔에서 (또는 UI에 추가)
const input = document.createElement('input');
input.type = 'file';
input.accept = 'application/json';
input.onchange = async (e) => {
    await window.slopeSenseApp.dataManager.importData(e.target.files[0]);
    location.reload();
};
input.click();
```

### 진행상황 초기화

```javascript
// 완료 화면에서
"🔄 처음부터 다시 시작" 버튼 클릭

// 또는 콘솔에서
window.slopeSenseApp.dataManager.resetProgress();
```

## 🎨 커스터마이징

### 문제 추가/수정

`js/data/problems.json` 파일 편집:

```json
{
  "id": 16,
  "level": 5,
  "type": "two_points",
  "title": "새로운 문제",
  "description": "문제 설명",
  "point1": { "x": 0, "y": 0 },
  "point2": { "x": 5, "y": 3 },
  "answer": 0.6,
  "hint": "힌트 내용",
  "explanation": "상세 설명",
  "animation": "ball_roll"
}
```

### 색상 테마 변경

`index.html`의 CSS Variables 수정:

```css
:root {
    --primary-color: #667eea;     /* 주 색상 */
    --primary-dark: #764ba2;      /* 진한 색상 */
    --secondary-color: #4ecdc4;   /* 보조 색상 */
    /* ... */
}
```

### 애니메이션 추가

`js/modules/AnimationEngine.js`에 새 메서드 추가:

```javascript
drawMyAnimation(x, y, t) {
    this.ctx.save();
    this.ctx.translate(x, y);

    // 커스텀 애니메이션 코드

    this.ctx.restore();
}
```

## 📊 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **Frontend** | Vanilla JavaScript (ES6+ Modules) |
| **Styling** | CSS3 (Grid, Flexbox, Variables) |
| **Animation** | HTML5 Canvas API + RequestAnimationFrame |
| **Storage** | localStorage API |
| **Module System** | ES6 Modules (import/export) |
| **PWA** | Web App Manifest |
| **Build** | None (Zero dependencies!) |

### 왜 이 스택을 선택했나요?

✅ **의존성 제로**: 프레임워크, 라이브러리 없음
✅ **빠른 성능**: 네이티브 브라우저 API만 사용
✅ **쉬운 배포**: 정적 파일 호스팅만 필요
✅ **긴 수명**: 프레임워크 업데이트 걱정 없음
✅ **학습 가치**: 순수 JavaScript 학습에 좋음

## 🌐 브라우저 지원

- ✅ Chrome 63+
- ✅ Firefox 60+
- ✅ Safari 11.1+
- ✅ Edge 79+
- ✅ 모바일 브라우저 (iOS Safari, Chrome Mobile)

**필수 기능**:
- ES6 Modules
- Canvas API
- localStorage
- CSS Grid & Flexbox

## 📱 PWA 설치

모바일에서 홈 화면에 추가:

**iOS (Safari)**:
1. 공유 버튼 탭
2. "홈 화면에 추가" 선택
3. 이름 확인 후 "추가"

**Android (Chrome)**:
1. 메뉴 (⋮) 탭
2. "홈 화면에 추가" 선택
3. "설치" 확인

**Desktop (Chrome)**:
1. 주소창 우측 설치 아이콘 클릭
2. "설치" 확인

## 🔧 개발

### 로컬 개발 환경

```bash
# 저장소 클론
git clone https://github.com/your-repo/slope-sense-standalone.git
cd slope-sense-standalone

# 로컬 서버 실행
python -m http.server 8000

# 브라우저 열기
open http://localhost:8000
```

### 디버깅

```javascript
// 브라우저 콘솔에서
window.slopeSenseApp                    // 메인 앱 인스턴스
window.slopeSenseApp.dataManager        // 데이터 관리자
window.slopeSenseApp.animationEngine    // 애니메이션 엔진
window.slopeSenseApp.uiManager          // UI 관리자

// 현재 데이터 확인
console.log(window.slopeSenseApp.dataManager.userData);

// 통계 확인
console.log(window.slopeSenseApp.dataManager.getStats());
```

### 성능 최적화

현재 구현된 최적화:
- ✅ Canvas를 devicePixelRatio로 스케일링
- ✅ RequestAnimationFrame으로 부드러운 60fps
- ✅ 이벤트 리스너 정리 (메모리 누수 방지)
- ✅ localStorage 배치 저장
- ✅ CSS transforms (GPU 가속)

## 🐛 문제 해결

### 애니메이션이 표시되지 않음

```javascript
// 브라우저 콘솔 확인
// Canvas 요소 확인
document.getElementById('slopeCanvas')

// 애니메이션 엔진 상태 확인
window.slopeSenseApp.animationEngine.isPlaying
```

### ES6 모듈 로딩 오류

```
Access to script at 'file:///.../app.js' from origin 'null' has been blocked by CORS
```

**해결**: 로컬 웹 서버를 통해 실행 (위의 "빠른 시작" 참조)

### localStorage가 작동하지 않음

- 브라우저 시크릿 모드에서는 localStorage 제한될 수 있음
- 브라우저 설정에서 쿠키/저장소 허용 확인

### 모바일에서 화면이 잘림

- 뷰포트 meta 태그 확인
- 브라우저 주소창 숨김 (PWA 모드 권장)

## 📈 향후 계획

- [ ] 서비스 워커 추가 (완전한 오프라인 지원)
- [ ] 음향 효과 추가
- [ ] 다국어 지원 (영어, 중국어)
- [ ] 순위표 기능 (로컬)
- [ ] 더 많은 문제 타입 (방정식, 실생활 문제)
- [ ] 성취 배지 시스템
- [ ] 친구와 경쟁 (WebRTC P2P)

## 🤝 기여

기여를 환영합니다!

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/AmazingFeature

# Commit your changes
git commit -m 'Add some AmazingFeature'

# Push to the branch
git push origin feature/AmazingFeature

# Open a Pull Request
```

## 📄 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.
자유롭게 사용, 수정, 배포하실 수 있습니다.

## 💡 영감

- Khan Academy의 인터랙티브 수학 학습
- Desmos Calculator의 시각화
- Brilliant.org의 게임화된 학습

## 👨‍💻 개발자

- **버전**: 2.0.0 (Standalone)
- **최종 업데이트**: 2024-01-18
- **개발**: Slope Sense Team

## 🌟 Star History

이 프로젝트가 도움이 되었다면 ⭐️를 눌러주세요!

---

**Made with ❤️ for better math education**

**100% 무료 • 오픈소스 • 광고 없음 • 서버 없음**
