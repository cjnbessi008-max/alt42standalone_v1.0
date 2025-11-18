# 🎆 Exponential Burst

**An interactive learning app that visualizes exponential growth through stunning firework animations**

[한국어](#한국어) | [English](#english)

---

## English

### 🌟 Features

#### 🎮 Interactive Learning
- Solve exponential function problems (base^exponent)
- Watch your correct answers explode into beautiful particle bursts
- Number of particles grows exponentially based on the answer

#### 📱 Modern PWA Design
- **Progressive Web App** - Install on any device
- **Offline Support** - Play anytime, anywhere
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Virtual Smartphone UI** - Unique interface design

#### 🎯 Gamification
- **Score System** - Earn points for correct answers
- **Streak Bonus** - Build combos for extra points
- **Level Progression** - Unlock higher difficulty levels
- **Leaderboard** - Track your best scores

#### 🎨 Visual Effects
- **Particle System** - Advanced HTML5 Canvas rendering
- **Trail Effects** - Smooth particle trails
- **Color Gradients** - Beautiful color schemes per stage
- **Glow Effects** - Radial gradients for enhanced visuals

#### 🔊 Audio Feedback
- **Dynamic Sounds** - Pitch changes based on answer values
- **Stage Sounds** - Different tones for each burst stage
- **Level Up Music** - Celebration melodies
- **Combo Effects** - Special sounds for streaks

#### ⚙️ Customization
- **4 Difficulty Levels** - Easy to Expert
- **Particle Density Control** - Adjust performance vs quality
- **Sound Toggle** - Enable/disable audio
- **Progress Persistence** - Auto-save with LocalStorage

### 📸 Screenshots

```
┌─────────────────────────────────────────┐
│  🎆 Exponential Burst             ≡     │
├─────────────────────────────────────────┤
│  🎯 Score: 1,250   🔥 Streak: 5x       │
│  ⭐ Level: 3       💥 Bursts: 23       │
├─────────────────────────────────────────┤
│                                         │
│  📚 Instructions      ┌──────────────┐ │
│  • Solve problems     │   SMARTPHONE │ │
│  • Build streaks      │              │ │
│  • Level up!          │   What is    │ │
│                       │   3⁴ ?       │ │
│  ⚙️ Settings          │              │ │
│  Difficulty: Medium   │   [Answer]   │ │
│  Sound: ON            │   [Submit]   │ │
│  Particles: High      │              │ │
│                       │   ✨🎆💥    │ │
│  🏆 Leaderboard       └──────────────┘ │
│  #1  1,250                             │
│  #2    890                             │
└─────────────────────────────────────────┘
```

### 🚀 Quick Start

#### Option 1: Direct Use
1. Download or clone this repository
2. Open `index.html` in a modern browser
3. Start playing immediately!

#### Option 2: Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then open http://localhost:8000
```

#### Option 3: Deploy to Web
- Deploy to **GitHub Pages**, **Netlify**, or **Vercel**
- All files are static - no backend required!

### 📦 Installation as PWA

#### Desktop (Chrome/Edge)
1. Open the app in browser
2. Click the install icon in address bar (⊕)
3. Click "Install"

#### Mobile (iOS)
1. Open in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

#### Mobile (Android)
1. Open in Chrome
2. Tap menu (⋮)
3. Tap "Install app"

### 🎓 How to Play

1. **Read the Question** - Look at the exponential expression (e.g., 2³)
2. **Calculate** - Solve the problem mentally or use paper
3. **Submit Answer** - Type your answer and click Submit
4. **Watch the Burst** - Correct answers create exponential firework displays!
5. **Build Streaks** - Answer correctly in a row for combo bonuses
6. **Level Up** - Earn 1000 points per level

### 🎯 Scoring System

```
Base Score = (base^exponent) × 10
Speed Bonus = (timeRemaining) × 10
Streak Bonus = (streak) × 50
───────────────────────────────────
Total Score = Base + Speed + Streak
```

**Example:**
- Question: 3⁴ (answer: 81)
- Time remaining: 25 seconds
- Current streak: 5x
- **Score: 810 + 250 + 250 = 1,310 points!**

### 🎨 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Graphics** | Canvas API, Particle System |
| **Audio** | Web Audio API |
| **Storage** | LocalStorage API |
| **PWA** | Service Worker, Web App Manifest |
| **Architecture** | ES6 Modules, OOP |

### 📁 Project Structure

```
exponentialburst-webapp/
├── index.html                 # Main HTML file
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker
├── css/
│   └── styles.css            # All styles with CSS variables
├── js/
│   ├── app.js                # Main app controller
│   ├── game.js               # Game logic
│   ├── particles.js          # Particle system
│   ├── storage.js            # LocalStorage manager
│   └── audio.js              # Audio manager
├── icons/
│   ├── icon.svg              # SVG icon
│   ├── icon-*.png            # PNG icons (various sizes)
│   └── screenshot-*.png      # App screenshots
└── README.md                 # This file
```

### 🔧 Customization

#### Change Colors
Edit CSS variables in `css/styles.css`:
```css
:root {
    --primary: #667eea;
    --secondary: #764ba2;
    --accent: #f093fb;
    /* ... */
}
```

#### Adjust Difficulty
Modify difficulty settings in `js/game.js`:
```javascript
const difficultySettings = {
    1: { baseRange: [2, 3], expRange: [1, 3] },
    2: { baseRange: [2, 4], expRange: [1, 4] },
    // ...
};
```

#### Add More Particle Colors
Update color array in `js/particles.js`:
```javascript
this.colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#YourColor',
    // ...
];
```

### 🐛 Troubleshooting

#### Issue: Particles not showing
- Check browser console for errors
- Ensure browser supports Canvas API
- Try reducing particle density in settings

#### Issue: No sound
- Click anywhere to initialize audio (browser policy)
- Check if sound is enabled in settings
- Verify browser supports Web Audio API

#### Issue: Progress not saving
- Check if browser allows LocalStorage
- Clear browser cache and try again
- Check browser console for storage errors

#### Issue: PWA not installing
- Ensure using HTTPS (or localhost)
- Check browser supports PWA
- Verify manifest.json is valid

### 📝 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 80+ | ✅ Full |
| Firefox | 75+ | ✅ Full |
| Safari | 13+ | ✅ Full |
| Edge | 80+ | ✅ Full |
| Opera | 67+ | ✅ Full |

**Required Features:**
- ES6 Modules
- Canvas API
- Web Audio API
- LocalStorage
- Service Workers

### 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 👏 Credits

- **Design & Development**: KAIST Touch Math Academy
- **Particle System**: Custom Canvas API implementation
- **Audio System**: Web Audio API
- **Icons**: Custom SVG graphics

### 📧 Contact

- **Issues**: [GitHub Issues](https://github.com/your-repo/exponentialburst-webapp/issues)
- **Email**: support@kaist-touchmath.edu
- **Website**: https://kaist-touchmath.edu

---

## 한국어

### 🌟 주요 기능

#### 🎮 인터랙티브 학습
- 지수 함수 문제 풀기 (밑^지수)
- 정답 시 아름다운 파티클 폭발 효과
- 답에 따라 지수적으로 증가하는 파티클 수

#### 📱 최신 PWA 디자인
- **프로그레시브 웹앱** - 모든 기기에 설치 가능
- **오프라인 지원** - 언제 어디서나 플레이
- **반응형 디자인** - 데스크톱, 태블릿, 모바일 지원
- **가상 스마트폰 UI** - 독특한 인터페이스

#### 🎯 게임화 요소
- **점수 시스템** - 정답으로 점수 획득
- **연속 정답 보너스** - 콤보로 추가 점수
- **레벨 시스템** - 난이도 단계 해금
- **리더보드** - 최고 점수 기록

#### 🎨 시각 효과
- **파티클 시스템** - 고급 Canvas 렌더링
- **궤적 효과** - 부드러운 파티클 트레일
- **색상 그라데이션** - 단계별 아름다운 색상
- **글로우 효과** - 방사형 그라데이션

#### 🔊 오디오 피드백
- **동적 사운드** - 답 값에 따라 음높이 변화
- **단계별 소리** - 폭발 단계마다 다른 톤
- **레벨업 음악** - 축하 멜로디
- **콤보 효과** - 연속 정답 특수 사운드

#### ⚙️ 커스터마이징
- **4단계 난이도** - 쉬움~전문가
- **파티클 밀도 조절** - 성능 vs 품질
- **사운드 토글** - 오디오 켜기/끄기
- **진행 상황 저장** - LocalStorage 자동 저장

### 🚀 빠른 시작

#### 방법 1: 바로 사용
1. 저장소 다운로드 또는 클론
2. 최신 브라우저에서 `index.html` 열기
3. 바로 플레이!

#### 방법 2: 로컬 서버 (권장)
```bash
# Python 사용
python -m http.server 8000

