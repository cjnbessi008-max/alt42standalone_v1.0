<?php
/**
 * LTI OAuth Signature Validator
 * Validates LTI launch requests from Moodle
 */

namespace JumpThinking\LTI;

class LTIValidator {
    private $config;
    private $consumerSecret;

    public function __construct() {
        $this->config = require __DIR__ . '/../../config/lti_config.php';
    }

    /**
     * Validate LTI launch request
     *
     * @param array $params Request parameters
     * @param string $consumerSecret Consumer secret from database
     * @return bool True if valid
     */
    public function validate($params, $consumerSecret) {
        $this->consumerSecret = $consumerSecret;

        // Check required parameters
        if (!$this->checkRequiredParams($params)) {
            return false;
        }

        // Verify LTI version
        if ($params['lti_version'] !== $this->config['version']) {
            return false;
        }

        // Verify OAuth signature
        if (!$this->verifyOAuthSignature($params)) {
            return false;
        }

        return true;
    }

    /**
     * Check if all required parameters are present
     */
    private function checkRequiredParams($params) {
        foreach ($this->config['required_params'] as $param) {
            if (!isset($params[$param]) || empty($params[$param])) {
                error_log("Missing required LTI parameter: $param");
                return false;
            }
        }
        return true;
    }

    /**
     * Verify OAuth 1.0 signature
     */
    private function verifyOAuthSignature($params) {
        // Extract signature from params
        $receivedSignature = isset($params['oauth_signature']) ? $params['oauth_signature'] : '';

        if (empty($receivedSignature)) {
            error_log('OAuth signature missing');
            return false;
        }

        // Build base string
        $baseString = $this->buildOAuthBaseString($params);

        // Calculate expected signature
        $expectedSignature = $this->calculateSignature($baseString);

        // Compare signatures
        $isValid = $this->secureCompare($receivedSignature, $expectedSignature);

        if (!$isValid && $this->config['debug_mode']) {
            error_log('OAuth signature mismatch');
            error_log('Expected: ' . $expectedSignature);
            error_log('Received: ' . $receivedSignature);
            error_log('Base String: ' . $baseString);
        }

        return $isValid;
    }

    /**
     * Build OAuth base string for signature
     */
    private function buildOAuthBaseString($params) {
        // Remove oauth_signature from parameters
        $signatureParams = $params;
        unset($signatureParams['oauth_signature']);

        // Sort parameters
        ksort($signatureParams);

        // Build query string
        $pairs = [];
        foreach ($signatureParams as $key => $value) {
            $pairs[] = rawurlencode($key) . '=' . rawurlencode($value);
        }
        $queryString = implode('&', $pairs);

        // Get current URL
        $url = $this->getCurrentUrl();

        // Build base string: METHOD&URL&PARAMS
        $baseString = 'POST&' . rawurlencode($url) . '&' . rawurlencode($queryString);

        return $baseString;
    }

    /**
     * Calculate HMAC-SHA1 signature
     */
    private function calculateSignature($baseString) {
        $key = rawurlencode($this->consumerSecret) . '&'; // & for token secret (empty)
        $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));
        return $signature;
    }

    /**
     * Get current URL without query string
     */
    private function getCurrentUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        return $protocol . '://' . $host . $path;
    }

    /**
     * Timing-safe string comparison
     */
    private function secureCompare($a, $b) {
        if (function_exists('hash_equals')) {
            return hash_equals($a, $b);
        }

        // Fallback for PHP < 5.6
        if (strlen($a) !== strlen($b)) {
            return false;
        }

        $result = 0;
        for ($i = 0; $i < strlen($a); $i++) {
            $result |= ord($a[$i]) ^ ord($b[$i]);
        }

        return $result === 0;
    }

    /**
     * Extract user role from LTI roles parameter
     */
    public function extractRole($rolesString) {
        $roles = explode(',', $rolesString);

        foreach ($roles as $role) {
            $role = trim($role);
            // Check full URN format
            if (strpos($role, 'urn:lti:role:ims/lis/') !== false) {
                $roleName = substr($role, strrpos($role, '/') + 1);
            } else {
                $roleName = $role;
            }

            // Map to internal role
            foreach ($this->config['supported_roles'] as $ltiRole => $internalRole) {
                if (stripos($roleName, $ltiRole) !== false) {
                    return $internalRole;
                }
            }
        }

        // Default to student
        return 'student';
    }

    /**
     * Check if grade passback is enabled
     */
    public function hasGradePassback($params) {
        return $this->config['enable_grade_passback']
            && isset($params[$this->config['outcome_service_url_param']])
            && isset($params[$this->config['result_sourcedid_param']]);
    }
}
