# Inflection Tilt - LMS Education App

웹앱으로 LMS(Moodle)와 연동하여 문제 정보를 받아 동작하는 수학 학습 시스템입니다.
우측 하단에 표시되는 가상 스마트폰 화면에서 변곡점을 탐색하면 화면이 기울어지는 **Inflection Tilt** 효과가 적용됩니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Build Tool**: Vite
- **LMS**: Moodle 3.7 (MySQL 5.7, PHP 7.1.9) - Mock 데이터로 시작

## 주요 기능

### 1. 가상 스마트폰 화면 (우측 하단)
- 실제 스마트폰과 유사한 UI 디자인
- Notch, 상태바, 홈 인디케이터 포함
- 반응형 디자인 지원

### 2. Inflection Tilt 효과
- 변곡점 근처에 마우스를 가져가면 감지
- 스마트폰 화면이 3도 기울어지는 애니메이션
- Spring 기반 부드러운 전환 효과
- 변곡점 발견 시 시각적 피드백

### 3. 수학 그래프 시각화
- 3차 함수 그래프 자동 생성 (f(x) = x³ - 3x² + 2)
- 변곡점 자동 계산 및 표시
- 인터랙티브 툴팁
- 애니메이션 그래프 렌더링

### 4. Moodle LMS 연동 (Mock)
- 문제 데이터 구조 정의
- 확장 가능한 API 인터페이스

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 프로젝트 구조

```
src/
├── components/
│   ├── SmartphoneScreen.tsx    # 가상 스마트폰 컴포넌트
│   ├── SmartphoneScreen.css
│   ├── MathGraph.tsx            # 수학 그래프 컴포넌트
│   └── MathGraph.css
├── styles/
│   └── main.css                 # 전역 스타일
├── types.ts                     # TypeScript 타입 정의
├── App.tsx                      # 메인 앱 컴포넌트
└── index.tsx                    # 엔트리 포인트
```

## Inflection Tilt 동작 원리

1. **변곡점 감지**: 사용자가 그래프 위에 마우스를 올리면 좌표 확인
2. **근접 판단**: 변곡점으로부터 0.3 이내 거리면 감지
3. **애니메이션 트리거**:
   - Z축 회전 (3도 또는 -3도)
   - 스케일 확대 (1.05배)
   - Spring 애니메이션 적용
4. **자동 복귀**: 1.5초 후 원래 상태로 복귀

## Moodle 연동 확장

현재는 Mock 데이터를 사용하지만, 다음과 같이 확장 가능합니다:

```typescript
// src/api/moodle.ts (추가 예정)
interface MoodleConfig {
  baseUrl: string
  token: string
}

async function fetchProblem(problemId: number): Promise<ProblemData> {
  const response = await fetch(`${baseUrl}/webservice/rest/server.php`, {
    method: 'POST',
    body: new URLSearchParams({
      wstoken: token,
      wsfunction: 'mod_quiz_get_quiz_by_id',
      quizid: problemId.toString(),
      moodlewsrestformat: 'json'
    })
  })
  return response.json()
}
```

## 커스터마이징

### 변곡점 감지 민감도 조정

`src/components/MathGraph.tsx`:
```typescript
const isNearInflection = (point: Point): boolean => {
  return problemData.inflectionPoints.some(
    inflection => Math.abs(point.x - inflection.x) < 0.3  // 이 값을 조정
  )
}
```

### Tilt 각도 조정

`src/components/SmartphoneScreen.tsx`:
```typescript
const angle = (point.x % 2 === 0) ? 3 : -3  // 각도 조정 (현재 ±3도)
```

## 브라우저 지원

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (responsive)

## 라이선스

MIT

## 향후 계획

- [ ] 실제 Moodle API 연동
- [ ] 다양한 함수 타입 지원 (2차, 삼각함수 등)
- [ ] 사용자 진행도 추적
- [ ] 멀티플레이어 모드
- [ ] 성취 시스템
