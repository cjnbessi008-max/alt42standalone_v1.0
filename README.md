# AI Education System with Confidence Scoring

KAIST Touch Math Academy의 AI 기반 교육 시스템과 Moodle LMS 통합 자신감 점수 플러그인

## 프로젝트 구조

```
alt42standalone_v1.0/
├── docs/                           # 문서
│   └── confidence-scoring-spec.md  # 자신감 점수 시스템 상세 사양서
├── moodle-plugin/                  # Moodle 플러그인
│   └── local/
│       └── confidence/             # 자신감 점수 플러그인
│           ├── version.php         # 플러그인 버전 정보
│           ├── db/                 # 데이터베이스 정의
│           │   ├── install.xml     # DB 스키마
│           │   └── access.php      # 권한 정의
│           ├── lang/               # 언어 파일
│           │   ├── ko/            # 한국어
│           │   └── en/            # 영어
│           ├── classes/           # 핵심 PHP 클래스
│           │   ├── concept_manager.php   # 개념 관리
│           │   ├── score_manager.php     # 점수 관리
│           │   └── analytics.php         # 통계 분석
│           ├── student/           # 학생 인터페이스
│           │   ├── index.php     # 자신감 점수 입력 페이지
│           │   └── submit.php    # AJAX 제출 핸들러
│           └── teacher/           # 교사 인터페이스
│               └── dashboard.php  # 대시보드
└── tasks/                         # 프로젝트 태스크
    └── 0001-prd-ai-education-pipeline.md
```

## 주요 기능

### 1. 학생 자신감 점수 입력 시스템

- **개념별 자신감 평가**: 학생들이 각 학습 개념에 대해 1-5점 척도로 자신감을 평가
- **별점 인터페이스**: 직관적인 별점 UI로 쉬운 입력
- **코멘트 기능**: 선택적으로 자신감 수준에 대한 설명 추가
- **이력 추적**: 자신감 점수 변화 이력 자동 저장

### 2. 교사 모니터링 대시보드

- **전체 통계**: 평균 자신감, 참여율, 위험 학생 수
- **개념별 분석**: 각 개념의 평균 점수 및 분포
- **위험 학생 식별**: 낮은 자신감 점수를 가진 학생 자동 감지
- **데이터 내보내기**: CSV/Excel 형식으로 데이터 추출

### 3. 분석 및 리포트

- **점수 분포**: 개념별 1-5점 분포 시각화
- **추세 분석**: 시간에 따른 자신감 변화 추적
- **학생별 리포트**: 개별 학생의 자신감 프로필

## 기술 스택

- **LMS**: Moodle 3.7
- **Database**: MySQL 5.7
- **Backend**: PHP 7.1.9
- **Frontend**: JavaScript/jQuery, Bootstrap 4

## 설치 방법

### 사전 요구사항

- Moodle 3.7 이상
- PHP 7.1.9 이상
- MySQL 5.7 이상
- 웹서버 (Apache 또는 Nginx)

### 플러그인 설치

#### 방법 1: 수동 설치

```bash
# 1. Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 2. 플러그인 파일 복사
cp -r /path/to/alt42standalone_v1.0/moodle-plugin/local/confidence local/confidence

# 3. 파일 권한 설정
chown -R www-data:www-data local/confidence
chmod -R 755 local/confidence

# 4. Moodle 관리자 페이지에서 플러그인 설치
# Site administration > Notifications 접속
# "Upgrade Moodle database now" 클릭
```

#### 방법 2: CLI를 통한 설치

```bash
# 플러그인 복사 후
php admin/cli/upgrade.php
```

### 데이터베이스 설정

플러그인 설치 과정에서 다음 테이블이 자동으로 생성됩니다:

- `mdl_local_confidence_concepts` - 학습 개념 정의
- `mdl_local_confidence_scores` - 학생 자신감 점수
- `mdl_local_confidence_history` - 점수 변화 이력
- `mdl_local_confidence_alerts` - 알림 설정

### 초기 설정

1. **코스에서 활성화**
   - 코스 관리 > 참가자 > 권한 확인
   - `local/confidence:submitconfidence` 권한이 학생에게 부여되어 있는지 확인

2. **개념 추가**
   - 교사로 로그인
   - 코스 페이지에서 "Manage Concepts" 메뉴 접속
   - 학습 개념 추가 (예: "분수의 개념", "분수의 덧셈")

3. **학생 접근 테스트**
   - 학생 계정으로 로그인
   - 코스 페이지에서 "My Learning Confidence" 접속
   - 자신감 점수 입력 테스트

## 사용 방법

### 학생용

1. **자신감 점수 입력**
   - 코스 페이지 > "My Learning Confidence" 클릭
   - 각 개념의 별점을 클릭하여 1-5점 선택
   - 선택적으로 코멘트 입력
   - "저장" 버튼 클릭

2. **이력 확인**
   - 이전에 입력한 점수 확인
   - 점수 업데이트 가능

### 교사용

1. **대시보드 접근**
   - 코스 페이지 > "Confidence Dashboard" 클릭

2. **학급 모니터링**
   - 평균 자신감 점수 확인
   - 개념별 점수 분포 확인
   - 도움이 필요한 학생 식별