# Node.js 사용
npx serve

# http://localhost:8000 접속
```

#### 방법 3: 웹 배포
- **GitHub Pages**, **Netlify**, **Vercel** 등에 배포
- 모든 파일이 정적 - 백엔드 불필요!

### 📦 PWA 설치

#### 데스크톱 (Chrome/Edge)
1. 브라우저에서 앱 열기
2. 주소창의 설치 아이콘 클릭 (⊕)
3. "설치" 클릭

#### 모바일 (iOS)
1. Safari에서 열기
2. 공유 버튼 탭
3. "홈 화면에 추가" 탭

#### 모바일 (Android)
1. Chrome에서 열기
2. 메뉴 (⋮) 탭
3. "앱 설치" 탭

### 🎓 플레이 방법

1. **문제 읽기** - 지수 식 확인 (예: 2³)
2. **계산하기** - 암산 또는 종이에 풀기
3. **답 제출** - 답 입력 후 Submit 클릭
4. **폭발 감상** - 정답 시 지수적 불꽃놀이!
5. **연속 정답** - 연속으로 맞춰서 콤보 보너스
6. **레벨업** - 1000점마다 레벨 상승

### 🎯 점수 시스템

```
기본 점수 = (밑^지수) × 10
속도 보너스 = (남은시간) × 10
연속 보너스 = (연속) × 50
───────────────────────────────
총 점수 = 기본 + 속도 + 연속
```

**예시:**
- 문제: 3⁴ (답: 81)
- 남은 시간: 25초
- 현재 연속: 5회
- **점수: 810 + 250 + 250 = 1,310점!**

### 🛠️ 기술 스택

| 계층 | 기술 |
|------|------|
| **프론트엔드** | HTML5, CSS3, JavaScript (ES6+) |
| **그래픽** | Canvas API, 파티클 시스템 |
| **오디오** | Web Audio API |
| **저장소** | LocalStorage API |
| **PWA** | Service Worker, Web App Manifest |
| **아키텍처** | ES6 Modules, OOP |

### 📝 License

MIT License - 자세한 내용은 [LICENSE](LICENSE) 참조

### 👏 제작

**KAIST Touch Math Academy** - 2025

---

**Made with ❤️ for better math education**
