<?php
/**
 * Focus Highlights Installation Script
 * Sets up database and initial configuration
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

$step = $_GET['step'] ?? 1;
$error = null;
$success = null;

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($step == 1) {
        // Database configuration
        $dbHost = $_POST['db_host'] ?? 'localhost';
        $dbName = $_POST['db_name'] ?? 'focus_highlights';
        $dbUser = $_POST['db_user'] ?? 'root';
        $dbPass = $_POST['db_pass'] ?? '';

        try {
            // Test connection
            $pdo = new PDO("mysql:host=$dbHost", $dbUser, $dbPass);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Create database if not exists
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$dbName`");

            // Execute schema
            $schema = file_get_contents(__DIR__ . '/sql/schema.sql');
            $pdo->exec($schema);

            // Update config file
            $configContent = "<?php\n";
            $configContent .= "/**\n * Database Configuration\n * Focus Highlights System\n */\n\n";
            $configContent .= "define('DB_HOST', '$dbHost');\n";
            $configContent .= "define('DB_NAME', '$dbName');\n";
            $configContent .= "define('DB_USER', '$dbUser');\n";
            $configContent .= "define('DB_PASS', '$dbPass');\n";
            $configContent .= "define('DB_CHARSET', 'utf8mb4');\n\n";
            $configContent .= "define('DB_OPTIONS', [\n";
            $configContent .= "    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,\n";
            $configContent .= "    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,\n";
            $configContent .= "    PDO::ATTR_EMULATE_PREPARES => false,\n";
            $configContent .= "]);\n\n";
            $configContent .= "date_default_timezone_set('Asia/Seoul');\n";

            file_put_contents(__DIR__ . '/config/database.php', $configContent);

            $success = "Database created and configured successfully!";
            $step = 2;

        } catch (PDOException $e) {
            $error = "Database error: " . $e->getMessage();
        }
    } elseif ($step == 2) {
        // Moodle configuration
        $moodleUrl = rtrim($_POST['moodle_url'], '/');
        $moodleToken = $_POST['moodle_token'] ?? '';

        // Update config
        require_once __DIR__ . '/includes/db.php';
        $db = Database::getInstance();

        try {
            $db->setConfig('moodle_url', $moodleUrl, 'Moodle site URL');
            $db->setConfig('moodle_token', $moodleToken, 'Moodle web service token');

            // Update config file
            $configContent = "<?php\n";
            $configContent .= "/**\n * Moodle Integration Configuration\n * Focus Highlights System\n */\n\n";
            $configContent .= "define('MOODLE_URL', '$moodleUrl');\n";
            $configContent .= "define('MOODLE_TOKEN', '$moodleToken');\n\n";
            $configContent .= "define('MOODLE_WS_ENDPOINT', MOODLE_URL . '/webservice/rest/server.php');\n";
            $configContent .= "define('MOODLE_WS_FORMAT', 'json');\n\n";
            $configContent .= "define('MOODLE_FUNCTIONS', [\n";
            $configContent .= "    'core_user_get_users_by_field',\n";
            $configContent .= "    'core_course_get_courses',\n";
            $configContent .= "    'core_course_get_contents',\n";
            $configContent .= "    'core_enrol_get_enrolled_users',\n";
            $configContent .= "    'mod_quiz_get_user_attempts',\n";
            $configContent .= "    'mod_assign_get_submissions',\n";
            $configContent .= "]);\n\n";
            $configContent .= "define('SESSION_TIMEOUT', 3600);\n";
            $configContent .= "define('SESSION_NAME', 'FH_SESSION');\n";
            $configContent .= "define('SESSION_SECURE', false);\n";
            $configContent .= "define('SESSION_HTTPONLY', true);\n";

            file_put_contents(__DIR__ . '/config/moodle.php', $configContent);

            $success = "Moodle integration configured successfully!";
            $step = 3;

        } catch (Exception $e) {
            $error = "Configuration error: " . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Focus Highlights - Installation</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .install-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 50px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }

        h1 {
            color: #667eea;
            text-align: center;
            margin-bottom: 10px;
        }

        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }

        .steps {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .step {
            flex: 1;
            text-align: center;
            padding: 10px;
            background: #f0f0f0;
            margin: 0 5px;
            border-radius: 5px;
            font-weight: 500;
            color: #999;
        }

        .step.active {
            background: #667eea;
            color: white;
        }

        .step.completed {
            background: #4CAF50;
            color: white;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
        }

        input[type="text"],
        input[type="password"],
        textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            transition: border-color 0.3s;
        }

        input:focus,
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        .help-text {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
        }

        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
            transition: background 0.3s;
        }

        button:hover {
            background: #5568d3;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #dc3545;
        }

        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border-left: 4px solid #28a745;
        }

        .completion {
            text-align: center;
            padding: 30px 0;
        }

        .completion-icon {
            font-size: 80px;
            margin-bottom: 20px;
        }

        .link-button {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 15px 30px;
            border-radius: 5px;
            text-decoration: none;
            margin: 10px;
            transition: background 0.3s;
        }

        .link-button:hover {
            background: #45a049;
        }

        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="install-container">
        <h1>📚 Focus Highlights</h1>
        <p class="subtitle">Installation Wizard</p>

        <div class="steps">
            <div class="step <?php echo $step == 1 ? 'active' : ($step > 1 ? 'completed' : ''); ?>">
                1. Database
            </div>
            <div class="step <?php echo $step == 2 ? 'active' : ($step > 2 ? 'completed' : ''); ?>">
                2. Moodle
            </div>
            <div class="step <?php echo $step == 3 ? 'active' : ''; ?>">
                3. Complete
            </div>
        </div>

        <?php if ($error): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <?php if ($success): ?>
            <div class="success"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>

        <?php if ($step == 1): ?>
            <h2>Step 1: Database Configuration</h2>
            <form method="POST">
                <div class="form-group">
                    <label>Database Host:</label>
                    <input type="text" name="db_host" value="localhost" required>
                    <div class="help-text">Usually "localhost"</div>
                </div>

                <div class="form-group">
                    <label>Database Name:</label>
                    <input type="text" name="db_name" value="focus_highlights" required>
                    <div class="help-text">Will be created if it doesn't exist</div>
                </div>

                <div class="form-group">
                    <label>Database User:</label>
                    <input type="text" name="db_user" value="root" required>
                </div>

                <div class="form-group">
                    <label>Database Password:</label>
                    <input type="password" name="db_pass">
                    <div class="help-text">Leave blank if no password</div>
                </div>

                <button type="submit">Create Database &rarr;</button>
            </form>

        <?php elseif ($step == 2): ?>
            <h2>Step 2: Moodle Integration</h2>
            <form method="POST">
                <div class="form-group">
                    <label>Moodle Site URL:</label>
                    <input type="text" name="moodle_url" value="http://localhost/moodle" required>
                    <div class="help-text">Your Moodle installation URL (without trailing slash)</div>
                </div>

                <div class="form-group">
                    <label>Moodle Web Service Token:</label>
                    <input type="text" name="moodle_token" required>
                    <div class="help-text">
                        Generate from: Moodle → Site administration → Plugins → Web services → Manage tokens
                    </div>
                </div>

                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                    <strong>⚠️ Moodle Web Services Setup Required:</strong>
                    <ol style="margin-top: 10px; padding-left: 20px;">
                        <li>Enable Web services in Moodle</li>
                        <li>Create a new web service with required functions</li>
                        <li>Create a user with web service capabilities</li>
                        <li>Generate a token for that user</li>
                    </ol>
                </div>

                <button type="submit">Configure Moodle &rarr;</button>
            </form>

        <?php elseif ($step == 3): ?>
            <div class="completion">
                <div class="completion-icon">✅</div>
                <h2>Installation Complete!</h2>
                <p style="margin: 20px 0; color: #666;">
                    Focus Highlights has been successfully installed and configured.
                </p>

                <div style="margin-top: 30px;">
                    <a href="public/index.php" class="link-button">🏠 Go to Home</a>
                    <a href="public/student_dashboard.php?user_id=1" class="link-button">👨‍🎓 Student Dashboard</a>
                    <a href="public/teacher_dashboard.php?teacher_id=1" class="link-button">👨‍🏫 Teacher Dashboard</a>
                </div>

                <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin-top: 30px; text-align: left;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">Next Steps:</h3>
                    <ol style="line-height: 2; color: #666;">
                        <li>Sync users from Moodle or create test users</li>
                        <li>Add the JavaScript tracker to your Moodle pages</li>
                        <li>Configure tracking parameters if needed</li>
                        <li>Start tracking student focus sessions!</li>
                    </ol>
                </div>

                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: left; border-left: 4px solid #2196F3;">
                    <strong>📝 Integration Code:</strong>
                    <p style="margin: 10px 0; font-size: 13px;">Add this to your Moodle theme or course pages:</p>
                    <code style="display: block; padding: 10px; white-space: pre; overflow-x: auto;">
&lt;script src="/focus-highlights/public/js/tracker.js"&gt;&lt;/script&gt;
&lt;div data-focus-tracker
     data-user-id="&lt;?php echo $USER->id; ?&gt;"
     data-course-id="&lt;?php echo $COURSE->id; ?&gt;"&gt;
&lt;/div&gt;
                    </code>
                </div>
            </div>

        <?php endif; ?>

    </div>
</body>
</html>
