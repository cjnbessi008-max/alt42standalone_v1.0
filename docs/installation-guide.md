# AI Problem Optimizer - 설치 및 설정 가이드

## 목차
1. [사전 준비](#사전-준비)
2. [설치 단계](#설치-단계)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [플러그인 설정](#플러그인-설정)
5. [테스트](#테스트)
6. [문제 해결](#문제-해결)

## 사전 준비

### 시스템 요구사항 확인

```bash
# PHP 버전 확인
php -v
# 필요: PHP 7.1.9 이상

# MySQL 버전 확인
mysql --version
# 필요: MySQL 5.7 이상

# Moodle 버전 확인
grep '$version' /path/to/moodle/version.php
# 필요: Moodle 3.7 이상
```

### 필요한 PHP 확장 모듈

```bash
# 필요한 확장 모듈 확인
php -m | grep -E 'mysqli|pdo_mysql|json|mbstring'
```

필요한 모듈:
- mysqli
- pdo_mysql
- json
- mbstring
- xml
- zip

### 백업 생성

**중요**: 설치 전 반드시 백업을 생성하세요!

```bash
# 1. Moodle 파일 백업
cd /var/www/html
tar -czf moodle_backup_$(date +%Y%m%d).tar.gz moodle/

# 2. 데이터베이스 백업
mysqldump -u moodle_user -p moodle_db > moodle_db_backup_$(date +%Y%m%d).sql
```

## 설치 단계

### Step 1: 플러그인 파일 복사

```bash
# Moodle 설치 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 디렉토리 생성
mkdir -p local/aiproblemoptimizer

# 플러그인 파일 복사 (소스 경로 수정 필요)
cp -r /path/to/moodle-plugin/local/aiproblemoptimizer/* local/aiproblemoptimizer/

# 권한 설정
chown -R www-data:www-data local/aiproblemoptimizer
chmod -R 755 local/aiproblemoptimizer
```

### Step 2: 파일 구조 확인

```bash
# 디렉토리 구조 확인
tree local/aiproblemoptimizer

# 예상 출력:
# local/aiproblemoptimizer/
# ├── classes/
# │   ├── optimizer.php
# │   ├── metrics_tracker.php
# │   └── task/
# ├── db/
# │   └── access.php
# ├── lang/
# │   ├── en/
# │   └── ko/
# ├── api.php
# ├── lib.php
# └── version.php
```

### Step 3: Moodle 플러그인 자동 설치

#### 방법 A: 웹 인터페이스 (권장)

1. Moodle에 관리자로 로그인
2. **사이트 관리** (Site administration) 메뉴 클릭
3. **알림** (Notifications) 메뉴 확인
4. 새 플러그인 감지 메시지 확인
5. **데이터베이스 업그레이드** 버튼 클릭
6. 설치 완료 확인

#### 방법 B: CLI (명령줄)

```bash
# Moodle 디렉토리에서 실행
cd /var/www/html/moodle
sudo -u www-data php admin/cli/upgrade.php
```

## 데이터베이스 설정

### 자동 설치 (Moodle을 통한 설치)

Moodle이 자동으로 테이블을 생성합니다. 위의 "Step 3"을 따르세요.

### 수동 설치 (필요한 경우)

```bash
# MySQL 접속
mysql -u moodle_user -p

# 데이터베이스 선택
USE moodle_db;

# SQL 파일 실행
SOURCE /path/to/moodle-plugin/sql/install_schema.sql;

# 테이블 생성 확인
SHOW TABLES LIKE 'mdl_ai_%';

# 예상 출력:
# +----------------------------------+
# | Tables_in_moodle_db (mdl_ai_%)  |
# +----------------------------------+
# | mdl_ai_daily_summary             |
# | mdl_ai_optimization_log          |
# | mdl_ai_problem_config            |
# | mdl_ai_problem_history           |
# | mdl_ai_student_metrics           |
# +----------------------------------+
```

### 테이블 구조 확인

```sql
-- 학생 메트릭 테이블 확인
DESCRIBE mdl_ai_student_metrics;

-- 문제 풀이 이력 테이블 확인
DESCRIBE mdl_ai_problem_history;

-- 설정 테이블 확인
DESCRIBE mdl_ai_problem_config;
```

### 초기 데이터 삽입

```sql
-- 과목별 기본 설정 생성 (courseid는 실제 값으로 변경)
INSERT INTO mdl_ai_problem_config (
    courseid, base_problems, min_problems, max_problems,
    difficulty_up_threshold, difficulty_down_threshold,
    optimal_accuracy_min, optimal_accuracy_max,
    fast_time_threshold, slow_time_threshold,
    high_consistency_days,
    accuracy_weight, speed_weight, consistency_weight,
    is_enabled, auto_adjust_difficulty,
    timecreated, timemodified
) VALUES (
    YOUR_COURSE_ID, 10, 5, 30,
    0.9000, 0.6000,
    0.7000, 0.8500,
    30, 60,
    5,
    0.40, 0.30, 0.30,
    1, 1,
    UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
);
```

## 플러그인 설정

### 전역 설정

1. **사이트 관리** > **플러그인** > **로컬 플러그인** 이동
2. "AI Problem Optimizer" 플러그인 찾기
3. 상태가 "Enabled"인지 확인

### 과목별 설정

각 과목에 대해 개별적으로 설정이 필요합니다.

#### PHP 코드를 통한 초기화

```php
<?php
// initialize_course.php

require_once('config.php');
require_once($CFG->dirroot . '/local/aiproblemoptimizer/lib.php');

// 초기화할 과목 ID 설정
$courseid = 2; // 실제 과목 ID로 변경

// 과목 초기화
if (local_aiproblemoptimizer_initialize_course($courseid)) {
    echo "과목 {$courseid} 초기화 성공!\n";
} else {
    echo "과목 {$courseid} 초기화 실패!\n";
}
?>
```

실행:
```bash
cd /var/www/html/moodle
php initialize_course.php
```

#### 모든 과목 일괄 초기화

```php
<?php
// initialize_all_courses.php

require_once('config.php');
require_once($CFG->dirroot . '/local/aiproblemoptimizer/lib.php');

// 모든 과목 가져오기
$courses = $DB->get_records('course', null, '', 'id,fullname');

foreach ($courses as $course) {
    // 사이트 과목(ID=1)은 제외
    if ($course->id == 1) {
        continue;
    }

    if (local_aiproblemoptimizer_initialize_course($course->id)) {
        echo "✓ 과목 {$course->id} ({$course->fullname}) 초기화 성공\n";
    } else {
        echo "✗ 과목 {$course->id} ({$course->fullname}) 초기화 실패\n";
    }
}
?>
```

### 권한 설정

```sql
-- 역할별 권한 확인
SELECT r.shortname, rc.capability, rc.permission
FROM mdl_role_capabilities rc
JOIN mdl_role r ON rc.roleid = r.id
WHERE rc.capability LIKE 'local/aiproblemoptimizer:%';
```

기본 권한:
- **학생 (student)**: viewown (자신의 데이터 조회)
- **교사 (teacher)**: viewown, viewall, viewstatistics (모든 학생 데이터 조회)
- **편집 교사 (editingteacher)**: 모든 권한
- **관리자 (manager)**: 모든 권한

## 테스트

### 1. 기본 기능 테스트

```bash
# 웹 서버 로그 확인
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

### 2. API 엔드포인트 테스트

```bash
# 학생으로 로그인한 후 세션 쿠키 복사
# 브라우저 개발자 도구에서 Cookie 값 확인

# API 테스트
curl "http://your-moodle.com/local/aiproblemoptimizer/api.php?action=get_optimal_problems&userid=2&courseid=2" \
  -H "Cookie: MoodleSession=YOUR_SESSION_ID" \
  -v
```

예상 응답:
```json
{
  "success": true,
  "data": {
    "userid": 2,
    "courseid": 2,
    "recommended_problems": 10,
    "metrics": {...}
  },
  "timestamp": 1638360000
}
```

### 3. 데이터 기록 테스트

```bash
# 문제 풀이 기록 테스트
curl -X POST "http://your-moodle.com/local/aiproblemoptimizer/api.php?action=record_attempt" \
  -H "Cookie: MoodleSession=YOUR_SESSION_ID" \
  -d "userid=2" \
  -d "courseid=2" \
  -d "quizid=1" \
  -d "problem_type=test" \
  -d "difficulty_level=1" \
  -d "is_correct=1" \
  -d "time_spent=30"
```

### 4. 데이터베이스 검증

```sql
-- 학생 메트릭 확인
SELECT * FROM mdl_ai_student_metrics LIMIT 5;

-- 문제 풀이 이력 확인
SELECT * FROM mdl_ai_problem_history LIMIT 5;

-- 최적화 로그 확인
SELECT * FROM mdl_ai_optimization_log LIMIT 5;

-- 과목 설정 확인
SELECT * FROM mdl_ai_problem_config;
```

### 5. 성능 테스트

```sql
-- 쿼리 실행 시간 측정
SET profiling = 1;

-- 최적화 계산 시뮬레이션
CALL sp_calculate_optimal_problems(2, 2, @result);
SELECT @result;

-- 프로파일링 결과 확인
SHOW PROFILES;
```

## 문제 해결

### 문제 1: 플러그인이 감지되지 않음

**원인**: 파일 권한 또는 디렉토리 구조 문제

**해결**:
```bash
# 권한 재설정
cd /var/www/html/moodle
chown -R www-data:www-data local/aiproblemoptimizer
chmod -R 755 local/aiproblemoptimizer

# 캐시 삭제
sudo -u www-data php admin/cli/purge_caches.php
```

### 문제 2: 데이터베이스 테이블이 생성되지 않음

**원인**: MySQL 사용자 권한 부족

**해결**:
```sql
-- 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 필요한 권한 부여
GRANT CREATE, ALTER, DROP, INDEX ON moodle_db.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;

-- 수동으로 테이블 생성
SOURCE /path/to/sql/install_schema.sql;
```

### 문제 3: API 호출 시 403 오류

**원인**: 권한 또는 세션 문제

**해결**:
```bash
# 1. 유효한 세션으로 로그인했는지 확인
# 2. 사용자에게 적절한 권한이 있는지 확인

# 권한 부여 (관리자로 실행)
# Moodle UI: 사이트 관리 > 사용자 > 권한 > 역할 정의
```

### 문제 4: 최적 문제 수가 항상 10개

**원인**: 데이터 부족 또는 설정 문제

**해결**:
```sql
-- 학생 데이터 확인
SELECT * FROM mdl_ai_student_metrics WHERE userid = 2 AND courseid = 2;

-- 문제 풀이 이력 확인
SELECT COUNT(*) FROM mdl_ai_problem_history WHERE userid = 2 AND courseid = 2;

-- 최소 10개 이상의 문제를 풀어야 정확한 계산이 가능
```

### 문제 5: 성능 저하

**원인**: 인덱스 부족 또는 대량 데이터

**해결**:
```sql
-- 인덱스 추가
CREATE INDEX idx_metrics_user_modified ON mdl_ai_student_metrics(userid, timemodified);
CREATE INDEX idx_history_user_quiz_time ON mdl_ai_problem_history(userid, quizid, timecreated);

-- 오래된 로그 아카이브
CREATE TABLE mdl_ai_optimization_log_archive LIKE mdl_ai_optimization_log;

INSERT INTO mdl_ai_optimization_log_archive
SELECT * FROM mdl_ai_optimization_log
WHERE timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH));

DELETE FROM mdl_ai_optimization_log
WHERE timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 6 MONTH));
```

### 문제 6: PHP 메모리 부족

**원인**: 대량 데이터 처리

**해결**:
```bash
# php.ini 수정
sudo nano /etc/php/7.1/apache2/php.ini

