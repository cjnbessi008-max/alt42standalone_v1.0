# Flow Moments 설치 가이드 (한국어)

## 빠른 설치 (5분)

### 1단계: 파일 복사

```bash
# Moodle 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 복사
cp -r /path/to/local_flowmoments local/flowmoments

# 권한 설정
chmod -R 755 local/flowmoments
chown -R www-data:www-data local/flowmoments
```

### 2단계: 플러그인 설치

#### 방법 A: 웹 인터페이스 (권장)

1. Moodle 관리자로 로그인
2. **사이트 관리 > 알림** 이동
3. "플러그인 업그레이드" 버튼 클릭
4. 설치 완료 확인

#### 방법 B: CLI

```bash
cd /var/www/html/moodle
sudo -u www-data php admin/cli/upgrade.php
```

### 3단계: 추적 활성화

#### 자동 활성화 (모든 퀴즈에 적용)

테마의 레이아웃 파일에 추가:

**파일**: `theme/yourtheme/layout/columns2.php`

```php
<?php
// 헤더 섹션 어딘가에 추가
if ($PAGE->pagetype == 'mod-quiz-attempt') {
    $PAGE->requires->js_call_amd('local_flowmoments/tracker', 'init');
}
?>
```

#### 수동 활성화 (특정 퀴즈만)

퀴즈 설명이나 페이지 상단에 추가:

```html
<div data-flowtracking="enabled"></div>
```

### 4단계: 확인

1. 학생 계정으로 퀴즈 시도
2. 2-3분간 문제 풀기
3. 퀴즈 제출
4. **메뉴 > 몰입 순간** 접속
5. 데이터 확인

## 상세 설정

### MySQL 설정 확인

```sql
-- MySQL 버전 확인 (5.7 이상 필요)
SELECT VERSION();

-- InnoDB 스토리지 엔진 확인
SHOW ENGINES;

-- 필요한 권한 확인
SHOW GRANTS FOR CURRENT_USER();
```

### PHP 설정 확인

```bash
# PHP 버전 확인 (7.1.9 이상)
php -v

# 필요한 확장 모듈 확인
php -m | grep -E 'mysqli|json|mbstring'
```

### 권한 설정

플러그인이 제대로 작동하려면 다음 권한이 필요합니다:

| 역할 | 권한 |
|------|------|
| 학생 | `local/flowmoments:viewown` |
| 교사 | `local/flowmoments:viewown`, `local/flowmoments:viewreports` |
| 관리자 | 모든 권한 |

**권한 확인 및 설정**:
1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. 각 역할 선택 후 `local/flowmoments` 권한 확인

### 캐시 설정 (성능 최적화)

```bash
# Moodle 캐시 지우기
php admin/cli/purge_caches.php

# OPcache 재시작 (선택사항)
sudo systemctl restart php7.4-fpm
```

## 문제 해결

### 플러그인이 보이지 않을 때

```bash
# 파일 위치 확인
ls -la /var/www/html/moodle/local/flowmoments/version.php

# 권한 확인
ls -la /var/www/html/moodle/local/ | grep flowmoments

# 올바른 권한으로 설정
sudo chown -R www-data:www-data local/flowmoments
sudo chmod -R 755 local/flowmoments
```

### JavaScript가 로드되지 않을 때

```bash
# AMD 모듈 재빌드
cd /var/www/html/moodle
sudo -u www-data php admin/cli/purge_caches.php

# 브라우저 캐시 강제 새로고침
# Ctrl + Shift + R (Windows/Linux)
# Cmd + Shift + R (Mac)
```

### 데이터베이스 테이블이 없을 때

```sql
-- 테이블 존재 확인
SHOW TABLES LIKE 'mdl_local_flowmoments%';

-- 수동으로 재설치
USE moodle_db;
-- (install.xml의 SQL을 실행하거나)

-- 또는 플러그인 재설치
```

```bash
php admin/cli/uninstall_plugins.php --plugins=local_flowmoments
php admin/cli/upgrade.php
```

### 몰입 데이터가 수집되지 않을 때

**체크리스트**:

1. ✓ JavaScript 추적기가 로드되었는가?
   - 브라우저 콘솔 (F12) 확인

2. ✓ 충분한 활동을 수행했는가?
   - 최소 2분 이상 활동 필요

3. ✓ 퀴즈를 제출했는가?
   - 분석은 제출 후 시작됨

4. ✓ 권한이 있는가?
   - `local/flowmoments:viewown` 권한 확인

**디버깅**:

```sql
-- 추적 데이터 확인
SELECT COUNT(*) as count, userid, courseid
FROM mdl_local_flowmoments_tracking
GROUP BY userid, courseid;

-- 감지된 몰입 순간 확인
SELECT * FROM mdl_local_flowmoments_detected
ORDER BY timecreated DESC LIMIT 10;
```

## 성능 최적화

### 대용량 데이터 처리

추적 데이터가 많아지면 정리 필요:

```sql
-- 30일 이상 된 추적 데이터 삭제
DELETE FROM mdl_local_flowmoments_tracking
WHERE timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));

-- 인덱스 최적화
OPTIMIZE TABLE mdl_local_flowmoments_tracking;
OPTIMIZE TABLE mdl_local_flowmoments_detected;
OPTIMIZE TABLE mdl_local_flowmoments_summary;
```

### Cron 작업 설정 (자동 정리)

Moodle cron에 추가:

```php
// local/flowmoments/db/tasks.php 생성 (향후 버전)
$tasks = [
    [
        'classname' => 'local_flowmoments\task\cleanup_old_data',
        'blocking' => 0,
        'minute' => '0',
        'hour' => '2',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*',
    ],
];
```

## 보안 고려사항

### 개인정보 보호

- ✓ 학생 이름, 이메일 등은 수집하지 않음
- ✓ 행동 패턴만 익명으로 분석
- ✓ GDPR 준수 (데이터 삭제 권리)

### 접근 제어

```sql
-- 권한 확인
SELECT rc.roleid, r.shortname, rc.capability, rc.permission
FROM mdl_role_capabilities rc
JOIN mdl_role r ON r.id = rc.roleid
WHERE rc.capability LIKE 'local/flowmoments%';
```

## 업그레이드

향후 버전 업그레이드:

```bash
# 백업
cp -r local/flowmoments local/flowmoments.backup

# 새 버전 복사
cp -r /path/to/new/local_flowmoments local/flowmoments

# 업그레이드 실행
php admin/cli/upgrade.php
```

## 제거

완전히 제거하려면:

```bash
# CLI 제거
php admin/cli/uninstall_plugins.php --plugins=local_flowmoments

# 또는 웹에서 제거:
# 사이트 관리 > 플러그인 > 플러그인 개요 > Flow Moments > 제거
```

**주의**: 제거 시 모든 몰입 데이터가 영구 삭제됩니다!

## 지원

문제가 계속되면:

1. Moodle 로그 확인: **사이트 관리 > 리포트 > 로그**
2. PHP 에러 로그: `/var/log/php-fpm/error.log`
3. 이슈 등록: GitHub Issues

---

**설치 완료!** 학생들의 몰입 순간을 추적하고 분석하세요. 🎯
