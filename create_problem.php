<?php
// Teacher interface to create sorting problems

require_once('../../config.php');

require_login();

$context = context_system::instance();
require_capability('local/dancingline:createproblem', $context);

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/dancingline/create_problem.php'));
$PAGE->set_title(get_string('create_problem', 'local_dancingline'));
$PAGE->set_heading(get_string('create_problem', 'local_dancingline'));

$PAGE->requires->css('/local/dancingline/styles/styles.css');

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && confirm_sesskey()) {
    $name = required_param('name', PARAM_TEXT);
    $description = optional_param('description', '', PARAM_TEXT);
    $numbers_input = required_param('numbers', PARAM_TEXT);
    $algorithm = required_param('algorithm', PARAM_ALPHA);
    $difficulty = optional_param('difficulty', 1, PARAM_INT);
    $courseid = optional_param('courseid', 0, PARAM_INT);

    // Parse numbers
    $numbers = array_map('intval', array_filter(explode(',', $numbers_input), 'is_numeric'));

    if (count($numbers) > 0) {
        $problem = new stdClass();
        $problem->courseid = $courseid;
        $problem->name = $name;
        $problem->description = $description;
        $problem->numbers = json_encode($numbers);
        $problem->algorithm = $algorithm;
        $problem->difficulty = $difficulty;
        $problem->timecreated = time();
        $problem->timemodified = time();

        try {
            $problemid = $DB->insert_record('local_dancingline_problems', $problem);
            redirect(
                new moodle_url('/local/dancingline/index.php', ['problemid' => $problemid]),
                'Problem created successfully!',
                null,
                \core\output\notification::NOTIFY_SUCCESS
            );
        } catch (Exception $e) {
            echo $OUTPUT->notification('Error creating problem: ' . $e->getMessage(), 'error');
        }
    } else {
        echo $OUTPUT->notification('Please enter valid numbers', 'error');
    }
}

echo $OUTPUT->header();

?>

<div class="container-fluid" style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <div class="card">
        <div class="card-body">
            <h2 class="card-title">문제 생성하기</h2>
            <p class="text-muted">학생들이 풀 정렬 문제를 생성합니다.</p>

            <form method="POST" action="<?php echo $_SERVER['PHP_SELF']; ?>">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">

                <div class="form-group">
                    <label for="name">문제 이름 *</label>
                    <input type="text" class="form-control" id="name" name="name" required
                           placeholder="예: 버블 정렬 연습 1">
                </div>

                <div class="form-group">
                    <label for="description">문제 설명</label>
                    <textarea class="form-control" id="description" name="description" rows="3"
                              placeholder="이 문제에 대한 설명을 입력하세요..."></textarea>
                </div>

                <div class="form-group">
                    <label for="numbers">숫자 배열 * (쉼표로 구분)</label>
                    <input type="text" class="form-control" id="numbers" name="numbers" required
                           placeholder="42, 17, 89, 3, 56, 28, 91, 14">
                    <small class="form-text text-muted">정렬할 숫자들을 쉼표로 구분하여 입력하세요.</small>
                </div>

                <div class="form-group">
                    <label for="algorithm">정렬 알고리즘 *</label>
                    <select class="form-control" id="algorithm" name="algorithm" required>
                        <option value="bubble">버블 정렬 (Bubble Sort)</option>
                        <option value="selection">선택 정렬 (Selection Sort)</option>
                        <option value="insertion">삽입 정렬 (Insertion Sort)</option>
                        <option value="quick">퀵 정렬 (Quick Sort)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="difficulty">난이도</label>
                    <select class="form-control" id="difficulty" name="difficulty">
                        <option value="1">1 - 쉬움</option>
                        <option value="2">2 - 보통</option>
                        <option value="3">3 - 중간</option>
                        <option value="4">4 - 어려움</option>
                        <option value="5">5 - 매우 어려움</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="courseid">코스 ID</label>
                    <input type="number" class="form-control" id="courseid" name="courseid" value="0"
                           placeholder="0 (기본값)">
                    <small class="form-text text-muted">특정 코스와 연결하려면 코스 ID를 입력하세요.</small>
                </div>

                <div class="form-group">
                    <button type="button" class="btn btn-secondary" onclick="generateRandom()">
                        랜덤 숫자 생성
                    </button>
                    <button type="submit" class="btn btn-primary">
                        문제 생성
                    </button>
                    <a href="index.php" class="btn btn-light">취소</a>
                </div>
            </form>
        </div>
    </div>

    <div class="card mt-4">
        <div class="card-body">
            <h3 class="card-title">기존 문제 목록</h3>
            <?php
            $problems = $DB->get_records('local_dancingline_problems', null, 'timecreated DESC', '*', 0, 20);

            if ($problems) {
                echo '<div class="table-responsive">';
                echo '<table class="table table-striped">';
                echo '<thead><tr>';
                echo '<th>ID</th><th>이름</th><th>알고리즘</th><th>난이도</th><th>숫자 개수</th><th>액션</th>';
                echo '</tr></thead><tbody>';

                foreach ($problems as $problem) {
                    $numbers = json_decode($problem->numbers);
                    $count = is_array($numbers) ? count($numbers) : 0;

                    echo '<tr>';
                    echo '<td>' . $problem->id . '</td>';
                    echo '<td>' . htmlspecialchars($problem->name) . '</td>';
                    echo '<td>' . htmlspecialchars($problem->algorithm) . '</td>';
                    echo '<td>' . $problem->difficulty . '</td>';
                    echo '<td>' . $count . '</td>';
                    echo '<td>';
                    echo '<a href="index.php?problemid=' . $problem->id . '" class="btn btn-sm btn-primary">보기</a> ';
                    echo '</td>';
                    echo '</tr>';
                }

                echo '</tbody></table>';
                echo '</div>';
            } else {
                echo '<p class="text-muted">아직 생성된 문제가 없습니다.</p>';
            }
            ?>
        </div>
    </div>
</div>

<script>
function generateRandom() {
    const count = 8;
    const max = 99;
    const numbers = [];
    const used = new Set();

    while (numbers.length < count) {
        const num = Math.floor(Math.random() * max) + 1;
        if (!used.has(num)) {
            numbers.push(num);
            used.add(num);
        }
    }

    document.getElementById('numbers').value = numbers.join(', ');
}
</script>

<?php
echo $OUTPUT->footer();
