<?php
// This file is part of Moodle - http://moodle.org/

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/classes/recommendation_engine.php');

use block_chancemood\recommendation_engine;

// Get course ID
$courseid = required_param('courseid', PARAM_INT);

// Require login and check capabilities
require_login($courseid);
$context = context_course::instance($courseid);
require_capability('moodle/course:manageactivities', $context);

// Set up the page
$PAGE->set_url('/blocks/chancemood/teacher_dashboard.php', array('courseid' => $courseid));
$PAGE->set_context($context);
$PAGE->set_pagelayout('course');
$PAGE->set_title(get_string('pluginname', 'block_chancemood') . ' - Teacher Dashboard');
$PAGE->set_heading(get_string('pluginname', 'block_chancemood') . ' - Teacher Dashboard');

// Add CSS and JS
$PAGE->requires->css('/blocks/chancemood/styles/chancemood.css');
$PAGE->requires->js('/blocks/chancemood/js/teacher_dashboard.js');

// Get class recommendations
$recommendations = recommendation_engine::get_class_recommendations($courseid);

// Output starts here
echo $OUTPUT->header();

?>

<div class="chancemood-dashboard">
    <div class="dashboard-header">
        <h2>📊 Chance Mood 교사 대시보드</h2>
        <p class="dashboard-subtitle">전체 학생의 경우의 수 학습 현황 및 추천 사항</p>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
        <div class="summary-card">
            <div class="card-icon">👥</div>
            <div class="card-content">
                <div class="card-value"><?php echo $recommendations['total_students']; ?></div>
                <div class="card-label">전체 학생 수</div>
            </div>
        </div>

        <div class="summary-card urgent">
            <div class="card-icon">🚨</div>
            <div class="card-content">
                <div class="card-value"><?php echo $recommendations['priority_distribution']['urgent']; ?></div>
                <div class="card-label">긴급 지원 필요</div>
            </div>
        </div>

        <div class="summary-card high">
            <div class="card-icon">⚠️</div>
            <div class="card-content">
                <div class="card-value"><?php echo $recommendations['priority_distribution']['high']; ?></div>
                <div class="card-label">높은 우선순위</div>
            </div>
        </div>

        <div class="summary-card medium">
            <div class="card-icon">📌</div>
            <div class="card-content">
                <div class="card-value"><?php echo $recommendations['priority_distribution']['medium']; ?></div>
                <div class="card-label">중간 우선순위</div>
            </div>
        </div>
    </div>

    <!-- Common Weak Areas -->
    <div class="dashboard-section">
        <h3 class="section-heading">
            <span class="section-icon">🎯</span>
            학생들이 어려워하는 영역
        </h3>
        <div class="weak-areas-grid">
            <?php foreach ($recommendations['weak_area_summary'] as $area): ?>
            <div class="weak-area-tile">
                <div class="tile-header">
                    <h4><?php echo $area['type_label']; ?></h4>
                    <span class="student-count"><?php echo $area['student_count']; ?>명</span>
                </div>
                <div class="severity-meter">
                    <div class="meter-fill" style="width: <?php echo $area['avg_severity']; ?>%; background: <?php
                        echo $area['avg_severity'] > 70 ? '#e74c3c' :
                             ($area['avg_severity'] > 50 ? '#e67e22' : '#f39c12');
                    ?>;"></div>
                </div>
                <div class="severity-label">
                    평균 어려움: <?php echo round($area['avg_severity']); ?>%
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Action Items -->
    <div class="dashboard-section">
        <h3 class="section-heading">
            <span class="section-icon">✅</span>
            추천 조치 사항
        </h3>
        <div class="action-items">
            <?php foreach ($recommendations['action_items'] as $action): ?>
            <div class="action-item">
                <div class="action-priority">
                    <span class="priority-badge">우선순위 <?php echo $action['priority']; ?></span>
                </div>
                <div class="action-content">
                    <h4 class="action-title"><?php echo $action['action']; ?></h4>
                    <p class="action-reason"><?php echo $action['reason']; ?></p>
                </div>
                <div class="action-buttons">
                    <button class="btn-action" onclick="createLesson('<?php echo $action['type']; ?>')">
                        수업 만들기
                    </button>
                    <button class="btn-action-secondary" onclick="viewStudents('<?php echo $action['type']; ?>')">
                        학생 보기
                    </button>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Individual Student Status -->
    <div class="dashboard-section">
        <h3 class="section-heading">
            <span class="section-icon">👤</span>
            개별 학생 현황
        </h3>
        <div class="student-table-container">
            <table class="student-table">
                <thead>
                    <tr>
                        <th>학생 이름</th>
                        <th>현재 기분</th>
                        <th>우선순위</th>
                        <th>약점 영역</th>
                        <th>진행상황</th>
                        <th>조치</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    // Get enrolled students
                    $students = get_enrolled_users($context, 'mod/quiz:attempt');
                    foreach ($students as $student):
                        $student_rec = recommendation_engine::get_recommendations($student->id, $courseid);
                        if (!$student_rec) continue;

                        $weak_areas = is_array($student_rec->weak_areas) ?
                            $student_rec->weak_areas : json_decode($student_rec->weak_areas, true);
                    ?>
                    <tr>
                        <td class="student-name">
                            <?php echo fullname($student); ?>
                        </td>
                        <td class="student-mood">
                            <?php
                            $mood_emoji = array(
                                'joy' => '😊',
                                'confidence' => '😎',
                                'challenge' => '🤔',
                                'struggle' => '😰',
                                'frustration' => '😫'
                            );
                            echo isset($mood_emoji[$student_rec->priority]) ? $mood_emoji[$student_rec->priority] : '😐';
                            ?>
                        </td>
                        <td>
                            <span class="priority-badge priority-<?php echo $student_rec->priority; ?>">
                                <?php echo strtoupper($student_rec->priority); ?>
                            </span>
                        </td>
                        <td class="weak-areas-cell">
                            <?php
                            if (!empty($weak_areas)) {
                                $area_names = array_slice(array_column($weak_areas, 'type_label'), 0, 2);
                                echo implode(', ', $area_names);
                                if (count($weak_areas) > 2) {
                                    echo ' +' . (count($weak_areas) - 2);
                                }
                            } else {
                                echo '-';
                            }
                            ?>
                        </td>
                        <td class="progress-cell">
                            <div class="mini-progress-bar">
                                <div class="mini-progress-fill" style="width: <?php echo rand(20, 80); ?>%;"></div>
                            </div>
                        </td>
                        <td>
                            <button class="btn-view-detail" onclick="viewStudentDetail(<?php echo $student->id; ?>)">
                                상세 보기
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<style>
/* Dashboard specific styles */
.chancemood-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.dashboard-header {
    background: linear-gradient(135deg, #3498db, #2ecc71);
    color: white;
    padding: 30px;
    border-radius: 15px;
    margin-bottom: 30px;
    text-align: center;
}

.dashboard-header h2 {
    margin: 0 0 10px 0;
    font-size: 28px;
}

.dashboard-subtitle {
    margin: 0;
    opacity: 0.9;
    font-size: 14px;
}

.summary-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.summary-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 15px;
}

