# Goal Writing Module - 설치 가이드 (Installation Guide)

## 목차 (Table of Contents)
1. [사전 요구사항](#사전-요구사항)
2. [설치 단계](#설치-단계)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [설정 확인](#설정-확인)
5. [첫 활동 만들기](#첫-활동-만들기)
6. [문제 해결](#문제-해결)

## 사전 요구사항 (Prerequisites)

설치를 시작하기 전에 다음 사항을 확인하세요:

### 필수 소프트웨어
- ✅ **Moodle**: 3.7 이상
- ✅ **PHP**: 7.1.9 이상
- ✅ **MySQL**: 5.7 이상
- ✅ **웹 서버**: Apache 또는 Nginx

### 권한
- Moodle 관리자 계정 접근 권한
- 서버 파일 시스템 쓰기 권한 (수동 설치 시)

## 설치 단계 (Installation Steps)

### 옵션 1: 파일 시스템을 통한 수동 설치

#### 1단계: 파일 복사
```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# Goal Writing 모듈 복사
cp -r /path/to/mod/goalwriting mod/goalwriting

# 권한 설정
chmod -R 755 mod/goalwriting
chown -R www-data:www-data mod/goalwriting  # 또는 해당 웹 서버 사용자
```

#### 2단계: Moodle 관리 페이지 접속
1. 웹 브라우저에서 Moodle 사이트에 접속합니다
2. 관리자 계정으로 로그인합니다
3. 다음 URL로 이동합니다:
   ```
   https://your-moodle-site.com/admin/index.php
   ```

#### 3단계: 플러그인 설치
1. Moodle이 자동으로 새 플러그인을 감지합니다
2. "데이터베이스 업그레이드" 또는 "Upgrade database now" 버튼을 클릭합니다
3. 플러그인 정보를 확인합니다:
   - **이름**: Goal Writing
   - **버전**: 2025011800
   - **타입**: Activity module
4. "계속" 버튼을 클릭하여 설치를 진행합니다
5. 성공 메시지를 확인합니다

### 옵션 2: Moodle 플러그인 인스톨러 사용

#### 1단계: ZIP 파일 생성
```bash
# goalwriting 디렉토리를 ZIP으로 압축
cd /path/to
zip -r goalwriting.zip mod/goalwriting/
```

#### 2단계: Moodle에서 플러그인 업로드
1. Moodle 관리자로 로그인합니다
2. **사이트 관리 > 플러그인 > 플러그인 설치**로 이동합니다
3. "파일 선택" 버튼을 클릭하고 goalwriting.zip을 선택합니다
4. "ZIP 파일에서 플러그인 설치" 버튼을 클릭합니다
5. 플러그인 유형을 확인합니다: **Activity module (mod)**
6. "ZIP 패키지 파일 설치하기" 버튼을 클릭합니다
7. 설치 과정을 따라 완료합니다

### 옵션 3: Git을 통한 설치 (개발자용)

```bash
cd /path/to/moodle/mod
git clone <repository-url> goalwriting
cd goalwriting
git checkout main  # 또는 원하는 브랜치

# 권한 설정
chmod -R 755 /path/to/moodle/mod/goalwriting
```

그런 다음 Moodle 관리 페이지에서 데이터베이스 업그레이드를 실행합니다.

## 데이터베이스 설정 (Database Setup)

Goal Writing 모듈은 두 개의 테이블을 자동으로 생성합니다:

### 1. goalwriting 테이블
활동 인스턴스 정보를 저장합니다.

```sql
CREATE TABLE mdl_goalwriting (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    course BIGINT(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    intro TEXT NOT NULL,
    introformat INT(4) NOT NULL DEFAULT 0,
    problemtext TEXT,
    problemformat INT(4) NOT NULL DEFAULT 0,
    minwords INT(10) NOT NULL DEFAULT 10,
    maxwords INT(10) NOT NULL DEFAULT 500,
    allowresubmit TINYINT(1) NOT NULL DEFAULT 1,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0
);
```

### 2. goalwriting_submissions 테이블
학생 제출물을 저장합니다.

```sql
CREATE TABLE mdl_goalwriting_submissions (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    goalwritingid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    goaltext TEXT NOT NULL,
    goalformat INT(4) NOT NULL DEFAULT 0,
    wordcount INT(10) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    teacherfeedback TEXT,
    teacherfeedbackformat INT(4) NOT NULL DEFAULT 0,
    grade INT(10),
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    timesubmitted BIGINT(10)
);
```

**참고**: Moodle이 자동으로 테이블을 생성하므로 수동으로 SQL을 실행할 필요가 없습니다.

## 설정 확인 (Verification)

설치가 성공적으로 완료되었는지 확인하세요:

### 1. 플러그인 목록 확인
1. **사이트 관리 > 플러그인 > 플러그인 개요**로 이동
2. "활동 모듈" 섹션에서 "Goal Writing"을 찾습니다
3. 버전 번호와 상태를 확인합니다

### 2. 데이터베이스 테이블 확인
MySQL/MariaDB 콘솔에서:
```sql
USE moodle;  -- 또는 해당 데이터베이스 이름
SHOW TABLES LIKE 'mdl_goalwriting%';
```

예상 결과:
```
mdl_goalwriting
mdl_goalwriting_submissions
```

### 3. 권한 확인
1. **사이트 관리 > 사용자 > 권한 > 권한 정의**로 이동
2. "mod/goalwriting"로 검색
3. 다음 권한들이 표시되는지 확인:
   - mod/goalwriting:addinstance
   - mod/goalwriting:view
   - mod/goalwriting:submit
   - mod/goalwriting:grade
   - mod/goalwriting:viewallsubmissions

## 첫 활동 만들기 (Creating Your First Activity)

설치가 완료되면 첫 Goal Writing 활동을 만들어보세요:

### 교사 관점

#### 1단계: 코스로 이동
1. Moodle에서 원하는 코스로 이동합니다
2. "편집 모드 켜기"를 클릭합니다

#### 2단계: 활동 추가
1. 원하는 섹션에서 "활동 또는 리소스 추가"를 클릭합니다
2. "목표 작성 (Goal Writing)"을 선택합니다
3. "추가" 버튼을 클릭합니다

#### 3단계: 설정 구성
다음 필드를 채웁니다:

**일반 설정**
- **활동 이름**: 예) "분수 학습 목표 작성"
- **설명**: 예) "분수에 대한 학습 목표를 자신의 말로 작성해보세요."

**문제 설명**
```
다음 내용을 배우려고 합니다:
- 분수의 개념 이해하기
- 분수의 덧셈과 뺄셈
- 분수를 실생활에 적용하기

위 주제에 대해 여러분이 배우고 싶은 구체적인 목표를 작성해주세요.
```

**단어 수 설정**
- **최소 단어 수**: 20
- **최대 단어 수**: 200

**옵션**
- ✅ **재제출 허용**: 체크 (학생이 피드백 후 수정 가능)

**성적 설정**
- **성적 유형**: 점수
- **최대 성적**: 100

#### 4단계: 저장
"저장하고 표시" 버튼을 클릭합니다.

### 학생 관점

학생들은 다음과 같이 활동을 사용할 수 있습니다:

1. 코스 페이지에서 Goal Writing 활동을 클릭합니다
2. 문제 설명을 읽습니다
3. 학습 목표를 작성합니다
4. 실시간 단어 수를 확인합니다
5. "임시 저장" 또는 "목표 제출"을 클릭합니다

## 문제 해결 (Troubleshooting)

### 문제 1: "플러그인을 찾을 수 없음" 오류

**증상**: Moodle이 플러그인을 감지하지 못함

**해결책**:
```bash
# 파일 위치 확인
ls -la /path/to/moodle/mod/goalwriting/

# version.php가 있는지 확인
cat /path/to/moodle/mod/goalwriting/version.php

# 권한 확인
chmod -R 755 /path/to/moodle/mod/goalwriting/
chown -R www-data:www-data /path/to/moodle/mod/goalwriting/
```

### 문제 2: 데이터베이스 설치 오류

**증상**: "데이터베이스 테이블을 생성할 수 없음" 오류

**해결책**:
1. MySQL 사용자 권한 확인:
```sql
SHOW GRANTS FOR 'moodleuser'@'localhost';
```

2. 필요한 권한:
   - CREATE
   - ALTER
   - INDEX

3. 권한 부여 (필요시):
```sql
GRANT CREATE, ALTER, INDEX ON moodle.* TO 'moodleuser'@'localhost';
FLUSH PRIVILEGES;
```

### 문제 3: "권한 없음" 오류

**증상**: 교사가 활동을 추가할 수 없음

**해결책**:
1. **사이트 관리 > 사용자 > 권한 > 역할 정의**로 이동
2. "교사(Teacher)" 역할을 편집
3. `mod/goalwriting:addinstance` 권한이 "허용"으로 설정되어 있는지 확인

### 문제 4: 언어 문자열이 표시되지 않음

**증상**: 인터페이스에 "[[modulename]]" 같은 텍스트가 표시됨

**해결책**:
```bash
# 언어 파일이 있는지 확인
ls -la /path/to/moodle/mod/goalwriting/lang/en/
ls -la /path/to/moodle/mod/goalwriting/lang/ko/

# 언어 캐시 정리
# Moodle 관리자 페이지에서:
# 사이트 관리 > 개발 > 캐시 비우기
```

### 문제 5: 학생이 제출할 수 없음

**증상**: 학생이 "제출" 버튼을 클릭해도 아무 일도 일어나지 않음

**해결책**:
1. 브라우저 개발자 도구 확인 (F12)
2. JavaScript 콘솔에서 오류 확인
3. JavaScript가 활성화되어 있는지 확인
4. 브라우저 호환성 확인 (최신 버전 사용)

### 문제 6: CSS 스타일이 적용되지 않음

**증상**: 인터페이스가 스타일링되지 않은 상태로 표시됨

**해결책**:
```bash
# styles.css 파일 확인
cat /path/to/moodle/mod/goalwriting/styles.css

# Moodle 테마 캐시 정리
# 사이트 관리 > 모양 > 테마 > 테마 캐시 정리
```

## 고급 설정 (Advanced Configuration)

### PHP 메모리 제한 조정
대규모 제출물 처리를 위해:

```php
// config.php에 추가
$CFG->extramemorylimit = '512M';
```

### 단어 수 계산 알고리즘 커스터마이징
`lib.php`의 `goalwriting_count_words()` 함수를 수정하여 특정 언어에 맞게 조정할 수 있습니다.

### 권한 세밀하게 조정
특정 사용자 그룹에만 특정 기능을 허용하려면:
1. **사이트 관리 > 사용자 > 권한 > 역할 정의**
2. 새 역할 생성 또는 기존 역할 수정
3. Goal Writing 관련 권한을 세밀하게 설정

## 성능 최적화 (Performance Optimization)

### 데이터베이스 인덱스
큰 규모의 배포를 위해 추가 인덱스를 생성할 수 있습니다:

```sql
-- 제출물 조회 속도 향상
CREATE INDEX idx_goalwriting_submissions_status
ON mdl_goalwriting_submissions(status);

CREATE INDEX idx_goalwriting_submissions_goalwritingid_status
ON mdl_goalwriting_submissions(goalwritingid, status);
```

### 캐싱
Moodle의 캐싱을 활용하여 성능을 개선할 수 있습니다.

## 백업 및 복원 (Backup and Restore)

Goal Writing 활동은 Moodle의 표준 백업/복원 기능과 호환됩니다:

1. 코스 백업 시 Goal Writing 활동이 자동으로 포함됩니다
2. 복원 시 모든 제출물과 피드백이 함께 복원됩니다

## 제거 (Uninstallation)

모듈을 제거하려면:

1. **사이트 관리 > 플러그인 > 플러그인 개요**로 이동
2. "Goal Writing" 플러그인을 찾습니다
3. "제거" 링크를 클릭합니다
4. 확인 메시지를 읽고 "계속"을 클릭합니다
5. 모든 데이터베이스 테이블과 데이터가 제거됩니다

**경고**: 제거하면 모든 Goal Writing 활동과 학생 제출물이 영구적으로 삭제됩니다!

## 지원 및 문의 (Support)

추가 도움이 필요하시면:
- 📧 이메일: [support@example.com]
- 🐛 버그 리포트: GitHub Issues
- 📖 문서: README.md 참조

## 다음 단계 (Next Steps)

설치가 완료되었습니다! 이제:
1. ✅ 첫 Goal Writing 활동 만들기
2. ✅ 몇 명의 학생과 테스트하기
3. ✅ 교사 피드백 기능 시험해보기
4. ✅ 설정을 조정하여 교육 목표에 맞추기

성공적인 설치를 축하합니다! 🎉
