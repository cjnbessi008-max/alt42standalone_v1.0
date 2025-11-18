<?php
/**
 * Jump Thinking Detector
 * Detects and analyzes jump thinking patterns in student problem-solving
 */

namespace JumpThinking\JumpThinking;

use JumpThinking\Database\Connection;

class Detector {
    private $db;
    private $config;

    // Event types
    const EVENT_STEP_SKIP = 'step_skip';
    const EVENT_FAST_SOLVE = 'fast_solve';
    const EVENT_SEQUENCE_VIOLATION = 'sequence_violation';
    const EVENT_DIRECT_ANSWER = 'direct_answer';

    // Severity levels
    const SEVERITY_LOW = 'low';
    const SEVERITY_MEDIUM = 'medium';
    const SEVERITY_HIGH = 'high';

    public function __construct() {
        $this->db = Connection::getInstance();
        $appConfig = require CONFIG_PATH . '/app.php';
        $this->config = $appConfig['jump_detection'];
    }

    /**
     * Analyze a student session for jump thinking patterns
     *
     * @param int $sessionId Session ID to analyze
     * @return array Analysis results
     */
    public function analyzeSession($sessionId) {
        // Get session info
        $session = $this->getSession($sessionId);
        if (!$session) {
            throw new \Exception('Session not found');
        }

        // Get all attempts for this session
        $attempts = $this->getSessionAttempts($sessionId);

        if (count($attempts) < $this->config['min_problems_for_analysis']) {
            return [
                'analyzed' => false,
                'reason' => 'Not enough problems attempted',
                'min_required' => $this->config['min_problems_for_analysis']
            ];
        }

        // Get problem set structure
        $problems = $this->getProblemSetStructure($session['set_id']);

        // Detect jump thinking events
        $events = [];

        // 1. Detect step skipping
        $stepSkipEvents = $this->detectStepSkips($attempts, $problems);
        $events = array_merge($events, $stepSkipEvents);

        // 2. Detect fast solving
        $fastSolveEvents = $this->detectFastSolves($attempts, $problems);
        $events = array_merge($events, $fastSolveEvents);

        // 3. Detect sequence violations
        $sequenceEvents = $this->detectSequenceViolations($attempts, $problems);
        $events = array_merge($events, $sequenceEvents);

        // 4. Detect direct answers (skipping to final step)
        $directAnswerEvents = $this->detectDirectAnswers($attempts, $problems);
        $events = array_merge($events, $directAnswerEvents);

        // Save events to database
        foreach ($events as $event) {
            $this->saveEvent($sessionId, $event);
        }

        // Calculate jump score
        $score = $this->calculateJumpScore($events, $attempts);

        // Save score to database
        $this->saveJumpScore($sessionId, $session['student_id'], $session['set_id'], $score, $events);

        // Update learning pattern
        $this->updateLearningPattern($session['student_id']);

        return [
            'analyzed' => true,
            'session_id' => $sessionId,
            'jump_score' => $score['total_score'],
            'total_events' => count($events),
            'events_by_type' => $score['events_by_type'],
            'tendency' => $this->getTendency($score['total_score']),
            'events' => $events
        ];
    }

