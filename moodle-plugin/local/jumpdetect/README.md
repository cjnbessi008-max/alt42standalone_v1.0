# Moodle Jump Reasoning Detection Plugin

## 📖 개요

**Jump Reasoning Detection (점프 추론 감지)** 플러그인은 Moodle 3.7 LMS에서 학습자의 점프 추론 습관을 자동으로 감지하는 시스템입니다. 학생들이 순차적인 학습 단계를 건너뛰거나, 선수 학습을 완료하지 않고 다음 단계로 진행하는 등의 패턴을 실시간으로 감지하여 교사에게 알림을 제공합니다.

## ✨ 주요 기능

### 1. 4가지 점프 패턴 자동 감지

#### 🔄 순차적 건너뛰기 (Sequential Jump)
- 학습 모듈 순서를 건너뛰는 패턴 감지
- 예: Module 1 → Module 4 (2, 3 건너뜀)

#### 📚 선수 학습 누락 (Prerequisite Skip)
- 필수 선수 과정을 완료하지 않고 진행
- Moodle의 활동 완료 조건과 연동

#### ⏱️ 시간 비정상 패턴 (Time Anomaly)
- 비정상적으로 빠른 모듈 완료 감지
- Z-Score 통계 분석 적용

#### 📝 퀴즈/과제 회피 (Assessment Evasion)
- 평가 활동을 건너뛰고 다음 단계로 이동
- 퀴즈, 과제 등 평가 활동 추적

### 2. 실시간 교사 알림 시스템

- 점프 패턴 감지 시 즉시 알림
- 심각도별 색상 구분 (🟢 정상, 🟡 주의, 🟠 경고, 🔴 위험)
- 대시보드에서 미읽음 알림 강조

### 3. 종합 분석 대시보드

- **통계 요약**: 심각도별 학생 수 한눈에 확인
- **학생별 점프 점수**: 상위 20명 랭킹 및 진행률 바
- **점프 유형별 통계**: 어떤 패턴이 가장 많이 발생하는지 분석
- **최근 알림**: 실시간 알림 목록

### 4. 자동 점수 계산

```
Jump Score = (순차적 건너뛰기 × 2) +
             (선수 학습 누락 × 3) +
             (시간 이상 × 1.5) +
             (평가 회피 × 2.5)

심각도:
- 0-5점: 정상 (Normal)
- 6-10점: 주의 (Caution)
- 11-20점: 경고 (Warning)
- 21점 이상: 위험 (Critical)
```

## 🔧 시스템 요구사항

- **Moodle**: 3.4 이상 (3.7 권장)
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **디스크 공간**: 최소 100MB

## 📦 설치 방법

### 1. 플러그인 다운로드

```bash
cd /path/to/moodle
git clone https://github.com/your-repo/moodle-local_jumpdetect.git local/jumpdetect
```

또는 ZIP 파일 다운로드 후:

```bash
cd /path/to/moodle/local
unzip jumpdetect.zip
```

### 2. Moodle 관리자 페이지 접속

1. 관리자로 로그인
2. `사이트 관리` → `알림` 페이지로 이동
3. Moodle이 자동으로 새 플러그인 감지
4. `데이터베이스 업그레이드` 버튼 클릭

### 3. 데이터베이스 테이블 자동 생성

설치 시 다음 테이블이 자동으로 생성됩니다:

- `mdl_jumpdetect_tracking` - 학습 활동 추적
- `mdl_jumpdetect_patterns` - 감지된 점프 패턴
- `mdl_jumpdetect_alerts` - 교사 알림
- `mdl_jumpdetect_course_paths` - 코스별 학습 경로 설정

### 4. 권한 설정

플러그인은 다음 권한을 자동으로 설정합니다:

- **교사/편집 교사**: 대시보드 보기 및 설정 가능
- **관리자**: 모든 기능 접근 가능

## 🚀 사용 방법

### 교사용 가이드

