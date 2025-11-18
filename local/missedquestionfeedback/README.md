# Missed Question Feedback Plugin for Moodle 3.7

이 플러그인은 학생들이 퀴즈에서 틀린 문제에 대해 개념적 피드백을 제공하여 오개념을 이해하고 학습을 개선할 수 있도록 돕습니다.

This plugin provides conceptual feedback on missed quiz questions to help students understand their misconceptions and improve their learning.

## 주요 기능 / Features

### 한국어
- **오개념 피드백**: 학생들이 틀린 문제에 대해 "이번 문제에서 놓친 건?" 섹션 표시
- **개념 매핑**: 문제와 흔한 오개념을 연결
- **분석 대시보드**: 교사가 학생들의 오개념 패턴을 파악
- **상호작용 추적**: 학생들의 피드백 조회 및 리소스 클릭 추적
- **다국어 지원**: 영어 및 한국어 지원

### English
- **Misconception Feedback**: Shows "What did you miss in this question?" section for incorrect answers
- **Concept Mapping**: Links questions to common misconceptions
- **Analytics Dashboard**: Teachers can identify misconception patterns
- **Interaction Tracking**: Tracks student feedback views and resource clicks
- **Multilingual**: Supports English and Korean

## 시스템 요구사항 / System Requirements

- **Moodle**: 3.7 or higher
- **PHP**: 7.1.9 or higher
- **MySQL**: 5.7 or higher

## 설치 방법 / Installation

### 1. 플러그인 설치 / Install Plugin

```bash
# Moodle 설치 디렉토리로 이동
cd /path/to/moodle

# 플러그인 복사
cp -r /path/to/missedquestionfeedback local/

# 또는 Git clone
cd local/
git clone <repository-url> missedquestionfeedback
```

### 2. 데이터베이스 업그레이드 / Upgrade Database

Moodle 관리자 페이지에 접속하면 자동으로 데이터베이스 업그레이드가 시작됩니다.

Visit the Moodle admin page to automatically trigger database upgrade.

```
https://your-moodle-site.com/admin
```

### 3. Moodle Quiz 모듈 수정 / Modify Moodle Quiz Module

**중요**: 퀴즈 리뷰 페이지에 피드백을 표시하려면 `mod/quiz/review.php` 파일을 수정해야 합니다.

**Important**: To display feedback in quiz review page, you need to modify `mod/quiz/review.php`.

#### 수정 방법 / Modification Steps

`mod/quiz/review.php` 파일에서 문제 피드백이 표시되는 부분을 찾아 다음 코드를 추가합니다:

Find the section where question feedback is displayed in `mod/quiz/review.php` and add:

```php
// Around line 200-250, after question feedback display
foreach ($questions as $questionid => $question) {
    // ... existing code for displaying question ...

    // ADD THIS:
    if (function_exists('local_missedquestionfeedback_quiz_review_question')) {
        $qa = $attemptobj->get_question_attempt($questionid);
        echo local_missedquestionfeedback_quiz_review_question($qa, $attemptobj->get_attemptid());
    }
}
```

또는 Moodle 템플릿 오버라이드를 사용하여 수정할 수 있습니다.

Alternatively, you can use Moodle template override to make this modification.

## 사용 방법 / Usage

### 관리자 / Administrators

#### 1. 개념 생성 / Create Concepts

```
사이트 관리 → Missed Question Feedback → Manage Concepts
Site Administration → Missed Question Feedback → Manage Concepts
```

예시 / Example:
- **이름 / Name**: "분수 덧셈 / Fraction Addition"
- **카테고리 / Category**: "수학 / Mathematics"
- **설명 / Description**: "서로 다른 분모를 가진 분수의 덧셈 / Adding fractions with different denominators"

#### 2. 오개념 생성 / Create Misconceptions

```
사이트 관리 → Missed Question Feedback → Manage Misconceptions
Site Administration → Missed Question Feedback → Manage Misconceptions
```

예시 / Example:
- **개념 / Concept**: "분수 덧셈"
- **이름 / Name**: "분자와 분모를 각각 더함"
- **설명 / Explanation**: "1/4 + 1/4 = 2/8이라고 생각함"
- **올바른 이해 / Correct Understanding**: "같은 분모일 때는 분자만 더하고 분모는 그대로 유지"
- **개선 방법 / Remediation**: "분수 덧셈 규칙을 복습하세요"
- **리소스 URL**: "https://example.com/fraction-addition"

#### 3. 문제 매핑 / Map Questions

```
사이트 관리 → Missed Question Feedback → Map Questions
Site Administration → Missed Question Feedback → Map Questions
```

특정 퀴즈 문제의 오답을 오개념과 연결합니다.

Link incorrect answers from specific quiz questions to misconceptions.

