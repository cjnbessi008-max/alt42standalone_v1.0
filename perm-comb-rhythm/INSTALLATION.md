# Perm-Comb Rhythm 설치 가이드

## 사전 준비

### 시스템 확인
```bash
# PHP 버전 확인 (7.1.9 이상 필요)
php -v

# MySQL 버전 확인 (5.7 이상 필요)
mysql --version

# Moodle 버전 확인
cat /path/to/moodle/version.php | grep "\$release"
```

### 필요한 PHP 확장
```bash
php -m | grep -E 'mysqli|json|mbstring|zip|gd'
```

## 단계별 설치

### 1단계: 파일 준비

```bash
# 작업 디렉토리로 이동
cd /tmp

# 플러그인 파일 압축 (GitHub에서 다운로드한 경우)
# 또는 제공된 파일 사용

# Moodle 디렉토리 확인
MOODLE_DIR="/var/www/html/moodle"  # 실제 경로로 변경
cd $MOODLE_DIR
```

### 2단계: 플러그인 복사

```bash
# mod 디렉토리로 이동
cd $MOODLE_DIR/mod

# 플러그인 디렉토리 생성
mkdir -p permcombrhythm

# 파일 복사 (소스 경로는 실제 위치로 변경)
cp -r /path/to/perm-comb-rhythm/moodle-plugin/* permcombrhythm/

# 디렉토리 구조 확인
ls -la permcombrhythm/
```

예상 출력:
```
drwxr-xr-x 5 www-data www-data 4096 Nov 18 10:00 .
drwxr-xr-x 45 www-data www-data 4096 Nov 18 10:00 ..
drwxr-xr-x 2 www-data www-data 4096 Nov 18 10:00 app
drwxr-xr-x 2 www-data www-data 4096 Nov 18 10:00 db
drwxr-xr-x 3 www-data www-data 4096 Nov 18 10:00 lang
-rw-r--r-- 1 www-data www-data 3245 Nov 18 10:00 lib.php
-rw-r--r-- 1 www-data www-data 2156 Nov 18 10:00 api.php
-rw-r--r-- 1 www-data www-data 1543 Nov 18 10:00 view.php
-rw-r--r-- 1 www-data www-data  456 Nov 18 10:00 version.php
```

### 3단계: 권한 설정

```bash
# 소유자 변경 (웹 서버 사용자로)
# Apache 사용 시: www-data
# Nginx 사용 시: nginx 또는 www-data
chown -R www-data:www-data permcombrhythm

# 권한 설정
chmod -R 755 permcombrhythm

# 특정 파일 실행 권한
chmod 644 permcombrhythm/*.php
```

### 4단계: Moodle 플러그인 설치

#### 웹 인터페이스 방법 (권장)

1. 웹 브라우저에서 Moodle 사이트 접속
2. 관리자로 로그인
3. `사이트 관리` > `알림` 페이지 자동 이동
4. "Perm-Comb Rhythm" 플러그인 발견 확인
5. "데이터베이스 업그레이드" 버튼 클릭
6. 설치 진행 상황 확인
7. "계속" 버튼 클릭

#### CLI 방법 (고급)

```bash
cd $MOODLE_DIR

# 플러그인 확인
php admin/cli/uninstall_plugins.php --show=mod_permcombrhythm

# 업그레이드 실행
php admin/cli/upgrade.php --non-interactive

# 결과 확인
php admin/cli/plugin_status.php | grep permcombrhythm
```

### 5단계: 데이터베이스 확인

```bash
# MySQL 접속
mysql -u moodle_user -p moodle_db

# 테이블 확인
SHOW TABLES LIKE 'mdl_permcombrhythm%';
```

예상 결과:
```
+---------------------------------------+
| Tables_in_moodle (mdl_permcombrhythm%) |
+---------------------------------------+
| mdl_permcombrhythm                    |
| mdl_permcombrhythm_attempts           |
+---------------------------------------+
```

테이블 구조 확인:
```sql
DESC mdl_permcombrhythm;
DESC mdl_permcombrhythm_attempts;
```

### 6단계: 권한 확인

```bash
# Moodle 관리자로 로그인
# 사이트 관리 > 사용자 > 권한 > 권한 정의

# permcombrhythm 권한 확인:
# - mod/permcombrhythm:addinstance (활동 추가)
# - mod/permcombrhythm:view (보기)
# - mod/permcombrhythm:submit (제출)
```

## 테스트

### 1. 활동 생성 테스트

1. 테스트 코스 생성 또는 기존 코스 사용
2. 편집 모드 켜기
3. "활동 또는 리소스 추가" 클릭
4. "Perm-Comb Rhythm" 선택
5. 설정 입력:
   ```
   이름: 순열조합 테스트
   난이도: 2
   문제 유형: 혼합
   ```
6. "저장 후 표시" 클릭

### 2. 기능 테스트

1. 학생 계정으로 로그인 (또는 학생으로 전환)
2. 생성한 활동 접속
3. 우측 하단 스마트폰 화면 확인
4. "▶ 리듬 재생" 버튼 클릭
   - 애니메이션 표시 확인
   - 소리 재생 확인
5. 답 입력 및 제출
6. 피드백 확인
7. "다음 문제" 클릭

### 3. API 테스트