3. **개념 관리**
   - "Manage Concepts" 클릭
   - 새 개념 추가, 수정, 삭제

4. **데이터 내보내기**
   - "Export Data" 클릭
   - CSV 또는 Excel 형식으로 다운로드

## API 엔드포인트

### 학생 API

```
GET  /local/confidence/student/index.php?courseid={id}
     - 학생의 모든 개념과 점수 조회

POST /local/confidence/student/submit.php
     - 자신감 점수 제출
     Parameters: courseid, conceptid, score, comment
```

### 교사 API

```
GET  /local/confidence/teacher/dashboard.php?courseid={id}
     - 코스 전체 대시보드

GET  /local/confidence/teacher/reports.php?courseid={id}&conceptid={id}
     - 특정 개념의 상세 리포트
```

## 권한 (Capabilities)

- `local/confidence:submitconfidence` - 자신감 점수 제출 (학생)
- `local/confidence:view` - 자신의 점수 조회 (학생, 교사)
- `local/confidence:viewreports` - 전체 리포트 조회 (교사)
- `local/confidence:manageconcepts` - 개념 관리 (교사)
- `local/confidence:managealerts` - 알림 설정 관리 (교사)

## 보안 고려사항

### 입력 검증

- 점수 범위: 1-5 사이로 제한
- 코멘트 길이: 최대 500자
- SQL Injection 방지: Moodle DMLAPI 사용
- XSS 방지: 모든 출력 이스케이프 처리

### 접근 제어

- 학생은 자신의 점수만 입력/조회 가능
- 교사는 자신이 가르치는 코스의 데이터만 조회 가능
- 권한 기반 접근 제어 (RBAC)

### 데이터 보호

- 세션 키 검증 (sesskey)
- HTTPS 사용 권장
- 데이터베이스 백업 권장

## 성능 최적화

### 데이터베이스

- 인덱스 최적화:
  - `userid`, `conceptid`, `courseid`에 인덱스
  - 복합 인덱스: `(userid, conceptid)`
  - 시계열 분석용: `timecreated`, `timemodified`

### 쿼리 최적화

- JOIN 활용하여 N+1 쿼리 방지
- 통계 쿼리 캐싱
- 페이지네이션 적용 (대량 데이터)

## 문제 해결

### 일반적인 문제

**Q: 점수가 저장되지 않습니다**
- 권한 확인: `local/confidence:submitconfidence` 권한이 있는지 확인
- JavaScript 콘솔에서 에러 확인
- 데이터베이스 연결 확인

**Q: 대시보드가 느립니다**
- 데이터베이스 인덱스 확인
- 캐시 활성화 확인
- PHP 메모리 제한 확인

**Q: 개념이 표시되지 않습니다**
- 교사가 해당 코스에 개념을 추가했는지 확인
- 데이터베이스에 개념이 존재하는지 확인

### 디버깅

```bash
# Moodle 디버그 모드 활성화
# Site administration > Development > Debugging
# Debug messages: DEVELOPER
# Display debug messages: Yes

# 로그 확인
tail -f /var/log/apache2/error.log
tail -f /path/to/moodle/moodledata/error.log
```

## 백업 및 복구

### 데이터 백업

```bash
# 데이터베이스 백업
mysqldump -u username -p database_name \
    mdl_local_confidence_concepts \
    mdl_local_confidence_scores \
    mdl_local_confidence_history \
    mdl_local_confidence_alerts \
    > confidence_backup_$(date +%Y%m%d).sql

# 복구
mysql -u username -p database_name < confidence_backup_YYYYMMDD.sql
```

### 플러그인 업그레이드

```bash
# 1. 기존 플러그인 백업
cp -r local/confidence local/confidence.backup

# 2. 새 버전 설치
cp -r new_version/confidence local/

# 3. Moodle 업그레이드 실행
php admin/cli/upgrade.php
```

## 향후 개선 계획

### Phase 2 기능

1. **AI 기반 개인화 피드백**
   - 자신감 패턴 분석
   - 맞춤형 학습 자료 추천

2. **시각화 개선**
   - Chart.js를 활용한 그래프
   - 시계열 추세 차트
   - 히트맵 시각화

3. **모바일 앱 통합**
   - Moodle Mobile 앱 지원
   - 푸시 알림

4. **고급 분석**
   - 예측 분석 (자신감 변화 예측)
   - 상관관계 분석 (성적 vs 자신감)

5. **게이미피케이션**
   - 자신감 향상 배지
   - 학습 마일스톤

## 라이선스

GNU General Public License v3.0

## 개발팀

**KAIST Touch Math Academy**
- 개발: AI Education System Team
- 버전: 1.0.0
- 날짜: 2025-11-18

## 문의

- 기술 지원: [support@example.com]
- 버그 리포트: GitHub Issues
- 문서: `/docs/confidence-scoring-spec.md`

## 변경 이력

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 학생 자신감 점수 입력 기능
- 교사 대시보드
- 기본 통계 및 분석
- 한국어/영어 지원

---

**참고**: 자세한 기술 사양은 `docs/confidence-scoring-spec.md`를 참조하세요.