### 교사 / Teachers

#### 분석 보기 / View Analytics

코스 페이지에서 "Misconception Analytics" 메뉴를 통해 학생들의 오개념 패턴을 확인할 수 있습니다.

Access "Misconception Analytics" from course page to see student misconception patterns.

### 학생 / Students

퀴즈를 완료하고 결과를 리뷰할 때, 틀린 문제에 대한 피드백이 자동으로 표시됩니다:

When reviewing quiz results, feedback automatically appears for incorrect answers:

1. **테스트된 개념 / Concept Tested**
2. **당신의 오개념 / Your Misconception**
3. **올바른 이해 / Correct Understanding**
4. **개선 방법 / How to Improve**
5. **학습 리소스 링크 / Learn More Link**

## 데이터베이스 구조 / Database Schema

### 테이블 / Tables

1. **mdl_missed_feedback_concepts**
   - 학습 개념 저장 / Stores learning concepts

2. **mdl_missed_feedback_misconceptions**
   - 오개념 및 피드백 저장 / Stores misconceptions and feedback

3. **mdl_missed_feedback_interactions**
   - 학생 상호작용 추적 / Tracks student interactions

4. **mdl_missed_feedback_qmapping**
   - 문제-오개념 매핑 / Question-misconception mappings

## 권한 / Capabilities

- `local/missedquestionfeedback:view` - 피드백 보기 / View feedback (학생, 교사)
- `local/missedquestionfeedback:manage` - 개념 및 오개념 관리 / Manage concepts and misconceptions (교사, 관리자)
- `local/missedquestionfeedback:viewreports` - 분석 보고서 보기 / View analytics reports (교사, 관리자)

## 개발자 정보 / Developer Information

### 파일 구조 / File Structure

```
local/missedquestionfeedback/
├── version.php                 # Plugin metadata
├── lib.php                     # Main library functions
├── README.md                   # This file
├── classes/
│   ├── api.php                # Core API
│   └── output/
│       └── renderer.php       # Rendering functions
├── db/
│   ├── install.xml            # Database schema
│   └── access.php             # Capabilities
├── lang/
│   ├── en/                    # English strings
│   └── ko/                    # Korean strings
├── templates/
│   └── feedback_block.mustache # Feedback template
├── admin/
│   ├── concepts.php           # Manage concepts
│   └── misconceptions.php     # Manage misconceptions
├── amd/src/
│   └── feedback_tracker.js    # JavaScript for tracking
└── tests/
    └── api_test.php           # Unit tests
```

### API 사용 예제 / API Usage Examples

```php
use local_missedquestionfeedback\api;

// Get feedback for a question attempt
$feedback = api::get_feedback_for_attempt($questionattemptid, $questionid, $selectedanswerid);

// Create a concept
$concept = new stdClass();
$concept->name = 'Fraction Addition';
$concept->category = 'Mathematics';
$conceptid = api::save_concept($concept);

// Create a misconception
$misconception = new stdClass();
$misconception->conceptid = $conceptid;
$misconception->name = 'Adding numerators and denominators separately';
$misconception->explanation = 'Student thinks 1/4 + 1/4 = 2/8';
$misconception->correctunderstanding = 'When denominators are the same, add only numerators';
$misconception->severity = 2;
$misconceptionid = api::save_misconception($misconception);

// Map question to misconception
api::create_question_mapping($questionid, $misconceptionid, $wronganswerid);

// Get analytics
$analytics = api::get_course_analytics($courseid);
```

## 문제 해결 / Troubleshooting

### 피드백이 표시되지 않음 / Feedback not showing

1. `mod/quiz/review.php` 수정 확인 / Check `mod/quiz/review.php` modification
2. 플러그인 활성화 확인 / Verify plugin is enabled
3. 권한 확인 / Check capabilities
4. 문제-오개념 매핑 확인 / Verify question-misconception mapping

### 데이터베이스 오류 / Database errors

```bash
# 캐시 삭제 / Clear cache
php admin/cli/purge_caches.php

# 데이터베이스 업그레이드 / Upgrade database
php admin/cli/upgrade.php
```

## 라이선스 / License

GNU GPL v3 or later

## 지원 / Support

- GitHub Issues: [Create an issue](https://github.com/your-org/missedquestionfeedback/issues)
- Documentation: See `/docs_*.md` files for detailed implementation guides

## 기여 / Contributing

Pull requests are welcome! Please ensure:
- Code follows Moodle coding standards
- All strings are localized
- Database operations use Moodle DML
- Tests are included

## 변경 이력 / Changelog

### Version 1.0.0 (2025-11-18)
- Initial release
- Support for Moodle 3.7
- English and Korean language support
- Basic analytics dashboard
- Interaction tracking
