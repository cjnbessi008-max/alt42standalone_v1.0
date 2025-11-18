# Moodle 플러그인 설치 가이드

Linear Stairs를 Moodle 3.7 (PHP 7.1.9, MySQL 5.7)에 플러그인으로 설치하는 방법입니다.

## 설치 방법

### 방법 1: 간단한 iframe 삽입 (권장)

가장 간단한 방법으로, 별도의 플러그인 설치 없이 Moodle에 Linear Stairs를 사용할 수 있습니다.

#### 단계:

1. **Linear Stairs 앱을 웹 서버에 업로드**
   ```bash
   # Moodle 서버의 웹 디렉토리에 업로드
   cp -r linear-stairs /var/www/html/linear-stairs
   ```

2. **Moodle 코스에서 활동 추가**
   - 코스 페이지에서 "편집 모드 켜기" 클릭
   - 원하는 섹션에서 "활동 또는 리소스 추가" 클릭
   - "레이블" 또는 "페이지" 선택

3. **HTML 편집기에서 iframe 삽입**
   - HTML 편집 모드로 전환 (</> 아이콘 클릭)
   - 다음 코드 삽입:

   ```html
   <div style="text-align: center; margin: 20px 0;">
       <iframe
           src="http://your-domain.com/linear-stairs/index.html?a1=1&d=2&n=5&moodle=1"
           width="100%"
           height="900px"
           frameborder="0"
           style="max-width: 375px; margin: 0 auto; display: block; border: 2px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
       </iframe>
   </div>
   ```

4. **파라미터 조정**
   - URL에서 `a1`, `d`, `n` 값을 문제에 맞게 수정
   - 예: `?a1=5&d=10&n=6` (첫째항=5, 공차=10, 6개 항)

---

### 방법 2: Moodle 활동 모듈로 설치

완전한 통합을 원하는 경우, 정식 Moodle 플러그인으로 설치할 수 있습니다.

#### 필요 파일 구조:

```
moodle/
└── mod/
    └── linearstairs/
        ├── version.php           # 플러그인 버전 정보
        ├── lib.php               # 필수 함수
        ├── view.php              # 보기 페이지
        ├── submit.php            # 답안 제출 처리
        ├── mod_form.php          # 설정 폼
        ├── db/
        │   ├── install.xml       # 데이터베이스 스키마
        │   └── access.php        # 권한 정의
        ├── lang/
        │   └── en/
        │       └── linearstairs.php  # 언어 파일
        ├── classes/
        │   └── event/
        │       ├── course_module_viewed.php
        │       └── answer_submitted.php
        └── app/                  # Linear Stairs 웹앱
            ├── index.html
            ├── css/
            └── js/
```

#### 설치 단계:

1. **플러그인 디렉토리 생성**
   ```bash
   cd /path/to/moodle
   mkdir -p mod/linearstairs
   ```

2. **파일 복사**
   ```bash
   # Linear Stairs 앱 복사
   cp -r /path/to/linear-stairs mod/linearstairs/app

   # 플러그인 파일 복사
   cp /path/to/moodle-plugin-example/* mod/linearstairs/
   ```

