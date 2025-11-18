# 벡터 성분 드래그 앱 (Vector Component Drag Application)

실시간으로 벡터를 드래그하여 조작할 수 있는 인터랙티브 교육용 웹 애플리케이션입니다.

## 주요 기능

### 📱 Component Drag (벡터 성분 드래그)
- **실시간 그래프 업데이트**: 벡터를 드래그하면 그래프가 즉시 변화합니다
- **합성 벡터 계산**: 모든 벡터의 합성(resultant)을 자동으로 계산하고 표시합니다
- **터치/마우스 지원**: 모바일, 태블릿, 데스크톱에서 모두 사용 가능합니다

### 🎯 주요 특징
- ✅ SVG 기반 고품질 벡터 렌더링
- ✅ 터치 및 마우스 드래그 지원
- ✅ 반응형 디자인 (모바일/태블릿/데스크톱)
- ✅ 실시간 벡터 계산 및 시각화
- ✅ 우측 하단 가상 스마트폰 화면 (데스크톱)
- ✅ Moodle LMS 연동 준비

## 기술 스택

### Frontend
- **React 18** - 최신 React 버전
- **TypeScript 5** - 타입 안정성
- **Vite 4** - 빠른 빌드 도구
- **SVG** - 벡터 그래픽 렌더링

### LMS 연동
- **Moodle 3.7** 호환
- **PHP 7.1.9**
- **MySQL 5.7**

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 프로덕션 빌드
```bash
npm run build
```

### 4. 빌드 미리보기
```bash
npm run preview
```

## 프로젝트 구조

```
src/
├── frontend/
│   ├── components/
│   │   ├── interactions/
│   │   │   └── DraggableVector.tsx      # 드래그 가능한 벡터 컴포넌트
│   │   ├── canvas/
│   │   │   └── VectorCanvas.tsx         # 메인 캔버스 컴포넌트
│   │   └── visualizations/
│   ├── hooks/
│   │   ├── useDragAndDrop.ts            # 드래그 앤 드롭 훅
│   │   └── useVectorTransform.ts        # 벡터 변환 훅
│   ├── utils/
│   │   ├── vectorMath.ts                # 벡터 수학 유틸리티
│   │   └── dragValidation.ts            # 드래그 검증
│   ├── types/
│   │   ├── vector.types.ts              # 벡터 타입 정의
│   │   └── drag.types.ts                # 드래그 타입 정의
│   ├── responsive/
│   │   ├── hooks/
│   │   │   └── useResponsive.ts         # 반응형 훅
│   │   ├── components/
│   │   │   └── SmartphoneFrame.tsx      # 스마트폰 프레임
│   │   └── styles/
│   │       └── mobile.css               # 모바일 스타일
│   └── App.tsx                          # 메인 앱 컴포넌트
└── main.tsx                             # 진입점
```

## 사용 방법

### 벡터 조작
1. **드래그**: 벡터 끝의 원을 마우스나 터치로 드래그
2. **추가**: "벡터 추가" 버튼으로 새 벡터 생성
3. **초기화**: "초기화" 버튼으로 초기 상태로 복원
4. **합성벡터**: 토글 버튼으로 합성벡터 표시/숨김

### 반응형 기능
- **모바일**: 세로 모드 최적화, 터치 드래그 지원
- **태블릿**: 가로/세로 모드 자동 조정
- **데스크톱**: 스마트폰 시뮬레이터 우측 하단 표시

## 주요 컴포넌트

### VectorCanvas
메인 캔버스 컴포넌트로 그리드, 축, 벡터를 렌더링합니다.

**Props:**
- `width`, `height`: 캔버스 크기
- `graphState`: 그래프 설정 (원점, 스케일, 축 범위 등)
- `vectors`: 표시할 벡터 배열
- `onVectorChange`: 벡터 변경 핸들러
- `showResultant`: 합성벡터 표시 여부

### DraggableVector
개별 벡터를 렌더링하고 드래그 기능을 제공합니다.

**Props:**
- `vector`: 벡터 데이터
- `origin`: 원점 좌표
- `scale`: 스케일 팩터
- `onVectorChange`: 변경 핸들러
- `constraints`: 드래그 제약 조건

### SmartphoneFrame
가상 스마트폰 화면을 시뮬레이션합니다.

**Props:**
- `children`: 표시할 컨텐츠
- `position`: 화면 위치 (bottom-right, center, bottom-left)
- `width`, `height`: 프레임 크기

## 커스텀 훅

### useDragAndDrop
드래그 앤 드롭 기능을 제공하는 React 훅입니다.

```typescript
const { dragState, handleDragStart, isDragging } = useDragAndDrop({
  enabled: true,
  constraints: { minX: 0, maxX: 800 },
  handlers: {
    onDragStart: (id, position) => {},
    onDrag: (id, position, delta) => {},
    onDragEnd: (id, position) => {},
  },
});
```

### useVectorTransform
벡터 변환 연산을 관리하는 훅입니다.

```typescript
const {
  vectors,
  updateVector,
  addVector,
  removeVector,
  getResultant,
} = useVectorTransform(initialVectors);
```

### useResponsive
화면 크기와 디바이스 타입을 감지합니다.

```typescript
const {
  deviceType,
  isMobile,
  isTablet,
  isDesktop,
  orientation,
} = useResponsive();
```

## 벡터 수학 유틸리티

`src/frontend/utils/vectorMath.ts`에서 제공하는 주요 함수:

- `addVectors(a, b)` - 벡터 덧셈
- `subtractVectors(a, b)` - 벡터 뺄셈
- `scaleVector(v, scale)` - 스칼라 곱
- `magnitude(v)` - 벡터 크기
- `normalize(v)` - 정규화
- `rotateVector(v, angle)` - 회전
- `dotProduct(a, b)` - 내적
- `distance(a, b)` - 거리 계산

## LMS 연동 (향후 계획)

### Moodle 연동
- LTI (Learning Tools Interoperability) 표준 지원
- SCORM 패키지 내보내기
- xAPI (Experience API) 학습 데이터 추적

### 데이터베이스 스키마 (MySQL 5.7)
```sql
-- 학생 학습 데이터
CREATE TABLE student_vectors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  problem_id INT,
  vectors JSON,
  resultant JSON,
  timestamp DATETIME,
  score DECIMAL(5,2)
);
```

## 브라우저 지원

- ✅ Chrome/Edge (최신 2개 버전)
- ✅ Firefox (최신 2개 버전)
- ✅ Safari (최신 2개 버전)
- ✅ iOS Safari (iOS 13+)
- ✅ Chrome Android (최신)

## 개발 가이드

### 새 벡터 컴포넌트 추가
1. `src/frontend/components/interactions/` 에 새 컴포넌트 생성
2. `VectorComponent` 인터페이스 확장
3. `VectorCanvas`에 렌더링 로직 추가

### 커스텀 드래그 동작 추가
1. `DragConfig` 타입 확장
2. `useDragAndDrop` 훅에 핸들러 추가
3. 드래그 검증 로직 `dragValidation.ts`에 추가

## 라이선스

MIT

## 기여

이슈와 PR을 환영합니다!

## 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.
