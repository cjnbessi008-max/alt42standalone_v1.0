<?php
/**
 * LTI Launch Endpoint
 * Handles LTI launch requests from Moodle
 *
 * @package AI_Education_Pipeline
 * @copyright 2025 KAIST Touch Math Academy
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../lti/LTIHandler.php';

use AIPipeline\LTI\LTIHandler;

// Load configuration
$config = include __DIR__ . '/../../config/moodle_config.php';

// Set error handling
ini_set('display_errors', $config['error_handling']['display_errors'] ? '1' : '0');
error_reporting($config['error_handling']['error_reporting']);

// Start session
session_start();

// Log request (if enabled)
if ($config['logging']['log_lti_requests']) {
    error_log('LTI Launch Request: ' . json_encode([
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'post_data' => array_keys($_POST)
    ]));
}

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Method Not Allowed. LTI launch requires POST request.');
}

// Security check: IP whitelist (if enabled)
if ($config['security']['ip_whitelist_enabled']) {
    $client_ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($client_ip, $config['security']['allowed_ips'])) {
        error_log("LTI Launch rejected: IP {$client_ip} not in whitelist");
        http_response_code(403);
        die('Access Forbidden: IP not allowed');
    }
}

// Security check: Verify referer (basic check)
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$allowed = false;
foreach ($config['lti']['allowed_domains'] as $domain) {
    if (strpos($referer, $domain) !== false) {
        $allowed = true;
        break;
    }
}

if (!$allowed && !empty($config['lti']['allowed_domains'])) {
    error_log("LTI Launch rejected: Invalid referer {$referer}");
    http_response_code(403);
    die('Access Forbidden: Invalid referer');
}

try {
    // Initialize LTI handler
    $lti_handler = new LTIHandler([
        'consumer_key' => $config['lti']['consumer_key'],
        'shared_secret' => $config['lti']['shared_secret']
    ]);

    // Handle launch request
    $result = $lti_handler->handleLaunchRequest($_POST);

    if (!$result['success']) {
        // Log error
        error_log('LTI Launch Failed: ' . json_encode($result));

        // Display error page
        http_response_code(400);
        renderErrorPage($result['error'], $result['code']);
        exit;
    }

    // Success - log user info
    if ($config['logging']['log_lti_requests']) {
        error_log('LTI Launch Success: ' . json_encode([
            'user_id' => $result['user']['lti_user_id'],
            'email' => $result['user']['email'],
            'roles' => $result['user']['roles'],
            'context_id' => $result['user']['context_id']
        ]));
    }

    // Redirect to module
    $redirect_url = $result['redirect_url'];
    $full_url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
              . '://' . $_SERVER['HTTP_HOST'] . $redirect_url;

    header('Location: ' . $full_url);
    exit;

} catch (Exception $e) {
    // Log exception
    error_log('LTI Launch Exception: ' . $e->getMessage() . "\n" . $e->getTraceAsString());

    // Send email notification (if configured)
    if ($config['error_handling']['email_on_error']) {
        sendErrorNotification($e, $config['error_handling']['admin_email']);
    }

    // Display error page
    http_response_code(500);
    renderErrorPage('Internal Server Error', 'EXCEPTION');
    exit;
}

/**
 * Render error page
 * @param string $message Error message
 * @param string $code Error code
 */
function renderErrorPage(string $message, string $code): void
{
    ?>
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LTI Launch Error</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
            }
            .error-container {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                padding: 40px;
                max-width: 500px;
                text-align: center;
            }
            .error-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            h1 {
                color: #e74c3c;
                font-size: 24px;
                margin: 0 0 10px 0;
            }
            .error-code {
                color: #95a5a6;
                font-size: 14px;
                font-family: 'Courier New', monospace;
                margin-bottom: 20px;
            }
            .error-message {
                color: #34495e;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .help-text {
                background: #f8f9fa;
                border-left: 4px solid #3498db;
                padding: 15px;
                text-align: left;
                font-size: 14px;
                color: #555;
            }
            .help-text strong {
                color: #2c3e50;
                display: block;
                margin-bottom: 5px;
            }
            .back-button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 24px;
                background: #3498db;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                transition: background 0.3s;
            }
            .back-button:hover {
                background: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h1>LTI Launch Failed</h1>
            <div class="error-code">Error Code: <?php echo htmlspecialchars($code); ?></div>
            <div class="error-message">
                <?php echo htmlspecialchars($message); ?>
            </div>
            <div class="help-text">
                <strong>문제 해결 방법:</strong>
                1. Moodle에서 다시 모듈에 접근해주세요<br>
                2. 문제가 계속되면 교사 또는 관리자에게 문의하세요<br>
                3. 오류 코드를 함께 전달해주세요: <code><?php echo htmlspecialchars($code); ?></code>
            </div>
            <a href="javascript:history.back()" class="back-button">← Moodle로 돌아가기</a>
        </div>
    </body>
    </html>
    <?php
}

/**
 * Send error notification email
 * @param Exception $e Exception object
 * @param string $admin_email Admin email address
 */
function sendErrorNotification(Exception $e, string $admin_email): void
{
    $subject = 'LTI Integration Error - AI Pipeline';
    $message = "An error occurred in the LTI integration:\n\n";
    $message .= "Time: " . date('Y-m-d H:i:s') . "\n";
    $message .= "Error: " . $e->getMessage() . "\n";
    $message .= "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    $message .= "Trace:\n" . $e->getTraceAsString() . "\n";

    $headers = [
        'From: noreply@kaist.ac.kr',
        'X-Mailer: PHP/' . phpversion()
    ];

    @mail($admin_email, $subject, $message, implode("\r\n", $headers));
}
