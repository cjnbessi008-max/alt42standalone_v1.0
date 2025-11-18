# Logic Flow Visualization System

Moodle LMS와 연동하여 교육 로직 흐름을 시각화하는 웹 애플리케이션

## 🎯 주요 기능

### 1. **Logic Flow Visualization (로직 흐름 시각화)**
- 조건(Condition) → 결론(Conclusion) 구조를 부드러운 Bezier curves로 표현
- 4가지 노드 타입: Condition, Decision, Action, Conclusion
- 인터랙티브한 그래프 조작 (Zoom, Pan, 노드 클릭)
- 자동 계층적 레이아웃 (Topological Sort)

### 2. **Moodle LMS 연동**
- Moodle 3.7 Web Services API 통합
- MySQL 5.7, PHP 7.1.9 환경 지원
- 문제 정보 가져오기 (Questions, Quizzes)
- 학생 진도 추적

### 3. **모바일 시뮬레이터**
- 우측 하단 가상 스마트폰 화면
- iPhone, Android, Tablet 디바이스 지원
- Portrait/Landscape 회전 기능
- 최소화/최대화 가능

## 🏗️ 기술 스택

### Frontend
- **React 18+** with TypeScript
- **Vite** - 빌드 도구
- **Zustand** - 상태 관리
- **D3.js** - 데이터 시각화
- **Axios** - HTTP 클라이언트

### Integration
- **Moodle Web Services API** (REST)
- MySQL 5.7 (Moodle 백엔드)
- PHP 7.1.9 (Moodle 서버)

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 3. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 🔧 Moodle 설정

### Web Service 활성화

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 고급 기능** 에서 "웹 서비스 활성화" 체크
3. **사이트 관리 > 플러그인 > 웹 서비스 > 외부 서비스** 에서 새 서비스 생성
4. 필요한 함수 추가:
   - `core_webservice_get_site_info`
   - `core_question_get_questions`
   - `mod_quiz_get_quiz_questions`
   - `mod_quiz_get_user_attempts`
   - `mod_quiz_save_attempt`

### 토큰 생성

1. **사이트 관리 > 사용자 > 권한 > 역할 정의** 에서 웹 서비스 역할 생성
2. **사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리** 에서 토큰 생성
3. 생성된 토큰을 애플리케이션에서 사용

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── components/
│   │   ├── LogicFlowVisualization.tsx  # 로직 흐름도 컴포넌트
│   │   └── MobileSimulator.tsx         # 모바일 시뮬레이터
│   ├── services/
│   │   └── moodleApi.ts                # Moodle API 서비스
│   ├── store/
│   │   └── useAppStore.ts              # 상태 관리
│   ├── types/
│   │   └── index.ts                    # TypeScript 타입 정의
│   ├── utils/
│   │   └── flowLayoutEngine.ts         # 레이아웃 엔진
│   ├── App.tsx                         # 메인 앱
│   ├── main.tsx                        # 엔트리 포인트
│   └── index.css                       # 글로벌 스타일
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 컴포넌트 사용법

### LogicFlowVisualization

```tsx
import { LogicFlowVisualization } from '@components/LogicFlowVisualization';

const graph = {
  nodes: [
    { id: '1', type: 'condition', label: '조건 1', position: { x: 0, y: 0 } },
    { id: '2', type: 'conclusion', label: '결론 1', position: { x: 0, y: 0 } }
  ],
  edges: [
    { id: 'e1-2', source: '1', target: '2', label: '만족' }
  ]
};

<LogicFlowVisualization
  graph={graph}
  width={800}
  height={600}
  interactive={true}
  onNodeClick={(node) => console.log(node)}
/>
```

### MobileSimulator

```tsx
import { MobileSimulator } from '@components/MobileSimulator';

<MobileSimulator
  position="bottom-right"
  minimizable={true}
  onClose={() => setShowSimulator(false)}
>
  <YourMobileContent />
</MobileSimulator>
```

## 🔌 Moodle API 사용

```typescript
import { createMoodleApi } from '@services/moodleApi';

const api = createMoodleApi({
  wstoken: 'your-token',
  domainname: 'https://your-moodle-site.com'
});

// 연결 테스트
const isConnected = await api.testConnection();

// 문제 가져오기
const response = await api.getQuestion(123);
if (response.data) {
  console.log(response.data);
}
```

## 🎯 로직 플로우 노드 타입

| 타입 | 색상 | 모양 | 용도 |
|------|------|------|------|
| **Condition** | 파란색 | 육각형 | 조건 체크 |
| **Decision** | 보라색 | 다이아몬드 | 분기 결정 |
| **Action** | 주황색 | 둥근 사각형 | 실행 동작 |
| **Conclusion** | 녹색 | 둥근 사각형 | 최종 결과 |

## 🚀 향후 계획

- [ ] 실시간 Moodle 데이터 연동
- [ ] 로직 플로우 편집 기능
- [ ] 학생 진도 시각화 대시보드
- [ ] 다국어 지원 (한국어, 영어)
- [ ] 로직 플로우 템플릿 라이브러리
- [ ] 성능 최적화 (가상화, 캐싱)

## 📝 라이선스

MIT License

## 👥 기여

KAIST Touch Math Academy

---

**문의**: 프로젝트에 대한 문의사항이 있으시면 Issue를 생성해주세요.
