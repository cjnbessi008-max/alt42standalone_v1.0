<?php
/**
 * Unit Tests for ShuffleEngine
 *
 * Run with: php src/tests/ShuffleEngineTest.php
 * Or with PHPUnit: phpunit src/tests/ShuffleEngineTest.php
 *
 * @package DataShuffle
 * @version 1.0.0
 */

require_once __DIR__ . '/../lib/ShuffleEngine.php';
require_once __DIR__ . '/../config/database.php';

use DataShuffle\Lib\ShuffleEngine;
use DataShuffle\Config\Database;

class ShuffleEngineTest
{
    private $engine;
    private $db;
    private $testsPassed = 0;
    private $testsFailed = 0;

    public function __construct()
    {
        // Setup test database connection
        try {
            $this->db = Database::getConnection();
            $this->engine = new ShuffleEngine($this->db);
        } catch (Exception $e) {
            echo "❌ Failed to initialize test environment: " . $e->getMessage() . "\n";
            exit(1);
        }
    }

    /**
     * Run all tests
     */
    public function runAllTests()
    {
        echo "🧪 Running ShuffleEngine Tests\n";
        echo str_repeat("=", 60) . "\n\n";

        $this->testSeededShuffleDeterministic();
        $this->testSeededShuffleUniqueness();
        $this->testSeededShufflePreservesElements();
        $this->testSeededShuffleEdgeCases();
        $this->testGenerateSeed();
        $this->testGetOrCreateSeeds();
        $this->testShuffleQuestions();
        $this->testShuffleAnswers();
        $this->testQuizConfig();

        echo "\n" . str_repeat("=", 60) . "\n";
        echo "✅ Tests passed: {$this->testsPassed}\n";
        echo "❌ Tests failed: {$this->testsFailed}\n";
        echo str_repeat("=", 60) . "\n";

        return $this->testsFailed === 0;
    }

    /**
     * Test: Seeded shuffle should be deterministic
     */
    private function testSeededShuffleDeterministic()
    {
        echo "Test: Seeded shuffle deterministic... ";

        $items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        $seed = "test_seed_123";

        $result1 = $this->engine->seededShuffle($items, $seed);
        $result2 = $this->engine->seededShuffle($items, $seed);

        if ($result1 === $result2) {
            $this->pass();
        } else {
            $this->fail("Results differ: " . json_encode($result1) . " vs " . json_encode($result2));
        }
    }

    /**
     * Test: Different seeds should produce different results
     */
    private function testSeededShuffleUniqueness()
    {
        echo "Test: Seeded shuffle uniqueness... ";

        $items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        $result1 = $this->engine->seededShuffle($items, "seed1");
        $result2 = $this->engine->seededShuffle($items, "seed2");

        if ($result1 !== $result2) {
            $this->pass();
        } else {
            $this->fail("Different seeds produced identical results");
        }
    }

    /**
     * Test: Shuffle should preserve all elements
     */
    private function testSeededShufflePreservesElements()
    {
        echo "Test: Shuffle preserves elements... ";

        $items = [1, 2, 3, 4, 5];
        $result = $this->engine->seededShuffle($items, "test");

        sort($result);
        sort($items);

        if ($result === $items) {
            $this->pass();
        } else {
            $this->fail("Elements not preserved: " . json_encode($result));
        }
    }

    /**
     * Test: Edge cases for shuffle
     */
    private function testSeededShuffleEdgeCases()
    {
        echo "Test: Shuffle edge cases... ";

        // Empty array
        $result1 = $this->engine->seededShuffle([], "seed");
        if ($result1 !== []) {
            $this->fail("Empty array failed");
            return;
        }

        // Single element
        $result2 = $this->engine->seededShuffle([1], "seed");
        if ($result2 !== [1]) {
            $this->fail("Single element failed");
            return;
        }

        // Two elements
        $items = [1, 2];
        $result3 = $this->engine->seededShuffle($items, "seed");
        if (count($result3) !== 2) {
            $this->fail("Two elements failed");
            return;
        }

        $this->pass();
    }

    /**
     * Test: Seed generation
     */
    private function testGenerateSeed()
    {
        echo "Test: Generate seed... ";

        $seed1 = $this->engine->generateSeed(1001, 101, 'question');
        $seed2 = $this->engine->generateSeed(1001, 101, 'question');
        $seed3 = $this->engine->generateSeed(1002, 101, 'question');

        // Same parameters should produce same seed
        if ($seed1 !== $seed2) {
            $this->fail("Same parameters produced different seeds");
            return;
        }

        // Different parameters should produce different seeds
        if ($seed1 === $seed3) {
            $this->fail("Different parameters produced same seed");
            return;
        }

        // Seed should be 64 characters (SHA256 hex)
        if (strlen($seed1) !== 64) {
            $this->fail("Seed length is not 64: " . strlen($seed1));
            return;
        }

        $this->pass();
    }

