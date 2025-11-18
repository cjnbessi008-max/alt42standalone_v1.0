<?php
/**
 * Language strings for Alt42 Focus Tracking plugin
 *
 * @package    local_alt42_focus
 * @copyright  2025 Alt42 Standalone
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Alt42 Focus Tracking';
$string['alt42_focus'] = 'Alt42 Focus Tracking';

// Settings
$string['settings:api_base_url'] = 'API Base URL';
$string['settings:api_base_url_desc'] = 'Base URL for the Alt42 Focus Tracking API (e.g., http://localhost:8000/api/v1/focus)';
$string['settings:api_key'] = 'API Key';
$string['settings:api_key_desc'] = 'API key for authenticating with the focus tracking service';
$string['settings:instance_id'] = 'Instance ID';
$string['settings:instance_id_desc'] = 'Unique identifier for this Moodle instance (used in student IDs)';

// General strings
$string['focustracking'] = 'Focus Tracking';
$string['focustracking:enabled'] = 'Focus tracking enabled';
$string['focustracking:disabled'] = 'Focus tracking disabled';
$string['autobreaks'] = 'Automatic Breaks';
$string['autobreaks:enabled'] = 'Automatic breaks enabled';
$string['autobreaks:disabled'] = 'Automatic breaks disabled';
$string['idletimeout'] = 'Idle Timeout';
$string['idletimeout:desc'] = 'Time in seconds before a student is considered idle';
$string['breakfrequency'] = 'Break Frequency';
$string['breakfrequency:desc'] = 'Frequency of breaks in minutes';

// Routine strings
$string['routine:breathing'] = '10초 호흡 정렬';
$string['routine:stretching'] = '10초 스트레칭';
$string['routine:eye_exercise'] = '10초 눈 운동';
$string['routine:title'] = '정신정렬 루틴';
$string['routine:description'] = '집중력 회복을 위한 짧은 휴식';
$string['routine:start'] = '시작하기';
$string['routine:skip'] = '건너뛰기';
$string['routine:complete'] = '완료';
$string['routine:effectiveness'] = '이 루틴이 도움이 되었나요?';

// Analytics strings
$string['analytics:title'] = '집중도 분석';
$string['analytics:total_sessions'] = '총 학습 세션';
$string['analytics:study_time'] = '총 학습 시간';
$string['analytics:avg_focus_score'] = '평균 집중도 점수';
$string['analytics:total_breaks'] = '총 휴식 횟수';
$string['analytics:completion_rate'] = '루틴 완료율';

// Error messages
$string['error:api_connection'] = 'API 서버에 연결할 수 없습니다.';
$string['error:session_start'] = '세션을 시작할 수 없습니다.';
$string['error:session_end'] = '세션을 종료할 수 없습니다.';
$string['error:invalid_config'] = '잘못된 플러그인 설정입니다.';

// Capabilities
$string['alt42_focus:view'] = '집중도 추적 보기';
$string['alt42_focus:manage'] = '집중도 추적 관리';
$string['alt42_focus:viewanalytics'] = '분석 데이터 보기';
