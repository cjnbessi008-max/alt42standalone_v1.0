<?php
/**
 * Example usage of Number Constellation Moodle Plugin
 *
 * This file shows how to integrate Number Constellation into your Moodle course
 * Compatible with Moodle 3.7, PHP 7.1.9
 */

require_once('../../config.php'); // Moodle config
require_once($CFG->dirroot . '/local/numconstellation/lib.php');

// Example 1: Send a prime number problem
$courseid = 1;
$userid = $USER->id;

$response = local_numconstellation_send_problem(
    $courseid,
    $userid,
    'prime',        // Problem type: prime numbers
    1,              // Range start
    50,             // Range end
    'easy',         // Difficulty
    array(          // Additional problem data
        'instruction' => '별자리에서 소수를 모두 찾으세요 (Find all prime numbers)',
        'targets' => array(2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47),
        'time_limit' => 300 // 5 minutes
    )
);

echo "Problem created with ID: " . $response->problem_id . "<br>";

// Example 2: Get the app URL to display in iframe
$app_url = local_numconstellation_get_app_url($response->problem_id, $userid);

echo '<div style="position: fixed; bottom: 20px; right: 20px; width: 375px; height: 667px; border: 10px solid #000; border-radius: 30px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">';
echo '<iframe src="' . $app_url . '" style="width: 100%; height: 100%; border: none;"></iframe>';
echo '</div>';

// Example 3: Get student progress
$progress = local_numconstellation_get_progress($response->problem_id, $userid);
if ($progress && $progress->completed) {
    echo "Score: " . $progress->score . "%<br>";
}

// Example 4: Multiple type problem
$response2 = local_numconstellation_send_problem(
    $courseid,
    $userid,
    'multiple',     // Problem type: multiples
    1,
    100,
    'medium',
    array(
        'instruction' => '3의 배수를 모두 선택하세요 (Select all multiples of 3)',
        'multiple_of' => 3,
        'targets' => range(3, 99, 3) // 3, 6, 9, ..., 99
    )
);

// Example 5: Natural number pattern problem
$response3 = local_numconstellation_send_problem(
    $courseid,
    $userid,
    'natural',
    1,
    50,
    'hard',
    array(
        'instruction' => '피보나치 수열을 찾으세요 (Find Fibonacci numbers)',
        'targets' => array(1, 1, 2, 3, 5, 8, 13, 21, 34),
        'pattern_type' => 'fibonacci'
    )
);
