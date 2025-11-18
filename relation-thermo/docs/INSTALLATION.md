# Relation Thermo 설치 가이드

## 시스템 요구사항

### 필수 환경
- **Moodle**: 3.7 이상
- **PHP**: 7.1.9 이상
- **MySQL**: 5.7 이상
- **웹 서버**: Apache 2.4 또는 Nginx 1.14+

### 권장 환경
- PHP 메모리 제한: 128MB 이상
- 최대 업로드 크기: 64MB
- 실행 시간 제한: 300초

## 설치 단계

### 1. 데이터베이스 설정

Moodle 데이터베이스에 접속하여 다음 SQL 스크립트를 실행합니다:

```bash
mysql -u [username] -p [moodle_database] < database/schema.sql
```

또는 MySQL 클라이언트에서:

```sql
source /path/to/relation-thermo/database/schema.sql;
```

### 2. Moodle 플러그인 설치

#### 방법 1: 파일 복사 (권장)

```bash
# Moodle 설치 디렉토리로 이동
cd /var/www/html/moodle

# 플러그인 디렉토리 복사
cp -r /path/to/relation-thermo/moodle-plugin/mod_relationthermo mod/relationthermo

# 권한 설정
chown -R www-data:www-data mod/relationthermo
chmod -R 755 mod/relationthermo
```

#### 방법 2: 웹 인터페이스 사용

1. Moodle 관리자로 로그인
2. **사이트 관리 > 플러그인 > 플러그인 설치** 메뉴 이동
3. `mod_relationthermo` 폴더를 ZIP 파일로 압축
4. 압축 파일 업로드 및 설치

### 3. Moodle 업그레이드

플러그인 설치 후 Moodle 업그레이드를 실행합니다:

```bash
# 커맨드라인 방법
cd /var/www/html/moodle
php admin/cli/upgrade.php
```

또는 웹 브라우저에서:
- `http://your-moodle-site/admin` 접속
- 업그레이드 프로세스 진행

### 4. 플러그인 설정

1. **사이트 관리 > 플러그인 > 활동 모듈 > 관계 온도계** 메뉴 이동
2. 다음 설정 구성:
   - 기본 문제 개수: 5
   - 기본 난이도: 쉬움
   - 온도계 표시: 활성화

### 5. 권한 확인

다음 역할에 적절한 권한이 부여되었는지 확인:

- **학생**:
  - mod/relationthermo:view
  - mod/relationthermo:submit

- **교사**:
  - mod/relationthermo:view
  - mod/relationthermo:submit
  - mod/relationthermo:viewreports

- **편집 교사/관리자**:
  - mod/relationthermo:addinstance (모든 권한)

## 사용 방법

### 1. 활동 추가

1. 코스 편집 모드 활성화
2. "활동 또는 리소스 추가" 클릭
3. "관계 온도계" 선택
4. 설정 구성:
   - 활동 이름 입력
   - 문제 개수 선택 (1-50)
   - 난이도 선택 (쉬움/보통/어려움)
   - 온도계 표시 여부 선택
   - 시간 제한 설정 (선택사항)

### 2. 문제 데이터 추가

초기 샘플 문제는 자동으로 생성됩니다. 추가 문제를 입력하려면:

```sql
INSERT INTO rt_problems (
    moodle_course_id,
    moodle_activity_id,
    title,
    description,
    set_a,
    set_b,
    relation_type,
    difficulty
) VALUES (
    1,  -- 코스 ID
    1,  -- 활동 ID
    '문제 제목',
    '문제 설명',
    '[1,2,3]',  -- 집합 A (JSON 배열)
    '[1,2,3,4,5]',  -- 집합 B (JSON 배열)
    'subset',  -- subset, superset, equal, disjoint, intersect
    1  -- 난이도 (1-3)
);
```

### 3. 학생 사용

학생들은 다음과 같이 활동에 참여합니다:

1. 코스에서 "관계 온도계" 활동 클릭
2. 우측 하단 가상 스마트폰 화면에서 앱 실행
3. 제시된 두 집합의 관계 파악
4. 온도계를 통해 확신도 조절
5. 관계 선택 및 제출
6. 즉시 피드백 확인
7. 모든 문제 완료 후 결과 확인

## 문제 해결

### 플러그인이 목록에 나타나지 않음

```bash
# 캐시 삭제
php admin/cli/purge_caches.php

# 또는 웹에서
# 사이트 관리 > 개발 > 캐시 제거
```

### 데이터베이스 테이블 누락

```bash
# Moodle 업그레이드 재실행
php admin/cli/upgrade.php --non-interactive
```

### JavaScript/CSS 로드 안됨

1. 파일 권한 확인:
```bash
chmod -R 755 mod/relationthermo/scripts
chmod -R 755 mod/relationthermo/styles
```

2. 브라우저 캐시 삭제
3. Moodle 캐시 삭제

### API 오류

1. PHP 오류 로그 확인:
```bash
tail -f /var/log/apache2/error.log
# 또는
tail -f /var/log/nginx/error.log
```

2. Moodle 디버그 모드 활성화:
   - 사이트 관리 > 개발 > 디버깅
   - 디버그 메시지: 개발자
   - 디버그 표시: 표시

## 업그레이드

### 플러그인 업데이트

```bash
# 백업
cp -r mod/relationthermo mod/relationthermo.backup

# 새 버전 복사
cp -r /path/to/new/mod_relationthermo mod/relationthermo

# 업그레이드 실행
php admin/cli/upgrade.php
```

### 데이터베이스 마이그레이션

새 버전에 데이터베이스 변경사항이 있는 경우:

```bash
# SQL 스크립트 실행
mysql -u [username] -p [database] < database/upgrade.sql
```

## 제거

### 1. Moodle에서 제거

1. 사이트 관리 > 플러그인 > 플러그인 개요
2. "관계 온도계" 찾기
3. "제거" 클릭
4. 확인

### 2. 수동 제거 (필요시)

```bash
# 플러그인 디렉토리 삭제
rm -rf mod/relationthermo

# 데이터베이스 테이블 삭제 (선택)
mysql -u [username] -p [database] << EOF
DROP TABLE IF EXISTS mdl_relationthermo;
DROP TABLE IF EXISTS mdl_relationthermo_responses;
DROP TABLE IF EXISTS rt_problems;
DROP TABLE IF EXISTS rt_responses;
DROP TABLE IF EXISTS rt_progress;
DROP TABLE IF EXISTS rt_thermo_settings;
EOF
```

## 지원

문제가 발생하면 다음을 확인하세요:

- Moodle 버전 호환성
- PHP 버전 및 필수 확장 모듈
- 데이터베이스 권한
- 파일 시스템 권한
- 서버 오류 로그

추가 지원이 필요하면 이슈를 등록해주세요.
