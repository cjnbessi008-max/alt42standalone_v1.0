# Focus Reset - 머리정리 학습 웹앱

독립형 학습 웹앱으로, 문제 전환 시 집중력을 재정렬하는 **머리정리 모드(Focus Reset Mode)**를 제공합니다.

## 🌟 주요 기능

### 1. 머리정리 모드 (Focus Reset Mode)
- 문제 풀이 중 자동으로 휴식 시간 제공
- 3가지 휴식 활동:
  - 🫁 **심호흡**: 깊은 호흡으로 마음 안정
  - 🤸 **스트레칭**: 간단한 동작으로 몸 풀기
  - 👁️ **눈 운동**: 눈의 피로 해소

### 2. 퀴즈 시스템
- 다양한 문제 유형 (객관식, O/X)
- 실시간 정답 확인 및 해설
- 난이도별 문제 제공
- 진행 상황 및 점수 추적

### 3. 맞춤형 설정
- 휴식 빈도 조절 (1~10문제마다)
- 휴식 시간 설정 (5~60초)
- 선호하는 활동 선택
- 머리정리 모드 ON/OFF

### 4. 학습 분석
- 정답률 및 소요 시간 추적
- 문제별 성과 분석
- 학습 효율 측정

## 🚀 시작하기

### 필요 환경
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **개발 서버 실행**
```bash
npm run dev
```

3. **브라우저에서 열기**
```
http://localhost:3000
```

### 빌드

프로덕션 빌드:
```bash
npm run build
```

빌드 미리보기:
```bash
npm run preview
```

## 🏗️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand
- **저장소**: LocalStorage (향후 Backend API 연동 예정)

## 📁 프로젝트 구조

```
focus-reset-webapp/
├── src/
│   ├── components/
│   │   ├── quiz/              # 퀴즈 관련 컴포넌트
│   │   ├── focus-reset/       # 머리정리 모드 컴포넌트
│   │   ├── dashboard/         # 대시보드
│   │   └── common/            # 공통 컴포넌트
│   ├── stores/                # Zustand 스토어
│   ├── types/                 # TypeScript 타입 정의
│   ├── data/                  # 샘플 데이터
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
└── vite.config.ts
```

## 🎯 사용 방법

### 1. 퀴즈 시작
- 대시보드에서 "퀴즈 시작하기" 버튼 클릭
- 설정한 조건에 따라 문제 풀이 시작

### 2. 머리정리 모드 활용
- 설정한 주기마다 자동으로 휴식 제안
- 원하는 활동 선택 (심호흡, 스트레칭, 눈 운동)
- 활동 완료 후 다음 문제로 자동 이동
- 건너뛰기 가능

### 3. 설정 변경
- 대시보드에서 언제든지 설정 변경 가능
- 변경 사항은 LocalStorage에 자동 저장

## 🔮 향후 계획

### Phase 2: Backend 연동
- Node.js + Express API 서버
- PostgreSQL 데이터베이스
- 사용자 인증/인가 (JWT)
- 학습 데이터 영구 저장

### Phase 3: LMS 통합
- LTI 1.3 표준 지원
- Moodle, Canvas 등 주요 LMS 연동
- API 엔드포인트 제공
- 성적 동기화

### Phase 4: 고급 기능
- AI 기반 문제 추천
- 개인화된 학습 경로
- 소셜 학습 (그룹 퀴즈)
- 모바일 앱 (React Native)

## 📊 학습 효과

연구에 따르면 규칙적인 휴식은:
- ✅ 장기 집중력 향상 (25% 이상)
- ✅ 정보 보유율 증가 (30% 이상)
- ✅ 학습 피로도 감소
- ✅ 전반적인 학습 만족도 증가

## 🤝 기여하기

이 프로젝트는 오픈소스입니다. 기여를 환영합니다!

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License

## 👤 개발자

Focus Reset Team

---

**💡 규칙적인 휴식으로 학습 효율을 높여보세요!**
