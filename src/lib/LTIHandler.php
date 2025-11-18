<?php
/**
 * LTI 1.1 Handler for Moodle Integration
 * Based on IMS LTI specification
 */

class LTIHandler {
    private $db;
    private $consumer;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Validate LTI launch request
     */
    public function validateLaunch($params) {
        Logger::info('LTI Launch Request Received', ['params_count' => count($params)]);

        // Required LTI parameters
        $required = [
            'lti_message_type',
            'lti_version',
            'resource_link_id',
            'oauth_consumer_key'
        ];

        foreach ($required as $param) {
            if (!isset($params[$param])) {
                Logger::error('Missing required LTI parameter: ' . $param);
                return false;
            }
        }

        // Validate message type
        if ($params['lti_message_type'] !== 'basic-lti-launch-request') {
            Logger::error('Invalid LTI message type: ' . $params['lti_message_type']);
            return false;
        }

        // Validate LTI version
        if ($params['lti_version'] !== 'LTI-1p0') {
            Logger::error('Unsupported LTI version: ' . $params['lti_version']);
            return false;
        }

        // Validate OAuth signature
        if (!$this->validateOAuthSignature($params)) {
            Logger::error('OAuth signature validation failed');
            return false;
        }

        Logger::info('LTI Launch validation successful');
        return true;
    }

    /**
     * Validate OAuth 1.0 signature
     */
    private function validateOAuthSignature($params) {
        // Get consumer key
        $consumerKey = $params['oauth_consumer_key'];

        // Load consumer from database
        $sql = "SELECT * FROM lti_consumers WHERE consumer_key = :key AND enabled = 1";
        $this->consumer = $this->db->fetchOne($sql, [':key' => $consumerKey]);

        if (!$this->consumer) {
            Logger::error('Invalid consumer key: ' . $consumerKey);
            return false;
        }

        // Build base string for OAuth signature
        $method = $_SERVER['REQUEST_METHOD'];
        $url = $this->getCurrentUrl();
        $normalizedParams = $this->normalizeParams($params);

        $baseString = implode('&', [
            strtoupper($method),
            rawurlencode($url),
            rawurlencode($normalizedParams)
        ]);

        // Calculate signature
        $secret = $this->consumer['consumer_secret'] . '&'; // OAuth 1.0 format
        $expectedSignature = base64_encode(hash_hmac('sha1', $baseString, $secret, true));

        // Compare signatures
        $providedSignature = $params['oauth_signature'];

        if ($expectedSignature !== $providedSignature) {
            Logger::error('Signature mismatch', [
                'expected' => $expectedSignature,
                'provided' => $providedSignature
            ]);
            return false;
        }

        return true;
    }