3. **데이터베이스 스키마 생성**
   `db/install.xml` 파일 생성:

   ```xml
   <?xml version="1.0" encoding="UTF-8" ?>
   <XMLDB PATH="mod/linearstairs/db" VERSION="20251118" COMMENT="Linear Stairs module"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="../../../lib/xmldb/xmldb.xsd">
     <TABLES>
       <TABLE NAME="linearstairs" COMMENT="Linear Stairs activity instances">
         <FIELDS>
           <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
           <FIELD NAME="course" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
           <FIELD NAME="name" TYPE="char" LENGTH="255" NOTNULL="true" SEQUENCE="false"/>
           <FIELD NAME="intro" TYPE="text" NOTNULL="false" SEQUENCE="false"/>
           <FIELD NAME="introformat" TYPE="int" LENGTH="4" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
           <FIELD NAME="firstterm" TYPE="int" LENGTH="11" NOTNULL="true" DEFAULT="1" SEQUENCE="false"/>
           <FIELD NAME="commondiff" TYPE="int" LENGTH="11" NOTNULL="true" DEFAULT="2" SEQUENCE="false"/>
           <FIELD NAME="termcount" TYPE="int" LENGTH="11" NOTNULL="true" DEFAULT="5" SEQUENCE="false"/>
           <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
           <FIELD NAME="timemodified" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
         </FIELDS>
         <KEYS>
           <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
         </KEYS>
         <INDEXES>
           <INDEX NAME="course" UNIQUE="false" FIELDS="course"/>
         </INDEXES>
       </TABLE>
       <TABLE NAME="linearstairs_attempts" COMMENT="Student attempts">
         <FIELDS>
           <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
           <FIELD NAME="linearstairsid" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
           <FIELD NAME="userid" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
           <FIELD NAME="firstterm" TYPE="int" LENGTH="11" NOTNULL="true" SEQUENCE="false"/>
           <FIELD NAME="commondiff" TYPE="int" LENGTH="11" NOTNULL="true" SEQUENCE="false"/>
           <FIELD NAME="termcount" TYPE="int" LENGTH="11" NOTNULL="true" SEQUENCE="false"/>
           <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0" SEQUENCE="false"/>
         </FIELDS>
         <KEYS>
           <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
         </KEYS>
         <INDEXES>
           <INDEX NAME="linearstairsid" UNIQUE="false" FIELDS="linearstairsid"/>
           <INDEX NAME="userid" UNIQUE="false" FIELDS="userid"/>
         </INDEXES>
       </TABLE>
     </TABLES>
   </XMLDB>
   ```

4. **권한 설정**
   `db/access.php` 파일 생성:

   ```php
   <?php
   $capabilities = array(
       'mod/linearstairs:addinstance' => array(
           'riskbitmask' => RISK_XSS,
           'captype' => 'write',
           'contextlevel' => CONTEXT_COURSE,
           'archetypes' => array(
               'editingteacher' => CAP_ALLOW,
               'manager' => CAP_ALLOW
           ),
           'clonepermissionsfrom' => 'moodle/course:manageactivities'
       ),
       'mod/linearstairs:view' => array(
           'captype' => 'read',
           'contextlevel' => CONTEXT_MODULE,
           'archetypes' => array(
               'guest' => CAP_ALLOW,
               'student' => CAP_ALLOW,
               'teacher' => CAP_ALLOW,
               'editingteacher' => CAP_ALLOW,
               'manager' => CAP_ALLOW
           )
       ),
       'mod/linearstairs:submit' => array(
           'captype' => 'write',
           'contextlevel' => CONTEXT_MODULE,
           'archetypes' => array(
               'student' => CAP_ALLOW
           )
       ),
   );
   ?>
   ```

5. **언어 파일 생성**
   `lang/en/linearstairs.php`:

   ```php
   <?php
   $string['modulename'] = 'Linear Stairs';
   $string['modulenameplural'] = 'Linear Stairs';
   $string['pluginname'] = 'Linear Stairs';
   $string['pluginadministration'] = 'Linear Stairs administration';

   $string['linearstairsname'] = 'Activity name';
   $string['linearstairsintro'] = 'Description';
   $string['firstterm'] = 'First term (a₁)';
   $string['commondiff'] = 'Common difference (d)';
   $string['termcount'] = 'Number of terms (n)';

   $string['linearstairs:addinstance'] = 'Add a new Linear Stairs activity';
   $string['linearstairs:view'] = 'View Linear Stairs activity';
   $string['linearstairs:submit'] = 'Submit answer';
   ?>
   ```

6. **Moodle 관리자 페이지에서 설치**
   - Moodle에 관리자로 로그인
   - `Site administration` → `Notifications` 접속
   - "Upgrade Moodle database now" 클릭
   - 플러그인이 자동으로 설치됨

7. **활동 추가**
   - 코스에서 "활동 또는 리소스 추가" 클릭
   - "Linear Stairs" 선택
   - 설정 입력 (이름, 첫째항, 공차, 항의 개수)
   - 저장

---

## MySQL 데이터베이스 직접 생성 (수동)

Moodle 플러그인 설치 없이 직접 테이블을 생성하려면:

```sql
-- Moodle 데이터베이스 사용
USE moodle;

-- Linear Stairs 활동 테이블
CREATE TABLE mdl_linearstairs (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    course BIGINT(10) NOT NULL DEFAULT 0,
    name VARCHAR(255) NOT NULL DEFAULT '',
    intro TEXT,
    introformat SMALLINT(4) NOT NULL DEFAULT 0,
    firstterm INT(11) NOT NULL DEFAULT 1,
    commondiff INT(11) NOT NULL DEFAULT 2,
    termcount INT(11) NOT NULL DEFAULT 5,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY course (course)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Linear Stairs activity instances';

-- 학생 답안 테이블
CREATE TABLE mdl_linearstairs_attempts (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    linearstairsid BIGINT(10) NOT NULL DEFAULT 0,
    userid BIGINT(10) NOT NULL DEFAULT 0,
    firstterm INT(11) NOT NULL,
    commondiff INT(11) NOT NULL,
    termcount INT(11) NOT NULL,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY linearstairsid (linearstairsid),
    KEY userid (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student attempts for Linear Stairs';

-- 외래 키 추가
ALTER TABLE mdl_linearstairs
    ADD CONSTRAINT fk_linearstairs_course
    FOREIGN KEY (course) REFERENCES mdl_course(id) ON DELETE CASCADE;

ALTER TABLE mdl_linearstairs_attempts
    ADD CONSTRAINT fk_attempts_linearstairs
    FOREIGN KEY (linearstairsid) REFERENCES mdl_linearstairs(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_attempts_user
    FOREIGN KEY (userid) REFERENCES mdl_user(id) ON DELETE CASCADE;
```

---

## PHP 7.1.9 호환성 확인

Linear Stairs는 Vanilla JavaScript로 작성되어 있어 PHP 버전과 무관합니다.
단, Moodle 플러그인 파일(view.php, submit.php)은 PHP 7.1.9와 호환됩니다.

**확인 사항:**
```bash
# PHP 버전 확인
php -v

# 필요한 PHP 확장 확인
php -m | grep -E "mysqli|json|mbstring"
```

---

## Moodle Web Services 활성화 (REST API 사용 시)

1. **Web Services 활성화**
   - `Site administration` → `Advanced features`
   - "Enable web services" 체크
   - 저장

2. **프로토콜 활성화**
   - `Site administration` → `Plugins` → `Web services` → `Manage protocols`
   - "REST protocol" 활성화

3. **서비스 생성**
   - `Site administration` → `Plugins` → `Web services` → `External services`
   - "Add" 클릭
   - 이름: "Linear Stairs Service"
   - "Authorised users only" 체크
   - 필요한 함수 추가

4. **토큰 발급**
   - `Site administration` → `Plugins` → `Web services` → `Manage tokens`
   - "Create token" 클릭
   - 사용자 선택 및 서비스 선택
   - 토큰 복사

5. **Linear Stairs에서 사용**
   ```
   http://your-domain.com/linear-stairs/index.html?moodle_url=https://your-moodle.com&token=YOUR_TOKEN
   ```

---

## 문제 해결

### 플러그인이 나타나지 않는 경우
- Moodle 캐시 삭제: `Site administration` → `Development` → `Purge all caches`
- 파일 권한 확인: `chmod -R 755 mod/linearstairs`

### iframe이 로드되지 않는 경우
- 브라우저 콘솔에서 CORS 오류 확인
- Moodle의 CSP(Content Security Policy) 설정 확인

### 답안이 제출되지 않는 경우
- 브라우저 콘솔에서 JavaScript 오류 확인
- Moodle 권한 설정 확인
- 데이터베이스 테이블이 정상적으로 생성되었는지 확인

---

## 참고 자료

- [Moodle Plugin Development](https://docs.moodle.org/dev/Main_Page)
- [Moodle Web Services](https://docs.moodle.org/dev/Web_services)
- [Moodle Activity Module](https://docs.moodle.org/dev/Activity_modules)

---

**설치 지원**: 문제가 발생하면 README.md 파일을 참고하거나 GitHub Issues에 문의하세요.
