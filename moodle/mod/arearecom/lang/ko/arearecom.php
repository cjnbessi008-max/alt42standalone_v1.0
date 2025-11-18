<?php
/**
 * Korean strings for Area Recombination activity module
 *
 * @package    mod_arearecom
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['modulename'] = '넓이 재조합기';
$string['modulenameplural'] = '넓이 재조합기';
$string['modulename_help'] = '넓이 재조합기 활동은 학생들이 도형을 자르고 재배열하면서 넓이 불변의 원리를 탐구할 수 있게 합니다.

학생들은 다음을 수행할 수 있습니다:

* 다양한 난이도의 도형 선택
* 도형을 여러 조각으로 자르기
* 조각들을 이동하고 재배열하기
* 전체 넓이가 일정하게 유지되는지 확인하기

이 상호작용 도구는 학생들이 기하학적 넓이 보존에 대한 깊은 이해를 발전시키는 데 도움이 됩니다.';
$string['pluginadministration'] = '넓이 재조합기 관리';
$string['pluginname'] = '넓이 재조합기';

// Form strings
$string['arearec_name'] = '활동 이름';
$string['settings'] = '활동 설정';
$string['grade_settings'] = '성적 설정';

// Settings
$string['difficulty_level'] = '난이도';
$string['difficulty_level_help'] = '도형의 난이도를 선택하세요:<br>
- 모든 난이도: 학생들이 원하는 난이도를 선택할 수 있습니다<br>
- 쉬움: 간단한 도형 (삼각형, 직사각형)<br>
- 보통: 중간 복잡도 (평행사변형, 사다리꼴)<br>
- 어려움: 복잡한 다각형';

$string['all_difficulties'] = '모든 난이도';
$string['difficulty_easy'] = '쉬움 (레벨 1)';
$string['difficulty_medium'] = '보통 (레벨 2)';
$string['difficulty_hard'] = '어려움 (레벨 3)';

$string['max_attempts'] = '최대 시도 횟수';
$string['max_attempts_help'] = '점수에 영향을 미치기 전 도형당 허용되는 최대 시도 횟수입니다.';

$string['enable_hints'] = '힌트 활성화';
$string['enable_sound'] = '소리 효과 활성화';

// Errors
$string['error_max_attempts'] = '최대 시도 횟수는 최소 1 이상이어야 합니다';
$string['error_gradepass'] = '통과 점수는 0에서 100 사이여야 합니다';

// Capabilities
$string['arearecom:addinstance'] = '새로운 넓이 재조합기 활동 추가';
$string['arearecom:view'] = '넓이 재조합기 활동 보기';
$string['arearecom:submit'] = '넓이 재조합기 시도 제출';

// Events
$string['eventcoursemoduleviewed'] = '코스 모듈 조회됨';
