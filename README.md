# KTM Math Planet 🪐

**KAIST Touch Math의 AI 교육 시스템 파이프라인을 행성 여행 경험으로 재구성한 통합 world**

<div align="center">

```
        ☀️ KTM Math Sun
            |
    🔭──🧮──💾──🎮──🎨──🚀
    Discovery → Logic → Data → Interface → Creation → Launch
```

</div>

## 개요

KTM Math Planet은 선생님들이 우주선 선장이 되어 6개의 행성을 순차적으로 방문하며 교육 모듈을 완성하는 혁신적인 AI 교육 시스템입니다. 복잡한 파이프라인을 직관적이고 즐거운 행성 여행 메타포로 변환하여, 기술적 장벽 없이 누구나 혁신적인 교육 모듈을 만들 수 있습니다.

## 🌍 행성 시스템

### Planet 1: 🔭 Discovery Planet (발견의 행성)
- **파이프라인**: World Model Reconstruction
- **기능**: 자연어로 교육 모듈 설명 → AI가 개념과 관계 발견
- **상태**: ✅ 구현 완료

### Planet 2: 🧮 Logic Planet (논리의 행성)
- **파이프라인**: Rule Generation Engine
- **기능**: 교육 규칙 자동 생성 및 복잡도 분석
- **상태**: 🚧 개발 예정

### Planet 3: 💾 Data Planet (데이터의 행성)
- **파이프라인**: Data Management
- **기능**: 데이터베이스 스키마 자동 생성 및 가상 데이터 생성
- **상태**: 🚧 개발 예정

### Planet 4: 🎮 Interface Planet (상호작용의 행성)
- **파이프라인**: Input Strategy Design
- **기능**: 최적의 학생 입력 방법 설계
- **상태**: 🚧 개발 예정

### Planet 5: 🎨 Creation Planet (창조의 행성)
- **파이프라인**: UI Auto-Generation
- **기능**: React 컴포넌트 자동 생성
- **상태**: 🚧 개발 예정

### Planet 6: 🚀 Launch Planet (발사의 행성)
- **파이프라인**: Deployment
- **기능**: 최종 배포 및 테스트
- **상태**: 🚧 개발 예정

## 🚀 빠른 시작

### 프론트엔드 (React + TypeScript)

```bash
cd frontend
npm install
npm run dev
```

개발 서버가 http://localhost:3000 에서 실행됩니다.

### 백엔드 (Python FastAPI) - 개발 예정

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── docs/
│   └── ktm-math-planet-world-design.md    # 세계관 설계 문서
├── frontend/                               # React 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── universe/                  # 우주 지도 컴포넌트
│   │   │   │   ├── UniverseMap.tsx
│   │   │   │   ├── PlanetOrbit.tsx
│   │   │   │   └── Spaceship.tsx
│   │   │   ├── planets/                   # 행성별 컴포넌트
│   │   │   │   ├── Planet1_Discovery/
│   │   │   │   ├── Planet2_Logic/
│   │   │   │   ├── Planet3_Data/
│   │   │   │   ├── Planet4_Interface/
│   │   │   │   ├── Planet5_Creation/
│   │   │   │   └── Planet6_Launch/
│   │   │   ├── shared/                    # 공통 컴포넌트
│   │   │   │   └── PlanetContainer.tsx
│   │   │   └── layout/
│   │   ├── store/                         # 상태 관리 (Zustand)
│   │   │   └── journeyStore.ts
│   │   ├── types/                         # TypeScript 타입
│   │   │   ├── planets.ts
│   │   │   ├── pipeline.ts
│   │   │   └── module.ts
│   │   ├── services/                      # API 서비스
│   │   ├── hooks/                         # Custom Hooks
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
├── backend/                                # Python 백엔드 (개발 예정)
│   ├── api/
│   ├── pipeline/
│   ├── services/
│   └── main.py
└── tasks/
    └── 0001-prd-ai-education-pipeline.md  # PRD 문서
