# Dancing Line Sorting - 설치 가이드

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 단계

### 1. 파일 복사

#### 방법 A: Git Clone
```bash
cd /path/to/moodle/local
git clone <repository-url> dancingline
```

#### 방법 B: 수동 복사
```bash
cd /path/to/moodle
cp -r /path/to/dancingline local/dancingline
```

### 2. 파일 권한 설정

```bash
cd /path/to/moodle/local/dancingline
chmod 755 .
chmod 644 *.php
chmod 755 js/
chmod 644 js/*.js
chmod 755 styles/
chmod 644 styles/*.css
chmod 755 db/
chmod 644 db/*.xml db/*.php
```

### 3. Moodle 관리자 페이지 접속

1. 웹 브라우저에서 Moodle 사이트 접속
2. 관리자 계정으로 로그인
3. **Site administration** → **Notifications** 페이지로 이동

### 4. 플러그인 설치 확인

- Moodle이 자동으로 새 플러그인을 감지합니다
- "Upgrade Moodle database now" 버튼 클릭
- 설치가 완료될 때까지 대기

### 5. 데이터베이스 테이블 확인

설치가 완료되면 다음 테이블이 생성됩니다:

```sql
-- 문제 테이블
mdl_local_dancingline_problems

-- 시도 기록 테이블
mdl_local_dancingline_attempts
```

확인 방법:
```sql
SHOW TABLES LIKE '%dancingline%';
```

### 6. 권한 설정 확인

**Site administration** → **Users** → **Permissions** → **Define roles**

다음 권한이 자동으로 생성됩니다:
- `local/dancingline:view` - 앱 접근 권한
- `local/dancingline:createproblem` - 문제 생성 권한
- `local/dancingline:viewreports` - 리포트 보기 권한

### 7. 접근 테스트

#### 학생 계정으로 테스트:
```
https://your-moodle-site.com/local/dancingline/index.php
```

#### 교사 계정으로 테스트:
```
https://your-moodle-site.com/local/dancingline/create_problem.php
```

## 설정 옵션

### PHP 설정 (php.ini)

```ini
; 최대 실행 시간
max_execution_time = 300

; 메모리 제한
memory_limit = 256M

; 파일 업로드 크기
upload_max_filesize = 10M
post_max_size = 10M
```

### MySQL 설정

```sql
-- 문자셋 확인
SHOW VARIABLES LIKE 'character_set%';

-- UTF-8 설정 확인
-- character_set_database = utf8mb4
-- character_set_server = utf8mb4
```

## 문제 해결

### 문제 1: 플러그인이 감지되지 않음

**원인**: 파일이 올바른 위치에 없음

**해결**:
```bash
# 파일 위치 확인
ls -la /path/to/moodle/local/dancingline/version.php

# 파일이 존재해야 합니다
```

### 문제 2: 데이터베이스 오류

**원인**: MySQL 권한 부족

**해결**:
```sql
-- Moodle DB 사용자에게 권한 부여
GRANT ALL PRIVILEGES ON moodle_db.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 3: JavaScript/CSS 로드 안 됨

**원인**: 캐시 문제

**해결**:
1. **Site administration** → **Development** → **Purge all caches**
2. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)

### 문제 4: 권한 오류

**원인**: 사용자 역할에 권한이 없음

**해결**:
1. **Site administration** → **Users** → **Permissions** → **Define roles**
2. Student/Teacher 역할 편집
3. `local/dancingline:view` 권한 활성화

### 문제 5: 스마트폰 UI가 표시되지 않음

**원인**: CSS 경로 문제

**해결**:
```bash
# CSS 파일 확인
ls -la /path/to/moodle/local/dancingline/styles/styles.css

# 파일 권한 확인
chmod 644 /path/to/moodle/local/dancingline/styles/styles.css
```

## 업그레이드

### 버전 업데이트 방법

1. 백업 생성:
```bash
cd /path/to/moodle/local
tar -czf dancingline-backup-$(date +%Y%m%d).tar.gz dancingline/
```

2. 새 버전 파일 복사:
```bash
cp -r /path/to/new/dancingline/* /path/to/moodle/local/dancingline/
```

3. version.php 버전 번호 확인:
```php
$plugin->version = 2025111801; // 증가해야 함
```

4. Moodle 업그레이드:
- **Site administration** → **Notifications**
- "Upgrade" 버튼 클릭

## 삭제 방법

### 플러그인 완전 삭제

1. **Site administration** → **Plugins** → **Plugins overview**
2. "Dancing Line Sorting" 찾기
3. "Uninstall" 클릭
4. 파일 수동 삭제:
```bash
rm -rf /path/to/moodle/local/dancingline
```

### 데이터 보존하고 비활성화만

```bash
# 폴더 이름 변경
mv /path/to/moodle/local/dancingline /path/to/moodle/local/dancingline.disabled
```

## 성능 최적화

### 1. 데이터베이스 인덱스 확인

```sql
SHOW INDEX FROM mdl_local_dancingline_problems;
SHOW INDEX FROM mdl_local_dancingline_attempts;
```

### 2. Moodle 캐시 설정

**Site administration** → **Plugins** → **Caching** → **Configuration**

### 3. MySQL 쿼리 캐시 활성화

```sql
-- my.cnf 또는 my.ini에 추가
[mysqld]
query_cache_type = 1
query_cache_size = 32M
```

## 보안 체크리스트

- [ ] 파일 권한 확인 (폴더 755, 파일 644)
- [ ] 데이터베이스 사용자 권한 최소화
- [ ] HTTPS 사용 확인
- [ ] Moodle 버전 최신으로 유지
- [ ] 정기적인 백업 수행
- [ ] 로그 파일 모니터링

## 지원

문제가 지속되면:
- GitHub Issues: <repository-url>/issues
- Moodle 포럼: https://moodle.org/plugins/
- 이메일: support@yourdomain.com

## 다음 단계

설치가 완료되면:
1. [README.md](README.md) - 사용 방법 확인
2. [create_problem.php](create_problem.php) - 첫 문제 생성
3. [index.php](index.php) - 앱 테스트

축하합니다! Dancing Line Sorting이 성공적으로 설치되었습니다! 🎉
