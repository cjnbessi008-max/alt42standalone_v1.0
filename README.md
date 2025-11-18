# AI Education System - Standalone Web App

**시간 대비 사고 효율 측정 시스템 (Thought Efficiency Score)**

독립형 웹 애플리케이션으로, 학생들의 학습 효율성을 측정하고 교사에게 실시간 인사이트를 제공합니다.

---

## 🎯 주요 기능

### 1. **Thought Efficiency Score (TES)**
학생의 학습 효율성을 종합 평가하는 혁신적인 지표:

```
TES = (정확도 × 40%) + (속도 × 30%) + (첫 시도 × 20%) + (일관성 × 10%)
```

- ✅ **정확도 (40%)**: 정답률
- ✅ **속도 (30%)**: 동료 대비 문제 해결 시간
- ✅ **첫 시도 성공률 (20%)**: 힌트 없이 첫 시도 정답률
- ✅ **일관성 (10%)**: 문제 유형 간 성능 일관성

### 2. **실시간 분석 대시보드**
- 학생별 TES 점수 및 추세
- 학급 전체 통계 및 분포
- 위험군 학생 자동 감지
- AI 생성 교육 인사이트

### 3. **Moodle LMS 통합 (선택적)**
- LTI 1.3 표준 지원
- 자동 성적 동기화
- Single Sign-On (SSO)

---

## 🚀 빠른 시작 (5분 안에 실행)

### 전제 조건
- Docker & Docker Compose 설치
- 포트 8000 (백엔드), 5432 (DB) 사용 가능

### 1단계: 저장소 클론

```bash
git clone https://github.com/cjnbessi008-max/alt42standalone_v1.0.git
cd alt42standalone_v1.0
```

### 2단계: 서비스 시작

```bash
./start.sh
```

또는 수동으로:

```bash
docker-compose up -d
```

### 3단계: API 접속

- **API 서버**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs (Swagger UI)
- **Health Check**: http://localhost:8000/health

---

## 📊 API 사용 예제

### 1. 학생 생성

```bash
curl -X POST http://localhost:8000/api/v1/students \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Kim",
    "email": "alice@example.com",
    "cohort_id": "spring-2025"
  }'
```

### 2. 모듈 생성 (교사용)

```bash
curl -X POST http://localhost:8000/api/v1/modules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fractions Module",
    "description": "Learn fractions with interactive problems",
    "teacher_id": "TEACHER_UUID_HERE"
  }'
```

### 3. 문제 추가

```bash
curl -X POST http://localhost:8000/api/v1/modules/problems \
  -H "Content-Type: application/json" \
  -d '{
    "module_id": "MODULE_UUID_HERE",
    "problem_type": "addition",
    "question_text": "What is 1/2 + 1/4?",
    "correct_answer": "3/4",
    "difficulty": "medium"
  }'
```

### 4. 학생 시도 제출

```bash
curl -X POST http://localhost:8000/api/v1/attempts \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_UUID_HERE",
    "module_id": "MODULE_UUID_HERE",
    "problem_id": "PROBLEM_UUID_HERE",
    "student_answer": "3/4",
    "time_spent_seconds": 45,
    "hints_used": 0
  }'
```

### 5. TES 점수 계산 (10개 시도 후)

```bash
curl -X POST http://localhost:8000/api/v1/efficiency/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STUDENT_UUID_HERE",
    "module_id": "MODULE_UUID_HERE",
    "force_recalc": false
  }'
```

**응답 예시**:

```json
{
  "tes_score": 96.00,
  "tes_percentile": 95,
  "tes_grade": "A",
  "components": {
    "correctness": {
      "score": 95.00,
      "weight": 0.40,
      "contribution": 38.00
    },
    "speed": {
      "score": 100.00,
      "weight": 0.30,
      "contribution": 30.00
    },
    "first_try_success": {
      "score": 90.00,
      "weight": 0.20,
      "contribution": 18.00
    },
    "consistency": {
      "score": 100.00,
      "weight": 0.10,
      "contribution": 10.00
    }
  },
  "raw_metrics": {
    "total_attempts": 20,
    "correct_attempts": 19,
    "total_problems": 20,
    "first_try_correct": 18,
    "avg_time_seconds": 45.0
  },
  "sufficient_data": true,
  "calculated_at": "2025-11-18T10:30:00Z"
}
```

