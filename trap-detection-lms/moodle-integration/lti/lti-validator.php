<?php
/**
 * LTI OAuth Validator
 * Validates LTI 1.1 OAuth signatures
 * Trap Detection LMS
 */

class LTIValidator {
    private $consumerKey;
    private $consumerSecret;

    public function __construct($config) {
        $this->consumerKey = $config['consumer_key'];
        $this->consumerSecret = $config['consumer_secret'];
    }

    /**
     * Validate LTI request
     */
    public function validateRequest($params) {
        // Check required LTI parameters
        if (!$this->checkRequiredParams($params)) {
            return false;
        }

        // Validate OAuth signature
        if (!$this->validateOAuthSignature($params)) {
            return false;
        }

        // Check timestamp (prevent replay attacks)
        if (!$this->validateTimestamp($params)) {
            return false;
        }

        return true;
    }

    /**
     * Check required LTI parameters
     */
    private function checkRequiredParams($params) {
        $required = [
            'lti_message_type',
            'lti_version',
            'resource_link_id',
            'oauth_consumer_key',
            'oauth_signature_method',
            'oauth_timestamp',
            'oauth_nonce',
            'oauth_signature'
        ];

        foreach ($required as $param) {
            if (!isset($params[$param])) {
                error_log("Missing required LTI parameter: $param");
                return false;
            }
        }

        // Validate LTI version
        if ($params['lti_version'] !== 'LTI-1p0') {
            error_log("Unsupported LTI version: " . $params['lti_version']);
            return false;
        }

        // Validate message type
        if ($params['lti_message_type'] !== 'basic-lti-launch-request') {
            error_log("Unsupported message type: " . $params['lti_message_type']);
            return false;
        }

        return true;
    }

    /**
     * Validate OAuth signature
     */
    private function validateOAuthSignature($params) {
        // Check consumer key
        if ($params['oauth_consumer_key'] !== $this->consumerKey) {
            error_log("Invalid consumer key");
            return false;
        }

        // Only support HMAC-SHA1
        if ($params['oauth_signature_method'] !== 'HMAC-SHA1') {
            error_log("Unsupported signature method: " . $params['oauth_signature_method']);
            return false;
        }

        // Build base string
        $baseString = $this->buildBaseString($params);

        // Calculate expected signature
        $expectedSignature = $this->calculateSignature($baseString);

        // Compare signatures
        if ($params['oauth_signature'] !== $expectedSignature) {
            error_log("OAuth signature mismatch");
            return false;
        }

        return true;
    }

    /**
     * Build OAuth base string
     */
    private function buildBaseString($params) {
        // Remove oauth_signature from parameters
        $signParams = $params;
        unset($signParams['oauth_signature']);

        // Sort parameters
        ksort($signParams);

        // Build parameter string
        $pairs = [];
        foreach ($signParams as $key => $value) {
            $pairs[] = $this->urlEncode($key) . '=' . $this->urlEncode($value);
        }
        $paramString = implode('&', $pairs);

        // Get request URL
        $url = $this->getCurrentUrl();

        // Build base string
        $method = $_SERVER['REQUEST_METHOD'];
        $baseString = implode('&', [
            strtoupper($method),
            $this->urlEncode($url),
            $this->urlEncode($paramString)
        ]);

        return $baseString;
    }

    /**
     * Calculate OAuth signature
     */
    private function calculateSignature($baseString) {
        $key = $this->urlEncode($this->consumerSecret) . '&'; // LTI 1.1 doesn't use token secret
        $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));
        return $signature;
    }

    /**
     * Get current URL
     */
    private function getCurrentUrl() {
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        return $protocol . '://' . $host . $path;
    }

    /**
     * URL encode according to OAuth spec
     */
    private function urlEncode($value) {
        return str_replace('%7E', '~', rawurlencode($value));
    }

    /**
     * Validate timestamp (prevent replay attacks)
     */
    private function validateTimestamp($params) {
        $timestamp = intval($params['oauth_timestamp']);
        $currentTime = time();
        $timeDiff = abs($currentTime - $timestamp);

        // Allow 5 minute window
        if ($timeDiff > 300) {
            error_log("OAuth timestamp too old or in future: $timeDiff seconds");
            return false;
        }

        return true;
    }

    /**
     * Validate nonce (prevent replay attacks)
     * In production, store nonces in database/cache
     */
    private function validateNonce($nonce, $timestamp) {
        // For MVP, we'll just check timestamp
        // In production, implement proper nonce storage and checking
        return true;
    }
}
