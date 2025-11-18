# 🌡️ Correct Warm Feedback System

Moodle LMS 연동 학습 피드백 웹앱 - 학생의 문제 풀이 방향이 맞을수록 화면이 따뜻해지는 직관적인 피드백 시스템

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61dafb.svg)
![Moodle](https://img.shields.io/badge/Moodle-3.7-orange.svg)

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [Moodle 연동](#moodle-연동)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [라이센스](#라이센스)

## 🎯 개요

**Correct Warm Feedback System**은 학생들이 문제를 풀 때 실시간으로 직관적인 시각 피드백을 제공하는 교육용 웹 애플리케이션입니다.

### 핵심 컨셉: "Correct Warm" 🌡️

- **차가운 색상 (파란색)**: 문제 풀이 방향이 잘못되었을 때
- **중간 색상 (노란색)**: 올바른 방향으로 가고 있을 때
- **따뜻한 색상 (주황/빨강)**: 정답에 가까워질수록

이 점진적인 색온도 변화를 통해 학생들은 즉각적이고 비언어적인 피드백을 받아 자기주도 학습을 할 수 있습니다.

## ✨ 주요 기능

### 1. 가상 스마트폰 UI 📱
- 우측 하단에 고정된 모바일 디바이스 형태의 UI
- 반응형 디자인으로 다양한 화면 크기 지원
- 실제 스마트폰과 유사한 UX (노치, 라운드 코너 등)

### 2. Correct Warm 피드백 시스템 🌡️
- **0-100% 점진적 피드백**
  - 0-30%: 차가운 파란색 (다시 생각해보세요)
  - 30-50%: 노란색 (방향은 맞아요)
  - 50-70%: 밝은 주황색 (거의 다 왔어요)
  - 70-90%: 주황색 (아주 좋아요)
  - 90-100%: 따뜻한 빨강색 (완벽해요!)

- **시각 효과**
  - 부드러운 그라디언트 배경 전환
  - 정답에 가까워질수록 파티클 효과
  - 펄스 애니메이션 (고득점 시)
  - 이모지 피드백

### 3. Moodle LMS 연동 🔌
- Moodle 3.7 REST API 호환
- 자동 문제 가져오기
- 실시간 답안 검증
- 성적 자동 기록 (선택사항)

### 4. 지능형 답안 검증 🧠
- **분수 문제**: 동치 분수 인식, 부분 점수
- **숫자 문제**: 오차 허용 범위 설정
- **문자열 문제**: 유사도 기반 채점 (Levenshtein Distance)

### 5. 학습 통계 📊
- 시도 횟수 추적
- 실시간 정확도 표시
- 단계별 힌트 제공

## 🛠️ 기술 스택

### Frontend
- **React 18.2.0** - UI 프레임워크
- **Styled Components 6.1.1** - CSS-in-JS 스타일링
- **Axios 1.6.2** - HTTP 클라이언트

### Backend Integration
- **Moodle 3.7** - LMS (Learning Management System)
- **PHP 7.1.9** - Moodle 서버 사이드
- **MySQL 5.7** - 데이터베이스

### 개발 도구
- **Create React App 5.0.1** - 빌드 도구
- **ES6+** - 최신 JavaScript

## 🚀 설치 방법

### 사전 요구사항
- Node.js 16.x 이상
- npm 8.x 이상
- (선택) Moodle 3.7 인스턴스

### 1. 저장소 클론
```bash
git clone https://github.com/your-org/correct-warm-feedback.git
cd correct-warm-feedback
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일을 열어 Moodle 설정을 입력하세요:
```env
REACT_APP_MOODLE_URL=http://your-moodle-instance.com
REACT_APP_MOODLE_TOKEN=your_webservice_token
REACT_APP_DEMO_MODE=false  # 데모 모드 사용 시 true
```

### 4. 앱 실행
```bash
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 📖 사용 방법

### 데모 모드 (Moodle 없이)
1. `.env` 파일에서 `REACT_APP_DEMO_MODE=true` 설정
2. `npm start`로 앱 실행
3. "새 문제 불러오기" 버튼 클릭
4. 데모 문제를 풀고 실시간 피드백 확인

### Moodle 연동 모드
1. Moodle에서 Web Service 토큰 생성 (아래 참조)
2. `.env`에 Moodle URL과 토큰 설정
3. 앱 실행 후 자동으로 Moodle에서 문제 가져오기

## 🔌 Moodle 연동

### Moodle Web Service 활성화

#### 1. Web Service 활성화
1. Moodle 관리자로 로그인
2. `사이트 관리 > 고급 기능`으로 이동
3. "웹 서비스 활성화" 체크
4. 변경사항 저장

#### 2. Web Service 토큰 생성
1. `사이트 관리 > 플러그인 > 웹 서비스 > 토큰 관리`
2. "토큰 생성" 클릭
3. 사용자 선택 및 서비스 선택
4. 생성된 토큰 복사

#### 3. REST 프로토콜 활성화
1. `사이트 관리 > 플러그인 > 웹 서비스 > 프로토콜 관리`
2. REST 프로토콜 활성화

#### 4. 필요한 웹 서비스 함수 활성화
다음 함수들을 활성화하세요:
- `core_webservice_get_site_info`
- `mod_quiz_get_quiz_by_courses`
- `mod_quiz_get_quizzes_by_courses`
- `mod_quiz_process_attempt`

### 지원 문제 유형

#### 분수 문제
```
예: 1/2 + 1/4 = ?
정답 형식: 3/4
```

#### 숫자 문제
```
예: 7 × 8 = ?
정답 형식: 56
```

#### 문자열 문제
```
예: 서울의 수도는?
정답 형식: 대한민국
```

## 📁 프로젝트 구조

```
correct-warm-feedback/
├── public/
│   └── index.html              # HTML 템플릿
├── src/
│   ├── components/
│   │   ├── VirtualPhone.jsx    # 가상 스마트폰 컴포넌트
│   │   ├── CorrectWarmFeedback.jsx  # 피드백 시각 효과
│   │   └── ProblemDisplay.jsx  # 문제 표시 컴포넌트
│   ├── services/
│   │   └── moodleAPI.js        # Moodle API 통신 서비스
│   ├── App.js                  # 메인 앱 컴포넌트
│   ├── App.css                 # 글로벌 스타일
│   ├── index.js                # 앱 진입점
│   └── index.css               # 베이스 스타일
├── .env.example                # 환경 변수 예제
├── .gitignore                  # Git 제외 파일
├── package.json                # 프로젝트 설정
└── README.md                   # 프로젝트 문서
```

## 🎨 커스터마이징

### 색온도 범위 조정
`src/components/VirtualPhone.jsx`의 `calculateWarmthColor()` 함수를 수정하여 색상 범위를 조정할 수 있습니다:

```javascript
const calculateWarmthColor = (level) => {
  if (level < 30) {
    return 'linear-gradient(180deg, #your-cold-color-1, #your-cold-color-2)';
  }
  // ... 나머지 범위
};
```

### 채점 알고리즘 수정
`src/services/moodleAPI.js`의 `checkAnswer()` 메서드를 수정하여 채점 로직을 변경할 수 있습니다.

### UI 테마 변경
Styled Components를 사용하므로 각 컴포넌트의 스타일을 쉽게 수정할 수 있습니다.

## 🧪 개발 가이드

### 새로운 문제 유형 추가

1. **MoodleService에 파서 추가** (`src/services/moodleAPI.js`)
```javascript
checkCustomAnswer(userAnswer, correctAnswer) {
  // 커스텀 채점 로직
  return warmthLevel; // 0-100
}
```

2. **checkAnswer() 메서드에 케이스 추가**
```javascript
case 'custom-type':
  return this.checkCustomAnswer(userAnswer, correctAnswer);
```

### 빌드 및 배포

#### 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `build/` 디렉토리에 생성됩니다.

#### 배포 옵션
- **정적 호스팅**: Netlify, Vercel, GitHub Pages
- **웹 서버**: Apache, Nginx
- **Moodle 통합**: Moodle 플러그인으로 패키징

### 테스트
```bash
npm test
```

## 🐛 문제 해결

### Moodle 연결 실패
- Moodle URL이 올바른지 확인
- Web Service 토큰이 유효한지 확인
- CORS 설정 확인 (Moodle 서버에서 허용 필요)

### 답안 검증이 작동하지 않음
- 브라우저 콘솔에서 오류 확인
- 문제 유형과 정답 형식이 일치하는지 확인

### 스타일이 깨짐
- `styled-components` 설치 확인: `npm install styled-components`
- 브라우저 캐시 클리어

## 📄 라이센스

MIT License

Copyright (c) 2024 KAIST Touch Math Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## 🤝 기여

기여를 환영합니다! 다음 절차를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 있거나 질문이 있으시면:
- GitHub Issues 생성
- 이메일: support@kaist-touchmath.edu
- 문서: [위키](https://github.com/your-org/correct-warm-feedback/wiki)

## 🙏 감사의 말

이 프로젝트는 다음을 사용하여 개발되었습니다:
- [React](https://reactjs.org/)
- [Styled Components](https://styled-components.com/)
- [Moodle](https://moodle.org/)
- [Axios](https://axios-http.com/)

---

**Made with ❤️ by KAIST Touch Math Academy**
