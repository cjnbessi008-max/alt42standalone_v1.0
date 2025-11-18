# Substitution Shift 사용 가이드

## 📱 개요

**Substitution Shift**는 치환적분(u-substitution)의 과정을 단계별로 색상 전환 효과와 함께 시각화하여, 학생들이 직관적으로 이해할 수 있도록 돕는 교육용 웹 애플리케이션입니다.

---

## 🎨 주요 기능

### 1. 가상 스마트폰 화면
- 우측 하단에 실제 스마트폰처럼 보이는 시뮬레이터
- 모바일 환경을 데스크탑에서 미리 체험
- 반응형 디자인으로 실제 모바일에서도 최적화

### 2. 색상 전환 효과
각 단계마다 고유한 색상이 적용되어 치환 과정을 시각적으로 구분:

| 단계 | 설명 | 색상 |
|------|------|------|
| **Step 1** | 원본 적분식 | 검정색 (#000000) |
| **Step 2** | u 치환 정의 | 빨강색 (#FF4444) |
| **Step 3** | 치환 적용 | 파랑색 (#4444FF) |
| **Step 4** | 적분 계산 | 보라색 (#AA44FF) |
| **Step 5** | 역치환 및 최종 답 | 초록색 (#44AA44) |

### 3. 단계별 애니메이션
- 자동 재생 기능으로 순차적 학습
- 수동 제어로 원하는 단계 반복 학습
- 속도 조절 가능 (빠름/보통/느림)

### 4. 인터랙티브 타임라인
- 각 단계를 점으로 표시
- 클릭하여 특정 단계로 즉시 이동
- 현재 단계 강조 표시

---

## 🎯 사용 방법

### 학생용 가이드

#### 1. 문제 시작하기

웹 브라우저에서 앱 접속:
```
https://your-domain.com/substitution-shift/
```

또는 Moodle에서 직접 접속 (iframe 임베드 방식)

#### 2. 화면 구성 이해하기

```
┌─────────────────────────────────────────────┐
│  메인 화면                                   │
│  - 제목: Substitution Shift                 │
│  - 사용 방법 안내                            │
│                                              │
│                                              │
│          ┌────────────────────┐             │
│          │  스마트폰 시뮬레이터│             │
│          │  ┌──────────────┐ │  ← 우측 하단│
│          │  │ 단계 1/5     │ │             │
│          │  │ 원본 식      │ │             │
│          │  │              │ │             │
│          │  │ ∫ 2x·cos(x²)dx│ │            │
│          │  │              │ │             │
│          │  │ [타임라인]   │ │             │
│          │  │ ◀ ⏸ ▶       │ │             │
│          │  └──────────────┘ │             │
│          └────────────────────┘             │
└─────────────────────────────────────────────┘
```

#### 3. 컨트롤 버튼 사용하기

**⟲ 처음으로**
- 첫 번째 단계로 돌아가기
- 문제를 처음부터 다시 학습

**◀ 이전 단계**
- 이전 단계로 이동
- 첫 단계에서는 비활성화

**▶ 재생/일시정지**
- 자동으로 단계별 진행
- 클릭하면 일시정지

**▶ 다음 단계**
- 다음 단계로 이동
- 마지막 단계에서는 비활성화

**속도 조절**
- 빠름: 1초 간격
- 보통: 2초 간격 (기본값)
- 느림: 3초 간격

#### 4. 단계별 학습하기

**Step 1: 원본 식 확인**
```
∫ 2x · cos(x²) dx
```
- 검정색으로 표시
- 어떤 부분을 치환할지 생각

**Step 2: u 치환 정의**
```
u = x²
du = 2x dx
```
- 빨강색으로 표시
- 치환할 변수와 미분 관계 확인

**Step 3: 치환 적용**
```
∫ cos(u) du
```
- 파랑색으로 표시
- 원래 식이 간단하게 변환됨을 확인

**Step 4: 적분**
```
sin(u) + C
```
- 보라색으로 표시
- u에 대해 적분 수행

**Step 5: 역치환**
```
sin(x²) + C
```
- 초록색으로 표시
- 최종 답 확인

#### 5. 타임라인 활용하기

화면 하단의 타임라인:
```
●────●────●────●────●
1    2    3    4    5
```

- 각 점을 클릭하면 해당 단계로 바로 이동
- 현재 단계는 크게 표시
- 완료된 단계는 색상으로 채워짐

#### 6. 추가 정보 확인하기

**치환 정보 섹션**
- u = (치환식)
- du = (미분식)
- 항상 표시되어 참고 가능

**최종 답 섹션**
- 마지막 단계 도달 시 표시
- 초록색 배경으로 강조

**힌트 섹션** (있는 경우)
- 💡 아이콘으로 표시
- 문제 해결에 도움되는 팁

---

## 👨‍🏫 교사용 가이드

### 문제 추가하기

MySQL 데이터베이스에 직접 추가하거나 관리자 페이지 사용:

```sql
INSERT INTO substitution_problems
  (title, description, original_integral,
   substitution_variable, substitution_expression, du_expression,
   steps, final_answer, difficulty_level, category, hints)
VALUES
  (
    '삼각함수 합성',
    '삼각함수의 곱을 적분합니다.',
    '\\int \\sin(2x) \\cos(2x) \\, dx',
    'u',
    '\\sin(2x)',
    '2\\cos(2x) \\, dx',
    JSON_ARRAY(
      JSON_OBJECT('step', 1, 'description', '원본 식',
                  'expression', '\\int \\sin(2x) \\cos(2x) \\, dx',
                  'color', '#000000'),
      JSON_OBJECT('step', 2, 'description', 'u 치환',
                  'expression', 'u = \\sin(2x), \\quad du = 2\\cos(2x) \\, dx',
                  'color', '#FF4444'),
      JSON_OBJECT('step', 3, 'description', '치환 적용',
                  'expression', '\\int \\frac{u}{2} \\, du',
                  'color', '#4444FF'),
      JSON_OBJECT('step', 4, 'description', '적분',
                  'expression', '\\frac{u^2}{4} + C',
                  'color', '#AA44FF'),
      JSON_OBJECT('step', 5, 'description', '역치환',
                  'expression', '\\frac{\\sin^2(2x)}{4} + C',
                  'color', '#44AA44')
    ),
    '\\frac{\\sin^2(2x)}{4} + C',
    'medium',
    '치환적분-삼각함수',
    JSON_ARRAY('sin(2x)를 u로 치환해보세요', '계수에 주의하세요')
  );
```

### Moodle 연동하기

#### 방법 1: iframe 임베드

Moodle 페이지 편집 모드에서 HTML 소스 편집:

```html
<div style="text-align: center; margin: 20px 0;">
  <h3>치환적분 시각화 학습</h3>
  <iframe
    src="https://your-domain.com/substitution-shift/?moodle_id=<문제ID>"
    width="100%"
    height="800px"
    style="border: 2px solid #ddd; border-radius: 10px;"
    allowfullscreen>
  </iframe>
</div>
```

#### 방법 2: 외부 도구로 추가

1. Moodle 관리자 > 플러그인 > 활동 모듈 > 외부 도구
2. "도구 설정" 추가
3. URL: `https://your-domain.com/substitution-shift/`
4. 코스에 외부 도구 활동 추가

### 학생 진행도 확인하기

SQL 쿼리로 통계 조회:

```sql
-- 학생별 완료율
SELECT
  student_id,
  COUNT(DISTINCT problem_id) as problems_attempted,
  AVG(score) as average_score,
  SUM(time_spent_seconds) as total_time
FROM student_attempts
WHERE is_correct = TRUE
GROUP BY student_id;

-- 문제별 난이도 분석
SELECT
  p.title,
  p.difficulty_level,
  COUNT(a.id) as total_attempts,
  AVG(a.is_correct) * 100 as success_rate,
  AVG(a.time_spent_seconds) as avg_time
FROM substitution_problems p
LEFT JOIN student_attempts a ON p.id = a.problem_id
GROUP BY p.id;
```

---

## 🎓 학습 팁

### 효과적인 학습 방법

1. **첫 시청: 자동 재생**
   - ▶ 버튼으로 전체 과정 자동 재생
   - 전체 흐름 파악

2. **두 번째: 단계별 분석**
   - ◀ ▶ 버튼으로 천천히 이동
   - 각 단계에서 무엇이 변하는지 관찰

3. **세 번째: 타임라인 활용**
   - 특정 단계 반복 학습
   - 이해가 안 되는 부분 집중

4. **직접 풀어보기**
   - 앱을 보지 않고 종이에 풀어보기
   - 막히면 힌트 확인
   - 답 확인

### 색상의 의미 이해하기

- **빨강 (치환 정의)**: 새로운 변수 도입
- **파랑 (치환 적용)**: 원래 식이 변환됨
- **보라 (적분)**: 새로운 변수로 계산
- **초록 (최종 답)**: 원래 변수로 복원

---

## 🔧 문제 해결

### 수식이 깨져 보임
- 인터넷 연결 확인 (KaTeX CDN 필요)
- 브라우저 캐시 삭제 후 새로고침

### 애니메이션이 작동하지 않음
- JavaScript가 활성화되어 있는지 확인
- 최신 브라우저 사용 (Chrome, Firefox, Safari, Edge)

### 스마트폰 화면이 보이지 않음
- 화면 크기가 너무 작을 수 있음 (최소 1024px 권장)
- 모바일에서는 전체 화면으로 표시됨

---

## 📞 지원 및 피드백

### 기술 지원
- 이메일: support@kaist-touchmath.ac.kr
- 사용 중 오류 발생 시 스크린샷과 함께 문의

### 피드백
- 개선 아이디어나 버그 리포트 환영
- GitHub Issues 또는 이메일로 제보

---

## 📚 추가 자료

### 치환적분 학습 자료
- [Khan Academy - Integration by Substitution](https://www.khanacademy.org/)
- KAIST Touch Math Academy 강의 노트

### 수학 표기법 (LaTeX)
- [KaTeX 지원 함수 목록](https://katex.org/docs/supported.html)
- LaTeX 수식 작성법

---

## 🎉 성공적인 학습을 응원합니다!

치환적분은 어렵게 느껴질 수 있지만, Substitution Shift와 함께라면 색상과 애니메이션으로 직관적으로 이해할 수 있습니다.

**꾸준히 연습하세요!** 🚀
