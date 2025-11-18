# Sampling Game - 설치 가이드

Moodle 3.7+ 환경에서 Sampling Game 플러그인을 설치하는 상세 가이드입니다.

## 전제 조건

### 시스템 요구사항
- **Moodle 버전**: 3.7 이상
- **PHP 버전**: 7.1.9 이상
- **MySQL 버전**: 5.7 이상
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.14+
- **브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

### 필요한 권한
- Moodle 서버 파일 시스템 접근 권한
- Moodle 관리자 계정
- 데이터베이스 관리 권한 (자동 설치의 경우)

## 설치 방법

### 방법 1: ZIP 파일을 통한 설치 (권장)

#### 1단계: ZIP 파일 생성
```bash
cd /path/to/alt42standalone_v1.0
zip -r samplinggame.zip mod/samplinggame/
```

#### 2단계: Moodle에서 설치
1. Moodle 관리자로 로그인
2. **사이트 관리** → **플러그인** → **플러그인 설치**
3. ZIP 파일 업로드
4. "플러그인 유형"에서 **활동 모듈 (mod)** 선택
5. "플러그인 설치" 버튼 클릭
6. 확인 페이지에서 "계속" 클릭
7. 데이터베이스 업그레이드 진행

### 방법 2: 수동 파일 복사

#### 1단계: 파일 복사
```bash
# Moodle 설치 디렉토리 확인
cd /var/www/html/moodle  # 또는 실제 Moodle 경로

# samplinggame 디렉토리 복사
cp -r /path/to/alt42standalone_v1.0/mod/samplinggame ./mod/

# 파일 소유권 설정 (Apache 사용 시)
sudo chown -R www-data:www-data ./mod/samplinggame

# 또는 Nginx 사용 시
sudo chown -R nginx:nginx ./mod/samplinggame

# 파일 권한 설정
sudo chmod -R 755 ./mod/samplinggame
```

#### 2단계: 권한 확인
```bash
# 디렉토리 구조 확인
ls -la ./mod/samplinggame

# 다음과 같은 구조가 보여야 합니다:
# drwxr-xr-x  mod/samplinggame/
# -rw-r--r--  mod/samplinggame/version.php
# -rw-r--r--  mod/samplinggame/lib.php
# ...
```

#### 3단계: 데이터베이스 업그레이드
1. 웹 브라우저에서 Moodle 사이트 접속
2. 자동으로 업그레이드 페이지로 이동
3. 또는 수동으로: **사이트 관리** → **알림**
4. "데이터베이스 업그레이드" 버튼 클릭
5. 진행 과정 확인

### 방법 3: Git을 통한 설치

```bash
# Moodle 디렉토리로 이동
cd /var/www/html/moodle

# Git clone (저장소가 있는 경우)
cd mod
git clone https://github.com/your-repo/samplinggame.git

# 또는 서브모듈로 추가
git submodule add https://github.com/your-repo/samplinggame.git mod/samplinggame

# 권한 설정
sudo chown -R www-data:www-data ./samplinggame
sudo chmod -R 755 ./samplinggame
```

## 설치 확인

### 1. 플러그인 목록 확인
1. **사이트 관리** → **플러그인** → **플러그인 개요**
2. "활동 모듈" 섹션에서 "Sampling Game" 찾기
3. 버전 정보 확인: **v1.0 (2025111800)**

### 2. 데이터베이스 테이블 확인
```sql
-- MySQL/MariaDB에서 실행
USE moodle;  -- 실제 데이터베이스 이름

-- 테이블 존재 확인
SHOW TABLES LIKE 'mdl_samplinggame%';

-- 다음 테이블들이 보여야 합니다:
-- mdl_samplinggame
-- mdl_samplinggame_attempts

-- 스키마 확인
DESCRIBE mdl_samplinggame;
DESCRIBE mdl_samplinggame_attempts;
```

### 3. 권한 확인
```sql
-- 권한 설정 확인
SELECT * FROM mdl_capabilities
WHERE component = 'mod_samplinggame';

-- 다음 권한들이 있어야 합니다:
-- mod/samplinggame:addinstance
-- mod/samplinggame:view
-- mod/samplinggame:submit
-- mod/samplinggame:viewreports
```

