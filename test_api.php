<?php
/**
 * API Test Script
 * Run this to test the basic functionality
 */

require_once __DIR__ . '/config/config.php';

echo "========================================\n";
echo "Cognitive Recovery System - API Tests\n";
echo "========================================\n\n";

// Test 1: Database Connection
echo "Test 1: Database Connection\n";
try {
    $db = Database::getInstance();
    echo "✓ Database connection successful\n\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 2: Moodle Connection
echo "Test 2: Moodle Connection\n";
try {
    if (empty(MOODLE_TOKEN)) {
        echo "⚠ Moodle token not configured. Skipping.\n\n";
    } else {
        $moodle = new MoodleClient();
        $connected = $moodle->testConnection();
        if ($connected) {
            echo "✓ Moodle connection successful\n";
            $info = $moodle->getSiteInfo();
            echo "  Site: " . ($info['sitename'] ?? 'Unknown') . "\n";
            echo "  Version: " . ($info['release'] ?? 'Unknown') . "\n\n";
        } else {
            echo "✗ Moodle connection failed\n\n";
        }
    }
} catch (Exception $e) {
    echo "✗ Moodle connection error: " . $e->getMessage() . "\n\n";
}

// Test 3: Create Test User
echo "Test 3: Create Test User\n";
try {
    $pdo = $db->getConnection();
    $stmt = $pdo->prepare("INSERT INTO users (moodle_user_id, username, email, first_name, last_name)
                           VALUES (99999, 'test_user', 'test@example.com', 'Test', 'User')
                           ON DUPLICATE KEY UPDATE username = 'test_user'");
    $stmt->execute();
    echo "✓ Test user created/updated\n\n";
} catch (Exception $e) {
    echo "✗ Failed to create test user: " . $e->getMessage() . "\n\n";
}

// Test 4: Create Assessment
echo "Test 4: Create Cognitive Assessment\n";
try {
    $assessment = new CognitiveAssessment();

    // Get test user ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE moodle_user_id = 99999");
    $stmt->execute();
    $userId = $stmt->fetchColumn();

    if ($userId) {
        $assessmentId = $assessment->createAssessment($userId, 1, 'baseline');
        echo "✓ Assessment created with ID: $assessmentId\n\n";
    } else {
        echo "✗ Test user not found\n\n";
    }
} catch (Exception $e) {
    echo "✗ Failed to create assessment: " . $e->getMessage() . "\n\n";
}

// Test 5: Create Rest Session
echo "Test 5: Create Rest Session\n";
try {
    $session = new RestSession();
    if ($userId) {
        $sessionId = $session->createSession($userId, 300); // 5 minutes for testing
        echo "✓ Rest session created with ID: $sessionId\n\n";
    }
} catch (Exception $e) {
    echo "✗ Failed to create rest session: " . $e->getMessage() . "\n\n";
}

// Test 6: Get Assessment Questions
echo "Test 6: Get Assessment Questions\n";
try {
    $questions = $assessment->getQuestions(1, 5);
    echo "✓ Retrieved " . count($questions) . " questions\n";
    if (count($questions) > 0) {
        echo "  Sample: " . substr($questions[0]['question_text'], 0, 50) . "...\n\n";
    }
} catch (Exception $e) {
    echo "✗ Failed to get questions: " . $e->getMessage() . "\n\n";
}

echo "========================================\n";
echo "Tests completed!\n";
echo "========================================\n\n";

echo "Next steps:\n";
echo "1. Load sample questions: mysql -u " . DB_USER . " -p " . DB_NAME . " < database/sample_questions.sql\n";
echo "2. Access dashboard at: http://yourserver/dashboard.html\n";
echo "3. Configure Moodle token in config/.env if not already done\n\n";
