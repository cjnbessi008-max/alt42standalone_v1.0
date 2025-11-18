<?php
/**
 * LTI 1.1/1.3 Handler for Moodle Integration
 * Compatible with PHP 7.1.9 and Moodle 3.7
 *
 * @package    AI_Education_Pipeline
 * @subpackage LTI_Integration
 * @copyright  2025 KAIST Touch Math Academy
 * @license    MIT
 */

namespace AIPipeline\LTI;

class LTIHandler
{
    private $consumer_key;
    private $shared_secret;
    private $db;
    private $config;

    /**
     * Constructor
     * @param array $config Configuration array with consumer_key and shared_secret
     */
    public function __construct(array $config)
    {
        $this->consumer_key = $config['consumer_key'] ?? '';
        $this->shared_secret = $config['shared_secret'] ?? '';
        $this->config = $config;
    }

    /**
     * Handle LTI launch request from Moodle
     * @param array $post_data POST data from LTI launch
     * @return array Result with success status and user data
     */
    public function handleLaunchRequest(array $post_data): array
    {
        // Step 1: Validate required LTI parameters
        if (!$this->validateRequiredParameters($post_data)) {
            return [
                'success' => false,
                'error' => 'Missing required LTI parameters',
                'code' => 'INVALID_PARAMS'
            ];
        }

        // Step 2: Verify OAuth signature
        if (!$this->verifyOAuthSignature($post_data)) {
            return [
                'success' => false,
                'error' => 'OAuth signature verification failed',
                'code' => 'INVALID_SIGNATURE'
            ];
        }

        // Step 3: Check nonce to prevent replay attacks
        if (!$this->checkNonce($post_data['oauth_nonce'] ?? '')) {
            return [
                'success' => false,
                'error' => 'Nonce already used or expired',
                'code' => 'REPLAY_ATTACK'
            ];
        }

        // Step 4: Extract user information
        $user_data = $this->extractUserData($post_data);

        // Step 5: Create or update user session
        $session_result = $this->createUserSession($user_data);

        return [
            'success' => true,
            'user' => $user_data,
            'session_id' => $session_result['session_id'],
            'redirect_url' => $this->getModuleUrl($post_data)
        ];
    }

    /**
     * Validate required LTI parameters
     * @param array $params POST parameters
     * @return bool
     */
    private function validateRequiredParameters(array $params): bool
    {
        $required = [
            'lti_message_type',
            'lti_version',
            'resource_link_id',
            'user_id',
            'oauth_consumer_key',
            'oauth_signature_method',
            'oauth_timestamp',
            'oauth_nonce',
            'oauth_signature'
        ];

        foreach ($required as $param) {
            if (empty($params[$param])) {
                error_log("LTI: Missing required parameter: {$param}");
                return false;
            }
        }

        // Validate message type
        if ($params['lti_message_type'] !== 'basic-lti-launch-request') {
            error_log("LTI: Invalid message type: {$params['lti_message_type']}");
            return false;
        }

        // Validate LTI version
        if (!in_array($params['lti_version'], ['LTI-1p0', 'LTI-2p0'])) {
            error_log("LTI: Unsupported LTI version: {$params['lti_version']}");
            return false;
        }

        return true;
    }

    /**
     * Verify OAuth 1.0 signature
     * @param array $params POST parameters including signature
     * @return bool
     */
    private function verifyOAuthSignature(array $params): bool
    {
        // Check consumer key
        if ($params['oauth_consumer_key'] !== $this->consumer_key) {
            error_log("LTI: Invalid consumer key");
            return false;
        }

        // Check timestamp (must be within 5 minutes)
        $timestamp = intval($params['oauth_timestamp']);
        $current_time = time();
        if (abs($current_time - $timestamp) > 300) {
            error_log("LTI: Timestamp too old or in future. Diff: " . abs($current_time - $timestamp));
            return false;
        }

        // Build base string for signature
        $base_string = $this->buildOAuthBaseString($params);

        // Calculate expected signature
        $expected_signature = $this->calculateSignature($base_string);

        // Compare signatures
        $provided_signature = $params['oauth_signature'];

        if (!hash_equals($expected_signature, $provided_signature)) {
            error_log("LTI: Signature mismatch");
            error_log("Expected: {$expected_signature}");
            error_log("Provided: {$provided_signature}");
            return false;
        }

        return true;
    }