### 4. 기능 테스트
1. 테스트 코스 생성
2. "활동 또는 자료 추가" 클릭
3. "Sampling Game" 옵션 확인
4. 테스트 활동 생성
5. 학생 계정으로 게임 실행
6. 시도 제출 및 성적 확인

## 설정 및 커스터마이징

### 기본 설정 변경

#### 1. 플러그인 설정
```
사이트 관리 → 플러그인 → 활동 모듈 → Sampling Game
```

현재 버전에서는 전역 설정이 없지만, 향후 추가될 수 있습니다:
- 기본 모집단 크기
- 기본 제한 시간
- 채점 알고리즘 파라미터

#### 2. 테마 커스터마이징

**CSS 오버라이드** (`theme/yourtheme/style/custom.css`):
```css
/* 스마트폰 프레임 색상 변경 */
.smartphone-frame {
    background: #2c3e50 !important;
}

/* 게임 화면 배경 변경 */
.smartphone-screen {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

/* 버튼 색상 변경 */
#start-game-btn {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
}
```

#### 3. 언어 문자열 커스터마이징

**언어 커스터마이징** (`사이트 관리 → 언어 → 언어 커스터마이징`):
1. "한국어 (ko)" 또는 "English (en)" 선택
2. "mod_samplinggame" 컴포넌트 선택
3. 원하는 문자열 편집
4. 저장

### 성능 최적화

#### 1. 캐싱 설정
```
사이트 관리 → 플러그인 → 캐싱 → 설정
```
- Application 캐시 활성화
- Session 캐시 활성화
- Request 캐시 활성화

#### 2. JavaScript 최적화
```
사이트 관리 → 개발 → 디버깅
```
- 프로덕션 환경에서는 디버깅 비활성화
- "테마 디자이너 모드" 비활성화

#### 3. 데이터베이스 인덱스
```sql
-- 성능 향상을 위한 추가 인덱스 (선택사항)
CREATE INDEX idx_attempts_score
ON mdl_samplinggame_attempts(score);

CREATE INDEX idx_attempts_created
ON mdl_samplinggame_attempts(timecreated);
```

## 문제 해결

### 일반적인 문제

#### 문제 1: "플러그인이 목록에 나타나지 않음"

**원인**:
- 파일 복사 오류
- 권한 문제
- 버전 호환성 문제

**해결 방법**:
```bash
# 1. 파일 존재 확인
ls -la /var/www/html/moodle/mod/samplinggame/version.php

# 2. 권한 확인 및 수정
sudo chown -R www-data:www-data /var/www/html/moodle/mod/samplinggame
sudo chmod -R 755 /var/www/html/moodle/mod/samplinggame

# 3. Moodle 캐시 클리어
php admin/cli/purge_caches.php

# 4. 수동으로 업그레이드 실행
php admin/cli/upgrade.php
```

#### 문제 2: "데이터베이스 업그레이드 실패"

**오류 메시지**: "Error reading XML database file"

**해결 방법**:
```bash
# XML 파일 구문 검사
xmllint --noout mod/samplinggame/db/install.xml

# 권한 확인
ls -la mod/samplinggame/db/install.xml

# 파일 복구 (필요시)
cp -f /backup/mod/samplinggame/db/install.xml mod/samplinggame/db/
```

#### 문제 3: "JavaScript가 로드되지 않음"

**증상**:
- 게임이 시작되지 않음
- 버튼 클릭 반응 없음

**해결 방법**:
```
1. 브라우저 개발자 도구 열기 (F12)
2. Console 탭에서 오류 확인
3. Network 탭에서 samplinggame.js 로드 확인

# Moodle에서:
사이트 관리 → 개발 → 캐시 삭제
사이트 관리 → 개발 → 테마 캐시 삭제
```

#### 문제 4: "시도 제출 시 오류"

**오류 메시지**: "Invalid session key"

**해결 방법**:
```
1. 브라우저 쿠키 확인
2. Moodle 세션 설정 확인:
   사이트 관리 → 보안 → 세션 처리

3. PHP 세션 설정 확인 (php.ini):
   session.cookie_httponly = On
   session.cookie_secure = On (HTTPS 사용 시)
```

#### 문제 5: "성적이 성적부에 반영되지 않음"

