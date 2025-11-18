<?php
/**
 * Linear Stairs Moodle Plugin - View Page
 *
 * 학생들이 등차수열 시각화를 볼 수 있는 페이지
 *
 * @package    mod_linearstairs
 * @copyright  2025
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(dirname(dirname(dirname(__FILE__))).'/config.php');
require_once(dirname(__FILE__).'/lib.php');

// URL 파라미터
$id = optional_param('id', 0, PARAM_INT); // Course Module ID
$n  = optional_param('n', 0, PARAM_INT);  // LinearStairs instance ID

// 모듈 정보 가져오기
if ($id) {
    $cm = get_coursemodule_from_id('linearstairs', $id, 0, false, MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
    $linearstairs = $DB->get_record('linearstairs', array('id' => $cm->instance), '*', MUST_EXIST);
} else if ($n) {
    $linearstairs = $DB->get_record('linearstairs', array('id' => $n), '*', MUST_EXIST);
    $course = $DB->get_record('course', array('id' => $linearstairs->course), '*', MUST_EXIST);
    $cm = get_coursemodule_from_instance('linearstairs', $linearstairs->id, $course->id, false, MUST_EXIST);
} else {
    print_error('missingparameter');
}

// 로그인 확인
require_login($course, true, $cm);

// 페이지 컨텍스트
$context = context_module::instance($cm->id);

// 이벤트 로깅
$event = \mod_linearstairs\event\course_module_viewed::create(array(
    'objectid' => $PAGE->cm->instance,
    'context' => $PAGE->context,
));
$event->add_record_snapshot('course', $PAGE->course);
$event->add_record_snapshot($PAGE->cm->modname, $linearstairs);
$event->trigger();

// 페이지 설정
$PAGE->set_url('/mod/linearstairs/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($linearstairs->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// 헤더 출력
echo $OUTPUT->header();

// 제목 표시
echo $OUTPUT->heading(format_string($linearstairs->name));

// 설명 표시
if ($linearstairs->intro) {
    echo $OUTPUT->box(format_module_intro('linearstairs', $linearstairs, $cm->id), 'generalbox mod_introbox', 'linearstairsintro');
}

// Linear Stairs 앱 URL 생성
$app_base_url = new moodle_url('/mod/linearstairs/app/index.html');
$app_params = array(
    'a1' => $linearstairs->firstterm,
    'd' => $linearstairs->commondiff,
    'n' => $linearstairs->termcount,
    'moodle' => 1,
    'question_id' => $linearstairs->id,
    'user_id' => $USER->id,
    'course_id' => $course->id,
    'cm_id' => $cm->id
);

$app_url = new moodle_url($app_base_url, $app_params);

// iframe으로 앱 임베딩
echo html_writer::start_div('linearstairs-container', array('style' => 'margin: 20px 0;'));

echo html_writer::tag('iframe', '', array(
    'src' => $app_url->out(false),
    'width' => '100%',
    'height' => '900px',
    'frameborder' => '0',
    'style' => 'max-width: 375px; margin: 0 auto; display: block; border: 2px solid #ddd; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);',
    'allowfullscreen' => 'true'
));

echo html_writer::end_div();

// 학습 정보 표시
echo html_writer::start_div('linearstairs-info', array('style' => 'margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px;'));
echo html_writer::tag('h3', '등차수열 정보');
echo html_writer::tag('p', '첫째항 (a₁): ' . $linearstairs->firstterm);
echo html_writer::tag('p', '공차 (d): ' . $linearstairs->commondiff);
echo html_writer::tag('p', '항의 개수 (n): ' . $linearstairs->termcount);

// 일반항 공식
$formula = "aₙ = {$linearstairs->firstterm} + (n-1) × {$linearstairs->commondiff}";
echo html_writer::tag('p', html_writer::tag('strong', '일반항: ') . $formula);

// 수열 표시
$sequence = array();
for ($i = 1; $i <= $linearstairs->termcount; $i++) {
    $term = $linearstairs->firstterm + ($i - 1) * $linearstairs->commondiff;
    $sequence[] = $term;
}
echo html_writer::tag('p', html_writer::tag('strong', '수열: ') . implode(', ', $sequence));

echo html_writer::end_div();

// 사용자 활동 기록 (선택사항)
if (has_capability('mod/linearstairs:submit', $context)) {
    echo html_writer::start_div('linearstairs-activity', array('style' => 'margin-top: 20px;'));
    echo html_writer::tag('h3', '활동 기록');

    // 이전 시도 가져오기
    $attempts = $DB->get_records('linearstairs_attempts', array(
        'linearstairsid' => $linearstairs->id,
        'userid' => $USER->id
    ), 'timecreated DESC', '*', 0, 10);

    if ($attempts) {
        echo html_writer::start_tag('ul');
        foreach ($attempts as $attempt) {
            $timestamp = userdate($attempt->timecreated, '%Y-%m-%d %H:%M:%S');
            echo html_writer::tag('li',
                "시도 시간: {$timestamp} - " .
                "a₁={$attempt->firstterm}, d={$attempt->commondiff}, n={$attempt->termcount}"
            );
        }
        echo html_writer::end_tag('ul');
    } else {
        echo html_writer::tag('p', '아직 활동 기록이 없습니다.');
    }

    echo html_writer::end_div();
}

// JavaScript for postMessage communication
echo html_writer::start_tag('script');
?>
// Moodle와 Linear Stairs 앱 간 통신
(function() {
    // iframe 참조
    var iframe = document.querySelector('iframe');

    // 앱에서 메시지 수신
    window.addEventListener('message', function(event) {
        // 보안: 출처 확인 (실제 환경에서는 도메인 체크 필요)
        // if (event.origin !== window.location.origin) return;

        var data = event.data;

        if (data.type === 'ready') {
            console.log('Linear Stairs app is ready');
        } else if (data.type === 'answer_submit') {
            // 답안 제출 처리
            submitAnswer(data);
        }
    });

    // 답안 제출 함수
    function submitAnswer(data) {
        // AJAX로 Moodle에 답안 제출
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '<?php echo new moodle_url('/mod/linearstairs/submit.php'); ?>', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status === 200) {
                var response = JSON.parse(xhr.responseText);
                if (response.success) {
                    // 성공 메시지
                    alert('답안이 제출되었습니다!');
                    location.reload(); // 페이지 새로고침
                } else {
                    alert('제출 실패: ' + response.message);
                }
            }
        };

        xhr.send(JSON.stringify({
            sesskey: '<?php echo sesskey(); ?>',
            linearstairsid: <?php echo $linearstairs->id; ?>,
            userid: <?php echo $USER->id; ?>,
            answer: data.answer
        }));
    }
})();
<?php
echo html_writer::end_tag('script');

// 푸터 출력
echo $OUTPUT->footer();
?>
