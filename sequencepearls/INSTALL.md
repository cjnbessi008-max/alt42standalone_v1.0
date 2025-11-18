# Sequence Pearls - 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **Moodle**: 3.4 이상 (3.7에서 테스트됨)
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+

### 권장 사항
- PHP 메모리: 최소 128MB (256MB 권장)
- MySQL 스토리지: InnoDB 엔진
- 브라우저: Chrome, Firefox, Safari, Edge 최신 버전

## 설치 단계

### 1. 파일 복사

#### 방법 A: Git Clone
```bash
cd /path/to/moodle/mod/
git clone https://github.com/your-org/sequencepearls.git
```

#### 방법 B: 수동 복사
```bash
# 다운로드한 파일 압축 해제
unzip sequencepearls.zip

# Moodle mod 디렉토리로 복사
cp -r sequencepearls /path/to/moodle/mod/
```

### 2. 파일 권한 설정

```bash
cd /path/to/moodle/mod/sequencepearls
chmod -R 755 .
chown -R www-data:www-data .
```

### 3. Moodle 관리자 설치

1. 웹 브라우저에서 Moodle 사이트에 관리자로 로그인
2. **사이트 관리 → 알림**으로 이동
3. Sequence Pearls 플러그인이 목록에 표시됩니다
4. **데이터베이스 업그레이드** 버튼 클릭
5. 설치가 완료될 때까지 대기

### 4. 설치 확인

다음 데이터베이스 테이블이 생성되었는지 확인:

```sql
SHOW TABLES LIKE 'mdl_sequencepearls%';
```

예상 결과:
- `mdl_sequencepearls`
- `mdl_sequencepearls_problems`
- `mdl_sequencepearls_attempts`
- `mdl_sequencepearls_progress`

### 5. AMD 모듈 빌드 (선택사항)

JavaScript를 수정한 경우:

```bash
cd /path/to/moodle
npm install
php admin/cli/grunt.php amd
```

### 6. 캐시 정리

```bash
php admin/cli/purge_caches.php
```

또는 웹 인터페이스에서:
**사이트 관리 → 개발 → 모든 캐시 제거**

## 데이터베이스 스키마

### sequencepearls 테이블
```sql
CREATE TABLE mdl_sequencepearls (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    course BIGINT(10) NOT NULL DEFAULT 0,
    name VARCHAR(255) NOT NULL,
    intro LONGTEXT NOT NULL,
    introformat INT(4) NOT NULL DEFAULT 0,
    sequence_type VARCHAR(50) NOT NULL DEFAULT 'arithmetic',
    difficulty INT(2) NOT NULL DEFAULT 1,
    num_problems INT(5) NOT NULL DEFAULT 10,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY course (course)
);
```

### sequencepearls_problems 테이블
```sql
CREATE TABLE mdl_sequencepearls_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    sequencepearls_id BIGINT(10) NOT NULL DEFAULT 0,
    sequence_data LONGTEXT NOT NULL,
    missing_position INT(3) NOT NULL DEFAULT 0,
    correct_answer DECIMAL(10,2) NOT NULL,
    rule_formula VARCHAR(255),
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY sequencepearls_id (sequencepearls_id)
);
```

### sequencepearls_attempts 테이블
```sql
CREATE TABLE mdl_sequencepearls_attempts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    sequencepearls_id BIGINT(10) NOT NULL DEFAULT 0,
    problem_id BIGINT(10) NOT NULL DEFAULT 0,
    userid BIGINT(10) NOT NULL DEFAULT 0,
    user_answer DECIMAL(10,2) NOT NULL,
    is_correct INT(1) NOT NULL DEFAULT 0,
    time_spent INT(10) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY userid (userid),
    KEY problem_id (problem_id)
);
```

