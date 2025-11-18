<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

/**
 * Generate a probability problem based on distribution type
 *
 * @param object $smoothsteps The smoothsteps instance
 * @return array Problem data
 */
function smoothsteps_generate_problem($smoothsteps) {
    $problem = array();

    switch ($smoothsteps->distributiontype) {
        case 'continuous':
            $problem = smoothsteps_generate_continuous_problem();
            break;
        case 'discrete':
            $problem = smoothsteps_generate_discrete_problem();
            break;
        case 'both':
        default:
            // Randomly choose between continuous and discrete
            $problem = (rand(0, 1) == 0)
                ? smoothsteps_generate_continuous_problem()
                : smoothsteps_generate_discrete_problem();
            break;
    }

    return $problem;
}

/**
 * Generate a continuous probability problem
 *
 * @return array Problem data
 */
function smoothsteps_generate_continuous_problem() {
    // Normal distribution parameters
    $mean = rand(50, 150);
    $stddev = rand(10, 30);

    // Generate a range question
    $lower = $mean - rand(5, 20);
    $upper = $mean + rand(5, 20);

    return array(
        'type' => 'continuous',
        'distribution' => 'normal',
        'mean' => $mean,
        'stddev' => $stddev,
        'question' => sprintf(
            'If X follows a Normal distribution with mean %.1f and standard deviation %.1f, ' .
            'what represents the probability P(%.1f < X < %.1f)?',
            $mean, $stddev, $lower, $upper
        ),
        'answer_type' => 'area',
        'lower' => $lower,
        'upper' => $upper,
        'options' => array(
            array('text' => 'The area under the curve between the two values', 'correct' => true),
            array('text' => 'The height of the curve at the midpoint', 'correct' => false),
            array('text' => 'The sum of individual point probabilities', 'correct' => false),
            array('text' => 'The value at the peak of the distribution', 'correct' => false)
        )
    );
}

/**
 * Generate a discrete probability problem
 *
 * @return array Problem data
 */
function smoothsteps_generate_discrete_problem() {
    // Binomial distribution parameters
    $n = rand(10, 20);
    $p = rand(3, 7) / 10; // 0.3 to 0.7
    $k = rand(3, $n - 3);

    return array(
        'type' => 'discrete',
        'distribution' => 'binomial',
        'n' => $n,
        'p' => $p,
        'question' => sprintf(
            'In a binomial distribution with n=%d trials and probability p=%.1f, ' .
            'what represents P(X = %d)?',
            $n, $p, $k
        ),
        'answer_type' => 'bar',
        'k' => $k,
        'options' => array(
            array('text' => 'The height of the bar at that specific value', 'correct' => true),
            array('text' => 'The area under a smooth curve', 'correct' => false),
            array('text' => 'The cumulative sum up to that value', 'correct' => false),
            array('text' => 'The average of neighboring values', 'correct' => false)
        )
    );
}

/**
 * Get user statistics for the activity
 *
 * @param int $smoothstepsid The smoothsteps instance ID
 * @param int $userid The user ID
 * @return array Statistics data
 */
function smoothsteps_get_user_stats($smoothstepsid, $userid) {
    global $DB;

    $sql = "SELECT
                COUNT(*) as total_attempts,
                SUM(correct) as correct_answers,
                AVG(timespent) as avg_time,
                MIN(timecreated) as first_attempt,
                MAX(timecreated) as last_attempt
            FROM {smoothsteps_progress}
            WHERE smoothstepsid = :smoothstepsid AND userid = :userid";

    $stats = $DB->get_record_sql($sql, array(
        'smoothstepsid' => $smoothstepsid,
        'userid' => $userid
    ));

    if ($stats && $stats->total_attempts > 0) {
        $stats->accuracy = ($stats->correct_answers / $stats->total_attempts) * 100;
    } else {
        $stats = new stdClass();
        $stats->total_attempts = 0;
        $stats->correct_answers = 0;
        $stats->avg_time = 0;
        $stats->accuracy = 0;
    }

    return $stats;
}

/**
 * Get leaderboard data for the activity
 *
 * @param int $smoothstepsid The smoothsteps instance ID
 * @param int $limit Number of top users to return
 * @return array Leaderboard data
 */
function smoothsteps_get_leaderboard($smoothstepsid, $limit = 10) {
    global $DB;

    $sql = "SELECT
                u.id,
                u.firstname,
                u.lastname,
                COUNT(sp.id) as attempts,
                SUM(sp.correct) as correct,
                AVG(sp.timespent) as avg_time
            FROM {user} u
            JOIN {smoothsteps_progress} sp ON sp.userid = u.id
            WHERE sp.smoothstepsid = :smoothstepsid
            GROUP BY u.id, u.firstname, u.lastname
            ORDER BY correct DESC, avg_time ASC
            LIMIT :limit";

    return $DB->get_records_sql($sql, array(
        'smoothstepsid' => $smoothstepsid,
        'limit' => $limit
    ));
}

/**
 * Calculate probability for normal distribution
 *
 * @param float $x The value
 * @param float $mean The mean
 * @param float $stddev The standard deviation
 * @return float Probability density
 */
function smoothsteps_normal_pdf($x, $mean, $stddev) {
    $pi = 3.14159265359;
    $e = 2.71828182846;

    $exponent = -pow($x - $mean, 2) / (2 * pow($stddev, 2));
    return (1 / ($stddev * sqrt(2 * $pi))) * pow($e, $exponent);
}

/**
 * Calculate probability for binomial distribution
 *
 * @param int $k Number of successes
 * @param int $n Number of trials
 * @param float $p Probability of success
 * @return float Probability mass
 */
function smoothsteps_binomial_pmf($k, $n, $p) {
    if ($k > $n || $k < 0) {
        return 0;
    }

    $combination = smoothsteps_combination($n, $k);
    return $combination * pow($p, $k) * pow(1 - $p, $n - $k);
}

/**
 * Calculate combination (n choose k)
 *
 * @param int $n Total items
 * @param int $k Items to choose
 * @return float Combination value
 */
function smoothsteps_combination($n, $k) {
    if ($k > $n) {
        return 0;
    }
    if ($k == 0 || $k == $n) {
        return 1;
    }

    // Use smaller k for efficiency
    $k = min($k, $n - $k);

    $result = 1;
    for ($i = 0; $i < $k; $i++) {
        $result *= ($n - $i);
        $result /= ($i + 1);
    }

    return $result;
}
