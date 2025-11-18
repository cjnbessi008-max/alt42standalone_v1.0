# Jump Reasoning Detection - 구현 요약

## 📋 프로젝트 개요

**프로젝트명**: Moodle Jump Reasoning Detection Plugin
**버전**: 1.0-beta
**개발 기간**: 2025-11-18
**개발팀**: KAIST Touch Math Academy
**기술 스택**: PHP 7.1.9, MySQL 5.7, Moodle 3.7

---

## 🎯 구현 목표

Moodle 3.7 LMS와 연동하여 학습자의 **점프 추론(중간 건너뛰기) 습관**을 자동으로 감지하는 플러그인 개발

---

## ✅ 완료된 기능

### 1. 핵심 감지 알고리즘 (4가지)

#### ✓ 순차적 건너뛰기 감지 (Sequential Jump Detection)
- **파일**: `classes/detector.php::detect_sequential_jump()`
- **알고리즘**:
  - 코스의 정상 모듈 순서 추출
  - 사용자의 실제 학습 순서 비교
  - 건너뛴 모듈 개수 계산
  - 점프 점수 = 건너뛴 모듈 수 × 2
- **테스트 시나리오**: Module 1 → Module 4 (2, 3 건너뜀)

#### ✓ 선수 학습 누락 감지 (Prerequisite Skip Detection)
- **파일**: `classes/detector.php::detect_prerequisite_skip()`
- **알고리즘**:
  - Moodle의 availability 조건 파싱
  - 선수 과정 완료 여부 확인
  - 점프 점수 = 누락된 선수 과정 수 × 3
- **통합**: Moodle Activity Completion API

#### ✓ 시간 비정상 패턴 감지 (Time Anomaly Detection)
- **파일**: `classes/detector.php::check_time_anomaly()`
- **알고리즘**:
  - Z-Score 통계 분석 적용
  - 모듈별 평균 학습 시간 계산
  - 표준편차 기반 이상 탐지
  - Z-Score < -2.0 시 점프 감지
- **공식**: `Z = (실제시간 - 평균시간) / 표준편차`

#### ✓ 퀴즈/과제 회피 감지 (Assessment Evasion Detection)
- **파일**: `classes/detector.php::detect_assessment_evasion()`
- **알고리즘**:
  - 이전 활동이 퀴즈/과제인지 확인
  - 완료 여부 검증
  - 점프 점수 = 2.5점

### 2. 데이터베이스 스키마

#### ✓ 4개 테이블 설계 및 구현

| 테이블 | 레코드 타입 | 주요 필드 |
|--------|------------|----------|
| `mdl_jumpdetect_tracking` | 학습 활동 추적 | userid, courseid, moduleid, eventname, timecreated |
| `mdl_jumpdetect_patterns` | 감지된 패턴 | userid, jump_type, jump_score, severity |
| `mdl_jumpdetect_alerts` | 교사 알림 | teacherid, message, is_read |
| `mdl_jumpdetect_course_paths` | 코스 경로 설정 | courseid, module_sequence, prerequisites |

**인덱스 최적화**:
- `idx_user_course` on (userid, courseid)
- `idx_timecreated` on (timecreated)
- `idx_teacher_read` on (teacherid, is_read)

### 3. Moodle 이벤트 통합

#### ✓ 6개 이벤트 옵저버 구현

**파일**: `db/events.php`, `classes/observer.php`

| 이벤트 | 콜백 함수 | 목적 |
|--------|----------|------|
| `course_module_viewed` | `module_viewed()` | 모듈 조회 추적 및 점프 감지 |
| `course_module_completion_updated` | `module_completed()` | 완료 이벤트 기록 |
| `quiz\attempt_started` | `quiz_attempted()` | 퀴즈 시작 추적 |
| `quiz\attempt_submitted` | `quiz_submitted()` | 시간 이상 패턴 감지 |
| `user_enrolment_created` | `user_enrolled()` | 코스 등록 기록 |
| `assign\submission_status_viewed` | `assignment_viewed()` | 과제 조회 추적 |

