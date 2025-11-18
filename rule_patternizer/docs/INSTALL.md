# Rule Patternizer - 설치 가이드 | Installation Guide

## 빠른 설치 | Quick Installation

### 1단계: 파일 복사 | Step 1: Copy Files

```bash
# Moodle 디렉토리로 이동
cd /path/to/your/moodle

# Rule Patternizer를 mod 디렉토리에 복사
cp -r /path/to/rule_patternizer ./mod/

# 권한 설정
chown -R www-data:www-data mod/rulepatternizer
chmod -R 755 mod/rulepatternizer
```

### 2단계: 데이터베이스 업그레이드 | Step 2: Database Upgrade

```
1. 브라우저에서 Moodle에 관리자로 로그인
2. Moodle이 자동으로 새 플러그인을 감지
3. "Site administration > Notifications" 접속
4. "Upgrade Moodle database now" 버튼 클릭
5. 업그레이드 완료 확인
```

### 3단계: 샘플 데이터 삽입 | Step 3: Insert Sample Data

#### A. 테이블 프리픽스 확인
```php
// config.php 파일에서 확인
$CFG->prefix = 'mdl_';  // 일반적으로 'mdl_'
```

#### B. SQL 파일 수정
```bash
# sample_data.sql 파일 복사
cp rule_patternizer/db/sample_data.sql /tmp/sample_data_modified.sql

# 파일 수정 (sed 명령어 또는 텍스트 에디터 사용)
sed -i 's/{rulepatternizer_rules}/mdl_rulepatternizer_rules/g' /tmp/sample_data_modified.sql
sed -i 's/{rulepatternizer_problems}/mdl_rulepatternizer_problems/g' /tmp/sample_data_modified.sql
```

#### C. 활동 인스턴스 생성
```
1. 코스로 이동
2. "Turn editing on" 클릭
3. "Add an activity or resource" 클릭
4. "Rule Patternizer" 선택
5. 이름 입력 (예: "Calculus Pattern Practice")
6. "Save and return to course" 클릭
7. 생성된 인스턴스 ID 확인 (URL에서 확인: ...view.php?id=XXX)
```

#### D. SQL 파일에서 instance_id 변경
```bash
# {instance_id}를 실제 ID로 변경
sed -i 's/{instance_id}/1/g' /tmp/sample_data_modified.sql
# 1을 실제 인스턴스 ID로 변경하세요
```

#### E. MySQL에서 실행
```bash
# MySQL 접속
mysql -u moodle_user -p moodle_db

# SQL 파일 실행
source /tmp/sample_data_modified.sql;

# 확인
SELECT COUNT(*) FROM mdl_rulepatternizer_rules;
SELECT COUNT(*) FROM mdl_rulepatternizer_problems;
```

### 4단계: 테스트 | Step 4: Testing

```
1. 학생 계정으로 로그인 (또는 학생 역할로 전환)
2. Rule Patternizer 활동 클릭
3. 우측 하단에 스마트폰 화면 확인
4. "Start Learning" 클릭
5. 규칙 선택 및 문제 풀기
6. 답안 제출 및 피드백 확인
```

---

## 상세 설치 | Detailed Installation

### 시스템 요구사항 확인 | Check System Requirements

#### PHP 버전 확인
```bash
php -v
# PHP 7.1.9 이상이어야 함
```

#### MySQL 버전 확인
```bash
mysql --version
# MySQL 5.7 이상 또는 MariaDB 10.2 이상
```

#### Moodle 버전 확인
```
Site administration > Notifications
# Moodle 3.7 이상
```

### Apache/Nginx 설정 | Web Server Configuration

#### Apache
```apache
<VirtualHost *:80>
    ServerName your-moodle-site.com
    DocumentRoot /path/to/moodle

    <Directory /path/to/moodle>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # mod_rewrite 활성화 필요
    RewriteEngine On
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-moodle-site.com;
    root /path/to/moodle;
    index index.php index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.1-fpm.sock;
    }
}
```

### 권한 설정 | File Permissions

```bash
# Moodle 디렉토리 권한
chown -R www-data:www-data /path/to/moodle
chmod -R 755 /path/to/moodle

# Rule Patternizer 권한
chmod 755 /path/to/moodle/mod/rulepatternizer
chmod 644 /path/to/moodle/mod/rulepatternizer/*.php
chmod 644 /path/to/moodle/mod/rulepatternizer/styles/*.css
chmod 644 /path/to/moodle/mod/rulepatternizer/amd/src/*.js
```

---

## 데이터베이스 설정 | Database Configuration

### 수동 테이블 생성 (옵션) | Manual Table Creation

Moodle 자동 업그레이드를 사용하지 않는 경우:

