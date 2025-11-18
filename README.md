# Graph Emotion - AI Education System

그래프의 전체 성격을 **온도(Temperature)**, **색감(Color)**, **리듬(Rhythm)**으로 표현하는 감정 시각화 웹 애플리케이션입니다.

![Graph Emotion Preview](https://via.placeholder.com/800x400.png?text=Graph+Emotion+Preview)

## ✨ 주요 기능

### 🌡️ **온도 표현 (Temperature)**
- 난이도를 색상 온도로 시각화
- **파란색 (차가움)** → 쉬운 개념
- **빨간색 (뜨거움)** → 어려운 개념
- HSL 색상 공간을 활용한 부드러운 그라디언트

### 🎨 **색감 표현 (Color)**
- 개념 카테고리별 고유 색상
  - 🔵 **기초** (Foundation) - 파란색
  - 🟢 **핵심** (Core) - 초록색
  - 🟠 **심화** (Advanced) - 주황색
  - 🟣 **응용** (Application) - 보라색
- 학습 진행률에 따른 동적 그라디언트
- 완성 상태를 색상으로 직관적 표현

### 🎵 **리듬 표현 (Rhythm)**
- 학습 진행 상태를 맥박 애니메이션으로 표현
- 진행 중인 노드는 리듬감 있게 움직임
- 템포(tempo)에 따른 애니메이션 속도 조절
- 4가지 리듬 패턴: calm, steady, active, intense

### 📱 **가상 스마트폰 화면**
- 우측 하단에 실제 스마트폰 UI 컨테이너
- 반응형 디자인으로 다양한 화면 크기 지원
- 실시간 그래프 업데이트

### 🔗 **LMS 연동 시뮬레이션**
- Moodle/LMS에서 문제 정보를 받아오는 시뮬레이션
- 학습 진행 상황 실시간 추적
- 문제 난이도 및 카테고리 자동 매핑

## 🚀 시작하기

### 필수 요구사항

- **Node.js**: 18.0 이상
- **npm** 또는 **yarn**

### 설치

```bash
# 프로젝트 클론
git clone <repository-url>
cd alt42standalone_v1.0

# 의존성 설치
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 으로 접속합니다.

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── GraphEmotion/    # 그래프 감정 표현 컴포넌트
│   │   │   └── GraphEmotion.tsx
│   │   └── VirtualPhone/    # 가상 스마트폰 컨테이너
│   │       └── VirtualPhone.tsx
│   ├── hooks/               # Custom React Hooks
│   │   └── useGraphData.ts  # 그래프 데이터 관리
│   ├── types/               # TypeScript 타입 정의
│   │   └── graph.types.ts   # 그래프 관련 타입
│   ├── utils/               # 유틸리티 함수
│   │   └── emotionMapper.ts # 감정 매핑 로직
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── main.tsx             # 엔트리 포인트
│   └── index.css            # 글로벌 스타일
├── public/                  # 정적 파일
├── index.html              # HTML 템플릿
├── package.json            # 프로젝트 설정
├── vite.config.ts          # Vite 설정
├── tsconfig.json           # TypeScript 설정
├── tailwind.config.js      # Tailwind CSS 설정
└── README.md              # 프로젝트 문서
```

## 🛠️ 기술 스택

### Frontend
- **React 18+** - UI 라이브러리
- **TypeScript** - 타입 안전성
- **Vite** - 빌드 도구 및 개발 서버
- **Tailwind CSS** - 유틸리티 CSS 프레임워크

### 시각화
- **D3.js** - 그래프 시각화 및 포스 레이아웃
- **Framer Motion** - 애니메이션 라이브러리
- **chroma.js** - 색상 조작 및 그라디언트

### 개발 도구
- **ESLint** - 코드 린팅
- **PostCSS** - CSS 처리
- **Autoprefixer** - 브라우저 호환성

## 📊 데이터 구조

### GraphNode
```typescript
interface GraphNode {
  id: string;              // 노드 고유 ID
  label: string;           // 노드 라벨 (표시 이름)
  category: ConceptCategory; // 개념 카테고리
  difficulty: number;      // 난이도 (0-1)
  completed: boolean;      // 완성 여부
  progress: number;        // 진행률 (0-100)
}
```

### GraphEdge
```typescript
interface GraphEdge {
  source: string;          // 출발 노드 ID
  target: string;          // 도착 노드 ID
  strength: number;        // 관계 강도 (0-1)
  type: RelationType;      // 관계 타입
}
```

### 감정 표현 타입

#### TemperatureEmotion
```typescript
interface TemperatureEmotion {
  temperature: number;     // 온도 값 (0-1)
  color: string;           // HSL 색상 문자열
  label: string;           // 온도 라벨
}
```

#### ColorEmotion
```typescript
interface ColorEmotion {
  primary: string;         // 주요 색상 (카테고리)
  secondary: string;       // 보조 색상 (상태)
  gradient: string;        // 그라디언트 (완성도)
}
```

#### RhythmEmotion
```typescript
interface RhythmEmotion {
  tempo: number;           // 템포 (0-1)
  pulse: boolean;          // 맥박 효과 활성화
  pattern: 'calm' | 'steady' | 'active' | 'intense';
}
```

## 🎮 사용 방법

### 1. 그래프 탐색
- **노드 클릭**: 상세 정보 확인 및 진행률 시뮬레이션
- **노드 드래그**: 노드 위치 조정
- **호버**: 노드 확대 효과

### 2. LMS 문제 목록
- 우측 상단 "LMS 문제 목록" 버튼 클릭
- 문제 목록 확인 및 새로고침

### 3. 가상 스마트폰
- 우측 하단 가상 스마트폰에서 동일한 그래프 확인
- 실시간 업데이트 동기화

## 🔧 커스터마이징

### 색상 테마 변경
`tailwind.config.js`에서 색상 설정:
```javascript
theme: {
  extend: {
    colors: {
      'kaist-blue': '#004191',
      'kaist-red': '#E63312',
    },
  },
}
```

### 그래프 데이터 수정
`src/hooks/useGraphData.ts`의 `generateSampleGraphData()` 함수 수정

### 감정 매핑 알고리즘 조정
`src/utils/emotionMapper.ts`의 매핑 함수 수정:
- `mapDifficultyToTemperature()` - 온도 매핑
- `mapNodeToColorEmotion()` - 색감 매핑
- `mapProgressToRhythm()` - 리듬 매핑

## 🌐 LMS 연동 가이드

현재는 시뮬레이션 데이터를 사용하지만, 실제 LMS와 연동하려면:

### 1. API 엔드포인트 설정
```typescript
// src/hooks/useGraphData.ts
const fetchLMSProblems = async () => {
  const response = await fetch('https://your-lms.com/api/problems');
  const data = await response.json();
  setLmsProblems(data);
};
```

### 2. 인증 추가
```typescript
const response = await fetch('https://your-lms.com/api/problems', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### 3. 데이터 형식 변환
LMS 데이터를 `LMSProblem` 인터페이스에 맞게 변환

## 📈 성능 최적화

- **React.memo**: 불필요한 리렌더링 방지
- **D3 Force Simulation**: 효율적인 그래프 레이아웃
- **CSS Transform**: 하드웨어 가속 애니메이션
- **Lazy Loading**: 필요한 컴포넌트만 로드

## 🧪 테스트

```bash
# 린트 검사
npm run lint

# 타입 체크
tsc --noEmit
```

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여

이슈 및 풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 연락처

프로젝트 링크: [https://github.com/your-username/graph-emotion](https://github.com/your-username/graph-emotion)

## 🙏 감사의 말

- [React](https://reactjs.org/)
- [D3.js](https://d3js.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS](https://tailwindcss.com/)
- [chroma.js](https://gka.github.io/chroma.js/)

---

**Made with ❤️ for KAIST Touch Math Academy**
