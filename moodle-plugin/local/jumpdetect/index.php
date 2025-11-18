<?php
// This file is part of Moodle - http://moodle.org/

/**
 * Jump Detection Dashboard - Main Page
 *
 * @package    local_jumpdetect
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');
require_once($CFG->dirroot . '/local/jumpdetect/classes/detector.php');

// 인증 확인
require_login();

$courseid = optional_param('courseid', 0, PARAM_INT);
$page = optional_param('page', 0, PARAM_INT);
$perpage = optional_param('perpage', 20, PARAM_INT);

// 컨텍스트 설정
if ($courseid) {
    $context = context_course::instance($courseid);
    $course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
} else {
    $context = context_system::instance();
    $course = null;
}

require_capability('moodle/course:update', $context);

// 페이지 설정
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/jumpdetect/index.php', ['courseid' => $courseid]));
$PAGE->set_title(get_string('pluginname', 'local_jumpdetect'));
$PAGE->set_heading(get_string('pluginname', 'local_jumpdetect'));

// CSS 추가
$PAGE->requires->css('/local/jumpdetect/styles.css');

echo $OUTPUT->header();

// 대시보드 헤더
echo html_writer::start_tag('div', ['class' => 'jumpdetect-dashboard']);

// 제목
echo html_writer::tag('h2', '🎯 점프 추론 감지 대시보드', ['class' => 'dashboard-title']);

// 코스 선택
if (!$courseid) {
    echo html_writer::start_tag('div', ['class' => 'course-selector']);
    echo html_writer::tag('h3', '코스 선택');

    $courses = get_courses();
    echo html_writer::start_tag('ul', ['class' => 'course-list']);
    foreach ($courses as $c) {
        if ($c->id == 1) continue; // 사이트 홈 제외
        $url = new moodle_url('/local/jumpdetect/index.php', ['courseid' => $c->id]);
        echo html_writer::tag('li',
            html_writer::link($url, $c->fullname),
            ['class' => 'course-item']
        );
    }
    echo html_writer::end_tag('ul');
    echo html_writer::end_tag('div');

    echo $OUTPUT->footer();
    exit;
}

// 통계 요약
echo html_writer::start_tag('div', ['class' => 'stats-summary']);

// 심각도별 학생 수 계산
$sql = "SELECT severity, COUNT(DISTINCT userid) as count
        FROM {jumpdetect_patterns}
        WHERE courseid = :courseid
        AND detected_at >= :time_threshold
        GROUP BY severity";

$time_threshold = time() - (7 * 24 * 60 * 60); // 최근 7일
$severity_counts = $DB->get_records_sql($sql, [
    'courseid' => $courseid,
    'time_threshold' => $time_threshold
]);

$counts = [
    'critical' => 0,
    'warning' => 0,
    'caution' => 0,
    'normal' => 0
];

foreach ($severity_counts as $stat) {
    $counts[$stat->severity] = $stat->count;
}

// 심각도 카드
$severity_cards = [
    'critical' => ['emoji' => '🔴', 'label' => '위험', 'class' => 'critical'],
    'warning' => ['emoji' => '🟠', 'label' => '경고', 'class' => 'warning'],
    'caution' => ['emoji' => '🟡', 'label' => '주의', 'class' => 'caution'],
    'normal' => ['emoji' => '🟢', 'label' => '정상', 'class' => 'normal']
];

foreach ($severity_cards as $severity => $card) {
    echo html_writer::start_tag('div', ['class' => "stat-card {$card['class']}"]);
    echo html_writer::tag('div', $card['emoji'], ['class' => 'emoji']);
    echo html_writer::tag('div', $card['label'], ['class' => 'label']);
    echo html_writer::tag('div', $counts[$severity] . '명', ['class' => 'count']);
    echo html_writer::end_tag('div');
}

echo html_writer::end_tag('div'); // stats-summary

// 최근 알림
echo html_writer::start_tag('div', ['class' => 'recent-alerts']);
echo html_writer::tag('h3', '📢 최근 알림');

$alerts = $DB->get_records('jumpdetect_alerts', [
    'courseid' => $courseid,
    'teacherid' => $USER->id
], 'timecreated DESC', '*', 0, 10);

if ($alerts) {
    echo html_writer::start_tag('ul', ['class' => 'alert-list']);
    foreach ($alerts as $alert) {
        $time_ago = format_time(time() - $alert->timecreated);
        $read_class = $alert->is_read ? 'read' : 'unread';

        echo html_writer::start_tag('li', ['class' => "alert-item {$read_class}"]);
        echo html_writer::tag('span', $alert->message, ['class' => 'alert-message']);
        echo html_writer::tag('span', $time_ago . ' 전', ['class' => 'alert-time']);
        echo html_writer::end_tag('li');
    }
    echo html_writer::end_tag('ul');
} else {
    echo html_writer::tag('p', '최근 알림이 없습니다.', ['class' => 'no-alerts']);
}

echo html_writer::end_tag('div'); // recent-alerts

// 학생별 점프 점수 테이블
echo html_writer::start_tag('div', ['class' => 'student-scores']);
echo html_writer::tag('h3', '📊 학생별 점프 점수 (상위 20명)');

$sql = "SELECT p.userid, u.firstname, u.lastname,
               SUM(p.jump_score) as total_score,
               COUNT(p.id) as jump_count,
               MAX(p.severity) as max_severity
        FROM {jumpdetect_patterns} p
        JOIN {user} u ON p.userid = u.id
        WHERE p.courseid = :courseid
        AND p.detected_at >= :time_threshold
        GROUP BY p.userid, u.firstname, u.lastname
        ORDER BY total_score DESC
        LIMIT 20";

$students = $DB->get_records_sql($sql, [
    'courseid' => $courseid,
    'time_threshold' => $time_threshold
]);

if ($students) {
    echo html_writer::start_tag('table', ['class' => 'student-table']);
    echo html_writer::start_tag('thead');
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', '순위');
    echo html_writer::tag('th', '학생 이름');
    echo html_writer::tag('th', '점프 점수');
    echo html_writer::tag('th', '점프 횟수');
    echo html_writer::tag('th', '심각도');
    echo html_writer::tag('th', '진행률');
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');

    echo html_writer::start_tag('tbody');
    $rank = 1;
    foreach ($students as $student) {
        $fullname = fullname($student);
        $score = round($student->total_score, 1);
        $severity_class = $student->max_severity;

        // 진행률 바 (점수 기반, 최대 30점 기준)
        $progress_percent = min(($score / 30) * 100, 100);

        echo html_writer::start_tag('tr', ['class' => "severity-{$severity_class}"]);
        echo html_writer::tag('td', $rank);
        echo html_writer::tag('td', $fullname);
        echo html_writer::tag('td', $score . '점');
        echo html_writer::tag('td', $student->jump_count . '회');
        echo html_writer::tag('td', $severity_cards[$student->max_severity]['emoji'] . ' ' . $severity_cards[$student->max_severity]['label']);

        // 진행률 바
        echo html_writer::start_tag('td');
        echo html_writer::start_tag('div', ['class' => 'progress-bar']);
        echo html_writer::tag('div', '', [
            'class' => "progress-fill {$severity_class}",
            'style' => "width: {$progress_percent}%"
        ]);
        echo html_writer::end_tag('div');
        echo html_writer::end_tag('td');

        echo html_writer::end_tag('tr');
        $rank++;
    }
    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
} else {
    echo html_writer::tag('p', '데이터가 없습니다.', ['class' => 'no-data']);
}

echo html_writer::end_tag('div'); // student-scores

// 점프 유형별 통계
echo html_writer::start_tag('div', ['class' => 'jump-type-stats']);
echo html_writer::tag('h3', '📈 점프 유형별 통계');

$sql = "SELECT jump_type, COUNT(*) as count
        FROM {jumpdetect_patterns}
        WHERE courseid = :courseid
        AND detected_at >= :time_threshold
        GROUP BY jump_type
        ORDER BY count DESC";

$jump_types = $DB->get_records_sql($sql, [
    'courseid' => $courseid,
    'time_threshold' => $time_threshold
]);

if ($jump_types) {
    echo html_writer::start_tag('div', ['class' => 'jump-type-chart']);

    $type_labels = [
        'sequential' => '순차적 건너뛰기',
        'prerequisite' => '선수 학습 누락',
        'time_anomaly' => '시간 비정상 패턴',
        'assessment_evasion' => '퀴즈/과제 회피'
    ];

    foreach ($jump_types as $type) {
        $label = $type_labels[$type->jump_type] ?? $type->jump_type;
        echo html_writer::start_tag('div', ['class' => 'type-bar']);
        echo html_writer::tag('span', $label, ['class' => 'type-label']);
        echo html_writer::tag('span', $type->count . '건', ['class' => 'type-count']);
        echo html_writer::end_tag('div');
    }

    echo html_writer::end_tag('div');
} else {
    echo html_writer::tag('p', '데이터가 없습니다.', ['class' => 'no-data']);
}

echo html_writer::end_tag('div'); // jump-type-stats

// 액션 버튼
echo html_writer::start_tag('div', ['class' => 'action-buttons']);

$report_url = new moodle_url('/local/jumpdetect/report.php', ['courseid' => $courseid]);
echo html_writer::link($report_url, '📄 상세 보고서 다운로드', [
    'class' => 'btn btn-primary'
]);

$settings_url = new moodle_url('/local/jumpdetect/settings.php', ['courseid' => $courseid]);
echo html_writer::link($settings_url, '⚙️ 설정', [
    'class' => 'btn btn-secondary'
]);

echo html_writer::end_tag('div');

echo html_writer::end_tag('div'); // jumpdetect-dashboard

echo $OUTPUT->footer();
