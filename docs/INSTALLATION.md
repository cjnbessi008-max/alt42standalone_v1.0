# Dot Collector - 설치 가이드

## 시스템 요구사항

- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 브라우저**: Chrome, Firefox, Safari, Edge (최신 2개 버전)

## 설치 단계

### 1. 외부 데이터베이스 설정

Dot Collector는 Moodle과는 별도의 데이터베이스를 사용합니다.

```bash
# MySQL에 로그인
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE dotcollector CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 사용자 생성 및 권한 부여
CREATE USER 'dotcollector'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON dotcollector.* TO 'dotcollector'@'localhost';
FLUSH PRIVILEGES;

# 스키마 임포트
USE dotcollector;
SOURCE /path/to/alt42standalone_v1.0/database/schema.sql;
```

### 2. Moodle 플러그인 설치

```bash
# Moodle의 mod 디렉토리로 이동
cd /path/to/moodle/mod/

# 플러그인 복사
cp -r /path/to/alt42standalone_v1.0/moodle_plugin ./dotcollector

# 웹앱 파일 복사
cp -r /path/to/alt42standalone_v1.0/webapp ./dotcollector/

# 권한 설정
chown -R www-data:www-data dotcollector
chmod -R 755 dotcollector
```

### 3. 플러그인 설정

1. Moodle 관리자 계정으로 로그인
2. **사이트 관리 > 알림**으로 이동
3. Dot Collector 플러그인 설치 확인 및 업그레이드 실행
4. **사이트 관리 > 플러그인 > 활동 모듈 > Dot Collector**로 이동
5. 다음 설정 입력:
   - **데이터베이스 호스트**: localhost
   - **데이터베이스 이름**: dotcollector
   - **데이터베이스 사용자**: dotcollector
   - **데이터베이스 비밀번호**: your_password

### 4. 설정 파일 업데이트

Moodle의 `config.php` 파일에 다음 설정을 추가할 수 있습니다:

```php
// Dot Collector 설정
$CFG->dotcollector_dbhost = 'localhost';
$CFG->dotcollector_dbname = 'dotcollector';
$CFG->dotcollector_dbuser = 'dotcollector';
$CFG->dotcollector_dbpass = 'your_password';
```

### 5. 권한 확인

다음 사용자 역할에 권한이 올바르게 설정되어 있는지 확인:

- **교사**: 활동 추가, 보기
- **학생**: 보기, 답안 제출
- **관리자**: 모든 권한

## 사용 방법

### 코스에 Dot Collector 활동 추가

1. 코스 페이지로 이동
2. **편집 모드 켜기** 클릭
3. 원하는 섹션에서 **활동 또는 리소스 추가** 클릭
4. **Dot Collector** 선택
5. 활동 이름과 설명 입력
6. **저장 후 표시** 클릭

### 학생 사용 방법

1. Dot Collector 활동 클릭
2. 우측 하단에 가상 스마트폰 화면이 나타남
3. 문제를 읽고 도형의 넓이 파악
4. 캔버스를 클릭하여 부분 넓이를 도트로 표시
5. 도트 값을 조절하여 정확한 넓이 누적
6. 최종 답안 입력 및 제출

## 문제 해결

### API 연결 오류

```bash
# PHP 오류 로그 확인
tail -f /var/log/apache2/error.log

# MySQL 연결 확인
mysql -u dotcollector -p dotcollector
```

### 웹앱이 로드되지 않음

1. 브라우저 콘솔 확인 (F12)
2. `webapp/` 디렉토리 권한 확인
3. Apache/Nginx 설정 확인

### 세션 토큰 오류

- Moodle 세션이 만료되었을 수 있음
- 페이지 새로고침 또는 재로그인

## 데이터베이스 백업

```bash
# 정기 백업 스크립트
mysqldump -u dotcollector -p dotcollector > dotcollector_backup_$(date +%Y%m%d).sql
```

## 업데이트

1. 새 버전의 플러그인 파일로 교체
2. 데이터베이스 마이그레이션 스크립트 실행 (있는 경우)
3. Moodle 캐시 삭제: **사이트 관리 > 개발 > 캐시 삭제**

## 지원

문제가 발생하면 다음을 확인하세요:

- Moodle 버전 호환성
- PHP 오류 로그
- MySQL 연결 상태
- 브라우저 콘솔 오류

기술 지원: KAIST Touch Math Academy
