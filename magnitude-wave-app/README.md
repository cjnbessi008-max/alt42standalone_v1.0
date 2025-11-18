# 📊 Magnitude Wave - 숫자 크기 시각화 애플리케이션

LMS(Moodle) 연동형 수학 교육 웹 애플리케이션으로, 숫자의 크기를 물결 애니메이션으로 시각화합니다.

## ✨ 주요 기능

### 1. **Magnitude Wave 애니메이션**
- Canvas API를 사용한 부드러운 물결 애니메이션
- 숫자 값이 클수록 파동의 진폭이 증가
- 실시간 애니메이션으로 수의 크기를 직관적으로 이해

### 2. **LMS 연동 시뮬레이션**
- Moodle 3.7과 호환되는 데이터 구조
- 문제 목록에서 선택하면 답이 자동으로 적용
- MySQL 5.7 데이터베이스 연동 준비

### 3. **모바일 미리보기**
- 우측 하단에 가상 스마트폰 화면 표시
- 실제 모바일 환경을 시뮬레이션
- 반응형 디자인으로 다양한 디바이스 지원

### 4. **직관적인 제어 패널**
- 슬라이더로 값을 조절
- 직접 숫자 입력 가능 (0-100)
- 실시간 피드백

## 🚀 시작하기

### 설치

```bash
cd magnitude-wave-app
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 🔧 기술 스택

- **프론트엔드**: React 18 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS
- **애니메이션**: Canvas API
- **LMS 연동**: Moodle 3.7 (시뮬레이션)
- **데이터베이스**: MySQL 5.7 (준비됨)

## 📱 사용 방법

1. **수동 입력**
   - 슬라이더를 움직여 값을 조절
   - 또는 직접 숫자를 입력 (0-100 범위)

2. **LMS 문제 선택**
   - "LMS 연동 시뮬레이션" 섹션에서 문제 클릭
   - 선택한 문제의 답이 자동으로 적용됨

3. **애니메이션 관찰**
   - 메인 화면에서 큰 물결 애니메이션 확인
   - 우측 하단 모바일 미리보기에서 스마트폰 화면 확인
   - 숫자가 클수록 진폭이 커지는 것을 관찰

## 📂 프로젝트 구조

```
magnitude-wave-app/
├── src/
│   ├── components/
│   │   ├── MagnitudeWave.tsx      # 물결 애니메이션 컴포넌트
│   │   ├── MobilePreview.tsx      # 모바일 미리보기 컴포넌트
│   │   └── ControlPanel.tsx       # 제어 패널 컴포넌트
│   ├── App.tsx                    # 메인 앱 컴포넌트
│   ├── main.tsx                   # 엔트리 포인트
│   └── index.css                  # 글로벌 스타일
├── public/                        # 정적 파일
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎓 교육적 활용

이 애플리케이션은 다음과 같은 교육 목적으로 활용할 수 있습니다:

- **수의 크기 이해**: 추상적인 숫자를 시각적으로 표현
- **비교 학습**: 여러 숫자를 비교하여 크기 차이 이해
- **수학 문제 풀이**: LMS에서 문제를 가져와 답의 크기를 시각화
- **상호작용 학습**: 실시간 조작을 통한 능동적 학습

## 🔌 Moodle 연동 (향후 계획)

현재는 시뮬레이션으로 동작하며, 실제 Moodle 연동을 위해서는:

1. **Moodle Web Service 활성화**
2. **API 토큰 생성**
3. **백엔드 API 구현** (PHP 7.1.9)
4. **MySQL 데이터베이스 연결**
5. **문제 데이터 가져오기 기능 추가**

### 예상 API 구조

```php
// Moodle Web Service 호출 예시
$questions = $DB->get_records('quiz_questions', ['quizid' => $quizid]);
```

## 📄 라이선스

MIT License

## 🤝 기여

이슈나 풀 리퀘스트를 환영합니다!

---

**개발**: AI Education System Team
