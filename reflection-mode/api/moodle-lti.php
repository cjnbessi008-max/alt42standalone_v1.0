<?php
/**
 * Moodle LTI Integration Handler
 * Compatible with Moodle 3.7, LTI 1.1/1.3
 * Handles LTI launches and grade passback
 */

require_once '../config/database.php';

// LTI Configuration
define('LTI_VERSION', '1.1');
define('LTI_CONSUMER_KEY', getenv('LTI_CONSUMER_KEY') ?: 'reflection_mode_key');
define('LTI_CONSUMER_SECRET', getenv('LTI_CONSUMER_SECRET') ?: 'change_this_secret');
define('SESSION_TIMEOUT', 3600); // 1 hour

/**
 * Main LTI Launch Handler
 */
function handleLTILaunch() {
    // Verify LTI request
    if (!isset($_POST['lti_message_type']) || $_POST['lti_message_type'] !== 'basic-lti-launch-request') {
        return error_response('Invalid LTI launch request');
    }

    // Validate OAuth signature
    if (!validateOAuthSignature()) {
        return error_response('Invalid OAuth signature');
    }

    // Extract LTI parameters
    $ltiParams = extractLTIParameters();

    // Create or update session
    $sessionToken = createLTISession($ltiParams);

    if (!$sessionToken) {
        return error_response('Failed to create session');
    }

    // Get or create problem for this resource
    $problemId = getProblemForResource($ltiParams['resource_link_id']);

    // Redirect to main app with session token
    $redirectUrl = '../public/index.php?'
        . 'session=' . urlencode($sessionToken)
        . '&problem_id=' . intval($problemId);

    header('Location: ' . $redirectUrl);
    exit;
}

/**
 * Validate OAuth 1.0 signature
 */
function validateOAuthSignature() {
    // Get consumer key
    $consumerKey = isset($_POST['oauth_consumer_key']) ? $_POST['oauth_consumer_key'] : '';

    if ($consumerKey !== LTI_CONSUMER_KEY) {
        error_log("Invalid consumer key: $consumerKey");
        return false;
    }

    // Build base string for signature
    $method = $_SERVER['REQUEST_METHOD'];
    $url = getBaseURL();
    $params = $_POST;

    // Remove signature for validation
    $oauth_signature = $params['oauth_signature'];
    unset($params['oauth_signature']);

    // Sort parameters
    ksort($params);

    // Build parameter string
    $paramString = http_build_query($params, '', '&', PHP_QUERY_RFC3986);

    // Build base string
    $baseString = $method . '&'
        . rawurlencode($url) . '&'
        . rawurlencode($paramString);

    // Calculate signature
    $key = rawurlencode(LTI_CONSUMER_SECRET) . '&';
    $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));

    // Compare signatures
    return hash_equals($signature, $oauth_signature);
}

/**
 * Get base URL for current request
 */
function getBaseURL() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    return $protocol . '://' . $host . $path;
}

/**
 * Extract and sanitize LTI parameters
 */
function extractLTIParameters() {
    return [
        'consumer_key' => sanitize($_POST['oauth_consumer_key'] ?? ''),
        'resource_link_id' => sanitize($_POST['resource_link_id'] ?? ''),
        'context_id' => sanitize($_POST['context_id'] ?? ''),
        'context_title' => sanitize($_POST['context_title'] ?? ''),

        'user_id' => sanitize($_POST['user_id'] ?? ''),
        'user_email' => sanitize($_POST['lis_person_contact_email_primary'] ?? ''),
        'user_name' => sanitize($_POST['lis_person_name_full'] ?? ''),
        'user_given_name' => sanitize($_POST['lis_person_name_given'] ?? ''),
        'user_family_name' => sanitize($_POST['lis_person_name_family'] ?? ''),

        'roles' => sanitize($_POST['roles'] ?? ''),

        'outcome_service_url' => sanitize($_POST['lis_outcome_service_url'] ?? ''),
        'result_sourcedid' => sanitize($_POST['lis_result_sourcedid'] ?? ''),

        'launch_presentation_return_url' => sanitize($_POST['launch_presentation_return_url'] ?? ''),

        'custom_params' => extractCustomParams()
    ];
}

/**
 * Extract custom parameters (problem_id, etc.)
 */
function extractCustomParams() {
    $custom = [];

    foreach ($_POST as $key => $value) {
        if (strpos($key, 'custom_') === 0) {
            $customKey = substr($key, 7); // Remove 'custom_' prefix
            $custom[$customKey] = sanitize($value);
        }
    }

    return $custom;
}

/**
 * Sanitize input
 */
