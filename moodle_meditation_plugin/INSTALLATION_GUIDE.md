# Meditation Routine Plugin - 설치 가이드
# Installation Guide for Moodle 3.7

## 목차 (Table of Contents)

1. [시스템 요구사항](#시스템-요구사항)
2. [설치 전 준비](#설치-전-준비)
3. [설치 단계](#설치-단계)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [초기 구성](#초기-구성)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항 (System Requirements)

### 필수 사항 (Required)

- **Moodle**: 3.7 이상 (tested up to 3.11)
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상 또는 MariaDB 10.2 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+

### 권장 사항 (Recommended)

- PHP 7.4 이상
- MySQL 8.0 또는 MariaDB 10.5
- HTTPS 지원
- Moodle cron 설정

### 브라우저 지원 (Browser Support)

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

---

## 설치 전 준비 (Pre-installation)

### 1. 백업 생성

설치 전 반드시 백업을 생성하세요:

```bash
# 데이터베이스 백업
mysqldump -u [username] -p [database_name] > moodle_backup_$(date +%Y%m%d).sql

# Moodle 파일 백업
tar -czf moodle_files_backup_$(date +%Y%m%d).tar.gz /path/to/moodle
```

### 2. 권한 확인

Moodle 디렉토리에 쓰기 권한이 있는지 확인:

```bash
ls -la /path/to/moodle/local/
```

웹 서버 사용자 (예: www-data, apache)가 쓰기 권한을 가져야 합니다.

### 3. Moodle 버전 확인

```bash
# Moodle CLI로 버전 확인
php /path/to/moodle/admin/cli/version.php
```

---

## 설치 단계 (Installation Steps)

### 방법 1: 직접 복사 (Recommended)

#### 단계 1: 플러그인 파일 복사

```bash
# Moodle 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/moodle_meditation_plugin/local/meditation_routine local/

# 권한 설정
chown -R www-data:www-data local/meditation_routine
chmod -R 755 local/meditation_routine
```

#### 단계 2: 파일 확인

다음 파일들이 올바르게 복사되었는지 확인:

```bash
local/meditation_routine/
├── amd/
│   └── src/
│       └── meditation_routine.js
├── classes/
│   ├── external/
│   │   ├── check_should_show.php
│   │   └── log_session.php
│   └── meditation_manager.php
├── db/
│   ├── install.xml
│   └── services.php
├── lang/
│   └── en/
│       └── local_meditation_routine.php
├── lib.php
├── styles.css
└── version.php
```

#### 단계 3: Moodle 데이터베이스 업그레이드

**웹 인터페이스 방법:**

1. 관리자로 Moodle에 로그인
2. "Site administration > Notifications" 방문
3. "Upgrade database now" 클릭
4. 설치 완료 메시지 확인

**CLI 방법 (권장):**

```bash
php admin/cli/upgrade.php

# 또는 비대화형 모드
php admin/cli/upgrade.php --non-interactive
```

### 방법 2: ZIP 업로드

#### 단계 1: ZIP 파일 생성

```bash
cd /path/to/moodle_meditation_plugin/local
zip -r meditation_routine.zip meditation_routine/
```

#### 단계 2: Moodle에서 업로드

1. Moodle 관리자로 로그인
2. "Site administration > Plugins > Install plugins" 이동
3. "Choose a file..." 클릭하여 ZIP 파일 선택
4. "Install plugin from the ZIP file" 클릭
5. 설치 확인 페이지에서 "Install plugin" 클릭

---

## 데이터베이스 설정 (Database Setup)

### 자동 설치 확인

설치 후 다음 테이블이 생성되었는지 확인:

```sql
-- MySQL 콘솔에서 실행
USE moodle_database;

SHOW TABLES LIKE 'mdl_local_meditation%';

-- 결과:
-- mdl_local_meditation_sessions
-- mdl_local_meditation_settings
```

### 테이블 구조 확인

```sql
-- Sessions 테이블
DESCRIBE mdl_local_meditation_sessions;

-- Settings 테이블
DESCRIBE mdl_local_meditation_settings;
```

### 수동 설치 (필요한 경우)

자동 설치가 실패한 경우 수동으로 실행:

```sql
-- Sessions 테이블
CREATE TABLE mdl_local_meditation_sessions (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    userid BIGINT(10) UNSIGNED NOT NULL,
    quizid BIGINT(10) UNSIGNED NOT NULL,
    attemptid BIGINT(10) UNSIGNED NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    duration INT(5) DEFAULT 5,
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    INDEX idx_userid (userid),
    INDEX idx_quizid (quizid),
    INDEX idx_attemptid (attemptid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Settings 테이블
CREATE TABLE mdl_local_meditation_settings (
    id BIGINT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quizid BIGINT(10) UNSIGNED NOT NULL UNIQUE,
    enabled TINYINT(1) DEFAULT 1,
    complexity_threshold INT(1) DEFAULT 4,
    duration INT(5) DEFAULT 5,
    animation_style VARCHAR(20) DEFAULT 'breathing',
    INDEX idx_quizid (quizid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 초기 구성 (Initial Configuration)

### 1. 플러그인 활성화 확인

```bash
# Moodle CLI로 확인
php admin/cli/cfg.php --name=local_meditation_routine
```

### 2. 테스트 퀴즈 생성

1. 코스로 이동
2. "Add an activity or resource" > "Quiz" 선택
3. 퀴즈 설정에서 "Meditation Routine" 섹션 확인
4. 다음 설정 적용:
   - Enable meditation routine: ✅
   - Complexity threshold: 4
   - Meditation duration: 5초
   - Animation style: Breathing

### 3. 테스트 문제 추가

복잡한 문제 생성:

1. 문제 유형: Essay 또는 Calculated
2. 태그 추가: `complexity:5`
3. 저장

### 4. JavaScript 컴파일 (Moodle 3.8+)

AMD 모듈을 사용하는 경우:

```bash
# Grunt로 JavaScript 빌드 (선택사항)
cd /path/to/moodle
npm install
grunt amd --force
```

---

## 테스트 (Testing)

### 1. 기본 기능 테스트

학생 계정으로 로그인하여:

1. 명상 루틴이 활성화된 퀴즈 시작
2. 복잡한 문제 앞에서 명상 화면 표시 확인
3. 5초 카운트다운 작동 확인
4. "건너뛰기" 버튼 작동 확인
5. 자동으로 문제로 이동하는지 확인

### 2. 데이터베이스 로깅 확인

```sql
-- 명상 세션 로그 확인
SELECT * FROM mdl_local_meditation_sessions
ORDER BY timecreated DESC
LIMIT 10;

-- 퀴즈 설정 확인
SELECT * FROM mdl_local_meditation_settings;
```

### 3. 브라우저 콘솔 확인

개발자 도구 (F12) 열고:
- Console 탭에서 JavaScript 오류 확인
- Network 탭에서 AJAX 호출 확인

---

## 문제 해결 (Troubleshooting)

### 문제 1: 명상 화면이 표시되지 않음

**원인:**
- 플러그인 미활성화
- JavaScript 로드 실패
- 퀴즈 설정 문제

**해결:**

```bash
# 캐시 정리
php admin/cli/purge_caches.php

# 브라우저 콘솔에서 JavaScript 오류 확인
# 퀴즈 설정에서 "Enable meditation routine" 확인
```

### 문제 2: 데이터베이스 오류

**원인:**
- 테이블 생성 실패
- 권한 문제

**해결:**

```sql
-- 테이블 존재 확인
SHOW TABLES LIKE 'mdl_local_meditation%';

-- 없으면 수동 생성 (위의 SQL 참조)

-- 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';
```

### 문제 3: CSS 스타일 미적용

**원인:**
- CSS 파일 경로 오류
- 캐시 문제

**해결:**

```bash
# 파일 존재 확인
ls -la local/meditation_routine/styles.css

# 캐시 정리
php admin/cli/purge_caches.php

# 브라우저 캐시 강제 새로고침 (Ctrl+Shift+R)
```

### 문제 4: AJAX 호출 실패

**원인:**
- 웹 서비스 미등록
- 세션 문제

**해결:**

```php
// db/services.php 파일 확인
// Web services 재등록
php admin/cli/upgrade.php --non-interactive
```

### 문제 5: 권한 오류

**원인:**
- 파일 권한 문제
- 사용자 capability 문제

**해결:**

```bash
# 파일 권한 수정
chown -R www-data:www-data local/meditation_routine
chmod -R 755 local/meditation_routine

# Capability 확인 (관리자 도구)
# Site administration > Users > Permissions > Check permissions
```

---

## 제거 (Uninstallation)

플러그인 제거가 필요한 경우:

### 웹 인터페이스

1. "Site administration > Plugins > Plugins overview"
2. "Meditation Routine" 찾기
3. "Uninstall" 클릭
4. 확인

### CLI (권장)

```bash
# 플러그인 제거
php admin/cli/uninstall_plugins.php --plugins=local_meditation_routine

# 파일 삭제
rm -rf local/meditation_routine

# 캐시 정리
php admin/cli/purge_caches.php
```

---

## 업그레이드 (Upgrading)

새 버전으로 업그레이드:

1. 백업 생성 (위의 "백업 생성" 참조)
2. 새 버전 파일로 덮어쓰기
3. Moodle 업그레이드 실행:

```bash
php admin/cli/upgrade.php
```

---

## 체크리스트 (Installation Checklist)

설치 완료 확인:

- [ ] 시스템 요구사항 충족
- [ ] 백업 생성 완료
- [ ] 플러그인 파일 복사 완료
- [ ] 데이터베이스 업그레이드 성공
- [ ] 테이블 생성 확인
- [ ] 테스트 퀴즈 생성
- [ ] 명상 루틴 표시 확인
- [ ] 로깅 작동 확인
- [ ] 브라우저 호환성 확인

---

## 추가 도움말 (Additional Help)

- **문서**: README.md 참조
- **FAQ**: MEDITATION_ROUTINE_FEATURE.md 참조
- **지원**: GitHub Issues

---

**설치가 완료되었습니다! 🎉**

학생들이 더 나은 학습 경험을 할 수 있기를 바랍니다.
