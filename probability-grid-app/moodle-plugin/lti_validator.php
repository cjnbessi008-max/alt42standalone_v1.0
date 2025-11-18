<?php
/**
 * LTI OAuth Signature Validator
 * Validates OAuth 1.0a signatures from Moodle LTI requests
 */

class LTIValidator {
    private $consumerKey;
    private $sharedSecret;

    public function __construct($ltiConfig) {
        $this->consumerKey = $ltiConfig->consumer_key;
        $this->sharedSecret = $ltiConfig->shared_secret;
    }

    /**
     * Validate LTI OAuth signature
     *
     * @param array $params POST parameters from LTI launch
     * @return bool True if signature is valid
     */
    public function validate($params) {
        // Check required LTI parameters
        if (!$this->hasRequiredParams($params)) {
            return false;
        }

        // Check OAuth consumer key
        if (!isset($params['oauth_consumer_key']) ||
            $params['oauth_consumer_key'] !== $this->consumerKey) {
            return false;
        }

        // Verify OAuth signature
        return $this->verifySignature($params);
    }

    private function hasRequiredParams($params) {
        $required = [
            'lti_message_type',
            'lti_version',
            'resource_link_id',
            'oauth_consumer_key',
            'oauth_signature_method',
            'oauth_signature',
            'oauth_timestamp',
            'oauth_nonce'
        ];

        foreach ($required as $param) {
            if (!isset($params[$param]) || empty($params[$param])) {
                return false;
            }
        }

        return true;
    }

    private function verifySignature($params) {
        // Get the signature from params
        $providedSignature = $params['oauth_signature'];

        // Build base string for signature
        $baseString = $this->buildBaseString($params);

        // Calculate expected signature
        $expectedSignature = $this->calculateSignature(
            $baseString,
            $params['oauth_signature_method']
        );

        // Compare signatures (timing-safe comparison)
        return hash_equals($expectedSignature, $providedSignature);
    }

    private function buildBaseString($params) {
        // Remove signature from params
        $signatureParams = $params;
        unset($signatureParams['oauth_signature']);

        // Get HTTP method
        $method = $_SERVER['REQUEST_METHOD'];

        // Get base URL (without query string)
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            ? 'https://' : 'http://';
        $host = $_SERVER['HTTP_HOST'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $url = $protocol . $host . $path;

        // Normalize parameters
        $normalizedParams = $this->normalizeParams($signatureParams);

        // Build base string: METHOD&URL&PARAMS
        return implode('&', [
            rawurlencode($method),
            rawurlencode($url),
            rawurlencode($normalizedParams)
        ]);
    }

    private function normalizeParams($params) {
        // Sort parameters alphabetically
        ksort($params);

        // Build query string
        $pairs = [];
        foreach ($params as $key => $value) {
            $pairs[] = rawurlencode($key) . '=' . rawurlencode($value);
        }

        return implode('&', $pairs);
    }

    private function calculateSignature($baseString, $method) {
        // Build signing key
        $key = rawurlencode($this->sharedSecret) . '&'; // Token secret is empty for LTI

        // Calculate signature based on method
        switch ($method) {
            case 'HMAC-SHA1':
                $signature = base64_encode(hash_hmac('sha1', $baseString, $key, true));
                break;

            case 'HMAC-SHA256':
                $signature = base64_encode(hash_hmac('sha256', $baseString, $key, true));
                break;

            default:
                $signature = '';
        }

        return $signature;
    }

    /**
     * Check if OAuth timestamp is fresh (within 5 minutes)
     *
     * @param int $timestamp OAuth timestamp
     * @return bool
     */
    private function isTimestampFresh($timestamp) {
        $now = time();
        $diff = abs($now - $timestamp);

        // Allow 5 minutes clock skew
        return $diff < 300;
    }
}
