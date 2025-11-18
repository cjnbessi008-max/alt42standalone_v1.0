<?php
// This file is part of Moodle - http://moodle.org/

namespace block_chancemood;

defined('MOODLE_INTERNAL') || die();

/**
 * Recommendation Engine for Chance Mood
 *
 * Analyzes student performance and provides personalized learning recommendations
 * based on emotional mood analysis and success rates.
 *
 * @package    block_chancemood
 * @copyright  2025 KAIST Touch Math Academy
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class recommendation_engine {

    /** Minimum number of attempts needed for reliable recommendations */
    const MIN_ATTEMPTS = 3;

    /** Weight factors for recommendation scoring */
    const WEIGHT_SUCCESS_RATE = 0.4;
    const WEIGHT_RECENT_PERFORMANCE = 0.3;
    const WEIGHT_PROBLEM_SIMILARITY = 0.2;
    const WEIGHT_TIME_SPENT = 0.1;

    /**
     * Generate personalized recommendations for a student
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param array $mood_data Mood analysis data from main block
     * @return object Recommendation data
     */
    public static function generate_recommendations($userid, $courseid, $mood_data) {
        global $DB;

        $recommendations = new \stdClass();
        $recommendations->userid = $userid;
        $recommendations->courseid = $courseid;
        $recommendations->timestamp = time();

        // Analyze student's weak areas
        $weak_areas = self::identify_weak_areas($userid, $courseid, $mood_data);
        $recommendations->weak_areas = $weak_areas;

        // Recommend specific problems to practice
        $recommended_problems = self::recommend_problems($userid, $courseid, $weak_areas);
        $recommendations->problems = $recommended_problems;

        // Suggest learning resources
        $learning_resources = self::suggest_resources($weak_areas, $courseid);
        $recommendations->resources = $learning_resources;

        // Generate study path
        $study_path = self::generate_study_path($userid, $weak_areas);
        $recommendations->study_path = $study_path;

        // Calculate priority level
        $recommendations->priority = self::calculate_priority($weak_areas, $mood_data);

        // Generate motivational message
        $recommendations->message = self::generate_message($recommendations);

        // Store recommendations in database
        self::store_recommendations($recommendations);

        return $recommendations;
    }

    /**
     * Identify weak areas based on performance analysis
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param array $mood_data Mood data
     * @return array Array of weak area objects
     */
    private static function identify_weak_areas($userid, $courseid, $mood_data) {
        global $DB;

        $weak_areas = array();

        // Get user's question attempts
        $sql = "SELECT q.id, q.name, q.questiontext, q.qtype,
                       qa.rightanswer, qa.responsesummary, qa.fraction, qa.timemodified
                FROM {question} q
                JOIN {question_attempts} qa ON qa.questionid = q.id
                JOIN {quiz_slots} qs ON qs.questionid = q.id
                JOIN {quiz} qz ON qz.id = qs.quizid
                WHERE qz.course = :courseid
                AND qa.userid = :userid
                AND (q.questiontext LIKE '%확률%' OR q.questiontext LIKE '%경우의 수%'
                     OR q.questiontext LIKE '%probability%' OR q.questiontext LIKE '%chance%'
                     OR q.questiontext LIKE '%조합%' OR q.questiontext LIKE '%순열%')
                ORDER BY qa.timemodified DESC";

        $attempts = $DB->get_records_sql($sql, array('courseid' => $courseid, 'userid' => $userid));

        if (empty($attempts)) {
            return $weak_areas; // No data yet
        }

        // Group by problem type and analyze
        $problem_types = self::categorize_problems($attempts);

        foreach ($problem_types as $type => $problems) {
            $total = count($problems);
            $correct = 0;
            $total_fraction = 0;

            foreach ($problems as $problem) {
                $total_fraction += $problem->fraction;
                if ($problem->fraction >= 0.7) {
                    $correct++;
                }
            }

            $success_rate = $total > 0 ? $correct / $total : 0;
            $avg_fraction = $total > 0 ? $total_fraction / $total : 0;

            // Identify as weak area if success rate < 60%
            if ($success_rate < 0.6 || $avg_fraction < 0.5) {
                $weak_areas[] = array(
                    'type' => $type,
                    'type_label' => self::get_type_label($type),
                    'success_rate' => $success_rate,
                    'avg_score' => $avg_fraction,
                    'attempt_count' => $total,
                    'severity' => self::calculate_severity($success_rate),
                    'problems' => array_slice($problems, 0, 3) // Sample problems
                );
            }
        }

        // Sort by severity (most problematic first)
        usort($weak_areas, function($a, $b) {
            return $b['severity'] - $a['severity'];
        });

        return $weak_areas;
    }

    /**
     * Categorize problems by type/topic
     *
     * @param array $attempts Problem attempts
     * @return array Problems grouped by type
     */
    private static function categorize_problems($attempts) {
        $categories = array(
            'basic_probability' => array(),
            'conditional_probability' => array(),
            'combination' => array(),
            'permutation' => array(),
            'compound_events' => array(),
            'other' => array()
        );

        foreach ($attempts as $attempt) {
            $text = $attempt->questiontext . ' ' . $attempt->name;
            $type = self::detect_problem_type($text);
            $categories[$type][] = $attempt;
        }

        // Remove empty categories
        return array_filter($categories, function($problems) {
            return !empty($problems);
        });
    }

    /**
     * Detect problem type from question text
     *
     * @param string $text Question text
     * @return string Problem type
     */
    private static function detect_problem_type($text) {
        $text = strtolower($text);

        // Conditional probability
        if (preg_match('/(조건부|conditional|given|if.*then)/i', $text)) {
            return 'conditional_probability';
        }

        // Combination
        if (preg_match('/(조합|combination|choose|select.*순서.*상관없|C\(|nCr)/i', $text)) {
            return 'combination';
        }

        // Permutation
        if (preg_match('/(순열|permutation|arrange|순서|order|P\(|nPr)/i', $text)) {
            return 'permutation';
        }

        // Compound events
        if (preg_match('/(그리고|또는|and.*and|or.*or|복합|compound|여러|multiple)/i', $text)) {
            return 'compound_events';
        }

        // Basic probability
        if (preg_match('/(확률|probability|chance|주사위|동전|dice|coin|카드|card)/i', $text)) {
            return 'basic_probability';
        }

        return 'other';
    }

    /**
     * Get human-readable label for problem type
     *
     * @param string $type Problem type
     * @return string Label
     */
    private static function get_type_label($type) {
        $labels = array(
            'basic_probability' => '기본 확률 (Basic Probability)',
            'conditional_probability' => '조건부 확률 (Conditional Probability)',
            'combination' => '조합 (Combination)',
            'permutation' => '순열 (Permutation)',
            'compound_events' => '복합 사건 (Compound Events)',
            'other' => '기타 (Other)'
        );

        return isset($labels[$type]) ? $labels[$type] : $type;
    }

    /**
     * Calculate severity level of weak area
     *
     * @param float $success_rate Success rate (0-1)
     * @return int Severity (0-100)
     */
    private static function calculate_severity($success_rate) {
        return intval((1 - $success_rate) * 100);
    }

    /**
     * Recommend specific problems to practice
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @param array $weak_areas Weak areas
     * @return array Recommended problems
     */
    private static function recommend_problems($userid, $courseid, $weak_areas) {
        global $DB;

        $recommended = array();

        if (empty($weak_areas)) {
            return $recommended;
        }

        // Focus on top 3 weak areas
        $focus_areas = array_slice($weak_areas, 0, 3);

        foreach ($focus_areas as $area) {
            $type = $area['type'];

            // Find problems in this category that user hasn't attempted or failed
            $sql = "SELECT DISTINCT q.id, q.name, q.questiontext, q.qtype
                    FROM {question} q
                    JOIN {quiz_slots} qs ON qs.questionid = q.id
                    JOIN {quiz} qz ON qz.id = qs.quizid
                    WHERE qz.course = :courseid
                    AND q.id NOT IN (
                        SELECT questionid FROM {question_attempts}
                        WHERE userid = :userid AND fraction >= 0.7
                    )
                    ORDER BY RAND()
                    LIMIT 5";

            $problems = $DB->get_records_sql($sql, array(
                'courseid' => $courseid,
                'userid' => $userid
            ));

            foreach ($problems as $problem) {
                if (self::detect_problem_type($problem->questiontext . ' ' . $problem->name) === $type) {
                    $recommended[] = array(
                        'id' => $problem->id,
                        'name' => $problem->name,
                        'type' => $type,
                        'type_label' => $area['type_label'],
                        'reason' => '이 영역에서 더 많은 연습이 필요합니다',
                        'difficulty' => self::estimate_difficulty($problem)
                    );

                    if (count($recommended) >= 10) {
                        break 2; // Stop after 10 recommendations
                    }
                }
            }
        }

        return $recommended;
    }

    /**
     * Estimate problem difficulty
     *
     * @param object $problem Problem object
     * @return string Difficulty level
     */
    private static function estimate_difficulty($problem) {
        // This is a simple heuristic - could be improved with ML
        $text_length = strlen(strip_tags($problem->questiontext));

        if ($text_length < 100) {
            return 'easy';
        } else if ($text_length < 200) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    /**
     * Suggest learning resources
     *
     * @param array $weak_areas Weak areas
     * @param int $courseid Course ID
     * @return array Learning resources
     */
    private static function suggest_resources($weak_areas, $courseid) {
        $resources = array();

        foreach ($weak_areas as $area) {
            $type = $area['type'];

            $resources[] = array(
                'type' => $type,
                'type_label' => $area['type_label'],
                'resources' => self::get_resources_for_type($type),
                'priority' => $area['severity']
            );
        }

        return $resources;
    }

    /**
     * Get recommended resources for problem type
     *
     * @param string $type Problem type
     * @return array Resources
     */
    private static function get_resources_for_type($type) {
        $resource_map = array(
            'basic_probability' => array(
                array('title' => '확률의 기본 개념', 'type' => 'video', 'url' => '#'),
                array('title' => '확률 계산 연습', 'type' => 'practice', 'url' => '#'),
                array('title' => '동전과 주사위 확률', 'type' => 'tutorial', 'url' => '#')
            ),
            'conditional_probability' => array(
                array('title' => '조건부 확률 이해하기', 'type' => 'video', 'url' => '#'),
                array('title' => '베이즈 정리', 'type' => 'tutorial', 'url' => '#'),
                array('title' => '조건부 확률 문제 풀이', 'type' => 'practice', 'url' => '#')
            ),
            'combination' => array(
                array('title' => '조합의 개념', 'type' => 'video', 'url' => '#'),
                array('title' => 'nCr 계산법', 'type' => 'tutorial', 'url' => '#'),
                array('title' => '조합 문제 연습', 'type' => 'practice', 'url' => '#')
            ),
            'permutation' => array(
                array('title' => '순열의 개념', 'type' => 'video', 'url' => '#'),
                array('title' => 'nPr 계산법', 'type' => 'tutorial', 'url' => '#'),
                array('title' => '순열 vs 조합', 'type' => 'comparison', 'url' => '#')
            ),
            'compound_events' => array(
                array('title' => '복합 사건의 확률', 'type' => 'video', 'url' => '#'),
                array('title' => '독립 사건과 종속 사건', 'type' => 'tutorial', 'url' => '#')
            )
        );

        return isset($resource_map[$type]) ? $resource_map[$type] : array();
    }

    /**
     * Generate personalized study path
     *
     * @param int $userid User ID
     * @param array $weak_areas Weak areas
     * @return array Study path steps
     */
    private static function generate_study_path($userid, $weak_areas) {
        $path = array();

        if (empty($weak_areas)) {
            $path[] = array(
                'step' => 1,
                'title' => '계속 좋은 성과를 유지하세요!',
                'description' => '새로운 도전을 시도해보세요.',
                'duration' => '1주',
                'status' => 'current'
            );
            return $path;
        }

        // Step 1: Review basics of weakest area
        $weakest = $weak_areas[0];
        $path[] = array(
            'step' => 1,
            'title' => $weakest['type_label'] . ' 기초 복습',
            'description' => '기본 개념을 다시 학습하고 쉬운 문제부터 시작하세요.',
            'duration' => '3-5일',
            'status' => 'current',
            'resources' => 3
        );

        // Step 2: Practice problems
        $path[] = array(
            'step' => 2,
            'title' => '연습 문제 풀이',
            'description' => $weakest['type_label'] . ' 문제 10개 이상 풀어보기',
            'duration' => '1주',
            'status' => 'locked',
            'target_problems' => 10
        );

        // Step 3: Move to next weak area
        if (count($weak_areas) > 1) {
            $next_weak = $weak_areas[1];
            $path[] = array(
                'step' => 3,
                'title' => $next_weak['type_label'] . ' 학습',
                'description' => '다음 약점 영역으로 이동',
                'duration' => '1주',
                'status' => 'locked'
            );
        }

        // Step 4: Comprehensive review
        $path[] = array(
            'step' => count($path) + 1,
            'title' => '종합 복습',
            'description' => '모든 영역을 포괄하는 문제 풀이',
            'duration' => '1주',
            'status' => 'locked'
        );

        return $path;
    }

    /**
     * Calculate priority level for recommendations
     *
     * @param array $weak_areas Weak areas
     * @param array $mood_data Mood data
     * @return string Priority level
     */
    private static function calculate_priority($weak_areas, $mood_data) {
        if (empty($weak_areas)) {
            return 'low';
        }

        $avg_severity = 0;
        foreach ($weak_areas as $area) {
            $avg_severity += $area['severity'];
        }
        $avg_severity /= count($weak_areas);

        if ($avg_severity > 70) {
            return 'urgent';
        } else if ($avg_severity > 50) {
            return 'high';
        } else if ($avg_severity > 30) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Generate motivational message
     *
     * @param object $recommendations Recommendation data
     * @return string Message
     */
    private static function generate_message($recommendations) {
        $priority = $recommendations->priority;

        $messages = array(
            'urgent' => '지금 바로 복습이 필요해요! 💪 기초부터 다시 시작해봅시다.',
            'high' => '조금 더 노력하면 돼요! 📚 추천 학습 자료를 확인해보세요.',
            'medium' => '좋은 진행입니다! 🎯 약점 영역을 보완하면 더 좋아질 거예요.',
            'low' => '훌륭해요! 🌟 새로운 도전 문제를 시도해보세요.'
        );

        return isset($messages[$priority]) ? $messages[$priority] : $messages['medium'];
    }

    /**
     * Store recommendations in database
     *
     * @param object $recommendations Recommendation data
     */
    private static function store_recommendations($recommendations) {
        global $DB;

        $record = new \stdClass();
        $record->userid = $recommendations->userid;
        $record->courseid = $recommendations->courseid;
        $record->priority = $recommendations->priority;
        $record->weak_areas = json_encode($recommendations->weak_areas);
        $record->recommended_problems = json_encode($recommendations->problems);
        $record->study_path = json_encode($recommendations->study_path);
        $record->message = $recommendations->message;
        $record->timecreated = time();
        $record->timemodified = time();

        // Check if recommendation already exists
        $existing = $DB->get_record('block_chancemood_recommend', array(
            'userid' => $record->userid,
            'courseid' => $record->courseid
        ));

        if ($existing) {
            $record->id = $existing->id;
            $DB->update_record('block_chancemood_recommend', $record);
        } else {
            $DB->insert_record('block_chancemood_recommend', $record);
        }
    }

    /**
     * Get stored recommendations for user
     *
     * @param int $userid User ID
     * @param int $courseid Course ID
     * @return object|false Recommendation data or false
     */
    public static function get_recommendations($userid, $courseid) {
        global $DB;

        $record = $DB->get_record('block_chancemood_recommend', array(
            'userid' => $userid,
            'courseid' => $courseid
        ));

        if (!$record) {
            return false;
        }

        // Decode JSON fields
        $record->weak_areas = json_decode($record->weak_areas, true);
        $record->recommended_problems = json_decode($record->recommended_problems, true);
        $record->study_path = json_decode($record->study_path, true);

        return $record;
    }

    /**
     * Get class-wide recommendations for teacher dashboard
     *
     * @param int $courseid Course ID
     * @return array Class recommendations
     */
    public static function get_class_recommendations($courseid) {
        global $DB;

        $recommendations = array();

        // Get all students in course
        $context = \context_course::instance($courseid);
        $students = get_enrolled_users($context, 'mod/quiz:attempt');

        $weak_area_summary = array();
        $priority_counts = array('urgent' => 0, 'high' => 0, 'medium' => 0, 'low' => 0);

        foreach ($students as $student) {
            $student_rec = self::get_recommendations($student->id, $courseid);

            if ($student_rec) {
                $priority_counts[$student_rec->priority]++;

                foreach ($student_rec->weak_areas as $area) {
                    $type = $area['type'];
                    if (!isset($weak_area_summary[$type])) {
                        $weak_area_summary[$type] = array(
                            'type' => $type,
                            'type_label' => $area['type_label'],
                            'student_count' => 0,
                            'avg_severity' => 0,
                            'total_severity' => 0
                        );
                    }
                    $weak_area_summary[$type]['student_count']++;
                    $weak_area_summary[$type]['total_severity'] += $area['severity'];
                }
            }
        }

        // Calculate averages
        foreach ($weak_area_summary as $type => $data) {
            $weak_area_summary[$type]['avg_severity'] =
                $data['total_severity'] / $data['student_count'];
        }

        // Sort by student count (most common problems first)
        usort($weak_area_summary, function($a, $b) {
            return $b['student_count'] - $a['student_count'];
        });

        $recommendations['total_students'] = count($students);
        $recommendations['weak_area_summary'] = $weak_area_summary;
        $recommendations['priority_distribution'] = $priority_counts;
        $recommendations['action_items'] = self::generate_teacher_actions($weak_area_summary);

        return $recommendations;
    }

    /**
     * Generate action items for teachers
     *
     * @param array $weak_area_summary Weak area summary
     * @return array Action items
     */
    private static function generate_teacher_actions($weak_area_summary) {
        $actions = array();

        foreach (array_slice($weak_area_summary, 0, 3) as $index => $area) {
            $actions[] = array(
                'priority' => $index + 1,
                'action' => $area['type_label'] . ' 집중 수업 진행',
                'reason' => $area['student_count'] . '명의 학생이 어려움을 겪고 있습니다',
                'type' => $area['type']
            );
        }

        return $actions;
    }
}