브라우저 개발자 도구 콘솔에서:

```javascript
// 문제 가져오기 테스트
fetch('/mod/permcombrhythm/api.php?action=getproblem&id=1')
  .then(r => r.json())
  .then(console.log);

// 통계 가져오기 테스트
fetch('/mod/permcombrhythm/api.php?action=getstats&id=1')
  .then(r => r.json())
  .then(console.log);
```

## 문제 해결

### 문제 1: "플러그인이 발견되지 않습니다"

**원인:** 파일이 올바른 위치에 없음

**해결:**
```bash
cd $MOODLE_DIR/mod
ls -la permcombrhythm/version.php

# version.php가 없으면 경로가 잘못됨
# 올바른 구조: mod/permcombrhythm/version.php
```

### 문제 2: "데이터베이스 오류"

**원인:** MySQL 권한 또는 스키마 문제

**해결:**
```sql
-- MySQL에서 권한 확인
SHOW GRANTS FOR 'moodle_user'@'localhost';

-- 필요 시 권한 부여
GRANT ALL PRIVILEGES ON moodle_db.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 3: "Permission denied"

**원인:** 파일 권한 문제

**해결:**
```bash
# 웹 서버 사용자 확인
ps aux | grep -E 'apache|nginx|httpd'

# 권한 재설정
chown -R www-data:www-data $MOODLE_DIR/mod/permcombrhythm
chmod -R 755 $MOODLE_DIR/mod/permcombrhythm
```

### 문제 4: "빈 화면 또는 500 오류"

**원인:** PHP 오류

**해결:**
```bash
# PHP 오류 로그 확인
tail -f /var/log/apache2/error.log  # Apache
tail -f /var/log/nginx/error.log    # Nginx

# Moodle 디버깅 활성화
# 사이트 관리 > 개발 > 디버깅
# 디버그 메시지: DEVELOPER (가장 상세)
```

### 문제 5: "iframe이 표시되지 않음"

**원인:** X-Frame-Options 또는 CORS

**해결:**

`.htaccess` 또는 Nginx 설정:
```apache
# Apache
Header always unset X-Frame-Options

# Nginx
add_header X-Frame-Options "SAMEORIGIN";
```

## 업그레이드

### 플러그인 업그레이드 (v1.0 → v1.1)

```bash
# 백업
cp -r $MOODLE_DIR/mod/permcombrhythm $MOODLE_DIR/mod/permcombrhythm.backup

# 새 파일 복사
cp -r /path/to/new/moodle-plugin/* $MOODLE_DIR/mod/permcombrhythm/

# 권한 재설정
chown -R www-data:www-data $MOODLE_DIR/mod/permcombrhythm
chmod -R 755 $MOODLE_DIR/mod/permcombrhythm

# 웹에서 업그레이드 실행
# 또는 CLI:
php $MOODLE_DIR/admin/cli/upgrade.php
```

## 제거

### 플러그인 완전 제거

#### 웹 인터페이스

1. `사이트 관리` > `플러그인` > `플러그인 개요`
2. "Perm-Comb Rhythm" 찾기
3. "제거" 클릭
4. 확인

#### CLI

```bash
cd $MOODLE_DIR

# 플러그인 제거
php admin/cli/uninstall_plugins.php --plugins=mod_permcombrhythm --run

# 파일 삭제
rm -rf mod/permcombrhythm
```

#### 수동 제거

```sql
-- 데이터베이스 정리
DROP TABLE IF EXISTS mdl_permcombrhythm_attempts;
DROP TABLE IF EXISTS mdl_permcombrhythm;

DELETE FROM mdl_config_plugins WHERE plugin = 'mod_permcombrhythm';
DELETE FROM mdl_capabilities WHERE component = 'mod_permcombrhythm';
```

```bash
# 파일 삭제
rm -rf $MOODLE_DIR/mod/permcombrhythm
```

## 프로덕션 배포 체크리스트

- [ ] 백업 완료 (데이터베이스 + 파일)
- [ ] PHP/MySQL 버전 확인
- [ ] 테스트 서버에서 설치 테스트 완료
- [ ] 권한 올바르게 설정
- [ ] 플러그인 설치 성공 확인
- [ ] 모든 기능 테스트 완료
- [ ] 오류 로그 확인
- [ ] 성능 테스트 (동시 사용자 10명+)
- [ ] 모바일 브라우저 테스트
- [ ] HTTPS 활성화 (Web Audio API용)
- [ ] 백업 전략 수립

## 추가 설정

### HTTPS 설정 (권장)

Web Audio API는 HTTPS 환경에서 더 안정적으로 작동합니다.

```bash
# Let's Encrypt SSL 인증서 설치
sudo certbot --apache -d your-moodle-domain.com
```

### 성능 최적화

```php
// config.php에 추가
$CFG->cachejs = true;
$CFG->yuicomboloading = true;
```

### 캐싱 설정

`사이트 관리` > `플러그인` > `캐싱` > `설정`
- Application cache: File system
- Session cache: File system

## 지원

문제가 해결되지 않으면:
1. Moodle 오류 로그 확인
2. PHP 오류 로그 확인
3. 브라우저 콘솔 확인
4. 이슈 등록: [GitHub Issues]

---

설치 완료! 🎉
