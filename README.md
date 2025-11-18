# 🧠 추론 분석 학습 시스템 (Reasoning Feedback System)

AI 기반의 학습 피드백 시스템으로, 학생들이 문제를 틀렸을 때 **왜 틀렸는지 한 문장으로 설명**하도록 유도하고, Claude AI가 이를 분석하여 **건설적인 피드백**을 제공합니다.

## ✨ 주요 기능

### 🎯 핵심 학습 플로우

1. **문제 풀이**: 학생이 수학 문제를 풀고 답을 제출합니다
2. **추론 설명**: 답이 틀렸을 경우, 자신의 추론 과정을 한 문장으로 설명합니다
3. **AI 분석**: Claude AI가 학생의 설명을 분석하여 잘못된 추론을 파악합니다
4. **피드백 제공**:
   - ❌ 어떤 개념을 잘못 이해했는지
   - ✅ 올바른 해결 방법
   - 💪 격려의 메시지
5. **진행 상황 추적**: 학생의 학습 진행 상황을 자동으로 기록하고 분석합니다

### 📊 진행 상황 대시보드

- 유형별 숙달도 추적
- 강점과 약점 자동 분석
- 정확도 및 학습 패턴 시각화

### 🔌 Moodle 통합 지원

- 외부 학생 ID로 연동 가능
- REST API를 통한 LMS 통합

---

## 🛠️ 기술 스택

### Backend
- **Python 3.11+** - FastAPI
- **PostgreSQL 15+** - 데이터베이스
- **Claude AI (Anthropic)** - 추론 분석 엔진

### Frontend
- **React 18+** - TypeScript
- **Vite** - 빌드 도구
- **Axios** - API 클라이언트

### DevOps
- **Docker & Docker Compose** - 컨테이너화
- **Nginx** - 프론트엔드 서버

---

## 🚀 빠른 시작

### 사전 요구사항

- Docker & Docker Compose
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com/)에서 발급)

### 1. 저장소 클론

```bash
git clone <repository-url>
cd alt42standalone_v1.0
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 다음 값을 설정하세요:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Docker Compose로 실행

```bash
docker-compose up -d
```

### 4. 브라우저에서 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API 문서**: http://localhost:8000/docs
- **데이터베이스**: localhost:5432

---

## 📚 수동 설치 (개발 환경)

Docker를 사용하지 않고 로컬에서 개발하려면:

### Backend 설정

```bash
cd backend

# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 스키마 적용
psql -U reasoning_user -d reasoning_db -f ../database/schema.sql

# 서버 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

---

## 📖 사용 방법

### 1. 학생 등록

첫 방문 시 학생 정보를 입력합니다:
- 이름 (필수)
- 학년 (선택)

### 2. 문제 풀기

시스템이 랜덤으로 문제를 제공합니다. 답을 입력하고 제출하세요.

### 3. 추론 설명 (틀렸을 경우)

답이 틀렸다면, **왜 그렇게 풀었는지 한 문장으로 설명**하세요.

**예시**:
- "분자끼리 더하고 분모끼리 더했어요"
- "12와 8을 곱하는 대신 더했어요"
- "나눗셈 순서를 반대로 했어요"

### 4. AI 피드백 확인

Claude AI가 분석한 결과를 확인하고, 올바른 해결 방법을 학습하세요.

### 5. 진행 상황 확인

"진행 상황" 탭에서 자신의 학습 패턴과 강점/약점을 확인할 수 있습니다.

---

## 🔗 API 문서

백엔드 API 문서는 다음 주소에서 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 주요 엔드포인트

#### 학생 관리
- `POST /api/students/` - 학생 생성
- `GET /api/students/{student_id}` - 학생 정보 조회
- `GET /api/students/external/{external_id}` - 외부 ID로 학생 조회

#### 문제
- `GET /api/problems/` - 문제 목록
- `GET /api/problems/random/next` - 랜덤 문제
- `POST /api/problems/` - 문제 생성 (관리자)

#### 제출
- `POST /api/submissions/submit-answer` - 답 제출
- `POST /api/submissions/submit-reasoning` - 추론 설명 제출

