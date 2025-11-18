# ALT42 Standalone v1.0 - AI Education System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61dafb)](https://reactjs.org/)

## 🎯 프로젝트 개요

KAIST Touch Math Academy를 위한 AI 기반 교육 시스템 파이프라인입니다. 선생님의 자연어 요청을 완전한 교육 모듈로 자동 변환하는 엔드투엔드 시스템을 제공합니다.

## ✨ 최신 기능: 공감형 피드백 시스템

**오답 시 압박 대신 공감형 응원 멘트**를 제공하여 학생들의 학습 동기를 높이고 성장 마인드셋을 키웁니다.

### 핵심 특징
- 🌱 **공감적 언어**: "틀렸습니다" → "괜찮아요! 실수는 배움의 과정이에요"
- 💪 **긍정적 강화**: 노력과 과정을 인정하고 격려
- 🎨 **따뜻한 디자인**: 부드러운 색상과 친근한 이모지
- 🌐 **다국어 지원**: 한국어, 영어 (추가 언어 확장 가능)
- 🎯 **개인화**: 학생 이름, 시도 횟수, 학습 진도 반영

### 빠른 시작

```tsx
import EmpatheticFeedback from './components/EmpatheticFeedback';

function Quiz() {
  return (
    <EmpatheticFeedback
      isCorrect={false}
      language="ko"
      context={{
        studentName: "지민",
        totalProblemsToday: 7
      }}
    />
  );
}
```

**출력 예시**: "지민님, 괜찮아요! 실수는 배움의 과정이에요 🌱 (오늘 7문제 풀었어요!)"

📖 **자세한 사용법**: [공감형 피드백 가이드](./docs/EMPATHETIC_FEEDBACK_GUIDE.md)

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── tasks/
│   └── 0001-prd-ai-education-pipeline.md    # 제품 요구사항 문서 (PRD)
├── src/
│   ├── lib/
│   │   └── empathetic-feedback.ts           # 공감형 메시지 라이브러리
│   └── components/
│       ├── EmpatheticFeedback.tsx           # 피드백 컴포넌트
│       └── FeedbackDemo.tsx                 # 사용 예시
├── docs/
│   └── EMPATHETIC_FEEDBACK_GUIDE.md         # 상세 가이드
└── README.md
```

## 🚀 주요 기능

### Phase 1: World Model Reconstruction (세계관 재구성)
- 자연어 처리를 통한 교육 도메인 모델 생성
- 개념, 관계, 연산 자동 추출

### Phase 2: Rule Generation Engine (룰 자동 생성)
- 비즈니스 규칙 자동 생성
- 복잡도 분석 및 온톨로지 변환
- **공감형 피드백 규칙 통합** ✨

### Phase 3: Data Management (데이터 검증 및 생성)
- 데이터베이스 스키마 자동 설계
- Pseudo 데이터 생성

### Phase 4: Input Strategy Design (입력 전략 설계)
- 최적의 데이터 수집 방법 결정
- 실시간 검증 전략

### Phase 5: UI Auto-Generation (UI 자동 생성)
- React 컴포넌트 자동 생성
- 접근성 표준 준수 (WCAG 2.1 AA)
- **공감형 피드백 UI 컴포넌트** ✨

### Phase 6: Integration & Deployment (시스템 완성)
- API 엔드포인트 생성
- Docker 컨테이너화
- 자동 테스트 및 배포

## 🛠️ 기술 스택

**Frontend:**
- React 18+ with TypeScript
- Material-UI / Ant Design
- React Hook Form + Yup

**Backend:**
- Python 3.11+ with FastAPI
- Node.js (API Gateway)
- Celery + Redis

**Database:**
- PostgreSQL 15+
- Redis 7+

**AI/ML:**
- Claude 3 (Anthropic)
- Voyage AI Embeddings

## 📦 설치

```bash
# 저장소 클론
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 🎓 교육학적 근거

우리의 공감형 피드백 시스템은 다음 교육 이론에 기반합니다:

### 성장 마인드셋 (Growth Mindset)
실수를 학습 기회로 인식하고, 노력과 과정을 강조합니다.

### 자기결정이론 (Self-Determination Theory)
- **자율성**: 학생이 스스로 재시도 결정
- **유능감**: 작은 진전도 인정
- **관계성**: 공감적 언어로 연결감 형성

### 정서적 안전 (Emotional Safety)
실패에 대한 두려움을 감소시켜 더 도전적인 학습을 장려합니다.

## 📊 성공 메트릭

- **채택률**: 6개월 내 70% 교사 사용 목표
- **생성 속도**: 모듈당 2시간 이내
- **시스템 정확도**: 85% 이상 (최소 수동 조정)
- **학생 학습 성과**: 기존 모듈과 동등 또는 향상

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 문서

- [제품 요구사항 문서 (PRD)](./tasks/0001-prd-ai-education-pipeline.md)
- [공감형 피드백 가이드](./docs/EMPATHETIC_FEEDBACK_GUIDE.md)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 연락처

- **프로젝트 관리자**: AI Education Team
- **이메일**: support@kaist-touchmath.edu
- **이슈 트래커**: [GitHub Issues](https://github.com/your-org/alt42standalone_v1.0/issues)

## 🙏 감사의 말

이 프로젝트는 KAIST Touch Math Academy의 지원을 받아 개발되었습니다.

---

**Made with ❤️ for better learning experiences**

**Version**: 1.0.0
**Last Updated**: 2025-11-18
