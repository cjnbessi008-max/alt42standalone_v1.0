# Function Grow 🌱

함수의 항이 하나씩 추가될 때 그래프가 자라나는 모습을 시각화하는 교육용 웹 애플리케이션입니다.

![Function Grow Demo](https://img.shields.io/badge/Status-Production-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)

## 🎯 주요 기능

### 1. 실시간 그래프 시각화
- **D3.js 기반 그래프**: 다항식 함수의 그래프를 실시간으로 렌더링
- **부드러운 애니메이션**: 항이 추가될 때마다 그래프가 자연스럽게 성장
- **대화형 UI**: 직관적인 인터페이스로 함수 항 추가 및 수정

### 2. 가상 스마트폰 화면
- **우측 하단 고정 디스플레이**: 실제 스마트폰과 유사한 프레임 디자인
- **반응형 레이아웃**: 다양한 화면 크기에 최적화
- **현대적인 UI**: Notch, 상태 바, 홈 인디케이터 포함

### 3. Moodle LMS 연동
- **REST API 통합**: Moodle Web Services API와 연동
- **문제 불러오기**: LMS에서 직접 수학 문제 가져오기
- **답안 제출**: 학습자의 답안을 Moodle로 전송
- **Mock 데이터 지원**: 개발 및 테스트를 위한 샘플 문제 제공

### 4. 교육적 기능
- **단계별 학습**: 항을 하나씩 추가하며 함수의 변화 관찰
- **힌트 시스템**: 각 문제마다 학습 힌트 제공
- **정답 확인**: 즉각적인 피드백으로 학습 효과 극대화
- **다양한 문제 유형**: 일차, 이차, 삼차 함수 등

## 🚀 시작하기

### 필수 요구사항

- **Node.js**: 18.0 이상
- **npm**: 9.0 이상

### 설치 방법

```bash
# 저장소 클론
git clone <repository-url>
cd function-grow-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 📦 기술 스택

### Frontend
- **React 18**: 최신 React 기능 활용 (Hooks, Suspense)
- **TypeScript 5**: 타입 안정성 보장
- **Vite**: 빠른 개발 환경 및 빌드
- **Tailwind CSS 3**: 유틸리티 우선 CSS 프레임워크

### 시각화 & 애니메이션
- **D3.js 7**: 강력한 데이터 시각화 라이브러리
- **Framer Motion**: 부드럽고 선언적인 애니메이션

### API & 통신
- **Axios**: HTTP 클라이언트
- **Moodle Web Services**: LMS 연동

## 🎨 프로젝트 구조

```
function-grow-app/
├── src/
│   ├── components/
│   │   ├── SmartphoneFrame.tsx    # 스마트폰 프레임 UI
│   │   ├── FunctionGraph.tsx      # D3.js 그래프 컴포넌트
│   │   └── TermControl.tsx        # 항 추가 컨트롤
│   ├── services/
│   │   └── moodleApi.ts           # Moodle API 통합
│   ├── App.tsx                    # 메인 애플리케이션
│   ├── main.tsx                   # 진입점
│   └── index.css                  # 글로벌 스타일
├── public/                        # 정적 파일
├── dist/                          # 빌드 출력
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 🔧 Moodle 연동 설정

### 1. Moodle Web Services 활성화

Moodle 관리자 페이지에서:
1. **사이트 관리 > 플러그인 > 웹 서비스 > 관리**
2. "웹 서비스 활성화" 체크
3. "REST 프로토콜" 활성화

### 2. API 토큰 생성

```typescript
import { moodleApi } from './services/moodleApi';

// Moodle 설정
moodleApi.configure({
  baseUrl: 'https://your-moodle-site.com',
  token: 'your-web-service-token'
});

// 문제 가져오기
const problems = await moodleApi.fetchProblems(courseId);
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```env
VITE_MOODLE_BASE_URL=https://your-moodle-site.com
VITE_MOODLE_TOKEN=your-web-service-token
```

## 📚 사용 방법

### 기본 사용

1. **문제 선택**: "Moodle 문제 불러오기" 섹션에서 문제 선택
2. **항 추가**: 계수와 차수를 입력하거나 빠른 추가 버튼 사용
3. **그래프 관찰**: 우측 하단 스마트폰 화면에서 실시간 그래프 확인
4. **답안 제출**: "내 답안 확인" 버튼으로 정답 여부 확인

### 커스텀 문제 추가

```typescript
const customProblem: MoodleProblem = {
  id: 101,
  title: '사차 함수 만들기',
  description: 'x⁴ 함수를 만들어보세요',
  targetFunction: 'f(x) = x⁴ - 2x² + 1',
  terms: [
    { coefficient: 1, power: 4 },
    { coefficient: -2, power: 2 },
    { coefficient: 1, power: 0 }
  ],
  hints: ['사차항부터 시작하세요', '대칭성을 고려하세요']
};
```

## 🎓 교육적 활용

### 학습 목표
- 다항식 함수의 구조 이해
- 항의 계수와 차수가 그래프에 미치는 영향 관찰
- 함수의 합성과 변환 개념 학습

### 권장 교수법
1. **탐색 단계**: 자유롭게 항을 추가하며 실험
2. **유도 질문**: "계수를 음수로 바꾸면 어떻게 될까?"
3. **목표 제시**: 특정 형태의 그래프 만들기 도전
4. **반성**: 학습한 내용 정리 및 토론

## 🔒 보안 고려사항

- **환경 변수**: API 토큰은 반드시 환경 변수로 관리
- **HTTPS**: 프로덕션에서는 HTTPS 필수
- **CORS 설정**: Moodle 서버에서 올바른 CORS 헤더 설정
- **토큰 관리**: 프론트엔드에서 민감한 토큰 노출 주의

## 🐛 문제 해결

### 빌드 오류

```bash
# node_modules 재설치
rm -rf node_modules package-lock.json
npm install

# 캐시 정리
npm run build -- --force
```

### Moodle 연결 오류

1. Moodle Web Services 활성화 확인
2. 토큰 유효성 검증
3. CORS 설정 확인
4. 네트워크 방화벽 설정 확인

## 📈 향후 계획

- [ ] 삼각함수, 지수함수 지원
- [ ] 다중 그래프 비교 기능
- [ ] 실시간 협업 모드
- [ ] 학습 진도 추적 및 분석
- [ ] 모바일 네이티브 앱 (React Native)
- [ ] WebGL 기반 3D 그래프 시각화
- [ ] AI 기반 맞춤 문제 추천

## 🤝 기여하기

풀 리퀘스트를 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 개발팀

- **개발**: Claude Code & Team
- **기획**: AI Education Initiative

## 📞 문의

프로젝트에 대한 질문이나 제안사항이 있으시면 Issue를 등록해주세요.

---

**Made with ❤️ for Mathematics Education**
