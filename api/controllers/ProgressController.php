<?php
/**
 * Progress Controller
 * Manages student progress tracking
 */

require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class ProgressController
{
    private $pdo;

    public function __construct()
    {
        $this->pdo = require __DIR__ . '/../../config/database.php';
    }

    public function handleRequest($method, $action, $id)
    {
        Auth::require();

        if ($method !== 'GET') {
            Response::error('Method not allowed', 405);
        }

        switch ($action) {
            case '':
            case 'summary':
                $this->getSummary();
                break;

            case 'game':
                $this->getGameProgress($id);
                break;

            default:
                Response::error('Action not found', 404);
        }
    }

    /**
     * Get overall progress summary
     * GET /api/progress/summary
     */
    private function getSummary()
    {
        $studentId = Auth::studentId();

        // Overall stats
        $stmt = $this->pdo->prepare("
            SELECT
                COUNT(DISTINCT card_id) as games_attempted,
                SUM(CASE WHEN stage_5_completed THEN 1 ELSE 0 END) as games_completed,
                SUM(total_points_earned) as total_points,
                SUM(total_time_spent_seconds) as total_time_spent
            FROM student_progress
            WHERE student_id = ?
        ");

        $stmt->execute([$studentId]);
        $stats = $stmt->fetch();

        // Per-game progress
        $stmt = $this->pdo->prepare("
            SELECT
                cc.card_id,
                cc.concept_name,
                cc.spirit_name,
                sp.current_stage,
                sp.stage_1_completed,
                sp.stage_2_completed,
                sp.stage_3_completed,
                sp.stage_4_completed,
                sp.stage_5_completed,
                sp.total_points_earned,
                sp.last_played_at,
                sc.current_level as card_level
            FROM student_progress sp
            JOIN concept_cards cc ON sp.card_id = cc.card_id
            LEFT JOIN student_cards sc ON sp.student_id = sc.student_id AND sp.card_id = sc.card_id
            WHERE sp.student_id = ?
            ORDER BY sp.last_played_at DESC
        ");

        $stmt->execute([$studentId]);
        $gameProgress = $stmt->fetchAll();

        Response::success([
            'stats' => $stats,
            'game_progress' => $gameProgress
        ]);
    }

    /**
     * Get progress for a specific game
     * GET /api/progress/game/{card_id}
     */
    private function getGameProgress($cardId)
    {
        $studentId = Auth::studentId();

        if (empty($cardId)) {
            Response::validationError(['card_id is required']);
        }

        $stmt = $this->pdo->prepare("
            SELECT
                sp.*,
                cc.concept_name,
                cc.spirit_name,
                cc.spirit_alias
            FROM student_progress sp
            JOIN concept_cards cc ON sp.card_id = cc.card_id
            WHERE sp.student_id = ? AND sp.card_id = ?
        ");

        $stmt->execute([$studentId, $cardId]);
        $progress = $stmt->fetch();

        if (!$progress) {
            Response::notFound('Progress not found for this game');
        }

        Response::success($progress);
    }
}
