# Secant Beam Visualization 🌟

> 평균변화율을 빛나는 줄기(Secant Beam)로 시각화하는 수학 교육용 웹 애플리케이션

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Moodle](https://img.shields.io/badge/Moodle-3.7-orange.svg)
![PHP](https://img.shields.io/badge/PHP-7.1.9-777BB4.svg)
![MySQL](https://img.shields.io/badge/MySQL-5.7-4479A1.svg)

## 📖 개요

**Secant Beam Visualization**은 수학 함수의 평균변화율(Average Rate of Change)을 직관적으로 이해할 수 있도록 도와주는 인터랙티브 시각화 도구입니다. 두 점을 선택하면 그 사이의 할선(Secant Line)을 **빛나는 줄기 효과**로 표현하여 학생들이 평균변화율의 개념을 쉽게 파악할 수 있습니다.

### 주요 특징

- 🎨 **빛나는 Secant Beam 효과**: 그라디언트와 글로우 효과로 할선을 아름답게 시각화
- 📱 **반응형 디자인**: 데스크톱, 태블릿, 모바일 모든 기기에서 작동
- 📲 **가상 스마트폰 뷰**: 우측 하단에 모바일 화면 미리보기 제공
- 🔢 **다양한 함수 지원**: 이차함수, 삼차함수, 삼각함수, 지수함수 등
- ⚙️ **사용자 정의 함수**: 직접 함수식을 입력하여 시각화
- 🎬 **애니메이션 효과**: 할선을 따라 흐르는 빛의 입자 효과
- 📊 **실시간 계산**: 평균변화율(기울기)을 즉시 계산하여 표시
- 🎓 **교육용 UI**: 직관적인 인터페이스와 명확한 안내

## 🚀 빠른 시작

### 요구사항

- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- JavaScript 활성화

### 로컬 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-org/secant-beam-visualization.git
   cd secant-beam-visualization
   ```

2. **웹 서버 실행**
   ```bash
   cd src
   python -m http.server 8000
   # 또는
   php -S localhost:8000
   ```

3. **브라우저에서 열기**
   ```
   http://localhost:8000
   ```

### 직접 파일 열기

`src/index.html` 파일을 브라우저에서 직접 열어도 작동합니다.

## 📚 사용 방법

### 기본 사용법

1. **함수 선택**: 상단 드롭다운에서 시각화할 함수를 선택합니다.
   - f(x) = x² (이차함수)
   - f(x) = x³ (삼차함수)
   - f(x) = sin(x) (사인함수)
   - f(x) = eˣ (지수함수)
   - 사용자 정의 함수

2. **점 선택**: 그래프를 클릭하여 두 개의 점을 선택합니다.
   - 첫 번째 클릭: 점 A
   - 두 번째 클릭: 점 B

3. **결과 확인**:
   - 두 점 사이에 빛나는 할선이 표시됩니다
   - 평균변화율(기울기)이 자동으로 계산됩니다
   - 할선의 방정식이 표시됩니다

4. **애니메이션**: "자동 애니메이션" 체크박스를 선택하면 빛이 흐르는 효과를 볼 수 있습니다.

5. **초기화**: "초기화" 버튼을 클릭하면 선택한 점들이 지워집니다.

### 사용자 정의 함수

1. 함수 선택 드롭다운에서 "사용자 정의"를 선택합니다.
2. 함수 입력란에 JavaScript 표현식을 입력합니다.
   - 예시: `x * x + 2 * x + 1` (이차함수)
   - 예시: `Math.sin(x) * Math.cos(x)` (삼각함수 조합)
   - 예시: `x * x * x - 3 * x` (삼차함수)

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── src/
│   ├── index.html              # 메인 HTML 파일
│   ├── css/
│   │   └── styles.css          # 스타일시트
│   └── js/
│       ├── app.js              # 메인 애플리케이션 로직
│       ├── math-functions.js   # 수학 함수 정의
│       ├── graph-renderer.js   # 그래프 렌더링 엔진
│       ├── secant-beam.js      # Secant Beam 시각화
│       └── mobile-sync.js      # 모바일 뷰 동기화
├── api/
│   └── moodle-integration.md   # Moodle 연동 문서
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🎨 주요 기능 상세

### 1. Secant Beam 효과

할선을 단순한 직선이 아닌 "빛나는 줄기"로 표현합니다:

- **다층 글로우**: 5개 레이어의 글로우 효과로 깊이감 표현
- **그라디언트**: 청록색 → 빨강 → 파랑으로 변하는 색상 그라디언트
- **펄스 효과**: 양 끝점에서 맥박치는 듯한 빛의 효과
- **입자 애니메이션**: 할선을 따라 흐르는 빛의 입자

### 2. 평균변화율 계산

두 점 (x₁, y₁)과 (x₂, y₂) 사이의 평균변화율을 계산:

```
m = Δy / Δx = (y₂ - y₁) / (x₂ - x₁)
```

- 실시간 계산 및 표시
- 할선의 방정식 자동 생성: `y = mx + b`
- Δx, Δy를 시각적으로 표시하는 삼각형

### 3. 모바일 뷰

우측 하단의 가상 스마트폰 화면:

- 메인 캔버스와 실시간 동기화
- 모바일 환경에서의 표시 미리보기
- 축소된 화면에 최적화된 렌더링

### 4. 반응형 디자인

- **데스크톱**: 전체 기능 사용 가능
- **태블릿**: 터치 인터페이스 지원
- **모바일**: 간소화된 UI, 가상 스마트폰 뷰 숨김 (공간 절약)

## 🔌 Moodle LMS 연동

이 애플리케이션은 Moodle 3.7과 연동하여 학습 관리 시스템으로 사용할 수 있습니다.

### 환경 요구사항

- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7

### 연동 기능

- 문제 정보를 Moodle에서 불러오기
- 학생 답안 제출 및 자동 채점
- 학습 진행상황 추적
- 성적 데이터 Moodle gradebook 연동

상세한 연동 방법은 [`api/moodle-integration.md`](./api/moodle-integration.md) 문서를 참조하세요.

## 🛠️ 기술 스택

### Frontend

- **HTML5 Canvas**: 고성능 그래프 렌더링
- **Vanilla JavaScript (ES6+)**: 프레임워크 없는 순수 JavaScript
- **CSS3**: 현대적인 스타일링과 애니메이션

### 설계 원칙

- **모듈화**: 각 기능을 독립적인 클래스로 분리
- **성능 최적화**: Canvas API를 직접 사용하여 고성능 구현
- **접근성**: WCAG 2.1 AA 수준 고려
- **유지보수성**: 명확한 코드 구조와 주석

## 📖 API 문서

### MathFunctions 클래스

```javascript
// 평균변화율 계산
MathFunctions.calculateSlope(point1, point2)

// 할선 방정식 구하기
MathFunctions.getSecantEquation(point1, point2)

// 함수 점 생성
MathFunctions.generateFunctionPoints(fn, xMin, xMax, steps)
```

### GraphRenderer 클래스

```javascript
// 그래프 렌더러 초기화
const renderer = new GraphRenderer('canvas-id', options)

// 함수 그리기
renderer.drawFunction(fn, color, lineWidth)

// 점 그리기
renderer.drawPoint(x, y, label, color, radius)
```

### SecantBeam 클래스

```javascript
// Secant Beam 초기화
const beam = new SecantBeam(renderer, options)

// 빛나는 할선 그리기
beam.draw(point1, point2, animated)

// 애니메이션 시작/중지
beam.startAnimation()
beam.stopAnimation()
```

## 🎓 교육적 활용

### 학습 목표

1. **평균변화율 이해**: 두 점 사이의 변화를 시각적으로 파악
2. **할선과 접선**: 할선의 개념과 극한으로서의 접선 이해
3. **기울기 계산**: Δy/Δx 공식의 실제 적용
4. **함수의 성질**: 다양한 함수에서 변화율의 차이 관찰

### 활용 시나리오

- **수업 시연**: 교사가 칠판 대신 프로젝터로 시연
- **학생 실습**: 개인 기기에서 직접 탐구 활동
- **과제 제출**: Moodle 연동으로 온라인 과제
- **평가**: 자동 채점 기능으로 형성평가

## 🚧 향후 개발 계획

### Phase 1 (완료)
- ✅ 기본 그래프 렌더링
- ✅ Secant Beam 시각화
- ✅ 모바일 반응형
- ✅ 기본 수학 함수 지원

### Phase 2 (진행중)
- 🔄 Moodle LMS 완전 연동
- 🔄 다국어 지원 (한국어, 영어)
- 🔄 접근성 개선 (스크린 리더 지원)

### Phase 3 (계획)
- 📝 접선(Tangent Line) 시각화 추가
- 📝 극한 개념 애니메이션
- 📝 미분계수와의 관계 설명
- 📝 3D 함수 시각화

### Phase 4 (계획)
- 📝 AI 튜터 통합
- 📝 학습 분석 대시보드
- 📝 협업 기능 (다중 사용자)
- 📝 게이미피케이션 요소

## 🤝 기여하기

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 개발 가이드라인

- ES6+ JavaScript 사용
- 코드에 명확한 주석 작성
- 모든 함수에 JSDoc 주석 추가
- 새 기능에 대한 테스트 작성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 제작

**KAIST Touch Math Academy**

- Project Lead: AI Education System Team
- Branch: `claude/secant-beam-visualization-01GjTNYqgVMSkqLU3U9mjHTG`
- Organization: [KAIST](https://www.kaist.ac.kr)

## 📞 문의

- 이슈: [GitHub Issues](https://github.com/your-org/secant-beam-visualization/issues)
- 이메일: contact@touchmath.kaist.ac.kr
- 웹사이트: https://touchmath.kaist.ac.kr

## 🙏 감사의 말

이 프로젝트는 다음 기술과 커뮤니티의 도움으로 만들어졌습니다:

- Canvas API 문서 및 튜토리얼
- Moodle 개발자 커뮤니티
- KAIST 수학 교육 연구팀

---

**Made with ❤️ by KAIST Touch Math Academy**

*"수학을 빛으로 표현하다"*
