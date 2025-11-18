# AI 교육 시스템 - 독립형 웹앱 (v2.0)

LMS 연동 없이 사용 가능한 AI 기반 학습 플랫폼

## 🌟 주요 기능

### 1. 독립형 인증 시스템
- ✅ 회원가입/로그인 (학생/교사 구분)
- ✅ JWT 기반 세션 관리
- ✅ 비밀번호 암호화 (bcrypt)

### 2. AI 기반 개인화 추천
- 🤖 Claude API를 활용한 맞춤형 학습 추천
- 📊 학습 패턴 자동 분석
- 🎯 개인화된 학습 경로 생성
- 💡 실시간 학습 전략 제안

### 3. 학습 과정 시각화
- 📈 React Flow 기반 흐름도 생성
- 🔍 학생 풀이 과정 상세 분석
- ⏱️ 시간, 시도 횟수, 힌트 사용 추적

### 4. 교사 지원 도구
- 👨‍🏫 학생별 개입 추천
- 📉 학습 어려움 조기 감지
- 📋 우선순위 기반 개입 목록

## 🚀 빠른 시작

### 사전 요구사항
- Docker & Docker Compose
- (선택) Anthropic API Key (AI 추천 기능용)

### 1. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# Anthropic API Key 설정 (선택사항)
# .env 파일에서 ANTHROPIC_API_KEY 설정
```

### 2. 서비스 실행

```bash
# Docker Compose로 전체 시스템 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f
```

### 3. 접속

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

### 4. 첫 사용자 생성

웹 브라우저에서 http://localhost:3000 접속 후:
1. "회원가입" 탭 클릭
2. 사용자 정보 입력
3. "학생" 또는 "교사" 선택
4. 회원가입 완료 후 로그인

## 📱 사용자 플로우

### 학생 사용 흐름

```
로그인
  ↓
대시보드 (학습 현황 확인)
  ↓
AI 추천 페이지
  ├── 학습 패턴 분석 확인
  ├── AI 추천 학습 경로 확인
  └── 맞춤형 문제 추천 받기
  ↓
문제 풀이
  ↓
풀이 과정 흐름도로 시각화
```

### 교사 사용 흐름

```
로그인
  ↓
교사 대시보드
  ├── 전체 학생 현황
  ├── 학생별 성과 분석
  └── 개입 필요 학생 확인
  ↓
AI 개입 추천
  ├── 우선순위별 학생 목록
  ├── 구체적 개입 방법 제시
  └── 1:1 지도 주제 추천
  ↓
학생 풀이 흐름도 분석
```

## 🎨 화면 구성

### 1. 로그인/회원가입
- 탭 방식의 깔끔한 UI
- 학생/교사 역할 선택
- 실시간 입력 검증

### 2. 학생 대시보드
- 내 학습 현황 카드
- 최근 풀이 목록
- 정확도 및 진행 상황 표시

### 3. AI 추천 페이지
- 학습 패턴 분석 요약
- 강점/약점 시각화
- AI 생성 학습 경로
- 맞춤형 문제 추천

### 4. 흐름도 뷰어
- 인터랙티브 노드/엣지
- 행동 타임라인
- 색상 코딩된 행동 유형

### 5. 교사 대시보드
- 학생 목록 테이블
- 통계 요약 카드
- 개입 추천 우선순위

## 🔑 주요 API 엔드포인트

### 인증
```
POST   /api/v1/auth/register    - 회원가입
POST   /api/v1/auth/token       - 로그인
GET    /api/v1/auth/me          - 현재 사용자 정보
```

### AI 추천
```
GET    /api/v1/recommendations/my-recommendations     - 내 추천
GET    /api/v1/recommendations/my-learning-path       - 학습 경로
GET    /api/v1/recommendations/dashboard/insights     - 대시보드 인사이트
GET    /api/v1/recommendations/teacher/intervention-recommendations - 교사 개입 추천
```

### 풀이 추적
```
POST   /api/v1/solutions/start-solution     - 풀이 시작
POST   /api/v1/solutions/track-action       - 행동 기록
POST   /api/v1/solutions/submit-answer      - 답안 제출
```

### 흐름도
```
POST   /api/v1/flowchart/generate           - 흐름도 생성
GET    /api/v1/flowchart/solution/{id}      - 흐름도 조회
```

## 🤖 AI 추천 시스템

### 학습 패턴 분석

시스템은 다음을 자동으로 분석합니다:
- **정확도**: 정답률 계산
- **학습 속도**: 문제당 평균 시간
- **문제 풀이 스타일**:
  - `confident_solver`: 자신감 있는 해결사
  - `guidance_seeker`: 안내 필요형
  - `persistent_explorer`: 끈기있는 탐구자
  - `balanced_learner`: 균형잡힌 학습자
- **참여도**: 문제 시도 횟수 및 시간 투자

### 추천 알고리즘

#### 1. 규칙 기반 추천 (기본)
```python
if 정확도 < 50%:
    → 쉬운 문제로 기초 다지기