    /**
     * Test: Get or create seeds
     */
    private function testGetOrCreateSeeds()
    {
        echo "Test: Get or create seeds... ";

        try {
            $studentId = 9999;
            $quizId = 999;

            // First call should create new seeds
            $seeds1 = $this->engine->getOrCreateSeeds($studentId, $quizId);

            if (!isset($seeds1['question_seed']) || !isset($seeds1['answer_seed'])) {
                $this->fail("Seeds not created properly");
                return;
            }

            // Second call should return same seeds
            $seeds2 = $this->engine->getOrCreateSeeds($studentId, $quizId);

            if ($seeds1['question_seed'] !== $seeds2['question_seed']) {
                $this->fail("Seeds changed on second call");
                return;
            }

            // Cleanup
            $this->db->prepare("DELETE FROM shuffle_seeds WHERE student_id = ? AND quiz_id = ?")
                ->execute([$studentId, $quizId]);

            $this->pass();

        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }

    /**
     * Test: Shuffle questions
     */
    private function testShuffleQuestions()
    {
        echo "Test: Shuffle questions... ";

        try {
            $questions = [
                ['id' => 1, 'text' => 'Question 1'],
                ['id' => 2, 'text' => 'Question 2'],
                ['id' => 3, 'text' => 'Question 3'],
                ['id' => 4, 'text' => 'Question 4'],
                ['id' => 5, 'text' => 'Question 5']
            ];

            $studentId = 9998;
            $quizId = 998;

            $shuffled = $this->engine->shuffleQuestions($questions, $studentId, $quizId, false);

            // Should have same count
            if (count($shuffled) !== count($questions)) {
                $this->fail("Question count mismatch");
                return;
            }

            // Should have position metadata
            if (!isset($shuffled[0]['original_position']) || !isset($shuffled[0]['shuffled_position'])) {
                $this->fail("Missing position metadata");
                return;
            }

            // Cleanup
            $this->db->prepare("DELETE FROM shuffle_seeds WHERE student_id = ? AND quiz_id = ?")
                ->execute([$studentId, $quizId]);

            $this->pass();

        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }

    /**
     * Test: Shuffle answers
     */
    private function testShuffleAnswers()
    {
        echo "Test: Shuffle answers... ";

        try {
            $answers = [
                ['id' => 'A', 'text' => 'Answer A'],
                ['id' => 'B', 'text' => 'Answer B'],
                ['id' => 'C', 'text' => 'Answer C'],
                ['id' => 'D', 'text' => 'Answer D']
            ];

            $questionId = 100;
            $studentId = 9997;
            $quizId = 997;

            $result = $this->engine->shuffleAnswers($answers, $questionId, $studentId, $quizId);

            // Should have answers and mapping
            if (!isset($result['answers']) || !isset($result['mapping'])) {
                $this->fail("Missing answers or mapping");
                return;
            }

            // Should have same count
            if (count($result['answers']) !== count($answers)) {
                $this->fail("Answer count mismatch");
                return;
            }

            // Mapping should have all original IDs
            if (count($result['mapping']) !== count($answers)) {
                $this->fail("Mapping count mismatch");
                return;
            }

            // Cleanup
            $this->db->prepare("DELETE FROM shuffle_seeds WHERE student_id = ? AND quiz_id = ?")
                ->execute([$studentId, $quizId]);

            $this->pass();

        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }

    /**
     * Test: Quiz configuration
     */
    private function testQuizConfig()
    {
        echo "Test: Quiz configuration... ";

        try {
            // Should return default config for non-existent quiz
            $config = $this->engine->getQuizConfig(99999);

            if (!isset($config['shuffle_questions']) || !isset($config['shuffle_answers'])) {
                $this->fail("Default config missing required fields");
                return;
            }

            $this->pass();

        } catch (Exception $e) {
            $this->fail($e->getMessage());
        }
    }

    /**
     * Mark test as passed
     */
    private function pass()
    {
        echo "✅ PASS\n";
        $this->testsPassed++;
    }

    /**
     * Mark test as failed
     */
    private function fail($message = "")
    {
        echo "❌ FAIL";
        if ($message) {
            echo ": $message";
        }
        echo "\n";
        $this->testsFailed++;
    }
}

// Run tests if this file is executed directly
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    $tester = new ShuffleEngineTest();
    $success = $tester->runAllTests();
    exit($success ? 0 : 1);
}