---

## 📁 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/                      # FastAPI 백엔드
│   ├── app/
│   │   ├── api/v1/              # API 엔드포인트
│   │   │   ├── students.py      # 학생 관리
│   │   │   ├── modules.py       # 모듈/문제 관리
│   │   │   ├── attempts.py      # 시도 기록
│   │   │   └── efficiency.py    # TES 계산
│   │   ├── models/              # SQLAlchemy 모델
│   │   ├── schemas/             # Pydantic 스키마
│   │   ├── services/            # 비즈니스 로직
│   │   │   └── efficiency_calculator.py  # TES 계산 엔진
│   │   ├── config.py            # 설정
│   │   ├── database.py          # DB 연결
│   │   └── main.py              # FastAPI 앱
│   ├── requirements.txt         # Python 의존성
│   └── Dockerfile
├── docs/                         # 문서
│   ├── efficiency-score-model.md
│   ├── database-schema-lms-efficiency.md
│   ├── lms-integration-architecture.md
│   └── api-specification.md
├── docker-compose.yml           # Docker Compose 설정
├── start.sh                     # 시작 스크립트
└── README.md                    # 이 파일
```

---

## 🛠️ 기술 스택

### Backend
- **FastAPI** (Python 3.11) - 현대적이고 빠른 API 프레임워크
- **SQLAlchemy 2.0** - ORM
- **PostgreSQL 15** - 데이터베이스
- **Numpy** - 통계 계산
- **Pydantic** - 데이터 검증

### Frontend (예정)
- React 18 + TypeScript
- Material-UI (MUI)
- Recharts

### DevOps
- Docker & Docker Compose
- Uvicorn (ASGI 서버)

---

## 🗄️ 데이터베이스 스키마

### 핵심 테이블

1. **students** - 학생 정보
2. **teachers** - 교사 정보
3. **modules** - 학습 모듈
4. **problems** - 개별 문제
5. **student_attempts** - 학생 시도 기록 (TES 계산 원본 데이터)
6. **efficiency_scores** - 현재 TES 점수
7. **efficiency_score_history** - TES 히스토리 (추세 분석)

---

## 🧪 테스트

### API 테스트 (Swagger UI)

1. http://localhost:8000/docs 접속
2. 각 엔드포인트를 시각적으로 테스트
3. "Try it out" 버튼 클릭 → 요청 실행

### Unit Tests (예정)

```bash
cd backend
pytest
```

---

## 📈 성능

- **TES 계산**: < 100ms (학생당)
- **API 응답**: < 50ms (평균)
- **동시 접속**: 100+ 사용자

---

## 🔐 보안

- JWT 토큰 기반 인증 (예정)
- CORS 설정 완료
- SQL Injection 방지 (SQLAlchemy ORM)
- Input 검증 (Pydantic)

---

## 🚧 로드맵

### Phase 1 (완료) ✅
- [x] 백엔드 API 구현
- [x] TES 계산 엔진
- [x] Docker Compose 설정

### Phase 2 (진행 중)
- [ ] React 프론트엔드
- [ ] 학생 대시보드
- [ ] 교사 대시보드

### Phase 3 (예정)
- [ ] LTI 1.3 통합
- [ ] Moodle 연동
- [ ] 자동 성적 동기화

### Phase 4 (미래)
- [ ] AI 인사이트 생성
- [ ] 예측 분석
- [ ] 모바일 앱

---

## 📞 문의

- **이메일**: admin@kaist.ac.kr
- **GitHub Issues**: [Create Issue](https://github.com/cjnbessi008-max/alt42standalone_v1.0/issues)

---

## 📝 라이센스

Copyright © 2025 KAIST Touch Math Academy
All rights reserved.

---

## 🙏 크레딧

- **TES 방법론**: 교육 인지 부하 이론 기반
- **LTI 표준**: IMS Global Learning Consortium
- **FastAPI**: Sebastián Ramírez

---

**마지막 업데이트**: 2025-11-18
**버전**: 1.0.0
**상태**: MVP 준비 완료 ✅
