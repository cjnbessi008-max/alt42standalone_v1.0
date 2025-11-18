# Moodle Self-Explanation Plugin Architecture

## 개요 (Overview)

**목적**: Moodle 3.7 LMS에서 학생이 정답을 맞혀도 "왜 이 풀이가 맞는지" 스스로 설명하게 하는 기능

**플러그인 타입**: Question Behavior Plugin (`qbehaviour_selfexplanation`)

**기술 스택**:
- **Moodle**: 3.7
- **PHP**: 7.1.9
- **MySQL**: 5.7
- **JavaScript**: ES5 (Moodle 3.7 호환)
- **AI Integration**: Claude API (optional, for explanation analysis)

---

## 1. 플러그인 구조 (Plugin Structure)

```
question/behaviour/selfexplanation/
├── version.php                    # 플러그인 메타데이터
├── lang/
│   ├── en/
│   │   └── qbehaviour_selfexplanation.php
│   └── ko/
│       └── qbehaviour_selfexplanation.php
├── behaviour.php                  # 핵심 동작 클래스
├── renderer.php                   # UI 렌더링
├── db/
│   ├── install.xml               # 데이터베이스 스키마
│   └── access.php                # 권한 설정
├── classes/
│   ├── explanation_analyzer.php  # 설명 분석기
│   └── privacy/                  # GDPR 준수
│       └── provider.php
├── settings.php                   # 관리자 설정
├── styles.css                     # 스타일시트
└── module.js                      # JavaScript 동작

```

---

## 2. 핵심 기능 (Core Features)

### 2.1 정답 후 설명 요구 (Require Explanation After Correct Answer)

**동작 흐름**:
1. 학생이 문제에 답을 제출
2. 시스템이 정답 여부 확인
3. **정답일 경우**: 설명 입력 필드 표시 (강제)
4. **오답일 경우**: 선택사항 또는 설정에 따라 처리
5. 설명 제출 후 다음 문제로 진행

### 2.2 설명 품질 분석 (Explanation Quality Analysis)

**Level 1 - 기본 검증** (PHP):
- 최소 글자 수 확인 (기본: 50자)
- 금지어 필터 ("모르겠다", "그냥", 등)
- 핵심 키워드 포함 여부

**Level 2 - AI 분석** (Optional, Claude API):
- 논리적 일관성 평가
- 개념 이해도 측정
- 자동 피드백 생성

### 2.3 교사 대시보드 (Teacher Dashboard)

- 학생별 설명 이력 조회
- 설명 품질 통계
- 우수 설명 사례 모음
- 오개념 패턴 분석

---

## 3. 데이터베이스 스키마 (Database Schema)

### 3.1 `mdl_qbehaviour_selfexplanation`

학생의 설명 데이터 저장

