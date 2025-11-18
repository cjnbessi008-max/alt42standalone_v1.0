# Reasoning Path Grading System for Moodle

> **추론 경로 완성도 기반 채점 시스템** - AI를 활용한 혁신적인 학습 평가

## 개요

이 시스템은 기존의 정답/오답 중심 채점 방식을 넘어, **학생의 사고 과정과 추론 경로의 완성도**를 평가하는 Moodle LMS 통합 솔루션입니다.

### 주요 특징

✨ **추론 과정 중심 평가**: 정답뿐만 아니라 문제 해결 과정을 평가
🤖 **AI 기반 자동 채점**: Claude API를 활용한 지능형 분석
📊 **다차원 채점**: 완성도, 논리성, 방법론, 명확성 4가지 기준
🎯 **상세한 피드백**: 학생의 강점과 개선점을 구체적으로 제시
🔧 **완전한 Moodle 통합**: 기존 Moodle 워크플로우에 자연스럽게 통합

## 시스템 아키텍처

```
┌─────────────────────────────────────────┐
│         Moodle 3.7 LMS                  │
│  - Custom Question Type Plugin          │
│  - Interactive Step Builder UI          │
│  - Student/Teacher Dashboards           │
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────▼──────────────────────────┐
│    Python Analysis Engine (FastAPI)    │
│  - Claude AI Integration                │
│  - Reasoning Path Analysis              │
│  - Multi-criteria Grading               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         MySQL 5.7 Database              │
│  - Reasoning Steps Storage              │
│  - Analysis Results Cache               │
└─────────────────────────────────────────┘
```

## 채점 기준

### 1. 완성도 (Completeness) - 40%
- 모든 필요한 추론 단계가 포함되어 있는가?
- 논리적 비약이나 누락된 단계는 없는가?
- 가정이 명확하게 제시되어 있는가?

### 2. 논리적 일관성 (Logical Coherence) - 30%
- 각 단계가 논리적으로 연결되어 있는가?
- 모순이나 논리적 오류는 없는가?
- 추론의 순서가 적절한가?

### 3. 방법의 적절성 (Method Appropriateness) - 20%
- 문제에 적합한 접근 방법을 사용했는가?
- 불필요하게 복잡하지는 않은가?
- 수학적/과학적 개념을 올바르게 적용했는가?

### 4. 명확성 (Clarity) - 10%
- 추론 과정이 이해하기 쉽게 설명되어 있는가?
- 적절한 수학적 표기법을 사용했는가?
- 각 단계의 근거가 명확한가?

## 구성 요소

### 1. Moodle Plugin (`plugin/question/type/reasoningpath/`)
- **PHP 7.1.9+ 호환** 커스텀 문제 유형
- MySQL 5.7 데이터베이스 스키마
- 대화형 단계별 입력 UI
- 교사 설정 인터페이스

### 2. Analysis Engine (`analysis-engine/`)
- Python 3.11+ FastAPI 서버
- Anthropic Claude API 통합
- 다차원 추론 분석 알고리즘
- 결과 캐싱 및 최적화

### 3. Documentation
- 상세한 설치 가이드
- 아키텍처 문서
- 사용 예시

## 빠른 시작

### 1. 필수 조건

```bash
# Moodle 환경
- Moodle 3.7+
- PHP 7.1.9+
- MySQL 5.7+ or MariaDB 10.2+

# 분석 엔진
- Python 3.11+
- Docker (선택사항, 권장)
- Anthropic API 키
```

### 2. 설치

**Moodle 플러그인 설치:**
```bash
cd /var/www/moodle
cp -r plugin/question/type/reasoningpath question/type/
chown -R www-data:www-data question/type/reasoningpath
```

Moodle에 관리자로 로그인하여 플러그인 설치 완료

**분석 엔진 실행 (Docker):**
```bash
cd analysis-engine
cp .env.example .env
# .env 파일에 ANTHROPIC_API_KEY 설정

docker-compose up -d
```

**또는 직접 실행:**
```bash
cd analysis-engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 3. 설정

Moodle 관리 페이지에서:
- **사이트 관리 > 플러그인 > 문제 유형 > Reasoning Path**
- Analysis API Endpoint: `http://localhost:8000/api/analyze-reasoning`
- API Key: (분석 엔진의 `ANALYSIS_API_KEY`)

## 사용 예시

### 교사: 문제 생성