### 4. 교사 대시보드

#### ✓ 종합 분석 인터페이스

**파일**: `index.php`, `styles.css`

**구성 요소**:
1. **통계 요약 카드** (4개)
   - 🔴 위험 (21점 이상)
   - 🟠 경고 (11-20점)
   - 🟡 주의 (6-10점)
   - 🟢 정상 (0-5점)

2. **최근 알림 목록**
   - 실시간 알림 스트림
   - 미읽음/읽음 상태 구분
   - 시간 표시 (예: "5분 전")

3. **학생별 점프 점수 테이블**
   - 상위 20명 랭킹
   - 진행률 바 시각화
   - 점프 횟수 및 심각도

4. **점프 유형별 통계**
   - 각 유형별 발생 건수
   - 가로 막대 차트

### 5. 다국어 지원

#### ✓ 영어/한국어 언어 파일

**파일**:
- `lang/en/local_jumpdetect.php`
- `lang/ko/local_jumpdetect.php`

**번역된 항목**: 30개 이상의 문자열

### 6. 권한 시스템

#### ✓ 2개 권한 정의

**파일**: `db/access.php`

| 권한 | 역할 | 설명 |
|------|------|------|
| `local/jumpdetect:view` | Teacher, Editing Teacher | 대시보드 보기 |
| `local/jumpdetect:configure` | Editing Teacher, Manager | 설정 변경 |

---

## 📁 파일 구조

```
moodle-plugin/local/jumpdetect/
├── version.php                    # 플러그인 메타데이터
├── README.md                      # 사용자 문서
├── index.php                      # 대시보드 메인 페이지
├── styles.css                     # 대시보드 스타일
│
├── db/
│   ├── install.xml               # 데이터베이스 스키마 (XMLDB)
│   ├── events.php                # 이벤트 옵저버 등록
│   └── access.php                # 권한 정의
│
├── classes/
│   ├── observer.php              # 이벤트 처리 클래스
│   └── detector.php              # 점프 감지 알고리즘
│
└── lang/
    ├── en/
    │   └── local_jumpdetect.php  # 영어 언어 파일
    └── ko/
        └── local_jumpdetect.php  # 한국어 언어 파일

docs/
├── jump-reasoning-detection-design.md    # 설계 문서
├── INSTALLATION-GUIDE.md                  # 설치 가이드
└── IMPLEMENTATION-SUMMARY.md              # 구현 요약 (이 문서)
```

**총 라인 수**: 약 2,500+ 줄

---

## 🔬 알고리즘 상세

### 점프 점수 계산 공식

```
Total Jump Score = Σ (개별 점프 점수)

개별 점프 점수:
- 순차적 건너뛰기: 건너뛴 모듈 수 × 2
- 선수 학습 누락: 누락된 선수 과정 수 × 3
- 시간 이상 패턴: |Z-Score| × 1.5
- 평가 회피: 2.5점 (고정)
```

### 심각도 분류

```php
function calculate_severity($jump_score) {
    if ($jump_score >= 21) return 'critical';      // 🔴 위험
    if ($jump_score >= 11) return 'warning';       // 🟠 경고
    if ($jump_score >= 6)  return 'caution';       // 🟡 주의
    return 'normal';                                // 🟢 정상
}
```

### Z-Score 시간 이상 탐지

