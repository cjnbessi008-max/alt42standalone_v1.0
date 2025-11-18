# Overlap Field 설치 가이드

이 문서는 Moodle 3.7 환경에서 Overlap Field 플러그인을 설치하는 상세한 가이드입니다.

## 사전 준비사항

### 시스템 요구사항 확인

1. **Moodle 버전 확인**
   ```bash
   # Moodle 관리자 페이지에서 확인
   사이트 관리 > 알림 > Moodle 버전
   ```
   - 요구사항: Moodle 3.7 이상

2. **PHP 버전 확인**
   ```bash
   php -v
   ```
   - 요구사항: PHP 7.1.9 이상

3. **MySQL 버전 확인**
   ```bash
   mysql --version
   ```
   - 요구사항: MySQL 5.7 이상

4. **디스크 공간 확인**
   ```bash
   df -h
   ```
   - 요구사항: 최소 50MB 여유 공간

## 설치 단계

### 1단계: 파일 다운로드 및 압축 해제

```bash
# 작업 디렉토리로 이동
cd /tmp

# Git에서 클론 (또는 ZIP 다운로드)
git clone https://github.com/your-repo/alt42standalone_v1.0.git

# 또는 ZIP 파일 다운로드 후
unzip alt42standalone_v1.0.zip
```

### 2단계: Moodle 플러그인 디렉토리에 복사

```bash
# Moodle 설치 경로 확인 (일반적으로 /var/www/html/moodle)
MOODLE_PATH="/var/www/html/moodle"

# 플러그인 복사
sudo cp -r alt42standalone_v1.0/moodle-plugin/overlap_field $MOODLE_PATH/mod/

# 웹앱 파일 복사
sudo cp -r alt42standalone_v1.0/webapp/* $MOODLE_PATH/mod/overlap_field/webapp/
```

### 3단계: 파일 권한 설정

```bash
# Apache 사용자 확인 (보통 www-data 또는 apache)
ps aux | grep apache

# 권한 설정
sudo chown -R www-data:www-data $MOODLE_PATH/mod/overlap_field
sudo chmod -R 755 $MOODLE_PATH/mod/overlap_field

# 특정 디렉토리에 쓰기 권한 부여 (필요시)
sudo chmod -R 775 $MOODLE_PATH/mod/overlap_field/webapp
```

### 4단계: Moodle에서 플러그인 설치

1. **Moodle 관리자로 로그인**
   - URL: `https://your-moodle-site.com/`
   - 관리자 계정으로 로그인

2. **알림 페이지로 이동**
   - **사이트 관리 → 알림** 클릭
   - 또는 직접 URL: `https://your-moodle-site.com/admin/index.php`

3. **플러그인 감지**
   - Moodle이 자동으로 새 플러그인을 감지합니다
   - "Overlap Field" 플러그인이 목록에 표시되어야 합니다

4. **데이터베이스 업그레이드**
   - **"Moodle 데이터베이스 지금 업그레이드"** 버튼 클릭
   - 다음 테이블이 생성됩니다:
     - `mdl_overlap_field`
     - `mdl_overlap_field_attempts`

5. **설치 완료 확인**
   - 성공 메시지 확인
   - 오류가 있다면 PHP 오류 로그 확인

### 5단계: 플러그인 설정

1. **플러그인 설정 페이지로 이동**
   - **사이트 관리 → 플러그인 → 활동 모듈 → Overlap Field**

2. **기본 설정 구성** (선택사항)
   - 기본 좌표 범위
   - 기본 격자 크기
   - 색상 테마

### 6단계: 설치 검증

#### 테스트 코스 생성

1. **새 코스 생성**
   - **사이트 관리 → 코스 → 코스 관리 → 새 코스 생성**
   - 코스명: "Overlap Field 테스트"

2. **활동 추가**
   - 코스로 이동
   - **편집 모드 켜기**
   - **활동 또는 리소스 추가 → Overlap Field** 선택

3. **테스트 문제 생성**
   ```
   활동명: 연립부등식 테스트

   소개:
   다음 연립부등식의 교집합을 시각화합니다.

   부등식 (한 줄에 하나씩):
   y > 2*x + 1
   y < -x + 5
   x > -3
   x < 4
   ```

4. **저장 및 표시**
   - **저장하고 표시** 클릭
   - 가상 스마트폰 화면에 시각화가 나타나는지 확인

#### 기능 테스트

- [ ] 시각화가 정상적으로 표시됨
- [ ] 부등식 목록이 표시됨
- [ ] 격자 밀도 슬라이더 작동
- [ ] 색상 강도 슬라이더 작동
- [ ] 초기화 버튼 작동
- [ ] 애니메이션 토글 작동
- [ ] 반응형 디자인 확인 (모바일)

## 고급 설정

### 웹서버 설정 (Apache)

플러그인이 대용량 데이터를 처리할 경우:

```apache
# /etc/apache2/sites-available/moodle.conf
<VirtualHost *:80>
    # ... 기존 설정 ...

    # PHP 메모리 제한 증가
    php_value memory_limit 256M
    php_value post_max_size 50M
    php_value upload_max_filesize 50M

    # Canvas API를 위한 CORS 설정 (필요시)
    Header set Access-Control-Allow-Origin "*"
</VirtualHost>
```

재시작:
```bash
sudo systemctl restart apache2
```