elif 정확도 > 80%:
    → 더 어려운 문제로 도전
else:
    → 현재 난이도 유지
```

#### 2. AI 기반 추천 (Claude API 사용 시)
- 복잡한 패턴 인식
- 맥락적 이해
- 구체적이고 개인화된 전략 제안
- 동기부여 메시지 생성

### 교사 개입 추천

시스템은 다음 학생을 우선 표시:
- 🔴 **High Priority**: 정확도 < 40% 또는 많은 시도 횟수
- 🟡 **Medium Priority**: 낮은 참여도
- 🟢 **Low Priority**: 양호한 학습 상태

각 학생별로 제공:
- 구체적 개입 방법
- 1:1 세션 주제
- 학부모 소통 포인트

## 🎯 학습 경로 생성

AI는 학생의 현재 수준을 분석하여 단계별 학습 경로를 생성:

```
1단계: 기초 확립 (난이도 1-2)
   └── 5-8개 문제

2단계: 점진적 향상 (난이도 2-3)
   └── 8-12개 문제

3단계: 숙달 및 자신감 (난이도 3-4)
   └── 10-15개 문제
```

## 🔧 개발 모드

### Backend 개발

```bash
cd backend

# 가상환경
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn main:app --reload --port 8000
```

### Frontend 개발

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 🧪 테스트

### Backend 테스트
```bash
cd backend
pytest
```

### Frontend 테스트
```bash
cd frontend
npm run test
```

## 📦 프로덕션 배포

```bash
# Production 빌드
docker-compose -f docker-compose.prod.yml build

# Production 실행
docker-compose -f docker-compose.prod.yml up -d
```

## 🔐 보안 고려사항

1. **비밀번호**: bcrypt 해싱
2. **JWT 토큰**: 1시간 만료
3. **HTTPS**: Production 환경 필수
4. **API Rate Limiting**: 구현 권장
5. **입력 검증**: 모든 엔드포인트에 적용

## 🎓 데모 계정

첫 실행 시 다음 계정 생성 권장:
- 학생: `student` / `password`
- 교사: `teacher` / `password`

## 🤝 기여

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 라이선스

MIT License

## 🆘 문제 해결

### Docker 컨테이너가 시작되지 않음
```bash
docker-compose down
docker-compose up --build
```

### Database 연결 오류
```bash
# 데이터베이스 재시작
docker-compose restart postgres
```

### Frontend가 Backend에 연결되지 않음
- `.env` 파일의 `ALLOWED_ORIGINS` 확인
- CORS 설정 확인

### AI 추천이 작동하지 않음
- `ANTHROPIC_API_KEY` 설정 확인
- API 키가 없으면 규칙 기반 추천으로 동작

## 📞 지원

문제가 있으면 GitHub Issues에 보고해주세요.

---

**Made with ❤️ for better education**