.summary-card.urgent {
    border-left: 4px solid #e74c3c;
}

.summary-card.high {
    border-left: 4px solid #e67e22;
}

.summary-card.medium {
    border-left: 4px solid #f39c12;
}

.card-icon {
    font-size: 36px;
}

.card-value {
    font-size: 32px;
    font-weight: 600;
    color: #2c3e50;
}

.card-label {
    font-size: 12px;
    color: #7f8c8d;
}

.dashboard-section {
    background: white;
    border-radius: 10px;
    padding: 25px;
    margin-bottom: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.section-heading {
    font-size: 20px;
    color: #2c3e50;
    margin: 0 0 20px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #ecf0f1;
    display: flex;
    align-items: center;
    gap: 10px;
}

.weak-areas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.weak-area-tile {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    border-left: 4px solid #e74c3c;
}

.tile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.tile-header h4 {
    margin: 0;
    font-size: 14px;
    color: #2c3e50;
}

.student-count {
    background: #e74c3c;
    color: white;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.severity-meter {
    height: 8px;
    background: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 5px;
}

.meter-fill {
    height: 100%;
    transition: width 0.5s ease;
}

.severity-label {
    font-size: 11px;
    color: #7f8c8d;
    text-align: right;
}

.action-items {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.action-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #3498db;
}

.action-priority {
    flex-shrink: 0;
}

.priority-badge {
    padding: 5px 12px;
    border-radius: 15px;
    font-size: 11px;
    font-weight: 600;
    background: #3498db;
    color: white;
}

.action-content {
    flex: 1;
}

.action-title {
    margin: 0 0 5px 0;
    font-size: 15px;
    color: #2c3e50;
}

.action-reason {
    margin: 0;
    font-size: 12px;
    color: #7f8c8d;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.btn-action, .btn-action-secondary, .btn-view-detail {
    padding: 8px 15px;
    border-radius: 6px;
    border: none;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-action {
    background: #3498db;
    color: white;
}

.btn-action:hover {
    background: #2980b9;
}

.btn-action-secondary {
    background: #95a5a6;
    color: white;
}

.btn-action-secondary:hover {
    background: #7f8c8d;
}

.btn-view-detail {
    background: #2ecc71;
    color: white;
}

.student-table-container {
    overflow-x: auto;
}

.student-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.student-table thead {
    background: #34495e;
    color: white;
}

.student-table th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
}

.student-table td {
    padding: 12px;
    border-bottom: 1px solid #ecf0f1;
}

.student-table tr:hover {
    background: #f8f9fa;
}

.student-mood {
    font-size: 20px;
    text-align: center;
}

.mini-progress-bar {
    width: 100px;
    height: 8px;
    background: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
}

.mini-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
}
</style>

<script>
function viewStudentDetail(userid) {
    window.location.href = M.cfg.wwwroot + '/user/view.php?id=' + userid + '&course=' + <?php echo $courseid; ?>;
}

function createLesson(type) {
    alert('수업 생성 기능: ' + type);
    // TODO: Implement lesson creation
}

function viewStudents(type) {
    alert('학생 목록 보기: ' + type);
    // TODO: Implement student filtering
}
</script>

<?php

echo $OUTPUT->footer();