**해결 방법**:
```sql
-- 1. 시도 데이터 확인
SELECT * FROM mdl_samplinggame_attempts
WHERE samplinggame_id = [활동ID];

-- 2. 성적 아이템 확인
SELECT * FROM mdl_grade_items
WHERE itemmodule = 'samplinggame';

-- 3. 성적 데이터 확인
SELECT * FROM mdl_grade_grades
WHERE itemid IN (
    SELECT id FROM mdl_grade_items
    WHERE itemmodule = 'samplinggame'
);

-- 4. 수동 성적 재계산
```

그 후 Moodle에서:
```
사이트 관리 → 성적 → 성적부 설정 → 성적 다시 계산
```

### 디버깅 활성화

개발/테스트 환경에서 문제 진단:

```
사이트 관리 → 개발 → 디버깅
```
- 디버그 메시지: **개발자**
- 디버그 메시지 표시: **활성화**
- 성능 정보 표시: **활성화**

### 로그 확인

```bash
# Apache 로그
tail -f /var/log/apache2/error.log

# Moodle 로그
tail -f /var/www/html/moodledata/error_log

# PHP 로그
tail -f /var/log/php7.x-fpm.log
```

Moodle 웹 인터페이스:
```
사이트 관리 → 리포트 → 로그
```

## 업그레이드

### 새 버전 설치

#### ZIP 파일 방식:
1. 새 버전 ZIP 다운로드
2. **사이트 관리** → **플러그인** → **플러그인 설치**
3. 업로드 및 업그레이드

#### 수동 방식:
```bash
# 백업
cp -r mod/samplinggame mod/samplinggame.backup

# 새 파일 복사
cp -rf /path/to/new/samplinggame/* mod/samplinggame/

# 권한 설정
sudo chown -R www-data:www-data mod/samplinggame

# 업그레이드 실행
php admin/cli/upgrade.php --non-interactive
```

### 마이그레이션

기존 데이터 유지하면서 업그레이드:
```sql
-- 데이터 백업
mysqldump -u root -p moodle mdl_samplinggame mdl_samplinggame_attempts > backup.sql

-- 문제 발생 시 복구
mysql -u root -p moodle < backup.sql
```

## 제거 방법

### Moodle 웹 인터페이스:
1. **사이트 관리** → **플러그인** → **플러그인 개요**
2. "Sampling Game" 찾기
3. "설정" → "제거"
4. 확인 및 데이터 삭제 선택

### 수동 제거:
```bash
# 파일 삭제
rm -rf /var/www/html/moodle/mod/samplinggame

# 데이터베이스 정리 (선택사항 - 데이터 영구 삭제)
```

```sql
-- 테이블 삭제
DROP TABLE mdl_samplinggame_attempts;
DROP TABLE mdl_samplinggame;

-- 권한 삭제
DELETE FROM mdl_capabilities WHERE component = 'mod_samplinggame';

-- 이벤트 삭제
DELETE FROM mdl_events WHERE modulename = 'samplinggame';

-- 성적 아이템 삭제
DELETE FROM mdl_grade_items WHERE itemmodule = 'samplinggame';
```

## 보안 고려사항

### 1. 파일 권한
```bash
# 디렉토리: 755
find mod/samplinggame -type d -exec chmod 755 {} \;

# 파일: 644
find mod/samplinggame -type f -exec chmod 644 {} \;
```

### 2. 세션 보안
```
사이트 관리 → 보안 → 세션 처리
```
- "세션 쿠키만 사용" 활성화
- "HTTPS를 통해서만 쿠키 전송" 활성화 (HTTPS 사용 시)

### 3. CSRF 보호
플러그인은 Moodle의 sesskey를 사용하여 CSRF 공격을 방어합니다.

## 지원

문제가 해결되지 않는 경우:
1. GitHub Issues 등록
2. Moodle 포럼 게시
3. 개발자 문의

## 참고 자료

- [Moodle 플러그인 개발 문서](https://docs.moodle.org/dev/Main_Page)
- [Moodle 설치 가이드](https://docs.moodle.org/en/Installing_Moodle)
- [PHP 문서](https://www.php.net/manual/en/)
- [MySQL 문서](https://dev.mysql.com/doc/)