    /**
     * Build OAuth base string for signature calculation
     * @param array $params Parameters to sign
     * @return string
     */
    private function buildOAuthBaseString(array $params): string
    {
        // Remove signature from params
        $sign_params = $params;
        unset($sign_params['oauth_signature']);

        // Sort parameters alphabetically
        ksort($sign_params);

        // Encode parameters
        $encoded_params = [];
        foreach ($sign_params as $key => $value) {
            $encoded_params[] = rawurlencode($key) . '=' . rawurlencode($value);
        }
        $param_string = implode('&', $encoded_params);

        // Get current URL
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $path = strtok($_SERVER['REQUEST_URI'] ?? '/', '?');
        $url = $protocol . '://' . $host . $path;

        // Build base string: METHOD&URL&PARAMS
        $base_string = 'POST&' . rawurlencode($url) . '&' . rawurlencode($param_string);

        return $base_string;
    }

    /**
     * Calculate HMAC-SHA1 signature
     * @param string $base_string OAuth base string
     * @return string Base64 encoded signature
     */
    private function calculateSignature(string $base_string): string
    {
        $key = rawurlencode($this->shared_secret) . '&'; // & is for token secret (empty in LTI)
        return base64_encode(hash_hmac('sha1', $base_string, $key, true));
    }

    /**
     * Check nonce to prevent replay attacks
     * @param string $nonce Nonce value
     * @return bool
     */
    private function checkNonce(string $nonce): bool
    {
        // In production, use Redis or database
        // For now, use file-based cache
        $cache_file = sys_get_temp_dir() . '/lti_nonces.json';
        $nonces = [];

        if (file_exists($cache_file)) {
            $nonces = json_decode(file_get_contents($cache_file), true) ?? [];
        }

        // Remove expired nonces (older than 5 minutes)
        $current_time = time();
        $nonces = array_filter($nonces, function ($timestamp) use ($current_time) {
            return ($current_time - $timestamp) < 300;
        });

        // Check if nonce already exists
        if (isset($nonces[$nonce])) {
            return false;
        }

        // Store nonce
        $nonces[$nonce] = $current_time;
        file_put_contents($cache_file, json_encode($nonces));

        return true;
    }

    /**
     * Extract user data from LTI parameters
     * @param array $params LTI parameters
     * @return array User data
     */
    private function extractUserData(array $params): array
    {
        return [
            'lti_user_id' => $params['user_id'],
            'email' => $params['lis_person_contact_email_primary'] ?? '',
            'first_name' => $params['lis_person_name_given'] ?? '',
            'last_name' => $params['lis_person_name_family'] ?? '',
            'full_name' => $params['lis_person_name_full'] ?? '',
            'roles' => explode(',', $params['roles'] ?? ''),
            'context_id' => $params['context_id'] ?? '',
            'context_label' => $params['context_label'] ?? '',
            'context_title' => $params['context_title'] ?? '',
            'resource_link_id' => $params['resource_link_id'],
            'resource_link_title' => $params['resource_link_title'] ?? '',
            'lis_outcome_service_url' => $params['lis_outcome_service_url'] ?? '',
            'lis_result_sourcedid' => $params['lis_result_sourcedid'] ?? ''
        ];
    }

    /**
     * Create user session
     * @param array $user_data User data from LTI
     * @return array Session result
     */
    private function createUserSession(array $user_data): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION['lti_user_id'] = $user_data['lti_user_id'];
        $_SESSION['lti_context_id'] = $user_data['context_id'];
        $_SESSION['lti_resource_link_id'] = $user_data['resource_link_id'];
        $_SESSION['user_email'] = $user_data['email'];
        $_SESSION['user_name'] = $user_data['full_name'];
        $_SESSION['user_roles'] = $user_data['roles'];
        $_SESSION['lti_outcome_service_url'] = $user_data['lis_outcome_service_url'];
        $_SESSION['lti_result_sourcedid'] = $user_data['lis_result_sourcedid'];

