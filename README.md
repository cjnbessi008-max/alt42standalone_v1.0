# 🎓 Cardinality Beam

집합의 원소 수(Cardinality)를 학습하는 인터랙티브 교육용 웹 애플리케이션

## 📱 소개

Cardinality Beam은 집합론의 기본 개념인 '카디널리티(Cardinality, 집합의 원소 수)'를 시각적으로 배울 수 있는 교육용 앱입니다. 우측 하단의 가상 스마트폰 화면에서 **집합의 원소 수가 늘어날수록 빛의 강도가 커지는** 'Cardinality Beam' 효과를 실시간으로 확인할 수 있습니다.

## ✨ 주요 기능

- 📊 **실시간 시각화**: 집합의 원소 수에 따라 변하는 빛의 강도
- 📱 **가상 스마트폰 UI**: 우측 하단에 배치된 모바일 앱 시뮬레이션
- 🎮 **인터랙티브 학습**: 문제를 풀면서 개념 학습
- 🎨 **다양한 문제 유형**: 숫자, 문자, 이모지 등 다양한 집합
- 🌈 **아름다운 애니메이션**: 부드러운 전환과 파티클 효과

## 🚀 시작하기

### 설치

이 앱은 독립형 웹 애플리케이션으로, 별도의 설치가 필요 없습니다.

```bash
# 저장소 클론
git clone <repository-url>

# 디렉토리 이동
cd alt42standalone_v1.0

# 웹 서버로 실행 (예: Python)
python -m http.server 8000

# 또는 Node.js의 http-server
npx http-server
```

### 사용 방법

1. 브라우저에서 `http://localhost:8000` 접속
2. 왼쪽에 표시된 집합 문제를 확인
3. 우측 스마트폰 화면에서 Cardinality Beam 효과 관찰
4. 원소의 개수를 입력하고 제출
5. 정답 확인 및 다음 문제로 진행

## 🏗️ 프로젝트 구조

```
alt42standalone_v1.0/
├── index.html              # 메인 HTML 파일
├── css/
│   └── style.css          # 스타일시트 (UI 디자인)
├── js/
│   ├── app.js             # 메인 애플리케이션 로직
│   └── cardinality-beam.js # Cardinality Beam 시각화
├── data/
│   └── problems.json      # 문제 데이터 (확장 가능)
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md
└── README.md
```

## 🎨 기술 스택

- **HTML5**: 구조 및 마크업
- **CSS3**: 스타일링 및 애니메이션
- **JavaScript (ES6+)**: 애플리케이션 로직
- **Canvas API**: Cardinality Beam 시각화

## 🔧 주요 컴포넌트

### CardinalityBeam 클래스 (`cardinality-beam.js`)

빛의 강도 시각화를 담당하는 클래스입니다.

```javascript
const beam = new CardinalityBeam('beamCanvas');
beam.setCardinality(5); // 원소 수 5개로 설정
```

**특징:**
- Canvas 기반 실시간 렌더링
- 부드러운 애니메이션 전환
- 파티클 효과 및 글로우 효과
- 원소 수에 따른 동적 색상 변화

### CardinalityApp 클래스 (`app.js`)

문제 관리 및 사용자 상호작용을 처리합니다.

**주요 기능:**
- 문제 데이터 로드 및 관리
- 사용자 답변 검증
- 빔 효과와 문제 동기화
- 점수 및 진행 상황 추적

## 📚 문제 데이터 형식

`data/problems.json`에서 문제를 추가/수정할 수 있습니다.

```json
{
  "id": 1,
  "title": "집합 A의 원소는 몇 개일까요?",
  "set": [1, 2, 3],
  "setName": "A",
  "visualType": "numbers",
  "difficulty": "easy",
  "category": "기본"
}
```

## 🎯 향후 계획

### LMS 연동 (Phase 2)
- [ ] Moodle 3.7 플러그인 개발
- [ ] MySQL 데이터베이스 연동
- [ ] PHP 백엔드 API
- [ ] 학습 진도 추적 및 저장

### 기능 확장
- [ ] 난이도별 문제 필터링
- [ ] 타이머 및 점수 시스템
- [ ] 리더보드
- [ ] 문제 생성기
- [ ] 다국어 지원

### UI/UX 개선
- [ ] 다크 모드
- [ ] 사운드 효과
- [ ] 배지 및 성취 시스템
- [ ] 모바일 반응형 최적화

## 🌐 Moodle 연동 계획

### 시스템 요구사항
- **MySQL**: 5.7
- **PHP**: 7.1.9
- **Moodle**: 3.7

### 연동 아키텍처
```
Moodle LMS (PHP)
    ↓ (REST API)
Cardinality Beam Web App (JavaScript)
    ↓ (Canvas Rendering)
Virtual Smartphone Display
```

### 데이터 흐름
1. Moodle에서 문제 정보 조회
2. JSON 형식으로 웹앱에 전달
3. 웹앱에서 문제 표시 및 빔 시각화
4. 학생 답안을 Moodle에 다시 저장

## 📖 교육적 가치

### 학습 목표
- 집합의 원소 개념 이해
- 카디널리티(원소의 개수) 개념 학습
- 빈 집합 개념 이해
- 시각적 사고력 향상

### 교수법
- **시각적 학습**: 빛의 강도로 추상 개념을 구체화
- **즉각적 피드백**: 실시간으로 정답 확인
- **단계적 학습**: 쉬운 문제부터 어려운 문제로 진행
- **다양한 표현**: 숫자, 문자, 이모지 등 다양한 집합 표현

## 🤝 기여하기

이 프로젝트에 기여하고 싶으시다면:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License.

## 👥 개발자

- **개발**: Claude Code
- **컨셉**: Cardinality Beam Educational App
- **목적**: 수학 교육용 인터랙티브 학습 도구

## 📞 문의

문제나 제안사항이 있으시면 Issue를 생성해주세요.

---

**Made with ❤️ for Math Education**