### PHP 설정 최적화

```ini
; /etc/php/7.1/apache2/php.ini

memory_limit = 256M
post_max_size = 50M
upload_max_filesize = 50M
max_execution_time = 300
max_input_vars = 5000
```

재시작:
```bash
sudo systemctl restart apache2
```

### MySQL 설정 최적화

```sql
-- JSON 컬럼 사용을 위한 설정
SET GLOBAL max_allowed_packet = 67108864; -- 64MB

-- 연결 수 증가 (필요시)
SET GLOBAL max_connections = 200;
```

### Moodle 캐싱 설정

1. **사이트 관리 → 플러그인 → 캐싱 → 설정**
2. Redis 또는 Memcached 설정 (선택사항)
3. **Application cache** 활성화

## 문제 해결

### 문제 1: "플러그인을 찾을 수 없습니다"

**원인**: 파일이 올바른 위치에 없음

**해결**:
```bash
# 파일 구조 확인
ls -la /var/www/html/moodle/mod/overlap_field/

# 필수 파일 확인
- version.php ✓
- lib.php ✓
- mod_form.php ✓
- view.php ✓
- db/install.xml ✓
- db/access.php ✓
```

### 문제 2: "데이터베이스 오류"

**원인**: MySQL 권한 또는 연결 문제

**해결**:
```bash
# Moodle DB 사용자 확인
mysql -u moodleuser -p

# 권한 확인
SHOW GRANTS FOR 'moodleuser'@'localhost';

# 필요시 권한 부여
GRANT ALL PRIVILEGES ON moodle.* TO 'moodleuser'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 3: "시각화가 표시되지 않음"

**원인**: JavaScript 파일 경로 오류 또는 CORS 문제

**해결**:
```bash
# JavaScript 파일 존재 확인
ls -la /var/www/html/moodle/mod/overlap_field/webapp/src/

# 필수 파일:
- utils/inequality-parser.js ✓
- utils/color-utils.js ✓
- components/overlap-field-renderer.js ✓
- components/smartphone-controller.js ✓

# 브라우저 콘솔에서 오류 확인
F12 → Console 탭
```

### 문제 4: "권한 오류 (403 Forbidden)"

**해결**:
```bash
# 소유자 및 권한 재설정
sudo chown -R www-data:www-data /var/www/html/moodle/mod/overlap_field
sudo chmod -R 755 /var/www/html/moodle/mod/overlap_field

# SELinux 사용 시
sudo chcon -R -t httpd_sys_content_t /var/www/html/moodle/mod/overlap_field
```

### 문제 5: "캐시 문제"

**해결**:
1. Moodle 캐시 제거
   - **사이트 관리 → 개발 → 캐시 제거**
   - **모든 캐시 제거** 클릭

2. 브라우저 캐시 제거
   - Ctrl + Shift + Delete
   - 캐시 및 쿠키 삭제

## 업그레이드

기존 버전에서 새 버전으로 업그레이드:

```bash
# 백업 생성
sudo cp -r /var/www/html/moodle/mod/overlap_field /tmp/overlap_field_backup

# 새 버전 복사
sudo cp -r alt42standalone_v1.0/moodle-plugin/overlap_field/* \
    /var/www/html/moodle/mod/overlap_field/

# 권한 재설정
sudo chown -R www-data:www-data /var/www/html/moodle/mod/overlap_field

# Moodle 업그레이드 페이지 방문
# https://your-moodle-site.com/admin/index.php
```

## 제거

플러그인 완전 제거:

```bash
# 1. Moodle 관리자 페이지에서 제거
# 사이트 관리 → 플러그인 → 플러그인 개요 → Overlap Field → 제거

# 2. 수동 파일 제거 (필요시)
sudo rm -rf /var/www/html/moodle/mod/overlap_field

# 3. 데이터베이스 테이블 제거 (필요시)
mysql -u moodleuser -p moodle

DROP TABLE mdl_overlap_field;
DROP TABLE mdl_overlap_field_attempts;
```

## 성능 최적화

### 대규모 배포 (1000+ 학생)

1. **데이터베이스 인덱스 추가**
   ```sql
   CREATE INDEX idx_userid_overlap ON mdl_overlap_field_attempts(userid, overlap_field_id);
   CREATE INDEX idx_timecreated ON mdl_overlap_field_attempts(timecreated);
   ```

2. **Moodle 캐싱 활성화**
   - Redis 또는 Memcached 사용

3. **CDN 사용**
   - JavaScript 및 CSS 파일을 CDN에 호스팅

4. **로드 밸런싱**
   - 여러 Moodle 서버 사용

## 지원

설치 중 문제가 발생하면:

1. **로그 파일 확인**
   ```bash
   # Apache 오류 로그
   tail -f /var/log/apache2/error.log

   # PHP 오류 로그
   tail -f /var/log/php7.1-fpm.log

   # Moodle 디버그 모드 활성화
   # config.php에 추가:
   $CFG->debug = 32767;
   $CFG->debugdisplay = 1;
   ```

2. **문서 참조**
   - [Moodle 플러그인 개발 문서](https://docs.moodle.org/dev/)
   - [README.md](../README.md)

3. **커뮤니티 지원**
   - GitHub Issues
   - Moodle 포럼

---

**설치 가이드 버전**: 1.0.0
**마지막 업데이트**: 2025-01-18