```
문제: 다음 방정식을 풀이하시오: 2x + 5 = 13

설정:
- 최소 단계 수: 3
- 완성도 비중: 40%
- 논리성 비중: 30%
- 방법 비중: 20%
- 명확성 비중: 10%

예상 풀이:
1. 양변에서 5를 뺍니다
2. 2x = 8을 얻습니다
3. 양변을 2로 나눕니다
4. x = 4를 얻습니다
```

### 학생: 답안 작성

학생은 대화형 UI에서:
- **단계 1**: "양변에서 5를 빼면" → `2x + 5 - 5 = 13 - 5`
- **단계 2**: "정리하면" → `2x = 8`
- **단계 3**: "양변을 2로 나누면" → `x = 4`
- **제출**

### AI 채점 결과

```
종합 점수: 87.5/100

완성도: 85/100
- 모든 핵심 단계가 포함되어 있습니다
- 약간의 추가 설명이 있으면 더 좋겠습니다

논리적 일관성: 90/100
- 각 단계가 명확하게 연결되어 있습니다
- 논리적 비약이 없습니다

방법의 적절성: 95/100
- 매우 적절한 풀이 방법입니다
- 가장 효율적인 접근입니다

명확성: 80/100
- 대체로 명확하게 설명되어 있습니다
- 일부 단계에서 더 구체적인 설명이 필요합니다

피드백:
✅ 잘한 점:
- 체계적이고 논리적인 접근
- 각 단계가 명확하게 설명됨
- 올바른 수학적 표기법 사용

💡 개선할 점:
- 첫 번째 단계에서 "양변에서" 빼는 이유 설명 추가
- 등식의 성질을 명시적으로 언급하면 더 좋음
```

## 기술 스택

### Backend
- **Moodle Plugin**: PHP 7.1.9+
- **Analysis Engine**: Python 3.11, FastAPI
- **AI**: Anthropic Claude 3.5 Sonnet
- **Database**: MySQL 5.7

### Frontend
- **JavaScript**: AMD modules (Moodle standard)
- **UI**: Bootstrap 4 (Moodle theme)
- **Math Rendering**: MathJax (optional)

### DevOps
- **Containerization**: Docker, Docker Compose
- **Web Server**: Apache/Nginx
- **Process Manager**: Systemd

## 성능 및 비용

### 처리 시간
- 간단한 문제 (3-5 단계): 2-5초
- 중간 복잡도 (6-10 단계): 5-10초
- 복잡한 문제 (10+ 단계): 10-20초

### Claude API 비용 (예상)
- 문제당 평균: $0.01-0.03
- 캐싱 활용 시: 동일 패턴 재사용으로 비용 절감
- 월 1000건 채점: 약 $10-30

### 최적화
- 결과 캐싱 (24시간)
- 동일 추론 패턴 재사용
- 비동기 처리 지원

## 보안 고려사항

✅ **구현된 보안 기능:**
- API 키 기반 인증
- SQL Injection 방지 (Moodle DML)
- XSS 방지 (출력 이스케이프)
- CSRF 토큰 (Moodle 표준)
- 학생 데이터 프라이버시 (GDPR 준수)

## 로드맵

### v1.0 (현재)
- [x] 기본 추론 경로 채점
- [x] AI 분석 통합
- [x] Moodle 3.7+ 호환
- [x] 한국어/영어 지원

### v1.1 (계획)
- [ ] 실시간 힌트 제공
- [ ] 비동기 백그라운드 채점
- [ ] 고급 캐싱 (Redis)
- [ ] 교사 대시보드 개선

### v2.0 (미래)
- [ ] 다이어그램/그래프 추론 지원
- [ ] 동료 학습 (우수 사례 공유)
- [ ] 적응형 난이도 조절
- [ ] 다국어 확장

## 문서

- [📖 Architecture](./ARCHITECTURE.md) - 시스템 설계 상세
- [⚙️ Installation](./INSTALLATION.md) - 설치 가이드
- [🐛 Troubleshooting](./INSTALLATION.md#문제-해결) - 문제 해결

## 라이선스

GNU GPL v3 or later

## 기여

KAIST Touch Math Academy 프로젝트

---

## 연락처

- **프로젝트**: AI Education System Pipeline
- **조직**: KAIST Touch Math Academy
- **지원**: GitHub Issues

---

**Built with ❤️ for better education through AI**
