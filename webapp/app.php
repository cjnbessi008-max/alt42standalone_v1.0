<?php
/**
 * Main Application Page - Interactive Shape Exploration
 *
 * @package InvariantFinder
 */

define('APP_ACCESS', true);
require_once 'config.php';

requireLogin();

$user = getCurrentUser();
$activityId = intval($_GET['id'] ?? 0);

if (!$activityId) {
    setFlash('error', 'Invalid activity');
    redirect('dashboard.php');
}

$activity = getActivity($activityId);

if (!$activity) {
    setFlash('error', 'Activity not found');
    redirect('dashboard.php');
}

// Get or create attempt
$attempt = getUserAttempt($user['id'], $activityId);
if (!$attempt || $attempt['completed']) {
    // Create new attempt
    $attemptId = createAttempt($user['id'], $activityId);
    $attempt = db()->fetchOne("SELECT * FROM attempts WHERE id = ?", [$attemptId]);
}

$shapeConfig = SHAPE_TYPES[$activity['shape_type']];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($activity['title']); ?> - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="app-page">
    <?php include 'includes/header.php'; ?>

    <div class="app-container">
        <div class="container-fluid">
            <div class="app-header">
                <div class="app-header-left">
                    <a href="dashboard.php" class="btn-back">← Back to Dashboard</a>
                    <h1><?php echo htmlspecialchars($activity['title']); ?></h1>
                </div>
                <div class="app-header-right">
                    <div class="score-badge">
                        Score: <span id="current-score"><?php echo round($attempt['score'], 1); ?></span>/100
                    </div>
                </div>
            </div>

            <div class="app-layout">
                <!-- Left Panel: Instructions and Hints -->
                <div class="app-left-panel">
                    <div class="instructions-card">
                        <h3>📝 Instructions</h3>
                        <p><?php echo htmlspecialchars($activity['description']); ?></p>

                        <div class="instructions-steps">
                            <h4>How to use:</h4>
                            <ol>
                                <li>Use the <strong>slider</strong> to scale the shape</li>
                                <li>Observe which measurements <strong>change</strong> and which <strong>stay the same</strong></li>
                                <li>Properties that don't change are called <strong>invariants</strong></li>
                                <li>Click <strong>"Check Invariant"</strong> when you think you've found one</li>
                                <li>Submit your answer when you're confident you've found all invariants</li>
                            </ol>
                        </div>

                        <div class="controls-section">
                            <h4>🎮 Quick Controls</h4>
                            <button id="zoom-in" class="control-btn">
                                <span>🔍+</span> Zoom In
                            </button>
                            <button id="zoom-out" class="control-btn">
                                <span>🔍-</span> Zoom Out
                            </button>
                            <button id="reset" class="control-btn">
                                <span>🔄</span> Reset
                            </button>
                        </div>

                        <?php if ($activity['show_hints']): ?>
                        <div class="hints-section">
                            <h4>💡 Hints</h4>
                            <div id="hints-content" class="hints-list"></div>
                        </div>
                        <?php endif; ?>

                        <div class="invariants-found-section">
                            <h4>✨ Invariants Found</h4>
                            <div id="found-invariants" class="found-list">
                                <p class="text-muted">Scale the shape to discover invariants...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Panel: Smartphone Viewport -->
                <div class="app-right-panel">
                    <div class="smartphone-wrapper">
                        <div class="smartphone-frame">
                            <!-- Smartphone Header (Notch area) -->
                            <div class="smartphone-header">
                                <div class="speaker"></div>
                                <div class="camera"></div>
                            </div>

                            <!-- Smartphone Screen -->
                            <div class="smartphone-screen">
                                <!-- App Header -->
                                <div class="app-screen-header">
                                    <h2>Invariant Finder</h2>
                                    <div class="shape-badge" style="background: <?php echo $shapeConfig['color']; ?>;">
                                        <?php echo $shapeConfig['name']; ?>
                                    </div>
                                </div>

                                <!-- Canvas Area -->
                                <canvas id="shape-canvas" width="300" height="400"></canvas>

                                <!-- Shape Controls -->
                                <div class="shape-controls">
                                    <label for="scale-slider" class="slider-label">
                                        Scale: <span id="scale-value">100%</span>
                                    </label>
                                    <input
                                        type="range"
                                        id="scale-slider"
                                        min="50"
                                        max="200"
                                        value="100"
                                        class="slider"
                                    >
                                </div>

                                <!-- Measurements Display -->
                                <div class="measurements-display">
                                    <div class="measurements-header">
                                        <strong>Measurements</strong>
                                    </div>
                                    <div id="measurements" class="measurements-grid"></div>
                                </div>

                                <!-- Action Buttons -->
                                <div class="action-buttons">
                                    <button id="check-invariant" class="btn btn-secondary">
                                        🔍 Check Invariant
                                    </button>
                                    <button id="submit-answer" class="btn btn-success">
                                        ✅ Submit Answer
                                    </button>
                                </div>
                            </div>

                            <!-- Smartphone Footer (Home button area) -->
                            <div class="smartphone-footer">
                                <div class="home-button"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast notification container -->
    <div id="toast-container"></div>

    <script>
        // Application configuration
        window.APP_CONFIG = {
            attemptId: <?php echo $attempt['id']; ?>,
            activityId: <?php echo $activity['id']; ?>,
            shapeType: '<?php echo $activity['shape_type']; ?>',
            difficulty: <?php echo $activity['difficulty']; ?>,
            showHints: <?php echo $activity['show_hints'] ? 'true' : 'false'; ?>,
            apiUrl: 'api/',
            csrfToken: '<?php echo generateCSRFToken(); ?>',
            shapeConfig: <?php echo json_encode($shapeConfig); ?>
        };
    </script>
    <script src="assets/js/invariantfinder.js"></script>

    <?php include 'includes/footer.php'; ?>
</body>
</html>