#### 진행 상황
- `GET /api/progress/student/{student_id}` - 학습 진행 상황
- `GET /api/progress/student/{student_id}/dashboard` - 대시보드 데이터

---

## 🗄️ 데이터베이스 스키마

주요 테이블:

- **students** - 학생 정보
- **problems** - 문제 데이터
- **student_attempts** - 문제 풀이 시도
- **reasoning_explanations** - 학생의 추론 설명
- **ai_feedback** - AI가 생성한 피드백
- **learning_progress** - 학습 진행 상황 집계

자세한 스키마는 `database/schema.sql`을 참조하세요.

---

## 🔧 설정

### 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 문자열 | `postgresql://reasoning_user:reasoning_pass@localhost:5432/reasoning_db` |
| `ANTHROPIC_API_KEY` | Claude API 키 | (필수) |
| `ANTHROPIC_MODEL` | 사용할 Claude 모델 | `claude-3-5-sonnet-20241022` |
| `CORS_ORIGINS` | CORS 허용 도메인 | `http://localhost:3000,http://localhost:5173` |
| `DEBUG` | 디버그 모드 | `false` |

### 문제 추가하기

데이터베이스에 직접 문제를 추가하거나 API를 통해 추가할 수 있습니다:

```sql
INSERT INTO problems (title, description, problem_type, difficulty_level, correct_answer, answer_type)
VALUES (
    '분수 덧셈',
    '1/2 + 1/4 = ?',
    'fractions',
    2,
    '3/4',
    'text'
);
```

---

## 🎨 커스터마이징

### AI 프롬프트 수정

`backend/ai_service.py`의 `_build_korean_system_prompt()` 함수를 수정하여 AI의 피드백 스타일을 변경할 수 있습니다.

### UI 테마 변경

`frontend/src/index.css`에서 색상과 스타일을 수정할 수 있습니다.

---

## 🔌 Moodle 통합

### LTI 통합 (향후 구현 예정)

현재는 REST API를 통한 기본 통합만 지원합니다. Moodle에서 학생을 생성할 때 `external_id`를 제공하세요:

```javascript
POST /api/students/
{
  "name": "홍길동",
  "grade_level": "3학년",
  "external_id": "moodle_user_123"
}
```

---

## 🐛 문제 해결

### 데이터베이스 연결 오류

```bash
# PostgreSQL이 실행 중인지 확인
docker-compose ps

# 데이터베이스 로그 확인
docker-compose logs database
```

### Claude API 오류

- API 키가 올바른지 확인하세요
- [Anthropic 콘솔](https://console.anthropic.com/)에서 사용량 제한을 확인하세요

### 포트 충돌

다른 서비스가 포트를 사용 중이라면 `docker-compose.yml`에서 포트를 변경하세요:

```yaml
ports:
  - "8001:8000"  # 백엔드
  - "3001:3000"  # 프론트엔드
```

---

## 📝 개발 로드맵

### ✅ 완료
- [x] 기본 문제 풀이 및 피드백 시스템
- [x] Claude AI 통합
- [x] 진행 상황 추적
- [x] Docker 배포

### 🚧 진행 중
- [ ] Moodle LTI 통합
- [ ] 추가 문제 유형 지원
- [ ] 교사 대시보드

### 📅 계획
- [ ] 다국어 지원 확장 (영어 완전 지원)
- [ ] 음성 입력 지원
- [ ] 모바일 앱
- [ ] 고급 분석 및 리포트

---

## 🤝 기여하기

기여는 언제나 환영합니다! 이슈를 열거나 풀 리퀘스트를 보내주세요.

### 개발 가이드라인

1. 새 브랜치를 생성하세요: `git checkout -b feature/amazing-feature`
2. 변경사항을 커밋하세요: `git commit -m 'Add amazing feature'`
3. 브랜치에 푸시하세요: `git push origin feature/amazing-feature`
4. Pull Request를 생성하세요

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

## 🙏 감사의 말

- **Anthropic** - Claude AI 제공
- **KAIST Touch Math Academy** - 프로젝트 아이디어 및 요구사항 제공

---

## 📧 문의

질문이나 제안사항이 있으시면 이슈를 열어주세요.

**Made with ❤️ for better education**
