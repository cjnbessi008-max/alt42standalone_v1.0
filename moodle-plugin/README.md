# Concept Detection Plugin for Moodle 3.7

## 개요 (Overview)

**한국어**: Moodle 3.7 LMS와 연동하여 학생들이 실제로 이해하지 못하고 넘어간 개념을 자동으로 감지하는 플러그인입니다. 학생의 행동 패턴, 시도 횟수, 소요 시간, 성적 등을 분석하여 각 개념에 대한 이해도를 평가합니다.

**English**: A Moodle plugin that automatically detects concepts that students didn't fully understand by analyzing their behavior patterns, attempt counts, time spent, and scores in the Moodle 3.7 LMS.

## 주요 기능 (Key Features)

### 1. 자동 개념 감지 (Automatic Concept Detection)
- 코스 콘텐츠(퀴즈, 과제, 섹션)에서 자동으로 개념 추출
- 키워드 기반 개념 매칭
- 난이도 자동 평가

### 2. 학생 행동 분석 (Student Behavior Analysis)
- 시도 횟수 추적
- 소요 시간 분석
- 점수 패턴 분석
- 다음 행동 패턴 감지:
  - 빠른 종료 (Quick exits)
  - 반복적 실패 (Repeated failures)
  - 점수 하락 추세 (Score decline)
  - 과도한 시도 (Excessive attempts)
  - 최소 시간 투자 (Minimal time investment)

### 3. 교사용 대시보드 (Teacher Dashboard)
- 코스별 개념 현황
- 학생별 이해도 통계
- 어려움을 겪는 학생 목록
- 개념별 상세 분석
- 교육적 권장사항 제공

### 4. 실시간 추적 (Real-time Tracking)
- 학생 활동 실시간 로깅
- 이벤트 기반 분석
- 신뢰도 점수 자동 계산

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Database**: InnoDB 엔진 지원

## 설치 방법 (Installation)

