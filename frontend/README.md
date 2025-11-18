# LMS 규칙 복잡도 분석기

헷갈릴 만한 조건을 자동으로 감지하고 경고 아이콘을 표시하는 독립형 웹앱입니다.

## 주요 기능

### 1. 실시간 복잡도 분석
- 규칙 작성 중 실시간으로 복잡도를 분석합니다
- 조건 개수, 중첩 깊이, 엔티티 수, 순환 참조를 자동 감지합니다

### 2. 경고 아이콘 시스템
- 복잡도에 따라 색상과 아이콘이 변경됩니다:
  - ✅ 녹색 (없음): 복잡도 없음
  - ℹ️ 파란색 (낮음): 낮은 복잡도
  - ⚠️ 주황색 (중간): 중간 복잡도
  - ❌ 빨간색 (높음): 높은 복잡도
  - 🔴 진한 빨간색 (매우 높음): 매우 높은 복잡도

### 3. 상세한 개선 권장사항
- 각 경고마다 구체적인 개선 방법을 제공합니다
- 툴팁으로 메트릭과 권장사항을 확인할 수 있습니다

## 복잡도 평가 기준

### 조건 개수
- **3개 초과**: 중간 복잡도
- **5개 초과**: 높은 복잡도
- **10개 초과**: 매우 높은 복잡도

### 중첩 깊이
- **3레벨 초과**: 높은 복잡도
- **5레벨 초과**: 매우 높은 복잡도

### 엔티티 수
- **4개 초과**: 중간 복잡도
- **6개 초과**: 높은 복잡도

### 순환 참조
- **감지 시**: 매우 높은 복잡도 (무한 루프 위험)

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

## 사용 예제

### 낮은 복잡도 규칙 (좋은 예)
```javascript
if (score >= 80) {
  return 'pass';
}
```

### 중간 복잡도 규칙
```javascript
if (score >= 80 && attendance > 0.9 && homework_completed) {
  return 'pass';
} else if (score >= 60) {
  return 'conditional_pass';
}
```

### 높은 복잡도 규칙 (경고)
```javascript
if (student.score >= 80 && student.attendance > 0.9) {
  if (student.homework.completed && student.homework.quality > 7) {
    if (student.participation.count > 5 || student.extra_credit > 0) {
      if (student.behavior.warnings < 2) {
        return 'excellent';
      }
    }
  }
}
```

### 개선된 규칙 (권장)
```javascript
// 조건을 여러 규칙으로 분리
const hasGoodAttendance = student.attendance > 0.9;
const hasQualityHomework = student.homework.completed && student.homework.quality > 7;
const isActiveParticipant = student.participation.count > 5 || student.extra_credit > 0;
const hasGoodBehavior = student.behavior.warnings < 2;

if (student.score >= 80 && hasGoodAttendance && hasQualityHomework && isActiveParticipant && hasGoodBehavior) {
  return 'excellent';
}
```

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI)
- **Form Management**: React Hook Form
- **Validation**: Zod
- **Build Tool**: Vite

## 프로젝트 구조

```
frontend/
├── src/
│   ├── components/
│   │   ├── ComplexityWarningIcon.tsx  # 경고 아이콘 컴포넌트
│   │   ├── RuleForm.tsx               # 규칙 입력 폼
│   │   └── RuleDashboard.tsx          # 규칙 대시보드
│   ├── types/
│   │   └── rule.ts                    # 타입 정의
│   ├── utils/
│   │   └── complexityAnalyzer.ts      # 복잡도 분석 로직
│   ├── App.tsx                        # 메인 앱
│   └── main.tsx                       # 엔트리 포인트
├── index.html
├── package.json
└── vite.config.ts
```

## 라이선스

MIT
