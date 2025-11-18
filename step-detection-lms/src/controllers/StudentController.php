<?php
/**
 * Student Controller
 * 학생 관리 API (교사용)
 */

class StudentController {
    private $db;
    private $solutionModel;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->solutionModel = new Solution();
    }

    /**
     * GET /api/v1/students
     * Get all students
     */
    public function index() {
        $sql = "SELECT s.*, stp.overall_trust_score, stp.total_solutions, stp.suspicious_solutions
                FROM students s
                LEFT JOIN student_trust_profiles stp ON s.id = stp.student_id
                WHERE s.is_active = 1
                ORDER BY s.full_name";

        $stmt = $this->db->query($sql);
        $students = $stmt->fetchAll();

        sendSuccess($students);
    }

    /**
     * GET /api/v1/students/{id}
     * Get student details with recent activity
     */
    public function show($id) {
        $sql = "SELECT s.*, stp.*
                FROM students s
                LEFT JOIN student_trust_profiles stp ON s.id = stp.student_id
                WHERE s.id = :id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $student = $stmt->fetch();

        if (!$student) {
            sendError('Student not found', 404);
        }

        // Get recent solutions
        $student['recent_solutions'] = $this->solutionModel->getByStudent($id, 20);

        sendSuccess($student);
    }

    /**
     * GET /api/v1/students/{id}/trust-profile
     * Get detailed trust profile
     */
    public function trustProfile($id) {
        $sql = "SELECT * FROM student_trust_profiles WHERE student_id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $profile = $stmt->fetch();

        if (!$profile) {
            sendError('Trust profile not found', 404);
        }

        // Get detection breakdown by type
        $sql = "SELECT detection_type, COUNT(*) as count, AVG(confidence_score) as avg_confidence
                FROM skip_detections sd
                JOIN student_solutions ss ON sd.solution_id = ss.id
                WHERE ss.student_id = :id
                GROUP BY detection_type";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $profile['detection_breakdown'] = $stmt->fetchAll();

        sendSuccess($profile);
    }
}
