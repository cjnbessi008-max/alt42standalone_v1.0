<?php
/**
 * Dashboard - Main User Page
 *
 * @package InvariantFinder
 */

define('APP_ACCESS', true);
require_once 'config.php';

requireLogin();

$user = getCurrentUser();
$stats = getUserStats($user['id']);

// Get available activities
$activities = db()->fetchAll("
    SELECT a.*, COUNT(at.id) as attempt_count,
           MAX(at.score) as best_score
    FROM activities a
    LEFT JOIN attempts at ON a.id = at.activity_id AND at.user_id = ?
    WHERE a.is_active = 1
    GROUP BY a.id
    ORDER BY a.difficulty ASC, a.title ASC
", [$user['id']]);

// Get recent attempts
$recentAttempts = db()->fetchAll("
    SELECT at.*, ac.title as activity_title, ac.shape_type
    FROM attempts at
    JOIN activities ac ON at.activity_id = ac.id
    WHERE at.user_id = ?
    ORDER BY at.updated_at DESC
    LIMIT 5
", [$user['id']]);

// Get leaderboard
$leaderboard = getLeaderboard(null, 10);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
    <?php include 'includes/header.php'; ?>

    <div class="dashboard-container">
        <div class="container">
            <div class="welcome-section">
                <h1>Welcome back, <?php echo htmlspecialchars($user['full_name'] ?: $user['username']); ?>! 👋</h1>
                <p>Ready to discover more geometric invariants?</p>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📝</div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $stats['total_attempts'] ?: 0; ?></div>
                        <div class="stat-label">Total Attempts</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $stats['completed_attempts'] ?: 0; ?></div>
                        <div class="stat-label">Completed</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $stats['avg_score'] ? round($stats['avg_score'], 1) : 0; ?></div>
                        <div class="stat-label">Average Score</div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $stats['best_score'] ?: 0; ?></div>
                        <div class="stat-label">Best Score</div>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="dashboard-grid">
                <!-- Activities List -->
                <div class="dashboard-section">
                    <h2 class="section-title">Available Activities</h2>

                    <div class="activities-list">
                        <?php foreach ($activities as $activity): ?>
                            <div class="activity-card">
                                <div class="activity-icon" style="background: <?php echo SHAPE_TYPES[$activity['shape_type']]['color']; ?>">
                                    <?php
                                    $icons = ['triangle' => '△', 'rectangle' => '▢', 'circle' => '●', 'parallelogram' => '▱'];
                                    echo $icons[$activity['shape_type']];
                                    ?>
                                </div>

                                <div class="activity-info">
                                    <h3><?php echo htmlspecialchars($activity['title']); ?></h3>
                                    <p><?php echo htmlspecialchars($activity['description']); ?></p>

                                    <div class="activity-meta">
                                        <span class="badge badge-difficulty">
                                            Level <?php echo $activity['difficulty']; ?>
                                        </span>
                                        <span class="badge badge-shape">
                                            <?php echo SHAPE_TYPES[$activity['shape_type']]['name']; ?>
                                        </span>
                                        <?php if ($activity['attempt_count'] > 0): ?>
                                            <span class="badge badge-attempts">
                                                <?php echo $activity['attempt_count']; ?> attempts
                                            </span>
                                        <?php endif; ?>
                                    </div>

                                    <?php if ($activity['best_score']): ?>
                                        <div class="activity-score">
                                            Best Score: <strong><?php echo round($activity['best_score'], 1); ?></strong>
                                        </div>
                                    <?php endif; ?>
                                </div>

                                <div class="activity-action">
                                    <a href="app.php?id=<?php echo $activity['id']; ?>" class="btn btn-primary">
                                        <?php echo $activity['attempt_count'] > 0 ? 'Continue' : 'Start'; ?>
                                    </a>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Sidebar -->
                <aside class="dashboard-sidebar">
                    <!-- Recent Activity -->
                    <div class="sidebar-section">
                        <h3>Recent Activity</h3>
                        <?php if (empty($recentAttempts)): ?>
                            <p class="text-muted">No recent attempts yet. Start an activity to begin!</p>
                        <?php else: ?>
                            <div class="recent-list">
                                <?php foreach ($recentAttempts as $attempt): ?>
                                    <div class="recent-item">
                                        <div class="recent-icon" style="background: <?php echo SHAPE_TYPES[$attempt['shape_type']]['color']; ?>20;">
                                            <?php
                                            $icons = ['triangle' => '△', 'rectangle' => '▢', 'circle' => '●', 'parallelogram' => '▱'];
                                            echo $icons[$attempt['shape_type']];
                                            ?>
                                        </div>
                                        <div class="recent-content">
                                            <div class="recent-title"><?php echo htmlspecialchars($attempt['activity_title']); ?></div>
                                            <div class="recent-meta">
                                                Score: <?php echo round($attempt['score'], 1); ?> • <?php echo timeAgo($attempt['updated_at']); ?>
                                            </div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- Leaderboard -->
                    <div class="sidebar-section">
                        <h3>🏆 Top Performers</h3>
                        <?php if (empty($leaderboard)): ?>
                            <p class="text-muted">No leaderboard data yet.</p>
                        <?php else: ?>
                            <div class="leaderboard-list">
                                <?php foreach ($leaderboard as $index => $entry): ?>
                                    <div class="leaderboard-item <?php echo $entry['user_id'] == $user['id'] ? 'current-user' : ''; ?>">
                                        <div class="leaderboard-rank">#<?php echo $index + 1; ?></div>
                                        <div class="leaderboard-user">
                                            <?php echo htmlspecialchars($entry['username']); ?>
                                        </div>
                                        <div class="leaderboard-score">
                                            <?php echo round($entry['avg_score'], 1); ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                </aside>
            </div>
        </div>
    </div>

    <?php include 'includes/footer.php'; ?>
</body>
</html>
