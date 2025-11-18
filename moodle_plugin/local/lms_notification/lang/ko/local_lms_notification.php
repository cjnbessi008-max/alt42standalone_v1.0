<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Korean language strings
 *
 * @package    local_lms_notification
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'LMS 사용 알림 시스템';
$string['lms_notification:view'] = 'LMS 알림 보기';
$string['lms_notification:viewalerts'] = '자신의 알림 보기';
$string['lms_notification:viewallalerts'] = '모든 학생 알림 보기';
$string['lms_notification:managesettings'] = '알림 설정 관리';
$string['lms_notification:acknowledge'] = '알림 확인';
$string['lms_notification:viewanalytics'] = '학습 분석 보기';

// Alert types
$string['alert_type_excessive_time'] = '과도한 시간 소비';
$string['alert_type_excessive_attempts'] = '과도한 시도 횟수';
$string['alert_type_high_error_rate'] = '높은 오류율';
$string['alert_type_learning_stagnation'] = '학습 정체';

// Severity levels
$string['severity_low'] = '낮음';
$string['severity_medium'] = '중간';
$string['severity_high'] = '높음';
$string['severity_critical'] = '긴급';

// Alert messages
$string['alert_excessive_time'] = '이 문제에 {$a->time} 이상 소요되었습니다.';
$string['alert_excessive_attempts'] = '이 문제에서 {$a->attempts}회 이상 시도했습니다.';
$string['alert_high_error_rate'] = '최근 활동에서 오류율이 {$a->rate}%입니다.';
$string['alert_learning_stagnation'] = '{$a->days}일 동안 학습 활동이 없습니다.';

// Recommendations
$string['recommendation_excessive_time'] = '잠시 휴식을 취하거나 다른 접근 방법을 시도해보세요. 필요하다면 힌트를 사용하거나 교수자에게 도움을 요청하세요.';
$string['recommendation_excessive_attempts'] = '기본 개념을 다시 복습하고 힌트를 확인해보세요. 어려움이 계속되면 교수자에게 문의하세요.';
$string['recommendation_high_error_rate'] = '학습 자료를 다시 검토하고 기본 개념을 확실히 이해한 후 문제를 풀어보세요. 필요시 추가 연습 문제를 풀어보세요.';
$string['recommendation_learning_stagnation'] = '규칙적인 학습 습관을 만들어보세요. 매일 조금씩이라도 학습을 진행하면 더 나은 결과를 얻을 수 있습니다.';

// Metrics
$string['metric_time_spent'] = '소요 시간';
$string['metric_threshold'] = '임계값';
$string['metric_average_time'] = '평균 시간';
$string['metric_module_id'] = '모듈 ID';
$string['metric_attempts'] = '시도 횟수';
$string['metric_success_rate'] = '성공률';
$string['metric_error_rate'] = '오류율';
$string['metric_recent_activities'] = '최근 활동 수';
$string['metric_error_count'] = '오류 횟수';
$string['metric_days_since_activity'] = '마지막 활동 이후 일수';
$string['metric_last_activity'] = '마지막 활동';

// Notification messages
$string['hello'] = '안녕하세요';
$string['email_intro'] = '과목 "{$a->course}"에서 학습 패턴 알림이 발생했습니다.';
$string['email_footer'] = '이 메시지는 LMS 사용 알림 시스템에서 자동으로 전송되었습니다.';
$string['alert_subject'] = '[{$a->severity}] {$a->type} 알림';
$string['alert_details'] = '상세 정보';
$string['alert_recommendation'] = '권장사항';
$string['view_alert'] = '알림 보기';
$string['view_full_report'] = '전체 보고서 보기';
$string['view_student_progress'] = '학생 진도 보기';

// Teacher notifications
$string['teacher_alert_subject'] = '학생 학습 패턴 알림';
$string['teacher_alert_small'] = '{$a->student} 학생에게 {$a->type} 알림이 발생했습니다.';
$string['teacher_alert_intro'] = '과목 "{$a->course}"에서 {$a->student} 학생에게 다음과 같은 학습 패턴 알림이 발생했습니다.';

// Settings
$string['settings_header'] = '알림 설정';
$string['settings_general'] = '일반 설정';
$string['settings_thresholds'] = '임계값 설정';
$string['settings_notifications'] = '알림 채널';

$string['enable_notifications'] = '알림 활성화';
$string['enable_notifications_desc'] = '학습 패턴 알림을 받으시겠습니까?';

$string['threshold_time'] = '시간 임계값 (초)';
$string['threshold_time_desc'] = '단일 문제에 소요된 시간이 이 값을 초과하면 알림이 발생합니다.';

$string['threshold_attempts'] = '시도 횟수 임계값';
$string['threshold_attempts_desc'] = '시도 횟수가 이 값을 초과하면 알림이 발생합니다.';

$string['threshold_error_rate'] = '오류율 임계값';
$string['threshold_error_rate_desc'] = '최근 활동의 오류율이 이 값을 초과하면 알림이 발생합니다. (0.0 ~ 1.0)';

$string['email_enabled'] = '이메일 알림';
$string['email_enabled_desc'] = '이메일로 알림을 받으시겠습니까?';

$string['browser_enabled'] = '브라우저 알림';
$string['browser_enabled_desc'] = '브라우저 알림을 받으시겠습니까?';

$string['sms_enabled'] = 'SMS 알림';
$string['sms_enabled_desc'] = 'SMS로 알림을 받으시겠습니까? (설정된 경우)';

// Dashboard
$string['dashboard'] = '대시보드';
$string['my_alerts'] = '내 알림';
$string['my_analytics'] = '학습 분석';
$string['total_time'] = '총 학습 시간';
$string['total_attempts'] = '총 시도 횟수';
$string['success_rate'] = '성공률';
$string['inefficiency_score'] = '비효율성 점수';
$string['recent_alerts'] = '최근 알림';
$string['no_alerts'] = '알림이 없습니다.';
$string['acknowledge'] = '확인';
$string['acknowledged'] = '확인됨';
$string['view_details'] = '상세 보기';

// Time formatting
$string['time_seconds'] = '{$a}초';
$string['time_minutes'] = '{$a}분';
$string['time_hours'] = '{$a}시간';
$string['time_days'] = '{$a}일';

// Errors
$string['error_permission_denied'] = '권한이 없습니다.';
$string['error_not_enrolled'] = '이 과목에 등록되어 있지 않습니다.';
$string['error_alert_not_found'] = '알림을 찾을 수 없습니다.';
$string['error_tracking_failed'] = '활동 추적에 실패했습니다.';