### 1. 플러그인 다운로드 및 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/moodle-plugin/local/conceptdetection ./local/
```

### 2. 파일 권한 설정

```bash
# 웹 서버 사용자에게 적절한 권한 부여 (예: www-data)
chown -R www-data:www-data ./local/conceptdetection
chmod -R 755 ./local/conceptdetection
```

### 3. Moodle 관리자 페이지에서 설치

1. 웹 브라우저에서 Moodle에 관리자로 로그인
2. 자동으로 플러그인 설치 알림이 표시됨
3. "Upgrade Moodle database now" 버튼 클릭
4. 설치 완료 확인

### 4. 수동 데이터베이스 설치 (선택사항)

자동 설치가 실패할 경우:

```bash
# Moodle CLI를 사용한 업그레이드
php admin/cli/upgrade.php --non-interactive
```

## 설정 (Configuration)

### 1. 기본 설정

관리자 메뉴: **Site administration → Plugins → Local plugins → Concept Detection**

설정 항목:
- **Time threshold (초)**: 개념 학습으로 간주할 최소 시간 (기본값: 60초)
- **Attempts threshold**: 이해 못함으로 표시할 최대 시도 횟수 (기본값: 3회)
- **Score threshold (%)**: 이해함으로 간주할 최소 점수 (기본값: 60%)
- **Enable tracking**: 행동 추적 활성화/비활성화 (기본값: 활성화)

### 2. 권한 설정

필요한 권한:
- `local/conceptdetection:view` - 대시보드 보기
- `local/conceptdetection:viewreports` - 코스 내 리포트 보기
- `local/conceptdetection:manage` - 설정 관리

기본적으로 다음 역할에 권한 부여:
- Teacher: view, viewreports
- Editing Teacher: view, viewreports
- Manager: view, viewreports, manage

## 사용 방법 (Usage)

### 교사 (Teachers)

#### 1. 대시보드 접속

```
사이트 홈 → Concept Detection Dashboard
또는 직접 URL: https://your-moodle-site/local/conceptdetection/
```

#### 2. 코스 선택

드롭다운 메뉴에서 분석하고자 하는 코스를 선택합니다.

#### 3. 개념 자동 감지

첫 방문 시 시스템이 자동으로 코스의 개념을 감지합니다:
- 퀴즈 질문 카테고리
- 과제 이름 및 설명
- 코스 섹션

#### 4. 학생 분석 실행

"Analyze Students Now" 버튼을 클릭하여 현재 등록된 모든 학생을 분석합니다.

#### 5. 결과 확인

대시보드에서 다음 정보를 확인:
- 전체 개념 수
- 전체 학생 수
- 어려움을 겪는 학생 수
- 개념별 상세 통계

#### 6. 개념별 상세 분석

"View Details" 링크를 클릭하여:
- 해당 개념을 이해하지 못한 학생 목록
- 각 학생의 시도 횟수, 소요 시간, 점수
- 신뢰도 점수 (0-100%)
- 교육적 권장사항

### 관리자 (Administrators)

#### 임계값 조정

기본 임계값이 코스에 맞지 않을 경우:

1. **Site administration → Plugins → Local plugins → Concept Detection**
2. 임계값 조정
3. "Save changes"
4. 재분석 필요

#### 수동 개념 추가

데이터베이스에 직접 개념을 추가할 수 있습니다:

```sql
INSERT INTO mdl_local_conceptdetection_concepts
(name, description, courseid, moduletype, moduleid, difficulty, keywords, timecreated, timemodified)
VALUES
('분수의 덧셈', '같은 분모를 가진 분수의 덧셈', 2, 'quiz', 5, 3, '["분수", "덧셈", "분모"]', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

## 작동 원리 (How It Works)

### 1. 데이터 수집

플러그인은 다음 Moodle 데이터를 수집합니다:
- 퀴즈 시도 (`quiz_attempts`)
- 과제 제출 (`assign_submission`)
- 질문 시도 (`question_attempts`)
- 활동 로그 (`logstore_standard_log`)

### 2. 행동 패턴 분석

각 학생의 활동을 분석하여 다음 메트릭 계산:
- **시도 횟수**: 개념 관련 활동 시도 횟수
- **소요 시간**: 개념 학습에 소비한 총 시간
- **평균 점수**: 관련 활동의 평균 점수
- **최고 점수**: 관련 활동의 최고 점수

### 3. 패턴 감지

다음 패턴을 자동 감지:
- **빠른 종료**: 활동에 매우 짧은 시간만 소비
- **반복적 실패**: 여러 시도에도 낮은 점수
- **점수 하락**: 시간이 지나면서 점수 감소
- **과도한 시도**: 임계값을 초과하는 시도 횟수
- **최소 시간**: 예상 시간보다 훨씬 적은 시간 소비

### 4. 이해도 판정

다음 가중치 기반으로 신뢰도 점수 계산:
- **점수**: 40% 가중치
- **시도 횟수**: 20% 가중치
- **소요 시간**: 20% 가중치
- **행동 패턴**: 20% 가중치

신뢰도 점수에 따른 상태:
- **70-100%**: 이해함 (Understood)
- **40-69%**: 부분적 이해 (Partially Understood)
- **0-39%**: 이해 못함 (Not Understood)

## 데이터베이스 스키마 (Database Schema)

### 주요 테이블

#### 1. `mdl_local_conceptdetection_concepts`
개념 정의를 저장합니다.

```sql
CREATE TABLE mdl_local_conceptdetection_concepts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    courseid BIGINT NOT NULL,
    moduletype VARCHAR(50),
    moduleid BIGINT,
    parentid BIGINT,
    keywords TEXT,
    difficulty INT(2) DEFAULT 3,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL
);
```

#### 2. `mdl_local_conceptdetection_tracking`
학생별 개념 이해도 추적 데이터를 저장합니다.

```sql
CREATE TABLE mdl_local_conceptdetection_tracking (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userid BIGINT NOT NULL,
    conceptid BIGINT NOT NULL,
    attempts INT(5) DEFAULT 0,
    timespent BIGINT DEFAULT 0,
    score DECIMAL(10,2),
    maxscore DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'not_started',
    confidence DECIMAL(5,2),
    flags TEXT,
    timecreated BIGINT NOT NULL,
    timemodified BIGINT NOT NULL,
    UNIQUE KEY (userid, conceptid)
);
```

#### 3. `mdl_local_conceptdetection_events`
상세 이벤트 로그를 저장합니다.

```sql
CREATE TABLE mdl_local_conceptdetection_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    userid BIGINT NOT NULL,
    conceptid BIGINT,
    eventtype VARCHAR(50) NOT NULL,
    contextid BIGINT,
    moduletype VARCHAR(50),
    moduleid BIGINT,
    eventdata TEXT,
    duration BIGINT,
    result VARCHAR(20),
    timecreated BIGINT NOT NULL
);
```

#### 4. `mdl_local_conceptdetection_analysis`
분석 결과 및 권장사항을 저장합니다.

## API 사용 (API Usage)

### PHP 코드에서 사용

```php
// 개념 자동 감지
use local_conceptdetection\analytics\concept_detector;

$courseid = 2;
$concepts = concept_detector::auto_detect_concepts($courseid);

// 학생 분석
use local_conceptdetection\analytics\behavior_analyzer;

$analyzer = new behavior_analyzer();
$result = $analyzer->analyze_concept_understanding($userid, $conceptid);

// 어려움을 겪는 학생 조회
$struggling = concept_detector::get_struggling_students($conceptid);

// 코스 리포트 생성
$report = concept_detector::generate_course_report($courseid);
```

## 문제 해결 (Troubleshooting)

### 개념이 자동 감지되지 않음

**원인**: 코스에 퀴즈나 과제가 없거나, 질문 카테고리가 설정되지 않음

**해결책**:
1. 퀴즈에 질문 카테고리 설정
2. 코스 섹션에 명확한 이름 부여
3. 수동으로 개념 추가

### 분석 결과가 부정확함

**원인**: 임계값이 코스 특성에 맞지 않음

**해결책**:
1. 플러그인 설정에서 임계값 조정
2. 학생들의 실제 학습 패턴 관찰
3. 임계값을 단계적으로 조정하며 테스트

### 성능 이슈

**원인**: 대량의 로그 데이터 처리

**해결책**:
1. 로그 테이블 인덱스 확인
2. 분석 주기 조정 (실시간 대신 예약된 작업)
3. 오래된 이벤트 로그 아카이빙

### 권한 오류

**원인**: 사용자에게 필요한 권한이 없음

**해결책**:
```
Site administration → Users → Permissions → Define roles
해당 역할에 local/conceptdetection 권한 부여
```

## 개발 및 커스터마이징 (Development)

### 분석 알고리즘 수정

`classes/analytics/behavior_analyzer.php`에서 분석 로직 수정:

```php
private function determine_status($tracking, $patterns) {
    // 가중치 조정
    $score_factor = 0;
    $attempts_factor = 0;
    $time_factor = 0;
    $pattern_factor = 20;

    // 커스텀 로직 추가
    // ...

    return array(
        'status' => $status,
        'confidence' => $confidence,
        'flags' => $flags
    );
}
```

### 새로운 패턴 추가

```php
private function detect_patterns($activities, $concept) {
    $patterns = array(
        'quick_exits' => 0,
        'repeated_failures' => 0,
        // 새로운 패턴 추가
        'help_requests' => 0,
        'peer_interaction' => 0
    );

    // 패턴 감지 로직 구현
    // ...

    return $patterns;
}
```

### UI 커스터마이징

`styles.css` 파일 수정하여 대시보드 디자인 변경 가능

## 라이선스 (License)

GNU GPL v3 or later

## 지원 (Support)

문제 발생 시:
1. Moodle 로그 확인: `Site administration → Reports → Logs`
2. PHP 오류 로그 확인
3. 데이터베이스 쿼리 로그 확인

## 기여 (Contributing)

버그 리포트 및 기능 제안을 환영합니다.

## 버전 히스토리 (Version History)

### v1.0.0 (2025-11-18)
- 초기 릴리스
- 자동 개념 감지
- 행동 패턴 분석
- 교사용 대시보드
- 다국어 지원 (한국어, 영어)

## 제작자 (Credits)

**KAIST Touch Math Academy**
- Copyright 2025
- 연구 및 교육 목적으로 개발됨