    /**
     * Detect step skipping patterns
     */
    private function detectStepSkips($attempts, $problems) {
        $events = [];
        $problemMap = [];

        // Build problem map for quick lookup
        foreach ($problems as $problem) {
            $problemMap[$problem['id']] = $problem;
        }

        // Check for skipped required steps
        $attemptedIds = array_column($attempts, 'problem_id');

        foreach ($problems as $problem) {
            if (!$problem['is_required']) {
                continue;
            }

            // If problem has a parent and parent wasn't attempted
            if ($problem['parent_problem_id'] && !in_array($problem['parent_problem_id'], $attemptedIds)) {
                // But this problem WAS attempted
                if (in_array($problem['id'], $attemptedIds)) {
                    $parentProblem = $problemMap[$problem['parent_problem_id']];

                    $events[] = [
                        'type' => self::EVENT_STEP_SKIP,
                        'from_problem_id' => $problem['parent_problem_id'],
                        'to_problem_id' => $problem['id'],
                        'expected_step_level' => $parentProblem['step_level'],
                        'actual_step_level' => $problem['step_level'],
                        'severity' => $this->calculateSkipSeverity($parentProblem['step_level'], $problem['step_level']),
                        'description' => sprintf(
                            '단계 %d를 건너뛰고 단계 %d로 진행 (문제: %s)',
                            $parentProblem['step_level'],
                            $problem['step_level'],
                            $problem['title']
                        )
                    ];
                }
            }
        }

        return $events;
    }

    /**
     * Detect abnormally fast problem solving
     */
    private function detectFastSolves($attempts, $problems) {
        $events = [];
        $problemMap = [];

        foreach ($problems as $problem) {
            $problemMap[$problem['id']] = $problem;
        }

        foreach ($attempts as $attempt) {
            if (!$attempt['is_correct']) {
                continue; // Only consider correct answers
            }

            $problem = $problemMap[$attempt['problem_id']];
            $expectedTime = $problem['max_time_seconds'] * $this->config['fast_solve_multiplier'];

            if ($attempt['time_spent_seconds'] < $expectedTime && $attempt['time_spent_seconds'] > 0) {
                $timeDiff = $expectedTime - $attempt['time_spent_seconds'];

                $events[] = [
                    'type' => self::EVENT_FAST_SOLVE,
                    'from_problem_id' => null,
                    'to_problem_id' => $attempt['problem_id'],
                    'expected_step_level' => $problem['step_level'],
                    'actual_step_level' => $problem['step_level'],
                    'time_difference_seconds' => $timeDiff,
                    'severity' => $this->calculateTimeSeverity($attempt['time_spent_seconds'], $expectedTime),
                    'description' => sprintf(
                        '문제를 예상보다 빠르게 해결 (%d초, 예상: %d초)',
                        $attempt['time_spent_seconds'],
                        round($expectedTime)
                    )
                ];
            }
        }

        return $events;
    }

    /**
     * Detect sequence violations (solving out of order)
     */
    private function detectSequenceViolations($attempts, $problems) {
        $events = [];

        // Sort attempts by time
        usort($attempts, function($a, $b) {
            return strtotime($a['attempted_at']) - strtotime($b['attempted_at']);
        });

        // Build expected order map
        $orderMap = [];
        foreach ($problems as $problem) {
            $orderMap[$problem['id']] = $problem['problem_order'];
        }

        $lastOrder = -1;
        foreach ($attempts as $attempt) {
            $currentOrder = $orderMap[$attempt['problem_id']];

            if ($currentOrder < $lastOrder) {
                // Out of sequence
                $events[] = [
                    'type' => self::EVENT_SEQUENCE_VIOLATION,
                    'from_problem_id' => $attempt['problem_id'],
                    'to_problem_id' => $attempt['problem_id'],
                    'expected_step_level' => null,
                    'actual_step_level' => null,
                    'severity' => self::SEVERITY_MEDIUM,
                    'description' => sprintf(
                        '문제 순서 위반 (순서: %d, 이전: %d)',
                        $currentOrder,
                        $lastOrder
                    )
                ];
            }

            $lastOrder = $currentOrder;
        }

        return $events;
    }

