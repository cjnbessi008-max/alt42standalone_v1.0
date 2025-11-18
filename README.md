# Alt42 Standalone v1.0

> AI 기반 교육 시스템 파이프라인 with 집중력 추적 및 정신정렬 루틴

## 프로젝트 개요

Alt42 Standalone는 KAIST Touch Math Academy를 위한 AI 기반 교육 시스템으로, 교사가 자연어 요청만으로 완전한 교육 모듈을 자동 생성할 수 있도록 지원합니다.

### 주요 특징

- ✨ **자연어 기반 모듈 생성**: 코딩 없이 교육 콘텐츠 생성
- 🧠 **AI 기반 세계 모델 재구성**: Claude API를 활용한 지능형 콘텐츠 생성
- 🎯 **집중력 추적 시스템**: 학생의 학습 집중도 실시간 모니터링
- 🧘 **10초 정신정렬 루틴**: 집중력 회복을 위한 자동 휴식 제공
- 📊 **분석 대시보드**: 학습 패턴 및 집중도 분석
- 🔗 **Moodle LMS 연동**: 기존 LMS와 원활한 통합

## 새로운 기능: 집중력 추적 및 정신정렬 루틴

이 브랜치(`claude/add-focus-break-routine-01UUiWKzThSFxutkvLTEhvC8`)에는 다음 기능이 추가되었습니다:

### 🎯 집중도 자동 추적
- 실시간 상호작용 패턴 모니터링
- 유휴 시간(idle time) 자동 감지
- 집중도 점수 계산 및 분석

### 🧘 10초 정신정렬 루틴
집중력이 깨졌을 때 자동으로 제공되는 3가지 루틴:

1. **호흡 정렬** (Breathing): 3-2-5 심호흡법
2. **스트레칭** (Stretching): 간단한 상체 스트레칭
3. **눈 운동** (Eye Exercise): 눈 피로 완화 운동

### 📊 학습 분석
- 총 학습 시간 추적
- 평균 집중도 점수
- 휴식 패턴 분석
- 루틴 효과성 평가

## 기술 스택

### Backend
- **Python 3.11+** with FastAPI
- **PostgreSQL 15+** (JSONB 지원)
- **SQLAlchemy** ORM
- **Redis** (캐싱 및 세션)

### Frontend
- **React 18+** with TypeScript
- **Axios** for API calls
- **CSS3** with animations
- **React Hooks** for state management

### Moodle Integration
- **Moodle 3.7+**
- **PHP 7.1.9+**
- **MySQL 5.7+** (Moodle용)
- **cURL** for API communication

## 빠른 시작

### 사전 요구사항

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- (선택) Moodle 3.7+

### 설치

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 2. 데이터베이스 설정
createdb alt42_focus_tracking
psql -d alt42_focus_tracking -f backend/migrations/001_create_focus_tracking_tables.sql

# 3. Backend 설정
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일을 수정하여 데이터베이스 연결 정보 입력

# Backend 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4. Frontend 설정 (새 터미널)
cd frontend
npm install
npm start

# 5. (선택) Moodle 플러그인 설치
cp -r moodle-integration /path/to/moodle/local/alt42_focus
# Moodle 관리자 페이지에서 플러그인 활성화
```

## 사용 방법

### React 앱에서 사용

```typescript
import { useFocusTracking } from './hooks/useFocusTracking';
import MentalAlignmentRoutineModal from './components/MentalAlignmentRoutine';

function MyLearningModule() {
  const {
    showRoutineModal,
    currentBreak,
    completeBreak,
    skipBreak
  } = useFocusTracking({
    studentId: 'student_123',
    moduleId: 'math_module_01',
    autoStart: true
  });

  return (
    <>
      {/* Your learning content */}

      {showRoutineModal && currentBreak && (
        <MentalAlignmentRoutineModal
          isOpen={showRoutineModal}
          breakId={currentBreak.id}
          studentId="student_123"
          onComplete={completeBreak}
          onSkip={skipBreak}
        />
      )}
    </>
  );
}
```

### Moodle에서 사용

```php
<?php
require_once($CFG->dirroot . '/local/alt42_focus/classes/focus_tracker.php');

