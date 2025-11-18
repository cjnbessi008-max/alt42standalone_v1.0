# Moodle Self-Explanation Question Behaviour Plugin

## 개요 (Overview)

이 플러그인은 Moodle 3.7 LMS에서 학생들이 정답을 맞혀도 "왜 이 풀이가 맞는지" 스스로 설명하게 하는 기능을 제공합니다.

This plugin enables students to explain "why their solution is correct" even when they get the right answer in Moodle 3.7 LMS.

**주요 기능 (Key Features)**:
- ✅ 정답 후 설명 의무화 (Mandatory explanation after correct answers)
- ✅ 실시간 유효성 검증 (Real-time validation)
- ✅ 품질 분석 및 점수 (Quality analysis and scoring)
- ✅ AI 피드백 (Claude API 연동) (AI feedback via Claude API)
- ✅ 한국어/영어 지원 (Korean/English support)
- ✅ 교사 대시보드 (Teacher dashboard)

---

## 시스템 요구사항 (System Requirements)

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache 2.4+ or Nginx
- **Optional**: Claude API key for AI analysis

---

## 설치 방법 (Installation)

### 1. 플러그인 다운로드 및 배치

```bash
# Moodle 루트 디렉토리로 이동
cd /path/to/moodle

# 플러그인 디렉토리에 복사
cp -r qbehaviour_selfexplanation question/behaviour/

# 권한 설정 (웹 서버 사용자에게 읽기 권한 부여)
chown -R www-data:www-data question/behaviour/qbehaviour_selfexplanation
chmod -R 755 question/behaviour/qbehaviour_selfexplanation
```

### 2. Moodle 관리자 페이지에서 설치

1. 웹 브라우저로 Moodle 사이트 접속
2. 관리자 계정으로 로그인
3. **Site administration** → **Notifications** 이동
4. "Plugins requiring attention" 목록에서 **Self-explanation** 플러그인 확인
5. **Upgrade Moodle database now** 버튼 클릭
6. 데이터베이스 테이블 생성 확인:
   - `mdl_qbehaviour_selfexplanation`
   - `mdl_qbehaviour_selfexpl_config`
   - `mdl_qbehaviour_selfexpl_keywords`

### 3. 플러그인 설정

**Site administration** → **Plugins** → **Question behaviours** → **Self-explanation**

#### 기본 설정 (Basic Settings)

| 설정 항목 | 권장 값 | 설명 |
|----------|--------|------|
| Enable globally | ✓ | 전역 활성화 |
| Require on correct | ✓ | 정답 시 설명 필수 |
| Require on incorrect | ✗ | 오답 시 설명 선택 |
| Default min words | 20 | 최소 단어 수 |
| Default min chars | 50 | 최소 글자 수 |

#### AI 분석 설정 (AI Analysis - Optional)

