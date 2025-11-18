<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean strings for dualdance
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '듀얼 댄스';
$string['modulenameplural'] = '듀얼 댄스';
$string['modulename_help'] = '지수함수와 로그함수가 함께 "춤추는" 대화형 시각화로, 학생들이 두 함수 유형 간의 관계를 이해하도록 돕습니다.';
$string['dualdance:addinstance'] = '새로운 듀얼 댄스 활동 추가';
$string['dualdance:submit'] = '듀얼 댄스 문제 답안 제출';
$string['dualdance:view'] = '듀얼 댄스 보기';
$string['dualdance:viewreports'] = '듀얼 댄스 리포트 보기';
$string['pluginadministration'] = '듀얼 댄스 관리';
$string['pluginname'] = '듀얼 댄스';

// Settings
$string['dualdancename'] = '활동 이름';
$string['dualdancesettings'] = '듀얼 댄스 설정';
$string['difficulty'] = '난이도';
$string['difficulty_help'] = '생성되는 문제의 복잡도를 설정합니다 (1 = 매우 쉬움, 5 = 매우 어려움)';
$string['difficulty_1'] = '매우 쉬움';
$string['difficulty_2'] = '쉬움';
$string['difficulty_3'] = '보통';
$string['difficulty_4'] = '어려움';
$string['difficulty_5'] = '매우 어려움';

$string['exp_base_min'] = '지수 밑수 최소값';
$string['exp_base_max'] = '지수 밑수 최대값';
$string['log_base_min'] = '로그 밑수 최소값';
$string['log_base_max'] = '로그 밑수 최대값';

$string['animation_speed'] = '애니메이션 속도';
$string['animation_speed_help'] = '화면에서 함수가 애니메이션되는 속도를 조절합니다';
$string['speed_very_slow'] = '매우 느림';
$string['speed_slow'] = '느림';
$string['speed_normal'] = '보통';
$string['speed_fast'] = '빠름';
$string['speed_very_fast'] = '매우 빠름';

$string['completionattempts'] = '학생이 시도해야 하는 횟수:';

// Validation errors
$string['error_base_range'] = '최대값은 최소값보다 커야 합니다';
$string['error_base_greater_than_one'] = '밑수는 1보다 커야 합니다';

// View page
$string['dual_dance'] = '듀얼 댄스';
$string['exponential_log_functions'] = '지수함수 & 로그함수';
$string['your_progress'] = '당신의 진행 상황';
$string['current_grade'] = '현재 점수';
$string['attempts'] = '시도 횟수';
$string['correct'] = '정답';
$string['time'] = '시간';
$string['start'] = '문제 시작';
$string['submit'] = '답안 제출';
$string['next_problem'] = '다음 문제';
$string['enter_answer'] = '답을 입력하세요';
$string['click_start'] = '"문제 시작"을 클릭하여 시작하세요';
$string['loading'] = '로딩 중...';

// Questions
$string['question_exponential'] = '계산하세요: {$a->coeff} × {$a->base}^{$a->x}';
$string['question_logarithmic'] = '계산하세요: {$a->coeff} × log<sub>{$a->base}</sub>({$a->value})';
$string['question_intersection'] = '이 함수들이 교차하는 x 값은 무엇인가요?<br>f(x) = {$a->exp_coeff} × {$a->exp_base}^x<br>g(x) = {$a->log_coeff} × log<sub>{$a->log_base}</sub>(x)';

// Feedback
$string['correct'] = '정답입니다!';
$string['incorrect'] = '오답';
$string['correct_answer'] = '정답은: {$a}';
$string['try_again'] = '다시 시도해보세요!';

// Instructions
$string['instructions'] = '사용 방법';
$string['instruction_1'] = '그래프에서 지수함수(빨강)와 로그함수(파랑)가 춤추는 것을 보세요';
$string['instruction_2'] = '표시된 문제를 풀고 답을 입력하세요';
$string['instruction_3'] = '답을 제출하여 즉각적인 피드백과 진행 상황을 확인하세요';

$string['no$dualdanceinstances'] = '이 코스에서 듀얼 댄스 활동을 찾을 수 없습니다';