### sequencepearls_progress 테이블
```sql
CREATE TABLE mdl_sequencepearls_progress (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    sequencepearls_id BIGINT(10) NOT NULL DEFAULT 0,
    userid BIGINT(10) NOT NULL DEFAULT 0,
    problems_attempted INT(10) NOT NULL DEFAULT 0,
    problems_correct INT(10) NOT NULL DEFAULT 0,
    best_streak INT(10) NOT NULL DEFAULT 0,
    current_streak INT(10) NOT NULL DEFAULT 0,
    total_time_spent INT(10) NOT NULL DEFAULT 0,
    completion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY userid_activity (sequencepearls_id, userid)
);
```

## 권한 설정

플러그인은 다음 권한을 생성합니다:

- **mod/sequencepearls:addinstance**: 활동 추가 (교사, 관리자)
- **mod/sequencepearls:view**: 활동 보기 (모든 사용자)
- **mod/sequencepearls:submit**: 답안 제출 (학생, 교사)
- **mod/sequencepearls:viewreports**: 리포트 보기 (교사, 관리자)

## 웹 서비스 설정

AJAX 기능을 사용하려면 다음 서비스가 활성화되어야 합니다:

- `mod_sequencepearls_submit_answer`
- `mod_sequencepearls_get_problem`

이는 설치 시 자동으로 등록됩니다.

## 문제 해결

### 문제: JavaScript가 로드되지 않음

**해결방법**:
```bash
php admin/cli/purge_caches.php
php admin/cli/grunt.php amd
```

### 문제: 데이터베이스 오류

**해결방법**:
1. MySQL 버전 확인: `mysql --version`
2. 데이터베이스 권한 확인
3. Moodle config.php의 DB 설정 확인

### 문제: 구슬이 표시되지 않음

**해결방법**:
1. 브라우저 콘솔에서 JavaScript 오류 확인
2. Canvas 지원 확인 (HTML5)
3. CSS 파일 로드 확인

### 문제: 권한 오류

**해결방법**:
```bash
# 파일 권한 재설정
cd /path/to/moodle/mod/sequencepearls
chmod -R 755 .
chown -R www-data:www-data .

# Moodle 데이터 디렉토리 권한 확인
chmod -R 777 /path/to/moodledata
```

## 업그레이드

기존 설치를 업그레이드하려면:

1. 기존 파일 백업
2. 새 파일로 교체
3. **사이트 관리 → 알림** 방문
4. 업그레이드 실행

## 제거

플러그인을 제거하려면:

1. **사이트 관리 → 플러그인 → 활동 모듈 → Sequence Pearls**
2. **제거** 클릭
3. 확인 후 데이터베이스 테이블이 자동으로 삭제됨

또는 수동으로:
```bash
rm -rf /path/to/moodle/mod/sequencepearls
```

```sql
DROP TABLE mdl_sequencepearls;
DROP TABLE mdl_sequencepearls_problems;
DROP TABLE mdl_sequencepearls_attempts;
DROP TABLE mdl_sequencepearls_progress;
```

## 성능 최적화

### MySQL 최적화

```sql
-- 인덱스 추가
ALTER TABLE mdl_sequencepearls_attempts ADD INDEX idx_userid_correct (userid, is_correct);
ALTER TABLE mdl_sequencepearls_problems ADD INDEX idx_activity (sequencepearls_id);

-- 쿼리 캐시 활성화
SET GLOBAL query_cache_size = 67108864; -- 64MB
SET GLOBAL query_cache_type = 1;
```

### PHP 최적화

php.ini 설정:
```ini
memory_limit = 256M
max_execution_time = 60
opcache.enable = 1
opcache.memory_consumption = 128
```

### Apache 최적화

.htaccess 설정:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
</IfModule>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/css application/javascript
</IfModule>
```

## 지원

문제가 발생하면:
- GitHub Issues: https://github.com/your-org/sequencepearls/issues
- 이메일: support@kaist-touchmath.edu
- Moodle 포럼: https://moodle.org/plugins/mod_sequencepearls

## 라이선스

GNU GPL v3 or later
http://www.gnu.org/copyleft/gpl.html
