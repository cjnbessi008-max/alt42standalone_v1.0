<?php
/**
 * Moodle API Integration Class
 * Connects to Moodle 3.7 via Web Services
 */

class MoodleAPI {
    private $baseUrl;
    private $token;

    public function __construct() {
        $this->baseUrl = MOODLE_URL;
        $this->token = MOODLE_TOKEN;
    }

    /**
     * Make a request to Moodle Web Services
     */
    private function request($wsfunction, $params = []) {
        $url = $this->baseUrl . '/webservice/rest/server.php';

        $requestParams = array_merge([
            'wstoken' => $this->token,
            'wsfunction' => $wsfunction,
            'moodlewsrestformat' => 'json'
        ], $params);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($requestParams));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // For development only

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log("Moodle API error: HTTP $httpCode");
            return false;
        }

        $data = json_decode($response, true);

        if (isset($data['exception'])) {
            error_log("Moodle API exception: " . $data['message']);
            return false;
        }

        return $data;
    }

    /**
     * Get all courses
     */
    public function getCourses() {
        return $this->request('core_course_get_courses');
    }

    /**
     * Get course by ID
     */
    public function getCourse($courseId) {
        $result = $this->request('core_course_get_courses', [
            'options[ids][0]' => $courseId
        ]);
        return $result ? $result[0] : null;
    }

    /**
     * Get quiz questions/problems from a course
     */
    public function getProblems($courseId) {
        // Get course modules (quizzes)
        $modules = $this->request('core_course_get_contents', [
            'courseid' => $courseId
        ]);

        if (!$modules) {
            return [];
        }

        $problems = [];

        foreach ($modules as $section) {
            if (!isset($section['modules'])) continue;

            foreach ($section['modules'] as $module) {
                // Look for quiz modules
                if ($module['modname'] === 'quiz') {
                    $quizProblems = $this->getQuizQuestions($module['instance']);
                    if ($quizProblems) {
                        $problems = array_merge($problems, $quizProblems);
                    }
                }

                // Also check for question bank questions
                if ($module['modname'] === 'question') {
                    $problems[] = [
                        'id' => $module['id'],
                        'name' => $module['name'],
                        'type' => 'question',
                        'course_id' => $courseId,
                        'difficulty' => $this->estimateDifficulty($module),
                        'score' => 0,
                        'x' => null, // Will be calculated for constellation
                        'y' => null  // Will be calculated for constellation
                    ];
                }
            }
        }

        // Transform problems for constellation visualization
        return $this->transformForConstellation($problems);
    }

    /**
     * Get questions from a specific quiz
     */
    private function getQuizQuestions($quizId) {
        // Note: Moodle 3.7 might need mod_quiz_get_quiz_by_courses or custom web service
        $result = $this->request('mod_quiz_get_quizzes_by_courses', [
            'courseids[0]' => $quizId
        ]);

        if (!$result || !isset($result['quizzes'])) {
            return [];
        }

        $questions = [];
        foreach ($result['quizzes'] as $quiz) {
            // Get quiz attempts to estimate difficulty
            $questions[] = [
                'id' => $quiz['id'],
                'name' => $quiz['name'],
                'type' => 'quiz',
                'course_id' => $quiz['course'],
                'time_limit' => $quiz['timelimit'] ?? 0,
                'grade' => $quiz['grade'] ?? 0,
                'difficulty' => $this->estimateDifficulty($quiz),
                'score' => 0,
                'x' => null,
                'y' => null
            ];
        }

        return $questions;
    }

    /**
     * Estimate difficulty based on quiz/question data
     */
    private function estimateDifficulty($data) {
        // Simple heuristic: use grade or time limit
        if (isset($data['grade']) && $data['grade'] > 0) {
            return min(10, $data['grade'] / 10);
        }
        if (isset($data['timelimit']) && $data['timelimit'] > 0) {
            return min(10, $data['timelimit'] / 600); // 600 seconds = difficulty 10
        }
        return 5; // Default medium difficulty
    }

    /**
     * Transform problems for constellation visualization
     * Calculate x, y coordinates based on difficulty and score
     */
    private function transformForConstellation($problems) {
        $transformed = [];
        $count = count($problems);

        if ($count === 0) return [];

        foreach ($problems as $index => $problem) {
            // Generate scatter plot coordinates
            // X-axis: difficulty (0-10)
            // Y-axis: score/performance (0-100)
            $x = $problem['difficulty'] ?? (($index % 10) + rand(-10, 10) / 10);
            $y = $problem['score'] ?? rand(30, 90); // Random initial score

            $transformed[] = array_merge($problem, [
                'x' => $x,
                'y' => $y,
                'constellation_index' => $index,
                'color' => $this->getConstellationColor($x, $y)
            ]);
        }

        return $transformed;
    }

    /**
     * Get color based on position (difficulty vs performance)
     */
    private function getConstellationColor($difficulty, $score) {
        // High difficulty, high score: gold
        if ($difficulty > 7 && $score > 70) return '#FFD700';
        // High difficulty, low score: red
        if ($difficulty > 7 && $score < 50) return '#FF4444';
        // Low difficulty, high score: green
        if ($difficulty < 4 && $score > 70) return '#44FF44';
        // Medium: blue
        return '#4444FF';
    }

    /**
     * Get student grades for a course
     */
    public function getStudentGrades($courseId, $userId) {
        return $this->request('gradereport_user_get_grade_items', [
            'courseid' => $courseId,
            'userid' => $userId
        ]);
    }
}
