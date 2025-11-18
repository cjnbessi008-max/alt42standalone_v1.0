# Self-Explanation Prompts 설치 가이드

## 설치 전 준비사항

### 시스템 요구사항 확인

```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# Moodle 버전 확인 (3.7 이상 필요)
# Moodle 관리자 페이지 → 사이트 관리 → 서버 → 환경
```

### 백업

설치 전 데이터베이스와 파일 백업을 권장합니다:

```bash
# 데이터베이스 백업
mysqldump -u [username] -p [database_name] > moodle_backup_$(date +%Y%m%d).sql

# Moodle 파일 백업
tar -czf moodle_files_backup_$(date +%Y%m%d).tar.gz /path/to/moodle
```

## 설치 단계

### 방법 1: 직접 복사 (권장)

1. **플러그인 파일 복사**

```bash
# Moodle 설치 경로로 이동
cd /path/to/moodle

# selfexplanation 모듈 복사
cp -r /path/to/mod/selfexplanation ./mod/

# 또는 GitHub에서 직접 클론
cd mod
git clone [repository_url] selfexplanation
```

2. **권한 설정**

```bash
# 웹 서버 사용자로 소유권 변경 (Apache의 경우)
chown -R www-data:www-data mod/selfexplanation

# 또는 nginx의 경우
chown -R nginx:nginx mod/selfexplanation

# 적절한 권한 설정
chmod -R 755 mod/selfexplanation
```

3. **Moodle 관리자 페이지 접속**

- 브라우저에서 Moodle 사이트에 관리자로 로그인
- Moodle이 자동으로 새 플러그인을 감지하고 알림 페이지로 리디렉션
- 또는 수동으로: 사이트 관리 → 알림

4. **데이터베이스 업그레이드**

- "데이터베이스 업그레이드" 버튼 클릭
- 설치 진행 상황 확인
- 완료 후 "계속" 클릭

### 방법 2: ZIP 파일 업로드

1. **ZIP 파일 생성**

```bash
cd /path/to/
zip -r selfexplanation.zip mod/selfexplanation/
```

2. **Moodle 관리자 페이지에서 업로드**

- 사이트 관리 → 플러그인 → 플러그인 설치
- ZIP 파일 선택
- "ZIP 패키지에서 플러그인 설치" 클릭
- 확인 후 "계속" 클릭

## 설치 후 확인

### 1. 플러그인 설치 확인

```bash
# 데이터베이스에서 테이블 확인
mysql -u [username] -p [database_name]

SHOW TABLES LIKE 'mdl_selfexplanation%';
# 다음 테이블이 보여야 함:
# - mdl_selfexplanation
# - mdl_selfexplanation_responses
# - mdl_selfexplanation_analytics
```

### 2. Moodle UI에서 확인

- 사이트 관리 → 플러그인 → 활동 모듈
- "Self-Explanation Prompt" 항목 확인
- 버전 정보 확인: v1.0.0

### 3. 테스트 코스 생성

1. 테스트 코스 생성
2. "활동 추가" → "Self-Explanation Prompt" 선택
3. 기본 설정으로 활동 생성
4. 학생 계정으로 로그인하여 테스트

## 문제 해결

### 플러그인이 감지되지 않는 경우

```bash
# 파일 권한 확인
ls -la /path/to/moodle/mod/selfexplanation

# 캐시 삭제
php admin/cli/purge_caches.php
```

### 데이터베이스 오류

```bash
# MySQL 에러 로그 확인
tail -f /var/log/mysql/error.log

# Moodle 디버그 모드 활성화
# config.php에 추가:
# $CFG->debug = (E_ALL | E_STRICT);
# $CFG->debugdisplay = 1;
```

### 권한 오류

```bash
# SELinux 확인 (CentOS/RHEL의 경우)
getenforce
# Enforcing인 경우:
setenforce 0
# 또는 영구적으로:
setsebool -P httpd_can_network_connect_db 1
```

## 업그레이드

기존 버전에서 업그레이드하는 경우:

```bash
# 백업 먼저!
mysqldump -u [username] -p [database_name] > backup.sql

# 새 파일로 교체
cp -r /path/to/new/selfexplanation /path/to/moodle/mod/selfexplanation

# Moodle 알림 페이지 접속하여 업그레이드 실행
```

## 제거

플러그인을 제거하려면:

1. **Moodle UI에서 제거**
   - 사이트 관리 → 플러그인 → 활동 모듈
   - Self-Explanation Prompt 옆의 "제거" 클릭
   - 확인 후 진행

2. **수동 제거**

```bash
# 파일 삭제
rm -rf /path/to/moodle/mod/selfexplanation

# 데이터베이스 테이블 삭제 (필요시)
mysql -u [username] -p [database_name]
DROP TABLE mdl_selfexplanation;
DROP TABLE mdl_selfexplanation_responses;
DROP TABLE mdl_selfexplanation_analytics;
```

## 성능 최적화

### 대규모 배포의 경우

```sql
-- 인덱스 확인
SHOW INDEX FROM mdl_selfexplanation_responses;

-- 필요시 추가 인덱스 생성
CREATE INDEX idx_timecreated ON mdl_selfexplanation_responses(timecreated);
```

### 캐싱 설정

config.php에 추가:

```php
// Application cache
$CFG->cachejs = true;
$CFG->cachetemplates = true;
```

## 지원

설치 중 문제가 발생하면:

1. **로그 확인**: Moodle 데이터 디렉토리의 error.log
2. **포럼**: Moodle 커뮤니티 포럼
3. **이슈 트래커**: GitHub Issues

## 추가 참고자료

- [Moodle 플러그인 개발 가이드](https://docs.moodle.org/dev/Main_Page)
- [Moodle 활동 모듈](https://docs.moodle.org/dev/Activity_modules)
- [MySQL 최적화](https://dev.mysql.com/doc/refman/5.7/en/optimization.html)