    /**
     * Detect direct answer patterns (jumping to final step)
     */
    private function detectDirectAnswers($attempts, $problems) {
        $events = [];

        // Find problems with step_level 3 (final)
        $finalProblems = array_filter($problems, function($p) {
            return $p['step_level'] == 3;
        });

        $attemptedIds = array_column($attempts, 'problem_id');

        foreach ($finalProblems as $finalProblem) {
            // Check if final problem was attempted
            if (!in_array($finalProblem['id'], $attemptedIds)) {
                continue;
            }

            // Get the attempt
            $attempt = null;
            foreach ($attempts as $a) {
                if ($a['problem_id'] == $finalProblem['id']) {
                    $attempt = $a;
                    break;
                }
            }

            if (!$attempt || !$attempt['is_correct']) {
                continue;
            }

            // Count how many intermediate steps were attempted
            $intermediateSteps = array_filter($problems, function($p) use ($finalProblem) {
                return $p['set_id'] == $finalProblem['set_id']
                    && $p['step_level'] < $finalProblem['step_level']
                    && $p['step_level'] > 1
                    && $p['is_required'];
            });

            $attemptedIntermediateSteps = 0;
            foreach ($intermediateSteps as $step) {
                if (in_array($step['id'], $attemptedIds)) {
                    $attemptedIntermediateSteps++;
                }
            }

            // If less than 50% of intermediate steps were attempted
            if (count($intermediateSteps) > 0 && $attemptedIntermediateSteps < count($intermediateSteps) * 0.5) {
                $events[] = [
                    'type' => self::EVENT_DIRECT_ANSWER,
                    'from_problem_id' => null,
                    'to_problem_id' => $finalProblem['id'],
                    'expected_step_level' => 2,
                    'actual_step_level' => 3,
                    'severity' => self::SEVERITY_HIGH,
                    'description' => sprintf(
                        '중간 단계 없이 최종 답 도출 (생략된 단계: %d/%d)',
                        count($intermediateSteps) - $attemptedIntermediateSteps,
                        count($intermediateSteps)
                    )
                ];
            }
        }

        return $events;
    }

    /**
     * Calculate severity of step skip
     */
    private function calculateSkipSeverity($fromLevel, $toLevel) {
        $gap = $toLevel - $fromLevel;

        if ($gap >= 2) {
            return self::SEVERITY_HIGH;
        } elseif ($gap == 1) {
            return self::SEVERITY_MEDIUM;
        }

        return self::SEVERITY_LOW;
    }

    /**
     * Calculate severity based on time difference
     */
    private function calculateTimeSeverity($actualTime, $expectedTime) {
        $ratio = $actualTime / $expectedTime;

        if ($ratio < 0.3) {
            return self::SEVERITY_HIGH;
        } elseif ($ratio < 0.5) {
            return self::SEVERITY_MEDIUM;
        }

        return self::SEVERITY_LOW;
    }

    /**
     * Calculate overall jump score
     */
    private function calculateJumpScore($events, $attempts) {
        $score = 0;
        $eventsByType = [
            'step_skips' => 0,
            'fast_solves' => 0,
            'sequence_violations' => 0,
            'direct_answers' => 0
        ];

        foreach ($events as $event) {
            switch ($event['type']) {
                case self::EVENT_STEP_SKIP:
                    $score += $this->config['step_skip_penalty'];
                    $eventsByType['step_skips']++;
                    break;

                case self::EVENT_FAST_SOLVE:
                    $score += 10; // Fixed penalty for fast solve
                    $eventsByType['fast_solves']++;
                    break;

                case self::EVENT_SEQUENCE_VIOLATION:
                    $score += $this->config['sequence_violation_penalty'];
                    $eventsByType['sequence_violations']++;
                    break;

                case self::EVENT_DIRECT_ANSWER:
                    $score += $this->config['direct_answer_penalty'];
                    $eventsByType['direct_answers']++;
                    break;
            }

            // Add severity multiplier
            if ($event['severity'] === self::SEVERITY_HIGH) {
                $score += 10;
            } elseif ($event['severity'] === self::SEVERITY_MEDIUM) {
                $score += 5;
            }
        }

        // Normalize to 0-100 scale
        $totalScore = min($this->config['max_jump_score'], $score);

        // Calculate average time ratio
        $totalTime = array_sum(array_column($attempts, 'time_spent_seconds'));
        $totalProblems = count($attempts);
        $avgTimeRatio = $totalProblems > 0 ? $totalTime / ($totalProblems * 180) : 1.0; // Assume 180s average

        return [
            'total_score' => $totalScore,
            'events_by_type' => $eventsByType,
            'avg_time_ratio' => $avgTimeRatio
        ];
    }

