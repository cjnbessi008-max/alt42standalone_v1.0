<?php
/**
 * Trap Detection Service
 * Core algorithm for detecting and analyzing traps
 * Trap Detection LMS
 */

require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../models/Question.php';
require_once __DIR__ . '/../models/Trap.php';
require_once __DIR__ . '/../models/StudentAttempt.php';
require_once __DIR__ . '/../models/TrapIncident.php';

class TrapDetectionService {
    private $questionModel;
    private $trapModel;
    private $attemptModel;
    private $incidentModel;
    private $config;

    public function __construct($config = []) {
        $this->questionModel = new Question();
        $this->trapModel = new Trap();
        $this->attemptModel = new StudentAttempt();
        $this->incidentModel = new TrapIncident();

        $appConfig = require dirname(__DIR__, 2) . '/config/app.php';
        $this->config = array_merge($appConfig['trap_detection'], $config);
    }

    /**
     * Process student attempt and check for traps
     */
    public function processAttempt($studentId, $questionId, $selectedOptionId, $timeSpent = 0) {
        // Validate input
        $question = $this->questionModel->getWithOptions($questionId);
        if (!$question) {
            throw new Exception("Question not found");
        }

        // Determine if answer is correct
        $isCorrect = false;
        foreach ($question['options'] as $option) {
            if ($option['id'] == $selectedOptionId && $option['is_correct']) {
                $isCorrect = true;
                break;
            }
        }

        // Get attempt number
        $attemptNumber = $this->attemptModel->getAttemptCount($studentId, $questionId) + 1;

        // Record attempt
        $attemptData = [
            'student_id' => $studentId,
            'question_id' => $questionId,
            'selected_option_id' => $selectedOptionId,
            'is_correct' => $isCorrect,
            'time_spent_seconds' => $timeSpent,
            'attempt_number' => $attemptNumber,
            'session_id' => session_id(),
        ];

        $attemptId = $this->attemptModel->recordAttempt($attemptData);

        $result = [
            'attempt_id' => $attemptId,
            'is_correct' => $isCorrect,
            'traps_detected' => [],
            'interventions' => [],
        ];

        // If incorrect, check for traps
        if (!$isCorrect) {
            $trapsDetected = $this->attemptModel->checkForTraps($attemptId);

            foreach ($trapsDetected as $trap) {
                // Record incident
                $incidentData = [
                    'trap_id' => $trap['trap_id'],
                    'student_id' => $studentId,
                    'attempt_id' => $attemptId,
                ];
                $incidentId = $this->incidentModel->recordIncident($incidentData);

                // Increment trap detection count
                $this->trapModel->incrementDetectionCount($trap['trap_id']);

                // Get interventions for this trap
                $trapWithInterventions = $this->trapModel->getWithInterventions($trap['trap_id']);

                $result['traps_detected'][] = [
                    'incident_id' => $incidentId,
                    'trap_id' => $trap['trap_id'],
                    'description' => $trap['trap_description'],
                    'explanation' => $trap['explanation'],
                    'hint' => $trap['hint'],
                ];

                if (!empty($trapWithInterventions['interventions'])) {
                    $result['interventions'] = array_merge(
                        $result['interventions'],
                        $trapWithInterventions['interventions']
                    );
                }
            }

            // Auto-detect new traps if enabled
            if ($this->config['auto_create_traps']) {
                $this->autoDetectAndCreateTraps($questionId);
            }
        }

        return $result;
    }

    /**
     * Auto-detect and create new traps
     */
    public function autoDetectAndCreateTraps($questionId) {
        $newTraps = $this->trapModel->autoDetectTraps($questionId, [
            'min_attempts' => $this->config['min_attempts_for_pattern'],
            'occurrence_threshold' => $this->config['occurrence_threshold'],
        ]);

        return $newTraps;
    }

    /**
     * Analyze question difficulty and trap effectiveness
     */
    public function analyzeQuestion($questionId) {
        $stats = $this->attemptModel->getQuestionStats($questionId);
        $traps = $this->trapModel->getByQuestionId($questionId);
        $distribution = $this->attemptModel->getAnswerDistribution($questionId);

        $analysis = [
            'question_id' => $questionId,
            'statistics' => $stats,
            'difficulty_rating' => $this->calculateDifficultyRating($stats),
            'traps' => $traps,
            'answer_distribution' => $distribution,
            'recommendations' => [],
        ];

        // Generate recommendations
        if ($stats['accuracy_rate'] < 30) {
            $analysis['recommendations'][] = "이 문제가 너무 어려울 수 있습니다. 난이도를 낮추거나 더 많은 힌트를 제공하는 것을 고려하세요.";
        } elseif ($stats['accuracy_rate'] > 90) {
            $analysis['recommendations'][] = "이 문제가 너무 쉬울 수 있습니다. 난이도를 높이는 것을 고려하세요.";
        }

        if (count($traps) > 5) {
            $analysis['recommendations'][] = "너무 많은 함정이 감지되었습니다. 문제를 더 명확하게 만들어보세요.";
        }

        return $analysis;
    }

