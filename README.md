# AI 교육 시스템 - 자신감 회복 프로그램

LMS와 연동하여 학생들의 자신감을 회복시키기 위한 초쉬운 문제 제공 시스템입니다.

## 🎯 주요 기능

### 자신감 추적 시스템
- 학생별 자신감 점수 실시간 추적 (0-100점)
- 연속 정답 횟수 및 숙달도 카운트
- 시각적 자신감 표시 (색상, 이모지, 진행 바)

### 적응형 문제 선택
- 자신감 수준에 따른 난이도 자동 조정 (1-3단계)
- 최근 시도하지 않은 문제 우선 제공
- 성공률 기반 문제 추천

### 학습 피드백
- 즉각적인 정답/오답 피드백
- 자신감 변화량 실시간 표시
- 격려 메시지 및 설명 제공
- 힌트 기능 지원

### 세션 통계
- 일별 학습 통계 추적
- 평균 풀이 시간 측정
- 정확도 분석

## 🏗️ 시스템 아키텍처

```
Frontend (React + TypeScript)
    ↓ REST API
Backend (Python FastAPI)
    ↓
PostgreSQL Database
```

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                    # Python FastAPI 백엔드
│   ├── services/
│   │   └── confidence_builder.py    # 자신감 빌더 서비스
│   ├── models/                       # 데이터 모델
│   ├── api.py                        # API 엔드포인트
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   └── components/
│   │       ├── EasyProblemsInterface.tsx    # 학생 인터페이스
│   │       └── ConfidenceIndicator.tsx      # 자신감 표시 컴포넌트
│   ├── package.json
│   └── Dockerfile.dev
├── database/                   # 데이터베이스
│   └── migrations/
│       └── 001_initial_schema.sql   # 초기 스키마
├── docker-compose.yml         # Docker 설정
└── README.md
```

## 🚀 시작하기

### 필수 요구사항

- Docker & Docker Compose
- Node.js 20+ (로컬 개발 시)
- Python 3.11+ (로컬 개발 시)
- PostgreSQL 16+ (로컬 개발 시)

### Docker를 사용한 실행 (권장)

1. **환경 변수 설정**
```bash
cp .env.example .env
# .env 파일을 열어 필요한 값 수정
```

2. **Docker Compose로 전체 시스템 실행**
```bash
docker-compose up -d
```

3. **서비스 접속**
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000
- API 문서: http://localhost:8000/docs

4. **데이터베이스 초기화**
```bash
# PostgreSQL에 접속하여 스키마 실행
docker exec -i ai_education_db psql -U postgres -d ai_education < database/migrations/001_initial_schema.sql
```

### 로컬 개발 환경 설정

#### 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 데이터베이스 설정 (PostgreSQL 실행 중이어야 함)
psql -U postgres -c "CREATE DATABASE ai_education;"
psql -U postgres -d ai_education -f ../database/migrations/001_initial_schema.sql

# 서버 실행
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

#### 프론트엔드 설정

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 📊 데이터베이스 스키마

### 주요 테이블

#### `confidence_levels`
학생별 모듈별 자신감 점수 추적
- `current_confidence_score`: 현재 자신감 (0-100)
- `consecutive_correct`: 연속 정답 수
- `mastery_count`: 총 정답 수

#### `easy_problems`
자신감 회복용 쉬운 문제 태그
- `difficulty_level`: 난이도 (1-3)
- `confidence_boost_amount`: 자신감 증가량
- `success_rate`: 성공률

#### `student_attempts`
학생 문제 풀이 기록
- `is_correct`: 정답 여부
- `time_spent_seconds`: 풀이 시간
- `confidence_before/after`: 자신감 변화

#### `student_session_stats`
일별 학습 세션 통계
- `problems_attempted`: 시도한 문제 수
- `session_confidence_delta`: 세션 중 자신감 변화

## 🔌 API 엔드포인트

### 자신감 관련

- `GET /api/confidence/{student_id}/{module_id}` - 자신감 점수 조회
- `GET /api/confidence/{student_id}/{module_id}/summary` - 자신감 요약 정보

### 문제 관련

- `GET /api/easy-problems/{student_id}/{module_id}` - 쉬운 문제 목록 조회
- `GET /api/easy-problems/{student_id}/{module_id}/next` - 다음 문제 추천
- `POST /api/submit-answer` - 답안 제출

### 요청 예시

```bash
# 자신감 점수 조회
curl http://localhost:8000/api/confidence/{student_id}/{module_id}

