# 📱 Drag to Graph - Interactive Learning App

수열의 항을 드래그하여 그래프를 완성하는 인터랙티브 학습 웹 애플리케이션입니다.

## 🎯 주요 기능

- **우측 하단 스마트폰 시뮬레이터**: 실제 모바일 기기처럼 표시되는 UI
- **드래그 앤 드롭**: 수열 항을 그래프의 올바른 위치로 드래그
- **실시간 검증**: 올바른 위치에 배치했는지 즉시 확인
- **시각적 피드백**: 점수, 성공 메시지, 애니메이션 효과
- **반응형 디자인**: 데스크톱과 모바일에서 모두 사용 가능

## 🚀 시작하기

### 필수 요구사항

- Node.js 16+
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 📂 프로젝트 구조

```
src/
├── components/
│   ├── SmartphoneSimulator.tsx    # 스마트폰 화면 시뮬레이터
│   ├── DragToGraphApp.tsx         # 메인 앱 로직
│   ├── SequenceTerms.tsx          # 드래그 가능한 수열 항
│   └── GraphCanvas.tsx            # 그래프 렌더링 및 드롭 처리
├── App.tsx                        # 메인 앱 컴포넌트
├── main.tsx                       # 진입점
└── index.css                      # 글로벌 스타일
```

## 🎮 사용 방법

1. 화면 왼쪽의 수열 항들을 확인합니다
2. 각 항을 우측 하단 스마트폰 화면의 그래프로 드래그합니다
3. 올바른 위치에 배치하면 점수가 증가합니다
4. 모든 항을 올바르게 배치하면 성공 메시지가 표시됩니다

## 🔧 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS Modules
- **Drag & Drop**: HTML5 Native Drag and Drop API
- **Graphics**: SVG

## 📋 향후 계획

- [ ] 다양한 수열 문제 추가 (등비수열, 피보나치 등)
- [ ] 난이도 선택 기능
- [ ] 힌트 시스템
- [ ] 학습 진도 추적
- [ ] Moodle LTI 연동
- [ ] Backend API 연동 (문제 데이터베이스)
- [ ] 다국어 지원

## 📝 License

MIT License

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