```php
// 평균과 표준편차 계산
$avg_time = AVG(timemodified - timecreated)
$stddev = STDDEV(timemodified - timecreated)

// Z-Score 계산
$z_score = ($time_spent - $avg_time) / $stddev

// 이상 판단 (너무 빠른 경우)
if ($z_score < -2.0) {
    // 점프 감지!
}
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 순차적 건너뛰기

**전제 조건**:
- 코스에 Module 1, 2, 3, 4가 순서대로 존재

**테스트 단계**:
1. 학생 로그인
2. Module 1 조회 및 완료
3. Module 2, 3 건너뛰기
4. Module 4 조회

**예상 결과**:
- `jumpdetect_patterns` 테이블에 레코드 생성
- `jump_type`: "sequential"
- `jump_score`: 4.0 (2개 × 2)
- `severity`: "normal" (4점 < 6점)
- 교사 대시보드에 알림 표시

### 시나리오 2: 선수 학습 누락

**전제 조건**:
- Module 2의 선수 조건: Module 1 완료 필수

**테스트 단계**:
1. 학생 로그인
2. Module 1 건너뛰기
3. Module 2 직접 접근

**예상 결과**:
- Moodle 접근 제한 메시지 (정상 작동 시)
- 또는 점프 감지 (접근이 허용된 경우)
- `jump_type`: "prerequisite"
- `jump_score`: 3.0 (1개 × 3)

### 시나리오 3: 시간 이상 패턴

**전제 조건**:
- Module 1의 평균 학습 시간: 30분
- 표준편차: 10분

**테스트 단계**:
1. 학생 로그인
2. Module 1 접근
3. 10초 후 바로 완료

**예상 결과**:
- Z-Score 계산: (10 - 1800) / 600 ≈ -2.98
- 이상 감지! (Z < -2.0)
- `jump_type`: "time_anomaly"
- `jump_score`: 4.47 (|-2.98| × 1.5)

---

## 🔧 핵심 기술 구현

### 1. Moodle Events API 활용

```php
// events.php
$observers = [
    [
        'eventname' => '\core\event\course_module_viewed',
        'callback' => 'local_jumpdetect_observer::module_viewed',
    ],
];

// observer.php
public static function module_viewed(\core\event\course_module_viewed $event) {
    $data = $event->get_data();
    // 이벤트 처리 로직
}
```

### 2. XMLDB를 사용한 데이터베이스 스키마

```xml
<TABLE NAME="jumpdetect_tracking">
  <FIELDS>
    <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
    <FIELD NAME="userid" TYPE="int" LENGTH="10" NOTNULL="true"/>
    ...
  </FIELDS>
  <KEYS>
    <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
    <KEY NAME="userid" TYPE="foreign" FIELDS="userid" REFTABLE="user" REFFIELDS="id"/>
  </KEYS>
  <INDEXES>
    <INDEX NAME="idx_user_course" UNIQUE="false" FIELDS="userid, courseid"/>
  </INDEXES>
</TABLE>
```

### 3. 반응형 CSS 그리드 레이아웃

```css
.stats-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

@media (max-width: 768px) {
    .stats-summary {
        grid-template-columns: 1fr 1fr;
    }
}
```

---

## 📊 성능 최적화

### 1. 데이터베이스 인덱스

- `(userid, courseid)`: 학생별 코스 조회 최적화
- `(timecreated)`: 시간 범위 쿼리 최적화
- `(teacherid, is_read)`: 알림 조회 최적화

### 2. 쿼리 최적화

```sql
-- 집계 함수 사용으로 데이터 전송량 감소
SELECT severity, COUNT(DISTINCT userid) as count
FROM mdl_jumpdetect_patterns
WHERE courseid = ? AND detected_at >= ?
GROUP BY severity;

-- 서브쿼리로 사용자별 시간 계산
SELECT AVG(timemodified - timecreated) as avg_time
FROM (
    SELECT userid, MIN(timecreated) as timecreated, MAX(timemodified) as timemodified
    FROM mdl_jumpdetect_tracking
    WHERE moduleid = ?
    GROUP BY userid
) as user_times;
```

### 3. 제한된 데이터 로딩

```php
// 최근 7일간 데이터만 로딩
$time_threshold = time() - (7 * 24 * 60 * 60);

// 상위 20명만 표시
LIMIT 20;
```

---

## 🔒 보안 고려사항

### 1. SQL Injection 방지

```php
// ❌ 나쁜 예
$sql = "SELECT * FROM users WHERE id = " . $userid;

