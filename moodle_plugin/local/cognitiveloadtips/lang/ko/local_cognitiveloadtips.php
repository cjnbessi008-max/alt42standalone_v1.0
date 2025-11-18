<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings for Cognitive Load Tips plugin
 *
 * @package    local_cognitiveloadtips
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin
$string['pluginname'] = '인지 부하 팁';
$string['cognitive_load_tips'] = '인지 부하 최소화 팁';

// Capabilities
$string['cognitiveloadtips:manage'] = '인지 부하 팁 관리';
$string['cognitiveloadtips:managequizsettings'] = '퀴즈 인지 부하 팁 설정 관리';
$string['cognitiveloadtips:viewtips'] = '인지 부하 팁 보기';
$string['cognitiveloadtips:assigndifficulty'] = '문제 난이도 지정';

// Difficulty levels
$string['difficulty_level'] = '난이도';
$string['difficulty_1'] = '매우 쉬움 ★☆☆☆☆';
$string['difficulty_2'] = '쉬움 ★★☆☆☆';
$string['difficulty_3'] = '보통 ★★★☆☆';
$string['difficulty_4'] = '어려움 ★★★★☆';
$string['difficulty_5'] = '매우 어려움 ★★★★★';

// Categories
$string['category_breathing'] = '호흡';
$string['category_focus'] = '집중';
$string['category_strategy'] = '전략';
$string['category_mindset'] = '마음가짐';
$string['category_general'] = '일반';

// Tip display
$string['tip_before_difficult_question'] = '문제를 풀기 전에 잠깐!';
$string['please_read_carefully'] = '천천히 읽어보세요';
$string['seconds'] = '초';
$string['was_this_helpful'] = '이 팁이 도움이 되었나요?';
$string['helpful'] = '도움됨';
$string['not_helpful'] = '도움 안됨';
$string['skip'] = '건너뛰기';
$string['continue_to_question'] = '문제 풀러 가기';
$string['feedback_thank_you'] = '피드백 감사합니다!';

// Quiz settings
$string['enable_tips'] = '인지 부하 팁 사용';
$string['enable_tips_desc'] = '어려운 문제 전에 인지 부하 최소화 팁 표시';
$string['show_before_difficulty'] = '팁 표시 난이도 기준';
$string['show_before_difficulty_help'] = '이 난이도 이상의 문제에 팁이 표시됩니다';
$string['random_tip'] = '무작위 팁 표시';
$string['random_tip_desc'] = '해당 난이도의 모든 팁 대신 무작위로 하나의 팁만 표시';
$string['allow_skip'] = '학생이 팁 건너뛰기 허용';
$string['allow_skip_desc'] = '학생이 팁을 건너뛰고 바로 문제로 이동할 수 있도록 허용';

// Admin
$string['manage_tips'] = '인지 부하 팁 관리';
$string['add_tip'] = '새 팁 추가';
$string['edit_tip'] = '팁 수정';
$string['delete_tip'] = '팁 삭제';
$string['tip_title'] = '팁 제목';
$string['tip_content'] = '팁 내용';
$string['tip_category'] = '카테고리';
$string['tip_difficulty_min'] = '최소 난이도';
$string['tip_difficulty_max'] = '최대 난이도';
$string['tip_duration'] = '표시 시간 (초)';
$string['tip_mandatory'] = '필수 읽기';
$string['tip_language'] = '언어';
$string['tip_enabled'] = '활성화';
$string['tip_sortorder'] = '정렬 순서';

// Statistics
$string['statistics'] = '사용 통계';
$string['total_tips'] = '전체 팁 수';
$string['total_interactions'] = '전체 상호작용';
$string['tips_shown'] = '표시된 팁';
$string['tips_skipped'] = '건너뛴 팁';
$string['avg_view_duration'] = '평균 조회 시간';
$string['popular_tips'] = '인기 팁';

// Messages
$string['tip_saved'] = '팁이 저장되었습니다';
$string['tip_deleted'] = '팁이 삭제되었습니다';
$string['no_tips'] = '사용 가능한 팁이 없습니다';
$string['confirm_delete'] = '정말 이 팁을 삭제하시겠습니까?';

// Privacy
$string['privacy:metadata:local_clt_user_interactions'] = '사용자의 인지 부하 팁 상호작용 기록';
$string['privacy:metadata:local_clt_user_interactions:userid'] = '팁을 본 사용자의 ID';
$string['privacy:metadata:local_clt_user_interactions:tipid'] = '조회한 팁의 ID';
$string['privacy:metadata:local_clt_user_interactions:questionid'] = '팁과 연관된 문제의 ID';
$string['privacy:metadata:local_clt_user_interactions:view_duration'] = '사용자가 팁을 본 시간';
$string['privacy:metadata:local_clt_user_interactions:was_helpful'] = '사용자가 팁이 도움이 되었다고 평가했는지 여부';
$string['privacy:metadata:local_clt_user_interactions:skipped'] = '사용자가 팁을 건너뛰었는지 여부';
$string['privacy:metadata:local_clt_user_interactions:timecreated'] = '상호작용이 발생한 시간';