# 다음 값 증가
memory_limit = 256M
max_execution_time = 300

# Apache 재시작
sudo service apache2 restart
```

## 로그 확인

### Moodle 로그

```bash
# Moodle 디버그 모드 활성화 (config.php에 추가)
$CFG->debug = E_ALL;
$CFG->debugdisplay = 1;

# 로그 파일 위치
tail -f /var/www/moodledata/error_log
```

### 데이터베이스 쿼리 로그

```sql
-- MySQL 쿼리 로그 활성화
SET GLOBAL general_log = 'ON';
SET GLOBAL log_output = 'TABLE';

-- 로그 확인
SELECT * FROM mysql.general_log
WHERE command_type = 'Query'
  AND argument LIKE '%ai_%'
ORDER BY event_time DESC
LIMIT 20;
```

### API 요청 로그

```php
// api.php 상단에 추가
error_log(date('Y-m-d H:i:s') . " - API Call: " . $_GET['action'] . " - User: " . $USER->id . "\n", 3, "/tmp/aiproblemoptimizer.log");
```

## 유지보수

### 일일 작업

```bash
# 캐시 정리 (매일 자동 실행)
0 2 * * * /usr/bin/php /var/www/html/moodle/admin/cli/purge_caches.php
```

### 주간 작업

```sql
-- 성능 통계 확인
SELECT
    courseid,
    COUNT(DISTINCT userid) as active_students,
    AVG(accuracy) as avg_accuracy,
    AVG(recommended_problems) as avg_problems