$tracker = new \local_alt42_focus\focus_tracker();

// 집중도 추적 시작
$session = $tracker->start_session($USER->id, $COURSE->id, 'course_' . $COURSE->id);

// 추적 스크립트 주입
echo $tracker->inject_tracking_script($USER->id, $COURSE->id, 'course_' . $COURSE->id);
?>
```

## API 문서

전체 API 문서는 다음 위치에서 확인할 수 있습니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

주요 엔드포인트:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/focus/sessions` | 세션 시작 |
| POST | `/api/v1/focus/sessions/{id}/end` | 세션 종료 |
| POST | `/api/v1/focus/breaks` | 집중 중단 기록 |
| GET | `/api/v1/focus/routines/recommend/{student_id}` | 추천 루틴 조회 |
| GET | `/api/v1/focus/analytics/{student_id}` | 분석 데이터 조회 |

## 프로젝트 구조

```
alt42standalone_v1.0/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── services/         # Business logic
│   │   └── database/         # DB connection
│   └── migrations/           # SQL migrations
├── frontend/
│   └── src/
│       ├── components/       # React components
│       ├── hooks/            # Custom hooks
│       ├── services/         # API services
│       ├── types/            # TypeScript types
│       └── utils/            # Utilities
├── moodle-integration/
│   ├── classes/              # PHP classes
│   ├── db/                   # Database schema
│   └── lang/                 # Language strings
├── config/                   # Configuration files
├── docs/                     # Documentation
└── tasks/                    # Project tasks & PRD
```

## 데이터베이스 스키마

주요 테이블:

- **focus_sessions**: 학생 학습 세션 추적
- **focus_breaks**: 집중 중단 및 루틴 기록
- **mental_alignment_routines**: 정신정렬 루틴 정의
- **student_focus_preferences**: 학생별 설정
- **moodle_integration_log**: Moodle 연동 로그

상세 스키마는 [데이터베이스 마이그레이션 파일](backend/migrations/001_create_focus_tracking_tables.sql)을 참조하세요.

## 개발 가이드

### Backend 개발

```bash
cd backend

# 의존성 추가
pip install new-package
pip freeze > requirements.txt

# 테스트 실행
pytest

# 코드 포맷팅
black app/
isort app/
```

### Frontend 개발

```bash
cd frontend

# 의존성 추가
npm install package-name

# 빌드
npm run build

# 테스트
npm test
```

## 설정

### 환경 변수

#### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/alt42_focus_tracking
SQL_ECHO=false
API_KEY=your-secret-api-key
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:8000
```

#### Moodle Plugin
Moodle 관리자 페이지에서 설정:
- API Base URL: `http://your-backend:8000/api/v1/focus`
- API Key: Backend와 동일한 키
- Instance ID: 고유 Moodle 인스턴스 식별자

## 배포

### Docker로 배포

```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d

# 개별 서비스 빌드
docker build -t alt42-backend ./backend
docker build -t alt42-frontend ./frontend
```

### 프로덕션 체크리스트

- [ ] 환경 변수 프로덕션 값으로 변경
- [ ] HTTPS 설정
- [ ] CORS 정책 검토
- [ ] API 키 보안 강화
- [ ] 데이터베이스 백업 설정
- [ ] 모니터링 설정 (Prometheus, Grafana)
- [ ] 로그 수집 설정 (ELK Stack)

## 문서

- [📘 집중력 추적 가이드](docs/FOCUS_TRACKING_GUIDE.md)
- [📋 PRD (제품 요구사항 문서)](tasks/0001-prd-ai-education-pipeline.md)

## 기여

기여는 언제나 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 라이선스

This project is licensed under the GNU GPL v3 License - see the [LICENSE](LICENSE) file for details

## 문의

- **프로젝트 홈**: https://github.com/your-org/alt42standalone_v1.0
- **이슈 트래커**: https://github.com/your-org/alt42standalone_v1.0/issues
- **이메일**: support@alt42.com

## 감사의 글

- KAIST Touch Math Academy
- Anthropic Claude API
- Moodle Community

---

**만든 사람**: Alt42 Development Team
**최종 업데이트**: 2025-11-18
