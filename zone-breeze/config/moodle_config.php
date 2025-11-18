<?php
/**
 * Zone Breeze - Moodle Configuration
 *
 * Moodle LMS integration settings
 */

// Moodle connection settings
define('MOODLE_URL', 'https://your-moodle-site.com'); // Change to your Moodle URL
define('MOODLE_VERSION', '3.7');

// Moodle database settings (if direct DB access is needed)
define('MOODLE_DB_HOST', 'localhost');
define('MOODLE_DB_NAME', 'moodle');
define('MOODLE_DB_USER', 'moodle_user');
define('MOODLE_DB_PASS', 'moodle_password'); // Change this
define('MOODLE_DB_PREFIX', 'mdl_'); // Default Moodle table prefix

// Web service settings
define('MOODLE_WS_TOKEN', 'your_moodle_webservice_token'); // Get from Moodle admin
define('MOODLE_WS_FUNCTION', 'core_course_get_courses');
define('MOODLE_WS_FORMAT', 'json');

// Zone Breeze activity module settings
define('ZONE_BREEZE_MODULE_NAME', 'zone_breeze');
define('ZONE_BREEZE_COMPONENT', 'mod_zone_breeze');

// Session settings
define('SESSION_TIMEOUT', 3600); // 1 hour
define('SESSION_NAME', 'ZONE_BREEZE_SESS');

// Security settings
define('ENABLE_CORS', true);
define('ALLOWED_ORIGINS', ['https://your-moodle-site.com']); // Add your Moodle domain
define('ENABLE_CSRF_PROTECTION', true);

/**
 * Get Moodle database connection
 *
 * @return PDO Moodle database connection
 */
function getMoodleDbConnection() {
    static $pdo = null;

    if ($pdo === null) {
        try {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                MOODLE_DB_HOST,
                MOODLE_DB_NAME
            );

            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];

            $pdo = new PDO($dsn, MOODLE_DB_USER, MOODLE_DB_PASS, $options);
        } catch (PDOException $e) {
            error_log('Moodle DB connection failed: ' . $e->getMessage());
            throw new PDOException('Moodle database connection failed');
        }
    }

    return $pdo;
}

/**
 * Call Moodle web service
 *
 * @param string $function Web service function name
 * @param array $params Function parameters
 * @return array Response data
 */
function callMoodleWebService($function, $params = []) {
    $url = MOODLE_URL . '/webservice/rest/server.php';

    $requestParams = array_merge([
        'wstoken' => MOODLE_WS_TOKEN,
        'wsfunction' => $function,
        'moodlewsrestformat' => MOODLE_WS_FORMAT
    ], $params);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception('Moodle web service error: ' . $error);
    }

    curl_close($ch);

    if ($httpCode !== 200) {
        throw new Exception('Moodle web service returned HTTP ' . $httpCode);
    }

    $data = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON response from Moodle');
    }

    if (isset($data['exception'])) {
        throw new Exception('Moodle error: ' . $data['message']);
    }

    return $data;
}

/**
 * Validate Moodle user session
 *
 * @param string $sessionKey Session key from Moodle
 * @return array|false User data if valid, false otherwise
 */
function validateMoodleSession($sessionKey) {
    if (empty($sessionKey)) {
        return false;
    }

    try {
        $pdo = getMoodleDbConnection();
        $prefix = MOODLE_DB_PREFIX;

        $sql = "SELECT u.id, u.username, u.firstname, u.lastname, u.email
                FROM {$prefix}sessions s
                JOIN {$prefix}user u ON s.userid = u.id
                WHERE s.sid = :sid
                AND s.timemodified > :timeout";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'sid' => $sessionKey,
            'timeout' => time() - SESSION_TIMEOUT
        ]);

        return $stmt->fetch();
    } catch (PDOException $e) {
        error_log('Session validation error: ' . $e->getMessage());
        return false;
    }
}
