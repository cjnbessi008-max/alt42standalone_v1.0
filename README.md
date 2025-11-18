# AI Education System Pipeline - Moodle Integration

## 프로젝트 개요

KAIST Touch Math Academy를 위한 AI 교육 시스템 파이프라인입니다. 교사가 자연어로 교육 모듈을 요청하면 자동으로 완전한 기술 인프라(데이터 모델부터 UI까지)를 구축하는 시스템입니다.

현재 이 저장소에는 **Moodle 3.7 LMS 연동 및 선행 개념 부족 감지 시스템**이 구현되어 있습니다.

## 주요 기능

### 현재 구현됨 ✅

- **Moodle 3.7 Web Services API 연동**: 학생 성적, 퀴즈, 과제 데이터 수집
- **선행 개념 부족 자동 감지**: 학습 데이터 분석을 통한 prerequisite gap 식별
- **신뢰도 기반 분석**: 데이터 양, 일관성, 심각도를 고려한 신뢰도 점수
- **REST API**: 외부 시스템에서 분석 결과 조회 가능
- **자동 동기화**: Cron을 통한 정기 데이터 동기화
- **통계 및 리포트**: 코스별, 학생별 gap 통계

### 향후 개발 예정 📋

- 자연어 입력 처리 (Phase 1)
- 도메인 모델 자동 생성 (Phase 1)
- 규칙 엔진 및 코드 생성 (Phase 2)
- 동적 스키마 생성 (Phase 3)
- UI 자동 생성 (Phase 5)
- 전체 모듈 배포 자동화 (Phase 6)

## 기술 스택

### 현재 시스템 (Moodle Integration)

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **LMS**: Moodle 3.7
- **API**: REST with JSON

### 향후 전체 시스템

- **Frontend**: React 18+, Redux Toolkit
- **Backend**: Python FastAPI, Node.js Express
- **Database**: PostgreSQL 15+, Redis 7+, Neo4j (ontologies)
- **AI**: Claude API (Anthropic)
- **DevOps**: Docker, GitHub Actions

## 프로젝트 구조

```
alt42standalone_v1.0/
├── moodle-integration/       # Moodle API 연동
│   ├── config.sample.php      # 설정 샘플
│   ├── MoodleClient.php       # Moodle API 클라이언트
│   ├── GapDetector.php        # Gap 감지 알고리즘
│   └── DatabaseManager.php    # DB 관리
├── database/                  # 데이터베이스
│   └── schema.sql             # MySQL 스키마
├── api/                       # REST API
│   ├── gaps.php               # Gap 조회 API
│   └── sync.php               # 동기화 API
├── scripts/                   # 유틸리티 스크립트
│   └── sync_scheduler.php     # Cron 동기화
├── examples/                  # 사용 예제
│   ├── example_usage.php      # PHP 예제
│   └── api_examples.sh        # API 예제
├── docs/                      # 문서
│   └── MOODLE_INTEGRATION.md  # 상세 가이드
├── tasks/                     # 기획 문서
│   └── 0001-prd-ai-education-pipeline.md  # PRD
└── README.md                  # 본 문서
```

## 빠른 시작

### 1. 요구사항

- PHP 7.1.9+
- MySQL 5.7+
- Moodle 3.7+ (Web Services 활성화)
- PHP Extensions: PDO, pdo_mysql, curl, json

### 2. 설치

```bash
# 1. 저장소 클론
git clone https://github.com/yourusername/alt42standalone_v1.0.git
cd alt42standalone_v1.0

# 2. 데이터베이스 설정
mysql -u root -p < database/schema.sql

# 3. 설정 파일 생성
cd moodle-integration
cp config.sample.php config.php
nano config.php  # 설정 수정

# 4. 로그 디렉토리 생성
mkdir -p logs
chmod 755 logs

# 5. 웹 서버 설정 (Apache/Nginx)
# 자세한 내용은 docs/MOODLE_INTEGRATION.md 참조
```

### 3. 설정

**config.php 예시:**