# 다음 문제 가져오기
curl http://localhost:8000/api/easy-problems/{student_id}/{module_id}/next

# 답안 제출
curl -X POST http://localhost:8000/api/submit-answer \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "student001",
    "module_id": "module001",
    "problem_id": "problem001",
    "answer_numerator": 1,
    "answer_denominator": 2,
    "time_spent_seconds": 30,
    "hint_used": false
  }'
```

## 🎨 프론트엔드 컴포넌트

### `EasyProblemsInterface`
학생용 문제 풀이 인터페이스
- 자신감 표시 헤더
- 문제 시각화 (분수 피자/원형)
- 답안 입력 폼
- 실시간 피드백

**사용 예시:**
```tsx
import EasyProblemsInterface from './components/EasyProblemsInterface';

function App() {
  return (
    <EasyProblemsInterface
      studentId="student001"
      moduleId="00000000-0000-0000-0000-000000000001"
      apiBaseUrl="http://localhost:8000"
    />
  );
}
```

### `ConfidenceIndicator`
자신감 표시 위젯
- 자신감 점수 바
- 레벨 표시
- 세부 통계

**사용 예시:**
```tsx
import ConfidenceIndicator from './components/ConfidenceIndicator';

<ConfidenceIndicator
  studentId="student001"
  moduleId="00000000-0000-0000-0000-000000000001"
  showDetails={true}
  autoRefresh={true}
  refreshInterval={30000}
/>
```

## 🧪 테스트 데이터

초기 스키마에는 테스트용 데이터가 포함되어 있습니다:

- **교사**: Dr. Kim (teacher001)
- **학생**:
  - Park Minho (student001)
  - Lee Jiwon (student002)
  - Choi Yuna (student003)
- **모듈**: Fractions Basics (분수 기초)
- **문제**: 5개의 샘플 분수 문제 (난이도 1-3)

### 테스트 학생 정보

```
student001: 자신감 30점 (낮음)
student002: 자신감 45점 (중간)
student003: 자신감 25점 (매우 낮음)
```

## 🔧 자신감 알고리즘

### 자신감 점수 계산

```python
기본 증가량 = 5점 (정답 시)
연속 정답 보너스 = 2점 × min(연속 횟수, 3)
빠른 답변 보너스 = 2점 (30초 미만)
힌트 사용 패널티 = -1점
난이도 배수 = 1.0 + (난이도 - 1) × 0.2

오답 패널티 = -3점
```

### 난이도 추천

- 자신감 < 30: 난이도 1 (매우 쉬움)
- 자신감 30-50: 난이도 1 (쉬움)
- 자신감 50-70: 난이도 2 (보통)
- 자신감 > 70: 난이도 3 (약간 어려움)

## 🔐 LMS 연동 (향후 구현)

### KAIST SSO 인증
- OAuth 2.0 / SAML 연동
- 학생/교사 자동 동기화

### 성적 연동
- 학습 진도 자동 업데이트
- 자신감 점수 성적표 반영 (선택 사항)

## 📈 향후 개발 계획

### Phase 1: 핵심 기능 (완료)
- ✅ 자신감 추적 시스템
- ✅ 쉬운 문제 선택 알고리즘
- ✅ 학생 인터페이스
- ✅ 기본 API

### Phase 2: LMS 연동
- [ ] KAIST SSO 인증
- [ ] 학생 데이터 동기화
- [ ] 성적 내보내기

### Phase 3: AI 기반 확장
- [ ] Claude API 연동
- [ ] 자동 문제 생성
- [ ] 개인화된 학습 경로

### Phase 4: 고급 분석
- [ ] 예측 분석
- [ ] 대시보드
- [ ] 교사용 리포트

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ for confident learners**
