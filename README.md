# Distribution Morph - 확률분포 변형 애니메이션

Moodle LMS와 연동하여 확률분포의 부드러운 변형을 시각화하는 교육용 웹 애플리케이션입니다.

## 주요 기능

### 1. 확률분포 시각화
- **정규 분포** (Normal Distribution)
- **균등 분포** (Uniform Distribution)
- **이항 분포** (Binomial Distribution)
- **지수 분포** (Exponential Distribution)
- **푸아송 분포** (Poisson Distribution)

### 2. Distribution Morph 애니메이션
- 확률분포 간의 부드러운 전환 애니메이션
- 실시간 파라미터 조정
- 2초간의 자연스러운 변형 효과

### 3. 스마트폰 UI
- 우측 하단에 고정된 가상 스마트폰 화면
- iOS 스타일의 현대적인 디자인
- 반응형 레이아웃

### 4. Moodle LMS 연동
- Moodle 3.7 호환
- Web Service API 연동
- 문제 정보 받아오기
- 사용자 응답 제출

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빠른 개발 서버
- **D3.js** - 확률분포 시각화
- **Framer Motion** - 부드러운 애니메이션
- **Zustand** - 상태 관리
- **TailwindCSS** - 스타일링

### Backend Integration
- **Moodle 3.7** LMS
- **PHP 7.1.9**
- **MySQL 5.7**

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 3. 프로덕션 빌드
```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 사용 방법

### 분포 변형하기
1. 왼쪽 컨트롤 패널에서 원하는 분포 유형 선택
2. 슬라이더로 파라미터 조정
3. "분포 변형 시작" 버튼 클릭
4. 우측 하단 스마트폰 화면에서 애니메이션 확인

### Moodle 연동 설정
```typescript
// src/services/moodleApi.ts 에서 설정
const moodleConfig: MoodleConfig = {
  moodleUrl: 'https://your-moodle-site.com',
  token: 'your-webservice-token',
  courseId: 123,
  quizId: 456
};
```

## 프로젝트 구조

```
/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── PhoneFrame.tsx          # 스마트폰 프레임
│   │   ├── DistributionChart.tsx   # D3.js 차트
│   │   ├── DistributionMorph.tsx   # 애니메이션 컨트롤러
│   │   └── ControlPanel.tsx        # 제어 패널
│   ├── services/            # API 서비스
│   │   └── moodleApi.ts            # Moodle 연동
│   ├── store/               # 상태 관리
│   │   └── useAppStore.ts          # Zustand store
│   ├── types/               # TypeScript 타입
│   │   └── index.ts
│   ├── utils/               # 유틸리티
│   │   └── distributionCalculator.ts  # 분포 계산
│   ├── App.tsx              # 메인 앱
│   ├── main.tsx             # 엔트리 포인트
│   └── index.css            # 글로벌 스타일
├── tasks/                   # 프로젝트 문서
│   └── 0001-prd-ai-education-pipeline.md
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 확률분포 파라미터

### 정규 분포
- **평균 (μ)**: -5 ~ 5
- **표준편차 (σ)**: 0.1 ~ 3

### 균등 분포
- **최소값**: -5 ~ 5
- **최대값**: -5 ~ 10

### 이항 분포
- **시행 횟수 (n)**: 1 ~ 30
- **성공 확률 (p)**: 0 ~ 1

### 지수 분포 / 푸아송 분포
- **람다 (λ)**: 0.1 ~ 5

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy - AI Education System Pipeline

---

**Version**: 1.0.0
**Last Updated**: 2025-11-18
