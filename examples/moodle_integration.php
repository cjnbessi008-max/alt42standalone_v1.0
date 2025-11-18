<?php
/**
 * Drag-to-Slope Moodle 연동 예시
 *
 * Moodle 3.7, PHP 7.1.9, MySQL 5.7 환경에서 사용
 *
 * 설치 방법:
 * 1. Moodle의 /local/ 또는 /mod/ 디렉토리에 배치
 * 2. DB 테이블 생성 (아래 SQL 참조)
 * 3. Moodle 관리자 페이지에서 플러그인 설치
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/config.php');
require_once($CFG->libdir.'/adminlib.php');

// 로그인 필요
require_login();

$course_id = required_param('courseid', PARAM_INT);
$problem_id = optional_param('problemid', 0, PARAM_INT);

$course = $DB->get_record('course', array('id' => $course_id), '*', MUST_EXIST);
$context = context_course::instance($course->id);

require_capability('mod/dragslope:view', $context);

// 페이지 설정
$PAGE->set_url('/local/dragslope/view.php', array('courseid' => $course_id));
$PAGE->set_context($context);
$PAGE->set_title(get_string('pluginname', 'local_dragslope'));
$PAGE->set_heading($course->fullname);

echo $OUTPUT->header();

// 문제 데이터 가져오기
if ($problem_id > 0) {
    $problem = $DB->get_record('dragslope_problems', array('id' => $problem_id), '*', MUST_EXIST);
} else {
    // 기본 문제
    $problem = new stdClass();
    $problem->id = 0;
    $problem->function_expression = 'x^2';
    $problem->x_min = -10;
    $problem->x_max = 10;
    $problem->y_min = -10;
    $problem->y_max = 10;
    $problem->title = '기본 2차 함수';
    $problem->instructions = '그래프를 드래그하여 접선을 확인하세요';
}

// iframe URL 생성
$app_base_url = get_config('local_dragslope', 'app_url'); // 설정에서 가져오기
if (empty($app_base_url)) {
    $app_base_url = 'https://your-domain.com'; // 기본값
}

$iframe_params = array(
    'problemId' => $problem->id,
    'function' => $problem->function_expression,
    'xMin' => $problem->x_min,
    'xMax' => $problem->x_max,
    'yMin' => $problem->y_min,
    'yMax' => $problem->y_max,
    'title' => $problem->title,
    'instructions' => $problem->instructions
);

$iframe_url = $app_base_url . '?' . http_build_query($iframe_params);

?>

<div class="dragslope-container">
    <div class="problem-header">
        <h2><?php echo format_text($problem->title); ?></h2>
        <p><?php echo format_text($problem->instructions); ?></p>
    </div>

    <div class="dragslope-iframe-wrapper">
        <iframe
            id="dragslope-iframe"
            src="<?php echo $iframe_url; ?>"
            width="100%"
            height="600px"
            style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
            allow="accelerometer; gyroscope"
        ></iframe>
    </div>

    <div class="dragslope-status">
        <p>상태: <span id="status-text">준비 중...</span></p>
        <p>진행률: <span id="progress-text">0%</span></p>
        <div class="progress-bar" style="width: 100%; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div id="progress-fill" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.3s;"></div>
        </div>
    </div>
</div>

<script>
(function() {
    var iframe = document.getElementById('dragslope-iframe');
    var statusText = document.getElementById('status-text');
    var progressText = document.getElementById('progress-text');
    var progressFill = document.getElementById('progress-fill');

    // postMessage 수신
    window.addEventListener('message', function(event) {
        // 보안: origin 검증 (프로덕션에서는 실제 도메인으로 변경)
        // if (event.origin !== 'https://your-domain.com') return;

        var data = event.data;

        switch(data.type) {
            case 'DRAG_TO_SLOPE_READY':
                console.log('Drag-to-Slope 앱이 준비되었습니다');
                statusText.textContent = '준비 완료';
                statusText.style.color = '#4CAF50';
                break;

            case 'DRAG_TO_SLOPE_PROGRESS':
                console.log('진행률:', data.progress + '%');
                progressText.textContent = data.progress + '%';
                progressFill.style.width = data.progress + '%';
                break;

            case 'DRAG_TO_SLOPE_RESPONSE':
                console.log('학습 결과 수신:', data.data);
                statusText.textContent = '완료!';
                statusText.style.color = '#2196F3';

                // AJAX로 Moodle DB에 저장
                saveResponse(data.data);
                break;
        }
    });

    // 학습 결과를 Moodle DB에 저장
    function saveResponse(responseData) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '<?php echo new moodle_url('/local/dragslope/save_response.php'); ?>', true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onload = function() {
            if (xhr.status === 200) {
                var result = JSON.parse(xhr.responseText);
                if (result.success) {
                    alert('학습 결과가 저장되었습니다!');
                    // 다음 문제로 이동하거나 완료 페이지로 리다이렉트
                    // window.location.href = '<?php echo new moodle_url('/course/view.php', array('id' => $course_id)); ?>';
                } else {
                    alert('저장 실패: ' + result.error);
                }
            }
        };

        xhr.send(JSON.stringify({
            sesskey: '<?php echo sesskey(); ?>',
            problemid: <?php echo $problem->id; ?>,
            userid: <?php echo $USER->id; ?>,
            courseid: <?php echo $course_id; ?>,
            responsedata: responseData
        }));
    }

    // 테스트: 앱에 명령 전송
    function sendCommandToApp(command) {
        iframe.contentWindow.postMessage({
            type: 'MOODLE_COMMAND',
            payload: command
        }, '*');
    }

    // 전역 함수로 노출 (콘솔에서 테스트 가능)
    window.sendCommandToApp = sendCommandToApp;
})();
</script>

<style>
.dragslope-container {
    max-width: 1200px;
    margin: 20px auto;
    padding: 20px;
}

.problem-header {
    margin-bottom: 20px;
}

.problem-header h2 {
    margin: 0 0 10px 0;
    color: #333;
}

.problem-header p {
    color: #666;
    font-size: 16px;
}

.dragslope-iframe-wrapper {
    margin-bottom: 20px;
}

.dragslope-status {
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
}

.dragslope-status p {
    margin: 10px 0;
    font-size: 16px;
}

@media (max-width: 768px) {
    .dragslope-iframe-wrapper iframe {
        height: 500px;
    }
}
</style>

<?php
echo $OUTPUT->footer();
?>


<!--
==========================================
DB 스키마 (MySQL 5.7)
==========================================

-- 문제 테이블
CREATE TABLE IF NOT EXISTS mdl_dragslope_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    courseid BIGINT(10) NOT NULL,
    function_expression VARCHAR(255) NOT NULL,
    x_min DECIMAL(10,2) DEFAULT -10.00,
    x_max DECIMAL(10,2) DEFAULT 10.00,
    y_min DECIMAL(10,2) DEFAULT -10.00,
    y_max DECIMAL(10,2) DEFAULT 10.00,
    title VARCHAR(255) DEFAULT NULL,
    instructions TEXT DEFAULT NULL,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY courseid (courseid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 응답 테이블
CREATE TABLE IF NOT EXISTS mdl_dragslope_responses (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    problemid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    courseid BIGINT(10) NOT NULL,
    interactions LONGTEXT NOT NULL COMMENT 'JSON 형식',
    num_interactions INT(11) DEFAULT 0,
    completed TINYINT(1) DEFAULT 0,
    grade DECIMAL(10,2) DEFAULT NULL,
    timecreated BIGINT(10) NOT NULL,
    timemodified BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    KEY problemid (problemid),
    KEY userid (userid),
    KEY courseid (courseid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 외래키 제약조건
ALTER TABLE mdl_dragslope_problems
    ADD CONSTRAINT fk_dragslope_problems_course
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
    ON DELETE CASCADE;

ALTER TABLE mdl_dragslope_responses
    ADD CONSTRAINT fk_dragslope_responses_problem
    FOREIGN KEY (problemid) REFERENCES mdl_dragslope_problems(id)
    ON DELETE CASCADE,
    ADD CONSTRAINT fk_dragslope_responses_user
    FOREIGN KEY (userid) REFERENCES mdl_user(id)
    ON DELETE CASCADE,
    ADD CONSTRAINT fk_dragslope_responses_course
    FOREIGN KEY (courseid) REFERENCES mdl_course(id)
    ON DELETE CASCADE;

==========================================
샘플 데이터
==========================================

INSERT INTO mdl_dragslope_problems (courseid, function_expression, x_min, x_max, y_min, y_max, title, instructions, timecreated, timemodified)
VALUES
(1, 'x^2', -10, 10, -10, 10, '2차 함수의 미분', '그래프를 드래그하여 각 점에서의 접선을 확인하세요', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'x^3 - 3*x^2 + 2', -5, 5, -10, 10, '3차 함수의 미분', '극값과 변곡점에서의 접선을 관찰하세요', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(1, 'sin(x)', -10, 10, -2, 2, '삼각함수의 미분', 'sin(x)의 도함수는 cos(x)임을 확인하세요', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-->
