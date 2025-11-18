# ALT42 Standalone v1.0 - Zero Spark Math

**KAIST Touch Math Academy - Interactive Function Explorer**

## 개요 / Overview

ALT42 Standalone은 수학 함수의 근(영점)을 찾아 시각적으로 표현하는 웹 기반 교육 애플리케이션입니다. 근을 발견할 때 해당 지점에서 아름다운 스파크 효과가 발생하여 학습자의 흥미를 높입니다.

ALT42 Standalone is a web-based educational application that finds and visualizes zeros (roots) of mathematical functions. When zeros are discovered, beautiful spark effects appear at those points to enhance learner engagement.

## 주요 기능 / Key Features

### ✨ Zero Spark Effect
- **스파크 파티클 애니메이션**: 근을 발견하면 화려한 파티클 효과가 발생
- **펄스 효과**: 근 주변에서 맥동하는 빛 효과
- **회전 별 마커**: 근 위치를 표시하는 애니메이션 별 아이콘
- **사운드 효과**: 근 발견 시 청각적 피드백 (선택 사항)

### 📱 Virtual Smartphone Display
- 우측 하단에 가상 스마트폰 화면 표시
- 반응형 디자인으로 다양한 디바이스 지원
- 실제 스마트폰과 유사한 UI/UX

### 📊 Mathematical Features
- **함수 입력**: 다양한 수학 함수 지원 (다항식, 삼각함수 등)
- **자동 근 찾기**: Bisection Method와 Newton's Method 조합
- **실시간 그래프**: Canvas를 이용한 부드러운 함수 그래프
- **자동 범위 조정**: Y축 범위 자동 계산

### 🎓 LMS Integration
- Moodle 3.7 연동 인터페이스
- 문제 데이터 수신 기능
- 결과 제출 기능 (확장 가능)

## 기술 스택 / Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Graphics**: HTML5 Canvas API
- **Math Engine**: Custom math parser and evaluator
- **Algorithms**:
  - Bisection method for initial zero detection
  - Newton's method for refinement
  - Numerical differentiation
- **Animation**: RequestAnimationFrame-based particle system
- **LMS**: Moodle 3.7 integration interface
- **Backend**: PHP 7.1.9, MySQL 5.7 (for Moodle integration)

## 파일 구조 / File Structure

```
alt42standalone_v1.0/
├── index.html          # 메인 HTML 파일
├── styles.css          # 스타일시트
├── app.js              # 메인 애플리케이션 로직
├── math-parser.js      # 수학 표현식 파서
├── zero-finder.js      # 근 찾기 알고리즘
├── spark-effect.js     # 스파크 효과 애니메이션
├── README.md           # 프로젝트 문서
└── tasks/
    └── 0001-prd-ai-education-pipeline.md
```

## 사용 방법 / How to Use

### 1. 애플리케이션 실행
웹 브라우저에서 `index.html` 파일을 열거나 웹 서버에서 실행합니다.

```bash
# 간단한 HTTP 서버로 실행 (Python 3)
python -m http.server 8000

# 또는 Node.js http-server
npx http-server
```

브라우저에서 `http://localhost:8000` 접속

### 2. 함수 입력
"함수 입력" 필드에 수학 함수를 입력합니다.

**지원 함수 예제:**
- 다항식: `x^2 - 4`, `x^3 - 2*x`, `x^2 - 5*x + 6`
- 삼각함수: `sin(x)`, `cos(x)`, `tan(x)`
- 복합 함수: `x^2 * sin(x)`, `exp(-x) * cos(x)`
- 기타: `sqrt(x)`, `abs(x)`, `log(x)`

### 3. 범위 설정
X축의 최소값과 최대값을 설정합니다.

### 4. 근 찾기
"근 찾기 / Find Zeros" 버튼을 클릭하여 근을 찾고 스파크 효과를 감상합니다!

### 5. 결과 확인
- 가상 스마트폰 화면에서 그래프와 스파크 효과 확인
- 좌측 패널의 "발견된 근" 섹션에서 수치 확인

## Zero Spark Effect 설명

### 애니메이션 구성요소

1. **파티클 시스템**
   - 각 근에서 50-80개의 파티클 생성
   - 랜덤한 속도와 방향으로 폭발
   - 중력 효과 적용
   - 페이드아웃 애니메이션

2. **펄스 글로우**
   - 근 주변에 맥동하는 빛 효과
   - 크기와 투명도가 주기적으로 변화
   - 골드/오렌지 색상 그라디언트

3. **회전 별**
   - 이중 별 마커 (외부/내부)
   - 서로 반대 방향으로 회전
   - 근 위치 명확하게 표시

4. **사운드 효과**
   - Web Audio API를 이용한 비프음
   - 근 발견 시 청각적 피드백

### 커스터마이징

`spark-effect.js` 파일에서 다음 항목을 조정할 수 있습니다:

```javascript
// 스파크 색상
sparkColors = ['#FFD700', '#FFA500', ...];

// 파티클 수
createSpark(x, y, intensity = 50);

// 파티클 생명주기
this.decay = 0.01 + Math.random() * 0.02;
```

## Moodle 연동 / Moodle Integration

### 현재 구현
- Moodle 3.7 연동 인터페이스 준비
- 문제 데이터 수신 메서드 (`getProblemFromMoodle`)
- 결과 제출 메서드 (`submitResultsToMoodle`)

### 실제 연동 방법

1. **Moodle 플러그인 개발**
   ```php
   // moodle/mod/alt42/view.php
   $problem_data = [
       'expression' => 'x^2 - 4',
       'xMin' => -5,
       'xMax' => 5
   ];
   echo json_encode($problem_data);
   ```

2. **AJAX 연동**
   ```javascript
   // app.js에서 수정
   async getProblemFromMoodle() {
       const response = await fetch('/moodle/mod/alt42/api/get_problem.php');
       return await response.json();
   }
   ```

3. **결과 제출**
   ```javascript
   async submitResultsToMoodle(zeros) {
       await fetch('/moodle/mod/alt42/api/submit_result.php', {
           method: 'POST',
           body: JSON.stringify({ zeros })
       });
   }
   ```

## 브라우저 호환성 / Browser Compatibility

- ✅ Chrome/Edge (최신 2 버전)
- ✅ Firefox (최신 2 버전)
- ✅ Safari (최신 2 버전)
- ⚠️ IE11 (부분 지원)

## 향후 개선 사항 / Future Enhancements

- [ ] 다중 함수 동시 표시
- [ ] 터치 인터랙션 개선
- [ ] 함수 히스토리 저장
- [ ] 더 많은 수학 함수 지원
- [ ] 3D 그래프 시각화
- [ ] 학생 진도 추적
- [ ] 실시간 협업 기능
- [ ] 음성 입력 지원

## 라이선스 / License

KAIST Touch Math Academy
Copyright © 2025 All Rights Reserved

## 개발자 / Developers

KAIST Touch Math Academy Development Team

## 문의 / Contact

기술적 문제나 제안사항이 있으시면 GitHub Issues를 통해 문의해주세요.

---

**즐거운 수학 학습되세요! / Happy Math Learning! ✨**
