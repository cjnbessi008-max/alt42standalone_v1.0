<?php

namespace App\Services;

use App\Models\User;
use App\Models\LTISession;

/**
 * LTI (Learning Tools Interoperability) Service
 * Handles Moodle LTI 1.3 integration
 */
class LTIService
{
    private $config;

    public function __construct()
    {
        $this->config = require __DIR__ . '/../../config/lti.php';
    }

    /**
     * Validate LTI launch request
     */
    public function validateLaunchRequest(array $params): bool
    {
        // Basic OAuth 1.0 signature validation
        $consumerKey = $params['oauth_consumer_key'] ?? '';

        if ($consumerKey !== $this->config['consumer_key']) {
            return false;
        }

        // In production, implement full OAuth signature validation
        // For now, simplified validation
        return !empty($params['user_id']) && !empty($params['context_id']);
    }

    /**
     * Handle LTI launch and create/update user session
     */
    public function handleLaunch(array $params): array
    {
        $ltiUserId = $params['user_id'];
        $contextId = $params['context_id'];
        $resourceLinkId = $params['resource_link_id'] ?? $contextId;

        // Extract user information
        $email = $params['lis_person_contact_email_primary'] ?? null;
        $fullName = $params['lis_person_name_full'] ?? 'LTI User';
        $roles = $params['roles'] ?? '';

        // Determine role (teacher/student)
        $role = 'student';
        if (stripos($roles, 'Instructor') !== false || stripos($roles, 'Teacher') !== false) {
            $role = 'teacher';
        }

        // Find or create user
        $user = User::where('moodle_user_id', $ltiUserId)->first();

        if (!$user && $email) {
            // Create new user from LTI data
            $username = $email ? explode('@', $email)[0] : 'lti_' . $ltiUserId;

            $user = User::create([
                'username' => $username,
                'email' => $email ?? "{$username}@lti.local",
                'password_hash' => User::hashPassword(bin2hex(random_bytes(16))), // Random password
                'role' => $role,
                'full_name' => $fullName,
                'moodle_user_id' => $ltiUserId,
            ]);
        } elseif ($user) {
            // Update user info
            $user->update([
                'full_name' => $fullName,
                'role' => $role,
            ]);
        }

        if (!$user) {
            throw new \Exception('Failed to create or find user');
        }

        // Create LTI session
        // Note: You'll need to create LTISession model similar to others
        // For now, return user data

        $sessionData = [
            'user' => $user,
            'lti_user_id' => $ltiUserId,
            'context_id' => $contextId,
            'resource_link_id' => $resourceLinkId,
            'roles' => $roles,
        ];

        return $sessionData;
    }

    /**
     * Send grade back to Moodle
     */
    public function sendGradePassback(string $sourcedId, float $score, float $maxScore = 100.0): bool
    {
        // LTI Outcomes service (grade passback)
        // Requires OAuth signing and XML message

        $grade = $score / $maxScore; // Normalize to 0-1

        $xml = $this->buildGradePassbackXML($sourcedId, $grade);

        // In production, send to Moodle's grade passback endpoint
        // with proper OAuth signature

        // For now, log it
        error_log("Grade passback: sourcedId={$sourcedId}, grade={$grade}");

        return true;
    }

    /**
     * Build grade passback XML message
     */
    private function buildGradePassbackXML(string $sourcedId, float $grade): string
    {
        $messageIdentifier = uniqid('', true);

        return <<<XML
<?xml version="1.0" encoding="UTF-8"?>
<imsx_POXEnvelopeRequest xmlns="http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0">
  <imsx_POXHeader>
    <imsx_POXRequestHeaderInfo>
      <imsx_version>V1.0</imsx_version>
      <imsx_messageIdentifier>{$messageIdentifier}</imsx_messageIdentifier>
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
            <textString>{$grade}</textString>
          </resultScore>
        </result>
      </resultRecord>
    </replaceResultRequest>
  </imsx_POXBody>
</imsx_POXEnvelopeRequest>
XML;
    }

    /**
     * Get LTI configuration for Moodle
     */
    public function getToolConfiguration(): array
    {
        return [
            'title' => 'LMS Concept System',
            'description' => 'AI-powered concept selection for educational problems',
            'launch_url' => $this->config['launch_url'],
            'consumer_key' => $this->config['consumer_key'],
            'icon_url' => $_ENV['APP_URL'] . '/assets/icon.png',
            'privacy_level' => 'public', // public, name_only, anonymous
            'custom_fields' => [
                'user_id' => '$User.id',
                'context_id' => '$Context.id',
                'resource_link_id' => '$ResourceLink.id',
            ],
        ];
    }
}
