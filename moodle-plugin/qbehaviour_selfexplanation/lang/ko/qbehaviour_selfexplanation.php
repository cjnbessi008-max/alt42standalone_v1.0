<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Strings for component 'qbehaviour_selfexplanation', language 'ko'
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = '자기설명';
$string['privacy:metadata'] = '자기설명 문제 동작 플러그인은 개인 데이터를 저장하지 않습니다.';

// Explanation prompts
$string['explainprompt'] = '왜 이 답이 맞는지 설명해주세요';
$string['explainprompt_help'] = '다음 내용을 포함하여 자세히 설명해주세요:
<ul>
<li>문제를 어떻게 이해했는지</li>
<li>어떤 개념이나 공식을 사용했는지</li>
<li>단계별 풀이 과정</li>
</ul>';

$string['explanationrequired'] = '정답입니다! 이제 왜 이 답이 맞는지 설명해주세요.';
$string['explanationoptional'] = '선택사항으로 풀이 과정을 설명할 수 있습니다:';
$string['submitexplanation'] = '설명 제출';
$string['explanationplaceholder'] = '예: 이 문제는 분수의 덧셈이므로 먼저 통분을 해야 합니다...';

// Validation messages
$string['explanationtoo_short'] = '설명이 너무 짧습니다. 더 자세히 설명해주세요 (최소 {$a}자).';
$string['explanationblocked_phrase'] = '설명에 이해 부족을 나타내는 표현이 포함되어 있습니다. 실제 풀이 과정을 설명해주세요.';
$string['explanationmissing_keywords'] = '설명에 중요한 개념이 빠져있습니다. 어떻게 문제를 풀었는지 설명해주세요.';
$string['explanationrejected'] = '설명이 거부되었습니다. 다시 작성해주세요.';

// Character/word count
$string['charcount'] = '{$a->current} / {$a->min} 글자';
$string['wordcount'] = '{$a->current} / {$a->min} 단어';

// Settings
$string['enable_globally'] = '전역 자기설명 활성화';
$string['enable_globally_desc'] = '모든 퀴즈에 기본으로 자기설명 동작 활성화';
$string['default_min_words'] = '기본 최소 단어 수';
$string['default_min_words_desc'] = '설명에 필요한 기본 최소 단어 수';
$string['default_min_chars'] = '기본 최소 글자 수';
$string['default_min_chars_desc'] = '설명에 필요한 기본 최소 글자 수';
$string['claude_api_key'] = 'Claude API 키';
$string['claude_api_key_desc'] = 'Claude AI 분석용 API 키 (선택사항). https://console.anthropic.com/ 에서 발급';
$string['enable_ai_analysis'] = 'AI 분석 활성화';
$string['enable_ai_analysis_desc'] = 'Claude AI를 사용하여 설명 품질 분석 (API 키 필요)';

// Quiz settings
$string['require_on_correct'] = '정답 시 설명 필수';
$string['require_on_correct_help'] = '학생이 정답을 맞혔을 때 설명을 작성하도록 요구';
$string['require_on_incorrect'] = '오답 시 설명 필수';
$string['require_on_incorrect_help'] = '학생이 오답을 제출했을 때 설명을 작성하도록 요구';
$string['min_words'] = '최소 단어 수';
$string['min_words_help'] = '설명에 필요한 최소 단어 수';
$string['min_chars'] = '최소 글자 수';
$string['min_chars_help'] = '설명에 필요한 최소 글자 수';
$string['blocked_phrases'] = '금지 표현';
$string['blocked_phrases_help'] = '사용할 수 없는 표현 목록 (쉼표로 구분, 예: "모르겠다", "그냥")';
$string['required_keywords'] = '필수 키워드';
$string['required_keywords_help'] = '설명에 포함되어야 하는 키워드 목록 (쉼표로 구분)';

// Reports
$string['viewexplanations'] = '학생 설명 보기';
$string['explanationquality'] = '설명 품질';
$string['qualityscore'] = '품질 점수';
$string['aifeedback'] = 'AI 피드백';
$string['teacherrating'] = '교사 평가';
$string['teachercomment'] = '교사 코멘트';
$string['noexplanations'] = '아직 제출된 설명이 없습니다';

// Capabilities
$string['selfexplanation:view'] = '학생 설명 보기';
$string['selfexplanation:rate'] = '설명 평가 및 코멘트';
$string['selfexplanation:configure'] = '자기설명 설정 구성';

// Additional strings
$string['explanationaccepted'] = '감사합니다! 설명이 수락되었습니다.';
$string['yourexplanation'] = '당신의 설명';
$string['ai_settings'] = 'AI 분석 설정';
$string['ai_settings_desc'] = '자동 설명 분석을 위한 Claude AI 통합 설정';
$string['explanationcopied_from_question'] = '설명이 문제에서 복사된 것으로 보입니다. 자신의 말로 설명해주세요.';
