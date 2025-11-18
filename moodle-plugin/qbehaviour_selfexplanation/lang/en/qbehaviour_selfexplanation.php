<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Strings for component 'qbehaviour_selfexplanation', language 'en'
 *
 * @package    qbehaviour_selfexplanation
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Self-explanation';
$string['privacy:metadata'] = 'The Self-explanation question behaviour plugin does not store any personal data.';

// Explanation prompts
$string['explainprompt'] = 'Explain why your answer is correct';
$string['explainprompt_help'] = 'Provide a detailed explanation of your reasoning, including:
<ul>
<li>How you understood the problem</li>
<li>What concepts or formulas you used</li>
<li>Step-by-step solution process</li>
</ul>';

$string['explanationrequired'] = 'You got the correct answer! Now explain why it is correct.';
$string['explanationoptional'] = 'You can optionally explain your reasoning:';
$string['submitexplanation'] = 'Submit explanation';
$string['explanationplaceholder'] = 'Example: This problem involves adding fractions, so I first found a common denominator...';

// Validation messages
$string['explanationtoo_short'] = 'Your explanation is too short. Please provide more detail (minimum {$a} characters).';
$string['explanationblocked_phrase'] = 'Your explanation contains phrases that suggest lack of understanding. Please explain the actual reasoning process.';
$string['explanationmissing_keywords'] = 'Your explanation is missing important concepts. Make sure to explain HOW you solved the problem.';
$string['explanationrejected'] = 'Explanation rejected. Please revise.';

// Character/word count
$string['charcount'] = '{$a->current} / {$a->min} characters';
$string['wordcount'] = '{$a->current} / {$a->min} words';

// Settings
$string['enable_globally'] = 'Enable self-explanation globally';
$string['enable_globally_desc'] = 'Enable the self-explanation behaviour for all quizzes by default';
$string['default_min_words'] = 'Default minimum words';
$string['default_min_words_desc'] = 'Default minimum number of words required in explanations';
$string['default_min_chars'] = 'Default minimum characters';
$string['default_min_chars_desc'] = 'Default minimum number of characters required in explanations';
$string['claude_api_key'] = 'Claude API Key';
$string['claude_api_key_desc'] = 'API key for Claude AI analysis (optional). Get one at https://console.anthropic.com/';
$string['enable_ai_analysis'] = 'Enable AI analysis';
$string['enable_ai_analysis_desc'] = 'Use Claude AI to analyze explanation quality (requires API key)';

// Quiz settings
$string['require_on_correct'] = 'Require explanation on correct answers';
$string['require_on_correct_help'] = 'Students must explain their reasoning when they answer correctly';
$string['require_on_incorrect'] = 'Require explanation on incorrect answers';
$string['require_on_incorrect_help'] = 'Students must explain their reasoning when they answer incorrectly';
$string['min_words'] = 'Minimum words';
$string['min_words_help'] = 'Minimum number of words required in the explanation';
$string['min_chars'] = 'Minimum characters';
$string['min_chars_help'] = 'Minimum number of characters required in the explanation';
$string['blocked_phrases'] = 'Blocked phrases';
$string['blocked_phrases_help'] = 'Comma-separated list of phrases that are not allowed (e.g., "I don\'t know", "just guessed")';
$string['required_keywords'] = 'Required keywords';
$string['required_keywords_help'] = 'Comma-separated list of keywords that should appear in the explanation';

// Reports
$string['viewexplanations'] = 'View student explanations';
$string['explanationquality'] = 'Explanation quality';
$string['qualityscore'] = 'Quality score';
$string['aifeedback'] = 'AI feedback';
$string['teacherrating'] = 'Teacher rating';
$string['teachercomment'] = 'Teacher comment';
$string['noexplanations'] = 'No explanations submitted yet';

// Capabilities
$string['selfexplanation:view'] = 'View student explanations';
$string['selfexplanation:rate'] = 'Rate and comment on explanations';
$string['selfexplanation:configure'] = 'Configure self-explanation settings';

// Additional strings
$string['explanationaccepted'] = 'Thank you! Your explanation has been accepted.';
$string['yourexplanation'] = 'Your explanation';
$string['ai_settings'] = 'AI Analysis Settings';
$string['ai_settings_desc'] = 'Configure Claude AI integration for automatic explanation analysis';
$string['explanationcopied_from_question'] = 'Your explanation appears to be copied from the question. Please explain in your own words.';
