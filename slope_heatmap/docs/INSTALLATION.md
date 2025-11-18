# Slope Heatmap 설치 가이드

## 시스템 요구사항

### 필수 요구사항
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.10+
- **PHP**: 7.1.9 이상 (7.4 권장)
- **MySQL**: 5.7 이상 또는 MariaDB 10.2+
- **Moodle**: 3.7 이상
- **디스크 공간**: 최소 50MB

### PHP 확장 모듈
- mysqli
- gd
- curl
- zip
- mbstring
- json

## 설치 단계

### 1. 파일 준비

#### 다운로드
```bash
# 프로젝트 복제 또는 다운로드
cd /tmp
git clone <repository-url> slope_heatmap
# 또는
unzip slope_heatmap.zip
```

### 2. Moodle 플러그인 설치

#### 자동 설치 (권장)

```bash
# Moodle 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 디렉토리 생성
mkdir -p mod/slopeheatmap

# 파일 복사
cp -r /tmp/slope_heatmap/moodle_plugin/mod_slopeheatmap/* mod/slopeheatmap/

# 웹앱 파일 복사
cp -r /tmp/slope_heatmap/webapp mod/slopeheatmap/

# 소유권 설정 (Apache 사용자)
chown -R www-data:www-data mod/slopeheatmap

# 권한 설정
chmod -R 755 mod/slopeheatmap
```

#### Moodle 관리자 페이지에서 설치

1. 웹 브라우저에서 Moodle 접속
2. 관리자 계정으로 로그인
3. **사이트 관리** 메뉴 클릭
4. **알림** (Notifications) 클릭
5. "새 플러그인을 설치할 준비가 되었습니다" 메시지 확인
6. **Moodle 데이터베이스 업그레이드** 버튼 클릭
7. 라이선스 동의 및 계속 진행
8. 설치 완료 확인

### 3. 데이터베이스 수동 설정 (선택사항)

Moodle이 자동으로 테이블을 생성하지만, 수동 설치가 필요한 경우:

```bash
# MySQL 접속
mysql -u moodle_user -p moodle_db

# 스키마 실행
source /tmp/slope_heatmap/database/schema.sql

# 확인
SHOW TABLES LIKE 'mdl_slopeheatmap%';
```

### 4. 웹 서버 설정

#### Apache

`.htaccess` 파일이 이미 Moodle에 포함되어 있으므로 추가 설정 불필요

#### Nginx

Moodle 설정 파일에 다음 추가:

```nginx
location ~ ^/mod/slopeheatmap/webapp/ {
    try_files $uri $uri/ =404;
}

location ~ ^/mod/slopeheatmap/api_endpoint.php$ {
    fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    include fastcgi_params;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

### 5. 권한 확인

```bash
# 파일 권한
cd /var/www/html/moodle/mod/slopeheatmap
find . -type f -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;