    /**
     * Determine tendency based on jump score
     */
    private function getTendency($score) {
        if ($score >= 60) {
            return 'jumper'; // Strong jump thinking tendency
        } elseif ($score >= 30) {
            return 'mixed'; // Mixed approach
        } else {
            return 'sequential'; // Step-by-step approach
        }
    }

    // Database helper methods

    private function getSession($sessionId) {
        $sql = "SELECT * FROM student_sessions WHERE id = ?";
        return $this->db->fetchOne($sql, [$sessionId]);
    }

    private function getSessionAttempts($sessionId) {
        $sql = "SELECT * FROM attempts WHERE session_id = ? ORDER BY attempted_at ASC";
        return $this->db->fetchAll($sql, [$sessionId]);
    }

    private function getProblemSetStructure($setId) {
        $sql = "SELECT * FROM problems WHERE set_id = ? ORDER BY problem_order ASC";
        return $this->db->fetchAll($sql, [$setId]);
    }

    private function saveEvent($sessionId, $event) {
        $sql = "INSERT INTO jump_thinking_events
                (session_id, event_type, from_problem_id, to_problem_id, expected_step_level,
                 actual_step_level, time_difference_seconds, severity, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $this->db->insert($sql, [
            $sessionId,
            $event['type'],
            $event['from_problem_id'],
            $event['to_problem_id'],
            $event['expected_step_level'],
            $event['actual_step_level'],
            $event['time_difference_seconds'] ?? null,
            $event['severity'],
            $event['description']
        ]);
    }

    private function saveJumpScore($sessionId, $studentId, $setId, $score, $events) {
        $sql = "INSERT INTO jump_thinking_scores
                (session_id, student_id, set_id, jump_score, total_events,
                 step_skips, fast_solves, sequence_violations, direct_answers,
                 avg_time_ratio, analysis_completed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                jump_score = VALUES(jump_score),
                total_events = VALUES(total_events),
                step_skips = VALUES(step_skips),
                fast_solves = VALUES(fast_solves),
                sequence_violations = VALUES(sequence_violations),
                direct_answers = VALUES(direct_answers),
                avg_time_ratio = VALUES(avg_time_ratio),
                analysis_completed_at = NOW()";

        $this->db->execute($sql, [
            $sessionId,
            $studentId,
            $setId,
            $score['total_score'],
            count($events),
            $score['events_by_type']['step_skips'],
            $score['events_by_type']['fast_solves'],
            $score['events_by_type']['sequence_violations'],
            $score['events_by_type']['direct_answers'],
            $score['avg_time_ratio']
        ]);
    }

    private function updateLearningPattern($studentId) {
        // Get all jump scores for this student
        $sql = "SELECT AVG(jump_score) as avg_score, COUNT(*) as total_sessions
                FROM jump_thinking_scores
                WHERE student_id = ?";

        $result = $this->db->fetchOne($sql, [$studentId]);

        if (!$result) {
            return;
        }

        $avgScore = $result['avg_score'];
        $tendency = $this->getTendency($avgScore);

        // Update or insert learning pattern
        $sql = "INSERT INTO learning_patterns
                (student_id, total_sessions, avg_jump_score, tendency, last_analyzed_at)
                VALUES (?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                total_sessions = VALUES(total_sessions),
                avg_jump_score = VALUES(avg_jump_score),
                tendency = VALUES(tendency),
                last_analyzed_at = NOW()";

        $this->db->execute($sql, [
            $studentId,
            $result['total_sessions'],
            $avgScore,
            $tendency
        ]);
    }
}
