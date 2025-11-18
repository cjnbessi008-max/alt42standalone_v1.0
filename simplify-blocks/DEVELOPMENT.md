# Simplify Blocks - 개발 가이드

## 프로젝트 개요

로그식 단순화를 블록 형태로 시각화하여 학습하는 독립형 웹 애플리케이션입니다.

## 시작하기

### 1. 의존성 설치

```bash
cd simplify-blocks
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 으로 접속하면 애플리케이션이 실행됩니다.

### 3. 빌드

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

### 4. 프로덕션 미리보기

```bash
npm run preview
```

## 주요 기능

### 1. 로그식 파싱 및 단순화

**파일**: `src/utils/logParser.ts`

- `LogParser` 클래스: 로그식을 파싱하고 블록으로 변환
- Math.js를 사용하여 수식 파싱
- 지원 법칙:
  - 곱셈 법칙: `log(a*b) = log(a) + log(b)`
  - 나눗셈 법칙: `log(a/b) = log(a) - log(b)`
  - 거듭제곱 법칙: `log(a^n) = n*log(a)`

### 2. 블록 시각화

**파일**: `src/components/Block.tsx`

- Framer Motion을 사용한 애니메이션
- 블록 타입별 색상 구분
- 계층 구조 표현 (children 블록)
- hover/tap 인터랙션

### 3. 스마트폰 시뮬레이터

**파일**: `src/components/PhoneSimulator.tsx`

- 우측 하단 고정 위치
- 실제 스마트폰 UI 모방 (노치, 상태바, 하단 버튼)
- 반응형 디자인 (모바일에서는 숨김)

### 4. 메인 UI

**파일**: `src/components/SimplifyBlocks.tsx`

- 로그식 입력 폼
- 샘플 문제 선택
- 단계별 단순화 결과 표시
- 네비게이션 (이전/다음/처음으로)

## 컴포넌트 구조

```
App
├── main-content
│   └── SimplifyBlocks
│       ├── 입력 섹션 (input-section)
│       │   ├── 로그식 입력 폼
│       │   └── 샘플 문제 선택
│       └── 시각화 섹션 (visualization-section)
│           ├── 단계 정보
│           ├── 변환 전/후 표시
│           ├── 블록 컨테이너
│           │   └── Block (재귀적 렌더링)
│           └── 컨트롤 버튼
└── PhoneSimulator
    └── SimplifyBlocks (동일 컴포넌트)
```

## 타입 정의

**파일**: `src/types/index.ts`

```typescript
interface LogBlock {
  id: string;
  type: 'log' | 'sum' | 'difference' | 'coefficient' | 'power';
  expression: string;
  level: number;
  children?: LogBlock[];
  color?: string;
}

interface SimplificationStep {
  id: string;
  rule: LogRule;
  description: string;
  before: string;
  after: string;
  blocks: LogBlock[];
}
```

## 스타일링

- CSS Modules 방식 사용
- 각 컴포넌트마다 `.css` 파일 분리
- 반응형 디자인 (@media queries)
- 그라데이션 및 그림자 효과 적용

### 주요 색상

- Primary: `#667eea` → `#764ba2` (그라데이션)
- 블록 색상: 레벨별 7가지 색상 순환
  - Turquoise: `#4ECDC4`
  - Red: `#FF6B6B`
  - Mint: `#95E1D3`
  - Pink: `#F38181`
  - Purple: `#AA96DA`
  - Light Pink: `#FCBAD3`
  - Light Blue: `#A8D8EA`

## 확장 가능성

### 1. 추가 로그 법칙 지원

`logParser.ts`에 새로운 메서드 추가:

```typescript
private applyNewRule(expr: string): string {
  // 새로운 법칙 구현
}
```

### 2. LMS 연동

향후 Moodle 연동을 위한 API 구조:

```typescript
// API 엔드포인트 (예정)
POST /api/problems          // 문제 생성
GET  /api/problems/:id      // 문제 조회
POST /api/submit            // 답안 제출
GET  /api/progress/:userId  // 진행 상황
```

### 3. 학습 추적

사용자 인터랙션 로깅:

```typescript
interface UserInteraction {
  timestamp: number;
  problemId: string;
  action: 'input' | 'simplify' | 'next' | 'prev';
  timeSpent: number;
}
```

## 디버깅 팁

### 1. 파싱 오류 확인

브라우저 콘솔에서 확인:

```javascript
console.log('Parse error:', error);
```

### 2. 블록 구조 확인

React DevTools를 사용하여 `LogBlock` state 확인

### 3. 애니메이션 성능

Framer Motion의 `useReducedMotion` 사용 고려

## 성능 최적화

### 현재 최적화

- React.memo 사용 (Block 컴포넌트)
- CSS transform을 활용한 애니메이션
- lazy loading (향후 적용 가능)

### 개선 가능 사항

- Math.js 대신 경량 파서 사용
- 블록 렌더링 가상화 (많은 블록의 경우)
- 코드 스플리팅 (현재 경고 있음)

## 테스트

### 수동 테스트 체크리스트

- [ ] 로그식 입력 및 단순화 동작
- [ ] 샘플 문제 5개 모두 정상 작동
- [ ] 블록 애니메이션 부드러움
- [ ] 이전/다음 버튼 정상 동작
- [ ] 스마트폰 시뮬레이터 표시 (데스크톱)
- [ ] 스마트폰 시뮬레이터 숨김 (모바일)
- [ ] 반응형 레이아웃 정상

### 자동 테스트 (향후)

```bash
npm run test  # Jest + React Testing Library
```

## 배포

### Vercel 배포 (추천)

```bash
npm install -g vercel
vercel
```

### Netlify 배포

```bash
npm run build
# dist/ 폴더를 Netlify에 드래그 앤 드롭
```

### 도커 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 문제 해결

### 1. npm install 실패

```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. 빌드 실패

TypeScript 오류 확인:

```bash
npm run build
# 오류 메시지 확인 후 수정
```

### 3. 개발 서버 포트 변경

`vite.config.ts`:

```typescript
server: {
  port: 5173  // 원하는 포트로 변경
}
```

## 라이선스

MIT License

## 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
