<?php
/**
 * Korean language strings for reasoning clip plugin
 *
 * @package    local_reasoningclip
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = '추론 클립';
$string['reasoningclip'] = '추론 클립';

// Capabilities
$string['reasoningclip:view'] = '자신의 추론 클립 보기';
$string['reasoningclip:viewall'] = '모든 학생의 추론 클립 보기';
$string['reasoningclip:manage'] = '추론 클립 설정 관리';
$string['reasoningclip:delete'] = '추론 클립 삭제';

// Dashboard
$string['dashboard'] = '추론 클립 대시보드';
$string['reasoningclips_dashboard'] = '학생 추론 순간 대시보드';
$string['filters'] = '필터';
$string['statistics'] = '통계';
$string['total_clips'] = '총 감지된 클립 수: {$a}';

// Clip types
$string['cliptype'] = '클립 유형';
$string['all_types'] = '모든 유형';
$string['cliptype_breakthrough'] = '돌파 순간';
$string['cliptype_struggle'] = '고민 기간';
$string['cliptype_rapid_solve'] = '빠른 해결';
$string['cliptype_pause_think'] = '생각하는 시간';
$string['cliptype_systematic'] = '체계적 접근';
$string['cliptype_trial_error'] = '시행착오';

// Table headers
$string['student'] = '학생';
$string['activity'] = '활동';
$string['question'] = '문제';
$string['confidence'] = '신뢰도';
$string['timespent'] = '소요 시간';
$string['timecreated'] = '감지 시각';
$string['actions'] = '작업';

// Actions
$string['view'] = '상세 보기';
$string['filter'] = '필터';
$string['delete'] = '삭제';

// Settings
$string['settings_header'] = '추론 클립 설정';
$string['detection_threshold'] = '감지 임계값';
$string['detection_threshold_desc'] = '클립을 저장하기 위한 최소 신뢰도 점수 (0-1)';
$string['enabled_clip_types'] = '활성화된 클립 유형';
$string['enabled_clip_types_desc'] = '감지할 추론 순간의 유형을 선택하세요';
$string['auto_analyze'] = '자동 세션 분석';
$string['auto_analyze_desc'] = '학생 세션을 자동으로 분석하여 추론 순간을 감지합니다';

// Errors
$string['nopermission'] = '이 리소스에 접근할 권한이 없습니다';
$string['clipnotfound'] = '추론 클립을 찾을 수 없습니다';
$string['invalidparameters'] = '잘못된 매개변수가 제공되었습니다';

// Privacy
$string['privacy:metadata:local_reasoningclip'] = '학생 문제 해결 중 감지된 추론 순간을 저장합니다';
$string['privacy:metadata:local_reasoningclip:userid'] = '학생의 ID';
$string['privacy:metadata:local_reasoningclip:clipdata'] = '추론 순간에 대한 데이터';
$string['privacy:metadata:local_reasoningclip:timecreated'] = '클립이 생성된 시각';

$string['privacy:metadata:local_reasoningclip_events'] = '분석을 위한 학생 상호작용 이벤트를 저장합니다';
$string['privacy:metadata:local_reasoningclip_events:userid'] = '학생의 ID';
$string['privacy:metadata:local_reasoningclip_events:eventdata'] = '상호작용 이벤트에 대한 데이터';
$string['privacy:metadata:local_reasoningclip_events:timecreated'] = '이벤트가 발생한 시각';

// Clip descriptions
$string['clip_description_breakthrough'] = '학생이 문제로 고민한 후 돌파구를 찾았습니다';
$string['clip_description_struggle'] = '학생이 개념에 대해 지속적인 어려움을 보이고 있습니다';
$string['clip_description_rapid_solve'] = '학생이 문제를 빠르게 해결하여 강한 이해도를 나타냅니다';
$string['clip_description_pause_think'] = '학생이 행동을 취하기 전에 생각하는 시간을 가졌습니다';
$string['clip_description_systematic'] = '학생이 체계적인 문제 해결 접근법을 보여주었습니다';
$string['clip_description_trial_error'] = '학생이 시행착오 전략을 사용했습니다';