function sanitize($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Create LTI session in database
 */
function createLTISession($params) {
    global $db;

    // Determine user role
    $role = 'student';
    if (stripos($params['roles'], 'Instructor') !== false || stripos($params['roles'], 'Teacher') !== false) {
        $role = 'teacher';
    } elseif (stripos($params['roles'], 'Administrator') !== false) {
        $role = 'admin';
    }

    // Generate secure session token
    $sessionToken = bin2hex(random_bytes(32));

    // Calculate expiration
    $expiresAt = date('Y-m-d H:i:s', time() + SESSION_TIMEOUT);

    // Prepare launch data
    $launchData = json_encode([
        'context_id' => $params['context_id'],
        'context_title' => $params['context_title'],
        'user_given_name' => $params['user_given_name'],
        'user_family_name' => $params['user_family_name'],
        'custom_params' => $params['custom_params'],
        'timestamp' => time()
    ]);

    // Insert or update session
    $query = "INSERT INTO lti_sessions (
        consumer_key,
        resource_link_id,
        moodle_course_id,
        moodle_user_id,
        user_email,
        user_name,
        user_role,
        session_token,
        launch_data,
        outcome_service_url,
        result_sourcedid,
        expires_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        session_token = VALUES(session_token),
        launch_data = VALUES(launch_data),
        outcome_service_url = VALUES(outcome_service_url),
        result_sourcedid = VALUES(result_sourcedid),
        expires_at = VALUES(expires_at),
        last_activity = CURRENT_TIMESTAMP";

    $stmt = $db->prepare($query);

    if (!$stmt) {
        error_log("Failed to prepare session insert: " . $db->error);
        return false;
    }

    $courseId = !empty($params['context_id']) ? intval($params['context_id']) : null;
    $userId = !empty($params['user_id']) ? intval($params['user_id']) : null;

    $stmt->bind_param(
        'ssiissssssss',
        $params['consumer_key'],
        $params['resource_link_id'],
        $courseId,
        $userId,
        $params['user_email'],
        $params['user_name'],
        $role,
        $sessionToken,
        $launchData,
        $params['outcome_service_url'],
        $params['result_sourcedid'],
        $expiresAt
    );

    if (!$stmt->execute()) {
        error_log("Failed to insert session: " . $stmt->error);
        return false;
    }

    $stmt->close();

    return $sessionToken;
}

/**
 * Get or create problem for resource link
 */
function getProblemForResource($resourceLinkId) {
    global $db;

    // Check for custom problem_id parameter
    if (isset($_POST['custom_problem_id'])) {
        return intval($_POST['custom_problem_id']);
    }

    // Check if problem exists for this resource
    $query = "SELECT id FROM problems WHERE moodle_activity_id = ? LIMIT 1";
    $stmt = $db->prepare($query);
    $activityId = intval($resourceLinkId);
    $stmt->bind_param('i', $activityId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $stmt->close();
        return $row['id'];
    }

    $stmt->close();

    // Return default problem (first public problem)
    $query = "SELECT id FROM problems WHERE is_public = 1 ORDER BY id ASC LIMIT 1";
    $result = $db->query($query);

    if ($row = $result->fetch_assoc()) {
        return $row['id'];
    }

    // Return 1 as fallback
    return 1;
}

/**
 * Send grade back to Moodle via LTI Outcome service
 */
function sendGradeToMoodle($sessionToken, $score) {
    // Load session
    $session = db_fetch_one(
        "SELECT * FROM lti_sessions WHERE session_token = ? AND expires_at > NOW()",
        's',
        [$sessionToken]
    );

    if (!$session || empty($session['outcome_service_url']) || empty($session['result_sourcedid'])) {
        return ['success' => false, 'error' => 'Invalid session or no outcome service'];
    }

    // Normalize score to 0-1 range
    $normalizedScore = max(0, min(1, $score / 100));

    // Build LTI Outcome XML
    $messageId = uniqid('msg_', true);
    $xml = buildOutcomeXML($messageId, $session['result_sourcedid'], $normalizedScore);

    // Sign and send request
    $response = sendOAuthRequest(
        $session['outcome_service_url'],
        LTI_CONSUMER_KEY,
        LTI_CONSUMER_SECRET,
        $xml
    );

    // Parse response
    return parseOutcomeResponse($response);
}

/**
 * Build LTI Outcome XML for grade submission
 */
function buildOutcomeXML($messageId, $sourcedId, $score) {
    $xml = '<?xml version="1.0" encoding="UTF-8"?>
    <imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
        <imsx_POXHeader>
            <imsx_POXRequestHeaderInfo>
                <imsx_version>V1.0</imsx_version>
                <imsx_messageIdentifier>' . htmlspecialchars($messageId) . '</imsx_messageIdentifier>
            </imsx_POXRequestHeaderInfo>
        </imsx_POXHeader>
        <imsx_POXBody>
            <replaceResultRequest>
                <resultRecord>
                    <sourcedGUID>
                        <sourcedId>' . htmlspecialchars($sourcedId) . '</sourcedId>
                    </sourcedGUID>
                    <result>
                        <resultScore>
                            <language>en</language>
                            <textString>' . number_format($score, 4) . '</textString>
                        </resultScore>
                    </result>
                </resultRecord>
            </replaceResultRequest>
        </imsx_POXBody>
    </imsx_POXEnvelopeRequest>';

    return $xml;
}

/**
 * Send OAuth signed request
 */
function sendOAuthRequest($url, $consumerKey, $consumerSecret, $body) {
    // Build OAuth parameters
    $oauthParams = [
        'oauth_consumer_key' => $consumerKey,
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => time(),
        'oauth_nonce' => uniqid('nonce_', true),
        'oauth_version' => '1.0',
        'oauth_body_hash' => base64_encode(sha1($body, true))
    ];

    // Build signature
    $baseString = 'POST&' . rawurlencode($url) . '&' . rawurlencode(http_build_query($oauthParams, '', '&', PHP_QUERY_RFC3986));
    $key = rawurlencode($consumerSecret) . '&';
    $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));

    $oauthParams['oauth_signature'] = $signature;

    // Build Authorization header
    $authHeader = 'OAuth ' . implode(', ', array_map(
        function($k, $v) { return $k . '="' . rawurlencode($v) . '"'; },
        array_keys($oauthParams),
        $oauthParams
    ));

    // Send request
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: ' . $authHeader,
        'Content-Type: application/xml',
        'Content-Length: ' . strlen($body)
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['code' => $httpCode, 'body' => $response];
}

