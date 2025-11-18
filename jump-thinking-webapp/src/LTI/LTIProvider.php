<?php
/**
 * LTI Provider
 * Handles LTI launches from Moodle
 */

namespace JumpThinking\LTI;

use JumpThinking\Database\Connection;

class LTIProvider {
    private $db;
    private $validator;
    private $config;

    public function __construct() {
        $this->db = Connection::getInstance();
        $this->validator = new LTIValidator();
        $this->config = require __DIR__ . '/../../config/lti_config.php';
    }

    /**
     * Handle LTI launch request
     *
     * @param array $params POST parameters
     * @return array Launch data or error
     */
    public function handleLaunch($params) {
        try {
            // Log launch if enabled
            if ($this->config['log_lti_launches']) {
                $this->logLaunch($params);
            }

            // Get consumer key
            $consumerKey = $params['oauth_consumer_key'] ?? '';

            // Retrieve consumer from database
            $consumer = $this->getConsumer($consumerKey);

            if (!$consumer) {
                throw new \Exception('Invalid consumer key');
            }

            if (!$consumer['enabled']) {
                throw new \Exception('Consumer is disabled');
            }

            // Validate LTI request
            if (!$this->validator->validate($params, $consumer['consumer_secret'])) {
                throw new \Exception('Invalid LTI signature');
            }

            // Extract user information
            $userInfo = $this->extractUserInfo($params, $consumer['id']);

            // Get or create user
            $user = $this->getOrCreateUser($userInfo);

            // Create session
            $sessionData = $this->createSession($user, $params);

            return [
                'success' => true,
                'user' => $user,
                'session' => $sessionData,
                'return_url' => $params[$this->config['return_url_param']] ?? null,
                'has_grade_passback' => $this->validator->hasGradePassback($params),
                'grade_passback_data' => [
                    'outcome_url' => $params[$this->config['outcome_service_url_param']] ?? null,
                    'sourcedid' => $params[$this->config['result_sourcedid_param']] ?? null
                ]
            ];

        } catch (\Exception $e) {
            error_log('LTI Launch Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get consumer by key
     */
    private function getConsumer($consumerKey) {
        $sql = "SELECT * FROM lti_consumers WHERE consumer_key = ? LIMIT 1";
        return $this->db->fetchOne($sql, [$consumerKey]);
    }

    /**
     * Extract user information from LTI params
     */
    private function extractUserInfo($params, $consumerId) {
        $role = $this->validator->extractRole($params['roles'] ?? 'Learner');

        return [
            'lti_user_id' => $params['user_id'],
            'consumer_id' => $consumerId,
            'username' => $params['custom_username'] ?? $params['ext_user_username'] ?? null,
            'email' => $params['lis_person_contact_email_primary'] ?? null,
            'full_name' => trim(
                ($params['lis_person_name_full'] ?? '') ?:
                ($params['lis_person_name_given'] ?? '') . ' ' . ($params['lis_person_name_family'] ?? '')
            ),
            'role' => $role
        ];
    }

    /**
     * Get existing user or create new one
     */
    private function getOrCreateUser($userInfo) {
        // Check if user exists
        $sql = "SELECT * FROM users WHERE lti_user_id = ? AND consumer_id = ? LIMIT 1";
        $user = $this->db->fetchOne($sql, [$userInfo['lti_user_id'], $userInfo['consumer_id']]);

        if ($user) {
            // Update user info
            $this->updateUser($user['id'], $userInfo);
            $user['role'] = $userInfo['role']; // Update role
            return $user;
        }

        // Create new user
        $sql = "INSERT INTO users (lti_user_id, consumer_id, username, email, full_name, role)
                VALUES (?, ?, ?, ?, ?, ?)";

        $userId = $this->db->insert($sql, [
            $userInfo['lti_user_id'],
            $userInfo['consumer_id'],
            $userInfo['username'],
            $userInfo['email'],
            $userInfo['full_name'],
            $userInfo['role']
        ]);

        return [
            'id' => $userId,
            'lti_user_id' => $userInfo['lti_user_id'],
            'consumer_id' => $userInfo['consumer_id'],
            'username' => $userInfo['username'],
            'email' => $userInfo['email'],
            'full_name' => $userInfo['full_name'],
            'role' => $userInfo['role']
        ];
    }

    /**
     * Update user information
     */
    private function updateUser($userId, $userInfo) {
        $sql = "UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, updated_at = NOW()
                WHERE id = ?";

        $this->db->execute($sql, [
            $userInfo['username'],
            $userInfo['email'],
            $userInfo['full_name'],
            $userInfo['role'],
            $userId
        ]);
    }

    /**
     * Create session data
     */
    private function createSession($user, $params) {
        // Start PHP session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $sessionToken = bin2hex(random_bytes(32));

        // Store in PHP session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['lti_user_id'] = $user['lti_user_id'];
        $_SESSION['consumer_id'] = $user['consumer_id'];
        $_SESSION['resource_link_id'] = $params['resource_link_id'] ?? null;
        $_SESSION['session_token'] = $sessionToken;
        $_SESSION['context_id'] = $params['context_id'] ?? null;
        $_SESSION['context_title'] = $params['context_title'] ?? null;

        return [
            'session_token' => $sessionToken,
            'resource_link_id' => $params['resource_link_id'] ?? null,
            'context_id' => $params['context_id'] ?? null,
            'context_title' => $params['context_title'] ?? null
        ];
    }

    /**
     * Log LTI launch for debugging
     */
    private function logLaunch($params) {
        if (!$this->config['debug_mode']) {
            return;
        }

        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'consumer_key' => $params['oauth_consumer_key'] ?? 'N/A',
            'user_id' => $params['user_id'] ?? 'N/A',
            'roles' => $params['roles'] ?? 'N/A',
            'resource_link_id' => $params['resource_link_id'] ?? 'N/A',
            'context_id' => $params['context_id'] ?? 'N/A'
        ];

        error_log('LTI Launch: ' . json_encode($logData));
    }

    /**
     * Send grade back to Moodle
     *
     * @param string $outcomeUrl LIS outcome service URL
     * @param string $sourcedId Result sourcedid
     * @param float $score Score (0.0 - 1.0)
     * @param string $consumerKey Consumer key
     * @param string $consumerSecret Consumer secret
     * @return bool Success
     */
    public function sendGrade($outcomeUrl, $sourcedId, $score, $consumerKey, $consumerSecret) {
        $messageId = uniqid();

        $xml = $this->buildGradeXML($messageId, $sourcedId, $score);

        // Sign request
        $oauth = $this->signGradeRequest($outcomeUrl, $consumerKey, $consumerSecret);

        // Send HTTP POST
        $response = $this->sendGradeRequest($outcomeUrl, $xml, $oauth);

        return $this->parseGradeResponse($response);
    }

    /**
     * Build LTI Outcome XML
     */
    private function buildGradeXML($messageId, $sourcedId, $score) {
        $score = max(0, min(1, $score)); // Clamp between 0 and 1

        return <<<XML
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
                        <textString>{$score}</textString>
                    </resultScore>
                </result>
            </resultRecord>
        </replaceResultRequest>
    </imsx_POXBody>
</imsx_POXEnvelopeRequest>
XML;
    }

    /**
     * Sign grade passback request
     */
    private function signGradeRequest($url, $consumerKey, $consumerSecret) {
        $params = [
            'oauth_consumer_key' => $consumerKey,
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_version' => '1.0',
            'oauth_timestamp' => time(),
            'oauth_nonce' => uniqid(),
            'oauth_body_hash' => ''
        ];

        // Build signature
        ksort($params);
        $pairs = [];
        foreach ($params as $key => $value) {
            $pairs[] = rawurlencode($key) . '=' . rawurlencode($value);
        }
        $baseString = 'POST&' . rawurlencode($url) . '&' . rawurlencode(implode('&', $pairs));
        $key = rawurlencode($consumerSecret) . '&';
        $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));
        $params['oauth_signature'] = $signature;

        return $params;
    }

    /**
     * Send grade request via HTTP
     */
    private function sendGradeRequest($url, $xml, $oauth) {
        $authHeader = 'OAuth realm=""';
        foreach ($oauth as $key => $value) {
            $authHeader .= ',' . rawurlencode($key) . '="' . rawurlencode($value) . '"';
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: ' . $authHeader,
            'Content-Type: application/xml'
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        return $response;
    }

    /**
     * Parse grade response
     */
    private function parseGradeResponse($response) {
        if (strpos($response, '<imsx_codeMajor>success</imsx_codeMajor>') !== false) {
            return true;
        }
        error_log('Grade passback failed: ' . $response);
        return false;
    }
}
