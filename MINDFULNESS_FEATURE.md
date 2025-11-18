# 마인드풀니스 루틴 기능 명세서

## 개요

LMS 웹앱에서 문제 전환 사이에 마인드풀니스 루틴을 통합하여 학습자의 집중력 향상과 스트레스 감소를 돕는 기능입니다.

## 배경 및 목적

### 교육적 배경
- 연구에 따르면 짧은 휴식과 마인드풀니스 활동은 학습 효율을 높입니다
- 연속적인 문제 풀이는 인지 피로를 유발할 수 있습니다
- 마인드풀니스는 학습자의 정서적 안정과 집중력 향상에 효과적입니다

### 목적
1. **학습 효율 향상**: 적절한 휴식을 통한 인지 기능 회복
2. **스트레스 감소**: 시험 불안 및 학습 스트레스 완화
3. **집중력 유지**: 장시간 학습 시 집중력 저하 방지
4. **건강한 학습 습관**: 자기 조절 능력 향상

## 주요 기능

### 1. 세 가지 루틴 유형

#### 호흡 운동 (Breathing Exercise)
- **목적**: 자율신경계 안정화, 스트레스 호르몬 감소
- **구성**:
  - 4초 들이쉬기 (Inhale)
  - 4초 멈추기 (Hold)
  - 4초 내쉬기 (Exhale)
- **시각적 요소**: 확장/축소되는 원형 애니메이션
- **권장 시간**: 30-60초

#### 스트레칭 (Stretch)
- **목적**: 근육 긴장 완화, 혈액 순환 개선
- **구성**:
  - 목 운동: 좌우 회전
  - 어깨 운동: 상하 움직임
  - 손목 운동: 회전 운동
- **권장 시간**: 30-45초

#### 휴식 (Pause)
- **목적**: 정신적 휴식, 과제 전환 준비
- **구성**:
  - 격려 메시지
  - 눈 감고 쉬기 안내
  - 긍정적 피드백
- **권장 시간**: 15-30초

### 2. 사용자 설정 옵션

#### 활성화/비활성화
- 마인드풀니스 루틴 on/off
- 사용자 선호에 따라 자유롭게 설정

#### 루틴 유형 선택
- 세 가지 루틴 중 선택
- 개인의 선호도에 맞게 커스터마이즈

#### 지속 시간 조정
- 범위: 10초 ~ 120초
- 학습 상황에 맞게 조절 가능

#### 표시 빈도 설정
- 매 문제마다 (기본값)
- N문제마다 (1-10문제 범위)
- 학습 리듬에 맞게 조정

#### 건너뛰기 옵션
- 필요시 건너뛰기 허용
- 학습자의 자율성 보장

#### 타이머 표시
- 남은 시간 표시 on/off
- 시간 인식 필요 여부에 따라 선택

### 3. 통합 방식

#### ProblemNavigator 컴포넌트
- 문제 네비게이션과 마인드풀니스 자동 통합
- 설정된 빈도에 따라 자동 표시
- 매끄러운 전환 효과

#### 독립 실행 모드
- 마인드풀니스 루틴만 별도 사용 가능
- 다양한 학습 시나리오에 적용 가능

### 4. 데이터 저장

#### LocalStorage 활용
- 사용자 설정 영구 저장
- 세션 간 설정 유지
- 개인화된 경험 제공

## 기술 사양

### 프론트엔드
- **프레임워크**: React 18+
- **언어**: TypeScript
- **스타일링**: CSS3 (CSS-in-JS 없음, 순수 CSS)
- **애니메이션**: CSS Transitions & Keyframes

### 컴포넌트 구조

```
src/components/mindfulness/
├── MindfulnessRoutine.tsx      # 메인 루틴 컴포넌트
├── MindfulnessRoutine.css      # 스타일
├── ProblemNavigator.tsx        # 문제 네비게이터
├── MindfulnessSettings.tsx     # 설정 UI
├── MindfulnessSettings.css     # 설정 스타일
├── useMindfulness.ts           # 설정 관리 훅
├── index.ts                    # 모듈 export
└── README.md                   # 사용 가이드
```

