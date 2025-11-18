# LMS 그래프 자동 스케치

AI 기반 교육 개념 그래프 자동 생성 시스템

## 프로젝트 개요

교육자가 자연어로 교육 내용을 입력하면, AI가 자동으로 개념(Concept)과 관계(Relationship)를 추출하여 인터랙티브한 그래프로 시각화하는 독립형 웹 애플리케이션입니다.

### 주요 기능

- **자동 개념 추출**: 텍스트 입력에서 핵심 개념과 관계를 AI가 자동으로 추출
- **인터랙티브 그래프 시각화**: React Flow를 사용한 드래그 가능한 노드 기반 그래프
- **개념 유형 분류**: 개념(Concept), 엔티티(Entity), 연산(Operation) 자동 분류
- **실시간 편집**: 노드 추가, 삭제, 이동 등 실시간 편집 기능
- **저장/불러오기**: 로컬 스토리지를 활용한 그래프 저장 및 불러오기
- **한국어 지원**: 완전한 한국어 UI 및 샘플 제공

## 기술 스택

### Frontend
- **React 18+** - UI 프레임워크
- **TypeScript** - 타입 안전성
- **Vite** - 빠른 개발 빌드 도구
- **React Flow** - 그래프 시각화 라이브러리
- **Material-UI (MUI)** - UI 컴포넌트 라이브러리
- **Zustand** - 가벼운 상태 관리

### Styling
- **Emotion** - CSS-in-JS
- **MUI System** - 반응형 디자인

## 설치 및 실행

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치 방법

1. **저장소 클론 또는 디렉토리 이동**
```bash
cd lms-graph-sketch
```

2. **의존성 설치**
```bash
npm install
```

3. **개발 서버 실행**
```bash
npm run dev
```

4. **브라우저에서 열기**
```
http://localhost:5173
```

### 빌드

프로덕션 빌드를 생성하려면:
```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

빌드 결과 미리보기:
```bash
npm run preview
```

## 사용 방법

### 1. 교육 내용 입력
왼쪽 패널의 텍스트 영역에 교육하고 싶은 내용을 자유롭게 입력합니다.

**샘플 텍스트 사용:**
- "샘플 사용" 버튼을 클릭하면 분수 교육 예시가 자동으로 입력됩니다.

### 2. 그래프 생성
- "그래프 자동 생성" 버튼을 클릭하면 AI가 개념과 관계를 분석합니다.
- 약 1-2초 후 오른쪽에 그래프가 자동으로 생성됩니다.

### 3. 그래프 편집
- **노드 이동**: 노드를 드래그하여 원하는 위치로 이동
- **노드 삭제**: 노드 우측 상단의 X 버튼 클릭
- **확대/축소**: 마우스 휠 또는 하단 컨트롤 사용
- **팬 이동**: 배경을 드래그하여 그래프 전체 이동

### 4. 저장 및 불러오기
- **저장**: 상단 "저장" 버튼 클릭 → 로컬 스토리지에 저장
- **불러오기**: 상단 "불러오기" 버튼 클릭 → 이전 저장된 그래프 복원
- **삭제**: 상단 휴지통 아이콘 클릭 → 현재 그래프 초기화

## 개념 유형

그래프에서 노드는 3가지 유형으로 분류됩니다:

| 유형 | 설명 | 색상 | 아이콘 |
|------|------|------|--------|
| **Concept** | 추상적 개념 | 파란색 | 💡 |
| **Entity** | 구체적 대상 | 보라색 | 📦 |
| **Operation** | 작업/연산 | 주황색 | 🔧 |

## 관계 유형

노드 간 관계는 다음과 같이 분류됩니다:
- `has-a`: 포함 관계 (예: 분수 → 분자)
- `is-a`: 상속 관계
- `part-of`: 부분 관계
- `relates-to`: 일반적 연관 관계
- `divided-into`: 분할 관계 (예: 피자 → 조각)
- `custom`: 사용자 정의 관계

## 프로젝트 구조

```
lms-graph-sketch/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   └── Header.tsx              # 상단 헤더 및 저장/불러오기 기능
│   │   ├── TextInput/
│   │   │   └── TextInputPanel.tsx      # 텍스트 입력 패널
│   │   └── GraphVisualization/
│   │       ├── GraphCanvas.tsx         # React Flow 그래프 캔버스
│   │       └── CustomNode.tsx          # 커스텀 노드 컴포넌트
│   ├── services/
│   │   └── conceptExtraction.ts        # AI 개념 추출 서비스
│   ├── store/
│   │   └── graphStore.ts               # Zustand 상태 관리
│   ├── types/
│   │   └── graph.ts                    # TypeScript 타입 정의
│   ├── App.tsx                         # 메인 앱 컴포넌트
│   ├── main.tsx                        # 앱 엔트리 포인트
│   └── index.css                       # 글로벌 스타일
├── public/                             # 정적 파일
├── package.json
├── vite.config.ts
└── README.md
```

## 향후 개선 사항

### Phase 1: AI 연동 강화
- [ ] Claude API 실제 연동 (현재는 Mock 데이터 사용)
- [ ] 개념 추출 정확도 향상
- [ ] 다양한 교육 도메인 지원

### Phase 2: LMS 연동
- [ ] LTI (Learning Tools Interoperability) 표준 지원
- [ ] Canvas, Moodle, Blackboard 연동
- [ ] 학생 진도 데이터 시각화

### Phase 3: 고급 기능
- [ ] 그래프 레이아웃 알고리즘 개선 (Force-directed, Hierarchical)
- [ ] 그래프 내보내기 (PNG, SVG, JSON)
- [ ] 협업 편집 기능
- [ ] 온톨로지 기반 검증
- [ ] 다국어 지원 확장

### Phase 4: UX 개선
- [ ] 튜토리얼 및 온보딩
- [ ] 키보드 단축키
- [ ] 다크 모드
- [ ] 모바일 반응형 최적화

## 라이선스

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 기여

이슈 제보 및 풀 리퀘스트를 환영합니다!

## 문의

프로젝트 관련 문의사항은 이슈 트래커를 이용해주세요.

---

**Made with ❤️ for Education**