#### 1. 대시보드 접속

```
사이트 관리 → 플러그인 → 로컬 플러그인 → Jump Reasoning Detection
```

또는 직접 URL:

```
https://your-moodle-site.com/local/jumpdetect/index.php?courseid=YOUR_COURSE_ID
```

#### 2. 대시보드 구성 요소

**통계 요약 카드**
- 🔴 위험: 점프 점수 21점 이상 학생 수
- 🟠 경고: 점프 점수 11-20점 학생 수
- 🟡 주의: 점프 점수 6-10점 학생 수
- 🟢 정상: 점프 점수 5점 이하 학생 수

**최근 알림**
- 실시간으로 감지된 점프 패턴 알림
- 미읽음 알림은 노란색 배경으로 강조
- 발생 시간 표시

**학생별 점프 점수**
- 상위 20명 학생의 점프 점수 랭킹
- 진행률 바로 시각화
- 점프 횟수 및 최고 심각도 표시

**점프 유형별 통계**
- 각 점프 유형별 발생 건수
- 어떤 패턴이 가장 많은지 파악

#### 3. 조치 방법

점프 패턴이 감지된 학생에 대해:

1. **개별 상담**: 학생과 1:1 면담
2. **학습 경로 재설정**: 건너뛴 모듈 복습 권장
3. **선수 학습 강제**: 활동 완료 조건 설정
4. **학습 속도 조절**: 최소 학습 시간 설정

### 관리자용 가이드

#### 1. 코스별 학습 경로 설정

코스 설정 페이지에서:

- **모듈 순서 정의**: 올바른 학습 순서 설정
- **선수 과정 설정**: 활동 완료 조건 활용
- **최소 학습 시간**: 각 모듈의 권장 학습 시간 설정

#### 2. 감지 임계값 조정

`설정` 페이지에서 다음 값 조정 가능:

```php
// 순차적 건너뛰기 임계값
$CFG->jumpdetect_sequential_threshold = 1;  // 기본: 1개 모듈

// 시간 이상 Z-Score 임계값
$CFG->jumpdetect_time_zscore = -2.0;  // 기본: -2.0

// 최소 학습 시간
$CFG->jumpdetect_min_time = 60;  // 기본: 60초
```

## 📊 데이터베이스 스키마

### jumpdetect_tracking

학습 활동 추적 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | 고유 ID |
| userid | BIGINT | 사용자 ID |
| courseid | BIGINT | 코스 ID |
| moduleid | BIGINT | 모듈 ID |
| eventname | VARCHAR(255) | 이벤트 이름 |
| timecreated | BIGINT | 생성 시간 |
| timemodified | BIGINT | 수정 시간 |
| sessionid | VARCHAR(255) | 세션 ID |

### jumpdetect_patterns

감지된 점프 패턴

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | 고유 ID |
| userid | BIGINT | 사용자 ID |
| courseid | BIGINT | 코스 ID |
| jump_type | ENUM | 점프 유형 |
| jump_score | DECIMAL(5,2) | 점프 점수 |
| skipped_modules | TEXT | 건너뛴 모듈 목록 (JSON) |
| detected_at | BIGINT | 감지 시간 |
| severity | ENUM | 심각도 |

### jumpdetect_alerts

교사 알림

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | 고유 ID |
| userid | BIGINT | 학생 ID |
| courseid | BIGINT | 코스 ID |
| teacherid | BIGINT | 교사 ID |
| alert_type | VARCHAR(50) | 알림 유형 |
| message | TEXT | 알림 메시지 |
| is_read | TINYINT(1) | 읽음 여부 |
| timecreated | BIGINT | 생성 시간 |

## 🔌 Moodle 이벤트 통합

플러그인은 다음 Moodle 이벤트를 감지합니다:

| 이벤트 | 설명 |
|--------|------|
| `\core\event\course_module_viewed` | 모듈 조회 |
| `\core\event\course_module_completion_updated` | 모듈 완료 |
| `\mod_quiz\event\attempt_started` | 퀴즈 시작 |
| `\mod_quiz\event\attempt_submitted` | 퀴즈 제출 |
| `\core\event\user_enrolment_created` | 사용자 등록 |
| `\mod_assign\event\submission_status_viewed` | 과제 조회 |

## 🎨 커스터마이징

### 1. CSS 스타일 수정

`styles.css` 파일을 수정하여 대시보드 디자인 변경:

```css
/* 심각도 색상 변경 */
.stat-card.critical {
    border-left-color: #your-color;
}
```

### 2. 점수 계산 알고리즘 수정

`classes/detector.php`에서 점수 가중치 조정:

```php
// 순차적 건너뛰기 점수
$jump_score = count($skipped_modules) * 2;  // 기본: × 2

// 선수 학습 누락 점수
$jump_score = count($missing_prerequisites) * 3;  // 기본: × 3
```

### 3. 알림 메시지 커스터마이징

`classes/observer.php`의 `generate_alert_message()` 함수 수정

## 🐛 문제 해결

### 이벤트가 감지되지 않음

1. Moodle 디버그 모드 활성화
2. 이벤트 옵저버 등록 확인:
   ```bash
   php admin/cli/uninstall_plugins.php --run
   php admin/cli/upgrade.php
   ```

### 데이터베이스 오류

```bash
# 데이터베이스 재설치
DROP TABLE mdl_jumpdetect_tracking;
DROP TABLE mdl_jumpdetect_patterns;
DROP TABLE mdl_jumpdetect_alerts;
DROP TABLE mdl_jumpdetect_course_paths;

# Moodle 업그레이드 재실행
php admin/cli/upgrade.php
```

### 대시보드가 비어있음

- 학생 활동 데이터가 충분한지 확인
- 최근 7일간 활동이 있는지 확인
- 코스 ID가 올바른지 확인

## 📈 성능 최적화

### 1. 데이터베이스 인덱스

이미 최적화된 인덱스가 적용되어 있습니다:

- `idx_user_course` on (userid, courseid)
- `idx_timecreated` on (timecreated)
- `idx_teacher_read` on (teacherid, is_read)

### 2. 캐싱

대량의 데이터가 있는 경우 Moodle 캐시 활용:

```php
$cache = cache::make('local_jumpdetect', 'statistics');
$stats = $cache->get('course_' . $courseid);
```

### 3. 백그라운드 작업

대규모 분석은 Moodle의 Scheduled Task로 이동:

```php
// classes/task/analyze_patterns.php
class analyze_patterns extends \core\task\scheduled_task {
    public function execute() {
        // 대량 분석 로직
    }
}
```

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

GNU GPL v3 or later

## 👥 개발팀

- **개발**: KAIST Touch Math Academy
- **프로젝트**: alt42standalone_v1.0
- **버전**: 1.0-beta

## 📞 지원

- **이슈 리포트**: GitHub Issues
- **문의**: [이메일 주소]
- **문서**: [위키 링크]

## 🗺️ 로드맵

### Phase 1 (현재)
- ✅ 기본 점프 패턴 감지
- ✅ 교사 대시보드
- ✅ 실시간 알림

### Phase 2 (계획)
- 🔄 머신러닝 기반 예측
- 🔄 학생용 대시보드
- 🔄 자동 개입 시스템

### Phase 3 (미래)
- 🔮 AI 기반 학습 경로 추천
- 🔮 다국어 지원 확대
- 🔮 외부 LMS 통합 (Canvas, Blackboard)

## 📚 참고 자료

- [Moodle Plugin Development](https://docs.moodle.org/dev/Main_Page)
- [Moodle Events API](https://docs.moodle.org/dev/Events_API)
- [Educational Data Mining](https://educationaldatamining.org/)

---

**Made with ❤️ by KAIST Touch Math Academy**
