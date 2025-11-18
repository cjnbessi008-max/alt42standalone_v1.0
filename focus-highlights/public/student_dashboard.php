<?php
/**
 * Student Dashboard
 * View focus highlights and learning statistics
 */

session_start();

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/moodle_api.php';

// For demonstration, get user ID from URL parameter
// In production, this should come from Moodle session or authentication
$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    die("Error: User ID is required. Add ?user_id=X to the URL");
}

// Get user info
$db = Database::getInstance();
$user = $db->fetchOne("SELECT * FROM fh_users WHERE id = :id", ['id' => $userId]);

if (!$user) {
    // Try to sync from Moodle
    try {
        $moodleApi = new MoodleAPI();
        $moodleUserId = $_GET['moodle_user_id'] ?? $userId;
        $localUserId = $moodleApi->syncUser($moodleUserId);
        $user = $db->fetchOne("SELECT * FROM fh_users WHERE id = :id", ['id' => $localUserId]);
    } catch (Exception $e) {
        die("Error: User not found. " . $e->getMessage());
    }
}

$daysBack = $_GET['days'] ?? 30;
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus Highlights - Student Dashboard</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>
        <div class="container">
            <h1>📚 Focus Highlights</h1>
            <p>Track Your Learning Journey</p>
        </div>
    </header>

    <nav>
        <ul>
            <li><a href="student_dashboard.php?user_id=<?php echo $userId; ?>" class="active">Dashboard</a></li>
            <li><a href="student_dashboard.php?user_id=<?php echo $userId; ?>&view=highlights">My Highlights</a></li>
            <li><a href="index.php">Home</a></li>
        </ul>
    </nav>

    <div class="container">
        <!-- User Info -->
        <div class="user-info">
            <div>
                <h2>Welcome, <?php echo htmlspecialchars($user['firstname'] . ' ' . $user['lastname']); ?></h2>
                <p><?php echo htmlspecialchars($user['email']); ?></p>
            </div>
            <span class="role"><?php echo ucfirst($user['role']); ?></span>
        </div>

        <!-- Loading Indicator -->
        <div id="dashboard-loader">
            <div class="loader"></div>
            <p>Loading your data...</p>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-container">
            <div class="stat-card">
                <h3>Total Sessions</h3>
                <div class="stat-value" id="total-sessions">-</div>
            </div>
            <div class="stat-card">
                <h3>Highlights</h3>
                <div class="stat-value" id="highlight-count">-</div>
            </div>
            <div class="stat-card">
                <h3>Avg Focus Score</h3>
                <div class="stat-value" id="avg-focus-score">-</div>
            </div>
            <div class="stat-card">
                <h3>Total Study Time</h3>
                <div class="stat-value" id="total-study-time">-</div>
            </div>
            <div class="stat-card">
                <h3>Avg Accuracy</h3>
                <div class="stat-value" id="avg-accuracy">-</div>
            </div>
        </div>

        <!-- Focus Trend Chart -->
        <div class="dashboard-section">
            <h2>Focus Trend (Last <?php echo $daysBack; ?> Days)</h2>
            <canvas id="focus-chart" width="1000" height="300"></canvas>
        </div>

        <!-- Recent Highlights -->
        <div class="dashboard-section">
            <h2>⭐ Recent Highlights</h2>
            <div id="highlights-container">
                <p class="no-data">Loading highlights...</p>
            </div>
        </div>

        <!-- Course Breakdown -->
        <div class="dashboard-section">
            <h2>Course Breakdown</h2>
            <div id="course-breakdown">
                <p class="no-data">Loading course data...</p>
            </div>
        </div>

        <!-- Recent Sessions -->
        <div class="dashboard-section">
            <h2>Recent Sessions</h2>
            <div id="recent-sessions">
                <p class="no-data">Loading sessions...</p>
            </div>
        </div>

        <div style="text-align: center;">
            <button id="refresh-dashboard">🔄 Refresh Dashboard</button>
        </div>
    </div>

    <script src="js/dashboard.js"></script>
    <script>
        // Initialize dashboard
        const userId = <?php echo $userId; ?>;
        const daysBack = <?php echo $daysBack; ?>;
        const dashboard = new Dashboard(userId, daysBack);
    </script>
</body>
</html>
