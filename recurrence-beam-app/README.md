# 🌟 Recurrence Beam Visualizer

**점화식의 흐름을 한 줄의 빛으로 표현하는 독립형 웹앱**

## 📱 Overview

Recurrence Beam은 점화식(Recurrence Relation)의 계산 과정을 아름다운 빛의 애니메이션으로 시각화하는 교육용 웹 애플리케이션입니다. Moodle LMS와 연동하여 문제 정보를 가져오고, 우측 하단의 가상 스마트폰 화면에서 시각화를 표시합니다.

## ✨ Features

- 🎨 **빛 애니메이션**: 점화식의 계산 흐름을 빛의 선으로 표현
- 📱 **가상 스마트폰**: 우측 하단에 실제 스마트폰처럼 표시되는 UI
- 🔗 **Moodle 연동**: Moodle 3.7 REST API를 통한 문제 데이터 가져오기
- 🎮 **인터랙티브 컨트롤**: 재생, 일시정지, 단계별 이동, 속도 조절
- 📊 **다양한 점화식 지원**:
  - 피보나치 수열 (Fibonacci)
  - 계승 수열 (Factorial)
  - 등차수열 (Arithmetic Progression)
  - 등비수열 (Geometric Progression)
  - 루카스 수열 (Lucas Numbers)

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Animation**: Canvas API
- **API Integration**: Axios
- **Backend Support**: Moodle 3.7 + MySQL 5.7 + PHP 7.1.9

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd recurrence-beam-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 🔧 Moodle Integration

### Configuration

Edit `src/App.tsx` to configure Moodle connection:

```typescript
const moodleApi = new MoodleApiService({
  baseUrl: 'https://your-moodle-instance.com',
  token: 'your-webservice-token-here',
  courseId: 'optional-course-id',
});
```

### Moodle Setup

1. Enable Web Services in Moodle Administration
2. Create a custom web service with required capabilities
3. Generate a token for the service
4. Store problem data with custom fields:

```json
{
  "formula": "f(n) = f(n-1) + f(n-2)",
  "initialConditions": { "f(0)": 0, "f(1)": 1 },
  "maxSteps": 10
}
```

## 📖 Usage

1. **Select a Problem**: Choose from the dropdown menu
2. **View Visualization**: Watch the recurrence relation unfold as animated light beams
3. **Control Playback**:
   - ▶️ Play: Start automatic animation
   - ⏸️ Pause: Stop animation
   - ⏮️ Reset: Return to beginning
   - ⏪/⏩ Step backward/forward through calculations
4. **Adjust Speed**: Use the slider to control animation speed (1x-10x)

## 📁 Project Structure

```
recurrence-beam-app/
├── src/
│   ├── components/
│   │   ├── VirtualSmartphone.tsx    # 가상 스마트폰 프레임
│   │   ├── RecurrenceBeam.tsx       # 빛 애니메이션 시각화
│   │   └── ControlPanel.tsx         # 컨트롤 패널 UI
│   ├── services/
│   │   └── moodleApi.ts            # Moodle API 연동
│   ├── utils/
│   │   └── recurrenceCalculator.ts # 점화식 계산 엔진
│   ├── types/
│   │   └── index.ts                # TypeScript 타입 정의
│   ├── App.tsx                     # 메인 애플리케이션
│   └── main.tsx                    # 엔트리 포인트
├── package.json
└── vite.config.ts
```

## 🎓 Educational Use Cases

- **수학 교육**: 점화식 개념 이해를 돕는 시각적 도구
- **알고리즘 학습**: 재귀 알고리즘의 실행 과정 시각화
- **프로그래밍 교육**: 동적 계획법(Dynamic Programming) 개념 설명
- **온라인 강의**: Moodle LMS와 통합하여 원격 교육 지원

## 🔮 Future Enhancements

- [ ] 사용자 정의 점화식 입력 기능
- [ ] 더 많은 시각화 스타일 (그래프, 트리 구조 등)
- [ ] 학습자 진행도 추적 및 분석
- [ ] 다국어 지원 (한국어, 영어 외)
- [ ] PWA 지원 (오프라인 사용 가능)
- [ ] 음성 설명 기능

## 📝 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgments

- KAIST Touch Math Academy
- Moodle Community
- React & Vite Teams

---

**Made with ❤️ for mathematics education**