    /**
     * Get current URL (for OAuth signature)
     */
    private function getCurrentUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        return $protocol . '://' . $host . $path;
    }

    /**
     * Normalize OAuth parameters
     */
    private function normalizeParams($params) {
        // Remove oauth_signature from params
        unset($params['oauth_signature']);

        // Sort parameters
        ksort($params);

        // Build query string
        $pairs = [];
        foreach ($params as $key => $value) {
            $pairs[] = rawurlencode($key) . '=' . rawurlencode($value);
        }

        return implode('&', $pairs);
    }

    /**
     * Process LTI launch and create/update user
     */
    public function processLaunch($params) {
        // Extract user information
        $ltiUserId = $params['user_id'] ?? 'unknown';
        $username = $params['lis_person_name_given'] ?? $params['lis_person_name_family'] ?? 'User';
        $fullName = $params['lis_person_name_full'] ?? $username;
        $email = $params['lis_person_contact_email_primary'] ?? '';
        $role = $this->extractRole($params);

        // Create or update user
        $user = $this->createOrUpdateUser([
            'lti_user_id' => $ltiUserId,
            'consumer_id' => $this->consumer['id'],
            'username' => $username,
            'full_name' => $fullName,
            'email' => $email,
            'role' => $role
        ]);

        // Create LTI session
        $sessionId = $this->createSession([
            'consumer_id' => $this->consumer['id'],
            'user_id' => $user['id'],
            'resource_link_id' => $params['resource_link_id'] ?? null,
            'context_id' => $params['context_id'] ?? null,
            'lis_result_sourcedid' => $params['lis_result_sourcedid'] ?? null,
            'lis_outcome_service_url' => $params['lis_outcome_service_url'] ?? null,
            'custom_params' => json_encode($params)
        ]);

        Logger::info('LTI launch processed successfully', [
            'user_id' => $user['id'],
            'role' => $role,
            'session_id' => $sessionId
        ]);

        return [
            'user' => $user,
            'session_id' => $sessionId
        ];
    }

    /**
     * Extract user role from LTI roles
     */
    private function extractRole($params) {
        $roles = $params['roles'] ?? '';
        $rolesArray = explode(',', $roles);

        foreach ($rolesArray as $role) {
            $role = trim(strtolower($role));
            if (strpos($role, 'instructor') !== false || strpos($role, 'teacher') !== false) {
                return 'teacher';
            }
            if (strpos($role, 'administrator') !== false) {
                return 'admin';
            }
        }

        return 'student';
    }

    /**
     * Create or update user
     */
    private function createOrUpdateUser($data) {
        $sql = "SELECT * FROM users WHERE lti_user_id = :lti_user_id AND consumer_id = :consumer_id";
        $user = $this->db->fetchOne($sql, [
            ':lti_user_id' => $data['lti_user_id'],
            ':consumer_id' => $data['consumer_id']
        ]);

        if ($user) {
            // Update existing user
            $this->db->update('users', [
                'username' => $data['username'],
                'full_name' => $data['full_name'],
                'email' => $data['email'],
                'role' => $data['role'],
                'last_login' => date('Y-m-d H:i:s')
            ], 'id = :id', [':id' => $user['id']]);

            $user['last_login'] = date('Y-m-d H:i:s');
            return $user;
        } else {
            // Create new user
            $userId = $this->db->insert('users', $data);
            return $this->db->fetchOne("SELECT * FROM users WHERE id = :id", [':id' => $userId]);
        }
    }

    /**
     * Create LTI session
     */
    private function createSession($data) {
        $sessionId = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);

        $this->db->insert('lti_sessions', array_merge($data, [
            'session_id' => $sessionId,
            'expires_at' => $expiresAt
        ]));

        return $sessionId;
    }

    /**
     * Send grade back to Moodle
     */
    public function sendGrade($sessionId, $score, $maxScore = 1.0) {
        $sql = "SELECT * FROM lti_sessions WHERE session_id = :session_id";
        $session = $this->db->fetchOne($sql, [':session_id' => $sessionId]);

        if (!$session || !$session['lis_outcome_service_url']) {
            Logger::warning('Cannot send grade: missing session or outcome service URL');
            return false;
        }

        // Normalize score (0.0 to 1.0)
        $normalizedScore = $score / $maxScore;

        // Build LTI Outcome XML
        $messageId = uniqid();
        $sourcedId = $session['lis_result_sourcedid'];

        $xml = <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
    <imsx_POXHeader>
        <imsx_POXRequestHeaderInfo>
            <imsx_version>V1.0</imsx_version>
            <imsx_messageIdentifier>{$messageId}</imsx_messageIdentifier>
        </imsx_POXRequestHeaderInfo>
    </imsx_POXHeader>
    <imsx_POXBody>
        <replaceResultRequest>
            <resultRecord>
                <sourcedGUID>
                    <sourcedId>{$sourcedId}</sourcedId>
                </sourcedGUID>
                <result>
                    <resultScore>
                        <language>en</language>
                        <textString>{$normalizedScore}</textString>
                    </resultScore>
                </result>
            </resultRecord>
        </replaceResultRequest>
    </imsx_POXBody>
</imsx_POXEnvelopeRequest>
XML;

        // Get consumer for OAuth signing
        $consumer = $this->db->fetchOne(
            "SELECT * FROM lti_consumers WHERE id = :id",
            [':id' => $session['consumer_id']]
        );

        // Send OAuth-signed request
        $result = $this->sendOAuthRequest(
            $session['lis_outcome_service_url'],
            $consumer['consumer_key'],
            $consumer['consumer_secret'],
            $xml
        );

        Logger::info('Grade sent to Moodle', [
            'session_id' => $sessionId,
            'score' => $normalizedScore,
            'result' => $result
        ]);

        return $result;
    }

    /**
     * Send OAuth-signed HTTP request
     */
    private function sendOAuthRequest($url, $consumerKey, $consumerSecret, $body) {
        $oauthParams = [
            'oauth_consumer_key' => $consumerKey,
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp' => time(),
            'oauth_nonce' => uniqid(),
            'oauth_version' => '1.0',
            'oauth_body_hash' => base64_encode(sha1($body, true))
        ];

        // Calculate signature
        $baseString = 'POST&' . rawurlencode($url) . '&' . rawurlencode(http_build_query($oauthParams));
        $secret = rawurlencode($consumerSecret) . '&';
        $signature = base64_encode(hash_hmac('sha1', $baseString, $secret, true));
        $oauthParams['oauth_signature'] = $signature;

        // Build Authorization header
        $authHeader = 'OAuth ' . implode(', ', array_map(function($k, $v) {
            return $k . '="' . rawurlencode($v) . '"';
        }, array_keys($oauthParams), $oauthParams));

        // Send request
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Authorization: ' . $authHeader,
                'Content-Type: application/xml',
                'Content-Length: ' . strlen($body)
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return $httpCode === 200;
    }
}