```php
return [
    'moodle' => [
        'base_url' => 'https://your-moodle-site.com',
        'token' => 'your-web-service-token',
    ],
    'database' => [
        'host' => 'localhost',
        'database' => 'prerequisite_gaps',
        'username' => 'db_user',
        'password' => 'db_password',
    ],
    'gap_detection' => [
        'passing_threshold' => 70,
        'min_attempts' => 3,
        'confidence_threshold' => 0.7,
        'prerequisites' => [
            'fractions_multiplication' => ['fractions_basic', 'multiplication_basic'],
            'algebra_equations' => ['arithmetic_operations', 'variables_basic'],
        ],
    ],
];
```

### 4. 사용

#### PHP 스크립트로 분석:

```php
php examples/example_usage.php
```

#### REST API 사용:

```bash
# 학생 gap 조회
curl -X GET "http://your-server/api/gaps.php/student/123/course/1" \
  -H "Authorization: Bearer your-api-key"

# 데이터 동기화
curl -X POST "http://your-server/api/sync.php" \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"course_id": 1, "sync_type": "manual"}'
```

#### Cron 자동 동기화:

```bash
# crontab에 추가
0 * * * * /usr/bin/php /path/to/scripts/sync_scheduler.php
```

## 문서

- **[Moodle 연동 가이드](docs/MOODLE_INTEGRATION.md)**: 상세 설치, 설정, 사용법
- **[PRD 문서](tasks/0001-prd-ai-education-pipeline.md)**: 전체 시스템 기획서
- **[API 예제](examples/api_examples.sh)**: REST API 사용 예제
- **[PHP 예제](examples/example_usage.php)**: PHP 코드 예제

## 선행 개념 부족 감지 알고리즘

### 작동 방식

1. **데이터 수집**: Moodle에서 학생 성적, 퀴즈, 과제 데이터 수집
2. **어려움 개념 식별**: 통과 기준(기본 70%) 미달 개념 찾기
3. **선행 개념 분석**: 어려움을 겪는 개념의 선행 개념 성적 확인
4. **Gap 감지**: 선행 개념도 낮은 점수면 gap으로 판단
5. **신뢰도 계산**: 데이터 양, 일관성, 심각도 고려

### 예시 결과

```json
{
  "gap": {
    "current_concept": "fractions_multiplication",
    "prerequisite_concept": "fractions_basic",
    "current_performance": 45.5,
    "prerequisite_performance": 38.2,
    "gap_severity": "high",
    "confidence": 0.85
  }
}
```

**해석:**
- 학생이 분수 곱셈에서 어려움 (45.5%)
- 기본 분수 개념도 부족 (38.2%)
- 심각도: 높음
- 신뢰도: 85% (데이터가 충분하고 일관됨)

## 개발 로드맵

### Phase 0: Setup (완료 ✅)
- Moodle 연동
- Gap 감지 알고리즘
- REST API
- 데이터베이스 스키마

### Phase 1: World Model (예정)
- 자연어 입력 처리
- 도메인 모델 추출
- 개념 관계 자동 파악

### Phase 2: Rule Engine (예정)
- 규칙 자동 추출
- 복잡도 분석
- 코드 자동 생성

### Phase 3-6 (예정)
- 데이터 관리
- UI 자동 생성
- 배포 자동화

자세한 일정은 [PRD 문서](tasks/0001-prd-ai-education-pipeline.md) 참조.

## API 엔드포인트

### Gap 조회

- `GET /api/gaps.php/student/{userId}` - 학생의 모든 gap
- `GET /api/gaps.php/student/{userId}/course/{courseId}` - 특정 코스의 gap
- `GET /api/gaps.php/course/{courseId}/statistics` - 코스 gap 통계

### 분석 실행

- `POST /api/gaps.php/analyze` - 특정 학생 분석
- `POST /api/sync.php` - Moodle 데이터 동기화

자세한 내용은 [Moodle 연동 가이드](docs/MOODLE_INTEGRATION.md#api-문서) 참조.

## 기여하기

이 프로젝트는 KAIST Touch Math Academy를 위해 개발되었습니다.

## 라이센스

[라이센스 정보를 여기에 추가]

## 문의

- **프로젝트**: KAIST Touch Math Academy
- **문서**: [docs/](docs/)
- **이슈**: GitHub Issues

---

**개발 상태:** 🚧 Active Development

현재 Moodle 연동 및 선행 개념 부족 감지 시스템이 구현되었습니다. 전체 AI 파이프라인은 향후 단계적으로 개발될 예정입니다.