```sql
CREATE TABLE mdl_qbehaviour_selfexplanation (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    questionattemptid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    questionid BIGINT(10) NOT NULL,
    attemptid BIGINT(10) NOT NULL,
    explanation TEXT NOT NULL,
    word_count INT(5) DEFAULT 0,
    char_count INT(6) DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT NULL COMMENT '0.00-1.00',
    ai_feedback TEXT DEFAULT NULL,
    teacher_rating TINYINT(1) DEFAULT NULL COMMENT '1-5 stars',
    teacher_comment TEXT DEFAULT NULL,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,

    INDEX idx_userid (userid),
    INDEX idx_questionid (questionid),
    INDEX idx_attemptid (attemptid),
    INDEX idx_quality (quality_score),
    FOREIGN KEY (userid) REFERENCES mdl_user(id),
    FOREIGN KEY (questionid) REFERENCES mdl_question(id),
    FOREIGN KEY (attemptid) REFERENCES mdl_quiz_attempts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 `mdl_qbehaviour_selfexpl_config`

퀴즈/문제별 설정

```sql
CREATE TABLE mdl_qbehaviour_selfexpl_config (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    quizid BIGINT(10) NOT NULL,
    questionid BIGINT(10) DEFAULT NULL COMMENT 'NULL = applies to all questions',
    require_on_correct TINYINT(1) DEFAULT 1,
    require_on_incorrect TINYINT(1) DEFAULT 0,
    min_words INT(4) DEFAULT 20,
    min_chars INT(5) DEFAULT 50,
    enable_ai_analysis TINYINT(1) DEFAULT 0,
    blocked_phrases TEXT DEFAULT NULL COMMENT 'JSON array',
    required_keywords TEXT DEFAULT NULL COMMENT 'JSON array',
    timecreated BIGINT(10) NOT NULL,

    INDEX idx_quizid (quizid),
    INDEX idx_questionid (questionid),
    FOREIGN KEY (quizid) REFERENCES mdl_quiz(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 `mdl_qbehaviour_selfexpl_keywords`

과목/문제별 핵심 키워드

```sql
CREATE TABLE mdl_qbehaviour_selfexpl_keywords (
    id BIGINT(10) PRIMARY KEY AUTO_INCREMENT,
    questionid BIGINT(10) NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT NULL COMMENT 'concept, method, formula, etc.',
    importance TINYINT(1) DEFAULT 1 COMMENT '1-5',
    timecreated BIGINT(10) NOT NULL,

    INDEX idx_questionid (questionid),
    INDEX idx_keyword (keyword),
    FOREIGN KEY (questionid) REFERENCES mdl_question(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Moodle Question Behavior 통합

### 4.1 Behaviour 클래스 구조

```php
// behaviour.php
class qbehaviour_selfexplanation extends question_behaviour_with_save {

    // 정답 확인 후 설명 요구 상태로 전환
    public function process_submit(question_attempt_pending_step $pendingstep) {
        // 1. 답안 채점
        // 2. 정답 시 EXPLANATION_REQUIRED 상태로 전환
        // 3. 오답 시 설정에 따라 처리
    }

    // 설명 제출 처리
    public function process_explanation(question_attempt_pending_step $pendingstep) {
        // 1. 설명 유효성 검증
        // 2. DB 저장
        // 3. AI 분석 (optional)
        // 4. 완료 상태로 전환
    }

    // 상태별 다음 액션 정의
    public function get_expected_data() {
        return array(
            'answer' => PARAM_RAW,
            'explanation' => PARAM_RAW_TRIMMED,
            '-submit' => PARAM_BOOL,
            '-submitexplanation' => PARAM_BOOL
        );
    }
}
```

### 4.2 상태 전이 다이어그램

```
[START] → [ANSWER_SUBMITTED]
             ↓
        [GRADING]
         ↙     ↘
    [INCORRECT]  [CORRECT]
         ↓            ↓
    [FINISHED]  [EXPLANATION_REQUIRED]
                     ↓
                [EXPLANATION_SUBMITTED]
                     ↓
                [VALIDATION]
                 ↙       ↘
         [REJECTED]    [ACCEPTED]
              ↓             ↓
    [RE_EXPLANATION]  [FINISHED]
```

---

## 5. UI 컴포넌트 (UI Components)

### 5.1 설명 입력 폼

```html
<div class="qbehaviour-selfexplanation-container">
    <div class="correct-answer-indicator">
        ✓ 정답입니다! (Correct!)
    </div>

    <div class="explanation-prompt">
        <h4>왜 이 답이 맞는지 설명해주세요:</h4>
        <p class="hint">
            - 문제를 어떻게 이해했는지
            - 어떤 개념/공식을 사용했는지
            - 단계별 풀이 과정
        </p>
    </div>

    <textarea
        name="explanation"
        class="explanation-input"
        rows="6"
        placeholder="예: 이 문제는 분수의 덧셈이므로..."
        required>
    </textarea>

    <div class="explanation-feedback">
        <span class="char-count">0 / 50자</span>
        <span class="word-count">0 / 20단어</span>
    </div>

    <button type="submit" name="-submitexplanation" class="btn btn-primary">
        설명 제출 (Submit Explanation)
    </button>
</div>
```

### 5.2 실시간 유효성 검증 (JavaScript)

```javascript
// module.js
M.qbehaviour_selfexplanation = {
    init: function(Y, config) {
        var textarea = Y.one('.explanation-input');
        var submitBtn = Y.one('button[name="-submitexplanation"]');

        textarea.on('input', function() {
            var text = textarea.get('value');
            var charCount = text.length;
            var wordCount = text.trim().split(/\s+/).length;

            // 실시간 카운트 업데이트
            Y.one('.char-count').setHTML(charCount + ' / ' + config.minChars + '자');
            Y.one('.word-count').setHTML(wordCount + ' / ' + config.minWords + '단어');

            // 버튼 활성화/비활성화
            if (charCount >= config.minChars && wordCount >= config.minWords) {
                submitBtn.set('disabled', false);
            } else {
                submitBtn.set('disabled', true);
            }
        });
    }
};
```

---

## 6. 설명 품질 분석 엔진

### 6.1 기본 분석 (PHP)

```php
// classes/explanation_analyzer.php
class qbehaviour_selfexplanation_analyzer {

    /**
     * 기본 품질 검증
     */
    public function validate_explanation($explanation, $config) {
        $errors = array();

        // 1. 길이 검증
        if (strlen($explanation) < $config->min_chars) {
            $errors[] = 'too_short';
        }

        // 2. 금지어 확인
        $blocked = json_decode($config->blocked_phrases);
        foreach ($blocked as $phrase) {
            if (stripos($explanation, $phrase) !== false) {
                $errors[] = 'blocked_phrase';
                break;
            }
        }

        // 3. 필수 키워드 확인
        $keywords = $this->get_question_keywords($config->questionid);
        $found_count = 0;
        foreach ($keywords as $keyword) {
            if (stripos($explanation, $keyword->keyword) !== false) {
                $found_count++;
            }
        }

        if ($found_count < count($keywords) * 0.3) { // 30% 이상 포함
            $errors[] = 'missing_keywords';
        }

        return $errors;
    }

    /**
     * 품질 점수 계산 (0.00 - 1.00)
     */
    public function calculate_quality_score($explanation, $question) {
        $score = 0.0;

        // 1. 길이 점수 (0.3)
        $length_score = min(strlen($explanation) / 200, 1.0) * 0.3;

        // 2. 키워드 점수 (0.4)
        $keyword_score = $this->keyword_coverage($explanation, $question) * 0.4;

        // 3. 구조 점수 (0.3)
        $structure_score = $this->structure_analysis($explanation) * 0.3;

        return $length_score + $keyword_score + $structure_score;
    }
}
```

### 6.2 AI 분석 (Claude API Integration)

```php
// classes/ai_analyzer.php
class qbehaviour_selfexplanation_ai_analyzer {

    /**
     * Claude API로 설명 분석
     */
    public function analyze_with_ai($explanation, $question_text, $correct_answer) {
        $api_key = get_config('qbehaviour_selfexplanation', 'claude_api_key');

        $prompt = <<<EOT
다음은 수학 문제와 학생의 정답, 그리고 학생이 작성한 설명입니다.

문제: {$question_text}
정답: {$correct_answer}
학생 설명: {$explanation}

다음 기준으로 평가해주세요:
1. 논리적 일관성 (0-10점)
2. 개념 이해도 (0-10점)
3. 설명 명확성 (0-10점)
4. 개선 제안 (1-2문장)

JSON 형식으로 응답:
{
    "logic_score": 8,
    "concept_score": 9,
    "clarity_score": 7,
    "feedback": "개선 제안 내용..."
}
EOT;

        $client = new \Anthropic\ApiClient($api_key);
        $response = $client->messages()->create([
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => 500,
            'messages' => [
                ['role' => 'user', 'content' => $prompt]
            ]
        ]);

        return json_decode($response['content'][0]['text']);
    }
}
```

---

## 7. 관리자 설정 (Admin Settings)

### 7.1 전역 설정

```php
// settings.php
$settings->add(new admin_setting_configcheckbox(
    'qbehaviour_selfexplanation/enable_globally',
    get_string('enable_globally', 'qbehaviour_selfexplanation'),
    get_string('enable_globally_desc', 'qbehaviour_selfexplanation'),
    1
));

$settings->add(new admin_setting_configtext(
    'qbehaviour_selfexplanation/default_min_words',
    get_string('default_min_words', 'qbehaviour_selfexplanation'),
    get_string('default_min_words_desc', 'qbehaviour_selfexplanation'),
    20,
    PARAM_INT
));

$settings->add(new admin_setting_configtext(
    'qbehaviour_selfexplanation/claude_api_key',
    get_string('claude_api_key', 'qbehaviour_selfexplanation'),
    get_string('claude_api_key_desc', 'qbehaviour_selfexplanation'),
    '',
    PARAM_TEXT
));
```

---

## 8. 통합 시나리오 (Integration Scenarios)

### 시나리오 1: 분수 덧셈 문제

**문제**: 1/4 + 1/2 = ?

**학생 답변**: 3/4 (정답)

**시스템 동작**:
1. ✓ "정답입니다!" 표시
2. 설명 입력 폼 표시
3. 학생 설명: "먼저 분모를 같게 만들어야 합니다. 1/2를 2/4로 바꾸면, 1/4 + 2/4 = 3/4가 됩니다."
4. 품질 분석:
   - 키워드 확인: "분모", "같게", "바꾸면" ✓
   - 길이: 52자 ✓
   - 품질 점수: 0.85
5. AI 피드백: "논리적으로 잘 설명했습니다. 통분 개념을 정확히 이해하고 있습니다."
6. 완료, 다음 문제로

### 시나리오 2: 불충분한 설명

**학생 답변**: 3/4 (정답)

**학생 설명**: "계산했더니 3/4가 나왔습니다."

**시스템 동작**:
1. 품질 분석:
   - 금지어 발견: "계산했더니" (과정 없음)
   - 키워드 미포함: "분모", "통분"
   - 품질 점수: 0.25
2. ✗ "설명이 부족합니다. 어떻게 계산했는지 단계별로 설명해주세요."
3. 재입력 요청

---

## 9. 성능 최적화 (Performance Optimization)

### 9.1 캐싱 전략

```php
// 퀴즈 설정 캐싱
$cache = cache::make('qbehaviour_selfexplanation', 'config');
$config = $cache->get('quiz_' . $quizid);

if (!$config) {
    $config = $DB->get_record('qbehaviour_selfexpl_config', array('quizid' => $quizid));
    $cache->set('quiz_' . $quizid, $config);
}
```

### 9.2 비동기 AI 분석

- 설명 제출 즉시 학생은 다음 문제로 진행
- AI 분석은 백그라운드 작업으로 처리 (Moodle adhoc tasks)
- 피드백은 퀴즈 완료 후 제공

---

## 10. 보안 고려사항 (Security Considerations)

### 10.1 입력 검증

- XSS 방지: `clean_param($explanation, PARAM_TEXT)`
- SQL Injection 방지: `$DB->insert_record()` 사용
- CSRF 토큰 검증: `require_sesskey()`

### 10.2 권한 확인

```php
// 학생만 설명 제출 가능
require_capability('mod/quiz:attempt', $context);

// 교사만 설정 변경 가능
require_capability('mod/quiz:manage', $context);
```

### 10.3 개인정보 보호 (GDPR)

```php
// classes/privacy/provider.php
class provider implements
    \core_privacy\local\metadata\provider,
    \core_privacy\local\request\plugin\provider {

    // 수집 데이터 명시
    public static function get_metadata(collection $collection) : collection {
        $collection->add_database_table('qbehaviour_selfexplanation', [
            'userid' => 'privacy:metadata:userid',
            'explanation' => 'privacy:metadata:explanation',
            'timecreated' => 'privacy:metadata:timecreated',
        ], 'privacy:metadata:qbehaviour_selfexplanation');

        return $collection;
    }

    // 데이터 내보내기
    public static function export_user_data(approved_contextlist $contextlist) {
        // 구현...
    }

    // 데이터 삭제
    public static function delete_data_for_user(approved_contextlist $contextlist) {
        // 구현...
    }
}
```

---

## 11. 테스트 계획 (Testing Plan)

### 11.1 단위 테스트 (PHPUnit)

```php
// tests/analyzer_test.php
class qbehaviour_selfexplanation_analyzer_testcase extends advanced_testcase {

    public function test_validate_explanation() {
        $this->resetAfterTest();

        $analyzer = new qbehaviour_selfexplanation_analyzer();
        $config = (object)[
            'min_chars' => 50,
            'min_words' => 10,
            'blocked_phrases' => '["모르겠다", "그냥"]'
        ];

        // 테스트 1: 너무 짧은 설명
        $errors = $analyzer->validate_explanation('짧은 설명', $config);
        $this->assertContains('too_short', $errors);

        // 테스트 2: 금지어 포함
        $errors = $analyzer->validate_explanation('그냥 계산했습니다...', $config);
        $this->assertContains('blocked_phrase', $errors);
    }
}
```

### 11.2 통합 테스트

- Moodle 퀴즈 완전 실행 테스트
- 다양한 문제 유형 테스트 (객관식, 주관식, 수학 등)
- 다중 사용자 동시 접속 테스트

### 11.3 사용자 수용 테스트 (UAT)

- 교사: 설정 편의성, 대시보드 유용성
- 학생: UI 직관성, 부담 수준
- 관리자: 성능, 안정성

---

## 12. 배포 계획 (Deployment Plan)

### Phase 1: 설치 (Installation)

```bash
# 플러그인 디렉토리에 복사
cp -r qbehaviour_selfexplanation /path/to/moodle/question/behaviour/

# Moodle 관리자 페이지 접속
# Site administration > Notifications
# 플러그인 설치 및 DB 업그레이드 실행
```

### Phase 2: 설정 (Configuration)

1. **전역 설정**: Site administration > Plugins > Question behaviours > Self-explanation
2. **퀴즈별 설정**: Quiz settings > Question behaviour > Self-explanation
3. **AI 키 등록**: Claude API key 입력 (선택사항)

### Phase 3: 파일럿 테스트

- 소규모 과목(1-2개)에서 2주간 테스트
- 학생 50명 이하
- 피드백 수집 및 개선

### Phase 4: 전체 배포

- 전체 과목으로 확대
- 모니터링 대시보드 활성화
- 교사 교육 세션 진행

---

## 13. 모니터링 지표 (Monitoring Metrics)

### 13.1 사용 지표

- 일일 설명 제출 수
- 평균 설명 길이
- 평균 품질 점수
- 재제출 비율

### 13.2 성능 지표

- 설명 저장 시간 (목표: <500ms)
- AI 분석 시간 (목표: <3초)
- 페이지 로딩 시간 (목표: <2초)

### 13.3 교육 효과 지표

- 학습 이해도 향상 (사전/사후 테스트)
- 메타인지 능력 변화
- 교사 만족도 (NPS)

---

## 14. 향후 확장 (Future Enhancements)

### Phase 2 기능

1. **동료 평가**: 다른 학생의 설명을 읽고 평가
2. **우수 설명 갤러리**: 모범 사례 공유
3. **게임화**: 설명 품질에 따른 배지/포인트
4. **음성 설명**: 음성 녹음 지원
5. **다국어 지원**: 영어, 중국어 등

### Phase 3 기능

1. **적응형 피드백**: 학생 수준별 맞춤 피드백
2. **개념 네트워크 시각화**: 설명에서 추출한 개념 맵
3. **교사 대시보드 고도화**: ML 기반 인사이트
4. **외부 LMS 연동**: Canvas, Blackboard 등

---

## 15. 참고자료 (References)

### Moodle 개발 문서

- [Question API](https://docs.moodle.org/dev/Question_API)
- [Question behaviours](https://docs.moodle.org/dev/Question_behaviours)
- [Database API](https://docs.moodle.org/dev/Data_manipulation_API)

### 교육 연구

- Chi, M. T. (2000). Self-explaining expository texts
- Rittle-Johnson, B. (2006). Promoting transfer: Effects of self-explanation
- Aleven, V. (2003). Help seeking and intelligent tutoring systems

### API 문서

- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/)
- [Moodle 3.7 Release Notes](https://docs.moodle.org/37/en/Main_page)

---

**작성일**: 2025-11-18
**버전**: 1.0
**작성자**: Claude (AI Assistant)
