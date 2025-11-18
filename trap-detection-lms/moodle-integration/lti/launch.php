<?php
/**
 * LTI Launch Handler
 * Handles Moodle LTI 1.1 authentication and launch
 * Trap Detection LMS
 */

session_start();

require_once __DIR__ . '/../../src/models/Database.php';
require_once __DIR__ . '/lti-validator.php';

// Load configuration
$config = require __DIR__ . '/../../config/app.php';
$ltiConfig = $config['lti'];

/**
 * LTI Launch Handler
 */
class LTILaunchHandler {
    private $db;
    private $config;
    private $validator;

    public function __construct($config) {
        $this->db = Database::getInstance();
        $this->config = $config;
        $this->validator = new LTIValidator($config);
    }

    /**
     * Process LTI launch request
     */
    public function processLaunch() {
        try {
            // Validate LTI request
            if (!$this->validator->validateRequest($_POST)) {
                throw new Exception("Invalid LTI request");
            }

            // Extract user information
            $userData = $this->extractUserData($_POST);

            // Create or update user
            $userId = $this->createOrUpdateUser($userData);

            // Create LTI session
            $sessionToken = $this->createSession($userId, $_POST);

            // Store session data
            $_SESSION['lti_user_id'] = $userId;
            $_SESSION['lti_session_token'] = $sessionToken;
            $_SESSION['lti_context_id'] = $_POST['context_id'] ?? null;
            $_SESSION['lti_role'] = $this->determineRole($_POST);

            // Redirect to appropriate page based on role
            $redirectUrl = $this->getRedirectUrl($_SESSION['lti_role']);

            header("Location: $redirectUrl");
            exit();

        } catch (Exception $e) {
            error_log("LTI Launch Error: " . $e->getMessage());
            $this->displayError("LTI Launch Failed: " . $e->getMessage());
        }
    }

    /**
     * Extract user data from LTI parameters
     */
    private function extractUserData($params) {
        return [
            'moodle_user_id' => $params['user_id'] ?? null,
            'username' => $params['lis_person_sourcedid'] ?? $params['user_id'] ?? 'unknown',
            'email' => $params['lis_person_contact_email_primary'] ?? '',
            'full_name' => $this->extractFullName($params),
            'role' => $this->determineRole($params),
        ];
    }

    /**
     * Extract full name from LTI parameters
     */
    private function extractFullName($params) {
        if (isset($params['lis_person_name_full'])) {
            return $params['lis_person_name_full'];
        }

        $firstName = $params['lis_person_name_given'] ?? '';
        $lastName = $params['lis_person_name_family'] ?? '';

        return trim("$firstName $lastName") ?: 'Unknown User';
    }

    /**
     * Determine user role from LTI parameters
     */
    private function determineRole($params) {
        $roles = $params['roles'] ?? '';

        if (stripos($roles, 'Instructor') !== false || stripos($roles, 'Administrator') !== false) {
            return 'teacher';
        } elseif (stripos($roles, 'TeachingAssistant') !== false) {
            return 'teacher';
        } else {
            return 'student';
        }
    }

    /**
     * Create or update user in database
     */
    private function createOrUpdateUser($userData) {
        // Check if user exists
        $sql = "SELECT id FROM users WHERE moodle_user_id = ?";
        $existingUser = $this->db->fetchOne($sql, [$userData['moodle_user_id']]);

        if ($existingUser) {
            // Update existing user
            $sql = "UPDATE users SET username = ?, email = ?, full_name = ?, role = ? WHERE id = ?";
            $this->db->execute($sql, [
                $userData['username'],
                $userData['email'],
                $userData['full_name'],
                $userData['role'],
                $existingUser['id']
            ]);
            return $existingUser['id'];
        } else {
            // Create new user
            $sql = "INSERT INTO users (moodle_user_id, username, email, full_name, role)
                    VALUES (?, ?, ?, ?, ?)";
            $this->db->execute($sql, [
                $userData['moodle_user_id'],
                $userData['username'],
                $userData['email'],
                $userData['full_name'],
                $userData['role']
            ]);
            return $this->db->lastInsertId();
        }
    }

    /**
     * Create LTI session
     */
    private function createSession($userId, $params) {
        $sessionToken = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + $this->config['session_timeout']);

        $sql = "INSERT INTO lti_sessions (
            session_token, moodle_user_id, context_id, resource_link_id,
            consumer_key, user_id, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)";

        $this->db->execute($sql, [
            $sessionToken,
            $params['user_id'] ?? null,
            $params['context_id'] ?? null,
            $params['resource_link_id'] ?? null,
            $params['oauth_consumer_key'] ?? null,
            $userId,
            $expiresAt
        ]);

        return $sessionToken;
    }

    /**
     * Get redirect URL based on role
     */
    private function getRedirectUrl($role) {
        $baseUrl = $this->config['base_url'] ?? '/';

        if ($role === 'teacher') {
            return $baseUrl . '/public/index.php?view=teacher';
        } else {
            return $baseUrl . '/public/index.php?view=student';
        }
    }

    /**
     * Display error page
     */
    private function displayError($message) {
        echo "<!DOCTYPE html>
        <html>
        <head>
            <title>LTI Launch Error</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f5f5f5;
                }
                .error-box {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #d32f2f;
                }
            </style>
        </head>
        <body>
            <div class='error-box'>
                <h1>❌ LTI Launch Error</h1>
                <p>" . htmlspecialchars($message) . "</p>
                <p>Please contact your administrator if this problem persists.</p>
            </div>
        </body>
        </html>";
        exit();
    }
}

// Process LTI launch
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $handler = new LTILaunchHandler($ltiConfig);
    $handler->processLaunch();
} else {
    echo "<!DOCTYPE html>
    <html>
    <head><title>LTI Launch</title></head>
    <body>
        <h1>LTI Launch Endpoint</h1>
        <p>This endpoint should only be accessed via LTI launch from Moodle.</p>
    </body>
    </html>";
}