    /**
     * Calculate difficulty rating
     */
    private function calculateDifficultyRating($stats) {
        $accuracyRate = $stats['accuracy_rate'] ?? 50;

        if ($accuracyRate >= 90) return 'very_easy';
        if ($accuracyRate >= 70) return 'easy';
        if ($accuracyRate >= 50) return 'medium';
        if ($accuracyRate >= 30) return 'hard';
        return 'very_hard';
    }

    /**
     * Get personalized recommendations for student
     */
    public function getStudentRecommendations($studentId) {
        $incidents = $this->incidentModel->getActiveIncidents($studentId);
        $stats = $this->incidentModel->getStudentStats($studentId);

        $recommendations = [
            'active_traps' => $incidents,
            'statistics' => $stats,
            'focus_areas' => [],
            'suggested_practice' => [],
        ];

        // Analyze trap patterns
        $trapTypes = [];
        foreach ($incidents as $incident) {
            if (!isset($trapTypes[$incident['trap_type']])) {
                $trapTypes[$incident['trap_type']] = 0;
            }
            $trapTypes[$incident['trap_type']]++;
        }

        // Sort by frequency
        arsort($trapTypes);

        // Generate focus areas
        $typeNames = [
            'conceptual' => '개념 이해',
            'procedural' => '절차적 사고',
            'arithmetic' => '계산',
            'reading' => '문제 읽기',
            'careless' => '주의력',
        ];

        foreach (array_slice($trapTypes, 0, 3, true) as $type => $count) {
            $recommendations['focus_areas'][] = [
                'area' => $typeNames[$type] ?? $type,
                'trap_type' => $type,
                'incident_count' => $count,
                'priority' => $count >= 3 ? 'high' : 'medium',
            ];
        }

        return $recommendations;
    }

    /**
     * Mark trap as resolved and record feedback
     */
    public function resolveIncident($incidentId, $resolutionTimeSeconds = null, $feedbackRating = null) {
        return $this->incidentModel->markResolved($incidentId, $resolutionTimeSeconds, $feedbackRating);
    }

    /**
     * Get dashboard data for teachers
     */
    public function getTeacherDashboard($filters = []) {
        $dashboard = [
            'recent_incidents' => $this->incidentModel->getRecentIncidents(20, $filters),
            'most_common_traps' => $this->trapModel->getMostCommonTraps(10, $filters),
            'help_requests' => $this->incidentModel->getHelpRequests(false),
            'summary' => $this->getDashboardSummary($filters),
        ];

        return $dashboard;
    }

    /**
     * Get dashboard summary statistics
     */
    private function getDashboardSummary($filters = []) {
        $db = Database::getInstance();

        $whereClause = "WHERE 1=1";
        $params = [];

        if (!empty($filters['date_from'])) {
            $whereClause .= " AND ti.created_at >= ?";
            $params[] = $filters['date_from'];
        }

        if (!empty($filters['date_to'])) {
            $whereClause .= " AND ti.created_at <= ?";
            $params[] = $filters['date_to'];
        }

        $sql = "SELECT
                    COUNT(DISTINCT ti.id) as total_incidents,
                    COUNT(DISTINCT ti.student_id) as affected_students,
                    COUNT(DISTINCT t.id) as active_traps,
                    SUM(CASE WHEN ti.was_resolved = 1 THEN 1 ELSE 0 END) as resolved_incidents,
                    AVG(ti.resolution_time_seconds) as avg_resolution_time
                FROM trap_incidents ti
                JOIN traps t ON ti.trap_id = t.id
                $whereClause";

        return $db->fetchOne($sql, $params);
    }

    /**
     * Export trap data for analysis
     */
    public function exportTrapData($questionId = null) {
        $db = Database::getInstance();

        $sql = "SELECT
                    q.id as question_id,
                    q.question_text,
                    q.topic,
                    q.difficulty_level,
                    t.id as trap_id,
                    t.trap_type,
                    t.trap_description,
                    t.severity,
                    t.detection_count,
                    COUNT(DISTINCT ti.id) as incident_count,
                    COUNT(DISTINCT ti.student_id) as unique_students,
                    AVG(ti.resolution_time_seconds) as avg_resolution_time
                FROM questions q
                JOIN traps t ON q.id = t.question_id
                LEFT JOIN trap_incidents ti ON t.id = ti.trap_id
                WHERE t.is_active = 1";

        $params = [];

        if ($questionId !== null) {
            $sql .= " AND q.id = ?";
            $params[] = $questionId;
        }

        $sql .= " GROUP BY q.id, t.id
                  ORDER BY incident_count DESC, q.id";

        return $db->fetchAll($sql, $params);
    }
}