        return [
            'session_id' => session_id(),
            'user_id' => $user_data['lti_user_id']
        ];
    }

    /**
     * Get module URL from LTI parameters
     * @param array $params LTI parameters
     * @return string Module URL
     */
    private function getModuleUrl(array $params): string
    {
        // Extract custom module ID if provided
        $module_id = $params['custom_module_id'] ?? null;

        if ($module_id) {
            return "/module/{$module_id}";
        }

        // Default to resource link ID
        return "/module/" . urlencode($params['resource_link_id']);
    }

    /**
     * Send grade back to Moodle
     * @param float $score Score between 0.0 and 1.0
     * @return array Result
     */
    public function sendGradePassback(float $score): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $outcome_url = $_SESSION['lti_outcome_service_url'] ?? '';
        $sourcedid = $_SESSION['lti_result_sourcedid'] ?? '';

        if (empty($outcome_url) || empty($sourcedid)) {
            return [
                'success' => false,
                'error' => 'Grade passback not supported for this launch'
            ];
        }

        // Build XML request
        $message_id = uniqid('grade_', true);
        $xml = $this->buildGradePassbackXML($message_id, $sourcedid, $score);

        // Sign and send request
        $response = $this->sendOAuthRequest($outcome_url, $xml);

        return $this->parseGradePassbackResponse($response);
    }

    /**
     * Build XML for grade passback
     * @param string $message_id Unique message ID
     * @param string $sourcedid Result sourcedid
     * @param float $score Score (0.0 to 1.0)
     * @return string XML string
     */
    private function buildGradePassbackXML(string $message_id, string $sourcedid, float $score): string
    {
        $score = max(0.0, min(1.0, $score)); // Clamp between 0 and 1

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
    <imsx_POXHeader>
        <imsx_POXRequestHeaderInfo>
            <imsx_version>V1.0</imsx_version>
            <imsx_messageIdentifier>{$message_id}</imsx_messageIdentifier>
        </imsx_POXRequestHeaderInfo>
    </imsx_POXHeader>
    <imsx_POXBody>
        <replaceResultRequest>
            <resultRecord>
                <sourcedGUID>
                    <sourcedId>{$sourcedid}</sourcedId>
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
     * Send OAuth signed POST request
     * @param string $url Target URL
     * @param string $body Request body
     * @return string Response
     */
    private function sendOAuthRequest(string $url, string $body): string
    {
        $oauth_params = [
            'oauth_consumer_key' => $this->consumer_key,
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp' => time(),
            'oauth_nonce' => uniqid('nonce_', true),
            'oauth_version' => '1.0',
            'oauth_body_hash' => base64_encode(sha1($body, true))
        ];

        // Calculate signature
        $base_string = $this->buildOAuthBaseStringForPost($url, $oauth_params);
        $oauth_params['oauth_signature'] = $this->calculateSignature($base_string);

        // Build Authorization header
        $auth_header = 'OAuth ' . implode(', ', array_map(function ($key, $value) {
            return rawurlencode($key) . '="' . rawurlencode($value) . '"';
        }, array_keys($oauth_params), $oauth_params));

        // Send request
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_HTTPHEADER => [
                'Authorization: ' . $auth_header,
                'Content-Type: application/xml'
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => true
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("LTI Grade Passback Error: {$error}");
            return '';
        }

        return $response;
    }

    /**
     * Build OAuth base string for POST request
     * @param string $url Target URL
     * @param array $params OAuth parameters
     * @return string Base string
     */
    private function buildOAuthBaseStringForPost(string $url, array $params): string
    {
        ksort($params);
        $encoded_params = [];
        foreach ($params as $key => $value) {
            $encoded_params[] = rawurlencode($key) . '=' . rawurlencode($value);
        }
        $param_string = implode('&', $encoded_params);

        return 'POST&' . rawurlencode($url) . '&' . rawurlencode($param_string);
    }

    /**
     * Parse grade passback response
     * @param string $response XML response
     * @return array Result
     */
    private function parseGradePassbackResponse(string $response): array
    {
        if (empty($response)) {
            return ['success' => false, 'error' => 'Empty response from outcome service'];
        }

        libxml_use_internal_errors(true);
        $xml = simplexml_load_string($response);

        if ($xml === false) {
            return ['success' => false, 'error' => 'Invalid XML response'];
        }

        $xml->registerXPathNamespace('ns', 'http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0');
        $status = $xml->xpath('//ns:imsx_codeMajor');

        if (!empty($status) && (string)$status[0] === 'success') {
            return ['success' => true];
        }

        return [
            'success' => false,
            'error' => 'Grade passback failed',
            'response' => $response
        ];
    }
}
