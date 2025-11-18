<?php
/**
 * Unit Tests for Similarity Detector
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/detector/SimilarityDetector.php';

use SimilarityDetector\Detector\SimilarityDetector;

// Test database configuration
$testConfig = [
    'host' => 'localhost',
    'database' => 'similarity_detector_test',
    'username' => 'root',
    'password' => '',
];

// Create test database connection
try {
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $testConfig['host'], $testConfig['database']);
    $db = new PDO($dsn, $testConfig['username'], $testConfig['password']);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Test database connection failed: " . $e->getMessage() . "\n");
}

// Initialize detector
$detector = new SimilarityDetector($db, 0.70, 5);

echo "Running Similarity Detector Tests...\n\n";

// Test 1: Triangle similarity detection
echo "Test 1: Triangle Similarity Detection\n";
echo "=" . str_repeat("=", 50) . "\n";

$problem1 = [
    'id' => 9001,
    'questiontext' => '두 삼각형 ABC와 DEF에서 AB=6cm, BC=8cm, AC=10cm이고, DE=3cm, EF=4cm, DF=5cm일 때, 두 삼각형이 닮았는지 판단하시오.',
    'qtype' => 'similarity'
];

try {
    $result1 = $detector->detectHints($problem1);
    echo "✓ Problem processed successfully\n";
    echo "  Shapes detected: {$result1['shapes_detected']}\n";
    echo "  Hints generated: " . count($result1['hints']) . "\n";
    echo "  Execution time: {$result1['execution_time_ms']}ms\n\n";

    foreach ($result1['hints'] as $i => $hint) {
        echo "  Hint " . ($i + 1) . ":\n";
        echo "    Type: {$hint['type']}\n";
        echo "    Text: {$hint['text']}\n";
        echo "    Confidence: " . round($hint['confidence'] * 100) . "%\n\n";
    }
} catch (Exception $e) {
    echo "✗ Test failed: " . $e->getMessage() . "\n\n";
}

// Test 2: Rectangle similarity detection
echo "Test 2: Rectangle Similarity Detection\n";
echo "=" . str_repeat("=", 50) . "\n";

$problem2 = [
    'id' => 9002,
    'questiontext' => '직사각형 ABCD와 직사각형 EFGH에서 AB=4cm, BC=6cm이고, EF=6cm, FG=9cm일 때, 두 직사각형의 닮음비를 구하시오.',
    'qtype' => 'similarity'
];

try {
    $result2 = $detector->detectHints($problem2);
    echo "✓ Problem processed successfully\n";
    echo "  Shapes detected: {$result2['shapes_detected']}\n";
    echo "  Hints generated: " . count($result2['hints']) . "\n";
    echo "  Execution time: {$result2['execution_time_ms']}ms\n\n";

    foreach ($result2['hints'] as $i => $hint) {
        echo "  Hint " . ($i + 1) . ":\n";
        echo "    Type: {$hint['type']}\n";
        echo "    Text: {$hint['text']}\n";
        echo "    Confidence: " . round($hint['confidence'] * 100) . "%\n\n";
    }
} catch (Exception $e) {
    echo "✗ Test failed: " . $e->getMessage() . "\n\n";
}

// Test 3: Circle similarity detection
echo "Test 3: Circle Similarity Detection\n";
echo "=" . str_repeat("=", 50) . "\n";

$problem3 = [
    'id' => 9003,
    'questiontext' => '반지름이 4cm인 원과 반지름이 6cm인 원이 있다. 이 두 원의 닮음비를 구하시오.',
    'qtype' => 'similarity'
];

try {
    $result3 = $detector->detectHints($problem3);
    echo "✓ Problem processed successfully\n";
    echo "  Shapes detected: {$result3['shapes_detected']}\n";
    echo "  Hints generated: " . count($result3['hints']) . "\n";
    echo "  Execution time: {$result3['execution_time_ms']}ms\n\n";

    foreach ($result3['hints'] as $i => $hint) {
        echo "  Hint " . ($i + 1) . ":\n";
        echo "    Type: {$hint['type']}\n";
        echo "    Text: {$hint['text']}\n";
        echo "    Confidence: " . round($hint['confidence'] * 100) . "%\n\n";
    }
} catch (Exception $e) {
    echo "✗ Test failed: " . $e->getMessage() . "\n\n";
}

// Test 4: Ratio detection
echo "Test 4: Ratio Detection\n";
echo "=" . str_repeat("=", 50) . "\n";

$problem4 = [
    'id' => 9004,
    'questiontext' => '삼각형 ABC에서 DE∥BC이고, AD:DB = 2:3일 때, AE:EC의 비를 구하시오.',
    'qtype' => 'similarity'
];

try {
    $result4 = $detector->detectHints($problem4);
    echo "✓ Problem processed successfully\n";
    echo "  Shapes detected: {$result4['shapes_detected']}\n";
    echo "  Hints generated: " . count($result4['hints']) . "\n";
    echo "  Execution time: {$result4['execution_time_ms']}ms\n\n";

    foreach ($result4['hints'] as $i => $hint) {
        echo "  Hint " . ($i + 1) . ":\n";
        echo "    Type: {$hint['type']}\n";
        echo "    Text: {$hint['text']}\n";
        echo "    Confidence: " . round($hint['confidence'] * 100) . "%\n\n";
    }
} catch (Exception $e) {
    echo "✗ Test failed: " . $e->getMessage() . "\n\n";
}

echo "\nAll tests completed!\n";
