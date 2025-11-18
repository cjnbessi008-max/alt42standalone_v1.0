<?php
/**
 * Teacher Dashboard
 * View student focus highlights and course statistics
 */

session_start();

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/focus_tracker.php';

// For demonstration, get teacher ID from URL parameter
$teacherId = $_GET['teacher_id'] ?? null;
$courseId = $_GET['course_id'] ?? null;

if (!$teacherId) {
    die("Error: Teacher ID is required. Add ?teacher_id=X to the URL");
}

// Get teacher info
$db = Database::getInstance();
$teacher = $db->fetchOne("SELECT * FROM fh_users WHERE id = :id AND role = 'teacher'", ['id' => $teacherId]);

if (!$teacher) {
    die("Error: Teacher not found or invalid role");
}

// Get all courses
$courses = $db->fetchAll("SELECT * FROM fh_courses ORDER BY course_name ASC");

// If no course selected, use first course
if (!$courseId && !empty($courses)) {
    $courseId = $courses[0]['moodle_course_id'];
}

$selectedCourse = null;
if ($courseId) {
    $selectedCourse = $db->fetchOne(
        "SELECT * FROM fh_courses WHERE moodle_course_id = :course_id",
        ['course_id' => $courseId]
    );
}

$tracker = new FocusTracker();
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus Highlights - Teacher Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>👨‍🏫 Focus Highlights - Teacher</h1>
            <p>Monitor Student Focus & Engagement</p>
        </div>
    </header>

    <nav>
        <ul>
            <li><a href="teacher_dashboard.php?teacher_id=<?php echo $teacherId; ?>" class="active">Dashboard</a></li>
            <li><a href="index.php">Home</a></li>
        </ul>
    </nav>

    <div class="container">
        <!-- Teacher Info -->
        <div class="user-info">
            <div>
                <h2><?php echo htmlspecialchars($teacher['firstname'] . ' ' . $teacher['lastname']); ?></h2>
                <p><?php echo htmlspecialchars($teacher['email']); ?></p>
            </div>
            <span class="role">Teacher</span>
        </div>

        <!-- Course Selection -->
        <div class="dashboard-section">
            <h2>Select Course</h2>
            <form method="GET" action="teacher_dashboard.php">
                <input type="hidden" name="teacher_id" value="<?php echo $teacherId; ?>">
                <select name="course_id" onchange="this.form.submit()" style="padding: 10px; font-size: 1em; border-radius: 5px; border: 1px solid #ddd; min-width: 300px;">
                    <option value="">-- Select a Course --</option>
                    <?php foreach ($courses as $course): ?>
                        <option value="<?php echo $course['moodle_course_id']; ?>"
                                <?php echo ($courseId == $course['moodle_course_id']) ? 'selected' : ''; ?>>
                            <?php echo htmlspecialchars($course['course_name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </form>
        </div>

        <?php if ($selectedCourse && $courseId): ?>

        <!-- Course Statistics -->
        <?php
        $courseStats = $db->fetchOne(
            "SELECT
                COUNT(DISTINCT user_id) as student_count,
                COUNT(*) as total_sessions,
                SUM(CASE WHEN is_highlight = 1 THEN 1 ELSE 0 END) as highlight_count,
                AVG(focus_score) as avg_focus_score,
                AVG(accuracy_rate) as avg_accuracy
            FROM fh_focus_sessions
            WHERE moodle_course_id = :course_id",
            ['course_id' => $courseId]
        );
        ?>

        <div class="stats-container">
            <div class="stat-card">
                <h3>Students</h3>
                <div class="stat-value"><?php echo $courseStats['student_count'] ?? 0; ?></div>
            </div>
            <div class="stat-card">
                <h3>Total Sessions</h3>
                <div class="stat-value"><?php echo $courseStats['total_sessions'] ?? 0; ?></div>
            </div>
            <div class="stat-card">
                <h3>Highlights</h3>
                <div class="stat-value"><?php echo $courseStats['highlight_count'] ?? 0; ?></div>
            </div>
            <div class="stat-card">
                <h3>Avg Focus Score</h3>
                <div class="stat-value">
                    <?php echo $courseStats['avg_focus_score'] ? number_format($courseStats['avg_focus_score'], 1) : '0.0'; ?>
                </div>
            </div>
            <div class="stat-card">
                <h3>Avg Accuracy</h3>
                <div class="stat-value">
                    <?php echo $courseStats['avg_accuracy'] ? number_format($courseStats['avg_accuracy'], 1) . '%' : '0.0%'; ?>
                </div>
            </div>
        </div>

        <!-- Student Highlights -->
        <div class="dashboard-section">
            <h2>⭐ Recent Highlights</h2>
            <?php
            $highlights = $tracker->getCourseHighlights($courseId, 20);

            if (empty($highlights)):
            ?>
                <p class="no-data">No highlights yet for this course</p>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Date/Time</th>
                            <th>Duration</th>
                            <th>Focus Score</th>
                            <th>Accuracy</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($highlights as $highlight): ?>
                            <tr>
                                <td>
                                    <?php echo htmlspecialchars($highlight['firstname'] . ' ' . $highlight['lastname']); ?>
                                    <br>
                                    <small style="color: #999;"><?php echo htmlspecialchars($highlight['username']); ?></small>
                                </td>
                                <td>
                                    <?php
                                    $date = new DateTime($highlight['session_start']);
                                    echo $date->format('Y-m-d H:i');
                                    ?>
                                </td>
                                <td>
                                    <?php
                                    $duration = $highlight['duration_seconds'];
                                    $hours = floor($duration / 3600);
                                    $minutes = floor(($duration % 3600) / 60);
                                    echo $hours > 0 ? "{$hours}h {$minutes}m" : "{$minutes}m";
                                    ?>
                                </td>
                                <td style="font-weight: bold; color: #4CAF50;">
                                    <?php echo number_format($highlight['focus_score'], 1); ?>/100
                                </td>
                                <td>
                                    <?php echo $highlight['accuracy_rate'] > 0 ? number_format($highlight['accuracy_rate'], 1) . '%' : '-'; ?>
                                </td>
                                <td style="font-style: italic; color: #666;">
                                    <?php echo htmlspecialchars($highlight['highlight_reason'] ?? 'Great focus session'); ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <!-- Student Performance Summary -->
        <div class="dashboard-section">
            <h2>Student Performance Summary</h2>
            <?php
            $studentStats = $db->fetchAll(
                "SELECT
                    u.id,
                    u.username,
                    u.firstname,
                    u.lastname,
                    COUNT(*) as session_count,
                    SUM(CASE WHEN s.is_highlight = 1 THEN 1 ELSE 0 END) as highlight_count,
                    AVG(s.focus_score) as avg_focus_score,
                    AVG(s.accuracy_rate) as avg_accuracy,
                    SUM(s.duration_seconds) as total_duration
                FROM fh_focus_sessions s
                JOIN fh_users u ON s.user_id = u.id
                WHERE s.moodle_course_id = :course_id
                GROUP BY u.id, u.username, u.firstname, u.lastname
                ORDER BY avg_focus_score DESC",
                ['course_id' => $courseId]
            );

            if (empty($studentStats)):
            ?>
                <p class="no-data">No student activity yet</p>
            <?php else: ?>
                <table>
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Sessions</th>
                            <th>Highlights</th>
                            <th>Avg Focus</th>
                            <th>Avg Accuracy</th>
                            <th>Total Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($studentStats as $student): ?>
                            <tr>
                                <td>
                                    <?php echo htmlspecialchars($student['firstname'] . ' ' . $student['lastname']); ?>
                                    <br>
                                    <small style="color: #999;"><?php echo htmlspecialchars($student['username']); ?></small>
                                </td>
                                <td><?php echo $student['session_count']; ?></td>
                                <td><?php echo $student['highlight_count']; ?></td>
                                <td style="font-weight: bold; color: #667eea;">
                                    <?php echo number_format($student['avg_focus_score'], 1); ?>
                                </td>
                                <td>
                                    <?php echo $student['avg_accuracy'] > 0 ? number_format($student['avg_accuracy'], 1) . '%' : '-'; ?>
                                </td>
                                <td>
                                    <?php
                                    $duration = $student['total_duration'];
                                    $hours = floor($duration / 3600);
                                    $minutes = floor(($duration % 3600) / 60);
                                    echo $hours > 0 ? "{$hours}h {$minutes}m" : "{$minutes}m";
                                    ?>
                                </td>
                                <td>
                                    <a href="student_dashboard.php?user_id=<?php echo $student['id']; ?>"
                                       style="color: #667eea; text-decoration: none;">
                                        View Details →
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <?php else: ?>
            <div class="dashboard-section">
                <p class="no-data">Please select a course to view statistics</p>
            </div>
        <?php endif; ?>

    </div>

</body>
</html>