1. [Anthropic Console](https://console.anthropic.com/)에서 API 키 발급
2. **Claude API Key** 필드에 입력
3. **Enable AI analysis** 체크
4. 저장

---

## 사용 방법 (Usage)

### 교사용 (For Teachers)

#### 1. 퀴즈에서 Self-Explanation 활성화

**방법 A: 퀴즈 생성 시**

1. 코스 페이지에서 **Add an activity or resource** → **Quiz**
2. 퀴즈 설정에서:
   - **Question behaviour**: "Self-explanation" 선택
   - **Review options**: "The attempt" 체크 (설명 확인용)
3. 저장

**방법 B: 기존 퀴즈 수정**

1. 퀴즈 → **Settings**
2. **Question behaviour**: "Self-explanation"으로 변경
3. 저장

#### 2. 문제별 키워드 설정 (선택사항)

퀴즈 품질을 높이려면 각 문제에 필수 키워드를 등록하세요:

```sql
-- 예: 분수 덧셈 문제 (ID: 123)
INSERT INTO mdl_qbehaviour_selfexpl_keywords
(questionid, keyword, category, importance, timecreated)
VALUES
(123, '통분', 'concept', 5, 1700000000),
(123, '분모', 'concept', 4, 1700000000),
(123, '공통', 'method', 3, 1700000000);
```

#### 3. 학생 설명 보기

1. 퀴즈 → **Results** → **Responses**
2. 학생 이름 클릭 → 각 문제의 설명 확인
3. 설명 품질 점수 및 AI 피드백 확인

#### 4. 설명에 교사 평가 추가

```php
// 관리 페이지나 별도 스크립트에서 실행
global $DB;

$explanation_id = 456; // 설명 레코드 ID

$DB->set_field('qbehaviour_selfexplanation', 'teacher_rating', 5,
    array('id' => $explanation_id));
$DB->set_field('qbehaviour_selfexplanation', 'teacher_comment',
    '매우 명확한 설명입니다!', array('id' => $explanation_id));
```

### 학생용 (For Students)

#### 1. 퀴즈 응시

1. 코스 페이지에서 퀴즈 클릭
2. **Attempt quiz now** 버튼 클릭
3. 문제 풀이 후 답안 제출

#### 2. 설명 작성

정답을 맞힌 경우:

1. ✓ "정답입니다!" 메시지 표시
2. **설명 입력란** 나타남
3. 다음 내용을 포함하여 작성:
   - 문제를 어떻게 이해했는지
   - 어떤 개념/공식을 사용했는지
   - 단계별 풀이 과정

**예시**:
```
이 문제는 분수의 덧셈이므로 먼저 통분을 해야 합니다.
1/4와 1/2의 분모를 4로 맞추면 1/4 + 2/4가 됩니다.
분자끼리 더하면 3/4가 정답입니다.
```

4. 최소 글자/단어 수 충족 확인 (실시간 표시)
5. **설명 제출** 버튼 클릭

#### 3. 설명이 거부된 경우

다음과 같은 경우 재작성 요청:
- ❌ 너무 짧은 설명
- ❌ "모르겠다", "그냥" 같은 금지어 사용
- ❌ 중요 개념 키워드 누락

**개선 방법**:
- 구체적인 단계 추가
- 사용한 개념 명시
- 왜 그렇게 풀었는지 이유 설명

---

## 고급 설정 (Advanced Configuration)

### 퀴즈별 커스텀 설정

데이터베이스에 직접 설정:

```sql
INSERT INTO mdl_qbehaviour_selfexpl_config
(quizid, questionid, require_on_correct, require_on_incorrect,
 min_words, min_chars, enable_ai_analysis, blocked_phrases,
 required_keywords, timecreated)
VALUES
(42, NULL, 1, 0, 30, 100, 1,
 '["모르겠다", "그냥", "대충"]',
 '["개념", "공식", "과정"]',
 UNIX_TIMESTAMP());
```

### 금지어 및 필수 키워드 관리

#### 금지어 (Blocked Phrases)

```json
["모르겠다", "그냥", "I don't know", "just guessed", "lucky", "운"]
```

#### 필수 키워드 (Required Keywords)

문제별로 설정하거나 전역 설정:

```json
["공식", "계산", "과정", "단계", "개념", "이유"]
```

---

## 데이터베이스 스키마 (Database Schema)

### `mdl_qbehaviour_selfexplanation`

학생 설명 저장

| 필드 | 타입 | 설명 |
|-----|------|------|
| id | BIGINT(10) | Primary key |
| questionattemptid | BIGINT(10) | Question attempt ID |
| userid | BIGINT(10) | Student user ID |
| questionid | BIGINT(10) | Question ID |
| attemptid | BIGINT(10) | Quiz attempt ID |
| explanation | TEXT | 설명 내용 |
| word_count | INT(5) | 단어 수 |
| char_count | INT(6) | 글자 수 |
| quality_score | DECIMAL(3,2) | 품질 점수 (0.00-1.00) |
| ai_feedback | TEXT | AI 피드백 |
| teacher_rating | TINYINT(1) | 교사 평가 (1-5) |
| teacher_comment | TEXT | 교사 코멘트 |
| timecreated | BIGINT(10) | 생성 시간 |
| timemodified | BIGINT(10) | 수정 시간 |

### 학생 설명 조회 쿼리 예시

```sql
-- 특정 퀴즈의 모든 설명 조회
SELECT
    se.id,
    u.firstname,
    u.lastname,
    q.name AS question_name,
    se.explanation,
    se.quality_score,
    se.timecreated
FROM mdl_qbehaviour_selfexplanation se
JOIN mdl_user u ON se.userid = u.id
JOIN mdl_question q ON se.questionid = q.id
WHERE se.attemptid IN (
    SELECT id FROM mdl_quiz_attempts WHERE quiz = 42
)
ORDER BY se.quality_score DESC;
```

---

## 문제 해결 (Troubleshooting)

### 1. 플러그인이 목록에 나타나지 않음

**원인**: 파일 권한 또는 경로 문제

**해결**:
```bash
# 권한 확인
ls -la question/behaviour/qbehaviour_selfexplanation

# 올바른 경로 확인
# 맞음: moodle/question/behaviour/qbehaviour_selfexplanation/version.php
# 틀림: moodle/qbehaviour_selfexplanation/version.php

# 권한 수정
chmod -R 755 question/behaviour/qbehaviour_selfexplanation
```

### 2. 설명 입력란이 나타나지 않음

**원인**: 퀴즈에 behaviour가 설정되지 않음

**해결**:
1. 퀴즈 → Settings
2. Question behaviour → "Self-explanation" 선택
3. 저장 후 새로운 attempt 시작

### 3. JavaScript가 작동하지 않음

**원인**: AMD 모듈 컴파일 필요

**해결**:
```bash
# Moodle 루트에서 실행
php admin/cli/purge_caches.php

# 또는 웹 인터페이스에서
# Site administration → Development → Purge all caches
```

### 4. AI 분석이 작동하지 않음

**원인**: API 키 문제 또는 네트워크 제한

**해결**:
```bash
# 1. API 키 확인
# Site administration → Plugins → Self-explanation → Claude API Key

# 2. curl로 API 접근 테스트
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'

# 3. PHP curl 확인
php -r "var_dump(function_exists('curl_init'));"

# 4. 방화벽 확인 (서버에서 외부 API 접근 가능한지)
```

### 5. 데이터베이스 에러

**원인**: 테이블 생성 실패

**해결**:
```sql
-- 수동으로 테이블 생성
-- install.xml 참조하여 CREATE TABLE 문 실행

-- 또는 재설치
DROP TABLE IF EXISTS mdl_qbehaviour_selfexplanation;
DROP TABLE IF EXISTS mdl_qbehaviour_selfexpl_config;
DROP TABLE IF EXISTS mdl_qbehaviour_selfexpl_keywords;

-- Moodle 관리자 페이지에서 Notifications 다시 실행
```

---

## 성능 최적화 (Performance Optimization)

### 1. 데이터베이스 인덱스

```sql
-- 추가 인덱스 (대규모 사이트용)
CREATE INDEX idx_timecreated ON mdl_qbehaviour_selfexplanation(timecreated);
CREATE INDEX idx_userid_questionid ON mdl_qbehaviour_selfexplanation(userid, questionid);
```

### 2. 캐싱

```php
// lib.php에 추가 (custom cache definition)
$definitions = array(
    'explanationconfig' => array(
        'mode' => cache_store::MODE_APPLICATION,
        'ttl' => 3600,
    ),
);
```

### 3. AI 분석 비동기 처리

현재는 동기 방식이지만, 대규모 사이트는 Moodle Task API 사용:

```php
// classes/task/analyze_explanation_task.php
class analyze_explanation_task extends \core\task\adhoc_task {
    public function execute() {
        $data = $this->get_custom_data();
        $analyzer = new qbehaviour_selfexplanation_ai_analyzer();
        $analyzer->process_async($data->explanation_id);
    }
}
```

---

## 보안 고려사항 (Security Considerations)

### 1. 입력 검증

- ✅ XSS 방지: `clean_param()` 사용
- ✅ SQL Injection 방지: `$DB->insert_record()` 사용
- ✅ CSRF 방지: Moodle 세션 토큰 자동 검증

### 2. API 키 보호

```php
// settings.php에서 API 키는 암호화 저장
$settings->add(new admin_setting_configpasswordunmask(
    'qbehaviour_selfexplanation/claude_api_key',
    get_string('claude_api_key', 'qbehaviour_selfexplanation'),
    get_string('claude_api_key_desc', 'qbehaviour_selfexplanation'),
    ''
));
```

### 3. GDPR 준수

```php
// classes/privacy/provider.php 구현 완료
// - 개인 데이터 수집 명시
// - 데이터 내보내기 기능
// - 데이터 삭제 기능
```

---

## 개발자 가이드 (Developer Guide)

### 플러그인 구조

```
qbehaviour_selfexplanation/
├── version.php              # 플러그인 메타데이터
├── behaviour.php            # 핵심 동작 클래스
├── renderer.php             # UI 렌더링
├── settings.php             # 관리자 설정
├── db/
│   ├── install.xml         # DB 스키마
│   └── access.php          # 권한 정의
├── classes/
│   ├── explanation_analyzer.php  # 분석 엔진
│   ├── ai_analyzer.php           # AI 통합
│   └── privacy/provider.php      # GDPR
├── lang/
│   ├── en/                       # 영어 문자열
│   └── ko/                       # 한국어 문자열
├── amd/src/
│   └── explanation.js            # JavaScript (AMD)
└── styles.css                    # 스타일시트
```

### 커스텀 분석기 추가

```php
// classes/custom_analyzer.php
class qbehaviour_selfexplanation_custom_analyzer
    extends qbehaviour_selfexplanation_analyzer {

    public function validate_explanation($explanation, $config, $question) {
        $errors = parent::validate_explanation($explanation, $config, $question);

        // 커스텀 검증 로직
        if ($this->has_bad_grammar($explanation)) {
            $errors[] = 'bad_grammar';
        }

        return $errors;
    }

    protected function has_bad_grammar($text) {
        // 문법 체크 로직
        return false;
    }
}
```

### 이벤트 추가

```php
// classes/event/explanation_submitted.php
namespace qbehaviour_selfexplanation\event;

class explanation_submitted extends \core\event\base {
    protected function init() {
        $this->data['crud'] = 'c';
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }
}

// 사용
\qbehaviour_selfexplanation\event\explanation_submitted::create([
    'objectid' => $explanation->id,
    'context' => $context
])->trigger();
```

---

## 라이선스 (License)

GNU General Public License v3.0 or later

---

## 지원 (Support)

- **Issues**: [GitHub Issues](https://github.com/kaist-touch-math/moodle-qbehaviour-selfexplanation/issues)
- **Email**: support@kaist-touchmath.ac.kr
- **Documentation**: [Wiki](https://github.com/kaist-touch-math/moodle-qbehaviour-selfexplanation/wiki)

---

## 업데이트 로그 (Changelog)

### Version 1.0.0 (2025-11-18)

- ✨ Initial release
- ✅ Self-explanation requirement on correct answers
- ✅ Real-time validation
- ✅ Quality scoring
- ✅ Claude AI integration
- ✅ Korean/English support
- ✅ Teacher dashboard
- ✅ GDPR compliance

---

## 기여 (Contributing)

Pull requests are welcome! For major changes, please open an issue first.

```bash
# Fork the repo
git clone https://github.com/your-username/moodle-qbehaviour-selfexplanation
cd moodle-qbehaviour-selfexplanation

# Create a branch
git checkout -b feature/your-feature

# Make changes and test

# Commit
git commit -am "Add your feature"

# Push
git push origin feature/your-feature

# Create Pull Request on GitHub
```

---

## 크레딧 (Credits)

- **Developer**: KAIST Touch Math Academy
- **AI Integration**: Anthropic Claude API
- **Inspired by**: Chi, M. T. (2000). Self-explaining expository texts

---

**Made with ❤️ for better education**
