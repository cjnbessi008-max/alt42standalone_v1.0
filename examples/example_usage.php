<?php
/**
 * Example Usage Scripts
 * Demonstrates how to use the Moodle integration and gap detection system
 */

require_once __DIR__ . '/../moodle-integration/MoodleClient.php';
require_once __DIR__ . '/../moodle-integration/GapDetector.php';
require_once __DIR__ . '/../moodle-integration/DatabaseManager.php';

// Load configuration
$config = require __DIR__ . '/../moodle-integration/config.php';

// Initialize services
$dbManager = new DatabaseManager($config['database']);
$db = $dbManager->getConnection();
$moodleClient = new MoodleClient($config['moodle']);
$gapDetector = new GapDetector($config, $moodleClient, $db);

echo "=== Moodle Integration - Example Usage ===\n\n";

// Example 1: Get students in a course
echo "Example 1: Get students in a course\n";
echo "------------------------------------\n";
$courseId = 1; // Replace with your course ID

try {
    $students = $moodleClient->getCourseStudents($courseId);
    echo "Found " . count($students) . " students in course $courseId\n";

    foreach (array_slice($students, 0, 3) as $student) {
        echo "  - {$student['fullname']} (ID: {$student['id']})\n";
    }
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 2: Get quiz attempts for a student
echo "Example 2: Get quiz attempts\n";
echo "-----------------------------\n";
$quizId = 1; // Replace with your quiz ID
$userId = 2; // Replace with your user ID

try {
    $attempts = $moodleClient->getQuizAttempts($quizId, $userId);
    echo "Found " . count($attempts['attempts'] ?? []) . " attempts for quiz $quizId\n";

    if (!empty($attempts['attempts'])) {
        foreach (array_slice($attempts['attempts'], 0, 2) as $attempt) {
            echo "  - Attempt {$attempt['attempt']}: Grade {$attempt['sumgrades']}\n";
        }
    }
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 3: Analyze a single student
echo "Example 3: Analyze a single student\n";
echo "------------------------------------\n";

// Define concept map for the course
$conceptMap = [
    'fractions_basic' => ['fraction', '분수', 'numerator', 'denominator'],
    'fractions_multiplication' => ['fraction multiply', '분수 곱셈'],
    'fractions_division' => ['fraction divide', '분수 나눗셈'],
    'multiplication_basic' => ['multiplication', '곱셈', 'multiply'],
];

try {
    $gaps = $gapDetector->analyzeStudent($courseId, $userId, $conceptMap);
    echo "Detected " . count($gaps) . " prerequisite gaps\n";

    foreach ($gaps as $gap) {
        echo "  - Gap in '{$gap['prerequisite_concept']}' affecting '{$gap['current_concept']}'\n";
        echo "    Severity: {$gap['gap_severity']}, Confidence: {$gap['confidence']}\n";
        echo "    Current performance: {$gap['current_performance']}%\n";
        echo "    Prerequisite performance: {$gap['prerequisite_performance']}%\n";
    }
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 4: Get gap statistics for a course
echo "Example 4: Course gap statistics\n";
echo "---------------------------------\n";

try {
    $stats = $gapDetector->getCourseGapStatistics($courseId);
    echo "Gap statistics for course $courseId:\n";

    foreach (array_slice($stats, 0, 5) as $stat) {
        echo "  - Prerequisite: {$stat['prerequisite_concept']}\n";
        echo "    Affected students: {$stat['affected_students']}\n";
        echo "    Average confidence: " . round($stat['avg_confidence'], 2) . "\n";
        echo "    Average performance: " . round($stat['avg_performance'], 1) . "%\n";
    }
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 5: Batch analyze multiple students
echo "Example 5: Batch analyze students\n";
echo "----------------------------------\n";

try {
    $students = $moodleClient->getCourseStudents($courseId);
    $studentIds = array_slice(array_column($students, 'id'), 0, 5); // First 5 students

    echo "Analyzing " . count($studentIds) . " students...\n";

    $results = $gapDetector->batchAnalyze($courseId, $studentIds, $conceptMap);

    echo "Results:\n";
    echo "  Analyzed: {$results['analyzed']} students\n";
    echo "  Gaps detected: {$results['gaps_detected']}\n";
    echo "  Errors: {$results['errors']}\n";
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 6: Query gaps from database
echo "Example 6: Query gaps from database\n";
echo "------------------------------------\n";

try {
    $stmt = $db->prepare('
        SELECT
            user_id,
            current_concept,
            prerequisite_concept,
            gap_severity,
            confidence,
            current_performance,
            prerequisite_performance
        FROM prerequisite_gaps
        WHERE course_id = ?
        AND gap_severity IN ("critical", "high")
        ORDER BY confidence DESC
        LIMIT 5
    ');
    $stmt->execute([$courseId]);
    $criticalGaps = $stmt->fetchAll();

    echo "Critical and high severity gaps:\n";

    foreach ($criticalGaps as $gap) {
        echo "  - Student {$gap['user_id']}: {$gap['prerequisite_concept']} → {$gap['current_concept']}\n";
        echo "    Severity: {$gap['gap_severity']}, Confidence: {$gap['confidence']}\n";
    }
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 7: Setup concept map in database
echo "Example 7: Setup concept map\n";
echo "-----------------------------\n";

$conceptsToAdd = [
    ['concept' => 'fractions_basic', 'keywords' => ['fraction', '분수', 'numerator', 'denominator']],
    ['concept' => 'fractions_multiplication', 'keywords' => ['fraction multiply', '분수 곱셈']],
    ['concept' => 'algebra_equations', 'keywords' => ['equation', '방정식', 'solve']],
];

try {
    $stmt = $db->prepare('
        INSERT INTO concept_map (course_id, concept_name, keywords)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE keywords = VALUES(keywords)
    ');

    foreach ($conceptsToAdd as $concept) {
        $keywords = json_encode($concept['keywords']);
        $stmt->execute([$courseId, $concept['concept'], $keywords]);
    }

    echo "Added " . count($conceptsToAdd) . " concepts to course $courseId\n";
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n";

// Example 8: Add prerequisite rules
echo "Example 8: Add prerequisite rules\n";
echo "----------------------------------\n";

$prerequisiteRules = [
    ['current' => 'fractions_multiplication', 'prerequisite' => 'fractions_basic', 'importance' => 'critical'],
    ['current' => 'fractions_multiplication', 'prerequisite' => 'multiplication_basic', 'importance' => 'high'],
    ['current' => 'algebra_equations', 'prerequisite' => 'arithmetic_operations', 'importance' => 'critical'],
];

try {
    $stmt = $db->prepare('
        INSERT INTO prerequisite_rules (course_id, current_concept, prerequisite_concept, importance)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE importance = VALUES(importance)
    ');

    foreach ($prerequisiteRules as $rule) {
        $stmt->execute([
            $courseId,
            $rule['current'],
            $rule['prerequisite'],
            $rule['importance']
        ]);
    }

    echo "Added " . count($prerequisiteRules) . " prerequisite rules to course $courseId\n";
} catch (Exception $e) {
    echo "Error: {$e->getMessage()}\n";
}

echo "\n=== Examples Complete ===\n";
