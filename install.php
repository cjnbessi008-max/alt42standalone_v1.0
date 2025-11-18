<?php
/**
 * Solution Paint - Installation Wizard
 * 데이터베이스 설치 및 초기 설정
 */

// 이미 설치된 경우 접근 차단
$configFile = __DIR__ . '/api/db_config.php';
$lockFile = __DIR__ . '/install.lock';

if (file_exists($lockFile)) {
    die('Installation is already completed. Delete install.lock file to reinstall.');
}

// 설치 단계 처리
$step = isset($_GET['step']) ? intval($_GET['step']) : 1;
$errors = [];
$success = [];

// POST 요청 처리
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($step === 1) {
        // 데이터베이스 연결 테스트
        $dbHost = $_POST['db_host'] ?? 'localhost';
        $dbPort = $_POST['db_port'] ?? '3306';
        $dbName = $_POST['db_name'] ?? 'solution_paint';
        $dbUser = $_POST['db_user'] ?? 'root';
        $dbPass = $_POST['db_pass'] ?? '';

        try {
            $dsn = "mysql:host=$dbHost;port=$dbPort;charset=utf8mb4";
            $pdo = new PDO($dsn, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);

            // 데이터베이스 생성
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$dbName`");

            // 스키마 파일 읽기 및 실행
            $schemaFile = __DIR__ . '/database/schema.sql';
            if (file_exists($schemaFile)) {
                $sql = file_get_contents($schemaFile);
                // SQL 문을 개별 쿼리로 분리
                $queries = array_filter(array_map('trim', explode(';', $sql)));

                foreach ($queries as $query) {
                    if (!empty($query) && strpos($query, '--') !== 0) {
                        try {
                            $pdo->exec($query);
                        } catch (PDOException $e) {
                            // CREATE DATABASE 에러는 무시 (이미 생성됨)
                            if (strpos($query, 'CREATE DATABASE') === false) {
                                throw $e;
                            }
                        }
                    }
                }

                $success[] = 'Database and tables created successfully!';
            } else {
                $errors[] = 'Schema file not found: ' . $schemaFile;
            }

            // 설정 파일 업데이트
            updateConfigFile($dbHost, $dbPort, $dbName, $dbUser, $dbPass);
            $success[] = 'Configuration file updated!';

            // 다음 단계로
            if (empty($errors)) {
                header('Location: install.php?step=2');
                exit;
            }

        } catch (PDOException $e) {
            $errors[] = 'Database error: ' . $e->getMessage();
        }

    } elseif ($step === 2) {
        // Moodle 설정 (선택적)
        $moodleEnabled = isset($_POST['moodle_enabled']) ? 1 : 0;
        $moodleUrl = $_POST['moodle_url'] ?? '';
        $moodleToken = $_POST['moodle_token'] ?? '';

        // 설정 저장
        if (saveMoodleConfig($moodleEnabled, $moodleUrl, $moodleToken)) {
            $success[] = 'Moodle configuration saved!';

            // 설치 완료 - lock 파일 생성
            file_put_contents($lockFile, date('Y-m-d H:i:s'));

            header('Location: install.php?step=3');
            exit;
        } else {
            $errors[] = 'Failed to save Moodle configuration';
        }
    }
}

/**
 * 설정 파일 업데이트
 */
function updateConfigFile($host, $port, $name, $user, $pass) {
    $configFile = __DIR__ . '/api/db_config.php';
    $content = file_get_contents($configFile);

    $content = preg_replace(
        "/define\('DB_HOST',\s*'[^']*'\);/",
        "define('DB_HOST', '$host');",
        $content
    );
    $content = preg_replace(
        "/define\('DB_PORT',\s*'[^']*'\);/",
        "define('DB_PORT', '$port');",
        $content
    );
    $content = preg_replace(
        "/define\('DB_NAME',\s*'[^']*'\);/",
        "define('DB_NAME', '$name');",
        $content
    );
    $content = preg_replace(
        "/define\('DB_USER',\s*'[^']*'\);/",
        "define('DB_USER', '$user');",
        $content
    );
    $content = preg_replace(
        "/define\('DB_PASS',\s*'[^']*'\);/",
        "define('DB_PASS', '$pass');",
        $content
    );

    file_put_contents($configFile, $content);
}

/**
 * Moodle 설정 저장
 */
function saveMoodleConfig($enabled, $url, $token) {
    $configFile = __DIR__ . '/api/db_config.php';
    $content = file_get_contents($configFile);

    $enabledValue = $enabled ? 'true' : 'false';

    $content = preg_replace(
        "/define\('MOODLE_ENABLED',\s*(true|false)\);/",
        "define('MOODLE_ENABLED', $enabledValue);",
        $content
    );
    $content = preg_replace(
        "/define\('MOODLE_URL',\s*'[^']*'\);/",
        "define('MOODLE_URL', '$url');",
        $content
    );
    $content = preg_replace(
        "/define\('MOODLE_TOKEN',\s*'[^']*'\);/",
        "define('MOODLE_TOKEN', '$token');",
        $content
    );

    return file_put_contents($configFile, $content) !== false;
}
?>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solution Paint - Installation</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .installer {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2em;
            margin-bottom: 10px;
        }
        .content {
            padding: 30px;
        }
        .step-indicator {
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
            font-weight: 600;
            color: #999;
        }
        .step.active {
            background: #667eea;
            color: white;
        }
        .step.completed {
            background: #51cf66;
            color: white;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        input[type="text"],
        input[type="password"],
        input[type="number"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 1em;
            transition: border-color 0.3s;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
        }
        .checkbox-group input[type="checkbox"] {
            margin-right: 10px;
            width: 20px;
            height: 20px;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        button:active {
            transform: translateY(0);
        }
        .error {
            background: #ffe0e0;
            border-left: 4px solid #ff6b6b;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            color: #c92a2a;
        }
        .success {
            background: #d3f9d8;
            border-left: 4px solid #51cf66;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
            color: #2b8a3e;
        }
        .help-text {
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        }
        .completion {
            text-align: center;
            padding: 40px 0;
        }
        .completion h2 {
            color: #51cf66;
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        .completion p {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.6;
        }
        .completion .actions {
            margin-top: 30px;
        }
        .completion a {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 0 10px;
        }
    </style>
</head>
<body>
    <div class="installer">
        <div class="header">
            <h1>🎨 Solution Paint</h1>
            <p>Installation Wizard</p>
        </div>

        <div class="content">
            <div class="step-indicator">
                <div class="step <?php echo $step >= 1 ? ($step > 1 ? 'completed' : 'active') : ''; ?>">
                    1. Database
                </div>
                <div class="step <?php echo $step >= 2 ? ($step > 2 ? 'completed' : 'active') : ''; ?>">
                    2. Moodle
                </div>
                <div class="step <?php echo $step >= 3 ? 'active' : ''; ?>">
                    3. Complete
                </div>
            </div>

            <?php if (!empty($errors)): ?>
                <div class="error">
                    <?php foreach ($errors as $error): ?>
                        <p><?php echo htmlspecialchars($error); ?></p>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if (!empty($success)): ?>
                <div class="success">
                    <?php foreach ($success as $msg): ?>
                        <p><?php echo htmlspecialchars($msg); ?></p>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if ($step === 1): ?>
                <h2>Step 1: Database Configuration</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Enter your MySQL database credentials. The installer will create the database and tables automatically.
                </p>

                <form method="POST">
                    <div class="form-group">
                        <label>Database Host</label>
                        <input type="text" name="db_host" value="localhost" required>
                        <div class="help-text">Usually "localhost" or "127.0.0.1"</div>
                    </div>

                    <div class="form-group">
                        <label>Database Port</label>
                        <input type="number" name="db_port" value="3306" required>
                        <div class="help-text">Default MySQL port is 3306</div>
                    </div>

                    <div class="form-group">
                        <label>Database Name</label>
                        <input type="text" name="db_name" value="solution_paint" required>
                        <div class="help-text">Will be created if doesn't exist</div>
                    </div>

                    <div class="form-group">
                        <label>Database Username</label>
                        <input type="text" name="db_user" value="root" required>
                    </div>

                    <div class="form-group">
                        <label>Database Password</label>
                        <input type="password" name="db_pass">
                        <div class="help-text">Leave empty if no password</div>
                    </div>

                    <button type="submit">Continue to Moodle Setup →</button>
                </form>

            <?php elseif ($step === 2): ?>
                <h2>Step 2: Moodle Integration (Optional)</h2>
                <p style="margin-bottom: 20px; color: #666;">
                    Configure Moodle LMS integration. You can skip this step and configure it later.
                </p>

                <form method="POST">
                    <div class="form-group checkbox-group">
                        <input type="checkbox" name="moodle_enabled" id="moodle_enabled">
                        <label for="moodle_enabled" style="margin: 0;">Enable Moodle Integration</label>
                    </div>

                    <div class="form-group">
                        <label>Moodle URL</label>
                        <input type="text" name="moodle_url" placeholder="http://your-moodle-site.com">
                        <div class="help-text">Full URL to your Moodle installation</div>
                    </div>

                    <div class="form-group">
                        <label>Moodle REST API Token</label>
                        <input type="text" name="moodle_token" placeholder="a1b2c3d4e5f6...">
                        <div class="help-text">Get this from Moodle: Site Administration > Plugins > Web services</div>
                    </div>

                    <button type="submit">Complete Installation ✓</button>
                </form>

            <?php elseif ($step === 3): ?>
                <div class="completion">
                    <h2>✓ Installation Complete!</h2>
                    <p>Solution Paint has been successfully installed and configured.</p>
                    <p><strong>Important:</strong> For security reasons, please delete the <code>install.php</code> file.</p>

                    <div class="actions">
                        <a href="index.php">Go to Application →</a>
                    </div>

                    <div style="margin-top: 40px; text-align: left; background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h3 style="margin-bottom: 15px;">Next Steps:</h3>
                        <ul style="line-height: 2;">
                            <li>✓ Database created with sample problems</li>
                            <li>✓ Configuration file updated</li>
                            <li>→ Delete <code>install.php</code> file</li>
                            <li>→ Start using the application!</li>
                        </ul>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
