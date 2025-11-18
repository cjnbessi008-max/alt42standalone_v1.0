<?php
/**
 * LTI Integration Test Suite
 * Tests for Moodle LTI integration
 *
 * Run: php tests/LTIIntegrationTest.php
 *
 * @package AI_Education_Pipeline
 * @copyright 2025 KAIST Touch Math Academy
 */

require_once __DIR__ . '/../api/lti/LTIHandler.php';
require_once __DIR__ . '/../lib/MoodleAPIClient.php';

use AIPipeline\LTI\LTIHandler;
use AIPipeline\Moodle\MoodleAPIClient;

class LTIIntegrationTest
{
    private $test_config;
    private $passed = 0;
    private $failed = 0;

    public function __construct()
    {
        $this->test_config = [
            'consumer_key' => 'test_consumer_key',
            'shared_secret' => 'test_shared_secret'
        ];
    }

    /**
     * Run all tests
     */
    public function runAll(): void
    {
        echo "=================================\n";
        echo "LTI Integration Test Suite\n";
        echo "=================================\n\n";

        $this->testOAuthSignatureGeneration();
        $this->testRequiredParameterValidation();
        $this->testUserDataExtraction();
        $this->testNonceReplayPrevention();
        $this->testGradePassbackXMLGeneration();
        $this->testMoodleAPIConnection();
        $this->testFlattenParams();

        echo "\n=================================\n";
        echo "Results: {$this->passed} passed, {$this->failed} failed\n";
        echo "=================================\n";

        exit($this->failed > 0 ? 1 : 0);
    }

    /**
     * Test OAuth signature generation
     */
    private function testOAuthSignatureGeneration(): void
    {
        echo "Test: OAuth Signature Generation... ";

        $handler = new LTIHandler($this->test_config);

        // Create test parameters
        $params = [
            'lti_message_type' => 'basic-lti-launch-request',
            'lti_version' => 'LTI-1p0',
            'resource_link_id' => '123456',
            'user_id' => 'test_user',
            'oauth_consumer_key' => 'test_consumer_key',
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp' => time(),
            'oauth_nonce' => uniqid('test_', true)
        ];

        // Use reflection to test private method
        $reflection = new ReflectionClass($handler);
        $method = $reflection->getMethod('buildOAuthBaseString');
        $method->setAccessible(true);

        $base_string = $method->invoke($handler, $params);

        if (strpos($base_string, 'POST&') === 0) {
            $this->pass();
        } else {
            $this->fail("Base string doesn't start with POST&");
        }
    }

    /**
     * Test required parameter validation
     */
    private function testRequiredParameterValidation(): void
    {
        echo "Test: Required Parameter Validation... ";

        $handler = new LTIHandler($this->test_config);

        // Test with missing parameters
        $invalid_params = [
            'lti_message_type' => 'basic-lti-launch-request'
            // Missing other required params
        ];

        $result = $handler->handleLaunchRequest($invalid_params);

        if (!$result['success'] && $result['code'] === 'INVALID_PARAMS') {
            $this->pass();
        } else {
            $this->fail("Should reject request with missing parameters");
        }
    }

    /**
     * Test user data extraction
     */
    private function testUserDataExtraction(): void
    {
        echo "Test: User Data Extraction... ";

        $handler = new LTIHandler($this->test_config);

        $lti_params = [
            'user_id' => 'student123',
            'lis_person_contact_email_primary' => 'student@kaist.ac.kr',
            'lis_person_name_given' => 'John',
            'lis_person_name_family' => 'Doe',
            'lis_person_name_full' => 'John Doe',
            'roles' => 'Learner,Student',
            'context_id' => 'course_456',
            'resource_link_id' => 'module_789'
        ];

        $reflection = new ReflectionClass($handler);
        $method = $reflection->getMethod('extractUserData');
        $method->setAccessible(true);

        $user_data = $method->invoke($handler, $lti_params);

        if ($user_data['lti_user_id'] === 'student123' &&
            $user_data['email'] === 'student@kaist.ac.kr' &&
            count($user_data['roles']) === 2) {
            $this->pass();
        } else {
            $this->fail("User data extraction incorrect");
        }
    }

    /**
     * Test nonce replay attack prevention
     */
    private function testNonceReplayPrevention(): void
    {
        echo "Test: Nonce Replay Prevention... ";

        $handler = new LTIHandler($this->test_config);
        $nonce = uniqid('test_nonce_', true);

        $reflection = new ReflectionClass($handler);
        $method = $reflection->getMethod('checkNonce');
        $method->setAccessible(true);

        // First use should succeed
        $first_check = $method->invoke($handler, $nonce);

        // Second use should fail (replay attack)
        $second_check = $method->invoke($handler, $nonce);

        if ($first_check === true && $second_check === false) {
            $this->pass();
        } else {
            $this->fail("Nonce replay prevention not working");
        }
    }

    /**
     * Test grade passback XML generation
     */
    private function testGradePassbackXMLGeneration(): void
    {
        echo "Test: Grade Passback XML Generation... ";

        $handler = new LTIHandler($this->test_config);

        $reflection = new ReflectionClass($handler);
        $method = $reflection->getMethod('buildGradePassbackXML');
        $method->setAccessible(true);

        $xml = $method->invoke($handler, 'msg_123', 'sourcedid_456', 0.85);

        if (strpos($xml, '<textString>0.85</textString>') !== false &&
            strpos($xml, '<sourcedId>sourcedid_456</sourcedId>') !== false) {
            $this->pass();
        } else {
            $this->fail("Grade passback XML generation incorrect");
        }
    }

    /**
     * Test Moodle API connection structure
     */
    private function testMoodleAPIConnection(): void
    {
        echo "Test: Moodle API Client Initialization... ";

        try {
            $client = new MoodleAPIClient('https://lms.kaist.ac.kr', 'test_token');

            $reflection = new ReflectionClass($client);
            $property = $reflection->getProperty('moodle_url');
            $property->setAccessible(true);

            if ($property->getValue($client) === 'https://lms.kaist.ac.kr') {
                $this->pass();
            } else {
                $this->fail("Moodle URL not set correctly");
            }
        } catch (Exception $e) {
            $this->fail("Exception: " . $e->getMessage());
        }
    }

    /**
     * Test parameter flattening for Moodle API
     */
    private function testFlattenParams(): void
    {
        echo "Test: Parameter Flattening... ";

        $client = new MoodleAPIClient('https://test.com', 'token');

        $reflection = new ReflectionClass($client);
        $method = $reflection->getMethod('flattenParams');
        $method->setAccessible(true);

        $params = [
            'modules' => [
                [
                    'name' => 'Test Module',
                    'section' => 1
                ]
            ]
        ];

        $flattened = $method->invoke($client, $params);

        if (isset($flattened['modules[0][name]']) &&
            $flattened['modules[0][name]'] === 'Test Module') {
            $this->pass();
        } else {
            $this->fail("Parameter flattening incorrect");
        }
    }

    /**
     * Mark test as passed
     */
    private function pass(): void
    {
        echo "✓ PASSED\n";
        $this->passed++;
    }

    /**
     * Mark test as failed
     */
    private function fail(string $message): void
    {
        echo "✗ FAILED: {$message}\n";
        $this->failed++;
    }
}

// Run tests
$test = new LTIIntegrationTest();
$test->runAll();
