# Moodle 연동 가이드

## 📋 목차
1. [시스템 요구사항](#시스템-요구사항)
2. [설치 방법](#설치-방법)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [API 엔드포인트](#api-엔드포인트)
5. [프론트엔드 통합](#프론트엔드-통합)
6. [보안 설정](#보안-설정)
7. [문제 해결](#문제-해결)

---

## 시스템 요구사항

### 필수 사항
- **PHP**: 7.1.9 이상 (권장: 7.4+)
- **MySQL**: 5.7 이상 (권장: 8.0+)
- **Moodle**: 3.7 이상 (권장: 3.11+)
- **웹 서버**: Apache 2.4+ 또는 Nginx 1.18+

### PHP 확장
```bash
# 필요한 PHP 확장 확인
php -m | grep -E "mysqli|json|mbstring|curl"
```

---

## 설치 방법

### 1단계: 플러그인 디렉토리 생성

```bash
# Moodle 루트 디렉토리로 이동
cd /var/www/html/moodle

# local 플러그인 디렉토리 생성
mkdir -p local/mysterycard
cd local/mysterycard
```

### 2단계: 파일 복사

```bash
# 프로젝트 파일 복사
cp -r /path/to/mystery-hint-card/* .

# 디렉토리 구조:
# local/mysterycard/
# ├── api/
# │   ├── moodle-integration.php
# │   └── database-schema.sql
# ├── js/
# ├── css/
# ├── index.html
# └── version.php (아래 생성)
```

### 3단계: Moodle 플러그인 메타데이터 생성

`local/mysterycard/version.php` 생성:

```php
<?php
defined('MOODLE_INTERNAL') || die();

$plugin->version   = 2025111800;        // YYYYMMDDXX
$plugin->requires  = 2019052000;        // Moodle 3.7
$plugin->component = 'local_mysterycard';
$plugin->maturity  = MATURITY_BETA;
$plugin->release   = 'v1.0.0';
```

### 4단계: Moodle에서 플러그인 설치

1. Moodle 관리자 로그인
2. **사이트 관리 > 알림** 접속
3. "데이터베이스 업그레이드" 실행
4. 플러그인 설치 확인

---

## 데이터베이스 설정

### 자동 설치 (권장)

Moodle의 XMLDB를 사용하여 자동 설치:

`local/mysterycard/db/install.xml` 생성:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<XMLDB PATH="local/mysterycard/db" VERSION="20251118"
       COMMENT="Mystery Hint Card tables"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:noNamespaceSchemaLocation="../../../lib/xmldb/xmldb.xsd">
  <TABLES>
    <!-- problems 테이블 -->
    <TABLE NAME="mysterycard_problems" COMMENT="Mystery card problems">
      <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="course_id" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="title" TYPE="char" LENGTH="255" NOTNULL="true"/>
        <FIELD NAME="content" TYPE="text" NOTNULL="true"/>
        <FIELD NAME="settings" TYPE="text" NOTNULL="true"/>
        <FIELD NAME="difficulty" TYPE="int" LENGTH="1" DEFAULT="1"/>
        <FIELD NAME="subject" TYPE="char" LENGTH="50" DEFAULT="mathematics"/>
        <FIELD NAME="created_by" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="created_at" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="updated_at" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="is_active" TYPE="int" LENGTH="1" DEFAULT="1"/>
      </FIELDS>
      <KEYS>
        <KEY NAME="primary" TYPE="primary" FIELDS="id"/>
      </KEYS>
      <INDEXES>
        <INDEX NAME="course_id" UNIQUE="false" FIELDS="course_id"/>
        <INDEX NAME="created_by" UNIQUE="false" FIELDS="created_by"/>
      </INDEXES>
    </TABLE>

    <!-- 추가 테이블들은 database-schema.sql 참고 -->
  </TABLES>
</XMLDB>
```

### 수동 설치

```bash
# MySQL에 직접 접속
mysql -u moodle_user -p moodle_db

# 스키마 실행
source /path/to/mystery-hint-card/api/database-schema.sql
```

---

## API 엔드포인트

### 기본 URL
```
https://your-moodle-site.com/local/mysterycard/api/moodle-integration.php
```

### 1. 문제 데이터 가져오기

**요청:**
```http
GET /local/mysterycard/api/moodle-integration.php?action=get_problem&problem_id=1
```

**응답:**
```json
{
  "success": true,
  "data": {
    "problemId": 1,
    "problemTitle": "분수 더하기: 1/4 + 2/4",
    "cards": [
      {
        "id": 1,
        "title": "힌트 1: 분수의 기본",
        "shape": "🍕",
        "text": "피자를 4조각으로 나누면..."
      }
    ],
    "settings": {
      "sequential": true,
      "allowSkip": false
    }
  }
}
```

### 2. 진행 상황 저장

**요청:**
```http
POST /local/mysterycard/api/moodle-integration.php?action=save_progress
Content-Type: application/x-www-form-urlencoded

problem_id=1&progress_data={"unlockedCards":[1,2,3]}
```

### 3. 힌트 사용 로그

**요청:**
```http
POST /local/mysterycard/api/moodle-integration.php?action=log_hint
Content-Type: application/x-www-form-urlencoded

problem_id=1&hint_id=1
```

### 4. 분석 데이터 (교사용)

**요청:**
```http
GET /local/mysterycard/api/moodle-integration.php?action=get_analytics&problem_id=1
```

---

## 프론트엔드 통합

### JavaScript 설정

`js/app.js`에서 Moodle 모드 활성화:

```javascript
const MoodleAPI = {
    baseURL: 'https://your-moodle-site.com/local/mysterycard/api/moodle-integration.php',

    async getProblemData(problemId) {
        const response = await fetch(
            `${this.baseURL}?action=get_problem&problem_id=${problemId}`,
            {
                credentials: 'include' // 쿠키 포함 (세션 유지)
            }
        );
        return await response.json();
    }
};
```

### HTML 임베딩

Moodle 페이지에 iframe으로 임베딩:

```html
<!-- Moodle 페이지 또는 블록에 추가 -->
<iframe
    src="/local/mysterycard/index.html?problemId=1&studentId=<?php echo $USER->id; ?>&mode=moodle"
    width="100%"
    height="800px"
    frameborder="0"
    allow="fullscreen">
</iframe>
```

### Moodle 블록 생성

`local/mysterycard/block_mysterycard.php`:

```php
<?php
class block_mysterycard extends block_base {
    public function init() {
        $this->title = get_string('pluginname', 'block_mysterycard');
    }

    public function get_content() {
        global $USER, $PAGE;

        $problem_id = $PAGE->url->get_param('problem_id') ?? 1;

        $this->content = new stdClass;
        $this->content->text = '<iframe
            src="/local/mysterycard/index.html?problemId=' . $problem_id . '&studentId=' . $USER->id . '&mode=moodle"
            width="100%" height="600px" frameborder="0"></iframe>';

        return $this->content;
    }
}
```

---

## 보안 설정

### 1. CORS 설정 (프로덕션)

`moodle-integration.php`에서 수정:

```php
// 개발 환경
// header('Access-Control-Allow-Origin: *');

// 프로덕션 환경
$allowed_origins = ['https://your-moodle-site.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

### 2. 권한 검증

모든 API 요청에서 Moodle 권한 확인:

```php
// 학생 권한 확인
require_capability('local/mysterycard:view', $context);

// 교사 권한 확인
require_capability('local/mysterycard:edit', $context);
```

### 3. SQL Injection 방지

Moodle의 데이터베이스 API 사용:

```php
// ❌ 잘못된 예
$sql = "SELECT * FROM problems WHERE id = " . $_GET['id'];

// ✅ 올바른 예
$problem = $DB->get_record('mysterycard_problems', ['id' => $problem_id]);
```

### 4. XSS 방지

출력 시 이스케이프:

```php
echo format_text($problem->title, FORMAT_HTML);
```

---

## 문제 해결

### 문제 1: API 404 오류

**원인**: Moodle이 파일을 찾지 못함

**해결**:
```bash
# 파일 권한 확인
chmod 644 local/mysterycard/api/moodle-integration.php

# .htaccess 확인
# local/mysterycard/.htaccess가 없는지 확인
```

### 문제 2: CORS 오류

**증상**: "Access-Control-Allow-Origin" 에러

**해결**:
```php
// moodle-integration.php 상단에 추가
header('Access-Control-Allow-Origin: https://your-domain.com');
header('Access-Control-Allow-Credentials: true');
```

### 문제 3: 세션 문제

**증상**: 로그인 상태가 유지되지 않음

**해결**:
```javascript
// fetch 호출 시 credentials 추가
fetch(url, {
    credentials: 'include',
    headers: {
        'X-Requested-With': 'XMLHttpRequest'
    }
});
```

### 문제 4: JSON 인코딩 오류

**원인**: MySQL 컬럼이 UTF-8이 아님

**해결**:
```sql
ALTER TABLE mdl_mysterycard_problems
CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 성능 최적화

### 1. 캐싱

Moodle 캐시 API 사용:

```php
$cache = cache::make('local_mysterycard', 'problems');

if (!$problem = $cache->get($problem_id)) {
    $problem = $DB->get_record('mysterycard_problems', ['id' => $problem_id]);
    $cache->set($problem_id, $problem);
}
```

### 2. 데이터베이스 인덱스

```sql
-- 자주 사용되는 쿼리 최적화
CREATE INDEX idx_logs_user_problem ON mdl_mysterycard_hint_logs(user_id, problem_id);
```

### 3. 비동기 로그

로그 기록을 비동기로 처리:

```javascript
// 힌트 개봉 시 백그라운드에서 로그
navigator.sendBeacon('/api/log_hint', JSON.stringify({...}));
```

---

## 추가 리소스

- [Moodle 플러그인 개발 문서](https://docs.moodle.org/dev)
- [Moodle 데이터베이스 API](https://docs.moodle.org/dev/Data_manipulation_API)
- [XMLDB 편집기](https://docs.moodle.org/dev/XMLDB_editor)

---

**지원**: 문제가 있으면 GitHub Issues에 등록하거나 개발팀에 문의하세요.
