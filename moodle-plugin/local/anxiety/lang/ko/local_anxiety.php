<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings
 *
 * @package    local_anxiety
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = '불안 감지 시스템';

// Capabilities
$string['anxiety:view'] = '자신의 불안 데이터 보기';
$string['anxiety:viewothers'] = '다른 사용자의 불안 데이터 보기';
$string['anxiety:manage'] = '불안 감지 설정 관리';
$string['anxiety:receivealerts'] = '불안 알림 수신';

// Dashboard
$string['dashboard'] = '불안 대시보드';
$string['anxiety_dashboard'] = '불안 모니터링 대시보드';
$string['anxiety_report_for'] = '{$a}의 불안 리포트';
$string['current_status'] = '현재 상태';
$string['anxiety_trend'] = '불안 추세';
$string['anxiety_distribution'] = '불안 수준 분포';
$string['students_overview'] = '학생 개요';
$string['recent_alerts'] = '최근 알림';
$string['view_dashboard'] = '대시보드 보기';

// Time ranges
$string['timerange'] = '기간';
$string['today'] = '오늘';
$string['this_week'] = '이번 주';
$string['this_month'] = '이번 달';

// Anxiety levels
$string['anxiety_level_normal'] = '정상';
$string['anxiety_level_mild'] = '경미한 불안';
$string['anxiety_level_moderate'] = '중간 불안';
$string['anxiety_level_severe'] = '심각한 불안';

// Alerts
$string['alert_subject'] = '학생 불안 알림';
$string['alert_small_message'] = '학생이 높은 불안을 경험하고 있습니다';
$string['alert_message_template'] = '코스 {$a->course}의 학생 {$a->student}이(가) {$a->level}를 보이고 있습니다 (점수: {$a->score}).';
$string['high_components'] = '주의가 필요한 지표';
$string['high_anxiety_warning'] = '스트레스 수준이 높은 것으로 보입니다. 잠시 휴식을 취하거나, 심호흡을 하거나, 도움을 요청하는 것을 고려해보세요.';

// Components
$string['component_response_time'] = '응답 시간';
$string['component_error_rate'] = '오답률';
$string['component_click_frequency'] = '클릭 빈도';
$string['component_time_on_task'] = '과제 소요 시간';
$string['component_navigation'] = '탐색 패턴';
$string['component_session_duration'] = '세션 지속 시간';

// Tips
$string['anxiety_tips_title'] = '학습 불안 관리 팁';
$string['anxiety_tip_1'] = '25-30분마다 규칙적으로 휴식을 취하세요 (포모도로 기법)';
$string['anxiety_tip_2'] = '심호흡 연습: 4초 들이쉬고, 4초 멈추고, 4초 내쉬기';
$string['anxiety_tip_3'] = '선생님이나 동료에게 도움을 요청하는 것을 망설이지 마세요';
$string['anxiety_tip_4'] = '복잡한 문제를 작고 관리 가능한 단계로 나누세요';
$string['anxiety_tip_5'] = '긍정적인 마음가짐 유지: 실수는 학습의 기회입니다';

// Settings
$string['settings_heading'] = '불안 감지 설정';
$string['mild_threshold'] = '경미한 불안 임계값';
$string['mild_threshold_desc'] = '경미한 수준의 불안 점수 임계값 (0-100)';
$string['moderate_threshold'] = '중간 불안 임계값';
$string['moderate_threshold_desc'] = '중간 수준의 불안 점수 임계값 (0-100)';
$string['severe_threshold'] = '심각한 불안 임계값';
$string['severe_threshold_desc'] = '심각한 수준의 불안 점수 임계값 (0-100)';
$string['enable_alerts'] = '알림 활성화';
$string['enable_alerts_desc'] = '학생이 높은 불안을 보일 때 교사에게 알림 전송';
$string['alert_frequency'] = '알림 빈도';
$string['alert_frequency_desc'] = '동일 학생에 대한 알림 간 최소 시간 (초)';

// Privacy
$string['privacy:metadata:local_anxiety_metrics'] = '불안 감지를 위한 행동 메트릭 저장';
$string['privacy:metadata:local_anxiety_metrics:userid'] = '사용자 ID';
$string['privacy:metadata:local_anxiety_metrics:anxiety_score'] = '계산된 불안 점수';
$string['privacy:metadata:local_anxiety_metrics:timecreated'] = '메트릭 기록 시간';
