<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings for Cognitive Pause Tracking
 *
 * @package    local_cogpause
 * @copyright  2024 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = '인지 멈춤 추적';
$string['cogpause'] = '인지 멈춤';

// Settings
$string['settings_header'] = '인지 멈춤 추적 설정';
$string['enable_tracking'] = '멈춤 추적 활성화';
$string['enable_tracking_desc'] = '모든 퀴즈에 대해 인지 멈춤 추적을 활성화합니다';
$string['pause_threshold'] = '멈춤 기준 시간 (밀리초)';
$string['pause_threshold_desc'] = '멈춤으로 간주되기 전 비활동 시간 (밀리초)';
$string['thinking_threshold'] = '사고 기준 시간 (밀리초)';
$string['thinking_threshold_desc'] = '이 시간보다 짧은 멈춤은 "사고 중"으로 분류됩니다';
$string['confusion_threshold'] = '혼란 기준 시간 (밀리초)';
$string['confusion_threshold_desc'] = '사고와 이 기준 사이의 멈춤은 "혼란"으로 분류됩니다';
$string['distraction_threshold'] = '산만함 기준 시간 (밀리초)';
$string['distraction_threshold_desc'] = '이 시간보다 긴 멈춤은 "산만함"으로 분류됩니다';

// Capabilities
$string['cogpause:view'] = '인지 멈춤 데이터 보기';
$string['cogpause:viewown'] = '자신의 인지 멈춤 데이터 보기';
$string['cogpause:manage'] = '인지 멈춤 설정 관리';

// Dashboard
$string['dashboard_title'] = '인지 멈춤 분석 대시보드';
$string['student_profile'] = '학생 인지 프로필';
$string['question_analysis'] = '문제 멈춤 분석';
$string['at_risk_students'] = '위험 학생';
$string['pause_visualization'] = '멈춤 시각화';

// Pause types
$string['pause_type_thinking'] = '사고 중';
$string['pause_type_confusion'] = '혼란';
$string['pause_type_distraction'] = '산만함';
$string['pause_type_rereading'] = '재독';
$string['pause_type_unknown'] = '알 수 없음';

// Analytics
$string['total_pauses'] = '총 멈춤 횟수';
$string['avg_pause_duration'] = '평균 멈춤 시간';
$string['cognitive_load_score'] = '인지 부하 점수';
$string['struggle_indicator'] = '어려움 지표';
$string['pause_difficulty_score'] = '멈춤 난이도 점수';

// Messages
$string['tracking_enabled'] = '이 퀴즈에서 멈춤 추적이 활성화되었습니다';
$string['tracking_disabled'] = '멈춤 추적이 비활성화되었습니다';
$string['data_saved_success'] = '멈춤 데이터가 성공적으로 저장되었습니다';
$string['data_saved_error'] = '멈춤 데이터 저장 중 오류 발생';

// Privacy
$string['privacy:metadata:cognitive_pause_events'] = '퀴즈 시도 중 인지 멈춤 이벤트를 저장합니다';
$string['privacy:metadata:cognitive_pause_events:userid'] = '사용자 ID';
$string['privacy:metadata:cognitive_pause_events:pause_start_time'] = '멈춤 시작 시간';
$string['privacy:metadata:cognitive_pause_events:pause_duration_ms'] = '멈춤 지속 시간';
$string['privacy:metadata:cognitive_pause_events:pause_type'] = '감지된 멈춤 유형';