/**
 * Parse LTI Outcome response
 */
function parseOutcomeResponse($response) {
    if ($response['code'] !== 200) {
        return ['success' => false, 'error' => 'HTTP ' . $response['code']];
    }

    // Parse XML response
    libxml_use_internal_errors(true);
    $xml = simplexml_load_string($response['body']);

    if ($xml === false) {
        return ['success' => false, 'error' => 'Invalid XML response'];
    }

    // Register namespace
    $xml->registerXPathNamespace('ims', 'http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0');

    // Check for success
    $codeElements = $xml->xpath('//ims:imsx_codeMajor');

    if (!empty($codeElements) && (string)$codeElements[0] === 'success') {
        return ['success' => true];
    }

    // Extract error message
    $descElements = $xml->xpath('//ims:imsx_description');
    $error = !empty($descElements) ? (string)$descElements[0] : 'Unknown error';

    return ['success' => false, 'error' => $error];
}

/**
 * Error response helper
 */
function error_response($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    error_log("LTI Error: $message");
    exit;
}

// Handle different request types
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['lti_message_type'])) {
        // LTI Launch
        handleLTILaunch();
    } elseif (isset($_POST['action']) && $_POST['action'] === 'send_grade') {
        // Grade passback request
        header('Content-Type: application/json');

        $sessionToken = $_POST['session_token'] ?? '';
        $score = floatval($_POST['score'] ?? 0);

        $result = sendGradeToMoodle($sessionToken, $score);
        echo json_encode($result);
        exit;
    } else {
        error_response('Invalid request');
    }
} else {
    // Display information page
    ?>
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>Reflection Mode - LTI Integration</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: #f5f5f5;
            }
            .info-box {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #667eea; }
            code {
                background: #f0f0f0;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
            }
            .config-block {
                background: #f8f9fa;
                padding: 15px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="info-box">
            <h1>🔗 Reflection Mode - Moodle LTI Integration</h1>

            <h2>설정 방법 (Moodle 3.7)</h2>

            <h3>1. LTI 도구 추가</h3>
            <p>사이트 관리 > 플러그인 > 활동 모듈 > External tool > 도구 관리</p>

            <div class="config-block">
                <strong>도구 이름:</strong> Reflection Mode<br>
                <strong>도구 URL:</strong> <code><?php echo getBaseURL(); ?></code><br>
                <strong>Consumer key:</strong> <code><?php echo LTI_CONSUMER_KEY; ?></code><br>
                <strong>Shared secret:</strong> <code><?php echo LTI_CONSUMER_SECRET; ?></code><br>
                <strong>LTI version:</strong> LTI 1.1<br>
                <strong>Grade passback:</strong> 활성화
            </div>

            <h3>2. 코스에 추가</h3>
            <p>코스 편집 > 활동 또는 리소스 추가 > External tool > Reflection Mode 선택</p>

            <h3>3. 사용자 지정 매개변수 (선택사항)</h3>
            <div class="config-block">
                <code>problem_id=1</code> - 특정 문제 지정<br>
                <code>difficulty=medium</code> - 난이도 필터링
            </div>

            <h3>기술 사양</h3>
            <ul>
                <li>LTI 버전: 1.1 / 1.3</li>
                <li>Moodle 버전: 3.7+</li>
                <li>PHP 버전: 7.1.9+</li>
                <li>MySQL 버전: 5.7+</li>
                <li>성적 동기화: 지원</li>
            </ul>

            <h3>문의</h3>
            <p>문제가 발생하면 시스템 관리자에게 문의하세요.</p>
        </div>
    </body>
    </html>
    <?php
    exit;
}