### Props 인터페이스

#### MindfulnessRoutine
```typescript
interface MindfulnessRoutineProps {
  onComplete: () => void;
  duration?: number;
  routineType?: 'breathing' | 'stretch' | 'pause';
  allowSkip?: boolean;
  showTimer?: boolean;
}
```

#### ProblemNavigator
```typescript
interface ProblemNavigatorProps {
  problems: Problem[];
  currentIndex: number;
  onNext: (nextIndex: number) => void;
  onPrevious?: (prevIndex: number) => void;
  mindfulnessSettings?: MindfulnessSettings;
  renderProblem: (problem: Problem, index: number) => ReactNode;
  onComplete?: () => void;
}
```

## 사용 시나리오

### 시나리오 1: 수학 문제 풀이
```
학생이 연속으로 5문제를 풀고 있음
→ 3문제째 완료 후 30초 호흡 운동
→ 집중력 회복 후 4번째 문제 시작
→ 5문제 완료 후 다시 마인드풀니스
```

### 시나리오 2: 시험 준비
```
모의고사 20문제
→ 5문제마다 15초 짧은 휴식
→ 10문제 완료 후 45초 스트레칭
→ 시험 불안 감소, 집중력 유지
```

### 시나리오 3: 커스텀 학습
```
개인 학습 세션
→ 학습자가 필요할 때 수동으로 마인드풀니스 호출
→ 학습 스타일에 맞게 자유롭게 사용
```

## 접근성 (Accessibility)

### ARIA 지원
- 모든 버튼에 `aria-label` 제공
- 스크린 리더 호환

### 키보드 네비게이션
- Tab으로 포커스 이동
- Enter/Space로 버튼 활성화
- ESC로 건너뛰기 (선택적)

### 모션 감소 지원
- `prefers-reduced-motion` 미디어 쿼리
- 애니메이션 자동 비활성화

### 색상 대비
- WCAG 2.1 AA 기준 준수
- 텍스트 가독성 보장

## 성능 최적화

### React 최적화
- `useCallback` 훅으로 불필요한 리렌더링 방지
- 상태 관리 최소화

### CSS 최적화
- CSS Transform 사용 (GPU 가속)
- Will-change 속성 활용
- 레이아웃 리플로우 최소화

### 번들 크기
- Tree-shaking 지원
- 개별 컴포넌트 import 가능
- 예상 번들 크기: ~15KB (gzipped)

## 브라우저 지원

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## 향후 개선 방향

### Phase 1 (현재)
- ✅ 기본 마인드풀니스 루틴 3종
- ✅ 설정 UI
- ✅ 문제 네비게이터 통합

### Phase 2 (계획)
- [ ] 음성 가이드 추가
- [ ] 배경 음악/자연음 옵션
- [ ] 진행 상황 시각화
- [ ] 통계 및 분석 기능

### Phase 3 (계획)
- [ ] AI 기반 개인화 추천
- [ ] 생체 신호 연동 (선택적)
- [ ] 소셜 기능 (친구와 함께 마인드풀니스)
- [ ] 다국어 지원 확대

## 연구 기반 근거

### 교육 심리학 연구
1. **Spacing Effect**: 분산 학습이 집중 학습보다 효과적
2. **Cognitive Load Theory**: 적절한 휴식이 인지 부하 감소
3. **Mindfulness in Education**: 마인드풀니스가 학업 성취도 향상

### 참고 문헌
- Zenner, C., Herrnleben-Kurz, S., & Walach, H. (2014). Mindfulness-based interventions in schools
- Dunlosky, J., et al. (2013). Improving Students' Learning With Effective Learning Techniques
- Klingberg, T. (2010). Training and plasticity of working memory

## 라이선스 및 기여

- **라이선스**: MIT
- **기여 방법**: Pull Request 환영
- **문의**: GitHub Issues

## 결론

마인드풀니스 루틴 기능은 단순한 휴식 타이머가 아닌, 과학적 연구에 기반한 학습 최적화 도구입니다. 학습자의 집중력, 웰빙, 학습 효율을 동시에 개선하여 더 나은 교육 경험을 제공합니다.