// ✅ 좋은 예
$DB->get_record('jumpdetect_tracking', ['userid' => $userid]);
```

### 2. 권한 검증

```php
require_login();
require_capability('moodle/course:update', $context);
```

### 3. XSS 방지

```php
// Moodle의 출력 함수 사용
echo html_writer::tag('div', s($user_input));  // s()로 이스케이프
```

### 4. CSRF 방지

- Moodle의 sesskey 자동 검증 활용

---

## 📈 향후 개선 계획

### Phase 2 (단기)

- [ ] **머신러닝 통합**
  - scikit-learn 기반 학습 패턴 예측
  - 개인화된 위험도 모델

- [ ] **학생용 대시보드**
  - 자신의 학습 패턴 확인
  - 권장 학습 경로 제시

- [ ] **자동 개입 시스템**
  - 점프 시도 시 경고 팝업
  - 선수 학습 권장 메시지

### Phase 3 (장기)

- [ ] **AI 기반 분석**
  - Claude API 통합
  - 자연어 리포트 생성
  - 자동 개입 메시지 작성

- [ ] **외부 LMS 통합**
  - Canvas LMS
  - Blackboard
  - LTI 1.3 표준 지원

- [ ] **고급 분석**
  - 학습 경로 시각화
  - 코호트 분석
  - A/B 테스팅

---

## 🎓 학습된 교훈

### 기술적 교훈

1. **Moodle Events API의 강력함**
   - 플러그인 간 느슨한 결합
   - 확장 가능한 아키텍처

2. **XMLDB의 편리함**
   - 크로스 DBMS 호환성
   - 자동 마이그레이션

3. **Z-Score의 효과성**
   - 통계 기반 이상 탐지
   - 자동 임계값 조정

### 아키텍처 교훈

1. **관심사의 분리**
   - `observer.php`: 이벤트 처리만
   - `detector.php`: 감지 로직만
   - 유지보수성 향상

2. **데이터베이스 정규화**
   - 추적/패턴/알림 테이블 분리
   - 쿼리 성능 최적화

3. **사용자 중심 설계**
   - 교사가 이해하기 쉬운 용어
   - 시각적 피드백 중시

---

## 📚 참고 문헌

1. **Moodle 공식 문서**
   - [Events API](https://docs.moodle.org/dev/Events_API)
   - [XMLDB Documentation](https://docs.moodle.org/dev/XMLDB_Documentation)
   - [Plugin Development](https://docs.moodle.org/dev/Plugins)

2. **통계 분석**
   - Z-Score 이상 탐지 (Wikipedia)
   - Educational Data Mining (EDM)

3. **Moodle 플러그인 사례**
   - Analytics API
   - Completion API
   - Course Module API

---

## 📞 연락처

- **프로젝트**: alt42standalone_v1.0
- **개발팀**: KAIST Touch Math Academy
- **GitHub**: [Repository URL]
- **이메일**: [Contact Email]

---

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0-beta | 2025-11-18 | 초기 구현 완료 |

---

**구현 완료일**: 2025-11-18
**문서 작성자**: Claude Code (Anthropic)
**총 개발 시간**: 1 session
**코드 라인 수**: ~2,500 줄
**테스트 커버리지**: 기본 시나리오 검증 완료

---

## 🎉 결론

Moodle 3.7 LMS와 완벽히 통합되는 **점프 추론 감지 시스템**의 구현이 완료되었습니다.

### 주요 성과

✅ 4가지 점프 패턴 자동 감지
✅ 실시간 교사 알림 시스템
✅ 종합 분석 대시보드
✅ 통계 기반 과학적 접근
✅ 확장 가능한 아키텍처

이 시스템은 교사가 학생의 학습 패턴을 효과적으로 모니터링하고, 적시에 개입하여 학습 효과를 극대화할 수 있도록 지원합니다.

**Made with ❤️ by KAIST Touch Math Academy**
