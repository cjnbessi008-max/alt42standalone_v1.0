# ALT42 Standalone - Filter Shrink LMS

Moodle 3.7과 연동되는 Filter Shrink 교육 시스템

## 시스템 개요

- **Backend**: PHP 7.1.9
- **Database**: MySQL 5.7
- **Frontend**: React 18+ (가상 스마트폰 UI)
- **LMS**: Moodle 3.7 연동

## Filter Shrink 개념

조건이 순차적으로 적용되면서 문제/경우의 수가 점진적으로 줄어드는 필터링 시스템

### 예시 흐름:
1. **전체 문제** (1000개)
2. → **학년 필터** (3학년) → 300개
3. → **과목 필터** (수학) → 100개
4. → **난이도 필터** (중급) → 30개
5. → **유형 필터** (분수) → 10개
6. → **최종 문제 선택** → 1개

## 프로젝트 구조

```
.
├── backend/              # PHP 백엔드
│   ├── api/             # REST API endpoints
│   ├── config/          # 설정 파일
│   ├── core/            # 핵심 로직
│   │   ├── FilterShrink/  # Filter Shrink 엔진
│   │   └── Moodle/        # Moodle 연동
│   ├── models/          # 데이터베이스 모델
│   └── utils/           # 유틸리티
├── frontend/            # React 프론트엔드
│   ├── public/
│   └── src/
│       ├── components/  # UI 컴포넌트
│       ├── services/    # API 서비스
│       └── store/       # 상태 관리
├── database/            # 데이터베이스
│   ├── migrations/      # 마이그레이션
│   └── seeds/           # 시드 데이터
└── docker/              # Docker 설정
```

## 빠른 시작

### 1. Docker로 실행

```bash
cd docker
docker-compose up -d
```

### 2. 데이터베이스 마이그레이션

```bash
docker exec -it alt42-php php database/migrations/run.php
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

## API 엔드포인트

### Filter Shrink API

- `GET /api/filters/available` - 사용 가능한 필터 목록
- `POST /api/filters/apply` - 필터 적용
- `GET /api/problems/filtered` - 필터링된 문제 조회

### Moodle 연동 API

- `GET /api/moodle/courses` - 코스 목록
- `GET /api/moodle/questions` - 문제 목록
- `POST /api/moodle/sync` - 동기화

## 기술 스택 상세

### Backend (PHP 7.1.9)
- PDO for MySQL connection
- REST API with JSON responses
- Moodle Web Services integration

### Frontend (React)
- React 18+
- Axios for API calls
- CSS Modules for styling
- Mobile-first responsive design

### Database (MySQL 5.7)
- Normalized schema (3NF)
- Indexes for performance
- Foreign key constraints

## 개발 가이드

### Filter Shrink 구현 원칙

1. **순차적 필터링**: 각 필터는 이전 결과를 기반으로 적용
2. **실시간 카운트**: 각 단계에서 남은 항목 수 표시
3. **되돌리기 가능**: 사용자가 이전 단계로 돌아갈 수 있음
4. **성능 최적화**: 인덱스 활용 및 캐싱

## 라이선스

MIT License
