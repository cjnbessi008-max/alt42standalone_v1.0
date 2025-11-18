# 설치 가이드 (Installation Guide)

## Moodle Confidence Reasoning Plugin

이 문서는 Moodle 3.7 LMS에 Confidence Reasoning 플러그인을 설치하는 상세 가이드입니다.

---

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [설치 단계](#설치-단계)
3. [설정 및 구성](#설정-및-구성)
4. [테스트](#테스트)
5. [문제 해결](#문제-해결)
6. [제거 방법](#제거-방법)

---

## 사전 요구사항

### 시스템 요구사항
- **Moodle**: 3.7.0 이상 (권장: 3.7.9)
- **PHP**: 7.1.9 이상 (권장: 7.1.33)
- **MySQL**: 5.7 이상 (또는 MariaDB 10.2+)
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **브라우저**: Chrome 70+, Firefox 65+, Safari 12+, Edge 79+

### 필요한 접근 권한
- Moodle 서버 파일 시스템 접근 (SSH 또는 FTP)
- Moodle 관리자 계정 접근
- 데이터베이스 권한 (테이블 생성)

### 사전 확인 사항

```bash
# PHP 버전 확인
php -v
# 예상 출력: PHP 7.1.9 (cli) ...

# MySQL 버전 확인
mysql --version
# 예상 출력: mysql  Ver 15.1 Distrib 5.7.x ...

# Moodle 버전 확인
cat /path/to/moodle/version.php | grep release
# 예상 출력: $release  = '3.7.x ...
```

---

## 설치 단계

### 방법 1: 직접 파일 복사 (권장)

#### 1단계: 파일 복사

```bash
# 플러그인 소스 디렉토리
cd /path/to/moodle-plugin

# Moodle 설치 디렉토리로 플러그인 복사
sudo cp -r local/confidencereasoning /var/www/html/moodle/local/

# 파일 소유권 설정 (웹 서버 사용자에 맞게 조정)
sudo chown -R www-data:www-data /var/www/html/moodle/local/confidencereasoning

# 파일 권한 설정
sudo chmod -R 755 /var/www/html/moodle/local/confidencereasoning
```

#### 2단계: 플러그인 감지 및 설치

**웹 인터페이스 방법:**

1. Moodle 사이트에 관리자로 로그인
2. **Site administration** → **Notifications** 접속
3. "Plugins requiring attention" 섹션에서 플러그인 확인:
   ```
   local_confidencereasoning - Confidence Reasoning Tracker
   Version: 2025111800
   Status: To be installed
   ```
4. **Upgrade Moodle database now** 버튼 클릭
5. 설치 과정 확인:
   - 데이터베이스 테이블 생성 (`mdl_local_confidence_reasoning`, `mdl_local_confidence_stats`)
   - 권한(capabilities) 등록
   - 웹 서비스 등록
6. **Continue** 클릭하여 완료

**CLI 방법 (선호):**

```bash
# Moodle 루트 디렉토리로 이동
cd /var/www/html/moodle

# 업그레이드 스크립트 실행
sudo -u www-data php admin/cli/upgrade.php

# 비대화형 모드 (스크립트 실행)
sudo -u www-data php admin/cli/upgrade.php --non-interactive
```

예상 출력:
```
== Upgrading Moodle database ==
...
+ local/confidencereasoning
  → Installing local_confidencereasoning
  → Creating table local_confidence_reasoning... done
  → Creating table local_confidence_stats... done
  → Adding indexes... done
  → Registering capabilities... done
...
Upgrade completed successfully.
```

#### 3단계: JavaScript 캐시 정리

```bash
# Moodle 캐시 완전 삭제
sudo -u www-data php admin/cli/purge_caches.php

# AMD JavaScript 재컴파일 (자동)
# 브라우저에서 Shift+F5로 강력 새로고침
```

---

### 방법 2: Git을 통한 설치

```bash
# Moodle local 디렉토리로 이동
cd /var/www/html/moodle/local

# Git 클론 (실제 리포지토리 URL로 변경)
sudo git clone https://github.com/your-repo/moodle-local-confidencereasoning.git confidencereasoning

# 소유권 설정
sudo chown -R www-data:www-data confidencereasoning

# 이후 방법 1의 2-3단계 동일하게 진행
```

---

## 설정 및 구성

### 1. 권한 확인

**Site administration** → **Users** → **Permissions** → **Define roles**

각 역할에 대한 권한 확인:

| 권한 | Student | Teacher | Manager |
|------|---------|---------|---------|
| `local/confidencereasoning:submit` | ✓ | ✓ | ✓ |
| `local/confidencereasoning:view` | ✗ | ✓ | ✓ |
| `local/confidencereasoning:viewstats` | ✗ | ✓ | ✓ |
| `local/confidencereasoning:manage` | ✗ | ✗ | ✓ |

### 2. 웹 서비스 활성화

**Site administration** → **Server** → **Web services** → **Overview**

1. **Enable web services** 체크
2. **Enable protocols** → REST protocol 활성화
3. **Create a specific user** (선택사항)
4. **Select a service** → "Moodle mobile web service" 확인

### 3. AJAX 활성화

**Site administration** → **Appearance** → **AJAX and Javascript**

- "Enable AJAX" 체크 (기본적으로 활성화되어 있음)

---

## 테스트

### 1. 플러그인 설치 확인

```bash
# 데이터베이스 테이블 확인
mysql -u moodleuser -p moodledb

mysql> SHOW TABLES LIKE '%confidence%';
+--------------------------------------+
| Tables_in_moodledb (%confidence%)    |
+--------------------------------------+
| mdl_local_confidence_reasoning       |
| mdl_local_confidence_stats           |
+--------------------------------------+
2 rows in set (0.00 sec)

mysql> DESCRIBE mdl_local_confidence_reasoning;
# 스키마 확인

mysql> exit;
```

### 2. 기능 테스트

#### 학생 계정으로 테스트:

1. 테스트용 퀴즈 생성 (교사 계정)
   - **Course** → **Add an activity** → **Quiz**
   - 문제 2-3개 추가

2. 학생 계정으로 퀴즈 응시
   - 각 문제 아래 확신도 입력 UI 확인:
     - 슬라이더 (1-5)
     - 드롭다운 (카테고리)
     - 텍스트 영역 (이유)

3. 답변 제출
   - 브라우저 개발자 도구 (F12) → Network 탭
   - AJAX 요청 확인:
     ```
     POST /webservice/ajax/service.php
     methodname: local_confidencereasoning_save_confidence_data
     ```

#### 교사 계정으로 테스트:

1. 리포트 페이지 접속:
   ```
   https://your-moodle-site/local/confidencereasoning/report.php?quizid=123
   ```
   (퀴즈 ID는 실제 값으로 변경)

2. 데이터 확인:
   - 전체 학생 통계 테이블
   - 개별 학생 클릭 → 상세 리포트

### 3. 에러 로그 확인

```bash
# PHP 에러 로그
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log

# Moodle 디버그 활성화
# Site administration → Development → Debugging
# Debug messages: DEVELOPER
# Display debug messages: Yes
```

---

## 문제 해결

### 문제 1: "Plugin not found" 오류

**원인**: 파일이 올바른 위치에 없음

**해결**:
```bash
# 파일 위치 확인
ls -la /var/www/html/moodle/local/confidencereasoning/version.php

# version.php가 없으면 경로 수정 필요
```

### 문제 2: JavaScript UI가 표시되지 않음

**원인**: JavaScript 캐시 또는 AMD 컴파일 문제

**해결**:
```bash
# 캐시 삭제
sudo -u www-data php admin/cli/purge_caches.php

# 브라우저 강력 새로고침 (Shift+F5)

# 개발자 도구 콘솔에서 에러 확인
# F12 → Console 탭
```

### 문제 3: AJAX 요청 실패

**원인**: 웹 서비스 미활성화 또는 권한 문제

**해결**:
```php
// config.php에 디버그 추가
$CFG->debug = (E_ALL | E_STRICT);
$CFG->debugdisplay = 1;

// 브라우저에서 Network 탭 확인
// 응답 JSON 에러 메시지 확인
```

### 문제 4: 데이터베이스 테이블 생성 실패

**원인**: MySQL 권한 부족

**해결**:
```sql
-- MySQL에서 권한 확인
SHOW GRANTS FOR 'moodleuser'@'localhost';

-- CREATE 권한이 없으면 부여
GRANT CREATE ON moodledb.* TO 'moodleuser'@'localhost';
FLUSH PRIVILEGES;

-- 업그레이드 재실행
```

### 문제 5: 한국어가 표시되지 않음

**원인**: 언어팩 미설치 또는 경로 문제

**해결**:
```bash
# 언어 파일 확인
ls -la /var/www/html/moodle/local/confidencereasoning/lang/ko/

# Site administration → Language → Language packs
# 한국어 (ko) 설치 확인
```

---

## 제거 방법

### 1. 웹 인터페이스를 통한 제거

1. **Site administration** → **Plugins** → **Plugins overview**
2. "Local plugins" 섹션 찾기
3. **Confidence Reasoning Tracker** 옆 **Uninstall** 클릭
4. 확인 대화상자에서 **Continue** 클릭
5. 데이터베이스 테이블 자동 삭제 확인

### 2. 수동 제거

```bash
# 1. 파일 삭제
sudo rm -rf /var/www/html/moodle/local/confidencereasoning

# 2. 데이터베이스 정리
mysql -u moodleuser -p moodledb

mysql> DROP TABLE IF EXISTS mdl_local_confidence_reasoning;
mysql> DROP TABLE IF EXISTS mdl_local_confidence_stats;
mysql> DELETE FROM mdl_config_plugins WHERE plugin = 'local_confidencereasoning';
mysql> DELETE FROM mdl_capabilities WHERE component = 'local/confidencereasoning';
mysql> exit;

# 3. 캐시 정리
sudo -u www-data php admin/cli/purge_caches.php
```

---

## 추가 구성 (고급)

### 1. 커스텀 언어 스트링

**Site administration** → **Language** → **Language customisation**

원하는 텍스트 수정 가능:
- `local_confidencereasoning.php`
- 예: "How confident are you?" → "당신의 확신도는?"

### 2. 데이터베이스 인덱스 최적화

```sql
-- 대규모 데이터를 위한 추가 인덱스
CREATE INDEX idx_quiz_user ON mdl_local_confidence_reasoning(quizid, userid);
CREATE INDEX idx_timecreated ON mdl_local_confidence_reasoning(timecreated);
```

### 3. 로깅 설정

**Site administration** → **Reports** → **Logs**

- "Standard log" 활성화
- 확신도 제출 이벤트 추적

---

## 지원 및 문의

- **문서**: README.md 참조
- **이슈 리포트**: GitHub Issues
- **이메일**: support@example.com

---

## 체크리스트

설치 완료 확인:

- [ ] 파일이 `/moodle/local/confidencereasoning`에 복사됨
- [ ] 데이터베이스 테이블 생성됨 (2개 테이블)
- [ ] 플러그인이 Site administration → Plugins overview에 표시됨
- [ ] 퀴즈 페이지에서 확신도 UI가 표시됨
- [ ] 학생이 확신도 데이터를 제출할 수 있음
- [ ] 교사가 리포트 페이지에 접근할 수 있음
- [ ] AJAX 요청이 정상 작동함 (개발자 도구 확인)
- [ ] 에러 로그에 오류가 없음

---

**설치 성공을 축하합니다!**