```

## 🛠️ 기술 스택

### 프론트엔드
- **프레임워크**: React 18 + TypeScript
- **상태 관리**: Zustand
- **애니메이션**: Framer Motion
- **스타일링**: Tailwind CSS
- **빌드 도구**: Vite
- **폼 관리**: React Hook Form + Yup

### 백엔드 (계획)
- **API**: Python FastAPI
- **AI**: Claude (Anthropic)
- **데이터베이스**: PostgreSQL
- **캐시**: Redis
- **작업 큐**: Celery

## 🎨 주요 기능

### 1. 우주 지도 (Universe Map)
- 6개 행성을 원형으로 배치한 태양계 뷰
- 실시간 진행률 표시 (우주선 건설 진행도)
- 행성 간 직관적인 네비게이션

### 2. 행성 워크플로우
각 행성은 독립적인 작업 공간을 제공:
- 단계별 가이드
- AI 도우미 통합
- 실시간 진행률 추적
- 자동 저장 기능

### 3. 시각적 피드백
- 행성별 고유한 색상 테마
- 애니메이션과 인터랙션
- 진행 상태에 따른 시각적 변화
- 완료 시 축하 애니메이션

### 4. AI 통합
- 자연어 처리로 요청 이해
- 실시간 AI 작업 상태 표시
- 명확화 질문 및 대화형 인터페이스

## 📊 데이터 흐름

```
선생님 입력 (Planet 1)
    ↓
AI 개념 발견 (World Model)
    ↓
규칙 생성 (Planet 2)
    ↓
데이터 스키마 설계 (Planet 3)
    ↓
입력 전략 결정 (Planet 4)
    ↓
UI 자동 생성 (Planet 5)
    ↓
배포 및 완성 (Planet 6)
    ↓
학생들 사용 시작! 🎉
```

## 🎯 사용자 여정

1. **시작**: 선생님이 우주 지도에서 새 모듈 생성 시작
2. **Discovery**: 자연어로 교육 모듈 설명
3. **Logic**: AI가 생성한 규칙 검토 및 승인
4. **Data**: 데이터베이스 구조 확인
5. **Interface**: 입력 방식 선택
6. **Creation**: UI 미리보기 및 수정
7. **Launch**: 최종 배포 및 학생 접근 허용

## 🔧 개발 가이드

### 새로운 행성 추가하기

1. `src/components/planets/PlanetX_Name/` 디렉토리 생성
2. `XPlanet.tsx` 컴포넌트 구현
3. `src/types/planets.ts`에 행성 메타데이터 추가
4. `App.tsx`에 라우팅 추가

### 상태 관리

모든 여정 상태는 Zustand store (`journeyStore.ts`)에서 관리:
- 현재 행성 위치
- 각 행성의 완료 상태
- 모듈 데이터
- 자동 저장 상태

## 📈 로드맵

### Phase 1 (현재)
- ✅ 우주 지도 UI
- ✅ Discovery Planet 구현
- ✅ 상태 관리 시스템
- ✅ 기본 네비게이션

### Phase 2 (다음)
- 🚧 나머지 5개 행성 구현
- 🚧 백엔드 API 통합
- 🚧 실시간 WebSocket 연결
- 🚧 AI 파이프라인 연결

### Phase 3 (미래)
- 📋 사용자 인증 및 권한
- 📋 모듈 관리 대시보드
- 📋 협업 기능
- 📋 분석 및 인사이트

## 🤝 기여하기

이 프로젝트는 KAIST Touch Math Academy의 AI 교육 시스템의 일부입니다.

## 📝 라이센스

Copyright © 2025 KAIST Touch Math Academy

## 📧 문의

프로젝트에 대한 문의사항은 KAIST Touch Math Academy로 연락해주세요.

---

**Made with ❤️ by Claude AI for KAIST Touch Math**
