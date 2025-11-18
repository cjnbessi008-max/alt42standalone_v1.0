# Moodle Jump Reasoning Detection - 설치 가이드

## 목차

1. [시스템 요구사항](#1-시스템-요구사항)
2. [설치 전 준비](#2-설치-전-준비)
3. [설치 단계](#3-설치-단계)
4. [설정 및 구성](#4-설정-및-구성)
5. [테스트 및 검증](#5-테스트-및-검증)
6. [문제 해결](#6-문제-해결)

---

## 1. 시스템 요구사항

### 최소 요구사항

| 구성 요소 | 최소 버전 | 권장 버전 |
|-----------|----------|----------|
| Moodle | 3.4 | 3.7+ |
| PHP | 7.1.9 | 7.3+ |
| MySQL | 5.7 | 5.7+ / MariaDB 10.2+ |
| 디스크 공간 | 100 MB | 500 MB |
| 메모리 | 256 MB | 512 MB |

### PHP 확장 모듈

다음 PHP 확장이 활성화되어 있어야 합니다:

```bash
php -m | grep -E 'mysqli|json|mbstring|xml'
```

필수 확장:
- mysqli (MySQL 연결)
- json (데이터 처리)
- mbstring (다국어 지원)
- xml (설정 파싱)

---

## 2. 설치 전 준비

### 2.1 백업

플러그인 설치 전 **반드시** 백업을 수행하세요:

```bash
# 데이터베이스 백업
mysqldump -u root -p moodle_db > moodle_backup_$(date +%Y%m%d).sql

# 파일 시스템 백업
tar -czf moodle_files_backup_$(date +%Y%m%d).tar.gz /path/to/moodle
```

### 2.2 Moodle 버전 확인

```bash
cd /path/to/moodle
grep '$version' version.php
```

출력 예:
```php
$version  = 2017111300.00;  // Moodle 3.4
```

### 2.3 PHP 버전 확인

```bash
php -v
```

출력 예:
```
PHP 7.1.9 (cli) (built: Aug 30 2017 19:09:57)
```

### 2.4 MySQL 버전 확인

```bash
mysql --version
```

출력 예:
```
mysql  Ver 14.14 Distrib 5.7.19, for Linux (x86_64)
```

---

## 3. 설치 단계

### 방법 1: Git을 사용한 설치 (권장)

#### 3.1 플러그인 다운로드

```bash
cd /path/to/moodle/local
git clone https://github.com/your-repo/moodle-local_jumpdetect.git jumpdetect
```

#### 3.2 파일 권한 설정

```bash
cd /path/to/moodle/local/jumpdetect
chown -R www-data:www-data .
chmod -R 755 .
```

### 방법 2: ZIP 파일을 사용한 설치

#### 3.1 ZIP 다운로드 및 압축 해제

```bash
cd /path/to/moodle/local
wget https://github.com/your-repo/moodle-local_jumpdetect/archive/main.zip
unzip main.zip
mv moodle-local_jumpdetect-main jumpdetect
```

#### 3.2 파일 권한 설정

```bash
chown -R www-data:www-data jumpdetect
chmod -R 755 jumpdetect
```

### 3.3 디렉토리 구조 확인

설치 후 다음 구조가 생성되어야 합니다:

```
/path/to/moodle/local/jumpdetect/
├── version.php
├── db/
│   ├── install.xml
│   ├── events.php
│   └── access.php
├── classes/
│   ├── observer.php
│   └── detector.php
├── lang/
│   ├── en/
│   │   └── local_jumpdetect.php
│   └── ko/
│       └── local_jumpdetect.php
├── index.php
├── styles.css
└── README.md
```

### 3.4 Moodle 플러그인 설치

#### 웹 인터페이스 방법

1. **관리자 로그인**
   - Moodle에 관리자로 로그인

2. **알림 페이지 접속**
   - `사이트 관리` → `알림`
   - 또는 직접 URL: `https://your-moodle-site.com/admin/index.php`

3. **플러그인 감지**
   - Moodle이 자동으로 새 플러그인 감지
   - "Jump Reasoning Detection" 플러그인 표시 확인

4. **데이터베이스 업그레이드**
   - `데이터베이스 업그레이드` 버튼 클릭
   - 진행 상황 확인

5. **설치 완료 확인**
   - "플러그인이 성공적으로 설치되었습니다" 메시지 확인

#### CLI 방법 (고급 사용자)

```bash
cd /path/to/moodle
php admin/cli/upgrade.php
```

출력 예:
```
== Upgrading Moodle database ==
Upgrading 'local_jumpdetect' plugin...
Creating table jumpdetect_tracking... OK
Creating table jumpdetect_patterns... OK
Creating table jumpdetect_alerts... OK
Creating table jumpdetect_course_paths... OK
== Upgrade completed ==
```

### 3.5 데이터베이스 테이블 확인

```bash
mysql -u root -p moodle_db
```

```sql
SHOW TABLES LIKE 'mdl_jumpdetect%';
```

출력 예:
```
+--------------------------------------+
| Tables_in_moodle_db (mdl_jumpdetect%)|
+--------------------------------------+
| mdl_jumpdetect_alerts                |
| mdl_jumpdetect_course_paths          |
| mdl_jumpdetect_patterns              |
| mdl_jumpdetect_tracking              |
+--------------------------------------+
4 rows in set (0.00 sec)
```

---

## 4. 설정 및 구성

### 4.1 플러그인 설정 페이지

1. `사이트 관리` → `플러그인` → `로컬 플러그인` → `Jump Reasoning Detection`

2. 설정 항목:

#### 순차적 건너뛰기 임계값
```
기본값: 1
설명: 몇 개의 모듈을 건너뛸 때 감지할지 설정
권장값: 1-2
```

#### 시간 이상 Z-Score 임계값
```
기본값: -2.0
설명: 표준편차 기준 얼마나 빠르면 이상으로 볼지 설정
권장값: -2.0 ~ -1.5
```

#### 최소 학습 시간
```
기본값: 60 (초)
설명: 모듈 완료에 필요한 최소 시간
권장값: 60-300 (1-5분)
```

### 4.2 권한 설정

#### 교사에게 권한 부여

`사이트 관리` → `사용자` → `권한` → `역할 정의`

**Teacher 역할**:
- ✅ `local/jumpdetect:view` (대시보드 보기)
- ❌ `local/jumpdetect:configure` (설정은 편집교사만)

**Editing Teacher 역할**:
- ✅ `local/jumpdetect:view`
- ✅ `local/jumpdetect:configure`

### 4.3 코스별 학습 경로 설정

#### 활동 완료 조건 설정

1. 코스 페이지 이동
2. `코스 관리` → `편집 모드 켜기`
3. 각 활동의 `편집` → `활동 완료 설정`

설정 예:
```
□ 학생이 활동을 완료로 수동 표시 가능
☑ 다음 조건에 따라 활동이 완료로 표시:
   ☑ 학생이 이 활동을 조회해야 함
   ☑ 학생이 점수를 받아야 함
```

#### 선수 학습 조건 설정

1. 활동 설정 → `접근 제한`
2. `제한 추가` → `활동 완료`
3. 선수 활동 선택

예시:
```
이 활동에 접근하려면:
- "Module 1: Introduction" 활동을 완료해야 함
- "Quiz 1: Basics" 점수가 60% 이상이어야 함
```

---

## 5. 테스트 및 검증

### 5.1 기능 테스트

#### 테스트 1: 순차적 건너뛰기 감지

1. **테스트 코스 생성**
   ```
   Course: Test Jump Detection
   Module 1: Introduction
   Module 2: Basics
   Module 3: Intermediate
   Module 4: Advanced
   ```

2. **테스트 시나리오**
   - 학생 계정으로 로그인
   - Module 1 완료
   - Module 2, 3 건너뛰고 Module 4 접근

3. **검증**
   - 교사 대시보드에서 알림 확인
   - "순차적 건너뛰기" 유형 확인
   - 점프 점수 계산 확인 (2개 건너뛰기 = 4점)

#### 테스트 2: 시간 비정상 패턴 감지

1. **테스트 시나리오**
   - 학생 계정으로 로그인
   - Module 1 접근
   - 10초 후 바로 완료 표시

2. **검증**
   - 대시보드에서 "시간 비정상 패턴" 알림 확인
   - Z-Score 값 확인

#### 테스트 3: 선수 학습 누락 감지

1. **선수 조건 설정**
   - Module 2의 선수 조건: Module 1 완료

2. **테스트 시나리오**
   - 학생 계정으로 로그인
   - Module 1 건너뛰고 Module 2 접근 시도

3. **검증**
   - Moodle 접근 제한 메시지 확인
   - 만약 접근했다면 "선수 학습 누락" 알림 확인

### 5.2 데이터베이스 검증

```sql
-- 추적 데이터 확인
SELECT * FROM mdl_jumpdetect_tracking
ORDER BY timecreated DESC LIMIT 10;

-- 감지된 패턴 확인
SELECT u.firstname, u.lastname, p.jump_type, p.jump_score, p.severity
FROM mdl_jumpdetect_patterns p
JOIN mdl_user u ON p.userid = u.id
ORDER BY p.detected_at DESC LIMIT 10;

-- 알림 확인
SELECT u.firstname, u.lastname, a.alert_type, a.message
FROM mdl_jumpdetect_alerts a
JOIN mdl_user u ON a.userid = u.id
WHERE a.is_read = 0
ORDER BY a.timecreated DESC;
```

### 5.3 성능 테스트

#### 부하 테스트 (선택사항)

```bash
# Apache Bench를 사용한 부하 테스트
ab -n 100 -c 10 https://your-moodle-site.com/local/jumpdetect/index.php?courseid=2
```

출력 예:
```
Requests per second:    15.23 [#/sec] (mean)
Time per request:       65.66 [ms] (mean)
```

---

## 6. 문제 해결

### 6.1 플러그인이 감지되지 않음

**증상**: 알림 페이지에서 플러그인이 표시되지 않음

**해결 방법**:

```bash
# 1. 캐시 삭제
rm -rf /path/to/moodle/cache/*

# 2. 권한 확인
ls -la /path/to/moodle/local/jumpdetect

# 3. version.php 파일 확인
cat /path/to/moodle/local/jumpdetect/version.php

# 4. 강제 업그레이드
php admin/cli/upgrade.php --non-interactive
```

### 6.2 데이터베이스 테이블 생성 실패

**증상**: 업그레이드 중 SQL 오류

**해결 방법**:

```bash
# 1. MySQL 오류 로그 확인
tail -f /var/log/mysql/error.log

# 2. 수동으로 테이블 생성
mysql -u root -p moodle_db < /path/to/moodle/local/jumpdetect/db/install.sql
```

### 6.3 이벤트가 감지되지 않음

**증상**: 학생 활동이 있지만 추적 데이터가 없음

**해결 방법**:

```bash
# 1. 디버그 모드 활성화
# config.php에 추가:
$CFG->debug = E_ALL;
$CFG->debugdisplay = 1;

# 2. 이벤트 옵저버 등록 확인
php admin/cli/scheduled_task.php --list

# 3. 이벤트 리스너 재등록
php admin/cli/uninstall_plugins.php --run
php admin/cli/upgrade.php
```

### 6.4 대시보드가 비어있음

**증상**: 대시보드에 "데이터가 없습니다" 표시

**원인**:
1. 최근 7일간 학생 활동 없음
2. 코스 ID가 잘못됨
3. 권한 문제

**해결 방법**:

```php
// 임시로 시간 범위 확장 (index.php 수정)
$time_threshold = time() - (30 * 24 * 60 * 60); // 7일 → 30일
```

### 6.5 PHP 메모리 부족

**증상**: "Allowed memory size exhausted" 오류

**해결 방법**:

```php
// config.php에 추가
$CFG->extramemorylimit = '512M';
```

또는 PHP 설정 수정:

```bash
# php.ini
memory_limit = 512M
```

### 6.6 성능 저하

**증상**: 대시보드 로딩이 느림

**해결 방법**:

```sql
-- 데이터베이스 인덱스 확인
SHOW INDEX FROM mdl_jumpdetect_tracking;

-- 오래된 데이터 정리 (90일 이상)
DELETE FROM mdl_jumpdetect_tracking
WHERE timecreated < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY));

-- 테이블 최적화
OPTIMIZE TABLE mdl_jumpdetect_tracking;
OPTIMIZE TABLE mdl_jumpdetect_patterns;
```

---

## 7. 제거 방법

플러그인을 완전히 제거하려면:

### 7.1 웹 인터페이스

1. `사이트 관리` → `플러그인` → `플러그인 개요`
2. "Jump Reasoning Detection" 찾기
3. `제거` 버튼 클릭
4. 확인

### 7.2 CLI 방법

```bash
cd /path/to/moodle
php admin/cli/uninstall_plugins.php --plugins=local_jumpdetect --run
```

### 7.3 수동 제거

```bash
# 1. 파일 삭제
rm -rf /path/to/moodle/local/jumpdetect

# 2. 데이터베이스 테이블 삭제
mysql -u root -p moodle_db -e "
DROP TABLE mdl_jumpdetect_tracking;
DROP TABLE mdl_jumpdetect_patterns;
DROP TABLE mdl_jumpdetect_alerts;
DROP TABLE mdl_jumpdetect_course_paths;
"

# 3. 캐시 삭제
rm -rf /path/to/moodle/cache/*

# 4. Moodle 업그레이드
php admin/cli/upgrade.php
```

---

## 8. 지원 및 문의

- **GitHub Issues**: https://github.com/your-repo/moodle-local_jumpdetect/issues
- **문서**: https://github.com/your-repo/moodle-local_jumpdetect/wiki
- **이메일**: support@kaist-touchmath.edu

---

## 부록 A: 체크리스트

설치 완료 후 다음 항목을 확인하세요:

- [ ] Moodle 버전 3.4 이상
- [ ] PHP 7.1.9 이상
- [ ] MySQL 5.7 이상
- [ ] 플러그인 파일 복사 완료
- [ ] 파일 권한 설정 (755)
- [ ] 데이터베이스 업그레이드 완료
- [ ] 4개 테이블 생성 확인
- [ ] 이벤트 옵저버 등록 확인
- [ ] 교사 권한 설정 완료
- [ ] 대시보드 접속 확인
- [ ] 테스트 코스에서 기능 검증

---

**설치가 완료되었습니다! 🎉**

이제 [README.md](../moodle-plugin/local/jumpdetect/README.md)를 참고하여 플러그인을 사용하세요.
