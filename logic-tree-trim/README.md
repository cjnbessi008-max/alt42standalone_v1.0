# Logic Tree Trim

논리식 단순화 과정을 나무 가지치기처럼 시각적으로 표현하는 교육용 웹 애플리케이션입니다.

## 주요 기능

- **논리식 파싱**: 자연어 형태의 논리식 입력 지원 (AND, OR, NOT)
- **자동 단순화**: 7가지 논리 규칙을 적용한 자동 단순화
  - 이중 부정 제거 (Double Negation)
  - 항등원 법칙 (Identity Law)
  - 영원 법칙 (Annihilation Law)
  - 멱등성 (Idempotent Law)
  - 보수 법칙 (Complement Law)
  - 드모르간 법칙 (De Morgan's Law)
  - 흡수 법칙 (Absorption Law)
- **트리 시각화**: 논리식을 트리 구조로 시각화
- **가지치기 애니메이션**: 단순화 과정을 애니메이션으로 표현
- **스마트폰 UI**: 우측 하단 가상 스마트폰 화면에 표시
- **단계별 진행**: 각 단순화 단계를 하나씩 확인 가능

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 3.x
- **Animation**: Framer Motion

## 설치 및 실행

### 개발 서버 실행

\`\`\`bash
cd logic-tree-trim
npm install
npm run dev
\`\`\`

브라우저에서 \`http://localhost:5173\` 접속

### 프로덕션 빌드

\`\`\`bash
npm run build
\`\`\`

## 사용 방법

### 1. 논리식 입력

**지원 연산자:**
- \`AND\`, \`&\` - 논리곱
- \`OR\`, \`|\` - 논리합
- \`NOT\`, \`!\` - 부정
- \`()\` - 괄호로 우선순위 지정

**예제:**
- \`A AND B\`
- \`A OR (B AND C)\`
- \`NOT (A AND B)\`
- \`A AND NOT A\`

### 2. 시각화 보기

"단순화 시작" 버튼 클릭 후 우측 하단 스마트폰 화면에서 트리 시각화를 확인하세요.

## 라이선스

MIT License