FROM mdl_ai_student_metrics
WHERE timemodified > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY))
GROUP BY courseid;
```

### 월간 작업

```sql
-- 오래된 데이터 아카이브
-- 6개월 이상 된 로그 아카이브 (위의 "문제 5" 참조)
```

## 보안 권장사항

1. **API 접근 제한**
```apache
# .htaccess에 추가
<Files "api.php">
    # IP 화이트리스트 (필요시)
    # Order Deny,Allow
    # Deny from all
    # Allow from 192.168.1.0/24
</Files>
```

2. **SQL Injection 방지**
- 항상 Moodle의 `$DB` 함수 사용
- Prepared statements 사용

3. **XSS 방지**
- 출력 시 항상 `s()` 또는 `format_text()` 사용

4. **HTTPS 사용**
```apache
# Apache 설정
<VirtualHost *:80>
    ServerName your-moodle.com
    Redirect permanent / https://your-moodle.com/
</VirtualHost>
```

## 지원 및 문의

- **문서**: [README.md](../moodle-plugin/README.md)
- **아키텍처**: [moodle-integration-architecture.md](./moodle-integration-architecture.md)
- **이슈**: GitHub Issues
- **이메일**: support@your-organization.com

## 다음 단계

설치가 완료되면:

1. [사용자 가이드](../moodle-plugin/README.md#사용-방법) 참조
2. API 통합 테스트
3. 실제 학생 데이터로 검증
4. 성능 모니터링 설정

---

**마지막 업데이트**: 2025-11-18
**버전**: 1.0.0
