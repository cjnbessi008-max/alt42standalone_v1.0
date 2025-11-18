<?php
/**
 * Breathing Curve - Main view page
 *
 * Moodle 내에서 Breathing Curve 앱을 표시하는 페이지
 *
 * @package    local_breathing_curve
 * @copyright  2024 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once('../../config.php');

// 파라미터
$question_id = optional_param('qid', 0, PARAM_INT);
$course_id = optional_param('courseid', 0, PARAM_INT);

// 로그인 확인
require_login();

if ($course_id) {
    $course = $DB->get_record('course', ['id' => $course_id], '*', MUST_EXIST);
    require_login($course);
}

// 페이지 설정
$PAGE->set_url('/local/breathing_curve/view.php', ['qid' => $question_id, 'courseid' => $course_id]);
$PAGE->set_context(context_system::instance());
$PAGE->set_title(get_string('pluginname', 'local_breathing_curve'));
$PAGE->set_heading('Breathing Curve - 숨쉬는 함수 그래프');

// 출력 시작
echo $OUTPUT->header();

?>

<div style="display: flex; justify-content: flex-end; padding: 20px;">
    <div class="smartphone-container">
        <div class="smartphone-notch"></div>
        <div class="app-container">
            <div class="header">
                <h1>🫁 Breathing Curve</h1>
                <p>숨쉬는 함수 그래프</p>
            </div>

            <div class="problem-info">
                <h2 id="problemTitle">문제 로딩 중...</h2>
                <p id="problemDescription">Moodle에서 문제 정보를 가져오는 중입니다...</p>
            </div>

            <div class="canvas-container">
                <canvas id="breathingCanvas"></canvas>
            </div>

            <div class="controls">
                <button class="control-btn" onclick="changeFunction('quadratic')">2차 함수</button>
                <button class="control-btn" onclick="changeFunction('sine')">삼각 함수</button>
                <button class="control-btn" onclick="changeFunction('cubic')">3차 함수</button>
            </div>

            <div class="info-panel">
                <p><strong>현재 애니메이션:</strong> <span id="currentFunc">2차 함수</span></p>
                <p><strong>Breathing 효과:</strong> 증가 구간은 파란색으로 확장, 감소 구간은 빨간색으로 수축</p>
            </div>
        </div>
    </div>
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .smartphone-container {
        position: relative;
        width: 375px;
        height: 667px;
        background: #1a1a1a;
        border-radius: 40px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        border: 8px solid #2a2a2a;
        overflow: hidden;
    }

    .smartphone-notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 30px;
        background: #1a1a1a;
        border-radius: 0 0 20px 20px;
        z-index: 10;
    }

    .app-container {
        width: 100%;
        height: 100%;
        background: #ffffff;
        padding: 40px 20px 20px 20px;
        overflow: auto;
    }

    .header {
        text-align: center;
        margin-bottom: 20px;
    }

    .header h1 {
        font-size: 24px;
        color: #333;
        margin-bottom: 5px;
    }

    .header p {
        font-size: 14px;
        color: #666;
    }

    .problem-info {
        background: #f5f5f5;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 20px;
    }

    .problem-info h2 {
        font-size: 16px;
        color: #333;
        margin-bottom: 8px;
    }

    .problem-info p {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
    }

    .canvas-container {
        background: #fafafa;
        border-radius: 12px;
        padding: 15px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    canvas {
        width: 100%;
        height: 300px;
        background: white;
        border-radius: 8px;
    }

    .controls {
        margin-top: 20px;
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .control-btn {
        flex: 1;
        min-width: 100px;
        padding: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .control-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .control-btn:active {
        transform: translateY(0);
    }

    .info-panel {
        margin-top: 15px;
        padding: 12px;
        background: #e8f4f8;
        border-left: 4px solid #667eea;
        border-radius: 4px;
    }

    .info-panel p {
        font-size: 13px;
        color: #555;
        margin: 5px 0;
    }
</style>

<script src="<?php echo $CFG->wwwroot; ?>/local/breathing_curve/js/breathing-curve.js"></script>
<script>
    // Moodle API를 통해 문제 데이터 로드
    const questionId = <?php echo $question_id; ?>;
    const courseId = <?php echo $course_id; ?>;
    const apiUrl = '<?php echo $CFG->wwwroot; ?>/local/breathing_curve/api/get_problem.php';

    // 페이지 로드 시 문제 데이터 가져오기
    window.addEventListener('DOMContentLoaded', function() {
        loadProblemData();
    });

    function loadProblemData() {
        const url = `${apiUrl}?qid=${questionId}&courseid=${courseId}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateProblemInfo(data.problem);
                    if (window.receiveProblemFromLMS) {
                        window.receiveProblemFromLMS(data.problem);
                    }
                } else {
                    console.error('Failed to load problem:', data.error);
                    document.getElementById('problemDescription').textContent =
                        '문제를 불러오는데 실패했습니다: ' + data.error;
                }
            })
            .catch(error => {
                console.error('Error fetching problem data:', error);
                document.getElementById('problemDescription').textContent =
                    '문제를 불러오는데 실패했습니다. 네트워크 연결을 확인해주세요.';
            });
    }

    function updateProblemInfo(problem) {
        document.getElementById('problemTitle').textContent = problem.title;
        document.getElementById('problemDescription').innerHTML =
            `${problem.description}<br><strong>${problem.equation}</strong>`;
    }
</script>

<?php

echo $OUTPUT->footer();
