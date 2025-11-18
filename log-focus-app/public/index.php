<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Log Focus - Automatic Keyword Highlighting</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📱 Log Focus</h1>
            <p>Moodle 연동 로그 자동 하이라이트 시스템</p>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
            <!-- Control Panel -->
            <div class="control-panel">
                <!-- Statistics -->
                <div class="control-section">
                    <h3>📊 Statistics</h3>
                    <div class="stats-panel">
                        <div class="stat-card">
                            <div class="stat-value" id="stat-total">0</div>
                            <div class="stat-label">Total Logs</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);">
                            <div class="stat-value" id="stat-success">0</div>
                            <div class="stat-label">Success</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);">
                            <div class="stat-value" id="stat-errors">0</div>
                            <div class="stat-label">Errors</div>
                        </div>
                        <div class="stat-card" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);">
                            <div class="stat-value" id="stat-warnings">0</div>
                            <div class="stat-label">Warnings</div>
                        </div>
                    </div>
                </div>

                <!-- Moodle Sync -->
                <div class="control-section">
                    <h3>🔄 Moodle Sync</h3>
                    <div class="filter-group">
                        <label for="quiz-id">Quiz ID *</label>
                        <input type="number" id="quiz-id" placeholder="Enter Moodle Quiz ID">
                    </div>
                    <div class="filter-group">
                        <label for="user-id">User ID (Optional)</label>
                        <input type="number" id="user-id" placeholder="Leave empty for all users">
                    </div>
                    <button class="btn btn-success" id="btn-sync">Sync from Moodle</button>
                </div>

                <!-- Filters -->
                <div class="control-section">
                    <h3>🔍 Filters</h3>
                    <div class="filter-group">
                        <label for="filter-user-id">User ID</label>
                        <input type="number" id="filter-user-id" placeholder="Filter by user ID">
                    </div>
                    <div class="filter-group">
                        <label for="filter-activity-type">Activity Type</label>
                        <select id="filter-activity-type">
                            <option value="">All Types</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="ASSIGNMENT">Assignment</option>
                            <option value="FORUM">Forum</option>
                            <option value="LESSON">Lesson</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filter-from-date">From Date</label>
                        <input type="date" id="filter-from-date">
                    </div>
                    <div class="filter-group">
                        <label for="filter-to-date">To Date</label>
                        <input type="date" id="filter-to-date">
                    </div>
                    <button class="btn btn-primary" id="btn-apply-filters">Apply Filters</button>
                    <button class="btn btn-info" id="btn-clear-filters">Clear Filters</button>
                </div>

                <!-- Controls -->
                <div class="control-section">
                    <h3>⚙️ Controls</h3>
                    <button class="btn btn-primary" id="btn-refresh">Refresh Logs</button>
                    <button class="btn btn-info" id="btn-auto-refresh">Auto-Refresh</button>
                </div>

                <!-- Keyword Legend -->
                <div class="control-section">
                    <h3>🎨 Keyword Highlights</h3>
                    <div class="keyword-legend" id="keyword-legend">
                        <span class="legend-item highlight-error">ERROR</span>
                        <span class="legend-item highlight-warning">WARNING</span>
                        <span class="legend-item highlight-success">SUCCESS</span>
                        <span class="legend-item highlight-action">ACTION</span>
                        <span class="legend-item highlight-problem">PROBLEM</span>
                        <span class="legend-item highlight-negative">NEGATIVE</span>
                        <span class="legend-item highlight-time">TIME</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Virtual Smartphone Screen (Fixed Bottom Right) -->
        <div class="smartphone-container">
            <div class="smartphone">
                <div class="smartphone-screen">
                    <div class="smartphone-header">
                        📋 Activity Logs
                    </div>
                    <div class="smartphone-content" id="log-container">
                        <div class="status-message">
                            Initializing Log Focus...<br>
                            Waiting for logs to load...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/log-focus.js"></script>
</body>
</html>
