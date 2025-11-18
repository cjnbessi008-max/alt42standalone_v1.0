# 설치 가이드 (Installation Guide)

## 시스템 요구사항 (System Requirements)

### 필수 요구사항
- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+

### 권장 사항
- PHP memory_limit: 128MB 이상
- MySQL max_connections: 100 이상
- 디스크 공간: 100MB 이상

## 설치 단계 (Installation Steps)

### 1. 플러그인 파일 복사

Moodle의 `local/` 디렉토리에 플러그인을 복사합니다:

```bash
cd /path/to/moodle
cp -r /path/to/moodle-best-moments local/bestmoments
```

### 2. 권한 설정

웹 서버가 파일을 읽을 수 있도록 권한을 설정합니다:

```bash
chown -R www-data:www-data local/bestmoments
chmod -R 755 local/bestmoments
```

### 3. Moodle 관리자 페이지에서 설치

1. 웹 브라우저에서 Moodle 사이트에 관리자로 로그인합니다
2. 사이트 관리 → 알림(Notifications) 페이지로 이동합니다
3. "플러그인 업그레이드" 버튼을 클릭합니다
4. "Best Thinking Moments (local_bestmoments)" 플러그인이 나타나면 "데이터베이스 업그레이드" 버튼을 클릭합니다

### 4. 데이터베이스 테이블 확인

설치가 완료되면 다음 테이블들이 생성됩니다:

- `mdl_local_bestmoments_moments` - 추출된 사고 순간
- `mdl_local_bestmoments_scores` - 활동별 점수
- `mdl_local_bestmoments_activities` - 분석된 활동 추적
- `mdl_local_bestmoments_settings` - 플러그인 설정
- `mdl_local_bestmoments_logs` - 분석 작업 로그

확인 방법:
```sql
SHOW TABLES LIKE 'mdl_local_bestmoments%';
```

### 5. 스케줄러 설정 확인

사이트 관리 → 서버 → Scheduled tasks로 이동하여 다음 작업이 활성화되어 있는지 확인:

- **작업명**: Analyze and extract best thinking moments
- **컴포넌트**: local_bestmoments
- **실행 시간**: 매일 23:00 (기본값)

### 6. Cron 설정 확인

Moodle의 cron이 정상적으로 실행되는지 확인:

```bash
# 수동 실행 테스트
php /path/to/moodle/admin/cli/cron.php
```

## 설정 (Configuration)

### 기본 설정 변경

`config/config.php` 파일에서 다음 설정을 변경할 수 있습니다:

```php
// 분석 기준 가중치
define('BESTMOMENTS_WEIGHT_EFFICIENCY', 0.25);
define('BESTMOMENTS_WEIGHT_CREATIVITY', 0.20);
define('BESTMOMENTS_WEIGHT_IMPROVEMENT', 0.25);
define('BESTMOMENTS_WEIGHT_PERSISTENCE', 0.15);
define('BESTMOMENTS_WEIGHT_COLLABORATION', 0.15);

// 최소 점수 임계값
define('BESTMOMENTS_MIN_SCORE', 60);

// 일일 최대 추출 개수
define('BESTMOMENTS_MAX_MOMENTS_PER_DAY', 10);

// 실행 시간
define('BESTMOMENTS_ANALYSIS_HOUR', 23);
define('BESTMOMENTS_ANALYSIS_MINUTE', 0);
```

### 분석할 활동 유형 선택

```php
define('BESTMOMENTS_ANALYZE_QUIZ', true);
define('BESTMOMENTS_ANALYZE_ASSIGNMENT', true);
define('BESTMOMENTS_ANALYZE_FORUM', true);
define('BESTMOMENTS_ANALYZE_LESSON', true);
define('BESTMOMENTS_ANALYZE_WORKSHOP', true);
```

## 권한 설정 (Permissions)

### 역할별 권한 할당

사이트 관리 → 사용자 → 권한 → 역할 정의로 이동하여 다음 권한을 설정:

#### 교사 (Teacher)
- ✅ `local/bestmoments:viewreport` - 리포트 보기
- ✅ `local/bestmoments:triggeranalysis` - 수동 분석 실행
- ✅ `local/bestmoments:export` - 데이터 내보내기

#### 학생 (Student)
- ✅ `local/bestmoments:viewown` - 자신의 순간 보기

#### 관리자 (Manager)
- ✅ 모든 권한

## 접근 방법 (Access)

### 대시보드 접근

플러그인 설치 후 다음 URL로 접근:

```
https://your-moodle-site.com/local/bestmoments/
```

### 코스별 보기

```
https://your-moodle-site.com/local/bestmoments/?courseid=123
```