```sql
-- 1. rulepatternizer 테이블
CREATE TABLE mdl_rulepatternizer (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    course BIGINT(10) NOT NULL DEFAULT 0,
    name VARCHAR(255) NOT NULL,
    intro TEXT,
    introformat INT(4) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY course (course)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. rulepatternizer_rules 테이블
CREATE TABLE mdl_rulepatternizer_rules (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    rule_formula TEXT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    difficulty_level INT(2) NOT NULL DEFAULT 1,
    description TEXT,
    example TEXT,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY rule_name_idx (rule_name),
    KEY difficulty_idx (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. rulepatternizer_problems 테이블
CREATE TABLE mdl_rulepatternizer_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    rule_id BIGINT(10) NOT NULL,
    rulepatternizer_id BIGINT(10) NOT NULL,
    problem_text TEXT NOT NULL,
    problem_latex TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    hint TEXT,
    difficulty_level INT(2) NOT NULL DEFAULT 1,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY rule_idx (rule_id),
    KEY instance_idx (rulepatternizer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. rulepatternizer_progress 테이블
CREATE TABLE mdl_rulepatternizer_progress (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    rulepatternizer_id BIGINT(10) NOT NULL,
    rule_id BIGINT(10) NOT NULL,
    problem_id BIGINT(10) NOT NULL,
    attempts INT(5) NOT NULL DEFAULT 0,
    correct_count INT(5) NOT NULL DEFAULT 0,
    mastery_level INT(3) NOT NULL DEFAULT 0,
    last_attempt_time BIGINT(10) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY user_rule_idx (userid, rule_id),
    KEY mastery_idx (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. rulepatternizer_answers 테이블
CREATE TABLE mdl_rulepatternizer_answers (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) NOT NULL,
    problem_id BIGINT(10) NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct INT(1) NOT NULL DEFAULT 0,
    time_taken INT(10) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY user_problem_idx (userid, problem_id),
    KEY time_idx (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 문제 해결 | Troubleshooting

### 설치 중 오류 | Installation Errors

#### 오류: "Plugin is not compatible"
```
해결책:
1. Moodle 버전 확인 (3.7 이상)
2. version.php의 requires 값 확인
3. PHP 버전 확인 (7.1.9 이상)
```

#### 오류: "Database error"
```
해결책:
1. MySQL 사용자 권한 확인
2. 데이터베이스 이름 확인
3. config.php의 DB 설정 확인
```

#### 오류: "File permissions error"
```bash
# 권한 재설정
sudo chown -R www-data:www-data /path/to/moodle/mod/rulepatternizer
sudo chmod -R 755 /path/to/moodle/mod/rulepatternizer
```

### 런타임 오류 | Runtime Errors

#### JavaScript 로드 실패
```
해결책:
1. 브라우저 콘솔 확인
2. app.js 파일 경로 확인
3. 캐시 삭제 (Site administration > Development > Purge all caches)
```

#### CSS 스타일 미적용
```
해결책:
1. smartphone.css 파일 경로 확인
2. 브라우저 캐시 삭제
3. Moodle 테마 캐시 삭제
```

#### MathJax 렌더링 실패
```
해결책:
1. 인터넷 연결 확인 (CDN 사용)
2. 브라우저 콘솔에서 MathJax 로드 확인
3. Content Security Policy(CSP) 설정 확인
```

---

## 고급 설정 | Advanced Configuration

### 1. CDN 변경 | Change CDN

MathJax CDN을 변경하려면 `view.php` 수정:

```php
// 기존
$PAGE->requires->js(new moodle_url('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'));

// 변경
$PAGE->requires->js(new moodle_url('https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.0/es5/tex-mml-chtml.js'));
```

### 2. 스마트폰 위치 변경 | Change Smartphone Position

`styles/smartphone.css` 수정:

```css
/* 우측 하단 (기본) */
#rulepatternizer-container {
    bottom: 20px;
    right: 20px;
}

/* 좌측 하단으로 변경 */
#rulepatternizer-container {
    bottom: 20px;
    left: 20px;  /* right -> left */
}

/* 중앙 하단으로 변경 */
#rulepatternizer-container {
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
}
```

### 3. 답안 체크 알고리즘 개선 | Improve Answer Checking

`lib.php`의 `rulepatternizer_check_answer` 함수 수정:

```php
function rulepatternizer_check_answer($useranswer, $correctanswer) {
    // 공백 제거
    $useranswer = preg_replace('/\s+/', '', $useranswer);
    $correctanswer = preg_replace('/\s+/', '', $correctanswer);

    // 대소문자 무시
    $useranswer = strtolower($useranswer);
    $correctanswer = strtolower($correctanswer);

    // 동일 문자열 비교
    if ($useranswer === $correctanswer) {
        return true;
    }

    // 수학적 등가 비교 (추가 구현 필요)
    // 예: 2x와 x*2는 동일
    // 예: x^2*3과 3x^2는 동일

    return false;
}
```

---

## 제거 방법 | Uninstallation

```bash
# 1. Moodle에서 제거
# Site administration > Plugins > Activity modules > Rule Patternizer
# "Uninstall" 클릭

# 2. 파일 삭제
rm -rf /path/to/moodle/mod/rulepatternizer

# 3. 데이터베이스 테이블 삭제 (선택)
mysql -u moodle_user -p moodle_db
DROP TABLE mdl_rulepatternizer;
DROP TABLE mdl_rulepatternizer_rules;
DROP TABLE mdl_rulepatternizer_problems;
DROP TABLE mdl_rulepatternizer_progress;
DROP TABLE mdl_rulepatternizer_answers;
```

---

## 추가 리소스 | Additional Resources

- [Moodle Plugin Development](https://docs.moodle.org/dev/Main_Page)
- [Moodle Activity Modules](https://docs.moodle.org/dev/Activity_modules)
- [Moodle Database Schema](https://docs.moodle.org/dev/Database_Schema)
- [MathJax Documentation](https://docs.mathjax.org/en/latest/)

---

문의사항이 있으시면 언제든지 연락주세요! | Feel free to contact us for any questions!
