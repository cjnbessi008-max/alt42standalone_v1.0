# 수직선 학습 앱 (Number Line Learning App)

LMS(Moodle)와 연동 가능한 수직선 범위 선택 학습 웹앱

## 주요 기능

- **수직선 시각화**: SVG 기반의 인터랙티브 수직선
- **Range Glow 효과**: 선택한 범위가 부드럽게 빛나는 애니메이션 효과
- **드래그 앤 드롭**: 마우스 드래그로 범위 선택
- **스마트폰 화면 시뮬레이션**: 우측 하단에 모바일 화면 프레임
- **LMS 연동 준비**: Moodle 3.7 연동을 위한 Mock API 구현
- **실시간 피드백**: 정답/오답 즉시 확인
- **학습 통계**: 정답률, 시도 횟수 등 추적

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 (Animations + Gradients)
- **Visualization**: SVG + CSS Filters
- **LMS**: Moodle 3.7 (PHP 7.1.9, MySQL 5.7)

## 실행 방법

### 1. 개발 서버 실행

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 2. 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

### 3. 프로덕션 미리보기

```bash
npm run preview
```

## 사용 방법

1. 우측 하단 스마트폰 화면의 수직선을 클릭하고 드래그
2. 원하는 범위를 선택하면 Glow 효과가 나타남
3. 정답 여부를 즉시 확인
4. "다음 문제" 버튼으로 다른 문제 풀이
5. 학습 통계에서 진행 상황 확인

## LMS 연동

현재는 Mock 데이터를 사용하며, 실제 Moodle 연동을 위한 API 구조가 준비되어 있습니다.

콘솔에서 LMS 시뮬레이션 로그를 확인할 수 있습니다.

## 라이선스

MIT