## 문제 해결 (Troubleshooting)

### 1. 테이블이 생성되지 않음

**증상**: 설치 후 데이터베이스 테이블이 없음

**해결 방법**:
```bash
# 수동으로 업그레이드 실행
php /path/to/moodle/admin/cli/upgrade.php
```

### 2. 스케줄러가 실행되지 않음

**증상**: 매일 23시에 분석이 실행되지 않음

**확인 사항**:
1. Moodle cron이 정상 실행되는지 확인
2. Scheduled tasks에서 작업이 활성화되어 있는지 확인
3. 로그 확인: `mdl_local_bestmoments_logs` 테이블

**수동 실행**:
```bash
php /path/to/moodle/admin/cli/scheduled_task.php \
  --execute='\\local_bestmoments\\task\\analyze_moments'
```

### 3. 권한 오류

**증상**: "You do not have permission to view this page"

**해결 방법**:
1. 사이트 관리 → 사용자 → 권한에서 역할 확인
2. 코스 컨텍스트에서 권한 할당 확인

### 4. 데이터가 표시되지 않음

**증상**: 대시보드가 비어있음

**확인 사항**:
1. 학습 활동이 있는지 확인 (퀴즈, 과제 등)
2. 분석이 실행되었는지 로그 확인
3. 점수가 임계값(기본 60점) 이상인지 확인

**테스트 데이터 생성**:
```sql
-- 샘플 moment 추가
INSERT INTO mdl_local_bestmoments_moments
(userid, courseid, activitytype, activityid, momentdate, score,
 efficiency_score, creativity_score, improvement_score,
 persistence_score, collaboration_score, description,
 timecreated, timemodified)
VALUES
(2, 1, 'quiz', 1, UNIX_TIMESTAMP(), 85,
 80, 75, 90, 85, 70, '테스트 사고 순간입니다.',
 UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

### 5. MySQL 5.7 호환성 문제

**증상**: SQL 오류 발생

**해결 방법**:
```sql
-- SQL 모드 확인
SELECT @@sql_mode;

-- 권장 SQL 모드 설정
SET GLOBAL sql_mode = 'TRADITIONAL,NO_AUTO_VALUE_ON_ZERO';
```

## 성능 최적화 (Performance Optimization)

### 데이터베이스 인덱스

분석 성능 향상을 위해 추가 인덱스 생성:

```sql
-- 로그 테이블 인덱스
CREATE INDEX idx_log_user_time
ON mdl_logstore_standard_log(userid, timecreated);

-- 퀴즈 시도 인덱스
CREATE INDEX idx_quiz_user_finish
ON mdl_quiz_attempts(userid, timefinish);

-- 과제 제출 인덱스
CREATE INDEX idx_assign_user_time
ON mdl_assign_submission(userid, timemodified);

-- 포럼 게시물 인덱스
CREATE INDEX idx_forum_user_created
ON mdl_forum_posts(userid, created);
```

### Cron 스케줄 최적화

대량의 데이터가 있는 경우 실행 시간 조정:

```php
// db/tasks.php에서 시간 변경
'hour' => '2',  // 새벽 2시로 변경 (서버 부하가 적은 시간)
```

## 업그레이드 (Upgrade)

### 새 버전으로 업그레이드

1. 기존 플러그인 백업
```bash
cp -r local/bestmoments local/bestmoments.backup
```

2. 새 파일 복사
```bash
cp -r /path/to/new/moodle-best-moments/* local/bestmoments/
```

3. Moodle 관리자 페이지에서 업그레이드 실행
4. 설정 확인 및 테스트

## 제거 (Uninstall)

### 플러그인 제거

1. 사이트 관리 → 플러그인 → 플러그인 개요
2. "Best Thinking Moments" 찾기
3. "제거" 클릭
4. 데이터베이스 테이블도 함께 삭제됨

### 수동 제거

```bash
# 파일 삭제
rm -rf local/bestmoments

# 데이터베이스 테이블 삭제
mysql -u root -p moodle << EOF
DROP TABLE IF EXISTS mdl_local_bestmoments_moments;
DROP TABLE IF EXISTS mdl_local_bestmoments_scores;
DROP TABLE IF EXISTS mdl_local_bestmoments_activities;
DROP TABLE IF EXISTS mdl_local_bestmoments_settings;
DROP TABLE IF EXISTS mdl_local_bestmoments_logs;
EOF
```

## 지원 (Support)

문제가 발생하면 다음 정보와 함께 문의:
- Moodle 버전
- PHP 버전
- MySQL 버전
- 오류 메시지
- 로그 파일 (`mdl_local_bestmoments_logs`)
