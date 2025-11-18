# Overconfidence Error Detection System

과신 오류 탐지 시스템 - Moodle LMS 연동 독립형 웹앱

## 시스템 개요

학생들이 문제를 지나치게 빠르게 풀어 부주의하게 답한 경우(과신 오류)를 자동으로 탐지하고 경고하는 시스템입니다.

## 기술 스택

- **PHP**: 7.1.9
- **MySQL**: 5.7
- **Moodle**: 3.7 (연동)
- **Frontend**: Bootstrap 4 + Chart.js

## 주요 기능

### 1. 과신 오류 탐지
- 통계 기반 자동 탐지 (Z-score 알고리즘)
- 문제별 평균 풀이 시간 대비 분석
- 난이도별 적응형 임계값
- 연속 패턴 감지

### 2. 교사 대시보드
- 위험 학생 목록 실시간 모니터링
- 문제별 과신 오류 통계
- 시간 분포 시각화
- 학생별 상세 리포트

### 3. 학생 피드백
- 개인별 과신 오류 경고
- 풀이 시간 비교 그래프
- 자기 성찰 유도 메시지

## 시스템 아키텍처

```
┌─────────────────┐
│  Moodle 3.7 LMS │ (읽기 전용)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Overconfidence Detection System     │
│                                      │
│  ┌──────────────┐  ┌──────────────┐│
│  │ Data Sync    │  │ Detection    ││
│  │ Service      │→ │ Engine       ││
│  └──────────────┘  └──────┬───────┘│
│                            │        │
│                            ▼        │
│  ┌──────────────┐  ┌──────────────┐│
│  │ MySQL DB     │  │ Web UI       ││
│  │ (Analysis)   │  │ - Dashboard  ││
│  └──────────────┘  │ - Student    ││
│                    └──────────────┘│
└─────────────────────────────────────┘
```

## 디렉토리 구조

```
/overconfidence-detector/
├── config/               # 설정 파일
│   ├── database.php     # MySQL 연결 설정
│   ├── moodle.php       # Moodle DB 연동 설정
│   └── app.php          # 앱 설정 (임계값 등)
├── src/
│   ├── models/          # 데이터 모델
│   │   ├── MoodleQuiz.php
│   │   ├── Attempt.php
│   │   └── OverconfidenceFlag.php
│   ├── services/        # 비즈니스 로직
│   │   ├── MoodleSync.php
│   │   ├── DetectionEngine.php
│   │   └── StatisticsCalculator.php
│   ├── controllers/     # 컨트롤러
│   │   ├── DashboardController.php
│   │   ├── StudentController.php
│   │   └── ApiController.php
│   └── utils/           # 유틸리티
│       ├── Database.php
│       └── Logger.php
├── public/              # 웹 루트
│   ├── index.php
│   ├── dashboard.php    # 교사 대시보드
│   ├── student.php      # 학생 페이지
│   ├── api/             # REST API
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── dashboard.js
│       └── charts.js
├── sql/
│   ├── schema.sql       # DB 스키마
│   └── seed.sql         # 테스트 데이터
├── cron/
│   └── sync.php         # 주기적 동기화
├── tests/               # 테스트
└── vendor/              # Composer 의존성
```

## 설치 방법

### 1. 요구사항
- PHP 7.1.9 이상
- MySQL 5.7
- Moodle 3.7 (데이터베이스 접근 권한)
- Apache/Nginx 웹서버

### 2. 데이터베이스 생성
```bash
mysql -u root -p < sql/schema.sql
```

### 3. 설정 파일 구성
```bash
cp config/database.example.php config/database.php
cp config/moodle.example.php config/moodle.php
# 각 파일의 DB 연결 정보 수정
```

### 4. Composer 의존성 설치
```bash
composer install
```

### 5. 웹서버 설정
Document Root를 `public/` 디렉토리로 설정

### 6. Cron 작업 등록 (선택)
```bash
# 10분마다 Moodle 데이터 동기화
*/10 * * * * php /path/to/cron/sync.php
```

## 과신 오류 탐지 알고리즘

### Z-Score 기반 탐지

```
Z-score = (학생의 풀이 시간 - 문제 평균 시간) / 표준편차

if Z-score < -2.0:
    위험 구간 (과신 오류 의심)
```

### 다단계 플래깅

1. **Level 1 (주의)**: -2.0 ≤ Z-score < -1.5
2. **Level 2 (경고)**: -2.5 ≤ Z-score < -2.0
3. **Level 3 (위험)**: Z-score < -2.5

### 적응형 임계값

- 문제 난이도 고려
- 학생의 평균 실력 고려
- 최소 샘플 수 확보 후 적용 (N ≥ 30)

## 사용 방법

### 교사
1. `/dashboard.php` 접속
2. 과목/퀴즈 선택
3. 위험 학생 목록 확인
4. 상세 분석 리포트 다운로드

### 학생
1. `/student.php?userid=123` 접속
2. 본인의 과신 오류 이력 확인
3. 풀이 시간 분석 그래프 확인

## API 엔드포인트

- `GET /api/flags` - 과신 오류 목록
- `GET /api/student/{id}/attempts` - 학생별 시도 이력
- `GET /api/quiz/{id}/statistics` - 퀴즈 통계
- `POST /api/sync` - 수동 동기화 트리거

## 보안 고려사항

- Moodle DB 읽기 전용 계정 사용
- SQL Injection 방지 (Prepared Statements)
- XSS 방지 (htmlspecialchars)
- CSRF 토큰 사용
- 교사/학생 권한 분리

## 라이선스

MIT License

## 개발자

KAIST Touch Math Academy - AI Education System Team