# PHP 파일 실행 권한
chmod 644 *.php
chmod 644 classes/*.php
```

### 6. 초기 설정

#### 샘플 문제 데이터 입력

```sql
-- MySQL 접속 후 실행
USE moodle_db;

-- 첫 번째 활동 생성 (수동으로 Moodle에서 생성 후)
-- 해당 활동의 ID를 확인 (예: 1)

-- 샘플 문제 추가
INSERT INTO mdl_slopeheatmap_problems
(slopeheatmap_id, problem_key, title, description,
 target_beta_min, target_beta_max, target_gamma_min, target_gamma_max,
 time_limit, difficulty, created_at)
VALUES
(1, 'balance_basic', '기본 균형', '10초 동안 기기를 수평으로 유지하세요',
 -5, 5, -5, 5, 10, 'easy', UNIX_TIMESTAMP()),
(1, 'tilt_forward', '앞으로 기울이기', '15초 동안 기기를 앞으로 45도 기울이세요',
 40, 50, -10, 10, 15, 'medium', UNIX_TIMESTAMP()),
(1, 'circle_motion', '원 그리기', '30초 동안 원을 그리듯 기기를 움직이세요',
 NULL, NULL, NULL, NULL, 30, 'hard', UNIX_TIMESTAMP());
```

## 설치 확인

### 1. 플러그인 활성화 확인

**사이트 관리 > 플러그인 > 활동 모듈** 에서 "Slope Heatmap" 확인

### 2. 테스트 활동 생성

1. 테스트 코스 생성 또는 기존 코스 선택
2. **활동 추가** 클릭
3. **Slope Heatmap** 선택
4. 활동 정보 입력:
   - 이름: "기울기 센서 테스트"
   - 설명: "센서 테스트 활동입니다"
   - 최대 점수: 100
5. 저장 후 확인

### 3. 기능 테스트

#### 학생으로 테스트
1. 학생 계정으로 로그인 (또는 학생 역할로 전환)
2. 테스트 활동 접속
3. 문제 선택
4. "시작" 버튼 클릭
5. 우측 하단 가상 스마트폰에서 슬라이더 조작
6. "완료" 버튼 클릭
7. 점수 및 히트맵 확인

#### 교사로 테스트
1. 교사 계정으로 활동 접속
2. 학생 세션 목록 확인
3. "히트맵 보기" 클릭하여 학생 데이터 확인

## 문제 해결

### 플러그인이 목록에 나타나지 않음

**원인**: 파일 권한 또는 경로 문제

**해결책**:
```bash
# 권한 확인
ls -la /var/www/html/moodle/mod/slopeheatmap

# version.php 파일 존재 확인
cat /var/www/html/moodle/mod/slopeheatmap/version.php

# Moodle 캐시 삭제
sudo -u www-data php /var/www/html/moodle/admin/cli/purge_caches.php
```

### 데이터베이스 테이블 생성 실패

**원인**: 권한 부족 또는 SQL 오류

**해결책**:
```bash
# MySQL 로그 확인
sudo tail -f /var/log/mysql/error.log

# Moodle 데이터베이스 사용자 권한 확인
mysql -u root -p
SHOW GRANTS FOR 'moodle_user'@'localhost';

# 필요 시 권한 부여
GRANT ALL PRIVILEGES ON moodle_db.* TO 'moodle_user'@'localhost';
FLUSH PRIVILEGES;
```

### API 엔드포인트 404 오류

**원인**: URL 라우팅 문제

**해결책**:
```bash
# Apache mod_rewrite 활성화
sudo a2enmod rewrite
sudo systemctl restart apache2

# .htaccess 확인
cd /var/www/html/moodle
cat .htaccess
```

### 센서 데이터 저장 안됨

**원인**: JavaScript CORS 또는 세션 문제

**해결책**:
1. 브라우저 개발자 도구 콘솔 확인
2. Network 탭에서 API 요청 확인
3. sesskey 파라미터 확인
4. PHP 세션 설정 확인:

```bash
# php.ini 확인
grep session.save_path /etc/php/7.4/apache2/php.ini

# 세션 디렉토리 권한 확인
ls -la /var/lib/php/sessions
```

### 히트맵이 표시되지 않음

**원인**: Canvas API 지원 또는 JavaScript 오류

**해결책**:
1. 최신 브라우저 사용 (Chrome, Firefox, Safari, Edge)
2. JavaScript 콘솔에서 오류 확인
3. `heatmap.js` 로드 확인

```javascript
// 브라우저 콘솔에서 확인
console.log(window.slopeHeatmap);
```

## 성능 최적화

### MySQL 인덱스 최적화

```sql
-- 자주 조회되는 컬럼에 인덱스 추가 (이미 적용됨)
SHOW INDEX FROM mdl_slopeheatmap_sessions;
SHOW INDEX FROM mdl_slopeheatmap_sensor_data;
```

### PHP opcode 캐싱

```bash
# OPcache 활성화 확인
php -i | grep opcache

# php.ini 설정
opcache.enable=1
opcache.memory_consumption=128
opcache.max_accelerated_files=10000
```

### 데이터 정리 (선택사항)

오래된 센서 데이터 자동 삭제 cron 작업:

```bash
# crontab -e
# 매일 밤 2시에 90일 이상 된 데이터 삭제
0 2 * * * mysql -u moodle_user -p'password' moodle_db -e "DELETE FROM mdl_slopeheatmap_sensor_data WHERE timestamp < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 90 DAY))"
```

## 업그레이드

### 플러그인 업데이트

```bash
# 백업
cp -r /var/www/html/moodle/mod/slopeheatmap /tmp/slopeheatmap_backup

# 새 버전 복사
cp -r /tmp/slope_heatmap_new/moodle_plugin/mod_slopeheatmap/* /var/www/html/moodle/mod/slopeheatmap/

# Moodle 관리자 페이지에서 "알림" 확인 및 업그레이드 실행
```

## 제거

### 플러그인 삭제

1. **사이트 관리 > 플러그인 > 활동 모듈**
2. "Slope Heatmap" 옆 **제거** 버튼 클릭
3. 확인 후 삭제 진행

### 수동 삭제

```bash
# 파일 삭제
rm -rf /var/www/html/moodle/mod/slopeheatmap

# 데이터베이스 테이블 삭제 (주의!)
mysql -u moodle_user -p moodle_db
DROP TABLE IF EXISTS mdl_slopeheatmap;
DROP TABLE IF EXISTS mdl_slopeheatmap_sessions;
DROP TABLE IF EXISTS mdl_slopeheatmap_sensor_data;
DROP TABLE IF EXISTS mdl_slopeheatmap_aggregated;
DROP TABLE IF EXISTS mdl_slopeheatmap_problems;
```

## 추가 리소스

- [Moodle 플러그인 개발 문서](https://docs.moodle.org/dev/Main_Page)
- [Device Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 지원

문제가 해결되지 않으면 이슈를 등록해주세요.
