<?php
/**
 * API Router
 * Handles all API endpoints
 */

class Router {
    private $db;
    private $moodle;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->moodle = new MoodleService();
    }

    /**
     * Route request to appropriate handler
     */
    public function route($method, $segments) {
        $endpoint = $segments[0] ?? '';

        switch ($endpoint) {
            case 'artworks':
                return $this->handleArtworks($method, $segments);

            case 'problems':
                return $this->handleProblems($method, $segments);

            case 'progress':
                return $this->handleProgress($method, $segments);

            case 'students':
                return $this->handleStudents($method, $segments);

            case 'moodle':
                return $this->handleMoodle($method, $segments);

            case 'health':
                return $this->handleHealth();

            default:
                return $this->notFound();
        }
    }

    /**
     * Handle /artworks endpoints
     */
    private function handleArtworks($method, $segments) {
        if ($method === 'GET') {
            // GET /artworks - Get all artworks
            if (count($segments) === 1) {
                $artworks = $this->db->fetchAll(
                    "SELECT * FROM artworks ORDER BY number ASC"
                );
                return ['success' => true, 'data' => $artworks];
            }

            // GET /artworks/{number} - Get specific artwork
            if (count($segments) === 2) {
                $number = intval($segments[1]);
                $artwork = $this->db->fetchOne(
                    "SELECT * FROM artworks WHERE number = ?",
                    [$number]
                );

                if ($artwork) {
                    return ['success' => true, 'data' => $artwork];
                } else {
                    return $this->notFound("Artwork #$number not found");
                }
            }
        }

        return $this->methodNotAllowed();
    }

    /**
     * Handle /problems endpoints
     */
    private function handleProblems($method, $segments) {
        if ($method === 'GET') {
            // GET /problems - Get all problems
            if (count($segments) === 1) {
                $problems = $this->db->fetchAll(
                    "SELECT p.*, a.title as artwork_title, a.svg_data as artwork_svg
                     FROM problems p
                     LEFT JOIN artworks a ON p.artwork_number = a.number
                     WHERE p.is_active = 1
                     ORDER BY p.id DESC"
                );
                return ['success' => true, 'data' => $problems];
            }

            // GET /problems/{id} - Get specific problem
            if (count($segments) === 2) {
                $id = intval($segments[1]);
                $problem = $this->db->fetchOne(
                    "SELECT p.*, a.title as artwork_title, a.svg_data as artwork_svg
                     FROM problems p
                     LEFT JOIN artworks a ON p.artwork_number = a.number
                     WHERE p.id = ?",
                    [$id]
                );

                if ($problem) {
                    return ['success' => true, 'data' => $problem];
                } else {
                    return $this->notFound("Problem #$id not found");
                }
            }
        }

        if ($method === 'POST' && count($segments) === 1) {
            // POST /problems - Create new problem
            $input = json_decode(file_get_contents('php://input'), true);

            $sql = "INSERT INTO problems (
                        moodle_question_id, course_id, quiz_id, question_text,
                        question_type, correct_answer, artwork_number, difficulty, points
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $id = $this->db->insert($sql, [
                $input['moodle_question_id'] ?? 0,
                $input['course_id'] ?? null,
                $input['quiz_id'] ?? null,
                $input['question_text'] ?? '',
                $input['question_type'] ?? 'multiple_choice',
                $input['correct_answer'] ?? '',
                $input['artwork_number'] ?? null,
                $input['difficulty'] ?? 1,
                $input['points'] ?? 1.0
            ]);

            return ['success' => true, 'data' => ['id' => $id]];
        }

        return $this->methodNotAllowed();
    }

    /**
     * Handle /progress endpoints
     */
    private function handleProgress($method, $segments) {
        if ($method === 'GET') {
            // GET /progress/{student_id} - Get student progress
            if (count($segments) === 2) {
                $studentId = intval($segments[1]);

                $progress = $this->db->fetchAll(
                    "SELECT sp.*, p.question_text, a.title as artwork_title
                     FROM student_progress sp
                     JOIN problems p ON sp.problem_id = p.id
                     JOIN artworks a ON sp.artwork_number = a.number
                     WHERE sp.student_id = ?
                     ORDER BY sp.attempted_at DESC",
                    [$studentId]
                );

                return ['success' => true, 'data' => $progress];
            }
        }

        if ($method === 'POST' && count($segments) === 1) {
            // POST /progress - Submit student answer
            $input = json_decode(file_get_contents('php://input'), true);

            $sql = "INSERT INTO student_progress (
                        student_id, problem_id, artwork_number, attempt_number,
                        user_answer, is_correct, time_spent_seconds, score, completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";

            $id = $this->db->insert($sql, [
                $input['student_id'] ?? 0,
                $input['problem_id'] ?? 0,
                $input['artwork_number'] ?? 0,
                $input['attempt_number'] ?? 1,
                $input['user_answer'] ?? '',
                $input['is_correct'] ?? 0,
                $input['time_spent_seconds'] ?? 0,
                $input['score'] ?? 0.0
            ]);

            return ['success' => true, 'data' => ['id' => $id]];
        }

        return $this->methodNotAllowed();
    }

    /**
     * Handle /students endpoints
     */
    private function handleStudents($method, $segments) {
        if ($method === 'GET') {
            // GET /students - Get all students
            if (count($segments) === 1) {
                $students = $this->db->fetchAll(
                    "SELECT * FROM students ORDER BY full_name ASC"
                );
                return ['success' => true, 'data' => $students];
            }

            // GET /students/{id} - Get specific student
            if (count($segments) === 2) {
                $id = intval($segments[1]);
                $student = $this->db->fetchOne(
                    "SELECT * FROM students WHERE id = ?",
                    [$id]
                );

                if ($student) {
                    return ['success' => true, 'data' => $student];
                } else {
                    return $this->notFound("Student #$id not found");
                }
            }
        }

        return $this->methodNotAllowed();
    }

    /**
     * Handle /moodle endpoints
     */
    private function handleMoodle($method, $segments) {
        $action = $segments[1] ?? '';

        if ($method === 'POST' && $action === 'sync') {
            // POST /moodle/sync - Sync data from Moodle
            $input = json_decode(file_get_contents('php://input'), true);
            $type = $input['type'] ?? 'students';
            $courseId = $input['course_id'] ?? null;

            if (!$courseId) {
                return [
                    'status' => 400,
                    'data' => ['success' => false, 'error' => 'course_id is required']
                ];
            }

            if ($type === 'students') {
                $result = $this->moodle->syncStudents($courseId);
                return ['success' => $result['success'], 'data' => $result];
            }

            if ($type === 'problems') {
                $quizId = $input['quiz_id'] ?? null;
                if (!$quizId) {
                    return [
                        'status' => 400,
                        'data' => ['success' => false, 'error' => 'quiz_id is required']
                    ];
                }
                $result = $this->moodle->syncProblems($quizId, $courseId);
                return ['success' => $result['success'], 'data' => $result];
            }

            return [
                'status' => 400,
                'data' => ['success' => false, 'error' => 'Invalid sync type']
            ];
        }

        if ($method === 'GET' && $action === 'status') {
            // GET /moodle/status - Check Moodle connection
            $logs = $this->db->fetchAll(
                "SELECT * FROM moodle_sync_log ORDER BY sync_started_at DESC LIMIT 10"
            );
            return ['success' => true, 'data' => ['logs' => $logs]];
        }

        return $this->methodNotAllowed();
    }

    /**
     * Handle /health endpoint
     */
    private function handleHealth() {
        return [
            'success' => true,
            'data' => [
                'status' => 'healthy',
                'app' => APP_NAME,
                'version' => APP_VERSION,
                'environment' => APP_ENV,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ];
    }

    /**
     * 404 Not Found
     */
    private function notFound($message = 'Endpoint not found') {
        return [
            'status' => 404,
            'data' => ['success' => false, 'error' => $message]
        ];
    }

    /**
     * 405 Method Not Allowed
     */
    private function methodNotAllowed() {
        return [
            'status' => 405,
            'data' => ['success' => false, 'error' => 'Method not allowed']
        ];
    }
}
